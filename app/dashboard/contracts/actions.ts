"use server"

import { revalidatePath } from "next/cache"
import { readFile } from "node:fs/promises"
import path from "node:path"
import crypto from "node:crypto"
import { createClient } from "@/lib/supabase/server"
import { requireUser } from "@/lib/auth"
import { buildContractPdf } from "@/lib/pdf/build-pdf"
import type { ContractFields } from "@/lib/pdf/contract-text"
import type { Contract } from "@/lib/types"

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

export interface NewContractInput {
  company_name: string
  vat_number: string
  contact_first_name: string
  contact_last_name: string
  shop_name: string
  street: string
  house_number: string
  city: string
  post_code: string
  landline_number?: string | null
  mobile_number: string
  email: string
  branch?: string | null
  zone?: string | null
}

export async function createContractAction(
  input: NewContractInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser()
    const supabase = await createClient()

    const branch =
      input.branch ?? user.branch ?? (user.role === "RSM" ? (user.branches?.[0] ?? null) : null)
    const zone = input.zone ?? user.zone

    const { data, error } = await supabase
      .from("contracts")
      .insert({
        ...input,
        branch,
        zone,
        created_by: user.id,
        status: "GENERATED",
      })
      .select("id")
      .single()

    if (error) return { ok: false, error: error.message }

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/contracts")
    return { ok: true, data: { id: data.id } }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" }
  }
}

export async function updateContractAction(
  input: { id: string } & NewContractInput,
): Promise<ActionResult> {
  try {
    const user = await requireUser()
    const supabase = await createClient()

    const { data: existingRow, error: existingErr } = await supabase
      .from("contracts")
      .select("id, status, branch, zone")
      .eq("id", input.id)
      .single()
    if (existingErr || !existingRow) {
      return { ok: false, error: existingErr?.message || "Contract not found" }
    }
    const existing = existingRow as Pick<Contract, "id" | "status" | "branch" | "zone">
    if (existing.status === "SIGNED") {
      return { ok: false, error: "Signed contracts cannot be edited." }
    }

    const nextBranch =
      user.role === "ADMIN" || user.role === "RSM"
        ? (input.branch ?? existing.branch)
        : existing.branch
    const nextZone =
      user.role === "ADMIN" || user.role === "ASM" || user.role === "RSM"
        ? (input.zone ?? existing.zone)
        : existing.zone

    const { error: updErr } = await supabase
      .from("contracts")
      .update({
        company_name: input.company_name,
        vat_number: input.vat_number,
        contact_first_name: input.contact_first_name,
        contact_last_name: input.contact_last_name,
        shop_name: input.shop_name,
        street: input.street,
        house_number: input.house_number,
        city: input.city,
        post_code: input.post_code,
        landline_number: input.landline_number ?? null,
        mobile_number: input.mobile_number,
        email: input.email,
        branch: nextBranch ?? null,
        zone: nextZone ?? null,
        otp_hash: null,
        otp_salt: null,
        otp_sent_at: null,
        otp_expires_at: null,
        otp_verified_at: null,
        otp_attempts: 0,
      })
      .eq("id", input.id)

    if (updErr) return { ok: false, error: updErr.message }

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/contracts")
    revalidatePath(`/dashboard/contracts/${input.id}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" }
  }
}

export async function deleteContractAction(
  id: string,
): Promise<ActionResult> {
  try {
    await requireUser()
    const supabase = await createClient()
    const { error } = await supabase.from("contracts").delete().eq("id", id)
    if (error) return { ok: false, error: error.message }
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/contracts")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" }
  }
}

/**
 * Upload a signature dataURL to Supabase Storage.
 * Accepts "data:image/png;base64,...." and returns the storage path.
 */
async function uploadSignature(
  contractId: string,
  who: "retailer" | "staff",
  dataUrl: string,
) {
  const supabase = await createClient()
  const base64 = dataUrl.split(",")[1] ?? ""
  const bytes = Buffer.from(base64, "base64")

  const filePath = `${contractId}/${who}-${Date.now()}.png`
  const { error } = await supabase.storage
    .from("signatures")
    .upload(filePath, bytes, {
      contentType: "image/png",
      upsert: true,
    })
  if (error) throw new Error(error.message)
  return filePath
}

async function downloadFromStorage(
  bucket: string,
  filePath: string,
): Promise<Uint8Array> {
  const supabase = await createClient()
  const { data, error } = await supabase.storage.from(bucket).download(filePath)
  if (error || !data) throw new Error(error?.message || "Failed to download")
  return new Uint8Array(await data.arrayBuffer())
}

/**
 * Persist retailer + staff signatures, render the final PDF and upload it.
 * Marks the contract as SIGNED.
 */
export async function finalizeContractAction(input: {
  id: string
  retailerSignature: string // dataURL
  staffSignature: string // dataURL
}): Promise<ActionResult<{ pdfPath: string }>> {
  try {
    const staffUser = await requireUser()
    const supabase = await createClient()

    const { data: contractRow, error: contractErr } = await supabase
      .from("contracts")
      .select("*")
      .eq("id", input.id)
      .single()

    if (contractErr || !contractRow) {
      return { ok: false, error: contractErr?.message || "Contract not found" }
    }
    const contract = contractRow as Contract
    if (!contract.otp_verified_at) {
      return { ok: false, error: "OTP verification is required before finalizing." }
    }

    // 1. Upload signatures
    const retailerPath = await uploadSignature(
      input.id,
      "retailer",
      input.retailerSignature,
    )
    const staffPath = await uploadSignature(
      input.id,
      "staff",
      input.staffSignature,
    )

    // 2. Build PDF
    const retailerPng = Buffer.from(
      input.retailerSignature.split(",")[1] ?? "",
      "base64",
    )
    const staffPng = Buffer.from(input.staffSignature.split(",")[1] ?? "", "base64")

    const loadPng = async (name: string): Promise<Uint8Array | null> => {
      try {
        const buf = await readFile(path.join(process.cwd(), "public", name))
        return new Uint8Array(buf)
      } catch {
        return null
      }
    }
    const [usLogoBytes, lycaLogoBytes] = await Promise.all([
      loadPng("uslogo.png"),
      loadPng("lyca-logo.png"),
    ])

    const fullName = `${contract.contact_first_name} ${contract.contact_last_name}`.trim()
    const fields: ContractFields = {
      companyName: contract.company_name,
      vatNumber: contract.vat_number,
      address: `${contract.street}, ${contract.house_number}, ${contract.post_code} ${contract.city}`,
      mobileNumber: contract.mobile_number,
      landlineNumber: contract.landline_number ?? "",
      contactPerson: fullName,
      surname: contract.contact_last_name,
      firstName: contract.contact_first_name,
      shopName: contract.shop_name,
      shopAddress: `${contract.street} ${contract.house_number}, ${contract.post_code} ${contract.city}`,
      street: contract.street,
      houseNumber: contract.house_number,
      city: contract.city,
      postCode: contract.post_code,
      email: contract.email,
      date: new Date().toLocaleDateString("it-IT"),
    }

    const pdfBytes = await buildContractPdf({
      fields,
      retailerSignaturePng: new Uint8Array(retailerPng),
      staffSignaturePng: new Uint8Array(staffPng),
      usLogoPng: usLogoBytes,
      lycaLogoPng: lycaLogoBytes,
      staffSignerName: staffUser.full_name,
      otpProof: {
        retailerName: fullName,
        email: contract.email,
        verifiedAtIso: contract.otp_verified_at,
      },
    })

    const pdfPath = `${input.id}/contract-${Date.now()}.pdf`
    const { error: pdfErr } = await supabase.storage
      .from("contracts")
      .upload(pdfPath, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      })
    if (pdfErr) return { ok: false, error: pdfErr.message }

    // 3. Update contract
    const { error: updateErr } = await supabase
      .from("contracts")
      .update({
        retailer_signature_path: retailerPath,
        staff_signature_path: staffPath,
        pdf_path: pdfPath,
        status: "SIGNED",
        signed_at: new Date().toISOString(),
      })
      .eq("id", input.id)

    if (updateErr) return { ok: false, error: updateErr.message }

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/contracts")
    revalidatePath(`/dashboard/contracts/${input.id}`)

    return { ok: true, data: { pdfPath } }
  } catch (e) {
    console.error("Finalize Error:", e)
    return { 
      ok: false, 
      error: e instanceof Error ? e.message : "An unexpected error occurred during finalization" 
    }
  }
}

function hashOtp(otp: string, salt: string) {
  return crypto.createHash("sha256").update(`${salt}:${otp}`).digest("hex")
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function renderOtpDigitsHtml(otp: string) {
  const digits = otp.replaceAll(/\D/g, "").slice(0, 6).padStart(6, "0").split("")
  const cells = digits.map((d, i) => {
    if (i === 3) return `<td class="otp-sep-cell">·</td><td class="otp-cell">${d}</td>`
    return `<td class="otp-cell">${d}</td>`
  })

  return `<table role="presentation" class="otp-table" cellspacing="0" cellpadding="0" border="0" align="center"><tr>${cells.join("")}</tr></table>`
}

async function buildContractOtpEmailHtml(input: {
  contactFirstName: string
  otp: string
}) {
  try {
    const templatePath = path.join(
      process.cwd(),
      "public",
      "verifica OTP per la firma del contratto.html",
    )
    const raw = await readFile(templatePath, "utf8")

    const safeName = escapeHtml(input.contactFirstName || "Retailer")
    const safeOtp = input.otp.replaceAll(/\D/g, "").slice(0, 6).padStart(6, "0")

    const withName = raw.replaceAll("[Nome Retailer]", safeName)

    const withDigits = withName.replace(
      /<div class="otp-digits">[\s\S]*?<\/div>/,
      `<div class="otp-digits">${renderOtpDigitsHtml(safeOtp)}</div>`,
    )

    return withDigits
  } catch {
    const safeName = escapeHtml(input.contactFirstName || "Retailer")
    const safeOtp = input.otp.replaceAll(/\D/g, "").slice(0, 6).padStart(6, "0")
    return `<p>Gentile ${safeName},</p><p>Il tuo codice OTP è: <strong>${safeOtp}</strong></p><p>Il codice scade tra 10 minuti.</p>`
  }
}

export async function requestContractOtpAction(
  id: string,
): Promise<ActionResult<{ sentTo: string }>> {
  try {
    await requireUser()
    const supabase = await createClient()

    const { data: contractRow, error: contractErr } = await supabase
      .from("contracts")
      .select("*")
      .eq("id", id)
      .single()
    if (contractErr || !contractRow) {
      return { ok: false, error: contractErr?.message || "Contract not found" }
    }
    const contract = contractRow as Contract
    if (!contract.email) {
      return { ok: false, error: "Retailer email is missing." }
    }

    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      return {
        ok: false,
        error: "Email is not configured. Set RESEND_API_KEY to enable OTP sending.",
      }
    }

    const otp = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0")
    const salt = crypto.randomBytes(16).toString("hex")
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000)

    const { error: updErr } = await supabase
      .from("contracts")
      .update({
        otp_hash: hashOtp(otp, salt),
        otp_salt: salt,
        otp_sent_at: now.toISOString(),
        otp_expires_at: expiresAt.toISOString(),
        otp_verified_at: null,
        otp_attempts: 0,
      })
      .eq("id", id)
    if (updErr) return { ok: false, error: updErr.message }

    const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev"
    const html = await buildContractOtpEmailHtml({
      contactFirstName: contract.contact_first_name ?? "",
      otp,
    })
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [contract.email],
        subject: "Codice di verifica OTP per la firma del contratto",
        html,
        text: `Gentile ${contract.contact_first_name},\n\nIl tuo codice OTP è: ${otp}\n\nIl codice scade tra 10 minuti.\n\nGrazie,\nUniversal Service 2006 S.R.L`,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      return { ok: false, error: `OTP email failed: ${body}` }
    }

    return { ok: true, data: { sentTo: contract.email } }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" }
  }
}

export async function verifyContractOtpAction(input: {
  id: string
  otp: string
}): Promise<ActionResult<{ verifiedAt: string }>> {
  try {
    await requireUser()
    const supabase = await createClient()

    const { data: contractRow, error: contractErr } = await supabase
      .from("contracts")
      .select("*")
      .eq("id", input.id)
      .single()
    if (contractErr || !contractRow) {
      return { ok: false, error: contractErr?.message || "Contract not found" }
    }
    const contract = contractRow as Contract

    const otpHash = contract.otp_hash ?? null
    const otpSalt = contract.otp_salt ?? null
    const otpExpiresAt = contract.otp_expires_at ?? null
    const attempts = contract.otp_attempts ?? 0

    if (!otpHash || !otpSalt || !otpExpiresAt) {
      return { ok: false, error: "OTP is not requested yet." }
    }
    if (attempts >= 5) {
      return { ok: false, error: "Too many attempts. Request a new OTP." }
    }

    const expires = new Date(otpExpiresAt).getTime()
    if (Number.isNaN(expires) || Date.now() > expires) {
      return { ok: false, error: "OTP expired. Request a new OTP." }
    }

    const code = input.otp.replace(/\s+/g, "")
    if (!/^\d{6}$/.test(code)) {
      return { ok: false, error: "OTP must be 6 digits." }
    }

    const ok = hashOtp(code, otpSalt) === otpHash
    if (!ok) {
      const { error: incErr } = await supabase
        .from("contracts")
        .update({ otp_attempts: attempts + 1 })
        .eq("id", input.id)
      if (incErr) return { ok: false, error: incErr.message }
      return { ok: false, error: "Invalid OTP." }
    }

    const verifiedAt = new Date().toISOString()
    const { error: verErr } = await supabase
      .from("contracts")
      .update({ otp_verified_at: verifiedAt })
      .eq("id", input.id)
    if (verErr) return { ok: false, error: verErr.message }

    return { ok: true, data: { verifiedAt } }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" }
  }
}

/**
 * Create a short-lived signed URL to view / download a contract PDF.
 */
export async function getContractPdfUrlAction(
  id: string,
): Promise<ActionResult<{ url: string }>> {
  try {
    await requireUser()
    const supabase = await createClient()
    const { data: row, error } = await supabase
      .from("contracts")
      .select("pdf_path")
      .eq("id", id)
      .single()
    if (error || !row?.pdf_path) {
      return { ok: false, error: "PDF not available" }
    }
    const { data, error: urlErr } = await supabase.storage
      .from("contracts")
      .createSignedUrl(row.pdf_path, 60 * 60, {
        download: true,
      })
    if (urlErr || !data) {
      return { ok: false, error: urlErr?.message || "Could not create URL" }
    }
    return { ok: true, data: { url: data.signedUrl } }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" }
  }
}

/**
 * Send the signed PDF to retailer + staff email.
 * Uses Resend if RESEND_API_KEY is configured; otherwise returns a message
 * indicating the admin should configure it.
 */
export async function sendContractEmailAction(
  id: string,
): Promise<ActionResult<{ sentTo: string[] }>> {
  try {
    const user = await requireUser()
    const supabase = await createClient()

    const { data: contractRow, error: contractErr } = await supabase
      .from("contracts")
      .select("*")
      .eq("id", id)
      .single()
    if (contractErr || !contractRow) {
      return { ok: false, error: contractErr?.message || "Contract not found" }
    }
    const contract = contractRow as Contract
    if (!contract.pdf_path) {
      return { ok: false, error: "Sign the contract before emailing." }
    }

    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      return {
        ok: false,
        error:
          "Email is not configured. Set RESEND_API_KEY in your environment to enable sending.",
      }
    }

    const escapeHtml = (input: string) =>
      input
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;")

    const formatDate = (iso: string) => {
      const d = new Date(iso)
      if (Number.isNaN(d.getTime())) return ""
      return d.toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    }

    const retailerName = `${contract.contact_first_name ?? ""} ${contract.contact_last_name ?? ""}`.trim()
    const retailerCode = (contract.id ?? "").split("-")[0]?.toUpperCase() ?? ""
    const signDate = contract.signed_at
      ? formatDate(contract.signed_at)
      : new Date().toLocaleDateString("it-IT")

    let html: string | undefined
    try {
      const templatePath = path.join(
        process.cwd(),
        "public",
        "Contratto di Affiliazione.html",
      )
      const raw = await readFile(templatePath, "utf8")
      html = raw
        .replaceAll("{{{RETAILER_NAME}}}", escapeHtml(retailerName || ""))
        .replaceAll("{{{COMPANY_NAME}}}", escapeHtml(contract.company_name || ""))
        .replaceAll("{{{RETAILER_CODE}}}", escapeHtml(retailerCode || ""))
        .replaceAll("{{{SIGN_DATE}}}", escapeHtml(signDate || ""))
        .replaceAll(
          "{{{CONTRACT_TYPE}}}",
          escapeHtml("Contratto di Affiliazione"),
        )
        .replaceAll("{{{VAT_NUMBER}}}", escapeHtml(contract.vat_number || ""))
    } catch {
      html = undefined
    }

    // Download PDF bytes
    const pdfBytes = await downloadFromStorage("contracts", contract.pdf_path)
    const base64 = Buffer.from(pdfBytes).toString("base64")

    const recipients = [contract.email, user.email].filter(Boolean)
    const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev"
    const safeRetailerCode = (retailerCode || "CONTRATTO").replace(
      /[^A-Za-z0-9_-]/g,
      "-",
    )

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: recipients,
        subject: `Contratto firmato — ${contract.company_name}`,
        ...(html ? { html } : {}),
        text: `Gentile ${contract.contact_first_name},\n\nin allegato trovate il contratto firmato relativo al punto vendita "${contract.shop_name}".\n\nGrazie,\nUniversal Service 2006 S.R.L`,
        attachments: [
          {
            filename: `Contratto_Affiliazione_${safeRetailerCode}.pdf`,
            content: base64,
          },
        ],
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      return { ok: false, error: `Email failed: ${body}` }
    }

    await supabase
      .from("contracts")
      .update({ emailed_at: new Date().toISOString() })
      .eq("id", id)

    revalidatePath(`/dashboard/contracts/${id}`)
    return { ok: true, data: { sentTo: recipients } }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" }
  }
}

/**
 * Generate a draft PDF (no signatures) and return it as a base64 string
 * for client-side download.
 */
export async function getDraftContractPdfAction(
  id: string,
): Promise<ActionResult<{ base64: string; filename: string }>> {
  try {
    const user = await requireUser()
    const supabase = await createClient()

    const { data: contractRow, error: contractErr } = await supabase
      .from("contracts")
      .select("*")
      .eq("id", id)
      .single()

    if (contractErr || !contractRow) {
      return { ok: false, error: contractErr?.message || "Contract not found" }
    }
    const contract = contractRow as Contract

    const loadPng = async (name: string): Promise<Uint8Array | null> => {
      try {
        const buf = await readFile(path.join(process.cwd(), "public", name))
        return new Uint8Array(buf)
      } catch {
        return null
      }
    }
    const [usLogoBytes, lycaLogoBytes] = await Promise.all([
      loadPng("uslogo.png"),
      loadPng("lyca-logo.png"),
    ])

    const fullName = `${contract.contact_first_name} ${contract.contact_last_name}`.trim()
    const fields: ContractFields = {
      companyName: contract.company_name,
      vatNumber: contract.vat_number,
      address: `${contract.street}, ${contract.house_number}, ${contract.post_code} ${contract.city}`,
      mobileNumber: contract.mobile_number,
      landlineNumber: contract.landline_number ?? "",
      contactPerson: fullName,
      surname: contract.contact_last_name,
      firstName: contract.contact_first_name,
      shopName: contract.shop_name,
      shopAddress: `${contract.street} ${contract.house_number}, ${contract.post_code} ${contract.city}`,
      street: contract.street,
      houseNumber: contract.house_number,
      city: contract.city,
      postCode: contract.post_code,
      email: contract.email,
      date: new Date().toLocaleDateString("it-IT"),
    }

    const pdfBytes = await buildContractPdf({
      fields,
      retailerSignaturePng: null,
      staffSignaturePng: null,
      usLogoPng: usLogoBytes,
      lycaLogoPng: lycaLogoBytes,
      staffSignerName: user.full_name,
    })

    const base64 = Buffer.from(pdfBytes).toString("base64")
    const filename = `${contract.shop_name} (Unsigned).pdf`

    return { ok: true, data: { base64, filename } }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" }
  }
}
