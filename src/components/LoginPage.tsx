import React, { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useDataStore } from '../store/dataStore'
import { Eye, EyeOff, Shield, FileText } from 'lucide-react'

const DEMO_ACCOUNTS = [
  { email: 'admin@lmit.com', password: 'admin123', label: 'Admin', color: '#245bc1' },
  { email: 'asm.milan@lmit.com', password: 'asm123', label: 'ASM (Milan)', color: '#08dc7d' },
  { email: 'fse.milan1@lmit.com', password: 'fse123', label: 'FSE (Milan Z1)', color: '#ffc8b2' },
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setUser = useAuthStore((s) => s.setUser)
  const { initializeDemoData } = useDataStore()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    initializeDemoData()

    await new Promise((r) => setTimeout(r, 800))

    const allUsers = useDataStore.getState().users
    const demoPasswords: Record<string, string> = {
      'admin@lmit.com': 'admin123',
      'asm.milan@lmit.com': 'asm123',
      'asm.rome@lmit.com': 'asm123',
      'fse.milan1@lmit.com': 'fse123',
      'fse.milan2@lmit.com': 'fse123',
      'fse.rome1@lmit.com': 'fse123',
    }

    const matchedUser = allUsers.find((u) => u.email === email)
    if (matchedUser && demoPasswords[email] === password) {
      setUser({
        id: matchedUser.id,
        email: matchedUser.email,
        full_name: matchedUser.full_name,
        role: matchedUser.role,
        branch: matchedUser.branch,
        zone: matchedUser.zone,
      })
    } else {
      setError('Invalid email or password. Try a demo account below.')
    }
    setLoading(false)
  }

  const handleDemoLogin = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail)
    setPassword(demoPassword)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #21264e 0%, #46286E 50%, #21264e 100%)' }}
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10"
          style={{ background: '#245bc1' }}
        />
        <div
          className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full opacity-10"
          style={{ background: '#08dc7d' }}
        />
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
          style={{ background: '#00D7FF' }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #245bc1, #00D7FF)' }}
          >
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">RetailSign</h1>
          <p className="text-blue-200 mt-1 text-sm">LMIT Contract Management Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-xl font-bold mb-1" style={{ color: '#21264e' }}>
            Welcome back
          </h2>
          <p className="text-gray-500 text-sm mb-6">Sign in to your account to continue</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#21264e' }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@lmit.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 text-sm transition-all"
                onFocus={(e) => (e.target.style.borderColor = '#245bc1')}
                onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#21264e' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 text-sm transition-all pr-12"
                  onFocus={(e) => (e.target.style.borderColor = '#245bc1')}
                  onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #245bc1, #46286E)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Demo Accounts</span>
            </div>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  onClick={() => handleDemoLogin(account.email, account.password)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left hover:bg-gray-50 transition-colors border border-gray-100"
                >
                  <div>
                    <span
                      className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full text-white mr-2"
                      style={{ background: account.color }}
                    >
                      {account.label}
                    </span>
                    <span className="text-xs text-gray-500">{account.email}</span>
                  </div>
                  <span className="text-xs text-gray-400">Click to fill</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-blue-200 text-xs mt-6 opacity-70">
          © 2024 LMIT RetailSign. All rights reserved.
        </p>
      </div>
    </div>
  )
}
