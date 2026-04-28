"use client"

import { useState, useTransition, type FormEvent, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BRANCHES, ZONES_BY_BRANCH, type Branch } from "@/lib/branches"
import { createContractAction, updateContractAction } from "@/app/dashboard/contracts/actions"
import type { AppUser, Contract } from "@/lib/types"

const initial = {
  company_name: "",
  vat_number: "",
  contact_first_name: "",
  contact_last_name: "",
  shop_name: "",
  street: "",
  house_number: "",
  city: "",
  post_code: "",
  landline_number: "",
  mobile_number: "",
  email: "",
  branch: "" as string,
  zone: "" as string,
}

type FormValues = typeof initial

function toLocalPhone(value: string | null | undefined) {
  const digits = (value ?? "").replace(/\D/g, "")
  if (digits.startsWith("39") && digits.length >= 12) return digits.slice(2, 12)
  return digits.slice(0, 10)
}

export function NewContractForm({
  currentUser,
  mode = "create",
  contractId,
  initialValues,
}: {
  currentUser: AppUser
  mode?: "create" | "edit"
  contractId?: string
  initialValues?: Partial<Pick<
    Contract,
    | "company_name"
    | "vat_number"
    | "contact_first_name"
    | "contact_last_name"
    | "shop_name"
    | "street"
    | "house_number"
    | "city"
    | "post_code"
    | "landline_number"
    | "mobile_number"
    | "email"
    | "branch"
    | "zone"
  >>
}) {
  const router = useRouter()
  const [values, setValues] = useState<FormValues>(() => ({
    ...initial,
    company_name: initialValues?.company_name ?? "",
    vat_number: initialValues?.vat_number ?? "",
    contact_first_name: initialValues?.contact_first_name ?? "",
    contact_last_name: initialValues?.contact_last_name ?? "",
    shop_name: initialValues?.shop_name ?? "",
    street: initialValues?.street ?? "",
    house_number: initialValues?.house_number ?? "",
    city: initialValues?.city ?? "",
    post_code: initialValues?.post_code ?? "",
    landline_number: toLocalPhone(initialValues?.landline_number),
    mobile_number: toLocalPhone(initialValues?.mobile_number),
    email: initialValues?.email ?? "",
    branch: initialValues?.branch ?? currentUser.branch ?? "",
    zone: initialValues?.zone ?? currentUser.zone ?? "",
  }))
  const [pending, startTransition] = useTransition()

  const canEditBranch = currentUser.role === "ADMIN"
  const canEditZone = currentUser.role === "ADMIN" || currentUser.role === "ASM"
  const zones = values.branch
    ? (ZONES_BY_BRANCH[values.branch as Branch] ?? [])
    : []

  function update<K extends keyof typeof values>(key: K, v: (typeof values)[K]) {
    setValues((prev) => ({ ...prev, [key]: v }))
  }

  function submit(e: FormEvent) {
    e.preventDefault()

    const mobileClean = values.mobile_number.replace(/\D/g, "")
    const landlineClean = values.landline_number.replace(/\D/g, "")
    const postCodeClean = values.post_code.replace(/\D/g, "")

    if (mobileClean.length !== 10) {
      toast.error("Mobile number must be exactly 10 digits")
      return
    }
    if (landlineClean && landlineClean.length !== 10) {
      toast.error("Landline number must be exactly 10 digits")
      return
    }
    if (postCodeClean.length !== 5) {
      toast.error("Post code must be exactly 5 digits")
      return
    }

    const email = values.email.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address")
      return
    }

    startTransition(async () => {
      const payload = {
        company_name: values.company_name.trim(),
        vat_number: values.vat_number.trim(),
        contact_first_name: values.contact_first_name.trim(),
        contact_last_name: values.contact_last_name.trim(),
        shop_name: values.shop_name.trim(),
        street: values.street.trim(),
        house_number: values.house_number.trim(),
        city: values.city.trim(),
        post_code: postCodeClean,
        landline_number: landlineClean ? `+39${landlineClean}` : null,
        mobile_number: `+39${mobileClean}`,
        email: email,
        branch: values.branch || null,
        zone: values.zone || null,
      }

      if (mode === "edit") {
        if (!contractId) {
          toast.error("Missing contract id")
          return
        }
        const res = await updateContractAction({ id: contractId, ...payload })
        if (!res.ok) {
          toast.error(res.error)
          return
        }
        toast.success("Contract updated")
        router.push(`/dashboard/contracts/${contractId}`)
        router.refresh()
        return
      }

      const res = await createContractAction(payload)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Contract created")
      router.push(`/dashboard/contracts/${res.data!.id}`)
    })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Company name" required>
          <Input
            value={values.company_name}
            onChange={(e) => update("company_name", e.target.value)}
            required
          />
        </Field>
        <Field label="VAT number" required>
          <Input
            type="tel"
            inputMode="numeric"
            value={values.vat_number}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 11)
              update("vat_number", v)
            }}
            placeholder="P.IVA (max 11 digits)"
            required
          />
        </Field>
        <Field label="Contact first name" required>
          <Input
            value={values.contact_first_name}
            onChange={(e) => update("contact_first_name", e.target.value)}
            required
          />
        </Field>
        <Field label="Contact last name" required>
          <Input
            value={values.contact_last_name}
            onChange={(e) => update("contact_last_name", e.target.value)}
            required
          />
        </Field>
        <Field label="Shop name" required className="md:col-span-2">
          <Input
            value={values.shop_name}
            onChange={(e) => update("shop_name", e.target.value)}
            required
          />
        </Field>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Field label="Street" required className="md:col-span-3">
          <Input
            value={values.street}
            onChange={(e) => update("street", e.target.value)}
            required
          />
        </Field>
        <Field label="House no." required>
          <Input
            value={values.house_number}
            onChange={(e) => update("house_number", e.target.value)}
            required
          />
        </Field>
        <Field label="Post code" required>
          <Input
            value={values.post_code}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 5)
              update("post_code", v)
            }}
            placeholder="CAP"
            required
          />
        </Field>
        <Field label="City" required className="md:col-span-3">
          <Input
            value={values.city}
            onChange={(e) => update("city", e.target.value)}
            required
          />
        </Field>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Mobile number" required>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">+39</span>
            <Input
              type="tel"
              value={values.mobile_number}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 10)
                update("mobile_number", v)
              }}
              placeholder="Mobile Number"
              required
            />
          </div>
        </Field>
        <Field label="Landline number">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">+39</span>
            <Input
              type="tel"
              value={values.landline_number}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 10)
                update("landline_number", v)
              }}
              placeholder="Landline Number"
            />
          </div>
        </Field>
        <Field label="Email" required className="md:col-span-2">
          <Input
            type="email"
            value={values.email}
            onChange={(e) => update("email", e.target.value)}
            required
          />
        </Field>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Branch">
          <Select
            value={values.branch}
            onValueChange={(v) => {
              update("branch", v)
              update("zone", "")
            }}
            disabled={!canEditBranch}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              {BRANCHES.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Zone">
          <Select
            value={values.zone}
            onValueChange={(v) => update("zone", v)}
            disabled={!canEditZone || !values.branch}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={values.branch ? "Select zone" : "Choose branch first"}
              />
            </SelectTrigger>
            <SelectContent>
              {zones.map((z) => (
                <SelectItem key={z} value={z}>
                  {z}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </section>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? <Spinner className="mr-2 h-4 w-4" /> : null}
          {mode === "edit" ? "Save changes" : "Create contract"}
        </Button>
      </div>
    </form>
  )
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string
  required?: boolean
  className?: string
  children: ReactNode
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-")
  return (
    <div className={`flex flex-col gap-2 ${className ?? ""}`}>
      <Label htmlFor={id}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      <div id={id}>{children}</div>
    </div>
  )
}
