import { createContext, useContext } from 'react'
import type { User } from '@supabase/supabase-js'
import type { UserRole } from '../lib/grades-data'

type AuthContextValue = {
  user: User | null
  loading: boolean
  role: UserRole
  roleLoading: boolean
  roleError: string
  retryRole: () => void
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth requiere AuthProvider')
  return context
}
