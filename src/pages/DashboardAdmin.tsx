import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDemandas } from '../hooks/useDemandas'
import { StatsCards } from '../components/StatsCards'
import { FilterBar } from '../components/FilterBar'
import { StatusBadge, CorBadge } from '../components/StatusBadge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { HiOutlineEye } from 'react-icons/hi2'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const CORES_STATUS: Record<string, string> = {
  aberto: '#3B82F6',
  em_analise: '#F59E0B',
  em_andamento: '#8B5CF6',
  concluido: '#10B981',
  cancelado: '#EF4444',
  devolvido: '#6B7280',
}

export function DashboardAdmin() {
  const [filtros, setFiltros] = useState({
    status: '',
    tipo_demanda: '',
    classificacao_cor: '',
    data_inicio: '',
    data_fim: '',
    busca: '',
  })

  const { demandas, loading, stats } = useDemandas(filtros)

  const dadosPorStatus = Object.entries(
    demandas.reduce<Record<string, number>>((acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1
      return acc
    }, {})
  ).map(([status, total]) => ({ status, total }))

  const dadosPorTipo = Object.entries(
    demandas.reduce<Record<string, number>>((acc, d) => {
      acc[d.tipo_demanda] = (acc[d.tipo_demanda] || 0) + 1
      return acc
    }, {})
  ).map(([tipo, total]) => ({ tipo, total }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
        <p className="text-sm text-gray-500 mt-1">Visão geral de todas as demandas</p>
      </div>

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Demandas por Status</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={dadosPorStatus}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="total"
                nameKey="status"
                label={({ status, total }) => `${status}: ${total}`}
              >
                {dadosPorStatus.map(entry => (
                  <Cell key={entry.status} fill={CORES_STATUS[entry.status] || '#6B7280'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Demandas por Tipo</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dadosPorTipo} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="tipo" width={120} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="total" fill="#6366F1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <FilterBar filtros={filtros} onChange={setFiltros} />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Código</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Paciente</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Vereador</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Tipo</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Cor</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Data</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {demandas.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-primary-600 font-medium">{d.codigo_unico}</td>
                    <td className="px-4 py-3 text-gray-900">{d.nome_paciente}</td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{(d as any).perfil?.nome || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{d.tipo_demanda}</td>
                    <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><CorBadge cor={d.classificacao_cor} /></td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell text-xs">
                      {format(new Date(d.data_abertura), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/demanda/${d.id}`}
                        className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-800 text-xs font-medium"
                      >
                        <HiOutlineEye className="w-4 h-4" />
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
