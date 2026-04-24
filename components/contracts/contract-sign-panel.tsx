"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
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

  function onSubmit() {
    const retailerData = retailerRef.current?.toDataUrl()
    const staffData = staffRef.current?.toDataUrl()
    if (!retailerData) {
      toast.error("Retailer signature is required")
      return
    }
    if (!staffData) {
      toast.error("Staff signature is required")
      return
    }
    if (!ack) {
      toast.error("Confirm acceptance of the terms before signing.")
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
    <Card>
      <CardHeader>
        <CardTitle>Signatures</CardTitle>
        <CardDescription>
          Both retailer and staff must sign. The final PDF will be generated and stored.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          <SignaturePad
            ref={retailerRef}
            label="Retailer signature"
            description="Draw the retailer's signature in the box below."
          />
          <SignaturePad
            ref={staffRef}
            label="Staff signature"
            description="Staff / Hotspot Manager signs here."
          />

          <label className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-[#245bc1]"
              checked={ack}
              onChange={(e) => setAck(e.target.checked)}
            />
            <span>
              Confermo di aver letto, compreso e accettato tutte le disposizioni del
              Contratto di distribuzione, il Prospetto delle condizioni di vendita, il
              Listino Prezzi e l&apos;Allegato sulla prevenzione delle frodi.
            </span>
          </label>

          <div className="flex justify-end">
            <Button onClick={onSubmit} disabled={pending}>
              {pending ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Sign &amp; generate PDF
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
