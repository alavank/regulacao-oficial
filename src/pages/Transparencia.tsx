import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { StatusBadge, CorBadge } from '../components/StatusBadge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { TransparenciaPublica } from '../types'
import { HiOutlineGlobeAlt } from 'react-icons/hi2'

export function Transparencia() {
  const [dados, setDados] = useState<TransparenciaPublica[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('')

  useEffect(() => {
    async function fetch() {
      let query = supabase
        .from('transparencia_publica')
        .select('*')
        .order('data_abertura', { ascending: false })

      if (filtroStatus) query = query.eq('status', filtroStatus)

      const { data } = await query
      if (data) setDados(data as TransparenciaPublica[])
      setLoading(false)
    }
    fetch()
  }, [filtroStatus])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <HiOutlineGlobeAlt className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transparência Pública</h1>
            <p className="text-sm text-gray-500">Fila de demandas anonimizada</p>
          </div>
        </div>
        <select
          value={filtroStatus}
          onChange={e => setFiltroStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        >
          <option value="">Todos os status</option>
          <option value="aberto">Aberto</option>
          <option value="em_analise">Em Análise</option>
          <option value="em_andamento">Em Andamento</option>
          <option value="concluido">Concluído</option>
        </select>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
        Os dados exibidos nesta página são anonimizados para proteção da privacidade dos pacientes,
        conforme a Lei Geral de Proteção de Dados (LGPD).
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : dados.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">Nenhuma demanda registrada.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Código</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Iniciais</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">CPF</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Tipo</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Prioridade</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Vereador</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dados.map(d => (
                  <tr key={d.codigo_unico} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-primary-600 font-medium">{d.codigo_unico}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{d.iniciais_paciente}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs hidden sm:table-cell">{d.cpf_anonimizado}</td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{d.tipo_demanda}</td>
                    <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><CorBadge cor={d.classificacao_cor} /></td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{d.nome_vereador}</td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell text-xs">
                      {format(new Date(d.data_abertura), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="text-center text-xs text-gray-400">
        Dados atualizados em tempo real. Total: {dados.length} demanda(s).
      </div>
    </div>
  )
}
