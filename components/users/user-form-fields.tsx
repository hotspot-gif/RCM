"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BRANCHES, ROLES, ZONES_BY_BRANCH, type Branch, type Role } from "@/lib/branches"

interface Values {
  full_name: string
  email: string
  password?: string
  role: Role
  branch: string | null
  zone: string | null
}

interface Props {
  values: Values
  onChange: (patch: Partial<Values>) => void
  includePassword?: boolean
  emailDisabled?: boolean
}

export function UserFormFields({
  values,
  onChange,
  includePassword,
  emailDisabled,
}: Props) {
  const zones = values.branch
    ? (ZONES_BY_BRANCH[values.branch as Branch] ?? [])
    : []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="full_name">Full name</Label>
        <Input
          id="full_name"
          value={values.full_name}
          onChange={(e) => onChange({ full_name: e.target.value })}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={values.email}
          disabled={emailDisabled}
          onChange={(e) => onChange({ email: e.target.value })}
          required
        />
      </div>

      {includePassword ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Temporary password</Label>
          <Input
            id="password"
            type="password"
            minLength={6}
            value={values.password ?? ""}
            onChange={(e) => onChange({ password: e.target.value })}
            required
          />
          <p className="text-xs text-muted-foreground">
            The user can change this after first sign in.
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label>Role</Label>
        <Select
          value={values.role}
          onValueChange={(v) =>
            onChange({
              role: v as Role,
              // Reset scope fields when switching to ADMIN
              branch: v === "ADMIN" ? null : values.branch,
              zone: v === "ADMIN" || v === "ASM" ? null : values.zone,
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {values.role !== "ADMIN" ? (
        <div className="flex flex-col gap-2">
          <Label>Branch</Label>
          <Select
            value={values.branch ?? ""}
            onValueChange={(v) =>
              onChange({ branch: v, zone: null })
            }
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
        </div>
      ) : null}

      {values.role === "FSE" ? (
        <div className="flex flex-col gap-2">
          <Label>Zone</Label>
          <Select
            value={values.zone ?? ""}
            onValueChange={(v) => onChange({ zone: v })}
            disabled={!values.branch}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={values.branch ? "Select zone" : "Select a branch first"}
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
        </div>
      ) : null}
    </div>
  )
}
