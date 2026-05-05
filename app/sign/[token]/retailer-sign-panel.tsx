"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { toast } from "sonner"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Progress } from "@/components/ui/progress"
import { SignaturePad, type SignaturePadHandle } from "@/components/contracts/signature-pad"
import { cn } from "@/lib/utils"
import {
  requestContractOtpByTokenAction,
  saveRetailerSignatureByTokenAction,
  verifyContractOtpByTokenAction,
} from "./actions"

export function RetailerSignPanel(props: {
  token: string
  initial: {
    contractId: string
    companyName: string
    contactFirstName: string
    contactLastName: string
    status: string
    retailerSignaturePath: string | null
    retailerAck: boolean | null
    retailerGdpr: boolean | null
    otpVerifiedAt: string | null | undefined
    signLinkExpiresAt: string | null | undefined
    signLinkUsedAt: string | null | undefined
  }
}) {
  const retailerRef = useRef<SignaturePadHandle>(null)
  const [pending, startTransition] = useTransition()
  const [ack, setAck] = useState(!!props.initial.retailerAck)
  const [gdpr, setGdpr] = useState(!!props.initial.retailerGdpr)
  const [step, setStep] = useState<1 | 2 | 3>(() =>
    props.initial.otpVerifiedAt ? 3 : 1,
  )
  const [otp, setOtp] = useState("")
  const [otpSentTo, setOtpSentTo] = useState<string | null>(null)
  const [otpVerifiedAt, setOtpVerifiedAt] = useState<string | null>(
    props.initial.otpVerifiedAt ?? null,
  )

  const expired = (() => {
    if (!props.initial.signLinkExpiresAt) return true
    const t = new Date(props.initial.signLinkExpiresAt).getTime()
    return Number.isNaN(t) || Date.now() > t
  })()

  const completed =
    !!props.initial.signLinkUsedAt ||
    (props.initial.retailerSignaturePath && otpVerifiedAt)

  const progressValue = step === 1 ? 33 : step === 2 ? 66 : 100

  useEffect(() => {
    const timer = setTimeout(() => {
      retailerRef.current?.resize()
    }, 50)
    return () => clearTimeout(timer)
  }, [step])

  function onSendOtp() {
    const retailerData = retailerRef.current?.toDataUrl()
    if (!retailerData) {
      toast.error("Firma richiesta")
      return
    }
    if (!ack) {
      toast.error("Conferma accettazione richiesta")
      return
    }
    if (!gdpr) {
      toast.error("Consenso GDPR richiesto")
      return
    }

    startTransition(async () => {
      const saved = await saveRetailerSignatureByTokenAction({
        token: props.token,
        retailerSignature: retailerData,
        ack,
        gdpr,
      })
      if (!saved.ok) {
        toast.error(saved.error)
        return
      }

      const res = await requestContractOtpByTokenAction(props.token)
      if (!res.ok) {
        toast.error(res.error)
        return
      }

      setOtp("")
      setOtpSentTo(res.data!.sentTo)
      setOtpVerifiedAt(null)
      setStep(2)
      toast.success(`OTP inviato a ${res.data!.sentTo}`)
    })
  }

  function onVerifyOtp() {
    startTransition(async () => {
      const res = await verifyContractOtpByTokenAction({ token: props.token, otp })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      setOtpVerifiedAt(res.data!.verifiedAt)
      setStep(3)
      toast.success("OTP verificato")
    })
  }

  function onResendOtp() {
    startTransition(async () => {
      const res = await requestContractOtpByTokenAction(props.token)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      setOtp("")
      setOtpSentTo(res.data!.sentTo)
      toast.success(`OTP reinviato a ${res.data!.sentTo}`)
    })
  }

  if (expired) {
    return (
      <Card className="border-2 shadow-lg">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-xl">Link scaduto</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          Il link di firma è scaduto. Richiedi un nuovo link al tuo referente.
        </CardContent>
      </Card>
    )
  }

  if (completed) {
    return (
      <Card className="border-2 shadow-lg">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-xl">Contratto finalizzato</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-6 w-6 text-green-600" />
                <div>
                  <p className="text-lg font-semibold text-green-900">
                    Contratto finalizzato con successo!
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    La tua firma digitale è stata acquisita e il contratto di affiliazione
                    Lycamobile è ora attivo.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Contratto
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                #{props.initial.contractId}
              </p>
            </div>

            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Stato
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {props.initial.status || "Attivo"}
              </p>
            </div>

            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Azienda
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {props.initial.companyName}
              </p>
            </div>

            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Referente
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {props.initial.contactFirstName} {props.initial.contactLastName}
              </p>
            </div>

            <div className="rounded-lg border bg-white p-4 shadow-sm sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Verifica OTP
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {otpVerifiedAt
                  ? new Date(otpVerifiedAt).toLocaleString("it-IT", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Completata"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="border-b bg-muted/30">
        <CardTitle className="text-xl">Firma del retailer</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4 flex flex-row flex-wrap items-center justify-between gap-3 text-sm font-semibold text-slate-900">
            <span className={cn(step === 1 ? "text-slate-900" : "text-slate-500")}>Firma</span>
            <span className={cn(step === 2 ? "text-slate-900" : "text-slate-500")}>OTP</span>
            <span className={cn(step === 3 ? "text-slate-900" : "text-slate-500")}>Completato</span>
          </div>
          <div className="mb-3">
            <Progress value={progressValue} className="h-2" />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className={step === 1 ? "flex flex-col gap-6" : "hidden"}>
            <SignaturePad
              ref={retailerRef}
              label="Firma"
              description="Disegna la tua firma nel riquadro."
            />

            <label className="flex items-start gap-3 rounded-lg border-2 border-brand-blue/10 bg-brand-blue/5 p-4 text-sm transition-colors hover:bg-brand-blue/10">
              <input
                type="checkbox"
                className="mt-0.5 h-5 w-5 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                checked={ack}
                onChange={(e) => setAck(e.target.checked)}
              />
              <span className="leading-relaxed font-medium text-brand-navy">
                Confermo di aver letto, compreso e accettato tutte le disposizioni del
                Contratto.
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-lg border-2 border-brand-green/10 bg-brand-green/5 p-4 text-sm transition-colors hover:bg-brand-green/10">
              <input
                type="checkbox"
                className="mt-0.5 h-5 w-5 rounded border-gray-300 text-brand-green focus:ring-brand-green"
                checked={gdpr}
                onChange={(e) => setGdpr(e.target.checked)}
              />
              <span className="leading-relaxed font-medium text-brand-navy">
                Acconsento al trattamento dei dati personali ai sensi del Regolamento (UE)
                2016/679 (GDPR) per le finalità connesse alla gestione del contratto.
              </span>
            </label>

            <div className="flex flex-col pt-2 sm:flex-row sm:justify-end">
              <Button
                onClick={onSendOtp}
                disabled={pending}
                className="w-full bg-brand-navy hover:bg-brand-navy/90 sm:w-auto sm:px-8"
              >
                {pending ? <Spinner className="mr-2 h-4 w-4" /> : null}
                Invia OTP
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className={step === 2 ? "flex flex-col gap-6" : "hidden"}>
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="text-sm font-semibold text-brand-navy">Verifica Identità OTP</div>
              <div className="mt-1 text-sm text-slate-600">
                Inserisci il codice ricevuto via email per finalizzare.
              </div>
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

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <Button variant="outline" onClick={onResendOtp} disabled={pending} className="w-full sm:w-auto">
                  Reinvia OTP
                </Button>
                <Button
                  onClick={onVerifyOtp}
                  disabled={pending || otp.replace(/\s+/g, "").length !== 6}
                  className="w-full bg-brand-navy hover:bg-brand-navy/90 sm:w-auto sm:px-8"
                >
                  {pending ? <Spinner className="mr-2 h-4 w-4" /> : null}
                  Verifica OTP
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className={step === 3 ? "flex flex-col gap-6" : "hidden"}>
            <div className="rounded-lg border bg-green-50 p-4 text-green-800 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">
                Grazie, la firma e la verifica OTP sono state completate.
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

