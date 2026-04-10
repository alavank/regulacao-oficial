import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { StatusBadge } from '../components/StatusBadge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { TransparenciaPublica } from '../types'
import { useAuth } from '../contexts/AuthContext'
import {
  HiOutlineGlobeAlt,
  HiOutlineMagnifyingGlass,
  HiOutlineLink,
  HiOutlineClipboard,
  HiOutlineCheck,
} from 'react-icons/hi2'

export function Transparencia() {
  const { perfil } = useAuth()
  const [dados, setDados] = useState<TransparenciaPublica[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [busca, setBusca] = useState('')
  const [linkCopiado, setLinkCopiado] = useState(false)

  const podeGerarLink = perfil?.role === 'admin' || perfil?.role === 'vereador'

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      let query = supabase
        .from('transparencia_publica')
        .select('*')
        .order('data_abertura', { ascending: true })

      if (filtroStatus) query = query.eq('status', filtroStatus)

      const { data } = await query
      if (data) setDados(data as TransparenciaPublica[])
      setLoading(false)
    }
    fetch()
  }, [filtroStatus])

  const dadosFiltrados = busca
    ? dados.filter(d =>
        d.codigo_unico.toLowerCase().includes(busca.toLowerCase()) ||
        d.iniciais_paciente.toLowerCase().includes(busca.toLowerCase()) ||
        d.cpf_anonimizado.includes(busca)
      )
    : dados

  function copiarLinkPublico() {
    const url = `${window.location.origin}/transparencia-publica`
    navigator.clipboard.writeText(url)
    setLinkCopiado(true)
    setTimeout(() => setLinkCopiado(false), 2000)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <HiOutlineGlobeAlt className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transparência Pública</h1>
            <p className="text-sm text-gray-500">Fila de demandas do SUS - dados anonimizados</p>
          </div>
        </div>

        {podeGerarLink && (
          <button
            onClick={copiarLinkPublico}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              linkCopiado
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {linkCopiado ? (
              <>
                <HiOutlineCheck className="w-4 h-4" />
                Link copiado!
              </>
            ) : (
              <>
                <HiOutlineLink className="w-4 h-4" />
                Copiar link público
              </>
            )}
          </button>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
        Os dados exibidos nesta página são anonimizados para proteção da privacidade dos pacientes,
        conforme a Lei Geral de Proteção de Dados (LGPD). Nomes exibidos apenas com iniciais e CPF parcialmente oculto.
      </div>

      {podeGerarLink && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800 flex items-start gap-2">
          <HiOutlineClipboard className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            Use o botão <strong>"Copiar link público"</strong> para compartilhar esta página com qualquer pessoa.
            O link permite visualizar a fila sem precisar de login.
          </span>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por código, iniciais ou CPF..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
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
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : dadosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">Nenhuma demanda registrada.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-center px-3 py-3 font-medium text-gray-600 w-16">Fila</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Código</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Iniciais</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">CPF</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Tipo</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dadosFiltrados.map((d, idx) => (
                  <tr key={d.codigo_unico} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-50 text-primary-700 font-bold text-xs">
                        {d.posicao_fila || idx + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-primary-600 font-medium">{d.codigo_unico}</td>
                    <td className="px-4 py-3 font-bold text-gray-900 text-lg tracking-wider">{d.iniciais_paciente}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs hidden sm:table-cell">{d.cpf_anonimizado}</td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{d.tipo_demanda}</td>
                    <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
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
        Total: {dadosFiltrados.length} demanda(s) na fila. Dados atualizados em tempo real.
      </div>
    </div>
  )
}
