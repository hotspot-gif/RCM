import React from 'react'
import { LucideIcon } from 'lucide-react'

interface InputFieldProps {
  label: string
  field: string
  value: string
  onChange: (field: string, value: string) => void
  type?: string
  placeholder?: string
  required?: boolean
  readOnly?: boolean
  icon?: LucideIcon
  errors?: Record<string, string | undefined>
}

export default function InputField({
  label,
  field,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  readOnly = false,
  icon: Icon,
  errors,
}: InputFieldProps) {
  const error = errors?.[field]

  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#21264e' }}>
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`w-full ${Icon ? 'pl-9' : 'pl-3'} pr-3 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
            error ? 'border-red-300 bg-red-50' : readOnly ? 'border-gray-100 bg-gray-50 text-gray-500' : 'border-gray-200 focus:border-blue-400'
          }`}
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}