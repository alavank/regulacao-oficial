import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  HiOutlineHome,
  HiOutlinePlusCircle,
  HiOutlineGlobeAlt,
  HiOutlineClipboardDocumentList,
  HiOutlineCog6Tooth,
  HiOutlineArrowRightOnRectangle,
  HiOutlineUsers,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineDocumentText,
} from 'react-icons/hi2'

interface Props {
  open: boolean
  onClose: () => void
}

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? 'bg-primary-600 text-white shadow-md'
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
  }`

export function Sidebar({ open, onClose }: Props) {
  const { perfil, signOut } = useAuth()
  const isAdmin = perfil?.role === 'admin' || perfil?.role === 'regulacao'

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-5 border-b border-gray-100">
            <h1 className="text-lg font-bold text-primary-700">Regulação Saúde</h1>
            <p className="text-xs text-gray-500 mt-1">Sistema de Demandas</p>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <NavLink to="/dashboard" className={linkClass} onClick={onClose}>
              <HiOutlineHome className="w-5 h-5" />
              Dashboard
            </NavLink>
            <NavLink to="/demandas" className={linkClass} onClick={onClose}>
              <HiOutlineDocumentText className="w-5 h-5" />
              Demandas
            </NavLink>
            <NavLink to="/nova-demanda" className={linkClass} onClick={onClose}>
              <HiOutlinePlusCircle className="w-5 h-5" />
              Nova Demanda
            </NavLink>
            <NavLink to="/transparencia" className={linkClass} onClick={onClose}>
              <HiOutlineGlobeAlt className="w-5 h-5" />
              Transparência
            </NavLink>

            {isAdmin && (
              <>
                <div className="pt-4 pb-2">
                  <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Administração
                  </p>
                </div>
                <NavLink to="/auditoria" className={linkClass} onClick={onClose}>
                  <HiOutlineClipboardDocumentList className="w-5 h-5" />
                  Auditoria
                </NavLink>
                <NavLink to="/usuarios" className={linkClass} onClick={onClose}>
                  <HiOutlineUsers className="w-5 h-5" />
                  Usuários
                </NavLink>
                <NavLink to="/parametros" className={linkClass} onClick={onClose}>
                  <HiOutlineAdjustmentsHorizontal className="w-5 h-5" />
                  Parâmetros
                </NavLink>
              </>
            )}
          </nav>

          <div className="p-4 border-t border-gray-100 space-y-1">
            <NavLink to="/configuracoes" className={linkClass} onClick={onClose}>
              <HiOutlineCog6Tooth className="w-5 h-5" />
              Configurações
            </NavLink>
            <button
              onClick={signOut}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors"
            >
              <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
              Sair
            </button>
          </div>

          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                {perfil?.nome?.charAt(0) || '?'}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-gray-900 truncate">{perfil?.nome}</p>
                <p className="text-xs text-gray-500 capitalize">{perfil?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
