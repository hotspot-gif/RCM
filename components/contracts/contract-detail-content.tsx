"use client"

import Link from "next/link"
import {
  ArrowLeft,
  Building2,
  CalendarCheck,
  Clock,
  Hash,
  Mail,
  Map,
  MapPin,
  Pencil,
  Phone,
  ShieldAlert,
  User,
  X,
} from "lucide-react"
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
import { useI18n } from "@/lib/i18n/i18n-context"
import { cn } from "@/lib/utils"
import type { AppUser, Contract } from "@/lib/types"

interface ContractDetailContentProps {
  contract: Contract
  user: AppUser
  isEdit: boolean
}

export function ContractDetailContent({ contract, user, isEdit }: ContractDetailContentProps) {
  const { t, language } = useI18n()

  const statusTone =
    contract.status === "SIGNED"
      ? "bg-[#08dc7d] text-[#21264e] hover:bg-[#08dc7d]"
      : contract.status === "PENDING"
        ? "bg-[#ffc8b2] text-[#21264e] hover:bg-[#ffc8b2]"
        : "bg-muted text-muted-foreground hover:bg-muted"

  const statusDot =
    contract.status === "SIGNED"
      ? "bg-[#0a9c5b]"
      : contract.status === "PENDING"
        ? "bg-[#e8590c]"
        : "bg-muted-foreground"

  const statusLabel =
    contract.status === "SIGNED"
      ? t("signedContracts")
      : contract.status === "PENDING"
        ? t("pendingContracts")
        : t("generated")

  const dateFormat = language === "en" ? "en-GB" : "it-IT"

  const canCaptureSignature = user.can_capture_signature !== false
  const canUseRemoteLink = user.can_use_remote_link !== false
  const canDownloadDraft = user.can_download_draft !== false
  const canFinalize = canCaptureSignature || canUseRemoteLink

  return (
    <div className="flex flex-col gap-5 pb-6 sm:gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit text-muted-foreground">
          <Link href="/dashboard/contracts">
            <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {t("back")}
          </Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {contract.company_name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {contract.shop_name} · {t("created")}{" "}
              {new Date(contract.created_at).toLocaleDateString(dateFormat)}
            </p>
          </div>
          <Badge className={cn("shrink-0 gap-1.5 px-3 py-1", statusTone)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", statusDot)} aria-hidden="true" />
            {statusLabel}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">
        {isEdit && contract.status !== "SIGNED" ? (
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>{t("editContractTitle")}</CardTitle>
                <CardDescription>{t("editContractDesc")}</CardDescription>
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
                <CardTitle>{t("retailerDetails")}</CardTitle>
                <CardDescription>{t("contractMetadataDesc")}</CardDescription>
              </div>
              {contract.status !== "SIGNED" ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/contracts/${contract.id}?edit=1`}>
                    <Pencil className="h-4 w-4 sm:mr-2" aria-hidden="true" />
                    <span className="hidden sm:inline">{t("edit")}</span>
                  </Link>
                </Button>
              ) : null}
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <Field icon={<Building2 className="h-3.5 w-3.5" />} label={t("company")} value={contract.company_name} />
                <Field icon={<Hash className="h-3.5 w-3.5" />} label={t("vatNumberLabel")} value={contract.vat_number} />
                <Field
                  icon={<User className="h-3.5 w-3.5" />}
                  label={t("contactFirstName")}
                  value={`${contract.contact_first_name} ${contract.contact_last_name}`}
                />
                <Field
                  icon={<MapPin className="h-3.5 w-3.5" />}
                  label={t("street")}
                  value={`${contract.street} ${contract.house_number}, ${contract.post_code} ${contract.city}`}
                />
                <Field icon={<Phone className="h-3.5 w-3.5" />} label={t("mobile")} value={contract.mobile_number} />
                <Field icon={<Phone className="h-3.5 w-3.5" />} label={t("landline")} value={contract.landline_number ?? "—"} />
                <Field icon={<Mail className="h-3.5 w-3.5" />} label={t("emailLabel")} value={contract.email} />
                <Field icon={<Map className="h-3.5 w-3.5" />} label={t("branch")} value={contract.branch ?? "—"} />
                <Field icon={<Map className="h-3.5 w-3.5" />} label={t("zone")} value={contract.zone ?? "—"} />
                {contract.signed_at ? (
                  <Field
                    icon={<CalendarCheck className="h-3.5 w-3.5" />}
                    label={t("signedContracts")}
                    value={new Date(contract.signed_at).toLocaleString(dateFormat)}
                  />
                ) : null}
                {contract.emailed_at ? (
                  <Field
                    icon={<Clock className="h-3.5 w-3.5" />}
                    label={t("emailed")}
                    value={new Date(contract.emailed_at).toLocaleString(dateFormat)}
                  />
                ) : null}
              </dl>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col gap-5 lg:col-span-2 lg:gap-6">
          {contract.status !== "SIGNED" && canDownloadDraft && (
            <Card>
              <CardHeader>
                <CardTitle>{t("draftActions")}</CardTitle>
                <CardDescription>{t("draftActionsDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ContractActions contractId={contract.id} status={contract.status} />
              </CardContent>
            </Card>
          )}

          {contract.status !== "SIGNED" ? (
            canFinalize ? (
              <ContractSignPanel
                contractId={contract.id}
                allowDevice={canCaptureSignature}
                allowRemote={canUseRemoteLink}
              />
            ) : (
              <Card className="border-2 border-dashed shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                      <ShieldAlert className="h-5 w-5" aria-hidden="true" />
                    </span>
                    {t("signatureCaptureRestrictedTitle")}
                  </CardTitle>
                  <CardDescription>{t("signatureCaptureRestrictedDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                    {t("signatureCaptureRestrictedNote")}
                  </div>
                </CardContent>
              </Card>
            )
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{t("signedContractTitle")}</CardTitle>
                <CardDescription>{t("signedContractDesc")}</CardDescription>
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

function Field({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
        <dd className="break-words font-medium">{value}</dd>
      </div>
    </div>
  )
}
