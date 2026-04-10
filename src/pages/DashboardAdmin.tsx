import { useDemandas } from '../hooks/useDemandas'
import { useAuth } from '../contexts/AuthContext'
import { StatsCards } from '../components/StatsCards'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area,
} from 'recharts'
import { format, subDays, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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

export function DashboardAdmin() {
  const { perfil } = useAuth()
  const { demandas, stats } = useDemandas()

  // Dados por status
  const dadosPorStatus = Object.entries(
    demandas.reduce<Record<string, number>>((acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1
      return acc
    }, {})
  ).map(([status, total]) => ({ status, label: LABELS_STATUS[status] || status, total }))

  // Dados por tipo
  const dadosPorTipo = Object.entries(
    demandas.reduce<Record<string, number>>((acc, d) => {
      acc[d.tipo_demanda] = (acc[d.tipo_demanda] || 0) + 1
      return acc
    }, {})
  ).map(([tipo, total]) => ({ tipo, total })).sort((a, b) => b.total - a.total)

  // Dados por cor/prioridade
  const dadosPorCor = Object.entries(
    demandas.reduce<Record<string, number>>((acc, d) => {
      const cor = d.classificacao_cor || 'sem classificação'
      acc[cor] = (acc[cor] || 0) + 1
      return acc
    }, {})
  ).map(([cor, total]) => ({ cor, total }))

  const CORES_PRIORIDADE: Record<string, string> = {
    verde: '#10B981',
    amarelo: '#F59E0B',
    vermelho: '#EF4444',
    azul: '#3B82F6',
    laranja: '#F97316',
    roxo: '#8B5CF6',
    'sem classificação': '#D1D5DB',
  }

  // Evolução últimos 30 dias
  const evolucao30d = Array.from({ length: 30 }, (_, i) => {
    const dia = startOfDay(subDays(new Date(), 29 - i))
    const diaStr = format(dia, 'yyyy-MM-dd')
    const abertas = demandas.filter(d => format(new Date(d.data_abertura), 'yyyy-MM-dd') === diaStr).length
    const concluidas = demandas.filter(d => d.data_conclusao && format(new Date(d.data_conclusao), 'yyyy-MM-dd') === diaStr).length
    return {
      dia: format(dia, 'dd/MM', { locale: ptBR }),
      abertas,
      concluidas,
    }
  })

  // Dados por vereador (top 10)
  const dadosPorVereador = Object.entries(
    demandas.reduce<Record<string, number>>((acc, d) => {
      const nome = (d as any).perfil?.nome || 'Desconhecido'
      acc[nome] = (acc[nome] || 0) + 1
      return acc
    }, {})
  )
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  // Insights
  const pendentes = demandas.filter(d => ['aberto', 'em_analise'].includes(d.status)).length
  const taxaConclusao = demandas.length > 0
    ? Math.round((demandas.filter(d => d.status === 'concluido').length / demandas.length) * 100)
    : 0
  const urgentes = demandas.filter(d => d.classificacao_cor === 'vermelho' && !['concluido', 'cancelado'].includes(d.status)).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {perfil?.role === 'vereador'
            ? `Dashboard - ${perfil?.nome?.split(' ')[0]}`
            : 'Dashboard BI'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">Visão analítica das demandas de saúde</p>
      </div>

      <StatsCards stats={stats} />

      {/* Insights rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200 p-5">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Pendentes</p>
          <p className="text-3xl font-bold text-amber-800 mt-1">{pendentes}</p>
          <p className="text-xs text-amber-600 mt-1">Aguardando análise ou ação</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 p-5">
          <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Taxa de Conclusão</p>
          <p className="text-3xl font-bold text-green-800 mt-1">{taxaConclusao}%</p>
          <p className="text-xs text-green-600 mt-1">Das demandas foram concluídas</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 p-5">
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Urgentes Ativas</p>
          <p className="text-3xl font-bold text-red-800 mt-1">{urgentes}</p>
          <p className="text-xs text-red-600 mt-1">Classificadas como vermelho</p>
        </div>
      </div>

      {/* Gráficos principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Distribuição por Status</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={dadosPorStatus}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="total"
                nameKey="label"
                label={({ label, total }) => `${label}: ${total}`}
              >
                {dadosPorStatus.map(entry => (
                  <Cell key={entry.status} fill={CORES_STATUS[entry.status] || '#6B7280'} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number, name: string) => [value, name]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Demandas por Tipo</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dadosPorTipo} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="tipo" width={130} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="total" fill="#6366F1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Evolução temporal */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Evolução - Últimos 30 dias</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={evolucao30d}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dia" tick={{ fontSize: 10 }} interval={4} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="abertas" name="Abertas" stroke="#3B82F6" fill="#DBEAFE" strokeWidth={2} />
            <Area type="monotone" dataKey="concluidas" name="Concluídas" stroke="#10B981" fill="#D1FAE5" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prioridade */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Classificação por Prioridade</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={dadosPorCor}
                cx="50%"
                cy="50%"
                outerRadius={90}
                paddingAngle={2}
                dataKey="total"
                nameKey="cor"
                label={({ cor, total }) => `${cor}: ${total}`}
              >
                {dadosPorCor.map(entry => (
                  <Cell key={entry.cor} fill={CORES_PRIORIDADE[entry.cor] || '#D1D5DB'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Por vereador */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Demandas por Vereador (Top 10)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dadosPorVereador} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="nome" width={120} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="total" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
