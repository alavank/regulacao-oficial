import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useAuditLog } from '../hooks/useAuditLog'
import type { Perfil } from '../types'
import { HiOutlineUsers, HiOutlineShieldCheck } from 'react-icons/hi2'

export function Usuarios() {
  const { perfil: meuPerfil } = useAuth()
  const { registrar } = useAuditLog()
  const [usuarios, setUsuarios] = useState<Perfil[]>([])
  const [loading, setLoading] = useState(true)

  // Form novo usuário
  const [showForm, setShowForm] = useState(false)
  const [formEmail, setFormEmail] = useState('')
  const [formNome, setFormNome] = useState('')
  const [formRole, setFormRole] = useState('vereador')
  const [formSenha, setFormSenha] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetchUsuarios()
  }, [])

  async function fetchUsuarios() {
    const { data } = await supabase.from('perfis').select('*').order('nome')
    if (data) setUsuarios(data as Perfil[])
    setLoading(false)
  }

  async function criarUsuario(e: React.FormEvent) {
    e.preventDefault()
    setFormLoading(true)
    setMsg('')

    const { error } = await supabase.auth.signUp({
      email: formEmail,
      password: formSenha,
      options: {
        data: { nome: formNome, role: formRole },
      },
    })

    if (error) {
      setMsg(`Erro: ${error.message}`)
    } else {
      await registrar('usuario.criar', 'usuarios', { nome: formNome, email: formEmail, role: formRole })
      setMsg('Usuário criado com sucesso!')
      setShowForm(false)
      setFormEmail('')
      setFormNome('')
      setFormRole('vereador')
      setFormSenha('')
      setTimeout(fetchUsuarios, 1000)
    }
    setFormLoading(false)
  }

  if (meuPerfil?.role !== 'admin') {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Acesso restrito a administradores.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <HiOutlineUsers className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
            <p className="text-sm text-gray-500">Gerenciar usuários do sistema</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          {showForm ? 'Cancelar' : 'Novo Usuário'}
        </button>
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-lg text-sm ${msg.startsWith('Erro') ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
          {msg}
        </div>
      )}

      {showForm && (
        <form onSubmit={criarUsuario} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Cadastrar Novo Usuário</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                type="text"
                required
                value={formNome}
                onChange={e => setFormNome(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                required
                value={formEmail}
                onChange={e => setFormEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input
                type="password"
                required
                minLength={6}
                value={formSenha}
                onChange={e => setFormSenha(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Perfil</label>
              <select
                value={formRole}
                onChange={e => setFormRole(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              >
                <option value="vereador">Vereador</option>
                <option value="regulacao">Regulação</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={formLoading}
            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {formLoading ? 'Criando...' : 'Criar Usuário'}
          </button>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nome</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">E-mail</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Perfil</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">2FA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usuarios.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs">
                          {u.nome.charAt(0)}
                        </div>
                        <span className="text-gray-900 font-medium">{u.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        u.role === 'admin' ? 'bg-red-100 text-red-800' :
                        u.role === 'regulacao' ? 'bg-purple-100 text-purple-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {u.mfa_enabled ? (
                        <HiOutlineShieldCheck className="w-5 h-5 text-green-600" />
                      ) : (
                        <span className="text-xs text-gray-400">Desativado</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
