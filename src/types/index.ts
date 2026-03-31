export interface Perfil {
  id: string
  nome: string
  email: string
  role: 'vereador' | 'admin' | 'regulacao'
  foto: string | null
  bio: string | null
  mfa_enabled: boolean
  created_at: string
  updated_at: string
}

export interface Demanda {
  id: string
  codigo_unico: string
  vereador_id: string
  nome_paciente: string
  cpf_paciente: string
  data_nascimento: string | null
  telefone: string | null
  tipo_demanda: string
  descricao: string | null
  status: 'aberto' | 'em_analise' | 'em_andamento' | 'concluido' | 'cancelado' | 'devolvido'
  data_abertura: string
  data_conclusao: string | null
  tmat: string | null
  classificacao_cor: 'verde' | 'amarelo' | 'vermelho'
  info_setor: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
  // join
  perfil?: Perfil
}

export interface Parametro {
  id: string
  categoria: 'tipo' | 'status' | 'cor'
  valor: string
  config: Record<string, string>
  ativo: boolean
  created_at: string
}

export interface AuditoriaLog {
  id: string
  usuario_id: string | null
  acao: string
  modulo: string
  detalhes_json: Record<string, unknown>
  ip: string | null
  browser: string | null
  dispositivo: string | null
  localizacao_prox: string | null
  created_at: string
}

export interface AuditoriaHumanizada extends AuditoriaLog {
  usuario_nome: string
  usuario_role: string
  mensagem_humanizada: string
}

export interface TransparenciaPublica {
  codigo_unico: string
  iniciais_paciente: string
  cpf_anonimizado: string
  tipo_demanda: string
  status: string
  classificacao_cor: string
  data_abertura: string
  data_conclusao: string | null
  tmat: string | null
  nome_vereador: string
}

export interface DashboardStats {
  total: number
  abertos: number
  em_andamento: number
  concluidos: number
  cancelados: number
  tmat_medio: string | null
}

// Supabase Database type helper
export interface Database {
  public: {
    Tables: {
      perfis: { Row: Perfil; Insert: Omit<Perfil, 'created_at' | 'updated_at'>; Update: Partial<Perfil> }
      demandas: { Row: Demanda; Insert: Omit<Demanda, 'id' | 'codigo_unico' | 'tmat' | 'created_at' | 'updated_at'>; Update: Partial<Demanda> }
      parametros: { Row: Parametro; Insert: Omit<Parametro, 'id' | 'created_at'>; Update: Partial<Parametro> }
      auditoria_logs: { Row: AuditoriaLog; Insert: Omit<AuditoriaLog, 'id' | 'created_at'>; Update: never }
    }
    Views: {
      transparencia_publica: { Row: TransparenciaPublica }
      auditoria_humanizada: { Row: AuditoriaHumanizada }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
