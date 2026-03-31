import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { HiOutlineShieldExclamation } from 'react-icons/hi2'

export function TrocarSenha() {
  const { user } = useAuth()
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (novaSenha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres.')
      return
    }
    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password: novaSenha })
    if (error) {
      setErro(`Erro: ${error.message}`)
      setLoading(false)
      return
    }

    // Marcar que já trocou a senha
    await supabase.from('perfis').update({ deve_trocar_senha: false }).eq('id', user!.id)

    // Registrar log
    await supabase.from('auditoria_logs').insert({
      usuario_id: user!.id,
      acao: 'auth.trocar_senha',
      modulo: 'autenticacao',
      detalhes_json: { motivo: 'primeiro_acesso' },
      browser: navigator.userAgent,
      dispositivo: /Mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
    })

    // Recarregar para pegar o perfil atualizado
    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-2xl mb-4">
              <HiOutlineShieldExclamation className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Trocar Senha</h1>
            <p className="text-sm text-gray-500 mt-2">
              Por segurança, é necessário criar uma nova senha antes de acessar o sistema.
              A senha provisória não pode ser utilizada.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {erro && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {erro}
              </div>
            )}

            <div>
              <label htmlFor="nova" className="block text-sm font-medium text-gray-700 mb-1">
                Nova Senha
              </label>
              <input
                id="nova"
                type="password"
                required
                minLength={6}
                value={novaSenha}
                onChange={e => setNovaSenha(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label htmlFor="confirmar" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Nova Senha
              </label>
              <input
                id="confirmar"
                type="password"
                required
                minLength={6}
                value={confirmarSenha}
                onChange={e => setConfirmarSenha(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="Repita a nova senha"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-medium py-3 rounded-lg transition-colors text-sm"
            >
              {loading ? 'Salvando...' : 'Definir Nova Senha'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
