import Link from "next/link"
import {
  CheckCircle2,
  Clock,
  FilePlus2,
  FileText,
  Store,
} from "lucide-react"
import { requireUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { getContractCounts, scopeContractsQuery } from "@/lib/contracts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Contract } from "@/lib/types"

export default async function DashboardPage() {
  const user = await requireUser()
  const supabase = await createClient()

  const counts = await getContractCounts(supabase, user)

  const recent = await scopeContractsQuery(
    supabase
      .from("contracts")
      .select(
        "id, company_name, shop_name, city, status, created_at, branch, zone",
      )
      .order("created_at", { ascending: false })
      .limit(6),
    user,
  )

  const recentRows = ((recent as { data: Contract[] | null }).data ?? []) as Pick<
    Contract,
    "id" | "company_name" | "shop_name" | "city" | "status" | "created_at" | "branch" | "zone"
  >[]

  const summary = [
    {
      label: "Total retailers",
      value: counts.total,
      icon: Store,
      tone: "bg-[#245bc1] text-white",
    },
    {
      label: "Signed contracts",
      value: counts.signed,
      icon: CheckCircle2,
      tone: "bg-[#08dc7d] text-[#21264e]",
    },
    {
      label: "Pending contracts",
      value: counts.pending,
      icon: Clock,
      tone: "bg-[#ffc8b2] text-[#21264e]",
    },
    {
      label: "Generated",
      value: counts.generated,
      icon: FilePlus2,
      tone: "bg-[#21264e] text-[#fff7f2]",
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {user.full_name.split(" ")[0]}</h1>
        <p className="text-sm text-muted-foreground">
          Overview of retailer contracts in your scope.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summary.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.tone}`}
              >
                <s.icon className="h-4 w-4" aria-hidden="true" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tabular-nums">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent contracts</CardTitle>
            <CardDescription>
              Latest contracts created within your scope.
            </CardDescription>
          </div>
          <Button asChild size="sm">
            <Link href="/dashboard/contracts/new">
              <FilePlus2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
              New contract
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-10 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <FileText className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              </div>
              <p className="text-sm text-muted-foreground">
                No contracts yet. Create your first retailer contract.
              </p>
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/contracts/new">Create contract</Link>
              </Button>
            </div>
          ) : (
            <ul className="flex flex-col divide-y">
              {recentRows.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="flex min-w-0 flex-col">
                    <Link
                      href={`/dashboard/contracts/${r.id}`}
                      className="truncate text-sm font-medium hover:underline"
                    >
                      {r.company_name}
                    </Link>
                    <span className="truncate text-xs text-muted-foreground">
                      {r.shop_name} · {r.city}
                      {r.zone ? ` · ${r.zone}` : ""}
                    </span>
                  </div>
                  <StatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
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
