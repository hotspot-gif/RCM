import crypto from "node:crypto"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Contract } from "@/lib/types"
import { RetailerSignPanel } from "./retailer-sign-panel"

function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex")
}

function RemoteSignShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#EEF1F8]">
      <header className="bg-[#21254F]">
        <div className="mx-auto flex w-full max-w-2xl items-center px-6 py-4">
          <Image
            src="https://eef221ebb9.imgdist.com/pub/bfra/85md611j/2vz/vdh/2hp/uslogo.png"
            alt="Universal Service Logo"
            width={160}
            height={45}
            className="h-9 w-auto object-contain"
            priority
          />
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 p-6">{children}</main>

      <footer className="bg-[#21254F]">
        <div className="mx-auto w-full max-w-2xl px-6 py-4 text-xs leading-relaxed text-white/80">
          <p>Universal Service 2006 S.R.L</p>
          <p>Via Genzano 195, 00179 Roma, Italia</p>
          <p>Tel: 0689971909 · Fax: 06765455 · Email: hotspot.it@lycamobile.com</p>
        </div>
      </footer>
    </div>
  )
}

export default async function RetailerSignPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  try {
    const supabase = createAdminClient()
    const tokenHash = sha256Hex(token)
    const { data, error } = await supabase
      .from("contracts")
      .select(
        "id, company_name, contact_first_name, contact_last_name, status, retailer_signature_path, retailer_ack, retailer_gdpr, otp_verified_at, sign_link_expires_at, sign_link_used_at",
      )
      .eq("sign_link_hash", tokenHash)
      .maybeSingle()

    if (error || !data) {
      return (
        <RemoteSignShell>
          <Card>
            <CardHeader>
              <CardTitle>Link non valido</CardTitle>
            </CardHeader>
            <CardContent>Questo link non è valido oppure è stato revocato.</CardContent>
          </Card>
        </RemoteSignShell>
      )
    }

    const contract = data as Pick<
      Contract,
      | "id"
      | "company_name"
      | "contact_first_name"
      | "contact_last_name"
      | "status"
      | "retailer_signature_path"
      | "retailer_ack"
      | "retailer_gdpr"
      | "otp_verified_at"
      | "sign_link_expires_at"
      | "sign_link_used_at"
    >

    return (
      <RemoteSignShell>
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Firma contratto</h1>
            <p className="text-sm text-muted-foreground">{contract.company_name}</p>
          </div>

          <RetailerSignPanel
            token={token}
            initial={{
              companyName: contract.company_name,
              contactFirstName: contract.contact_first_name,
              contactLastName: contract.contact_last_name,
              status: contract.status,
              retailerSignaturePath: contract.retailer_signature_path,
              retailerAck: contract.retailer_ack ?? null,
              retailerGdpr: contract.retailer_gdpr ?? null,
              otpVerifiedAt: contract.otp_verified_at,
              signLinkExpiresAt: contract.sign_link_expires_at,
              signLinkUsedAt: contract.sign_link_used_at,
            }}
          />
        </div>
      </RemoteSignShell>
    )
  } catch (e) {
    return (
      <RemoteSignShell>
        <Card>
          <CardHeader>
            <CardTitle>Servizio non disponibile</CardTitle>
          </CardHeader>
          <CardContent>{e instanceof Error ? e.message : "Errore inatteso"}</CardContent>
        </Card>
      </RemoteSignShell>
    )
  }
}
