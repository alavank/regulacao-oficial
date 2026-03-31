import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useAuditLog } from '../hooks/useAuditLog'
import { useParametros } from '../hooks/useParametros'
import { StatusBadge } from '../components/StatusBadge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Demanda } from '../types'
import { HiOutlineArrowLeft, HiOutlineClock, HiOutlineCheckCircle } from 'react-icons/hi2'

export function DetalhesDemanda() {
  const { id } = useParams<{ id: string }>()
  const { user, perfil } = useAuth()
  const { registrar } = useAuditLog()
  const { parametros: cores } = useParametros('cor')
  const { parametros: setores } = useParametros('setor')
  const [demanda, setDemanda] = useState<Demanda | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const isAdmin = perfil?.role === 'admin' || perfil?.role === 'regulacao'

  // Campos da regulação
  const [formStatus, setFormStatus] = useState('')
  const [formCor, setFormCor] = useState('')
  const [formTmat, setFormTmat] = useState('')
  const [formSetor, setFormSetor] = useState('')
  const [formObservacoes, setFormObservacoes] = useState('')
  const [formResposta, setFormResposta] = useState('')

  useEffect(() => {
    async function fetch() {
      if (!id) return
      const { data } = await supabase
        .from('demandas')
        .select('*, perfil:perfis!vereador_id(*)')
        .eq('id', id)
        .single()
      if (data) {
        const d = data as Demanda
        setDemanda(d)
        setFormStatus(d.status)
        setFormCor(d.classificacao_cor || '')
        setFormTmat(d.tmat || '')
        setFormSetor(d.info_setor || '')
        setFormObservacoes(d.observacoes || '')
        setFormResposta(d.resposta_regulacao || '')
        await registrar('demanda.visualizar', 'demandas', { codigo: d.codigo_unico })
      }
      setLoading(false)
    }
    fetch()
  }, [id])

  function calcularTempoResposta() {
    if (!demanda) return '-'
    const inicio = new Date(demanda.data_abertura).getTime()
    const fim = demanda.data_conclusao ? new Date(demanda.data_conclusao).getTime() : Date.now()
    const diffMs = fim - inicio
    const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const horas = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    return `${dias} dia(s) e ${horas} hora(s)`
  }

  async function salvarRegulacao(e: React.FormEvent) {
    e.preventDefault()
    if (!demanda || !user) return
    setSaving(true)
    setMsg('')

    const updateData: Record<string, unknown> = {
      status: formStatus,
      classificacao_cor: formCor || null,
      tmat: formTmat || null,
      info_setor: formSetor || null,
      observacoes: formObservacoes || null,
      resposta_regulacao: formResposta || null,
      regulador_id: user.id,
    }

    if (formStatus === 'concluido' && !demanda.data_conclusao) {
      updateData.data_conclusao = new Date().toISOString()
      const inicio = new Date(demanda.data_abertura).getTime()
      const fim = Date.now()
      updateData.tempo_resposta_dias = Math.ceil((fim - inicio) / (1000 * 60 * 60 * 24))
    }

    const { error } = await supabase
      .from('demandas')
      .update(updateData)
      .eq('id', demanda.id)

    if (error) {
      setMsg(`Erro: ${error.message}`)
    } else {
      await registrar('demanda.responder', 'demandas', {
        codigo: demanda.codigo_unico,
        novo_status: formStatus,
        classificacao: formCor,
        campos: 'status,classificacao,tmat,setor,observacoes,resposta',
      })
      setMsg('Demanda atualizada com sucesso!')
      // Refresh
      const { data } = await supabase
        .from('demandas')
        .select('*, perfil:perfis!vereador_id(*)')
        .eq('id', demanda.id)
        .single()
      if (data) setDemanda(data as Demanda)
    }
    setSaving(false)
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
        <HiOutlineArrowLeft className="w-4 h-4" />
        Voltar
      </Link>

      {/* Cabeçalho */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <p className="font-mono text-sm text-primary-600 font-medium">{demanda.codigo_unico}</p>
            <h1 className="text-xl font-bold text-gray-900 mt-1">{demanda.nome_paciente}</h1>
            {demanda.perfil && (
              <p className="text-sm text-gray-500 mt-0.5">Solicitado por: {demanda.perfil.nome}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={demanda.status} />
            {demanda.classificacao_cor && (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: cores.find(c => c.valor === demanda.classificacao_cor)?.config?.hex || '#6B7280' }}
              >
                {cores.find(c => c.valor === demanda.classificacao_cor)?.config?.label || demanda.classificacao_cor}
              </span>
            )}
          </div>
        </div>

        {/* Dados do vereador (somente leitura) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">CPF</p>
            <p className="text-sm text-gray-900 mt-0.5">{demanda.cpf_paciente}</p>
          </div>
          {demanda.data_nascimento && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Nascimento</p>
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
          {demanda.descricao_demanda && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Descrição</p>
              <p className="text-sm text-gray-900 mt-0.5">{demanda.descricao_demanda}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Data de Abertura</p>
            <p className="text-sm text-gray-900 mt-0.5">
              {format(new Date(demanda.data_abertura), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>

        {demanda.descricao && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Detalhes do Vereador</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{demanda.descricao}</p>
          </div>
        )}

        {/* Tempo de resposta */}
        <div className="mt-4 bg-indigo-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-indigo-700">
            <HiOutlineClock className="w-5 h-5" />
            <p className="text-xs uppercase tracking-wider font-medium">
              {demanda.data_conclusao ? 'Tempo Total de Resposta pela Regulação' : 'Tempo Aguardando Resposta'}
            </p>
          </div>
          <p className="text-lg font-bold text-indigo-900 mt-1">{calcularTempoResposta()}</p>
          {demanda.data_conclusao && (
            <p className="text-xs text-indigo-600 mt-1">
              Concluído em {format(new Date(demanda.data_conclusao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          )}
        </div>
      </div>

      {/* Área da regulação - visível para todos mas editável só por admin */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Resposta da Regulação</h2>
        <p className="text-sm text-gray-500 mb-6">
          {isAdmin ? 'Preencha os campos abaixo para responder esta demanda.' : 'Dados preenchidos pela equipe de regulação.'}
        </p>

        {msg && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${msg.startsWith('Erro') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {!msg.startsWith('Erro') && <HiOutlineCheckCircle className="w-5 h-5" />}
            {msg}
          </div>
        )}

        {isAdmin ? (
          <form onSubmit={salvarRegulacao} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formStatus}
                  onChange={e => setFormStatus(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                >
                  <option value="aberto">Aberto</option>
                  <option value="em_analise">Em Análise</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="concluido">Concluído</option>
                  <option value="devolvido">Devolvido</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TMAT</label>
                <input
                  type="text"
                  value={formTmat}
                  onChange={e => setFormTmat(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="Ex: 15 dias, 2 meses..."
                />
              </div>
            </div>

            {/* Classificação por cores - blocos clicáveis */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Classificação da Regulação</label>
              <div className="flex flex-wrap gap-3">
                {cores.map(cor => (
                  <button
                    key={cor.id}
                    type="button"
                    onClick={() => setFormCor(cor.valor)}
                    className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${
                      formCor === cor.valor
                        ? 'text-white shadow-lg scale-105'
                        : 'text-gray-700 bg-white hover:scale-105'
                    }`}
                    style={{
                      backgroundColor: formCor === cor.valor ? cor.config?.hex : undefined,
                      borderColor: cor.config?.hex || '#d1d5db',
                      color: formCor === cor.valor ? '#fff' : cor.config?.hex,
                    }}
                  >
                    {cor.config?.label || cor.valor}
                  </button>
                ))}
                {formCor && (
                  <button
                    type="button"
                    onClick={() => setFormCor('')}
                    className="px-4 py-3 rounded-xl text-sm text-gray-500 border-2 border-dashed border-gray-300 hover:bg-gray-50"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Setor Responsável</label>
              <select
                value={formSetor}
                onChange={e => setFormSetor(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              >
                <option value="">Selecione o setor...</option>
                {setores.map(s => (
                  <option key={s.id} value={s.valor}>{s.valor}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Informação do Setor Responsável</label>
              <textarea
                rows={3}
                value={formResposta}
                onChange={e => setFormResposta(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                placeholder="Informações detalhadas sobre o encaminhamento..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <textarea
                rows={3}
                value={formObservacoes}
                onChange={e => setFormObservacoes(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                placeholder="Observações internas da regulação..."
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {saving ? 'Salvando...' : 'Salvar Resposta'}
              </button>
            </div>
          </form>
        ) : (
          /* Visão somente leitura para o vereador */
          <div className="space-y-4">
            {demanda.classificacao_cor ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Classificação</p>
                  <span
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white mt-1"
                    style={{ backgroundColor: cores.find(c => c.valor === demanda.classificacao_cor)?.config?.hex || '#6B7280' }}
                  >
                    {cores.find(c => c.valor === demanda.classificacao_cor)?.config?.label || demanda.classificacao_cor}
                  </span>
                </div>
                {demanda.tmat && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">TMAT</p>
                    <p className="text-sm text-gray-900 mt-1 font-medium">{demanda.tmat}</p>
                  </div>
                )}
                {demanda.info_setor && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Setor Responsável</p>
                    <p className="text-sm text-gray-900 mt-1">{demanda.info_setor}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-700">
                A equipe de regulação ainda não respondeu esta demanda.
              </div>
            )}
            {demanda.resposta_regulacao && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Informação do Setor</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{demanda.resposta_regulacao}</p>
              </div>
            )}
            {demanda.observacoes && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Observações</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{demanda.observacoes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
