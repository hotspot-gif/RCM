"use client"

import { useTransition } from "react"
import { Download, Mail, FileText } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  getContractPdfUrlAction,
  sendContractEmailAction,
  getDraftContractPdfAction,
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
  const [pendingDraft, startDraft] = useTransition()

  const disabled = status !== "SIGNED"

  function downloadDraft() {
    startDraft(async () => {
      const res = await getDraftContractPdfAction(contractId)
      if (!res.ok) {
        toast.error(res.error)
        return
      }

      const { base64, filename } = res.data!
      const link = document.createElement("a")
      link.href = `data:application/pdf;base64,${base64}`
      link.setAttribute("download", filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success("Draft PDF generated")
    })
  }

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
      {status !== "SIGNED" && (
        <Button
          onClick={downloadDraft}
          variant="outline"
          disabled={pendingDraft}
          className="border-brand-navy text-brand-navy hover:bg-brand-navy/5"
        >
          {pendingDraft ? (
            <Spinner className="mr-2 h-4 w-4" />
          ) : (
            <FileText className="mr-1.5 h-4 w-4" aria-hidden="true" />
          )}
          Download Draft (Unsigned)
        </Button>
      )}
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
