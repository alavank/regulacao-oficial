import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { Modulo, Acao } from '../types'

interface Props {
  children: React.ReactNode
  /** @deprecated Use requiredPermission instead */
  allowedRoles?: string[]
  requiredPermission?: { modulo: Modulo; acao: Acao }
}

export function ProtectedRoute({ children, allowedRoles, requiredPermission }: Props) {
  const { user, perfil, loading, hasPermission } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  // Novo: verificação por permissão granular
  if (requiredPermission) {
    const allowed = hasPermission(requiredPermission.modulo, requiredPermission.acao)
    if (!allowed) return <Navigate to="/dashboard" replace />
  }

  // Retrocompatibilidade: allowedRoles ainda funciona durante a migração
  if (allowedRoles && perfil && !allowedRoles.includes(perfil.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
