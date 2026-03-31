import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { AuditoriaHumanizada } from '../types'
import {
  HiOutlineClipboardDocumentList,
  HiOutlineDevicePhoneMobile,
  HiOutlineComputerDesktop,
} from 'react-icons/hi2'

export function Auditoria() {
  const [logs, setLogs] = useState<AuditoriaHumanizada[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroModulo, setFiltroModulo] = useState('')

  useEffect(() => {
    async function fetch() {
      let query = supabase
        .from('auditoria_humanizada')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)

      if (filtroModulo) query = query.eq('modulo', filtroModulo)

      const { data } = await query
      if (data) setLogs(data as AuditoriaHumanizada[])
      setLoading(false)
    }
    fetch()
  }, [filtroModulo])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <HiOutlineClipboardDocumentList className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Auditoria</h1>
            <p className="text-sm text-gray-500">Registro de todas as ações no sistema</p>
          </div>
        </div>
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
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">Nenhum registro de auditoria encontrado.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map(log => (
              <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
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
                    <div className="flex flex-wrap items-center gap-3 mt-1">
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
