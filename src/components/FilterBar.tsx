import { useParametros } from '../hooks/useParametros'

interface Filtros {
  status: string
  tipo_demanda: string
  classificacao_cor: string
  data_inicio: string
  data_fim: string
  busca: string
}

interface Props {
  filtros: Filtros
  onChange: (f: Filtros) => void
}

export function FilterBar({ filtros, onChange }: Props) {
  const { parametros: tipos } = useParametros('tipo')

  function set(campo: keyof Filtros, valor: string) {
    onChange({ ...filtros, [campo]: valor })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <input
          type="text"
          placeholder="Buscar paciente, código ou CPF..."
          value={filtros.busca}
          onChange={e => set('busca', e.target.value)}
          className="col-span-1 sm:col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        />
        <select
          value={filtros.status}
          onChange={e => set('status', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        >
          <option value="">Todos os status</option>
          <option value="aberto">Aberto</option>
          <option value="em_analise">Em Análise</option>
          <option value="em_andamento">Em Andamento</option>
          <option value="concluido">Concluído</option>
          <option value="cancelado">Cancelado</option>
          <option value="devolvido">Devolvido</option>
        </select>
        <select
          value={filtros.tipo_demanda}
          onChange={e => set('tipo_demanda', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        >
          <option value="">Todos os tipos</option>
          {tipos.map(t => (
            <option key={t.id} value={t.valor}>{t.valor}</option>
          ))}
        </select>
        <input
          type="date"
          value={filtros.data_inicio}
          onChange={e => set('data_inicio', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          placeholder="Data início"
        />
        <input
          type="date"
          value={filtros.data_fim}
          onChange={e => set('data_fim', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          placeholder="Data fim"
        />
      </div>
    </div>
  )
}
