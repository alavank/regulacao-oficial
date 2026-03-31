import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuditLog } from '../hooks/useAuditLog'
import type { Parametro } from '../types'
import {
  HiOutlineAdjustmentsHorizontal,
  HiOutlinePlusCircle,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineXMark,
} from 'react-icons/hi2'

const CATEGORIAS = [
  { value: 'tipo', label: 'Tipos de Demanda', desc: 'Opções que o vereador seleciona no campo "Tipo de Demanda"' },
  { value: 'descricao', label: 'Descrições de Demanda', desc: 'Opções do dropdown "Descrição da Demanda"' },
  { value: 'cor', label: 'Classificações (Cores)', desc: 'Cores usadas pela regulação para classificar demandas' },
  { value: 'setor', label: 'Setores Responsáveis', desc: 'Setores que a regulação pode selecionar' },
]

export function Parametros() {
  const { registrar } = useAuditLog()
  const [parametros, setParametros] = useState<Parametro[]>([])
  const [loading, setLoading] = useState(true)
  const [categoriaAtiva, setCategoriaAtiva] = useState('tipo')

  // Form
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<Parametro | null>(null)
  const [formValor, setFormValor] = useState('')
  const [formDescricao, setFormDescricao] = useState('')
  const [formHex, setFormHex] = useState('#3B82F6')
  const [formLabel, setFormLabel] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetchParametros()
    registrar('modulo.acessar', 'parametros', { modulo_nome: 'Parâmetros' })
  }, [])

  async function fetchParametros() {
    const { data } = await supabase
      .from('parametros')
      .select('*')
      .order('categoria')
      .order('valor')
    if (data) setParametros(data as Parametro[])
    setLoading(false)
  }

  const filtrados = parametros.filter(p => p.categoria === categoriaAtiva && p.ativo)
  const inativos = parametros.filter(p => p.categoria === categoriaAtiva && !p.ativo)

  function abrirForm(param?: Parametro) {
    if (param) {
      setEditando(param)
      setFormValor(param.valor)
      setFormDescricao(param.config?.descricao || '')
      setFormHex(param.config?.hex || '#3B82F6')
      setFormLabel(param.config?.label || '')
    } else {
      setEditando(null)
      setFormValor('')
      setFormDescricao('')
      setFormHex('#3B82F6')
      setFormLabel('')
    }
    setShowForm(true)
    setMsg('')
  }

  function fecharForm() {
    setShowForm(false)
    setEditando(null)
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setFormLoading(true)
    setMsg('')

    const config: Record<string, string> = { descricao: formDescricao }
    if (categoriaAtiva === 'cor') {
      config.hex = formHex
      config.label = formLabel || formValor
    }

    if (editando) {
      const { error } = await supabase
        .from('parametros')
        .update({ valor: formValor, config })
        .eq('id', editando.id)
      if (error) { setMsg(`Erro: ${error.message}`); setFormLoading(false); return }
      await registrar('parametro.editar', 'parametros', { valor: formValor, categoria: categoriaAtiva })
    } else {
      const { error } = await supabase
        .from('parametros')
        .insert({ categoria: categoriaAtiva, valor: formValor, config, ativo: true })
      if (error) { setMsg(`Erro: ${error.message}`); setFormLoading(false); return }
      await registrar('parametro.criar', 'parametros', { valor: formValor, categoria: categoriaAtiva })
    }

    await fetchParametros()
    fecharForm()
    setFormLoading(false)
  }

  async function desativar(param: Parametro) {
    if (!confirm(`Desativar "${param.valor}"? Isso não apaga o registro, apenas oculta.`)) return
    await supabase.from('parametros').update({ ativo: false }).eq('id', param.id)
    await registrar('parametro.excluir', 'parametros', { valor: param.valor, categoria: param.categoria })
    fetchParametros()
  }

  async function reativar(param: Parametro) {
    await supabase.from('parametros').update({ ativo: true }).eq('id', param.id)
    fetchParametros()
  }

  const catInfo = CATEGORIAS.find(c => c.value === categoriaAtiva)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-100 rounded-lg">
          <HiOutlineAdjustmentsHorizontal className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parâmetros do Sistema</h1>
          <p className="text-sm text-gray-500">Configure as opções disponíveis no sistema</p>
        </div>
      </div>

      {/* Abas de categorias */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIAS.map(cat => (
          <button
            key={cat.value}
            onClick={() => { setCategoriaAtiva(cat.value); setShowForm(false) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              categoriaAtiva === cat.value
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Descrição da categoria + botão novo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-gray-500">{catInfo?.desc}</p>
        <button
          onClick={() => abrirForm()}
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <HiOutlinePlusCircle className="w-5 h-5" />
          Novo Parâmetro
        </button>
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-lg text-sm ${msg.startsWith('Erro') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {msg}
        </div>
      )}

      {/* Formulário */}
      {showForm && (
        <form onSubmit={salvar} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {editando ? 'Editar Parâmetro' : 'Novo Parâmetro'}
            </h2>
            <button type="button" onClick={fecharForm} className="p-1 hover:bg-gray-100 rounded-lg">
              <HiOutlineXMark className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor / Nome</label>
              <input
                type="text"
                required
                value={formValor}
                onChange={e => setFormValor(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="Ex: Consulta Especializada"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <input
                type="text"
                value={formDescricao}
                onChange={e => setFormDescricao(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="Descrição opcional"
              />
            </div>

            {categoriaAtiva === 'cor' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Label da cor</label>
                  <input
                    type="text"
                    value={formLabel}
                    onChange={e => setFormLabel(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    placeholder="Ex: Urgente"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor (hex)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formHex}
                      onChange={e => setFormHex(e.target.value)}
                      className="w-12 h-10 rounded cursor-pointer border border-gray-300"
                    />
                    <input
                      type="text"
                      value={formHex}
                      onChange={e => setFormHex(e.target.value)}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    />
                    <div
                      className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                      style={{ backgroundColor: formHex }}
                    >
                      {formLabel || formValor || 'Preview'}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={fecharForm} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={formLoading} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg text-sm font-medium">
              {formLoading ? 'Salvando...' : editando ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </form>
      )}

      {/* Lista de parâmetros */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">Nenhum parâmetro cadastrado nesta categoria.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtrados.map(p => (
              <div key={p.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  {categoriaAtiva === 'cor' && p.config?.hex && (
                    <div
                      className="w-8 h-8 rounded-lg shadow-sm border border-gray-200"
                      style={{ backgroundColor: p.config.hex }}
                    />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.valor}</p>
                    {p.config?.descricao && (
                      <p className="text-xs text-gray-500 mt-0.5">{p.config.descricao}</p>
                    )}
                    {categoriaAtiva === 'cor' && p.config?.label && (
                      <p className="text-xs text-gray-500 mt-0.5">Label: {p.config.label} | {p.config.hex}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => abrirForm(p)}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <HiOutlinePencilSquare className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => desativar(p)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Desativar"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inativos */}
      {inativos.length > 0 && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Inativos ({inativos.length})</p>
          <div className="space-y-2">
            {inativos.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-100">
                <span className="text-sm text-gray-500 line-through">{p.valor}</span>
                <button
                  onClick={() => reativar(p)}
                  className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                >
                  Reativar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
