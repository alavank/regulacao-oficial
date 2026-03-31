import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuditLog } from '../hooks/useAuditLog'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { AuditoriaHumanizada } from '../types'
import {
  HiOutlineClipboardDocumentList,
  HiOutlineDevicePhoneMobile,
  HiOutlineComputerDesktop,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineGlobeAlt,
  HiOutlineFingerPrint,
  HiOutlineMapPin,
} from 'react-icons/hi2'

export function Auditoria() {
  const { registrar } = useAuditLog()
  const [logs, setLogs] = useState<AuditoriaHumanizada[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroModulo, setFiltroModulo] = useState('')
  const [filtroUsuario, setFiltroUsuario] = useState('')
  const [expandido, setExpandido] = useState<string | null>(null)

  useEffect(() => {
    registrar('modulo.acessar', 'auditoria', { modulo_nome: 'Auditoria' })
  }, [])

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      let query = supabase
        .from('auditoria_humanizada')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500)

      if (filtroModulo) query = query.eq('modulo', filtroModulo)
      if (filtroUsuario) query = query.ilike('usuario_nome', `%${filtroUsuario}%`)

      const { data } = await query
      if (data) setLogs(data as AuditoriaHumanizada[])
      setLoading(false)
    }
    fetch()
  }, [filtroModulo, filtroUsuario])

  function parseUserAgent(ua: string | null) {
    if (!ua) return { navegador: 'Desconhecido', so: 'Desconhecido' }
    let navegador = 'Outro'
    let so = 'Outro'

    if (ua.includes('Chrome') && !ua.includes('Edg')) navegador = 'Google Chrome'
    else if (ua.includes('Edg')) navegador = 'Microsoft Edge'
    else if (ua.includes('Firefox')) navegador = 'Mozilla Firefox'
    else if (ua.includes('Safari') && !ua.includes('Chrome')) navegador = 'Safari'

    if (ua.includes('Windows')) so = 'Windows'
    else if (ua.includes('Mac')) so = 'macOS'
    else if (ua.includes('Linux')) so = 'Linux'
    else if (ua.includes('Android')) so = 'Android'
    else if (ua.includes('iPhone') || ua.includes('iPad')) so = 'iOS'

    return { navegador, so }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <HiOutlineClipboardDocumentList className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Auditoria de Logs</h1>
            <p className="text-sm text-gray-500">Registro detalhado de todas as ações no sistema</p>
          </div>
        </div>
        <p className="text-xs text-gray-400">{logs.length} registro(s)</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Buscar por usuário..."
            value={filtroUsuario}
            onChange={e => setFiltroUsuario(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
          <select
            value={filtroModulo}
            onChange={e => setFiltroModulo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          >
            <option value="">Todos os módulos</option>
            <option value="demandas">Demandas</option>
            <option value="autenticacao">Autenticação</option>
            <option value="perfil">Perfil</option>
            <option value="parametros">Parâmetros</option>
            <option value="auditoria">Auditoria</option>
            <option value="usuarios">Usuários</option>
          </select>
        </div>
      </div>

      {/* Lista de logs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">Nenhum registro encontrado.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map(log => {
              const isOpen = expandido === log.id
              const { navegador, so } = parseUserAgent(log.browser)

              return (
                <div key={log.id}>
                  {/* Linha principal - clicável */}
                  <button
                    onClick={() => setExpandido(isOpen ? null : log.id)}
                    className="w-full flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="mt-0.5">
                      {log.dispositivo === 'mobile' ? (
                        <HiOutlineDevicePhoneMobile className="w-5 h-5 text-gray-400" />
                      ) : (
                        <HiOutlineComputerDesktop className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 font-medium">
                        {log.mensagem_humanizada}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                          {log.modulo}
                        </span>
                        {log.usuario_role && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-50 text-primary-700 capitalize">
                            {log.usuario_role}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-2 mt-1">
                      {isOpen ? (
                        <HiOutlineChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <HiOutlineChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Detalhes expandidos */}
                  {isOpen && (
                    <div className="px-4 pb-4 pl-12">
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Detalhes da Ação</h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex items-start gap-2">
                            <HiOutlineFingerPrint className="w-4 h-4 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-500">Usuário</p>
                              <p className="text-sm text-gray-900 font-medium">{log.usuario_nome || 'Sistema'}</p>
                              <p className="text-xs text-gray-500 capitalize">{log.usuario_role}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <HiOutlineGlobeAlt className="w-4 h-4 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-500">Navegador / Sistema</p>
                              <p className="text-sm text-gray-900">{navegador}</p>
                              <p className="text-xs text-gray-500">{so}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            {log.dispositivo === 'mobile' ? (
                              <HiOutlineDevicePhoneMobile className="w-4 h-4 text-gray-400 mt-0.5" />
                            ) : (
                              <HiOutlineComputerDesktop className="w-4 h-4 text-gray-400 mt-0.5" />
                            )}
                            <div>
                              <p className="text-xs text-gray-500">Dispositivo</p>
                              <p className="text-sm text-gray-900 capitalize">{log.dispositivo || 'Desconhecido'}</p>
                            </div>
                          </div>

                          {log.ip && (
                            <div className="flex items-start gap-2">
                              <HiOutlineMapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-xs text-gray-500">IP / Localização</p>
                                <p className="text-sm text-gray-900">{log.ip}</p>
                                {log.localizacao_prox && (
                                  <p className="text-xs text-gray-500">{log.localizacao_prox}</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Ação e dados técnicos */}
                        <div className="pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Ação técnica</p>
                          <code className="text-xs bg-white px-2 py-1 rounded border border-gray-200 text-gray-700">
                            {log.acao}
                          </code>
                        </div>

                        {log.detalhes_json && Object.keys(log.detalhes_json).length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Dados adicionais</p>
                            <div className="bg-white rounded border border-gray-200 p-3">
                              {Object.entries(log.detalhes_json).map(([k, v]) => (
                                <div key={k} className="flex gap-2 text-xs py-0.5">
                                  <span className="text-gray-500 font-medium min-w-[100px]">{k}:</span>
                                  <span className="text-gray-900">{String(v)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
