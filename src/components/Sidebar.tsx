import { useState } from 'react'
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
  HiOutlineInformationCircle,
  HiOutlineXMark,
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
  const { perfil, signOut, hasPermission } = useAuth()
  const canSeeAdmin = hasPermission('auditoria', 'ver') || hasPermission('usuarios', 'ver') || hasPermission('parametros', 'ver')
  const [sobreOpen, setSobreOpen] = useState(false)

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
            <h1 className="text-lg font-bold text-primary-700">REGULAÇÃO 10D</h1>
            <p className="text-xs text-gray-500 mt-1">Sistema de Demandas</p>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {hasPermission('dashboard', 'ver') && (
              <NavLink to="/dashboard" className={linkClass} onClick={onClose}>
                <HiOutlineHome className="w-5 h-5" />
                Dashboard
              </NavLink>
            )}
            {hasPermission('demandas', 'ver') && (
              <NavLink to="/demandas" className={linkClass} onClick={onClose}>
                <HiOutlineDocumentText className="w-5 h-5" />
                Demandas
              </NavLink>
            )}
            {hasPermission('demandas', 'criar') && (
              <NavLink to="/nova-demanda" className={linkClass} onClick={onClose}>
                <HiOutlinePlusCircle className="w-5 h-5" />
                Nova Demanda
              </NavLink>
            )}
            {hasPermission('transparencia', 'ver') && (
              <NavLink to="/transparencia" className={linkClass} onClick={onClose}>
                <HiOutlineGlobeAlt className="w-5 h-5" />
                Transparência
              </NavLink>
            )}

            {canSeeAdmin && (
              <>
                <div className="pt-4 pb-2">
                  <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Administração
                  </p>
                </div>
                {hasPermission('auditoria', 'ver') && (
                  <NavLink to="/auditoria" className={linkClass} onClick={onClose}>
                    <HiOutlineClipboardDocumentList className="w-5 h-5" />
                    Auditoria
                  </NavLink>
                )}
                {hasPermission('usuarios', 'ver') && (
                  <NavLink to="/usuarios" className={linkClass} onClick={onClose}>
                    <HiOutlineUsers className="w-5 h-5" />
                    Usuários
                  </NavLink>
                )}
                {hasPermission('parametros', 'ver') && (
                  <NavLink to="/parametros" className={linkClass} onClick={onClose}>
                    <HiOutlineAdjustmentsHorizontal className="w-5 h-5" />
                    Parâmetros
                  </NavLink>
                )}
              </>
            )}
          </nav>

          <div className="p-4 border-t border-gray-100 space-y-1">
            <NavLink to="/configuracoes" className={linkClass} onClick={onClose}>
              <HiOutlineCog6Tooth className="w-5 h-5" />
              Configurações
            </NavLink>
            <button
              onClick={() => setSobreOpen(true)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 w-full transition-colors"
            >
              <HiOutlineInformationCircle className="w-5 h-5" />
              Sobre
            </button>
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

      {/* Modal Sobre */}
      {sobreOpen && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4" onClick={() => setSobreOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <HiOutlineInformationCircle className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">REGULAÇÃO 10D</h2>
                  <p className="text-xs text-gray-500">Sistema de Cadastro de Demandas &middot; v1.0</p>
                </div>
              </div>
              <button onClick={() => setSobreOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <HiOutlineXMark className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm text-gray-600 leading-relaxed">
              <p>
                O <strong className="text-gray-800">REGULAÇÃO 10D</strong> é um sistema desenvolvido para a gestão e
                acompanhamento de demandas de saúde encaminhadas por vereadores. A plataforma permite o cadastro, a
                triagem e o monitoramento em tempo real de cada solicitação, garantindo transparência e agilidade no
                atendimento ao cidadão.
              </p>
              <p>
                Desenvolvido com foco em segurança, rastreabilidade e facilidade de uso, o sistema conta com auditoria
                completa de ações, controle de permissões individualizado e painel de transparência pública.
              </p>

              <div className="pt-4 border-t border-gray-100 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Desenvolvido por</p>
                    <p className="text-sm text-gray-800 font-medium mt-0.5">Tiago Miller</p>
                  </div>
                  <a
                    href="https://wa.me/5537991001906"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.61.609l4.458-1.495A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.387 0-4.596-.84-6.32-2.239l-.44-.37-3.065 1.027 1.027-3.065-.37-.44A9.956 9.956 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
                    WhatsApp
                  </a>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Suporte</p>
                    <p className="text-sm text-gray-800 font-medium mt-0.5">Departamento de Tecnologia da Informação</p>
                  </div>
                  <a
                    href="https://wa.me/553732269071"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.61.609l4.458-1.495A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.387 0-4.596-.84-6.32-2.239l-.44-.37-3.065 1.027 1.027-3.065-.37-.44A9.956 9.956 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
                    WhatsApp
                  </a>
                </div>
              </div>

              <p className="text-xs text-gray-400 text-center pt-3 border-t border-gray-100">
                &copy; 2025 Prefeitura de Nova Serrana. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
