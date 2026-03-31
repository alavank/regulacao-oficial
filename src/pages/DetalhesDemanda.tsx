import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useAuditLog } from '../hooks/useAuditLog'
import { StatusBadge, CorBadge } from '../components/StatusBadge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Demanda } from '../types'
import { HiOutlineArrowLeft, HiOutlineClock } from 'react-icons/hi2'

export function DetalhesDemanda() {
  const { id } = useParams<{ id: string }>()
  const { perfil } = useAuth()
  const { registrar } = useAuditLog()
  const [demanda, setDemanda] = useState<Demanda | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusLoading, setStatusLoading] = useState(false)
  const isAdmin = perfil?.role === 'admin' || perfil?.role === 'regulacao'

  useEffect(() => {
    async function fetch() {
      if (!id) return
      const { data } = await supabase
        .from('demandas')
        .select('*')
        .eq('id', id)
        .single()
      if (data) {
        setDemanda(data as Demanda)
        await registrar('demanda.visualizar', 'demandas', { codigo: data.codigo_unico })
      }
      setLoading(false)
    }
    fetch()
  }, [id])

  async function alterarStatus(novoStatus: string) {
    if (!demanda) return
    setStatusLoading(true)

    const updateData: Record<string, unknown> = { status: novoStatus }
    if (novoStatus === 'concluido') {
      updateData.data_conclusao = new Date().toISOString()
    }

    const { error } = await supabase
      .from('demandas')
      .update(updateData)
      .eq('id', demanda.id)

    if (!error) {
      await registrar('demanda.atualizar_status', 'demandas', {
        codigo: demanda.codigo_unico,
        novo_status: novoStatus,
      })
      setDemanda({ ...demanda, status: novoStatus as Demanda['status'], ...(novoStatus === 'concluido' ? { data_conclusao: new Date().toISOString() } : {}) })
    }
    setStatusLoading(false)
  }

  function calcularTempo() {
    if (!demanda) return '-'
    const inicio = new Date(demanda.data_abertura).getTime()
    const fim = demanda.data_conclusao ? new Date(demanda.data_conclusao).getTime() : Date.now()
    const diffMs = fim - inicio
    const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const horas = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    return `${dias} dia(s) e ${horas} hora(s)`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!demanda) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Demanda não encontrada.</p>
        <Link to="/dashboard" className="text-primary-600 hover:underline text-sm mt-2 inline-block">
          Voltar ao Dashboard
        </Link>
      </div>
    )
  }

  const statusFlow = ['aberto', 'em_analise', 'em_andamento', 'concluido']

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
        <HiOutlineArrowLeft className="w-4 h-4" />
        Voltar
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <p className="font-mono text-sm text-primary-600 font-medium">{demanda.codigo_unico}</p>
            <h1 className="text-xl font-bold text-gray-900 mt-1">{demanda.nome_paciente}</h1>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={demanda.status} />
            <CorBadge cor={demanda.classificacao_cor} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">CPF</p>
              <p className="text-sm text-gray-900 mt-0.5">{demanda.cpf_paciente}</p>
            </div>
            {demanda.data_nascimento && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Data de Nascimento</p>
                <p className="text-sm text-gray-900 mt-0.5">
                  {format(new Date(demanda.data_nascimento + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            )}
            {demanda.telefone && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Telefone</p>
                <p className="text-sm text-gray-900 mt-0.5">{demanda.telefone}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Tipo de Demanda</p>
              <p className="text-sm text-gray-900 mt-0.5">{demanda.tipo_demanda}</p>
            </div>
            {demanda.info_setor && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Setor</p>
                <p className="text-sm text-gray-900 mt-0.5">{demanda.info_setor}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Data de Abertura</p>
              <p className="text-sm text-gray-900 mt-0.5">
                {format(new Date(demanda.data_abertura), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
            {demanda.data_conclusao && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Data de Conclusão</p>
                <p className="text-sm text-gray-900 mt-0.5">
                  {format(new Date(demanda.data_conclusao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            )}
            <div className="bg-indigo-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-indigo-700">
                <HiOutlineClock className="w-5 h-5" />
                <p className="text-xs uppercase tracking-wider font-medium">
                  {demanda.data_conclusao ? 'Tempo Total de Resposta' : 'Tempo Aguardando'}
                </p>
              </div>
              <p className="text-lg font-bold text-indigo-900 mt-1">{calcularTempo()}</p>
            </div>
          </div>
        </div>

        {demanda.descricao && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">Descrição</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{demanda.descricao}</p>
          </div>
        )}

        {demanda.observacoes && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">Observações</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{demanda.observacoes}</p>
          </div>
        )}

        {isAdmin && !['concluido', 'cancelado'].includes(demanda.status) && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">Alterar Status</p>
            <div className="flex flex-wrap gap-2">
              {statusFlow
                .filter(s => s !== demanda.status)
                .map(s => (
                  <button
                    key={s}
                    onClick={() => alterarStatus(s)}
                    disabled={statusLoading}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors disabled:opacity-50"
                  >
                    {s === 'aberto' ? 'Aberto' : s === 'em_analise' ? 'Em Análise' : s === 'em_andamento' ? 'Em Andamento' : 'Concluído'}
                  </button>
                ))}
              <button
                onClick={() => alterarStatus('devolvido')}
                disabled={statusLoading}
                className="px-4 py-2 bg-gray-100 hover:bg-red-100 rounded-lg text-sm font-medium text-gray-700 hover:text-red-700 transition-colors disabled:opacity-50"
              >
                Devolver
              </button>
              <button
                onClick={() => alterarStatus('cancelado')}
                disabled={statusLoading}
                className="px-4 py-2 bg-gray-100 hover:bg-red-100 rounded-lg text-sm font-medium text-gray-700 hover:text-red-700 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
