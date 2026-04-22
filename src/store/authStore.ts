import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'ADMIN' | 'ASM' | 'FSE'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: UserRole
  branch: string | null
  zone: string | null
  created_at?: string
}

interface AuthState {
  user: UserProfile | null
  isAuthenticated: boolean
  setUser: (user: UserProfile | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
