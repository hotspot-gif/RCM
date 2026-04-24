import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans-family",
  display: "swap",
})

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-family",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Retailer Contract Management",
  description:
    "Generate, sign and manage retailer distribution contracts for Universal Service 2006 / Lycamobile.",
  generator: "v0.app",
  icons: {
    icon: "https://cms-assets.ldsvcplatform.com/IT/s3fs-public/2023-09/MicrosoftTeams-image%20%2813%29.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable} bg-background`}>
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
        <Toaster richColors position="top-right" />
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
