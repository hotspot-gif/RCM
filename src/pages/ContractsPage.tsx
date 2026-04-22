import { useState, useMemo } from 'react'
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  Send,
  Trash2,
  ChevronDown,
  X,
  Eye,
  Building2,
  MapPin,
  Calendar,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useDataStore, Contract } from '../store/dataStore'
import { BRANCHES, BRANCH_ZONES } from '../data/constants'
import { format } from 'date-fns'

interface ContractsPageProps {
  onNavigate: (page: string, data?: unknown) => void
}

export default function ContractsPage({ onNavigate }: ContractsPageProps) {
  const { user } = useAuthStore()
  const { contracts, retailers, deleteContract, updateContract } = useDataStore()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterBranch, setFilterBranch] = useState('')
  const [filterZone, setFilterZone] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)

  const enrichedContracts = useMemo(() => {
    return contracts.map((c) => ({
      ...c,
      retailer: retailers.find((r) => r.id === c.retailer_id),
    }))
  }, [contracts, retailers])

  const filteredContracts = useMemo(() => {
    let list = enrichedContracts

    if (user?.role === 'ASM') list = list.filter((c) => c.branch === user.branch)
    else if (user?.role === 'FSE') list = list.filter((c) => c.zone === user.zone)

    if (filterStatus) list = list.filter((c) => c.status === filterStatus)
    if (filterBranch && user?.role === 'ADMIN') list = list.filter((c) => c.branch === filterBranch)
    if (filterZone) list = list.filter((c) => c.zone === filterZone)

    if (search) {
      const s = search.toLowerCase()
      list = list.filter(
        (c) =>
          c.retailer_name.toLowerCase().includes(s) ||
          c.contract_number.toLowerCase().includes(s) ||
          c.zone.toLowerCase().includes(s)
      )
    }

    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [enrichedContracts, user, search, filterStatus, filterBranch, filterZone])

  const zoneOptions = useMemo(() => {
    if (filterBranch && user?.role === 'ADMIN') {
      return BRANCH_ZONES[filterBranch as keyof typeof BRANCH_ZONES] || []
    }
    if (user?.role === 'ASM' && user.branch) {
      return BRANCH_ZONES[user.branch as keyof typeof BRANCH_ZONES] || []
    }
    return []
  }, [filterBranch, user])

  const handleDelete = (id: string) => {
    deleteContract(id)
    setShowDeleteConfirm(null)
  }

  const handleMarkSigned = (id: string) => {
    updateContract(id, { status: 'SIGNED' })
  }

  const getStatusBadge = (status: string) => {
    if (status === 'SIGNED')
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="w-3 h-3" /> Signed
        </span>
      )
    if (status === 'SENT')
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
          <Send className="w-3 h-3" /> Sent
        </span>
      )
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600">
        <Clock className="w-3 h-3" /> Pending
      </span>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#21264e' }}>
            Contracts
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {filteredContracts.length} contract{filteredContracts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => onNavigate('new-contract')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #245bc1, #46286E)' }}
        >
          <FileText className="w-4 h-4" />
          New Contract
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Signed', value: filteredContracts.filter((c) => c.status === 'SIGNED').length, color: '#08dc7d', bg: '#ECFDF5' },
          { label: 'Pending', value: filteredContracts.filter((c) => c.status === 'PENDING').length, color: '#f59e0b', bg: '#FFFBEB' },
          { label: 'Sent', value: filteredContracts.filter((c) => c.status === 'SENT').length, color: '#245bc1', bg: '#EEF2FF' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: s.bg }}>
              <span className="text-sm font-bold" style={{ color: s.color }}>{s.value}</span>
            </div>
            <span className="text-sm font-medium text-gray-600">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-5">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search contracts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 appearance-none bg-white"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="SIGNED">Signed</option>
              <option value="SENT">Sent</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>

          {user?.role === 'ADMIN' && (
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={filterBranch}
                onChange={(e) => { setFilterBranch(e.target.value); setFilterZone('') }}
                className="pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 appearance-none bg-white min-w-40"
              >
                <option value="">All Branches</option>
                {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
          )}

          {zoneOptions.length > 0 && (
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={filterZone}
                onChange={(e) => setFilterZone(e.target.value)}
                className="pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 appearance-none bg-white min-w-44"
              >
                <option value="">All Zones</option>
                {zoneOptions.map((z) => <option key={z} value={z}>{z}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      {filteredContracts.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center py-16">
          <FileText className="w-12 h-12 text-gray-300 mb-3" />
          <h3 className="text-gray-500 font-semibold">No contracts found</h3>
          <p className="text-gray-400 text-sm mt-1">
            {search ? 'Try adjusting your search' : 'Generate your first contract'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#fff7f2' }}>
                  {['Contract #', 'Retailer', 'Date', 'Branch / Zone', 'Created By', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#21264e' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredContracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <span className="text-xs font-mono font-semibold" style={{ color: '#245bc1' }}>
                        {contract.contract_number}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #245bc1, #46286E)' }}
                        >
                          {contract.retailer_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{contract.retailer_name}</p>
                          {contract.retailer && (
                            <p className="text-xs text-gray-400">{contract.retailer.email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {format(new Date(contract.contract_date), 'dd MMM yyyy')}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-semibold px-2 py-1 rounded-lg block mb-1 w-fit" style={{ background: '#EEF2FF', color: '#245bc1' }}>
                        {contract.branch}
                      </span>
                      <span className="text-xs text-gray-500">{contract.zone}</span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-600">{contract.created_by_name}</p>
                    </td>
                    <td className="px-5 py-4">
                      {getStatusBadge(contract.status)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedContract(contract)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                          style={{ color: '#245bc1' }}
                          title="View contract"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {contract.status === 'PENDING' && (
                          <button
                            onClick={() => handleMarkSigned(contract.id)}
                            className="p-1.5 rounded-lg hover:bg-green-50 transition-colors text-emerald-500"
                            title="Mark as signed"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {user?.role === 'ADMIN' && (
                          <button
                            onClick={() => setShowDeleteConfirm(contract.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-400"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-center text-base font-bold text-gray-800 mb-2">Delete Contract</h3>
            <p className="text-center text-sm text-gray-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => handleDelete(showDeleteConfirm)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contract detail modal */}
      {selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 flex items-center justify-between sticky top-0" style={{ background: 'linear-gradient(135deg, #21264e, #46286E)' }}>
              <div>
                <h3 className="text-white font-bold">{selectedContract.contract_number}</h3>
                <p className="text-blue-200 text-xs">{selectedContract.retailer_name}</p>
              </div>
              <button onClick={() => setSelectedContract(null)} className="text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Contract Date</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {format(new Date(selectedContract.contract_date), 'dd MMMM yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Status</p>
                  {getStatusBadge(selectedContract.status)}
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Branch</p>
                  <p className="text-sm font-semibold text-gray-800">{selectedContract.branch}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Zone</p>
                  <p className="text-sm font-semibold text-gray-800">{selectedContract.zone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Created By</p>
                  <p className="text-sm font-semibold text-gray-800">{selectedContract.created_by_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Created At</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {format(new Date(selectedContract.created_at), 'dd MMM yyyy HH:mm')}
                  </p>
                </div>
              </div>

              {selectedContract.retailer && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Retailer Details</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-400">VAT Number</p>
                      <p className="font-medium">{selectedContract.retailer.vat_number}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Contact</p>
                      <p className="font-medium">{selectedContract.retailer.contact_person_name} {selectedContract.retailer.contact_person_surname}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Mobile</p>
                      <p className="font-medium">{selectedContract.retailer.mobile_number}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Email</p>
                      <p className="font-medium truncate">{selectedContract.retailer.email}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400">Address</p>
                      <p className="font-medium">{selectedContract.retailer.address_lane} {selectedContract.retailer.house_number}, {selectedContract.retailer.postcode} {selectedContract.retailer.city}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedContract.retailer_signature && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Retailer Signature</p>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-xs text-gray-500 mt-1">Signature captured</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                {selectedContract.status === 'PENDING' && (
                  <button
                    onClick={() => { handleMarkSigned(selectedContract.id); setSelectedContract(null) }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ background: '#08dc7d' }}
                  >
                    Mark as Signed
                  </button>
                )}
                <button
                  onClick={() => setSelectedContract(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
