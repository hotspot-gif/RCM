import Link from "next/link"
import { ExternalLink, LayoutDashboard, FileText, BarChart3, Users2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import Image from "next/image"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="min-h-dvh bg-slate-50 text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Image 
              src="https://cms-assets.ldsvcplatform.com/IT/s3fs-public/2023-09/home_logo.png"
              alt="Universal Service Logo"
              width={180} 
              height={50} 
              className="h-10 w-auto object-contain"
            />
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Button asChild variant="outline">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/auth/login">Staff Login</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12 md:py-20">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
            Staff Information Hub
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-600">
            Access all essential tools, incentive schemes, and performance dashboards in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Retailer Incentive Schemes */}
          <Card className="flex flex-col transition-all hover:shadow-lg">
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <LayoutDashboard className="h-6 w-6" />
              </div>
              <CardTitle>Retailer Incentive Scheme</CardTitle>
              <CardDescription>Guidelines and details for retailer rewards</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto flex flex-col gap-3">
              <Button asChild variant="outline" className="justify-between">
                <Link href="https://hotspot-gif.github.io/std-kb/" target="_blank">
                  Normal Scheme
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-between">
                <Link href="https://github.com/hotspot-gif/spl-kb" target="_blank">
                  Special Scheme
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Staff Incentive Scheme */}
          <Card className="flex flex-col transition-all hover:shadow-lg">
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                <Users2 className="h-6 w-6" />
              </div>
              <CardTitle>Staff Incentive Scheme</CardTitle>
              <CardDescription>Incentive scheme eligible for staff members</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button asChild className="w-full justify-between bg-green-600 hover:bg-green-700">
                <Link href="https://github.com/hotspot-gif/STAFF-INCENTIVE" target="_blank">
                  View Staff Scheme
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* RCM */}
          <Card className="flex flex-col transition-all hover:shadow-lg">
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                <FileText className="h-6 w-6" />
              </div>
              <CardTitle>RCM</CardTitle>
              <CardDescription>Retailer Contract Management System</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button asChild className="w-full justify-between bg-purple-600 hover:bg-purple-700">
                <Link href="/auth/login">
                  Open RCM Dashboard
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Field IQ */}
          <Card className="flex flex-col border-2 border-orange-100 bg-orange-50/30 transition-all hover:shadow-lg md:col-span-2 lg:col-span-1">
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                <BarChart3 className="h-6 w-6" />
              </div>
              <CardTitle>Field IQ</CardTitle>
              <CardDescription>KPI analysis, targets, and performance dashboard</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <ul className="mb-6 space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                  KPI & Past year KPI analysis
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                  Coverage & Distribution details
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                  Current month target vs actual
                </li>
              </ul>
              <Button asChild className="w-full justify-between bg-orange-600 hover:bg-orange-700">
                <Link href="https://hs-ita.vercel.app/" target="_blank">
                  Launch Field IQ
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="mt-auto border-t bg-white py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Universal Service 2006. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}
