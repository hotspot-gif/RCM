import Link from "next/link"
import { redirect } from "next/navigation"
import { FileSignature, Shield, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <header className="flex items-center justify-between px-6 py-5 md:px-10">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#21264e] text-[#fff7f2]">
            <FileSignature className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="text-sm font-semibold tracking-tight md:text-base">
            Universal Service 2006 — Contracts
          </span>
        </div>
        <Button asChild>
          <Link href="/auth/login">Sign in</Link>
        </Button>
      </header>

      <section className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-6 pb-20 pt-10 text-center md:pt-16">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#ffc8b2] px-3 py-1 text-xs font-medium text-[#21264e]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#08dc7d]" aria-hidden="true" />
          Retailer Contract Management System
        </span>
        <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-6xl">
          Generate, sign and dispatch retailer contracts in minutes.
        </h1>
        <p className="max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
          A single dashboard for ADMIN, ASM and FSE teams to create distribution
          contracts, collect digital signatures, and automatically email the signed
          PDF to retailer and staff — with full branch and zone level control.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/auth/login">Open dashboard</Link>
          </Button>
        </div>

        <dl className="mt-10 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              icon: FileSignature,
              title: "Pre-filled PDFs",
              desc: "Retailer details are merged into the contract template instantly.",
            },
            {
              icon: Shield,
              title: "Role-based access",
              desc: "ADMIN sees everything; ASM per branch; FSE per zone.",
            },
            {
              icon: Users,
              title: "Digital signatures",
              desc: "Retailer and staff sign on any device and receive the PDF by email.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-5 text-left"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#245bc1] text-white">
                <f.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <dt className="text-sm font-semibold">{f.title}</dt>
              <dd className="text-sm leading-relaxed text-muted-foreground">{f.desc}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  )
}
