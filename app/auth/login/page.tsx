import { LoginForm } from "@/components/auth/login-form"
import { FileSignature } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="w-full">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#21264e] text-[#fff7f2]">
          <FileSignature className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to manage retailer contracts.
        </p>
      </div>
      <LoginForm />
    </div>
  )
}
