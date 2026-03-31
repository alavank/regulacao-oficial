import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDemandas } from '../hooks/useDemandas'
import { useParametros } from '../hooks/useParametros'
import { HiOutlineCheckCircle } from 'react-icons/hi2'

export function NovaDemanda() {
  const navigate = useNavigate()
  const { criarDemanda } = useDemandas()
  const { parametros: tipos } = useParametros('tipo')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  const [form, setForm] = useState({
    nome_paciente: '',
    cpf_paciente: '',
    data_nascimento: '',
    telefone: '',
    tipo_demanda: '',
    descricao: '',
    classificacao_cor: 'verde',
    info_setor: '',
    observacoes: '',
  })

  function set(campo: string, valor: string) {
    setForm(prev => ({ ...prev, [campo]: valor }))
  }

  function formatarCPF(valor: string) {
    const digits = valor.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
  }

  function formatarTelefone(valor: string) {
    const digits = valor.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 2) return digits
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setSucesso('')
    setLoading(true)

    if (!form.nome_paciente || !form.cpf_paciente || !form.tipo_demanda) {
      setErro('Preencha todos os campos obrigatórios.')
      setLoading(false)
      return
    }

    const result = await criarDemanda({
      ...form,
      data_nascimento: form.data_nascimento || undefined,
      telefone: form.telefone || undefined,
      descricao: form.descricao || undefined,
      info_setor: form.info_setor || undefined,
      observacoes: form.observacoes || undefined,
    })

    if (result.error) {
      setErro(result.error)
    } else {
      setSucesso(`Demanda ${result.data?.codigo_unico} criada com sucesso!`)
      setTimeout(() => navigate('/dashboard'), 2000)
    }
    setLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nova Demanda</h1>

      {sucesso && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <HiOutlineCheckCircle className="w-5 h-5" />
          {sucesso}
        </div>
      )}

      {erro && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Paciente <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.nome_paciente}
              onChange={e => set('nome_paciente', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="Nome completo do paciente"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CPF <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.cpf_paciente}
              onChange={e => set('cpf_paciente', formatarCPF(e.target.value))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="000.000.000-00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Nascimento
            </label>
            <input
              type="date"
              value={form.data_nascimento}
              onChange={e => set('data_nascimento', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <input
              type="text"
              value={form.telefone}
              onChange={e => set('telefone', formatarTelefone(e.target.value))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="(00) 00000-0000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Demanda <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={form.tipo_demanda}
              onChange={e => set('tipo_demanda', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="">Selecione...</option>
              {tipos.map(t => (
                <option key={t.id} value={t.valor}>{t.valor}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Classificação</label>
            <select
              value={form.classificacao_cor}
              onChange={e => set('classificacao_cor', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="verde">Verde - Normal</option>
              <option value="amarelo">Amarelo - Atenção</option>
              <option value="vermelho">Vermelho - Urgente</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Setor / Informação Adicional
            </label>
            <input
              type="text"
              value={form.info_setor}
              onChange={e => set('info_setor', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="Ex: Ortopedia, Cardiologia..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              rows={3}
              value={form.descricao}
              onChange={e => set('descricao', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
              placeholder="Descreva os detalhes da demanda..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea
              rows={2}
              value={form.observacoes}
              onChange={e => set('observacoes', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
              placeholder="Observações adicionais..."
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? 'Cadastrando...' : 'Cadastrar Demanda'}
          </button>
        </div>
      </form>
    </div>
  )
}
