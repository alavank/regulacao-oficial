import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './pages/Login'
import { DashboardVereador } from './pages/DashboardVereador'
import { NovaDemanda } from './pages/NovaDemanda'
import { DetalhesDemanda } from './pages/DetalhesDemanda'
import { DashboardAdmin } from './pages/DashboardAdmin'
import { Transparencia } from './pages/Transparencia'
import { Auditoria } from './pages/Auditoria'
import { Usuarios } from './pages/Usuarios'
import { Configuracoes } from './pages/Configuracoes'

function DashboardRouter() {
  const { perfil } = useAuth()
  if (perfil?.role === 'admin' || perfil?.role === 'regulacao') {
    return <DashboardAdmin />
  }
  return <DashboardVereador />
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/transparencia-publica" element={<Transparencia />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardRouter />} />
        <Route path="/nova-demanda" element={<NovaDemanda />} />
        <Route path="/demanda/:id" element={<DetalhesDemanda />} />
        <Route path="/transparencia" element={<Transparencia />} />
        <Route path="/configuracoes" element={<Configuracoes />} />

        {/* Rotas admin */}
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
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
