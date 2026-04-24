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
import { SignaturePad, type SignaturePadHandle } from "./signature-pad"
import { finalizeContractAction } from "@/app/dashboard/contracts/actions"

export function ContractSignPanel({ contractId }: { contractId: string }) {
  const router = useRouter()
  const retailerRef = useRef<SignaturePadHandle>(null)
  const staffRef = useRef<SignaturePadHandle>(null)
  const [pending, startTransition] = useTransition()
  const [ack, setAck] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [retailerSig, setRetailerSig] = useState<string | null>(null)

  useEffect(() => {
    if (step === 2) {
      // Small delay to ensure the div is no longer 'hidden' and has dimensions
      const timer = setTimeout(() => {
        staffRef.current?.resize()
      }, 50)
      return () => clearTimeout(timer)
    } else {
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
    setRetailerSig(retailerData)
    setStep(2)
  }

  function onSubmit() {
    // Try to get current data, fallback to captured state
    const currentRetailerData = retailerRef.current?.toDataUrl()
    const retailerData = currentRetailerData || retailerSig
    const staffData = staffRef.current?.toDataUrl()
    
    if (!retailerData || !ack) {
      setStep(1)
      toast.error("Retailer signature and acceptance are required")
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Contract Finalization</CardTitle>
            <CardDescription>
              {step === 1 ? "Step 1: Retailer Acceptance" : "Step 2: Staff Verification"}
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <div className={`h-2 w-8 rounded-full ${step >= 1 ? "bg-brand-navy" : "bg-muted"}`} />
            <div className={`h-2 w-8 rounded-full ${step >= 2 ? "bg-brand-navy" : "bg-muted"}`} />
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

            <div className="flex justify-end pt-2">
              <Button onClick={onNext} className="px-8 bg-brand-navy hover:bg-brand-navy/90">
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

            <SignaturePad
              ref={staffRef}
              label="Staff signature"
              description="Staff / Hotspot Manager signs here to finalize the contract."
            />

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)} disabled={pending}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Retailer
              </Button>
              <Button onClick={onSubmit} disabled={pending} className="px-8 bg-brand-green text-brand-navy hover:bg-brand-green/90 font-bold">
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
