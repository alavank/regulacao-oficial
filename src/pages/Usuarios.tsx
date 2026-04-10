import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useAuditLog } from '../hooks/useAuditLog'
import type { Perfil } from '../types'
import {
  HiOutlineUsers,
  HiOutlineShieldCheck,
  HiOutlinePlusCircle,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineXMark,
  HiOutlineEye,
  HiOutlineCheck,
} from 'react-icons/hi2'

type PerfilExtended = Perfil & { deve_trocar_senha?: boolean; ativo?: boolean; telefone?: string }

export function Usuarios() {
  const { perfil: meuPerfil } = useAuth()
  const { registrar } = useAuditLog()
  const [usuarios, setUsuarios] = useState<PerfilExtended[]>([])
  const [loading, setLoading] = useState(true)

  // Modal
  const [modal, setModal] = useState<'criar' | 'editar' | 'detalhes' | null>(null)
  const [selecionado, setSelecionado] = useState<PerfilExtended | null>(null)

  // Form
  const [formLogin, setFormLogin] = useState('')
  const [formNome, setFormNome] = useState('')
  const [formRole, setFormRole] = useState('vereador')
  const [formSenha, setFormSenha] = useState('')
  const [formContato, setFormContato] = useState('')
  const [formBio, setFormBio] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetchUsuarios()
    registrar('modulo.acessar', 'usuarios', { modulo_nome: 'Usuários' })
  }, [])

  async function fetchUsuarios() {
    const { data } = await supabase.from('perfis').select('*').order('nome')
    if (data) setUsuarios(data as PerfilExtended[])
    setLoading(false)
  }

  function abrirCriar() {
    setModal('criar')
    setSelecionado(null)
    setFormLogin('')
    setFormNome('')
    setFormRole('vereador')
    setFormSenha('')
    setFormBio('')
    setMsg('')
  }

  function abrirEditar(u: PerfilExtended) {
    setModal('editar')
    setSelecionado(u)
    setFormNome(u.nome)
    setFormRole(u.role)
    setFormContato(u.telefone || '')
    setFormBio(u.bio || '')
    setMsg('')
  }

  function abrirDetalhes(u: PerfilExtended) {
    setModal('detalhes')
    setSelecionado(u)
    setMsg('')
  }

  function fecharModal() {
    setModal(null)
    setSelecionado(null)
  }

  function validarLogin(login: string): boolean {
    const partes = login.split('.')
    return partes.length === 2 && partes[0].length >= 2 && partes[1].length >= 2 && /^[a-z]+\.[a-z]+$/.test(login)
  }

  async function criarUsuario(e: React.FormEvent) {
    e.preventDefault()
    setFormLoading(true)
    setMsg('')

    if (/[^a-z.]/.test(formLogin)) {
      setMsg('Erro: O login não aceita acentos, cedilha ou caracteres especiais. Use apenas letras minúsculas e ponto.')
      setFormLoading(false)
      return
    }
    if (!validarLogin(formLogin)) {
      setMsg('Erro: O login deve ter o formato nome.sobrenome (ex: joao.silva)')
      setFormLoading(false)
      return
    }

    try {
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          login: formLogin,
          password: formSenha,
          nome: formNome,
          role: formRole,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMsg(`Erro: ${data.error}`)
      } else {
        await registrar('usuario.criar', 'usuarios', { nome: formNome, login: formLogin, role: formRole })
        setMsg('Usuário criado com sucesso! Ele deverá trocar a senha no primeiro login.')
        setTimeout(() => { fetchUsuarios(); fecharModal() }, 1500)
      }
    } catch (err: any) {
      setMsg(`Erro: ${err.message}`)
    }
    setFormLoading(false)
  }

  async function editarUsuario(e: React.FormEvent) {
    e.preventDefault()
    if (!selecionado) return
    setFormLoading(true)
    setMsg('')

    const { error } = await supabase
      .from('perfis')
      .update({
        nome: formNome,
        role: formRole,
        telefone: formContato || null,
        bio: formBio || null,
      })
      .eq('id', selecionado.id)

    if (error) {
      setMsg(`Erro: ${error.message}`)
    } else {
      await registrar('usuario.editar' as any, 'usuarios', { nome: formNome, role: formRole, usuario_id: selecionado.id })
      setMsg('Usuário atualizado!')
      setTimeout(() => { fetchUsuarios(); fecharModal() }, 1000)
    }
    setFormLoading(false)
  }

  async function desativarUsuario(u: PerfilExtended) {
    if (!confirm(`Desativar o usuário "${u.nome}"? Ele não poderá mais acessar o sistema.`)) return

    await supabase.from('perfis').update({ ativo: false }).eq('id', u.id)
    await registrar('usuario.desativar' as any, 'usuarios', { nome: u.nome, email: u.email })
    fetchUsuarios()
  }

  async function reativarUsuario(u: PerfilExtended) {
    await supabase.from('perfis').update({ ativo: true }).eq('id', u.id)
    fetchUsuarios()
  }

  async function resetarSenha(u: PerfilExtended) {
    if (!confirm(`Forçar troca de senha para "${u.nome}"? Na próxima vez que logar, será obrigado a criar uma nova senha.`)) return

    await supabase.from('perfis').update({ deve_trocar_senha: true }).eq('id', u.id)
    await registrar('usuario.resetar_senha' as any, 'usuarios', { nome: u.nome })
    setMsg('Troca de senha será exigida no próximo login.')
    fetchUsuarios()
  }

  if (meuPerfil?.role !== 'admin') {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Acesso restrito a administradores.</p>
      </div>
    )
  }

  const ativos = usuarios.filter(u => u.ativo !== false)
  const inativos = usuarios.filter(u => u.ativo === false)

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
          onClick={abrirCriar}
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <HiOutlinePlusCircle className="w-5 h-5" />
          Novo Usuário
        </button>
      </div>

      {msg && !modal && (
        <div className={`px-4 py-3 rounded-lg text-sm ${msg.startsWith('Erro') ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
          {msg}
        </div>
      )}

      {/* Tabela de usuários ativos */}
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
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Login</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Perfil</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">2FA</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Senha</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ativos.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => abrirDetalhes(u)} className="flex items-center gap-3 hover:underline">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs overflow-hidden">
                          {u.foto ? (
                            <img src={u.foto} alt="" className="w-full h-full object-cover" />
                          ) : (
                            u.nome.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="text-gray-900 font-medium">{u.nome}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{u.login || u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        u.role === 'admin' ? 'bg-red-100 text-red-800' :
                        u.role === 'regulacao' ? 'bg-purple-100 text-purple-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {u.role === 'regulacao' ? 'Regulação' : u.role === 'admin' ? 'Admin' : 'Vereador'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {u.mfa_enabled ? (
                        <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                          <HiOutlineShieldCheck className="w-4 h-4" /> Ativo
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Desativado</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {u.deve_trocar_senha ? (
                        <span className="text-xs text-amber-600 font-medium">Provisória</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600">
                          <HiOutlineCheck className="w-3 h-3" /> OK
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => abrirDetalhes(u)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver detalhes"
                        >
                          <HiOutlineEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => abrirEditar(u)}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <HiOutlinePencilSquare className="w-4 h-4" />
                        </button>
                        {u.id !== meuPerfil?.id && (
                          <button
                            onClick={() => desativarUsuario(u)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Desativar"
                          >
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inativos */}
      {inativos.length > 0 && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Usuários Inativos ({inativos.length})</p>
          <div className="space-y-2">
            {inativos.map(u => (
              <div key={u.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-100">
                <div>
                  <span className="text-sm text-gray-500 line-through">{u.nome}</span>
                  <span className="text-xs text-gray-400 ml-2">{u.login || u.email}</span>
                </div>
                <button onClick={() => reativarUsuario(u)} className="text-xs text-primary-600 hover:text-primary-800 font-medium">
                  Reativar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={fecharModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {modal === 'criar' ? 'Cadastrar Novo Usuário' : modal === 'editar' ? 'Editar Usuário' : 'Detalhes do Usuário'}
              </h2>
              <button onClick={fecharModal} className="p-1 hover:bg-gray-100 rounded-lg">
                <HiOutlineXMark className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {msg && (
                <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${msg.startsWith('Erro') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  {msg}
                </div>
              )}

              {/* DETALHES */}
              {modal === 'detalhes' && selecionado && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-2xl overflow-hidden">
                      {selecionado.foto ? (
                        <img src={selecionado.foto} alt="" className="w-full h-full object-cover" />
                      ) : (
                        selecionado.nome.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{selecionado.nome}</h3>
                      <p className="text-sm text-gray-500">{selecionado.email?.replace('@regulacao.local', '') || selecionado.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Perfil</p>
                      <p className="text-sm text-gray-900 mt-0.5 capitalize">{selecionado.role === 'regulacao' ? 'Regulação' : selecionado.role}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">2FA</p>
                      <p className="text-sm text-gray-900 mt-0.5">{selecionado.mfa_enabled ? 'Ativado' : 'Desativado'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Senha</p>
                      <p className="text-sm text-gray-900 mt-0.5">{selecionado.deve_trocar_senha ? 'Provisória (troca pendente)' : 'Definida pelo usuário'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Status</p>
                      <p className="text-sm text-gray-900 mt-0.5">{selecionado.ativo !== false ? 'Ativo' : 'Inativo'}</p>
                    </div>
                    {selecionado.telefone && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Telefone</p>
                        <p className="text-sm text-gray-900 mt-0.5">{selecionado.telefone}</p>
                      </div>
                    )}
                    {selecionado.bio && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Bio</p>
                        <p className="text-sm text-gray-900 mt-0.5">{selecionado.bio}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Cadastrado em</p>
                      <p className="text-sm text-gray-900 mt-0.5">
                        {new Date(selecionado.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => abrirEditar(selecionado)}
                      className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => { resetarSenha(selecionado) }}
                      className="flex-1 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-sm font-medium transition-colors"
                    >
                      Forçar Troca de Senha
                    </button>
                  </div>
                </div>
              )}

              {/* CRIAR */}
              {modal === 'criar' && (
                <form onSubmit={criarUsuario} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome Completo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text" required value={formNome} onChange={e => setFormNome(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                      placeholder="Nome completo do usuário"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Login <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text" required value={formLogin}
                      onChange={e => setFormLogin(e.target.value.toLowerCase())}
                      className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none ${
                        formLogin && !validarLogin(formLogin) ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="nome.sobrenome"
                    />
                    {formLogin && /[^a-z.]/.test(formLogin) ? (
                      <p className="text-xs text-red-500 mt-1">Apenas letras minúsculas sem acento e ponto. Não use ç, á, é, ã, etc.</p>
                    ) : formLogin && !validarLogin(formLogin) ? (
                      <p className="text-xs text-red-500 mt-1">Formato obrigatório: <strong>nome.sobrenome</strong> (ex: joao.silva)</p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">Formato obrigatório: <strong>nome.sobrenome</strong> (ex: joao.silva)</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Senha Inicial <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password" required minLength={6} value={formSenha} onChange={e => setFormSenha(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                      placeholder="Mínimo 6 caracteres"
                    />
                    <p className="text-xs text-gray-500 mt-1">O usuário será obrigado a trocar no primeiro acesso.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Perfil de Acesso <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formRole} onChange={e => setFormRole(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    >
                      <option value="vereador">Vereador</option>
                      <option value="regulacao">Regulação</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                  <div className="flex gap-3 justify-end pt-2">
                    <button type="button" onClick={fecharModal} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                      Cancelar
                    </button>
                    <button type="submit" disabled={formLoading} className="px-5 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg text-sm font-medium">
                      {formLoading ? 'Criando...' : 'Criar Usuário'}
                    </button>
                  </div>
                </form>
              )}

              {/* EDITAR */}
              {modal === 'editar' && (
                <form onSubmit={editarUsuario} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                    <input
                      type="text" required value={formNome} onChange={e => setFormNome(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Login</label>
                    <input type="text" disabled value={selecionado?.login || selecionado?.email || ''}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Perfil de Acesso</label>
                    <select
                      value={formRole} onChange={e => setFormRole(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    >
                      <option value="vereador">Vereador</option>
                      <option value="regulacao">Regulação</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contato</label>
                    <input
                      type="text" value={formContato} onChange={e => setFormContato(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                      placeholder="Telefone ou e-mail (opcional)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      rows={2} value={formBio} onChange={e => setFormBio(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                    />
                  </div>
                  <div className="flex gap-3 justify-end pt-2">
                    <button type="button" onClick={fecharModal} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                      Cancelar
                    </button>
                    <button type="submit" disabled={formLoading} className="px-5 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg text-sm font-medium">
                      {formLoading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
