import { useDemandas } from '../hooks/useDemandas'
import { useAuth } from '../contexts/AuthContext'
import { StatsCards } from '../components/StatsCards'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

const CORES_STATUS: Record<string, string> = {
  aberto: '#3B82F6',
  em_analise: '#F59E0B',
  em_andamento: '#8B5CF6',
  concluido: '#10B981',
  cancelado: '#EF4444',
  devolvido: '#6B7280',
}

const LABELS_STATUS: Record<string, string> = {
  aberto: 'Aberto',
  em_analise: 'Em Análise',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
  devolvido: 'Devolvido',
}

export function DashboardVereador() {
  const { perfil } = useAuth()
  const { demandas, stats } = useDemandas()

  const dadosPorStatus = Object.entries(
    demandas.reduce<Record<string, number>>((acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1
      return acc
    }, {})
  ).map(([status, total]) => ({ status, label: LABELS_STATUS[status] || status, total }))

  const dadosPorTipo = Object.entries(
    demandas.reduce<Record<string, number>>((acc, d) => {
      acc[d.tipo_demanda] = (acc[d.tipo_demanda] || 0) + 1
      return acc
    }, {})
  ).map(([tipo, total]) => ({ tipo, total })).sort((a, b) => b.total - a.total)

  const pendentes = demandas.filter(d => ['aberto', 'em_analise'].includes(d.status)).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {perfil?.nome?.split(' ')[0]}
        </h1>
        <p className="text-sm text-gray-500 mt-1">Resumo das suas demandas de saúde</p>
      </div>

      <StatsCards stats={stats} />

      {pendentes > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          Você tem <strong>{pendentes}</strong> demanda{pendentes > 1 ? 's' : ''} aguardando análise ou ação.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Suas Demandas por Status</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={dadosPorStatus}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
                dataKey="total"
                nameKey="label"
                label={({ label, total }) => `${label}: ${total}`}
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
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Suas Demandas por Tipo</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dadosPorTipo} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="tipo" width={130} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="total" fill="#6366F1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
