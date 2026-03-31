import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useAuditLog } from '../hooks/useAuditLog'
import { HiOutlineCog6Tooth, HiOutlineShieldCheck } from 'react-icons/hi2'

export function Configuracoes() {
  const { perfil, user } = useAuth()
  const { registrar } = useAuditLog()
  const [nome, setNome] = useState(perfil?.nome || '')
  const [bio, setBio] = useState(perfil?.bio || '')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  // Senha
  const [novaSenha, setNovaSenha] = useState('')
  const [senhaLoading, setSenhaLoading] = useState(false)
  const [senhaMsg, setSenhaMsg] = useState('')

  async function salvarPerfil(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setMsg('')

    const { error } = await supabase
      .from('perfis')
      .update({ nome, bio })
      .eq('id', user.id)

    if (error) {
      setMsg(`Erro: ${error.message}`)
    } else {
      await registrar('perfil.editar', 'perfil', { campos: ['nome', 'bio'] })
      setMsg('Perfil atualizado com sucesso!')
    }
    setLoading(false)
  }

  async function alterarSenha(e: React.FormEvent) {
    e.preventDefault()
    setSenhaLoading(true)
    setSenhaMsg('')

    const { error } = await supabase.auth.updateUser({ password: novaSenha })

    if (error) {
      setSenhaMsg(`Erro: ${error.message}`)
    } else {
      setSenhaMsg('Senha alterada com sucesso!')
      setNovaSenha('')
    }
    setSenhaLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-100 rounded-lg">
          <HiOutlineCog6Tooth className="w-6 h-6 text-gray-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-sm text-gray-500">Gerencie seu perfil e segurança</p>
        </div>
      </div>

      <form onSubmit={salvarPerfil} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900">Perfil</h2>

        {msg && (
          <div className={`px-4 py-3 rounded-lg text-sm ${msg.startsWith('Erro') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {msg}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
          <input
            type="text"
            value={nome}
            onChange={e => setNome(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
          <input
            type="email"
            disabled
            value={perfil?.email || ''}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea
            rows={3}
            value={bio}
            onChange={e => setBio(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? 'Salvando...' : 'Salvar Perfil'}
        </button>
      </form>

      <form onSubmit={alterarSenha} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <HiOutlineShieldCheck className="w-5 h-5" />
          Segurança
        </h2>

        {senhaMsg && (
          <div className={`px-4 py-3 rounded-lg text-sm ${senhaMsg.startsWith('Erro') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {senhaMsg}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
          <input
            type="password"
            minLength={6}
            required
            value={novaSenha}
            onChange={e => setNovaSenha(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <button
          type="submit"
          disabled={senhaLoading}
          className="px-5 py-2.5 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {senhaLoading ? 'Alterando...' : 'Alterar Senha'}
        </button>
      </form>
    </div>
  )
}
