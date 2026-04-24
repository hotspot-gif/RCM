"use client"

import { useState, useTransition } from "react"
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
import { createContractAction } from "@/app/dashboard/contracts/actions"
import type { AppUser } from "@/lib/types"

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

export function NewContractForm({ currentUser }: { currentUser: AppUser }) {
  const router = useRouter()
  const [values, setValues] = useState({
    ...initial,
    branch: currentUser.branch ?? "",
    zone: currentUser.zone ?? "",
  })
  const [pending, startTransition] = useTransition()

  const canEditBranch = currentUser.role === "ADMIN"
  const canEditZone = currentUser.role === "ADMIN" || currentUser.role === "ASM"
  const zones = values.branch
    ? (ZONES_BY_BRANCH[values.branch as Branch] ?? [])
    : []

  function update<K extends keyof typeof values>(key: K, v: (typeof values)[K]) {
    setValues((prev) => ({ ...prev, [key]: v }))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const res = await createContractAction({
        company_name: values.company_name.trim(),
        vat_number: values.vat_number.trim(),
        contact_first_name: values.contact_first_name.trim(),
        contact_last_name: values.contact_last_name.trim(),
        shop_name: values.shop_name.trim(),
        street: values.street.trim(),
        house_number: values.house_number.trim(),
        city: values.city.trim(),
        post_code: values.post_code.trim(),
        landline_number: values.landline_number.trim() || null,
        mobile_number: values.mobile_number.trim(),
        email: values.email.trim(),
        branch: values.branch || null,
        zone: values.zone || null,
      })
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
            value={values.vat_number}
            onChange={(e) => update("vat_number", e.target.value)}
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
            onChange={(e) => update("post_code", e.target.value)}
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
          <Input
            type="tel"
            value={values.mobile_number}
            onChange={(e) => update("mobile_number", e.target.value)}
            required
          />
        </Field>
        <Field label="Landline number">
          <Input
            type="tel"
            value={values.landline_number}
            onChange={(e) => update("landline_number", e.target.value)}
          />
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
          Create contract
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
  children: React.ReactNode
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
