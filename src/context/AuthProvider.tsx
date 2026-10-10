import { useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { AuthContext } from './auth-context'
import { getUserRole, type UserRole } from '../lib/grades-data'

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [roleResult, setRoleResult] = useState<{ userId: string; role: UserRole; error: string } | null>(null)
  const [roleRetry, setRoleRetry] = useState(0)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session) setRoleResult(null)
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return
    const userId = user.id
    const controller = new AbortController()
    getUserRole(userId, controller.signal).then((role) => {
      if (!controller.signal.aborted) setRoleResult({ userId, role, error: '' })
    }).catch(() => {
      if (!controller.signal.aborted) setRoleResult({ userId, role: null, error: 'No se pudo verificar tu rol. Las opciones administrativas permanecen bloqueadas.' })
    })
    return () => controller.abort()
  }, [user?.id, roleRetry])

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const currentRole = user && roleResult?.userId === user.id ? roleResult : null
  function retryRole() { setRoleResult(null); setRoleRetry((value) => value + 1) }
  return <AuthContext.Provider value={{ user, loading, signOut, role: currentRole?.role ?? null, roleLoading: Boolean(user && !currentRole), roleError: currentRole?.error ?? '', retryRole }}>{children}</AuthContext.Provider>
}
