"use client"

import Link from "next/link"
import { useMemo, useState, useTransition } from "react"
import { ExternalLink, MoreHorizontal, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Contract } from "@/lib/types"
import { deleteContractAction } from "@/app/dashboard/contracts/actions"

type Row = Pick<
  Contract,
  | "id"
  | "company_name"
  | "shop_name"
  | "city"
  | "status"
  | "created_at"
  | "branch"
  | "zone"
  | "email"
>

export function ContractsTable({ contracts }: { contracts: Row[] }) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<string>("ALL")
  const [pending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return contracts.filter((c) => {
      if (status !== "ALL" && c.status !== status) return false
      if (!q) return true
      return (
        c.company_name.toLowerCase().includes(q) ||
        c.shop_name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q)
      )
    })
  }, [contracts, query, status])

  function onDelete(row: Row) {
    if (!confirm(`Delete contract for ${row.company_name}? This cannot be undone.`))
      return
    startTransition(async () => {
      const res = await deleteContractAction(row.id)
      if (!res.ok) toast.error(res.error)
      else toast.success("Contract deleted")
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company, shop, city, email"
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="GENERATED">Generated</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="SIGNED">Signed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-12 text-center">
          <p className="text-sm text-muted-foreground">No contracts match your filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Shop</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" aria-label="Actions" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/contracts/${c.id}`}
                      className="hover:underline"
                    >
                      {c.company_name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.shop_name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.city}</TableCell>
                  <TableCell className="text-muted-foreground">{c.zone ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString("en-GB")}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Row actions">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/contracts/${c.id}`}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={pending}
                          onClick={() => onDelete(c)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: Contract["status"] }) {
  if (status === "SIGNED")
    return (
      <Badge className="bg-[#08dc7d] text-[#21264e] hover:bg-[#08dc7d]">Signed</Badge>
    )
  if (status === "PENDING")
    return (
      <Badge className="bg-[#ffc8b2] text-[#21264e] hover:bg-[#ffc8b2]">Pending</Badge>
    )
  return <Badge variant="secondary">Generated</Badge>
}
