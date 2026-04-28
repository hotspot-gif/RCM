import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Pencil, X } from "lucide-react"
import { requireUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { NewContractForm } from "@/components/contracts/new-contract-form"
import { ContractSignPanel } from "@/components/contracts/contract-sign-panel"
import { ContractActions } from "@/components/contracts/contract-actions"
import type { Contract } from "@/lib/types"

export default async function ContractDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ edit?: string }>
}) {
  const { id } = await params
  const user = await requireUser()
  const supabase = await createClient()
  const sp = searchParams ? await searchParams : undefined
  const isEdit = sp?.edit === "1"

  const { data, error } = await supabase
    .from("contracts")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error || !data) notFound()
  const contract = data as Contract

  const statusTone =
    contract.status === "SIGNED"
      ? "bg-[#08dc7d] text-[#21264e] hover:bg-[#08dc7d]"
      : contract.status === "PENDING"
        ? "bg-[#ffc8b2] text-[#21264e] hover:bg-[#ffc8b2]"
        : "bg-muted"

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/contracts">
              <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {contract.company_name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {contract.shop_name} · Created{" "}
              {new Date(contract.created_at).toLocaleDateString("en-GB")}
            </p>
          </div>
        </div>
        <Badge className={statusTone}>{contract.status}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {isEdit && contract.status !== "SIGNED" ? (
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Edit retailer details</CardTitle>
                <CardDescription>
                  Update details for this draft contract.
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="icon" aria-label="Cancel edit">
                <Link href={`/dashboard/contracts/${contract.id}`}>
                  <X className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <NewContractForm
                currentUser={user}
                mode="edit"
                contractId={contract.id}
                initialValues={contract}
              />
            </CardContent>
          </Card>
        ) : (
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Retailer details</CardTitle>
                <CardDescription>Contract metadata & contact.</CardDescription>
              </div>
              {contract.status !== "SIGNED" ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/contracts/${contract.id}?edit=1`}>
                    <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                    Edit
                  </Link>
                </Button>
              ) : null}
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-3 text-sm">
                <Row label="Company" value={contract.company_name} />
                <Row label="VAT" value={contract.vat_number} />
                <Row
                  label="Contact"
                  value={`${contract.contact_first_name} ${contract.contact_last_name}`}
                />
                <Row
                  label="Address"
                  value={`${contract.street} ${contract.house_number}, ${contract.post_code} ${contract.city}`}
                />
                <Row label="Mobile" value={contract.mobile_number} />
                <Row label="Landline" value={contract.landline_number ?? "—"} />
                <Row label="Email" value={contract.email} />
                <Row label="Branch" value={contract.branch ?? "—"} />
                <Row label="Zone" value={contract.zone ?? "—"} />
                {contract.signed_at ? (
                  <Row
                    label="Signed"
                    value={new Date(contract.signed_at).toLocaleString("en-GB")}
                  />
                ) : null}
                {contract.emailed_at ? (
                  <Row
                    label="Emailed"
                    value={new Date(contract.emailed_at).toLocaleString("en-GB")}
                  />
                ) : null}
              </dl>
            </CardContent>
          </Card>
        )}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {contract.status !== "SIGNED" && (
            <Card>
              <CardHeader>
                <CardTitle>Draft Actions</CardTitle>
                <CardDescription>
                  Download a preview of the contract before signing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ContractActions contractId={contract.id} status={contract.status} />
              </CardContent>
            </Card>
          )}

          {contract.status !== "SIGNED" ? (
            <ContractSignPanel contractId={contract.id} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Signed contract</CardTitle>
                <CardDescription>
                  This contract has been signed. You can download the PDF or send it by email.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ContractActions contractId={contract.id} status={contract.status} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="break-words font-medium">{value}</dd>
    </div>
  )
}
