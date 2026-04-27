"use client"

import { useRef, useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react"
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
  requestContractOtpAction,
  verifyContractOtpAction,
} from "@/app/dashboard/contracts/actions"

export function ContractSignPanel({ contractId }: { contractId: string }) {
  const router = useRouter()
  const retailerRef = useRef<SignaturePadHandle>(null)
  const staffRef = useRef<SignaturePadHandle>(null)
  const [pending, startTransition] = useTransition()
  const [ack, setAck] = useState(false)
  const [gdpr, setGdpr] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [retailerSig, setRetailerSig] = useState<string | null>(null)
  const [otp, setOtp] = useState("")
  const [otpSentTo, setOtpSentTo] = useState<string | null>(null)
  const [otpVerifiedAt, setOtpVerifiedAt] = useState<string | null>(null)

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

  function onNext() {
    const retailerData = retailerRef.current?.toDataUrl()
    if (!retailerData) {
      toast.error("Retailer signature is required")
      return
    }
    if (!ack) {
      toast.error("Confirm acceptance of the terms before signing.")
      return
    }
    if (!gdpr) {
      toast.error("GDPR privacy consent is required.")
      return
    }
    startTransition(async () => {
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
      toast.success(`OTP sent to ${res.data!.sentTo}`)
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
      toast.success("OTP verified")
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
      toast.success(`OTP re-sent to ${res.data!.sentTo}`)
    })
  }

  function onSubmit() {
    // Try to get current data, fallback to captured state
    const currentRetailerData = retailerRef.current?.toDataUrl()
    const retailerData = currentRetailerData || retailerSig
    const staffData = staffRef.current?.toDataUrl()
    
    if (!retailerData || !ack || !gdpr) {
      setStep(1)
      toast.error("Retailer signature, acceptance and GDPR consent are required")
      return
    }
    if (!otpVerifiedAt) {
      setStep(2)
      toast.error("OTP verification is required")
      return
    }
    
    if (!staffData) {
      toast.error("Staff signature is required")
      return
    }

    startTransition(async () => {
      const res = await finalizeContractAction({
        id: contractId,
        retailerSignature: retailerData,
        staffSignature: staffData,
      })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Contract signed and PDF generated")
      router.refresh()
    })
  }

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="text-xl">Contract Finalization</CardTitle>
            <CardDescription>
              {step === 1
                ? "Step 1: Retailer Acceptance"
                : step === 2
                  ? "Step 2: OTP Verification"
                  : "Step 3: Staff Verification"}
            </CardDescription>
          </div>
          <div className="flex gap-1 sm:shrink-0">
            <div className={`h-2 w-8 rounded-full ${step >= 1 ? "bg-brand-navy" : "bg-muted"}`} />
            <div className={`h-2 w-8 rounded-full ${step >= 2 ? "bg-brand-navy" : "bg-muted"}`} />
            <div className={`h-2 w-8 rounded-full ${step >= 3 ? "bg-brand-navy" : "bg-muted"}`} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-6">
          <div className={step === 1 ? "flex flex-col gap-6" : "hidden"}>
            <SignaturePad
              ref={retailerRef}
              label="Retailer signature"
              description="Draw the retailer's signature in the box below."
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
                Contratto di distribuzione, il Prospetto delle condizioni di vendita, il
                Listino Prezzi e l&apos;Allegato sulla prevenzione delle frodi.
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
                Acconsento al trattamento dei dati personali ai sensi del Regolamento (UE) 2016/679 (GDPR) per le finalità
                connesse alla gestione del contratto e agli adempimenti di legge.
              </span>
            </label>

            <div className="flex flex-col pt-2 sm:flex-row sm:justify-end">
              <Button
                onClick={onNext}
                disabled={pending}
                className="w-full bg-brand-navy hover:bg-brand-navy/90 sm:w-auto sm:px-8"
              >
                {pending ? <Spinner className="mr-2 h-4 w-4" /> : null}
                Next Step
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className={step === 2 ? "flex flex-col gap-6" : "hidden"}>
            <div className="rounded-lg border bg-green-50 p-4 text-green-800 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Retailer has signed and accepted terms.</span>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="text-sm font-semibold text-brand-navy">OTP verification</div>
              <div className="mt-1 text-sm text-slate-600">
                Enter the 6-digit OTP sent to {otpSentTo ?? "the retailer email"}.
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

              <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Retailer
                </Button>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button variant="outline" onClick={onResendOtp} disabled={pending} className="w-full sm:w-auto">
                    Resend OTP
                  </Button>
                  <Button
                    onClick={onVerifyOtp}
                    disabled={pending || otp.replace(/\\s+/g, "").length !== 6}
                    className="w-full bg-brand-navy hover:bg-brand-navy/90 sm:w-auto sm:px-8"
                  >
                    {pending ? <Spinner className="mr-2 h-4 w-4" /> : null}
                    Verify OTP
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className={step === 3 ? "flex flex-col gap-6" : "hidden"}>
            <div className="rounded-lg border bg-green-50 p-4 text-green-800 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Retailer has signed and OTP is verified.</span>
            </div>

            <SignaturePad
              ref={staffRef}
              label="Staff signature"
              description="Staff / Hotspot Manager signs here to finalize the contract."
            />

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="outline" onClick={() => setStep(2)} disabled={pending} className="w-full sm:w-auto">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to OTP
              </Button>
              <Button
                onClick={onSubmit}
                disabled={pending}
                className="w-full bg-brand-green font-bold text-brand-navy hover:bg-brand-green/90 sm:w-auto sm:px-8"
              >
                {pending ? <Spinner className="mr-2 h-4 w-4" /> : null}
                Complete & Generate PDF
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
