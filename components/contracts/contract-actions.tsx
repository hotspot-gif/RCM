"use client"

import { useTransition } from "react"
import { Download, Mail } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  getContractPdfUrlAction,
  sendContractEmailAction,
} from "@/app/dashboard/contracts/actions"

export function ContractActions({
  contractId,
  status,
}: {
  contractId: string
  status: string
}) {
  const [pendingDownload, startDownload] = useTransition()
  const [pendingEmail, startEmail] = useTransition()

  const disabled = status !== "SIGNED"

  function download() {
    startDownload(async () => {
      const res = await getContractPdfUrlAction(contractId)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      
      const link = document.createElement("a")
      link.href = res.data!.url
      link.setAttribute("download", "")
      document.body.appendChild(link)
      link.click()
      link.remove()
    })
  }

  function email() {
    startEmail(async () => {
      const res = await sendContractEmailAction(contractId)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(`Email sent to ${res.data!.sentTo.join(", ")}`)
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button onClick={download} disabled={disabled || pendingDownload}>
        {pendingDownload ? (
          <Spinner className="mr-2 h-4 w-4" />
        ) : (
          <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
        )}
        Download PDF
      </Button>
      <Button
        onClick={email}
        variant="outline"
        disabled={disabled || pendingEmail}
      >
        {pendingEmail ? (
          <Spinner className="mr-2 h-4 w-4" />
        ) : (
          <Mail className="mr-1.5 h-4 w-4" aria-hidden="true" />
        )}
        Send by email
      </Button>
    </div>
  )
}
