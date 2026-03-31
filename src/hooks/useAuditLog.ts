import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useAuditLog() {
  const { user } = useAuth()

  async function registrar(
    acao: string,
    modulo: string,
    detalhes: Record<string, unknown> = {}
  ) {
    if (!user) return

    await supabase.from('auditoria_logs').insert({
      usuario_id: user.id,
      acao,
      modulo,
      detalhes_json: detalhes,
      browser: navigator.userAgent,
      dispositivo: /Mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
    })
  }

  return { registrar }
}
