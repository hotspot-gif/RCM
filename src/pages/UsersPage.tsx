import { useState, useMemo } from 'react'
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  X,
  Check,
  Building2,
  MapPin,
  Shield,
  Mail,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { useDataStore, AppUser } from '../store/dataStore'
import { BRANCHES, BRANCH_ZONES } from '../data/constants'

export default function UsersPage() {
  const { users, addUser, updateUser, deleteUser } = useDataStore()
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<AppUser | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const emptyForm = {
    full_name: '',
    email: '',
    role: 'FSE' as 'ADMIN' | 'ASM' | 'FSE',
    branch: '',
    zone: '',
    is_active: true,
  }
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState<Partial<typeof emptyForm>>({})

  const filteredUsers = useMemo(() => {
    let list = users
    if (filterRole) list = list.filter((u) => u.role === filterRole)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(
        (u) =>
          u.full_name.toLowerCase().includes(s) ||
          u.email.toLowerCase().includes(s) ||
          u.role.toLowerCase().includes(s)
      )
    }
    return list
  }, [users, search, filterRole])

  const zoneOptions = useMemo(() => {
    if (form.branch) return BRANCH_ZONES[form.branch as keyof typeof BRANCH_ZONES] || []
    return []
  }, [form.branch])

  const getRoleBadge = (role: string) => {
    const styles: Record<string, { bg: string; color: string }> = {
      ADMIN: { bg: '#EEF2FF', color: '#245bc1' },
      ASM: { bg: '#ECFDF5', color: '#059669' },
      FSE: { bg: '#FFF7ED', color: '#ea580c' },
    }
    const s = styles[role] || styles.ADMIN
    return (
      <span
        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
        style={{ background: s.bg, color: s.color }}
      >
        <Shield className="w-3 h-3" />
        {role}
      </span>
    )
  }

  const validateForm = () => {
    const errors: Partial<typeof emptyForm> = {}
    if (!form.full_name) errors.full_name = 'Required'
    if (!form.email) errors.email = 'Required'
    if (form.role !== 'ADMIN' && !form.branch) errors.branch = 'Required'
    if (form.role === 'FSE' && !form.zone) errors.zone = 'Required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmitUser = () => {
    if (!validateForm()) return

    if (editingUser) {
      updateUser(editingUser.id, {
        full_name: form.full_name,
        email: form.email,
        role: form.role,
        branch: form.role === 'ADMIN' ? null : form.branch,
        zone: form.role === 'FSE' ? form.zone : null,
        is_active: form.is_active,
      })
      setEditingUser(null)
    } else {
      addUser({
        id: `user-${Date.now()}`,
        full_name: form.full_name,
        email: form.email,
        role: form.role,
        branch: form.role === 'ADMIN' ? null : form.branch,
        zone: form.role === 'FSE' ? form.zone : null,
        is_active: form.is_active,
        created_at: new Date().toISOString(),
      })
    }

    setForm(emptyForm)
    setShowAddForm(false)
    setFormErrors({})
  }

  const handleEdit = (user: AppUser) => {
    setForm({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      branch: user.branch || '',
      zone: user.zone || '',
      is_active: user.is_active,
    })
    setEditingUser(user)
    setShowAddForm(true)
  }

  const handleCancelForm = () => {
    setForm(emptyForm)
    setFormErrors({})
    setEditingUser(null)
    setShowAddForm(false)
  }

  const roleCounts = {
    ADMIN: users.filter((u) => u.role === 'ADMIN').length,
    ASM: users.filter((u) => u.role === 'ASM').length,
    FSE: users.filter((u) => u.role === 'FSE').length,
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#21264e' }}>
            User Management
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{users.length} users registered</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #245bc1, #46286E)' }}
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Role stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { role: 'ADMIN', color: '#245bc1', bg: '#EEF2FF' },
          { role: 'ASM', color: '#059669', bg: '#ECFDF5' },
          { role: 'FSE', color: '#ea580c', bg: '#FFF7ED' },
        ].map((r) => (
          <div key={r.role} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: r.bg }}>
                <Shield className="w-5 h-5" style={{ color: r.color }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: '#21264e' }}>
                  {roleCounts[r.role as keyof typeof roleCounts]}
                </p>
                <p className="text-xs text-gray-500">{r.role} users</p>
              </div>
            </div>
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
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="relative">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 appearance-none bg-white"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="ASM">ASM</option>
              <option value="FSE">FSE</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center py-16">
          <Users className="w-12 h-12 text-gray-300 mb-3" />
          <h3 className="text-gray-500 font-semibold">No users found</h3>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#fff7f2' }}>
                  {['User', 'Role', 'Branch', 'Zone', 'Status', 'Joined', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#21264e' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #21264e, #46286E)' }}
                        >
                          {user.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{user.full_name}</p>
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-400">{user.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">{getRoleBadge(user.role)}</td>
                    <td className="px-5 py-4">
                      {user.branch ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-gray-600">
                          <Building2 className="w-3 h-3 text-gray-400" />
                          {user.branch}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">All Branches</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {user.zone ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-gray-600">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {user.zone}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => updateUser(user.id, { is_active: !user.is_active })}
                        className="flex items-center gap-1.5 transition-colors"
                        style={{ color: user.is_active ? '#08dc7d' : '#9ca3af' }}
                      >
                        {user.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        <span className="text-xs font-medium">{user.is_active ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-gray-400">
                        {new Date(user.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                          style={{ color: '#245bc1' }}
                          title="Edit user"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(user.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-400"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit User Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg, #21264e, #46286E)' }}
            >
              <h3 className="text-white font-bold">{editingUser ? 'Edit User' : 'Add New User'}</h3>
              <button onClick={handleCancelForm} className="text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#21264e' }}>
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                  placeholder="Mario Rossi"
                  className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-blue-400 ${formErrors.full_name ? 'border-red-300' : 'border-gray-200'}`}
                />
                {formErrors.full_name && <p className="text-xs text-red-500 mt-1">{formErrors.full_name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#21264e' }}>
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="mario@lmit.com"
                  className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-blue-400 ${formErrors.email ? 'border-red-300' : 'border-gray-200'}`}
                />
                {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#21264e' }}>
                  Role <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={form.role}
                    onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as 'ADMIN' | 'ASM' | 'FSE', branch: '', zone: '' }))}
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 appearance-none bg-white"
                  >
                    <option value="FSE">FSE</option>
                    <option value="ASM">ASM</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {form.role !== 'ADMIN' && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#21264e' }}>
                    Branch <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      value={form.branch}
                      onChange={(e) => setForm((p) => ({ ...p, branch: e.target.value, zone: '' }))}
                      className={`w-full pl-9 pr-8 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-blue-400 appearance-none bg-white ${formErrors.branch ? 'border-red-300' : 'border-gray-200'}`}
                    >
                      <option value="">Select branch...</option>
                      {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                  </div>
                  {formErrors.branch && <p className="text-xs text-red-500 mt-1">{formErrors.branch}</p>}
                </div>
              )}

              {form.role === 'FSE' && zoneOptions.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#21264e' }}>
                    Zone <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      value={form.zone}
                      onChange={(e) => setForm((p) => ({ ...p, zone: e.target.value }))}
                      className={`w-full pl-9 pr-8 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-blue-400 appearance-none bg-white ${formErrors.zone ? 'border-red-300' : 'border-gray-200'}`}
                    >
                      <option value="">Select zone...</option>
                      {zoneOptions.map((z) => <option key={z} value={z}>{z}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                  </div>
                  {formErrors.zone && <p className="text-xs text-red-500 mt-1">{formErrors.zone}</p>}
                </div>
              )}

              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-gray-700">Active</span>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, is_active: !p.is_active }))}
                  style={{ color: form.is_active ? '#08dc7d' : '#9ca3af' }}
                >
                  {form.is_active ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={handleCancelForm} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={handleSubmitUser}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #245bc1, #46286E)' }}
                >
                  <Check className="w-4 h-4" />
                  {editingUser ? 'Save Changes' : 'Add User'}
                </button>
              </div>
            </div>
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
            <h3 className="text-center text-base font-bold text-gray-800 mb-2">Delete User</h3>
            <p className="text-center text-sm text-gray-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={() => { deleteUser(showDeleteConfirm); setShowDeleteConfirm(null) }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
