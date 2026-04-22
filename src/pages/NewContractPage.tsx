import { useState, useRef, useCallback } from 'react'
import React from 'react'
import {
  FileText,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Check,
  ChevronDown,
  AlertCircle,
  Send,
  Printer,
  ArrowLeft,
  Hash,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useDataStore, Retailer } from '../store/dataStore'
import { BRANCHES, BRANCH_ZONES } from '../data/constants'
import { format } from 'date-fns'
import SignaturePad from '../components/SignaturePad'

interface NewContractPageProps {
  onNavigate: (page: string) => void
  prefillRetailer?: Retailer | null
}

interface FormData {
  company_name: string
  vat_number: string
  address_lane: string
  house_number: string
  city: string
  postcode: string
  contact_person_name: string
  contact_person_surname: string
  mobile_number: string
  landline_number: string
  email: string
  branch: string
  zone: string
  retailer_email: string
  staff_email: string
}

const generateContractNumber = () => {
  const year = new Date().getFullYear()
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `LMIT-${year}-${rand}`
}

const generateRetailerId = () => `ret-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
const generateContractId = () => `con-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`

export default function NewContractPage({ onNavigate, prefillRetailer }: NewContractPageProps) {
  const { user } = useAuthStore()
  const { addRetailer, addContract } = useDataStore()
  const today = format(new Date(), 'yyyy-MM-dd')
  const printRef = useRef<HTMLDivElement>(null)

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [signature, setSignature] = useState<string | null>(null)
  const [signatureSaved, setSignatureSaved] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [contractNumber] = useState(generateContractNumber())
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [useExistingRetailer, setUseExistingRetailer] = useState(false)
  const [selectedExistingId, setSelectedExistingId] = useState('')

  const availableRetailers = useDataStore.getState().retailers.filter((r) => {
    if (!user) return false
    if (user.role === 'ADMIN') return true
    if (user.role === 'ASM') return r.branch === user.branch
    return r.zone === user.zone
  })

  const [form, setForm] = useState<FormData>({
    company_name: prefillRetailer?.company_name || '',
    vat_number: prefillRetailer?.vat_number || '',
    address_lane: prefillRetailer?.address_lane || '',
    house_number: prefillRetailer?.house_number || '',
    city: prefillRetailer?.city || '',
    postcode: prefillRetailer?.postcode || '',
    contact_person_name: prefillRetailer?.contact_person_name || '',
    contact_person_surname: prefillRetailer?.contact_person_surname || '',
    mobile_number: prefillRetailer?.mobile_number || '',
    landline_number: prefillRetailer?.landline_number || '',
    email: prefillRetailer?.email || '',
    branch: prefillRetailer?.branch || user?.branch || '',
    zone: prefillRetailer?.zone || user?.zone || '',
    retailer_email: prefillRetailer?.email || '',
    staff_email: user?.email || '',
  })

  const handleChange = useCallback((field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
    if (field === 'branch') {
      setForm((prev) => ({ ...prev, branch: value, zone: '' }))
    }
  }, [errors])

  const handleSelectExisting = (retailerId: string) => {
    setSelectedExistingId(retailerId)
    const r = availableRetailers.find((ret) => ret.id === retailerId)
    if (r) {
      setForm((prev) => ({
        ...prev,
        company_name: r.company_name,
        vat_number: r.vat_number,
        address_lane: r.address_lane,
        house_number: r.house_number,
        city: r.city,
        postcode: r.postcode,
        contact_person_name: r.contact_person_name,
        contact_person_surname: r.contact_person_surname,
        mobile_number: r.mobile_number,
        landline_number: r.landline_number,
        email: r.email,
        branch: r.branch,
        zone: r.zone,
        retailer_email: r.email,
      }))
    }
  }

  const validateStep1 = () => {
    const newErrors: Partial<FormData> = {}
    const required: (keyof FormData)[] = [
      'company_name', 'vat_number', 'address_lane', 'house_number',
      'city', 'postcode', 'contact_person_name', 'contact_person_surname',
      'mobile_number', 'email', 'branch', 'zone',
    ]
    required.forEach((field) => {
      if (!form[field]) newErrors[field] = 'This field is required'
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    if (!signatureSaved) return false
    return true
  }

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) setStep(2)
    if (step === 2 && validateStep2()) setStep(3)
  }

  const handleSubmit = () => {
    const existingRetailer = selectedExistingId
      ? availableRetailers.find((r) => r.id === selectedExistingId)
      : null

    let retailerId = existingRetailer?.id

    if (!existingRetailer) {
      retailerId = generateRetailerId()
      const newRetailer: Retailer = {
        id: retailerId,
        company_name: form.company_name,
        vat_number: form.vat_number,
        address_lane: form.address_lane,
        house_number: form.house_number,
        city: form.city,
        postcode: form.postcode,
        contact_person_name: form.contact_person_name,
        contact_person_surname: form.contact_person_surname,
        mobile_number: form.mobile_number,
        landline_number: form.landline_number,
        email: form.email,
        branch: form.branch,
        zone: form.zone,
        created_by: user?.id || '',
        created_by_name: user?.full_name || '',
        created_at: new Date().toISOString(),
      }
      addRetailer(newRetailer)
    }

    addContract({
      id: generateContractId(),
      retailer_id: retailerId!,
      retailer_name: form.company_name,
      contract_number: contractNumber,
      status: signature ? 'SIGNED' : 'PENDING',
      retailer_signature: signature,
      contract_date: today,
      created_by: user?.id || '',
      created_by_name: user?.full_name || '',
      branch: form.branch,
      zone: form.zone,
      pdf_url: null,
      created_at: new Date().toISOString(),
    })

    setSubmitted(true)
  }

  const handlePrint = () => {
    window.print()
  }

  const zoneOptions = form.branch ? BRANCH_ZONES[form.branch as keyof typeof BRANCH_ZONES] || [] : []

  const InputField = ({
    label,
    field,
    type = 'text',
    placeholder,
    required = false,
    readOnly = false,
    icon: Icon,
  }: {
    label: string
    field: keyof FormData
    type?: string
    placeholder?: string
    required?: boolean
    readOnly?: boolean
    icon?: React.ElementType
  }) => (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#21264e' }}>
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />}
        <input
          type={type}
          value={form[field]}
          onChange={(e) => handleChange(field, e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`w-full ${Icon ? 'pl-9' : 'pl-3'} pr-3 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
            errors[field] ? 'border-red-300 bg-red-50' : readOnly ? 'border-gray-100 bg-gray-50 text-gray-500' : 'border-gray-200 focus:border-blue-400'
          }`}
        />
      </div>
      {errors[field] && <p className="text-xs text-red-500 mt-1">{errors[field]}</p>}
    </div>
  )

  if (submitted) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: '#ECFDF5' }}
          >
            <Check className="w-10 h-10" style={{ color: '#08dc7d' }} />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#21264e' }}>
            Contract Created!
          </h2>
          <p className="text-gray-500 mb-2">
            Contract <span className="font-semibold text-gray-800">{contractNumber}</span> has been
            successfully generated.
          </p>
          <p className="text-sm text-gray-400 mb-6">
            A copy has been sent to <strong>{form.retailer_email}</strong> and{' '}
            <strong>{form.staff_email}</strong>
          </p>

          {/* Contract preview */}
          <div className="bg-gray-50 rounded-2xl p-4 text-left mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Company</span>
              <span className="font-semibold text-gray-800">{form.company_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Contract #</span>
              <span className="font-mono font-semibold" style={{ color: '#245bc1' }}>{contractNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Date</span>
              <span className="font-semibold text-gray-800">{format(new Date(), 'dd MMMM yyyy')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Status</span>
              <span className="font-semibold text-emerald-500">{signature ? 'Signed' : 'Pending'}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <Printer className="w-4 h-4" />
              Print / PDF
            </button>
            <button
              onClick={() => onNavigate('contracts')}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #245bc1, #46286E)' }}
            >
              View Contracts
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => step === 1 ? onNavigate('contracts') : setStep((s) => (s - 1) as 1 | 2 | 3)}
          className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#21264e' }}>
            New Contract
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {contractNumber} · {format(new Date(), 'dd MMMM yyyy')}
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0 mb-8">
        {[
          { n: 1, label: 'Retailer Details' },
          { n: 2, label: 'Signature' },
          { n: 3, label: 'Review & Send' },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  background: step >= s.n ? '#21264e' : '#f3f4f6',
                  color: step >= s.n ? 'white' : '#9ca3af',
                }}
              >
                {step > s.n ? <Check className="w-4 h-4" /> : s.n}
              </div>
              <span
                className="text-xs font-semibold hidden sm:block"
                style={{ color: step >= s.n ? '#21264e' : '#9ca3af' }}
              >
                {s.label}
              </span>
            </div>
            {i < 2 && (
              <div
                className="flex-1 h-0.5 mx-3"
                style={{ background: step > s.n ? '#21264e' : '#e5e7eb' }}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Retailer Details */}
      {step === 1 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          {/* Toggle existing / new */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setUseExistingRetailer(false)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${!useExistingRetailer ? 'border-blue-400 text-blue-600 bg-blue-50' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            >
              New Retailer
            </button>
            <button
              type="button"
              onClick={() => setUseExistingRetailer(true)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${useExistingRetailer ? 'border-blue-400 text-blue-600 bg-blue-50' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            >
              Existing Retailer
            </button>
          </div>

          {useExistingRetailer && (
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#21264e' }}>
                Select Retailer
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={selectedExistingId}
                  onChange={(e) => handleSelectExisting(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 appearance-none bg-white"
                >
                  <option value="">Choose a retailer...</option>
                  {availableRetailers.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.company_name} — {r.city}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <InputField
                label="Company Name"
                field="company_name"
                placeholder="Company SRL"
                required
                icon={Building2}
                readOnly={useExistingRetailer && !!selectedExistingId}
              />
            </div>
            <InputField
              label="VAT Number"
              field="vat_number"
              placeholder="IT12345678901"
              required
              icon={Hash}
              readOnly={useExistingRetailer && !!selectedExistingId}
            />
            <InputField
              label="Email"
              field="email"
              type="email"
              placeholder="company@email.com"
              required
              icon={Mail}
              readOnly={useExistingRetailer && !!selectedExistingId}
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Address</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Address Lane"
                field="address_lane"
                placeholder="Via Roma"
                required
                icon={MapPin}
                readOnly={useExistingRetailer && !!selectedExistingId}
              />
              <InputField
                label="House Number"
                field="house_number"
                placeholder="42"
                required
                readOnly={useExistingRetailer && !!selectedExistingId}
              />
              <InputField
                label="City"
                field="city"
                placeholder="Milano"
                required
                readOnly={useExistingRetailer && !!selectedExistingId}
              />
              <InputField
                label="Postcode"
                field="postcode"
                placeholder="20100"
                required
                readOnly={useExistingRetailer && !!selectedExistingId}
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Contact Person</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="First Name"
                field="contact_person_name"
                placeholder="Mario"
                required
                icon={User}
                readOnly={useExistingRetailer && !!selectedExistingId}
              />
              <InputField
                label="Surname"
                field="contact_person_surname"
                placeholder="Rossi"
                required
                readOnly={useExistingRetailer && !!selectedExistingId}
              />
              <InputField
                label="Mobile Number"
                field="mobile_number"
                type="tel"
                placeholder="+39 333 1234567"
                required
                icon={Phone}
                readOnly={useExistingRetailer && !!selectedExistingId}
              />
              <InputField
                label="Landline Number"
                field="landline_number"
                type="tel"
                placeholder="+39 02 1234567"
                icon={Phone}
                readOnly={useExistingRetailer && !!selectedExistingId}
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Assignment</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#21264e' }}>
                  Branch <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={form.branch}
                    onChange={(e) => handleChange('branch', e.target.value)}
                    disabled={user?.role !== 'ADMIN' || (useExistingRetailer && !!selectedExistingId)}
                    className={`w-full pl-9 pr-8 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-blue-400 appearance-none ${
                      errors.branch ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    } ${user?.role !== 'ADMIN' ? 'bg-gray-50' : 'bg-white'}`}
                  >
                    <option value="">Select branch...</option>
                    {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                </div>
                {errors.branch && <p className="text-xs text-red-500 mt-1">{errors.branch}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#21264e' }}>
                  Zone <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={form.zone}
                    onChange={(e) => handleChange('zone', e.target.value)}
                    disabled={user?.role === 'FSE' || (useExistingRetailer && !!selectedExistingId)}
                    className={`w-full pl-9 pr-8 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-blue-400 appearance-none ${
                      errors.zone ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    } ${user?.role === 'FSE' ? 'bg-gray-50' : 'bg-white'}`}
                  >
                    <option value="">Select zone...</option>
                    {zoneOptions.map((z) => <option key={z} value={z}>{z}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                </div>
                {errors.zone && <p className="text-xs text-red-500 mt-1">{errors.zone}</p>}
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-600">
              Contract date is automatically set to today: <strong>{format(new Date(), 'dd MMMM yyyy')}</strong>
            </p>
          </div>

          <button
            onClick={handleNextStep}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #245bc1, #46286E)' }}
          >
            Continue to Signature →
          </button>
        </div>
      )}

      {/* Step 2: Signature */}
      {step === 2 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold mb-1" style={{ color: '#21264e' }}>
              Collect Retailer Signature
            </h3>
            <p className="text-sm text-gray-500">
              Ask the retailer to sign in the box below using their finger or stylus.
            </p>
          </div>

          {/* Contract summary */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Company</span>
              <span className="font-semibold text-gray-800">{form.company_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">VAT</span>
              <span className="font-mono text-gray-700">{form.vat_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Contract #</span>
              <span className="font-mono font-semibold" style={{ color: '#245bc1' }}>{contractNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Date</span>
              <span className="text-gray-700">{format(new Date(), 'dd MMMM yyyy')}</span>
            </div>
          </div>

          <SignaturePad
            onSave={(dataUrl) => {
              setSignature(dataUrl)
              setSignatureSaved(true)
            }}
            onClear={() => {
              setSignature(null)
              setSignatureSaved(false)
            }}
          />

          {!signatureSaved && (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-xs">Please capture the signature before continuing, or skip to create a pending contract.</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setSignatureSaved(false); setSignature(null); setStep(3) }}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Skip (Pending)
            </button>
            <button
              onClick={handleNextStep}
              disabled={!signatureSaved}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #245bc1, #46286E)' }}
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Send */}
      {step === 3 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          <div>
            <h3 className="text-base font-bold mb-1" style={{ color: '#21264e' }}>
              Review & Send
            </h3>
            <p className="text-sm text-gray-500">
              Confirm details and send the contract copies via email.
            </p>
          </div>

          {/* Full contract preview */}
          <div
            ref={printRef}
            className="border border-gray-200 rounded-2xl overflow-hidden print:border-none"
          >
            {/* Header */}
            <div
              className="px-6 py-5 flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg, #21264e, #46286E)' }}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-5 h-5 text-white" />
                  <span className="text-white font-bold text-lg">RetailSign Contract</span>
                </div>
                <p className="text-blue-200 text-xs">LMIT Contract Management Platform</p>
              </div>
              <div className="text-right">
                <p className="text-white font-mono font-bold">{contractNumber}</p>
                <p className="text-blue-200 text-xs">{format(new Date(), 'dd MMMM yyyy')}</p>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Company Information</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">Company Name</p>
                    <p className="font-semibold text-gray-800">{form.company_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">VAT Number</p>
                    <p className="font-semibold font-mono text-gray-800">{form.vat_number}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400">Full Address</p>
                    <p className="font-semibold text-gray-800">
                      {form.address_lane} {form.house_number}, {form.postcode} {form.city}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Contact Person</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">Full Name</p>
                    <p className="font-semibold text-gray-800">
                      {form.contact_person_name} {form.contact_person_surname}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Mobile</p>
                    <p className="font-semibold text-gray-800">{form.mobile_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Landline</p>
                    <p className="font-semibold text-gray-800">{form.landline_number || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="font-semibold text-gray-800">{form.email}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Assignment</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">Branch</p>
                    <p className="font-semibold" style={{ color: '#245bc1' }}>{form.branch}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Zone</p>
                    <p className="font-semibold" style={{ color: '#46286E' }}>{form.zone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Staff Member</p>
                    <p className="font-semibold text-gray-800">{user?.full_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Signature</p>
                    <p className="font-semibold" style={{ color: signatureSaved ? '#08dc7d' : '#f59e0b' }}>
                      {signatureSaved ? '✓ Captured' : '⏳ Pending'}
                    </p>
                  </div>
                </div>
              </div>

              {signature && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Retailer Signature</p>
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                    <img src={signature} alt="Signature" className="max-h-24 mx-auto" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Email recipients */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Send Copies To
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#21264e' }}>
                  Retailer Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={form.retailer_email}
                    onChange={(e) => handleChange('retailer_email', e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#21264e' }}>
                  Staff Email
                </label>
                <div className="relative">
                  <Send className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={form.staff_email}
                    onChange={(e) => handleChange('staff_email', e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #08dc7d, #245bc1)' }}
          >
            <Check className="w-4 h-4" />
            Generate & Send Contract
          </button>
        </div>
      )}
    </div>
  )
}
