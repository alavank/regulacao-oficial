import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './pages/Login'
import { TrocarSenha } from './pages/TrocarSenha'
import { DashboardVereador } from './pages/DashboardVereador'
import { NovaDemanda } from './pages/NovaDemanda'
import { DetalhesDemanda } from './pages/DetalhesDemanda'
import { DashboardAdmin } from './pages/DashboardAdmin'
import { Transparencia } from './pages/Transparencia'
import { Auditoria } from './pages/Auditoria'
import { Usuarios } from './pages/Usuarios'
import { Configuracoes } from './pages/Configuracoes'
import { Parametros } from './pages/Parametros'

function DashboardRouter() {
  const { perfil } = useAuth()
  if (perfil?.role === 'admin' || perfil?.role === 'regulacao') {
    return <DashboardAdmin />
  }
  return <DashboardVereador />
}

// Wrapper que força troca de senha
function RequireSenhaAtualizada({ children }: { children: React.ReactNode }) {
  const { deveTrocarSenha, user, loading } = useAuth()
  if (loading) return null
  if (user && deveTrocarSenha) {
    return <Navigate to="/trocar-senha" replace />
  }
  return <>{children}</>
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/transparencia-publica" element={<Transparencia />} />
      <Route path="/trocar-senha" element={
        <ProtectedRoute>
          <TrocarSenha />
        </ProtectedRoute>
      } />

      <Route
        element={
          <ProtectedRoute>
            <RequireSenhaAtualizada>
              <Layout />
            </RequireSenhaAtualizada>
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardRouter />} />
        <Route path="/nova-demanda" element={<NovaDemanda />} />
        <Route path="/demanda/:id" element={<DetalhesDemanda />} />
        <Route path="/transparencia" element={<Transparencia />} />
        <Route path="/configuracoes" element={<Configuracoes />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin', 'regulacao']}>
              <DashboardAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/auditoria"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Auditoria />
            </ProtectedRoute>
          }
        />
        <Route
          path="/usuarios"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Usuarios />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parametros"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Parametros />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
