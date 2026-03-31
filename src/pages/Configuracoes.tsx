import { useState, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useAuditLog } from '../hooks/useAuditLog'
import {
  HiOutlineCog6Tooth,
  HiOutlineShieldCheck,
  HiOutlineCamera,
  HiOutlineKey,
  HiOutlineUserCircle,
} from 'react-icons/hi2'

export function Configuracoes() {
  const { perfil, user, reloadPerfil } = useAuth()
  const { registrar } = useAuditLog()
  const fileRef = useRef<HTMLInputElement>(null)

  // Perfil
  const [nome, setNome] = useState(perfil?.nome || '')
  const [bio, setBio] = useState(perfil?.bio || '')
  const [telefone, setTelefone] = useState((perfil as any)?.telefone || '')
  const [fotoUrl, setFotoUrl] = useState(perfil?.foto || '')
  const [perfilLoading, setPerfilLoading] = useState(false)
  const [perfilMsg, setPerfilMsg] = useState('')

  // Senha
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [senhaLoading, setSenhaLoading] = useState(false)
  const [senhaMsg, setSenhaMsg] = useState('')

  // 2FA
  const [mfaStep, setMfaStep] = useState<'idle' | 'enrolling' | 'verifying'>('idle')
  const [mfaQr, setMfaQr] = useState('')
  const [mfaSecret, setMfaSecret] = useState('')
  const [mfaFactorId, setMfaFactorId] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [mfaLoading, setMfaLoading] = useState(false)
  const [mfaMsg, setMfaMsg] = useState('')

  // Upload foto
  const [uploadLoading, setUploadLoading] = useState(false)

  async function salvarPerfil(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setPerfilLoading(true)
    setPerfilMsg('')

    const { error } = await supabase
      .from('perfis')
      .update({ nome, bio, telefone: telefone || null, foto: fotoUrl || null })
      .eq('id', user.id)

    if (error) {
      setPerfilMsg(`Erro: ${error.message}`)
    } else {
      await registrar('perfil.editar', 'perfil', { campos: 'nome,bio,telefone,foto' })
      setPerfilMsg('Perfil atualizado com sucesso!')
      reloadPerfil()
    }
    setPerfilLoading(false)
  }

  async function handleUploadFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadLoading(true)

    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`

    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (error) {
      setPerfilMsg(`Erro no upload: ${error.message}`)
      setUploadLoading(false)
      return
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
    const url = urlData.publicUrl + '?t=' + Date.now()
    setFotoUrl(url)

    // Salvar URL no perfil
    await supabase.from('perfis').update({ foto: url }).eq('id', user.id)
    setPerfilMsg('Foto atualizada!')
    reloadPerfil()
    setUploadLoading(false)
  }

  async function alterarSenha(e: React.FormEvent) {
    e.preventDefault()
    setSenhaMsg('')

    if (novaSenha.length < 6) {
      setSenhaMsg('A senha deve ter no mínimo 6 caracteres.')
      return
    }
    if (novaSenha !== confirmarSenha) {
      setSenhaMsg('As senhas não coincidem.')
      return
    }

    setSenhaLoading(true)
    const { error } = await supabase.auth.updateUser({ password: novaSenha })
    if (error) {
      setSenhaMsg(`Erro: ${error.message}`)
    } else {
      setSenhaMsg('Senha alterada com sucesso!')
      setNovaSenha('')
      setConfirmarSenha('')
    }
    setSenhaLoading(false)
  }

  // 2FA - Iniciar enrollment
  async function iniciar2FA() {
    setMfaLoading(true)
    setMfaMsg('')
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
      if (error) throw error
      setMfaQr(data.totp.qr_code)
      setMfaSecret(data.totp.secret)
      setMfaFactorId(data.id)
      setMfaStep('enrolling')
    } catch (err: any) {
      setMfaMsg(`Erro: ${err.message}`)
    }
    setMfaLoading(false)
  }

  // 2FA - Verificar código
  async function verificar2FA(e: React.FormEvent) {
    e.preventDefault()
    setMfaLoading(true)
    setMfaMsg('')
    try {
      const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: mfaFactorId })
      if (challengeErr) throw challengeErr

      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challenge.id,
        code: mfaCode,
      })
      if (verifyErr) throw verifyErr

      // Atualizar perfil
      await supabase.from('perfis').update({ mfa_enabled: true }).eq('id', user!.id)
      await registrar('auth.mfa_ativar', 'autenticacao', {})
      setMfaMsg('Autenticação de dois fatores ativada com sucesso!')
      setMfaStep('idle')
      reloadPerfil()
    } catch (err: any) {
      setMfaMsg(`Erro: ${err.message}`)
    }
    setMfaLoading(false)
  }

  // 2FA - Desativar
  async function desativar2FA() {
    if (!confirm('Tem certeza que deseja desativar a autenticação de dois fatores?')) return
    setMfaLoading(true)
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const totp = factors?.totp?.[0]
      if (totp) {
        await supabase.auth.mfa.unenroll({ factorId: totp.id })
      }
      await supabase.from('perfis').update({ mfa_enabled: false }).eq('id', user!.id)
      setMfaMsg('2FA desativado.')
      reloadPerfil()
    } catch (err: any) {
      setMfaMsg(`Erro: ${err.message}`)
    }
    setMfaLoading(false)
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

      {/* === PERFIL === */}
      <form onSubmit={salvarPerfil} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div className="flex items-center gap-2">
          <HiOutlineUserCircle className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Perfil</h2>
        </div>

        {perfilMsg && (
          <div className={`px-4 py-3 rounded-lg text-sm ${perfilMsg.startsWith('Erro') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {perfilMsg}
          </div>
        )}

        {/* Foto */}
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-2xl overflow-hidden border-2 border-gray-200">
              {fotoUrl ? (
                <img src={fotoUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                perfil?.nome?.charAt(0)?.toUpperCase() || '?'
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploadLoading}
              className="absolute -bottom-1 -right-1 p-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-md transition-colors"
            >
              <HiOutlineCamera className="w-4 h-4" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUploadFoto}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{perfil?.nome}</p>
            <p className="text-xs text-gray-500">{perfil?.email}</p>
            <p className="text-xs text-gray-400 capitalize mt-0.5">{perfil?.role}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome de Exibição</label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <input
              type="text"
              value={telefone}
              onChange={e => setTelefone(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
          <input type="email" disabled value={perfil?.email || ''} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sobre Mim</label>
          <textarea
            rows={3}
            value={bio}
            onChange={e => setBio(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
            placeholder="Uma breve descrição sobre você..."
          />
        </div>

        <button type="submit" disabled={perfilLoading} className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg text-sm font-medium transition-colors">
          {perfilLoading ? 'Salvando...' : 'Salvar Perfil'}
        </button>
      </form>

      {/* === SENHA === */}
      <form onSubmit={alterarSenha} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div className="flex items-center gap-2">
          <HiOutlineKey className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Alterar Senha</h2>
        </div>

        {senhaMsg && (
          <div className={`px-4 py-3 rounded-lg text-sm ${senhaMsg.startsWith('Erro') || senhaMsg.startsWith('As senhas') || senhaMsg.startsWith('A senha') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {senhaMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
            <input
              type="password" required minLength={6} value={novaSenha} onChange={e => setNovaSenha(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Senha</label>
            <input
              type="password" required minLength={6} value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="Repita a nova senha"
            />
          </div>
        </div>

        <button type="submit" disabled={senhaLoading} className="px-5 py-2.5 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors">
          {senhaLoading ? 'Alterando...' : 'Alterar Senha'}
        </button>
      </form>

      {/* === 2FA === */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HiOutlineShieldCheck className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Autenticação de Dois Fatores (2FA)</h2>
          </div>
          {perfil?.mfa_enabled && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Ativo
            </span>
          )}
        </div>

        <p className="text-sm text-gray-500">
          Adicione uma camada extra de segurança à sua conta usando um aplicativo autenticador como Google Authenticator ou Authy.
        </p>

        {mfaMsg && (
          <div className={`px-4 py-3 rounded-lg text-sm ${mfaMsg.startsWith('Erro') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {mfaMsg}
          </div>
        )}

        {mfaStep === 'idle' && (
          <>
            {perfil?.mfa_enabled ? (
              <button
                onClick={desativar2FA}
                disabled={mfaLoading}
                className="px-5 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
              >
                {mfaLoading ? 'Processando...' : 'Desativar 2FA'}
              </button>
            ) : (
              <button
                onClick={iniciar2FA}
                disabled={mfaLoading}
                className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {mfaLoading ? 'Configurando...' : 'Ativar 2FA'}
              </button>
            )}
          </>
        )}

        {mfaStep === 'enrolling' && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-3">
                1. Escaneie o QR Code com seu aplicativo autenticador:
              </p>
              <div className="flex justify-center">
                <img src={mfaQr} alt="QR Code 2FA" className="w-48 h-48" />
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                Ou insira manualmente: <code className="bg-white px-2 py-0.5 rounded text-xs">{mfaSecret}</code>
              </p>
            </div>

            <form onSubmit={verificar2FA} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  2. Digite o código de 6 dígitos do app:
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={mfaCode}
                  onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-[0.5em] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="000000"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setMfaStep('idle')}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={mfaLoading || mfaCode.length !== 6}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg text-sm font-medium"
                >
                  {mfaLoading ? 'Verificando...' : 'Verificar e Ativar'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
