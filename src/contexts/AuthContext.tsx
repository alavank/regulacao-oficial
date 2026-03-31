import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Perfil } from '../types'

interface AuthContextType {
  user: User | null
  perfil: Perfil | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchPerfil(userId: string) {
    const { data } = await supabase
      .from('perfis')
      .select('*')
      .eq('id', userId)
      .single()
    setPerfil(data)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchPerfil(session.user.id)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchPerfil(session.user.id)
      } else {
        setPerfil(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }

    // Log de auditoria
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('auditoria_logs').insert({
        usuario_id: user.id,
        acao: 'auth.login',
        modulo: 'autenticacao',
        detalhes_json: {},
        browser: navigator.userAgent,
        dispositivo: /Mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      })
    }

    return { error: null }
  }

  async function signOut() {
    if (user) {
      await supabase.from('auditoria_logs').insert({
        usuario_id: user.id,
        acao: 'auth.logout',
        modulo: 'autenticacao',
        detalhes_json: {},
        browser: navigator.userAgent,
        dispositivo: /Mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      })
    }
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, perfil, session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
