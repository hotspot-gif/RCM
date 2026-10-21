"use client"

import { useRef, useState, useTransition, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Link2,
  Smartphone,
  Mail,
  RefreshCw,
  PenLine,
  Send,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { SignaturePad, type SignaturePadHandle } from "./signature-pad"
import {
  finalizeContractAction,
  getContractSigningStateAction,
  requestContractOtpAction,
  saveRetailerSignatureAction,
  sendRetailerSigningLinkAction,
  verifyContractOtpAction,
} from "@/app/dashboard/contracts/actions"
import { useI18n } from "@/lib/i18n/i18n-context"
import { cn } from "@/lib/utils"

type SignMode = "remote" | "device"

export function ContractSignPanel({ contractId }: { contractId: string }) {
  const router = useRouter()
  const { t } = useI18n()
  const retailerRef = useRef<SignaturePadHandle>(null)
  const staffRef = useRef<SignaturePadHandle>(null)
  const [pending, startTransition] = useTransition()
  const [ack, setAck] = useState(false)
  const [gdpr, setGdpr] = useState(false)
  const [mode, setMode] = useState<SignMode | null>(null)
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0)
  const [retailerSig, setRetailerSig] = useState<string | null>(null)
  const [otp, setOtp] = useState("")
  const [otpSentTo, setOtpSentTo] = useState<string | null>(null)
  const [otpVerifiedAt, setOtpVerifiedAt] = useState<string | null>(null)
  const [linkSent, setLinkSent] = useState(false)
  const [autoRefreshActive, setAutoRefreshActive] = useState(false)
  const [signingState, setSigningState] = useState<null | {
    retailerSignaturePath: string | null
    retailerAck: boolean | null
    retailerGdpr: boolean | null
    retailerSignedAt: string | null
    otpVerifiedAt: string | null
    signLinkSentAt: string | null
    signLinkExpiresAt: string | null
    signLinkUsedAt: string | null
    email: string | null
  }>(null)

  useEffect(() => {
    if (step === 3) {
      // Small delay to ensure the div is no longer 'hidden' and has dimensions
      const timer = setTimeout(() => {
        staffRef.current?.resize()
      }, 50)
      return () => clearTimeout(timer)
    }
    if (step === 1) {
      const timer = setTimeout(() => {
        retailerRef.current?.resize()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [step])

  const refreshSigningState = useCallback(async () => {
    const res = await getContractSigningStateAction(contractId)
    if (!res.ok) return null
    setSigningState(res.data!)
    setAck(!!res.data!.retailerAck)
    setGdpr(!!res.data!.retailerGdpr)
    setOtpVerifiedAt(res.data!.otpVerifiedAt)
    setOtpSentTo(res.data!.email)

    if (res.data!.retailerSignaturePath && res.data!.otpVerifiedAt) {
      setMode("device")
      setStep(3)
    } else if (res.data!.retailerSignaturePath) {
      setMode("device")
      setStep(2)
    }
    return res.data!
  }, [contractId])

  useEffect(() => {
    refreshSigningState()
  }, [refreshSigningState])

  useEffect(() => {
    const shouldPoll =
      (linkSent || !!signingState?.signLinkSentAt) &&
      !signingState?.signLinkUsedAt &&
      !(!!signingState?.retailerSignaturePath && !!signingState?.otpVerifiedAt)

    setAutoRefreshActive(shouldPoll)
    if (!shouldPoll) return

    let cancelled = false
    const tick = async () => {
      if (cancelled) return
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return
      const prevCompleted =
        !!signingState?.retailerSignaturePath && !!signingState?.otpVerifiedAt
      const next = await refreshSigningState()
      const nextCompleted = !!next?.retailerSignaturePath && !!next?.otpVerifiedAt
      if (!prevCompleted && nextCompleted) {
        toast.success(t("retailerCompleted"))
        router.refresh()
      }
    }

    const id = window.setInterval(tick, 5000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [linkSent, refreshSigningState, router, signingState, step, otpVerifiedAt, t])

  function onNext() {
    const retailerData = retailerRef.current?.toDataUrl()
    if (!retailerData) {
      toast.error(t("retailerSignatureRequired"))
      return
    }
    if (!ack) {
      toast.error(t("acceptanceRequired"))
      return
    }
    if (!gdpr) {
      toast.error(t("gdprRequired"))
      return
    }
    startTransition(async () => {
      const saved = await saveRetailerSignatureAction({
        id: contractId,
        retailerSignature: retailerData,
        ack,
        gdpr,
      })
      if (!saved.ok) {
        toast.error(saved.error)
        return
      }
      const res = await requestContractOtpAction(contractId)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      setRetailerSig(retailerData)
      setOtp("")
      setOtpSentTo(res.data!.sentTo)
      setOtpVerifiedAt(null)
      setStep(2)
      toast.success(t("otpSent").replace("{email}", res.data!.sentTo))
    })
  }

  function onVerifyOtp() {
    startTransition(async () => {
      const res = await verifyContractOtpAction({ id: contractId, otp })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      setOtpVerifiedAt(res.data!.verifiedAt)
      setStep(3)
      toast.success(t("otpVerified"))
      await refreshSigningState()
    })
  }

  function onResendOtp() {
    startTransition(async () => {
      const res = await requestContractOtpAction(contractId)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      setOtp("")
      setOtpSentTo(res.data!.sentTo)
      setOtpVerifiedAt(null)
      toast.success(t("otpSent").replace("{email}", res.data!.sentTo))
    })
  }

  function onSendRemoteLink() {
    startTransition(async () => {
      const res = await sendRetailerSigningLinkAction(contractId)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      if (!res.data!.emailed) {
        toast.error(t("signingLinkEmailFailed"))
        return
      }
      setLinkSent(true)
      setOtpSentTo(res.data!.sentTo)
      await refreshSigningState()
      toast.success(t("signingLinkSent").replace("{email}", res.data!.sentTo ?? ""))
    })
  }

  function onSubmit() {
    // Try to get current data, fallback to captured state
    const currentRetailerData = retailerRef.current?.toDataUrl()
    const retailerData = currentRetailerData || retailerSig
    const staffData = staffRef.current?.toDataUrl()

    const hasRetailerSig = !!retailerData || !!signingState?.retailerSignaturePath
    if (!hasRetailerSig || !ack || !gdpr) {
      setStep(1)
      toast.error(t("retailerSignatureRequired"))
      return
    }
    if (!otpVerifiedAt) {
      setStep(2)
      toast.error(t("otpVerificationRequired"))
      return
    }

    if (!staffData) {
      toast.error(t("staffSignatureRequired"))
      return
    }

    startTransition(async () => {
      const res = await finalizeContractAction({
        id: contractId,
        retailerSignature: signingState?.retailerSignaturePath ? null : (retailerData ?? null),
        staffSignature: staffData,
      })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(t("contractSigned"))
      router.refresh()
    })
  }

  const subtitle =
    mode === null
      ? t("chooseSigningMethod")
      : mode === "remote"
        ? t("remoteSigningLinkDesc")
        : step === 1
          ? t("stepRetailerSignature")
          : step === 2
            ? t("stepOtpVerification")
            : t("stepStaffSignature")

  return (
    <Card className="gap-0 overflow-hidden border-2 p-0 shadow-lg">
      <CardHeader className="gap-1.5 rounded-t-xl bg-[#21264e] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2.5 text-lg text-white sm:text-xl">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <PenLine className="h-4 w-4 text-[#08dc7d]" aria-hidden="true" />
              </span>
              {t("contractFinalization")}
            </CardTitle>
            <CardDescription className="mt-1.5 text-sm text-white/70">
              {subtitle}
            </CardDescription>
          </div>
          {mode === "device" ? <StepTracker step={step} /> : null}
        </div>
      </CardHeader>
      <CardContent className="px-5 py-6 sm:px-6">
        {mode === null ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <MethodCard
              icon={<Link2 className="h-5 w-5" aria-hidden="true" />}
              title={t("useRemoteLink")}
              description={t("useRemoteLinkDesc")}
              onClick={() => setMode("remote")}
            />
            <MethodCard
              icon={<Smartphone className="h-5 w-5" aria-hidden="true" />}
              title={t("useThisDevice")}
              description={t("useThisDeviceDesc")}
              onClick={() => {
                setMode("device")
                setStep(1)
              }}
            />
          </div>
        ) : null}

        {mode === "remote" ? (
          <div className="flex flex-col gap-5">
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-brand-navy">
                    {t("remoteSigningLinkLabel")}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {t("remoteSigningLinkDesc")}
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={onSendRemoteLink}
                  disabled={pending || linkSent}
                  className="w-full bg-brand-navy hover:bg-brand-navy/90 sm:w-auto"
                >
                  {pending ? (
                    <Spinner className="mr-2 h-4 w-4" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
                  )}
                  {linkSent ? t("linkSent") : t("sendLink")}
                </Button>
              </div>
            </div>

            {linkSent ? (
              <StatusBanner icon={<Send className="h-5 w-5" />}>
                {t("signingLinkSent").replace("{email}", otpSentTo ?? "the retailer email")}
              </StatusBanner>
            ) : null}

            {linkSent && !signingState?.signLinkUsedAt ? (
              <div className="flex items-center gap-3 rounded-xl border border-brand-navy/10 bg-brand-navy/[0.04] p-4 text-sm">
                <RefreshCw
                  className={cn("h-4 w-4 shrink-0 text-brand-navy", autoRefreshActive && "animate-spin")}
                  aria-hidden="true"
                />
                <span className="text-muted-foreground">{t("waitingForRetailer")}</span>
              </div>
            ) : null}

            <div className="flex justify-start">
              <Button
                variant="ghost"
                onClick={() => setMode(null)}
                disabled={pending}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                {t("changeSigningMethod")}
              </Button>
            </div>
          </div>
        ) : null}

        {mode === "device" ? (
          <div className="flex flex-col gap-6">
            {step === 1 ? (
              <div className="flex flex-col gap-5">
                <SignaturePad
                  ref={retailerRef}
                  label={t("retailerSignatureLabel")}
                  description={t("retailerSignatureDesc")}
                />

                <p className="text-sm text-muted-foreground">{t("otpConfirmNote")}</p>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-brand-blue/10 bg-brand-blue/5 p-4 text-sm transition-colors hover:bg-brand-blue/10">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-5 w-5 shrink-0 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                    checked={ack}
                    onChange={(e) => setAck(e.target.checked)}
                  />
                  <span className="font-medium leading-relaxed text-brand-navy">
                    {t("termsAcceptance")}
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-brand-green/10 bg-brand-green/5 p-4 text-sm transition-colors hover:bg-brand-green/10">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-5 w-5 shrink-0 rounded border-gray-300 text-brand-green focus:ring-brand-green"
                    checked={gdpr}
                    onChange={(e) => setGdpr(e.target.checked)}
                  />
                  <span className="font-medium leading-relaxed text-brand-navy">
                    {t("gdprConsent")}
                  </span>
                </label>

                <Button
                  onClick={onNext}
                  disabled={pending}
                  className="w-full bg-brand-navy hover:bg-brand-navy/90 sm:w-auto sm:self-end sm:px-8"
                >
                  {pending ? <Spinner className="mr-2 h-4 w-4" /> : null}
                  {t("next")}
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="flex flex-col gap-5">
                <StatusBanner icon={<CheckCircle2 className="h-5 w-5" />}>
                  {t("retailerSignedAccepted")}
                </StatusBanner>

                <div className="rounded-xl border bg-muted/30 p-4">
                  <div className="text-sm font-semibold text-brand-navy">
                    {t("otpVerification")}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {t("otpVerificationDesc").replace(
                      "{email}",
                      otpSentTo ?? "the retailer email",
                    )}
                  </div>
                  {autoRefreshActive ? (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {t("waitingForRetailer")}
                    </div>
                  ) : null}
                  <div className="mt-4 flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={(v) => setOtp(v)}
                      autoFocus
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      pattern="[0-9]*"
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setOtp("")
                        setOtpSentTo(null)
                        setOtpVerifiedAt(null)
                        setStep(1)
                      }}
                      disabled={pending}
                      className="w-full sm:w-auto"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                      {t("backToRetailer")}
                    </Button>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <Button
                        variant="outline"
                        onClick={onResendOtp}
                        disabled={pending}
                        className="w-full sm:w-auto"
                      >
                        {t("resendOtp")}
                      </Button>
                      <Button
                        onClick={onVerifyOtp}
                        disabled={pending || otp.replace(/\s+/g, "").length !== 6}
                        className="w-full bg-brand-navy hover:bg-brand-navy/90 sm:w-auto sm:px-8"
                      >
                        {pending ? <Spinner className="mr-2 h-4 w-4" /> : null}
                        {t("verifyOtp")}
                        <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="flex flex-col gap-5">
                <StatusBanner icon={<CheckCircle2 className="h-5 w-5" />}>
                  {t("retailerSignedOtpVerified")}
                </StatusBanner>

                <SignaturePad
                  ref={staffRef}
                  label={t("staffSignatureLabel")}
                  description={t("staffSignatureDesc")}
                />

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setStep(2)}
                    disabled={pending}
                    className="w-full sm:w-auto"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                    {t("backToOtp")}
                  </Button>
                  <Button
                    onClick={onSubmit}
                    disabled={pending}
                    className="w-full bg-brand-green font-bold text-brand-navy hover:bg-brand-green/90 sm:w-auto sm:px-8"
                  >
                    {pending ? <Spinner className="mr-2 h-4 w-4" /> : null}
                    {t("completeAndGeneratePdf")}
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="flex justify-start border-t pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMode(null)
                  setStep(0)
                }}
                disabled={pending}
                className="w-full text-muted-foreground sm:w-auto"
              >
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                {t("changeSigningMethod")}
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function MethodCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-start gap-3 rounded-xl border-2 border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-brand-navy/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-navy/10 text-brand-navy transition-colors group-hover:bg-brand-navy group-hover:text-white">
        {icon}
      </span>
      <span className="text-sm font-semibold text-brand-navy">{title}</span>
      <span className="text-xs leading-relaxed text-muted-foreground">{description}</span>
    </button>
  )
}

function StepTracker({ step }: { step: 0 | 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-1.5 sm:shrink-0">
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          className={cn(
            "h-1.5 rounded-full transition-all",
            step >= n ? "w-9 bg-[#08dc7d]" : "w-6 bg-white/25",
          )}
        />
      ))}
    </div>
  )
}

function StatusBanner({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
      <span className="shrink-0 text-emerald-600">{icon}</span>
      <span className="font-medium">{children}</span>
    </div>
  )
}
