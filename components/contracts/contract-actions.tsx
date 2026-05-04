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

function isIosSafari() {
  if (typeof navigator === "undefined") return false
  const ua = navigator.userAgent
  const isIos = /iPad|iPhone|iPod/.test(ua)
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)
  return isIos && isSafari
}

function base64ToBlob(base64: string, contentType: string) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: contentType })
}

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
    const popup = isIosSafari() ? window.open("", "_blank") : null
    startDraft(async () => {
      const res = await getDraftContractPdfAction(contractId)
      if (!res.ok) {
        toast.error(res.error)
        popup?.close()
        return
      }

      const { base64, filename } = res.data!
      const blob = base64ToBlob(base64, "application/pdf")
      const objectUrl = URL.createObjectURL(blob)

      if (popup) {
        popup.document.title = filename
        popup.location.href = objectUrl
      } else {
        const link = document.createElement("a")
        link.href = objectUrl
        link.setAttribute("download", filename)
        document.body.appendChild(link)
        link.click()
        link.remove()
      }

      setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000)
      toast.success("Draft PDF generated")
    })
  }

  function download() {
    const popup = isIosSafari() ? window.open("", "_blank") : null
    startDownload(async () => {
      const res = await getContractPdfUrlAction(contractId)
      if (!res.ok) {
        toast.error(res.error)
        popup?.close()
        return
      }
      
      const url = res.data!.url
      if (popup) {
        popup.location.href = url
        return
      }

      const link = document.createElement("a")
      link.href = url
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
