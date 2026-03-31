import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDemandas } from '../hooks/useDemandas'
import { useParametros } from '../hooks/useParametros'
import { HiOutlineCheckCircle } from 'react-icons/hi2'

export function NovaDemanda() {
  const navigate = useNavigate()
  const { criarDemanda } = useDemandas()
  const { parametros: tipos } = useParametros('tipo')
  const { parametros: descricoes } = useParametros('descricao')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  const [form, setForm] = useState({
    nome_paciente: '',
    cpf_paciente: '',
    data_nascimento: '',
    telefone: '',
    tipo_demanda: '',
    descricao_demanda: '',
    descricao: '',
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
      nome_paciente: form.nome_paciente,
      cpf_paciente: form.cpf_paciente,
      data_nascimento: form.data_nascimento || undefined,
      telefone: form.telefone || undefined,
      tipo_demanda: form.tipo_demanda,
      descricao_demanda: form.descricao_demanda || undefined,
      descricao: form.descricao || undefined,
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
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Nova Demanda</h1>
      <p className="text-sm text-gray-500 mb-6">
        Preencha os dados do paciente. Após o envio, a equipe de regulação irá analisar e complementar a demanda.
      </p>

      {sucesso && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <HiOutlineCheckCircle className="w-5 h-5 flex-shrink-0" />
          {sucesso}
        </div>
      )}

      {erro && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* Dados do Paciente */}
        <div>
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Dados do Paciente</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo <span className="text-red-500">*</span>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
              <input
                type="date"
                value={form.data_nascimento}
                onChange={e => set('data_nascimento', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone de Contato</label>
              <input
                type="text"
                value={form.telefone}
                onChange={e => set('telefone', formatarTelefone(e.target.value))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
        </div>

        {/* Dados da Demanda */}
        <div className="pt-4 border-t border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Dados da Demanda</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                <option value="">Selecione o tipo...</option>
                {tipos.map(t => (
                  <option key={t.id} value={t.valor}>{t.valor}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição da Demanda</label>
              <select
                value={form.descricao_demanda}
                onChange={e => set('descricao_demanda', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              >
                <option value="">Selecione a descrição...</option>
                {descricoes.map(d => (
                  <option key={d.id} value={d.valor}>{d.valor}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Detalhes Adicionais</label>
              <textarea
                rows={3}
                value={form.descricao}
                onChange={e => set('descricao', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                placeholder="Informações complementares sobre a demanda (opcional)..."
              />
            </div>
          </div>
        </div>

        {/* Info: campos da regulação */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-700">
          Os campos <strong>Status</strong>, <strong>Classificação</strong>, <strong>TMAT</strong>,{' '}
          <strong>Setor Responsável</strong> e <strong>Observações</strong> serão preenchidos
          pela equipe de regulação após a análise da demanda.
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
            {loading ? 'Enviando...' : 'Enviar Demanda'}
          </button>
        </div>
      </form>
    </div>
  )
}
