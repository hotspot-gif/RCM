import Link from "next/link"
import { ExternalLink, LayoutDashboard, FileText, Users2, FileSignature, ArrowRight, ShieldCheck, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { FieldIQIcon } from "@/components/dashboard/field-iq-icon"
import { BranchCoverageMap } from "@/components/home/branch-coverage-map"
import Image from "next/image"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="min-h-dvh bg-brand-cream font-sans text-brand-navy selection:bg-brand-blue/10">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-brand-navy/5 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link href="/" className="transition-opacity hover:opacity-90">
              <Image 
                src="https://cms-assets.ldsvcplatform.com/IT/s3fs-public/2023-09/home_logo.png"
                alt="Universal Service Logo"
                width={160} 
                height={45} 
                className="h-9 w-auto object-contain"
                priority
              />
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Button asChild variant="secondary" className="bg-brand-navy text-brand-cream hover:bg-brand-navy/90">
                <Link href="/dashboard" className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Go to Dashboard
                </Link>
              </Button>
            ) : (
              <Button asChild className="bg-brand-blue text-white hover:bg-brand-blue/90">
                <Link href="/auth/login" className="flex items-center gap-2">
                  <Users2 className="h-4 w-4" />
                  Staff Login
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-brand-navy/5 px-6 pt-16 pb-12 lg:px-8 lg:pt-24 lg:pb-16">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_50%,#245bc108_0%,transparent_100%)]" />
        <div className="mx-auto max-w-7xl text-center">
          <div className="mb-6 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-peach/30 bg-brand-peach/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-brand-navy uppercase">
              <Zap className="h-3.5 w-3.5 text-brand-blue" />
              Unified Information Hub
            </span>
          </div>
          <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-brand-navy sm:text-7xl">
            Empowering Our <span className="text-brand-blue">Teams</span>
          </h1>
          <p className="mx-auto max-w-2xl text-xl leading-relaxed text-slate-600">
            A single, professional platform to access critical incentives, 
            contract management tools, and real-time performance analytics.
          </p>
        </div>
      </section>

      {/* Hub Grid */}
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="mb-16 flex flex-col items-center justify-between gap-4 md:flex-row md:items-end">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-brand-navy">Core Resources</h2>
            <p className="mt-2 text-slate-600">Quick access to all operational dashboards and schemes.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* RCM Card */}
          <Card className="group relative flex flex-col overflow-hidden border-none bg-white shadow-sm ring-1 ring-brand-navy/5 transition-all hover:shadow-xl hover:ring-brand-blue/20">
            <div className="absolute top-0 h-1.5 w-full bg-brand-purple" />
            <CardHeader className="pb-4">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-navy text-brand-cream shadow-inner group-hover:scale-110 transition-transform">
                <FileSignature className="h-7 w-7" />
              </div>
              <CardTitle className="text-2xl font-bold text-brand-navy">RCM</CardTitle>
              <CardDescription className="text-slate-500">Retailer Contract Management System</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto flex flex-col gap-6 pt-0">
              <p className="text-sm leading-relaxed text-slate-600">
                Generate, sign, and dispatch retailer contracts in minutes with full branch and zone level control.
              </p>
              <Button asChild className="w-full bg-brand-purple text-white hover:bg-brand-purple/90 group-hover:gap-3 transition-all">
                <Link href="/auth/login" className="flex items-center justify-center">
                  Open RCM Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Field IQ Card */}
          <Card className="group relative flex flex-col overflow-hidden border-none bg-white shadow-sm ring-1 ring-brand-navy/5 transition-all hover:shadow-xl hover:ring-brand-cyan/20 lg:scale-105 lg:shadow-md lg:z-10">
            <div className="absolute top-0 h-1.5 w-full bg-brand-cyan" />
            <CardHeader className="pb-4">
              <div className="mb-4 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-brand-navy shadow-inner group-hover:scale-110 transition-transform">
                <FieldIQIcon />
              </div>
              <CardTitle className="text-2xl font-bold text-brand-navy">Field IQ</CardTitle>
              <CardDescription className="text-slate-500">Performance Analytics Dashboard</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto flex flex-col gap-6 pt-0">
              <ul className="space-y-3">
                {[
                  "Annual KPI & Retailer Incentive Analysis",
                  "Retailer Coverage & UAO Monitoring",
                  "CM Target vs Actual Performance Analysis"
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full bg-brand-cyan text-brand-navy font-bold hover:bg-brand-cyan/90 group-hover:gap-3 transition-all">
                <Link href="https://hs-ita.vercel.app/" target="_blank" className="flex items-center justify-center">
                  Launch Field IQ
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Retailer Incentives Card */}
          <Card className="group relative flex flex-col overflow-hidden border-none bg-white shadow-sm ring-1 ring-brand-navy/5 transition-all hover:shadow-xl hover:ring-brand-yellow/20">
            <div className="absolute top-0 h-1.5 w-full bg-brand-yellow" />
            <CardHeader className="pb-4">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-navy text-brand-yellow shadow-inner group-hover:scale-110 transition-transform">
                <Zap className="h-7 w-7" />
              </div>
              <CardTitle className="text-2xl font-bold text-brand-navy">Retailer Incentives</CardTitle>
              <CardDescription className="text-slate-500">Normal & special retailer schemes</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto flex flex-col gap-4 pt-0">
              <div className="flex flex-col gap-3">
                <Link 
                  href="https://hotspot-gif.github.io/std-kb/" 
                  target="_blank"
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3 transition-colors hover:bg-brand-yellow/5 hover:border-brand-yellow/20"
                >
                  <span className="text-sm font-semibold">Normal Retailer Scheme</span>
                  <ExternalLink className="h-4 w-4 text-slate-400" />
                </Link>
                <Link 
                  href="https://hotspot-gif.github.io/spl-kb/" 
                  target="_blank"
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3 transition-colors hover:bg-brand-yellow/5 hover:border-brand-yellow/20"
                >
                  <span className="text-sm font-semibold">Special Retailer Scheme</span>
                  <ExternalLink className="h-4 w-4 text-slate-400" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Staff Incentives Card */}
          <Card className="group relative flex flex-col overflow-hidden border-none bg-white shadow-sm ring-1 ring-brand-navy/5 transition-all hover:shadow-xl hover:ring-brand-green/20">
            <div className="absolute top-0 h-1.5 w-full bg-brand-green" />
            <CardHeader className="pb-4">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-navy text-brand-green shadow-inner group-hover:scale-110 transition-transform">
                <FileText className="h-7 w-7" />
              </div>
              <CardTitle className="text-2xl font-bold text-brand-navy">Staff Incentives</CardTitle>
              <CardDescription className="text-slate-500">Staff reward program</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto flex flex-col gap-4 pt-0">
              <Link
                href="https://hotspot-gif.github.io/STAFF-INCENTIVE/"
                target="_blank"
                className="flex items-center justify-between rounded-lg bg-brand-navy p-3 text-brand-cream transition-opacity hover:opacity-90"
              >
                <span className="text-sm font-bold uppercase tracking-wider">Staff Incentive Scheme</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
        <BranchCoverageMap />
      </section>

      {/* Trust/Footer Section */}
      <footer className="mt-auto border-t border-brand-navy/5 bg-white py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <Image 
              src="https://cms-assets.ldsvcplatform.com/IT/s3fs-public/2023-09/home_logo.png"
              alt="Universal Service Logo"
              width={120} 
              height={34} 
              className="h-7 w-auto object-contain grayscale opacity-50"
            />
            <p className="text-sm text-slate-400">
              Contact your administrator to obtain access credentials for the Field IQ and RCM applications.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
