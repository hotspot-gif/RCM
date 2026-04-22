import { useState } from 'react'
import {
  LayoutDashboard,
  Store,
  FileText,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Menu,
  X,
  Building2,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'

interface SidebarProps {
  currentPage: string
  onNavigate: (page: string) => void
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'ASM', 'FSE'] },
  { id: 'retailers', label: 'Retailers', icon: Store, roles: ['ADMIN', 'ASM', 'FSE'] },
  { id: 'contracts', label: 'Contracts', icon: FileText, roles: ['ADMIN', 'ASM', 'FSE'] },
  { id: 'new-contract', label: 'New Contract', icon: PlusCircle, roles: ['ADMIN', 'ASM', 'FSE'] },
  { id: 'users', label: 'User Management', icon: Users, roles: ['ADMIN'] },
]

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout } = useAuthStore()

  const filteredNav = navItems.filter((item) => item.roles.includes(user?.role || ''))

  const getRoleBadgeColor = (role: string) => {
    if (role === 'ADMIN') return { bg: '#245bc1', text: 'white' }
    if (role === 'ASM') return { bg: '#08dc7d', text: '#21264e' }
    return { bg: '#ffc8b2', text: '#21264e' }
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: '#21264e' }}>
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-5 py-5 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
          style={{ background: 'linear-gradient(135deg, #245bc1, #00D7FF)' }}
        >
          <FileText className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <span className="text-white font-bold text-base leading-tight block">RetailSign</span>
            <span className="text-blue-300 text-xs opacity-70">LMIT Platform</span>
          </div>
        )}
      </div>

      {/* User info */}
      {!collapsed && (
        <div
          className="mx-3 mt-4 mb-3 px-4 py-3 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #46286E, #245bc1)' }}
            >
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user?.full_name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: getRoleBadgeColor(user?.role || '').bg,
                    color: getRoleBadgeColor(user?.role || '').text,
                  }}
                >
                  {user?.role}
                </span>
              </div>
            </div>
          </div>
          {user?.branch && (
            <div className="mt-2 flex items-center gap-1.5">
              <Building2 className="w-3 h-3 text-blue-300 opacity-70 flex-shrink-0" />
              <span className="text-blue-300 text-xs opacity-70 truncate">{user.branch}</span>
            </div>
          )}
          {user?.zone && (
            <p className="text-blue-300 text-xs opacity-60 mt-0.5 truncate pl-4">{user.zone}</p>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {filteredNav.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id
          return (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id)
                setMobileOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-sm font-medium group ${collapsed ? 'justify-center' : ''}`}
              style={{
                background: isActive ? 'rgba(36,91,193,0.25)' : 'transparent',
                color: isActive ? '#00D7FF' : 'rgba(255,255,255,0.65)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
                  e.currentTarget.style.color = 'white'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'rgba(255,255,255,0.65)'
                }
              }}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className="w-5 h-5 flex-shrink-0"
                style={{ color: isActive ? '#00D7FF' : 'inherit' }}
              />
              {!collapsed && <span>{item.label}</span>}
              {isActive && !collapsed && (
                <span
                  className="ml-auto w-1.5 h-1.5 rounded-full"
                  style={{ background: '#00D7FF' }}
                />
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="pt-3">
          <button
            onClick={logout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-sm font-medium ${collapsed ? 'justify-center' : ''}`}
            style={{ color: 'rgba(255,255,255,0.5)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,80,80,0.15)'
              e.currentTarget.style.color = '#ff8080'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
            }}
            title={collapsed ? 'Sign out' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-xl text-white shadow-lg"
        style={{ background: '#21264e' }}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed top-0 left-0 h-full z-40 w-72 transition-transform duration-300 lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <SidebarContent />
      </div>

      {/* Desktop sidebar */}
      <div
        className={`hidden lg:flex flex-col h-screen sticky top-0 transition-all duration-300 flex-shrink-0 ${collapsed ? 'w-16' : 'w-64'}`}
      >
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full flex items-center justify-center shadow-lg border text-white"
          style={{ background: '#245bc1', borderColor: '#21264e' }}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </div>
    </>
  )
}
