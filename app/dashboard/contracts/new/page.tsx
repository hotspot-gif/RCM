import { requireUser } from "@/lib/auth"
import { NewContractForm } from "@/components/contracts/new-contract-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function NewContractPage() {
  const user = await requireUser()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New contract</h1>
        <p className="text-sm text-muted-foreground">
          Fill out the retailer details. A draft contract will be generated for signing.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Retailer details</CardTitle>
          <CardDescription>
            All fields marked with an asterisk are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewContractForm currentUser={user} />
        </CardContent>
      </Card>
    </div>
  )
}
