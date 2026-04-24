"use server"

import { revalidatePath } from "next/cache"
import { readFile } from "node:fs/promises"
import path from "node:path"
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

    const branch = input.branch ?? user.branch
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

    // Download PDF bytes
    const pdfBytes = await downloadFromStorage("contracts", contract.pdf_path)
    const base64 = Buffer.from(pdfBytes).toString("base64")

    const recipients = [contract.email, user.email].filter(Boolean)
    const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev"

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
        text: `Gentile ${contract.contact_first_name},\n\nin allegato trovate il contratto firmato relativo al punto vendita "${contract.shop_name}".\n\nGrazie,\nUniversal Service 2006 S.R.L`,
        attachments: [
          {
            filename: `contratto-${contract.company_name.replace(/\s+/g, "-")}.pdf`,
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
