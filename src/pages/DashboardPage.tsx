import React, { useMemo } from 'react'
import {
  Store,
  FileText,
  CheckCircle2,
  Clock,
  Send,
  TrendingUp,
  Building2,
  MapPin,
  ArrowRight,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useDataStore } from '../store/dataStore'
import { BRANCHES, BRANCH_ZONES } from '../data/constants'
import { format } from 'date-fns'

interface DashboardPageProps {
  onNavigate: (page: string) => void
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { user } = useAuthStore()
  const { retailers, contracts } = useDataStore()

  const filteredRetailers = useMemo(() => {
    if (user?.role === 'ADMIN') return retailers
    if (user?.role === 'ASM') return retailers.filter((r) => r.branch === user.branch)
    return retailers.filter((r) => r.zone === user?.zone)
  }, [retailers, user])

  const filteredContracts = useMemo(() => {
    if (user?.role === 'ADMIN') return contracts
    if (user?.role === 'ASM') return contracts.filter((c) => c.branch === user.branch)
    return contracts.filter((c) => c.zone === user?.zone)
  }, [contracts, user])

  const stats = {
    totalRetailers: filteredRetailers.length,
    totalContracts: filteredContracts.length,
    signed: filteredContracts.filter((c) => c.status === 'SIGNED').length,
    pending: filteredContracts.filter((c) => c.status === 'PENDING').length,
    sent: filteredContracts.filter((c) => c.status === 'SENT').length,
  }

  const branchStats = useMemo(() => {
    if (user?.role !== 'ADMIN') return null
    return BRANCHES.map((branch) => {
      const branchRetailers = retailers.filter((r) => r.branch === branch)
      const branchContracts = contracts.filter((c) => c.branch === branch)
      return {
        branch,
        retailers: branchRetailers.length,
        contracts: branchContracts.length,
        signed: branchContracts.filter((c) => c.status === 'SIGNED').length,
        pending: branchContracts.filter((c) => c.status === 'PENDING').length,
        zones: BRANCH_ZONES[branch].length,
      }
    })
  }, [retailers, contracts, user])

  const recentContracts = filteredContracts.slice(-5).reverse()

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    bgColor,
    subtitle,
  }: {
    title: string
    value: number
    icon: React.ElementType
    color: string
    bgColor: string
    subtitle?: string
  }) => (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold mt-1" style={{ color: '#21264e' }}>
            {value}
          </p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: bgColor }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </div>
  )

  const getStatusBadge = (status: string) => {
    if (status === 'SIGNED')
      return (
        <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="w-3 h-3" /> Signed
        </span>
      )
    if (status === 'SENT')
      return (
        <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
          <Send className="w-3 h-3" /> Sent
        </span>
      )
    return (
      <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600">
        <Clock className="w-3 h-3" /> Pending
      </span>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#21264e' }}>
          Dashboard
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Welcome back, <span className="font-semibold text-gray-700">{user?.full_name}</span> —{' '}
          {format(new Date(), 'EEEE, MMMM d yyyy')}
        </p>
        {user?.branch && (
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1 text-sm text-gray-500">
              <Building2 className="w-4 h-4" /> {user.branch}
            </span>
            {user?.zone && (
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <MapPin className="w-4 h-4" /> {user.zone}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          title="Total Retailers"
          value={stats.totalRetailers}
          icon={Store}
          color="#245bc1"
          bgColor="#EEF2FF"
          subtitle="In your territory"
        />
        <StatCard
          title="Total Contracts"
          value={stats.totalContracts}
          icon={FileText}
          color="#46286E"
          bgColor="#F3F0FF"
          subtitle="All contracts"
        />
        <StatCard
          title="Signed"
          value={stats.signed}
          icon={CheckCircle2}
          color="#08dc7d"
          bgColor="#ECFDF5"
          subtitle="Completed"
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={Clock}
          color="#f59e0b"
          bgColor="#FFFBEB"
          subtitle="Awaiting signature"
        />
        <StatCard
          title="Sent"
          value={stats.sent}
          icon={Send}
          color="#00D7FF"
          bgColor="#ECFEFF"
          subtitle="Emailed to retailer"
        />
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: '#245bc1' }} />
            <h3 className="text-sm font-semibold" style={{ color: '#21264e' }}>
              Contract Completion Rate
            </h3>
          </div>
          <span className="text-sm font-bold" style={{ color: '#245bc1' }}>
            {stats.totalContracts > 0
              ? Math.round(((stats.signed + stats.sent) / stats.totalContracts) * 100)
              : 0}
            %
          </span>
        </div>
        <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-gray-100">
          {stats.totalContracts > 0 && (
            <>
              <div
                className="h-full rounded-l-full transition-all"
                style={{
                  width: `${(stats.signed / stats.totalContracts) * 100}%`,
                  background: '#08dc7d',
                }}
                title={`Signed: ${stats.signed}`}
              />
              <div
                className="h-full transition-all"
                style={{
                  width: `${(stats.sent / stats.totalContracts) * 100}%`,
                  background: '#00D7FF',
                }}
                title={`Sent: ${stats.sent}`}
              />
              <div
                className="h-full rounded-r-full transition-all"
                style={{
                  width: `${(stats.pending / stats.totalContracts) * 100}%`,
                  background: '#FFDD64',
                }}
                title={`Pending: ${stats.pending}`}
              />
            </>
          )}
        </div>
        <div className="flex gap-4 mt-3">
          {[
            { label: 'Signed', color: '#08dc7d', count: stats.signed },
            { label: 'Sent', color: '#00D7FF', count: stats.sent },
            { label: 'Pending', color: '#FFDD64', count: stats.pending },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
              <span className="text-xs text-gray-500">
                {item.label} ({item.count})
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Recent Contracts */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h3 className="text-sm font-semibold" style={{ color: '#21264e' }}>
              Recent Contracts
            </h3>
            <button
              onClick={() => onNavigate('contracts')}
              className="text-xs font-medium flex items-center gap-1 hover:gap-2 transition-all"
              style={{ color: '#245bc1' }}
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {recentContracts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <FileText className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">No contracts yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentContracts.map((contract) => (
                <div key={contract.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: '#F3F0FF' }}
                  >
                    <FileText className="w-4 h-4" style={{ color: '#46286E' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {contract.retailer_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {contract.contract_number} · {contract.zone}
                    </p>
                  </div>
                  {getStatusBadge(contract.status)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#21264e' }}>
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => onNavigate('new-contract')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #245bc1, #46286E)' }}
              >
                <FileText className="w-4 h-4 flex-shrink-0" />
                Generate New Contract
              </button>
              <button
                onClick={() => onNavigate('retailers')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all hover:bg-gray-50 border border-gray-200"
                style={{ color: '#21264e' }}
              >
                <Store className="w-4 h-4 flex-shrink-0" style={{ color: '#245bc1' }} />
                View Retailers
              </button>
              <button
                onClick={() => onNavigate('contracts')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all hover:bg-gray-50 border border-gray-200"
                style={{ color: '#21264e' }}
              >
                <FileText className="w-4 h-4 flex-shrink-0" style={{ color: '#46286E' }} />
                Manage Contracts
              </button>
            </div>
          </div>

          {/* Zone breakdown for FSE */}
          {user?.role === 'FSE' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#21264e' }}>
                Your Zone Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> {user.zone || 'No zone'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    { label: 'Retailers', value: stats.totalRetailers, color: '#245bc1' },
                    { label: 'Contracts', value: stats.totalContracts, color: '#46286E' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl p-3 text-center"
                      style={{ background: '#fff7f2' }}
                    >
                      <p className="text-2xl font-bold" style={{ color: item.color }}>
                        {item.value}
                      </p>
                      <p className="text-xs text-gray-500">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Branch Overview (Admin only) */}
      {user?.role === 'ADMIN' && branchStats && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: '#21264e' }}>
              Branch Overview
            </h3>
            <span className="text-xs text-gray-400">{BRANCHES.length} branches</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {branchStats.map((branch, idx) => {
              const colors = ['#245bc1', '#08dc7d', '#ffc8b2', '#FFDD64', '#00D7FF', '#46286E', '#245bc1', '#08dc7d']
              const bgColors = ['#EEF2FF', '#ECFDF5', '#FFF5F0', '#FFFBEB', '#ECFEFF', '#F3F0FF', '#EEF2FF', '#ECFDF5']
              return (
                <div
                  key={branch.branch}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: bgColors[idx] }}
                    >
                      <Building2 className="w-4 h-4" style={{ color: colors[idx] }} />
                    </div>
                    <span className="text-xs text-gray-400">{branch.zones} zones</span>
                  </div>
                  <h4 className="text-xs font-bold text-gray-700 mb-2 leading-tight">
                    {branch.branch}
                  </h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Retailers</span>
                      <span className="font-semibold" style={{ color: '#21264e' }}>
                        {branch.retailers}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Signed</span>
                      <span className="font-semibold" style={{ color: '#08dc7d' }}>
                        {branch.signed}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Pending</span>
                      <span className="font-semibold" style={{ color: '#f59e0b' }}>
                        {branch.pending}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: branch.contracts > 0 ? `${(branch.signed / branch.contracts) * 100}%` : '0%',
                        background: colors[idx],
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ASM Zone breakdown */}
      {user?.role === 'ASM' && user.branch && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold mb-4" style={{ color: '#21264e' }}>
            Zone Breakdown — {user.branch}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {BRANCH_ZONES[user.branch as keyof typeof BRANCH_ZONES]?.map((zone, idx) => {
              const zoneRetailers = retailers.filter((r) => r.zone === zone).length
              const zoneContracts = contracts.filter((c) => c.zone === zone)
              const zoneSigned = zoneContracts.filter((c) => c.status === 'SIGNED').length
              return (
                <div
                  key={zone}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: idx % 2 === 0 ? '#245bc1' : '#08dc7d' }}
                    />
                    <span className="text-xs font-semibold text-gray-600">{zone}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-center">
                    <div>
                      <p className="text-lg font-bold" style={{ color: '#21264e' }}>
                        {zoneRetailers}
                      </p>
                      <p className="text-xs text-gray-400">Retailers</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold" style={{ color: '#245bc1' }}>
                        {zoneContracts.length}
                      </p>
                      <p className="text-xs text-gray-400">Contracts</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold" style={{ color: '#08dc7d' }}>
                        {zoneSigned}
                      </p>
                      <p className="text-xs text-gray-400">Signed</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
