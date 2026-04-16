import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Perfil, UserPermission, Modulo, Acao } from '../types'

interface PerfilExtended extends Perfil {
  deve_trocar_senha?: boolean
  ativo?: boolean
  telefone?: string
}

interface AuthContextType {
  user: User | null
  perfil: PerfilExtended | null
  session: Session | null
  loading: boolean
  deveTrocarSenha: boolean
  permissions: UserPermission[]
  hasPermission: (modulo: Modulo, acao: Acao) => boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  reloadPerfil: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [perfil, setPerfil] = useState<PerfilExtended | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [permissions, setPermissions] = useState<UserPermission[]>([])
  const [loading, setLoading] = useState(true)
  const deveTrocarSenha = perfil?.deve_trocar_senha === true

  async function fetchPerfil(userId: string) {
    const { data } = await supabase
      .from('perfis')
      .select('*')
      .eq('id', userId)
      .single()
    setPerfil(data)
  }

  async function fetchPermissions(userId: string) {
    const { data } = await supabase
      .from('user_permissions')
      .select('*')
      .eq('user_id', userId)
    setPermissions((data as UserPermission[]) || [])
  }

  async function loadUserData(userId: string) {
    await Promise.all([fetchPerfil(userId), fetchPermissions(userId)])
  }

  async function reloadPerfil() {
    if (user) await loadUserData(user.id)
  }

  const hasPermission = useCallback((modulo: Modulo, acao: Acao): boolean => {
    const perm = permissions.find(p => p.modulo === modulo)
    if (!perm) return false
    switch (acao) {
      case 'ver': return perm.pode_ver
      case 'criar': return perm.pode_criar
      case 'editar': return perm.pode_editar
      case 'excluir': return perm.pode_excluir
      default: return false
    }
  }, [permissions])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        loadUserData(session.user.id).then(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        loadUserData(session.user.id)
      } else {
        setPerfil(null)
        setPermissions([])
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
    <AuthContext.Provider value={{
      user, perfil, session, loading, deveTrocarSenha,
      permissions, hasPermission,
      signIn, signOut, reloadPerfil,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
