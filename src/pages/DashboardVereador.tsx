import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDemandas } from '../hooks/useDemandas'
import { useAuth } from '../contexts/AuthContext'
import { StatsCards } from '../components/StatsCards'
import { FilterBar } from '../components/FilterBar'
import { StatusBadge, CorBadge } from '../components/StatusBadge'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { HiOutlinePlusCircle, HiOutlineEye } from 'react-icons/hi2'

export function DashboardVereador() {
  const { perfil } = useAuth()
  const [filtros, setFiltros] = useState({
    status: '',
    tipo_demanda: '',
    classificacao_cor: '',
    data_inicio: '',
    data_fim: '',
    busca: '',
  })

  const { demandas, loading, stats } = useDemandas(filtros)

  function calcularTempoResposta(dataAbertura: string, dataConclusao: string | null) {
    const inicio = new Date(dataAbertura)
    if (dataConclusao) {
      const fim = new Date(dataConclusao)
      const diffMs = fim.getTime() - inicio.getTime()
      const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      const horas = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      return `${dias}d ${horas}h`
    }
    return formatDistanceToNow(inicio, { locale: ptBR, addSuffix: false })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Olá, {perfil?.nome?.split(' ')[0]}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Acompanhe suas demandas de saúde
          </p>
        </div>
        <Link
          to="/nova-demanda"
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <HiOutlinePlusCircle className="w-5 h-5" />
          Nova Demanda
        </Link>
      </div>

      <StatsCards stats={stats} />
      <FilterBar filtros={filtros} onChange={setFiltros} />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : demandas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">Nenhuma demanda encontrada.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Código</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Paciente</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Tipo</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Prioridade</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Tempo Resposta</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Data</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {demandas.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-primary-600 font-medium">
                      {d.codigo_unico}
                    </td>
                    <td className="px-4 py-3 text-gray-900">{d.nome_paciente}</td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{d.tipo_demanda}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <CorBadge cor={d.classificacao_cor} />
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell text-xs">
                      {calcularTempoResposta(d.data_abertura, d.data_conclusao)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell text-xs">
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
