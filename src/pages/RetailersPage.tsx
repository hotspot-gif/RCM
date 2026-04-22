import { useState, useMemo } from 'react'
import {
  Store,
  Search,
  Plus,
  Trash2,
  MapPin,
  Building2,
  Phone,
  Mail,
  ChevronDown,
  X,
  FileText,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useDataStore, Retailer } from '../store/dataStore'
import { BRANCHES, BRANCH_ZONES } from '../data/constants'
import { format } from 'date-fns'

interface RetailersPageProps {
  onNavigate: (page: string, data?: unknown) => void
}

export default function RetailersPage({ onNavigate }: RetailersPageProps) {
  const { user } = useAuthStore()
  const { retailers, deleteRetailer } = useDataStore()
  const [search, setSearch] = useState('')
  const [filterBranch, setFilterBranch] = useState('')
  const [filterZone, setFilterZone] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(null)

  const filteredRetailers = useMemo(() => {
    let list = retailers

    if (user?.role === 'ASM') list = list.filter((r) => r.branch === user.branch)
    else if (user?.role === 'FSE') list = list.filter((r) => r.zone === user.zone)

    if (filterBranch && user?.role === 'ADMIN') list = list.filter((r) => r.branch === filterBranch)
    if (filterZone) list = list.filter((r) => r.zone === filterZone)

    if (search) {
      const s = search.toLowerCase()
      list = list.filter(
        (r) =>
          r.company_name.toLowerCase().includes(s) ||
          r.vat_number.toLowerCase().includes(s) ||
          r.city.toLowerCase().includes(s) ||
          r.contact_person_name.toLowerCase().includes(s) ||
          r.contact_person_surname.toLowerCase().includes(s) ||
          r.email.toLowerCase().includes(s)
      )
    }

    return list
  }, [retailers, user, search, filterBranch, filterZone])

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
    deleteRetailer(id)
    setShowDeleteConfirm(null)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#21264e' }}>
            Retailers
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {filteredRetailers.length} retailer{filteredRetailers.length !== 1 ? 's' : ''} in your territory
          </p>
        </div>
        <button
          onClick={() => onNavigate('new-contract')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #245bc1, #46286E)' }}
        >
          <Plus className="w-4 h-4" />
          New Contract
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-5">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search retailers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
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
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
          )}

          {(zoneOptions.length > 0 || user?.role === 'ASM') && (
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={filterZone}
                onChange={(e) => setFilterZone(e.target.value)}
                className="pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 appearance-none bg-white min-w-44"
              >
                <option value="">All Zones</option>
                {zoneOptions.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      {filteredRetailers.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center py-16">
          <Store className="w-12 h-12 text-gray-300 mb-3" />
          <h3 className="text-gray-500 font-semibold">No retailers found</h3>
          <p className="text-gray-400 text-sm mt-1">
            {search ? 'Try adjusting your search' : 'Create a new contract to add a retailer'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#fff7f2' }}>
                  {['Company', 'VAT', 'Location', 'Contact', 'Branch / Zone', 'Added', 'Actions'].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                        style={{ color: '#21264e' }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRetailers.map((retailer) => (
                  <tr
                    key={retailer.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                          style={{ background: 'linear-gradient(135deg, #245bc1, #46286E)' }}
                        >
                          {retailer.company_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{retailer.company_name}</p>
                          <p className="text-xs text-gray-400">{retailer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-600 font-mono text-xs bg-gray-50 px-2 py-1 rounded-lg">
                        {retailer.vat_number}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-700">
                        {retailer.address_lane} {retailer.house_number}
                      </p>
                      <p className="text-xs text-gray-400">
                        {retailer.postcode} {retailer.city}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-700">
                        {retailer.contact_person_name} {retailer.contact_person_surname}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">{retailer.mobile_number}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="text-xs font-semibold px-2 py-1 rounded-lg block mb-1 w-fit"
                        style={{ background: '#EEF2FF', color: '#245bc1' }}
                      >
                        {retailer.branch}
                      </span>
                      <span className="text-xs text-gray-500">{retailer.zone}</span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs text-gray-400">
                        {format(new Date(retailer.created_at), 'dd MMM yyyy')}
                      </p>
                      <p className="text-xs text-gray-400">{retailer.created_by_name}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedRetailer(retailer)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                          style={{ color: '#245bc1' }}
                          title="View details"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onNavigate('new-contract', { prefillRetailer: retailer })}
                          className="p-1.5 rounded-lg hover:bg-purple-50 transition-colors"
                          style={{ color: '#46286E' }}
                          title="New contract"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        {(user?.role === 'ADMIN') && (
                          <button
                            onClick={() => setShowDeleteConfirm(retailer.id)}
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

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-center text-base font-bold text-gray-800 mb-2">Delete Retailer</h3>
            <p className="text-center text-sm text-gray-500 mb-5">
              This action cannot be undone. All associated contracts will remain.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Retailer detail modal */}
      {selectedRetailer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg, #21264e, #46286E)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold">
                  {selectedRetailer.company_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-white font-bold">{selectedRetailer.company_name}</h3>
                  <p className="text-blue-200 text-xs">{selectedRetailer.vat_number}</p>
                </div>
              </div>
              <button onClick={() => setSelectedRetailer(null)} className="text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Contact Person</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {selectedRetailer.contact_person_name} {selectedRetailer.contact_person_surname}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Email</p>
                  <p className="text-sm font-semibold text-gray-800">{selectedRetailer.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Mobile</p>
                  <p className="text-sm font-semibold text-gray-800">{selectedRetailer.mobile_number}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Landline</p>
                  <p className="text-sm font-semibold text-gray-800">{selectedRetailer.landline_number}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 mb-1">Address</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {selectedRetailer.address_lane} {selectedRetailer.house_number}, {selectedRetailer.postcode} {selectedRetailer.city}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Branch</p>
                  <span
                    className="text-xs font-semibold px-2 py-1 rounded-lg"
                    style={{ background: '#EEF2FF', color: '#245bc1' }}
                  >
                    {selectedRetailer.branch}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Zone</p>
                  <span
                    className="text-xs font-semibold px-2 py-1 rounded-lg"
                    style={{ background: '#F3F0FF', color: '#46286E' }}
                  >
                    {selectedRetailer.zone}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setSelectedRetailer(null); onNavigate('new-contract', { prefillRetailer: selectedRetailer }) }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #245bc1, #46286E)' }}
                >
                  Generate Contract
                </button>
                <button
                  onClick={() => setSelectedRetailer(null)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
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
