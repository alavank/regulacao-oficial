import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Demanda, DashboardStats } from '../types'
import { useAuth } from '../contexts/AuthContext'

interface FiltrosDemanda {
  status?: string
  tipo_demanda?: string
  classificacao_cor?: string
  data_inicio?: string
  data_fim?: string
  busca?: string
}

export function useDemandas(filtros: FiltrosDemanda = {}) {
  const { user, perfil } = useAuth()
  const [demandas, setDemandas] = useState<Demanda[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    abertos: 0,
    em_andamento: 0,
    concluidos: 0,
    cancelados: 0,
    tmat_medio: null,
  })

  const fetchDemandas = useCallback(async () => {
    if (!user) return
    setLoading(true)

    let query = supabase
      .from('demandas')
      .select('*, perfil:perfis!vereador_id(*)')
      .order('data_abertura', { ascending: false })

    if (filtros.status) query = query.eq('status', filtros.status)
    if (filtros.tipo_demanda) query = query.eq('tipo_demanda', filtros.tipo_demanda)
    if (filtros.classificacao_cor) query = query.eq('classificacao_cor', filtros.classificacao_cor)
    if (filtros.data_inicio) query = query.gte('data_abertura', filtros.data_inicio)
    if (filtros.data_fim) query = query.lte('data_abertura', filtros.data_fim + 'T23:59:59')
    if (filtros.busca) {
      query = query.or(
        `nome_paciente.ilike.%${filtros.busca}%,codigo_unico.ilike.%${filtros.busca}%,cpf_paciente.ilike.%${filtros.busca}%`
      )
    }

    const { data, error } = await query

    if (!error && data) {
      setDemandas(data as Demanda[])
      calcularStats(data as Demanda[])
    }
    setLoading(false)
  }, [user, perfil, filtros.status, filtros.tipo_demanda, filtros.classificacao_cor, filtros.data_inicio, filtros.data_fim, filtros.busca])

  function calcularStats(lista: Demanda[]) {
    const concluidas = lista.filter(d => d.status === 'concluido' && d.data_conclusao)
    let tmatTotalMs = 0

    for (const d of concluidas) {
      const abertura = new Date(d.data_abertura).getTime()
      const conclusao = new Date(d.data_conclusao!).getTime()
      tmatTotalMs += conclusao - abertura
    }

    const tmatMedioMs = concluidas.length > 0 ? tmatTotalMs / concluidas.length : 0
    const dias = Math.floor(tmatMedioMs / (1000 * 60 * 60 * 24))
    const horas = Math.floor((tmatMedioMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    setStats({
      total: lista.length,
      abertos: lista.filter(d => d.status === 'aberto').length,
      em_andamento: lista.filter(d => ['em_analise', 'em_andamento'].includes(d.status)).length,
      concluidos: concluidas.length,
      cancelados: lista.filter(d => ['cancelado', 'devolvido'].includes(d.status)).length,
      tmat_medio: concluidas.length > 0 ? `${dias}d ${horas}h` : null,
    })
  }

  async function criarDemanda(dados: {
    nome_paciente: string
    cpf_paciente: string
    data_nascimento?: string
    telefone?: string
    tipo_demanda: string
    descricao_demanda?: string
    descricao?: string
  }) {
    if (!user) return { error: 'Não autenticado' }

    const { data, error } = await supabase
      .from('demandas')
      .insert({
        ...dados,
        vereador_id: user.id,
        status: 'aberto',
        data_abertura: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) return { error: error.message }

    await supabase.from('auditoria_logs').insert({
      usuario_id: user.id,
      acao: 'demanda.criar',
      modulo: 'demandas',
      detalhes_json: { codigo: data.codigo_unico, tipo_demanda: dados.tipo_demanda },
      browser: navigator.userAgent,
      dispositivo: /Mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
    })

    await fetchDemandas()
    return { error: null, data }
  }

  async function atualizarStatus(demandaId: string, novoStatus: string, codigo: string) {
    const updateData: Record<string, unknown> = { status: novoStatus }
    if (novoStatus === 'concluido') {
      updateData.data_conclusao = new Date().toISOString()
    }

    const { error } = await supabase
      .from('demandas')
      .update(updateData)
      .eq('id', demandaId)

    if (error) return { error: error.message }

    await supabase.from('auditoria_logs').insert({
      usuario_id: user!.id,
      acao: 'demanda.atualizar_status',
      modulo: 'demandas',
      detalhes_json: { codigo, novo_status: novoStatus },
      browser: navigator.userAgent,
      dispositivo: /Mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
    })

    await fetchDemandas()
    return { error: null }
  }

  useEffect(() => {
    fetchDemandas()
  }, [fetchDemandas])

  return { demandas, loading, stats, criarDemanda, atualizarStatus, refetch: fetchDemandas }
}
