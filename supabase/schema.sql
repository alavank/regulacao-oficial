-- ============================================================
-- SISTEMA DE CADASTRO DE DEMANDAS DE SAÚDE
-- Schema SQL para Supabase (PostgreSQL)
-- ============================================================

-- 1. EXTENSÕES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. SEQUÊNCIA PARA CÓDIGO ÚNICO DAS DEMANDAS
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS demandas_seq START 1 INCREMENT 1;

-- 3. FUNÇÃO PARA GERAR CÓDIGO ÚNICO
-- ============================================================
CREATE OR REPLACE FUNCTION gerar_codigo_demanda()
RETURNS TEXT AS $$
BEGIN
  RETURN 'DEM-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(nextval('demandas_seq')::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- 4. TABELA: perfis
-- ============================================================
CREATE TABLE IF NOT EXISTS perfis (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'vereador' CHECK (role IN ('vereador', 'admin', 'regulacao')),
  foto TEXT,
  bio TEXT,
  mfa_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABELA: parametros
-- ============================================================
CREATE TABLE IF NOT EXISTS parametros (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  categoria TEXT NOT NULL CHECK (categoria IN ('tipo', 'status', 'cor')),
  valor TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABELA: demandas
-- ============================================================
CREATE TABLE IF NOT EXISTS demandas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo_unico TEXT UNIQUE NOT NULL DEFAULT gerar_codigo_demanda(),
  vereador_id UUID NOT NULL REFERENCES perfis(id) ON DELETE RESTRICT,
  nome_paciente TEXT NOT NULL,
  cpf_paciente TEXT NOT NULL,
  data_nascimento DATE,
  telefone TEXT,
  tipo_demanda TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'em_analise', 'em_andamento', 'concluido', 'cancelado', 'devolvido')),
  data_abertura TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_conclusao TIMESTAMPTZ,
  tmat INTERVAL GENERATED ALWAYS AS (data_conclusao - data_abertura) STORED,
  classificacao_cor TEXT DEFAULT 'verde' CHECK (classificacao_cor IN ('verde', 'amarelo', 'vermelho')),
  info_setor TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABELA: auditoria_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS auditoria_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES perfis(id) ON DELETE SET NULL,
  acao TEXT NOT NULL,
  modulo TEXT NOT NULL,
  detalhes_json JSONB DEFAULT '{}',
  ip TEXT,
  browser TEXT,
  dispositivo TEXT,
  localizacao_prox TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_demandas_vereador ON demandas(vereador_id);
CREATE INDEX IF NOT EXISTS idx_demandas_status ON demandas(status);
CREATE INDEX IF NOT EXISTS idx_demandas_data_abertura ON demandas(data_abertura);
CREATE INDEX IF NOT EXISTS idx_demandas_codigo ON demandas(codigo_unico);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria_logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_created ON auditoria_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_parametros_categoria ON parametros(categoria);

-- 9. TRIGGER: Atualizar updated_at automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_perfis_updated_at
  BEFORE UPDATE ON perfis
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_demandas_updated_at
  BEFORE UPDATE ON demandas
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- 10. FUNÇÃO: Anonimizar nome (iniciais)
-- ============================================================
CREATE OR REPLACE FUNCTION anonimizar_nome(nome TEXT)
RETURNS TEXT AS $$
DECLARE
  partes TEXT[];
  resultado TEXT := '';
  i INT;
BEGIN
  partes := string_to_array(UPPER(TRIM(nome)), ' ');
  FOR i IN 1..array_length(partes, 1) LOOP
    resultado := resultado || LEFT(partes[i], 1);
  END LOOP;
  RETURN resultado;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 11. FUNÇÃO: Anonimizar CPF (123.***.***-12)
-- ============================================================
CREATE OR REPLACE FUNCTION anonimizar_cpf(cpf TEXT)
RETURNS TEXT AS $$
DECLARE
  digits TEXT;
BEGIN
  digits := regexp_replace(cpf, '[^0-9]', '', 'g');
  IF length(digits) <> 11 THEN
    RETURN '***.***.***-**';
  END IF;
  RETURN LEFT(digits, 3) || '.***.***-' || RIGHT(digits, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 12. VIEW: Transparência pública (dados anonimizados)
-- ============================================================
CREATE OR REPLACE VIEW transparencia_publica AS
SELECT
  d.codigo_unico,
  anonimizar_nome(d.nome_paciente) AS iniciais_paciente,
  anonimizar_cpf(d.cpf_paciente) AS cpf_anonimizado,
  d.tipo_demanda,
  d.status,
  d.classificacao_cor,
  d.data_abertura,
  d.data_conclusao,
  d.tmat,
  p.nome AS nome_vereador
FROM demandas d
JOIN perfis p ON d.vereador_id = p.id
ORDER BY d.data_abertura DESC;

-- 13. FUNÇÃO: Humanizar ação de auditoria
-- ============================================================
CREATE OR REPLACE FUNCTION humanizar_auditoria(
  p_acao TEXT,
  p_usuario_nome TEXT,
  p_detalhes JSONB
)
RETURNS TEXT AS $$
BEGIN
  CASE p_acao
    WHEN 'demanda.criar' THEN
      RETURN p_usuario_nome || ' cadastrou nova demanda de ' || COALESCE(p_detalhes->>'tipo_demanda', 'saúde');
    WHEN 'demanda.visualizar' THEN
      RETURN p_usuario_nome || ' visualizou a demanda ' || COALESCE(p_detalhes->>'codigo', '');
    WHEN 'demanda.atualizar_status' THEN
      RETURN p_usuario_nome || ' alterou status para ' || COALESCE(p_detalhes->>'novo_status', '');
    WHEN 'demanda.editar' THEN
      RETURN p_usuario_nome || ' editou a demanda ' || COALESCE(p_detalhes->>'codigo', '');
    WHEN 'demanda.cancelar' THEN
      RETURN p_usuario_nome || ' cancelou a demanda ' || COALESCE(p_detalhes->>'codigo', '');
    WHEN 'auth.login' THEN
      RETURN p_usuario_nome || ' realizou login no sistema';
    WHEN 'auth.logout' THEN
      RETURN p_usuario_nome || ' saiu do sistema';
    WHEN 'auth.mfa_ativar' THEN
      RETURN p_usuario_nome || ' ativou autenticação de dois fatores';
    WHEN 'perfil.editar' THEN
      RETURN p_usuario_nome || ' atualizou seu perfil';
    WHEN 'parametro.criar' THEN
      RETURN p_usuario_nome || ' criou parâmetro: ' || COALESCE(p_detalhes->>'valor', '');
    WHEN 'parametro.editar' THEN
      RETURN p_usuario_nome || ' editou parâmetro: ' || COALESCE(p_detalhes->>'valor', '');
    ELSE
      RETURN p_usuario_nome || ' executou ação: ' || p_acao;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 14. VIEW: Auditoria humanizada
-- ============================================================
CREATE OR REPLACE VIEW auditoria_humanizada AS
SELECT
  al.id,
  al.usuario_id,
  p.nome AS usuario_nome,
  p.role AS usuario_role,
  al.acao,
  al.modulo,
  humanizar_auditoria(al.acao, COALESCE(p.nome, 'Sistema'), al.detalhes_json) AS mensagem_humanizada,
  al.detalhes_json,
  al.ip,
  al.browser,
  al.dispositivo,
  al.localizacao_prox,
  al.created_at
FROM auditoria_logs al
LEFT JOIN perfis p ON al.usuario_id = p.id
ORDER BY al.created_at DESC;

-- ============================================================
-- 15. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE parametros ENABLE ROW LEVEL SECURITY;

-- == PERFIS ==

-- Usuário vê apenas seu próprio perfil
CREATE POLICY perfis_select_own ON perfis
  FOR SELECT USING (
    id = auth.uid()
    OR EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND role IN ('admin', 'regulacao'))
  );

-- Usuário edita apenas seu próprio perfil
CREATE POLICY perfis_update_own ON perfis
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Apenas admins podem inserir perfis
CREATE POLICY perfis_insert_admin ON perfis
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND role = 'admin')
    OR NOT EXISTS (SELECT 1 FROM perfis)  -- Permite primeiro cadastro
  );

-- == DEMANDAS ==

-- Vereador vê apenas suas demandas; admin/regulação vê todas
CREATE POLICY demandas_select ON demandas
  FOR SELECT USING (
    vereador_id = auth.uid()
    OR EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND role IN ('admin', 'regulacao'))
  );

-- Vereador insere apenas com seu próprio ID
CREATE POLICY demandas_insert ON demandas
  FOR INSERT WITH CHECK (
    vereador_id = auth.uid()
    AND EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND role = 'vereador')
  );

-- Vereador atualiza apenas suas demandas (exceto status); admin/regulação atualiza qualquer
CREATE POLICY demandas_update ON demandas
  FOR UPDATE USING (
    vereador_id = auth.uid()
    OR EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND role IN ('admin', 'regulacao'))
  );

-- == AUDITORIA ==

-- Apenas admin pode visualizar logs
CREATE POLICY auditoria_select_admin ON auditoria_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND role = 'admin')
  );

-- Qualquer usuário autenticado pode inserir logs
CREATE POLICY auditoria_insert ON auditoria_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- == PARÂMETROS ==

-- Qualquer autenticado pode ler parâmetros
CREATE POLICY parametros_select ON parametros
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Apenas admin pode gerenciar parâmetros
CREATE POLICY parametros_insert_admin ON parametros
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY parametros_update_admin ON parametros
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND role = 'admin')
  );

-- == ACESSO ANÔNIMO À TRANSPARÊNCIA ==
-- A view transparencia_publica precisa de acesso anônimo
-- Conceder SELECT na view para anon
GRANT SELECT ON transparencia_publica TO anon;
GRANT SELECT ON transparencia_publica TO authenticated;

-- ============================================================
-- 16. DADOS INICIAIS (SEED)
-- ============================================================

-- Tipos de demanda
INSERT INTO parametros (categoria, valor, config) VALUES
  ('tipo', 'Consulta Especializada', '{"descricao": "Consulta com médico especialista"}'),
  ('tipo', 'Cirurgia Eletiva', '{"descricao": "Procedimento cirúrgico agendado"}'),
  ('tipo', 'Exame Diagnóstico', '{"descricao": "Exames laboratoriais ou de imagem"}'),
  ('tipo', 'Internação', '{"descricao": "Internação hospitalar"}'),
  ('tipo', 'Tratamento Contínuo', '{"descricao": "Tratamentos de longa duração"}'),
  ('tipo', 'Medicamento Especial', '{"descricao": "Medicamentos de alto custo"}'),
  ('tipo', 'Transporte Sanitário', '{"descricao": "Transporte para tratamento fora do domicílio"}'),
  ('tipo', 'Outro', '{"descricao": "Outros tipos de demanda"}');

-- Status
INSERT INTO parametros (categoria, valor, config) VALUES
  ('status', 'aberto', '{"label": "Aberto", "cor_badge": "#3B82F6"}'),
  ('status', 'em_analise', '{"label": "Em Análise", "cor_badge": "#F59E0B"}'),
  ('status', 'em_andamento', '{"label": "Em Andamento", "cor_badge": "#8B5CF6"}'),
  ('status', 'concluido', '{"label": "Concluído", "cor_badge": "#10B981"}'),
  ('status', 'cancelado', '{"label": "Cancelado", "cor_badge": "#EF4444"}'),
  ('status', 'devolvido', '{"label": "Devolvido", "cor_badge": "#6B7280"}');

-- Classificações por cor
INSERT INTO parametros (categoria, valor, config) VALUES
  ('cor', 'verde', '{"label": "Normal", "descricao": "Prioridade normal", "hex": "#10B981"}'),
  ('cor', 'amarelo', '{"label": "Atenção", "descricao": "Prioridade média", "hex": "#F59E0B"}'),
  ('cor', 'vermelho', '{"label": "Urgente", "descricao": "Alta prioridade", "hex": "#EF4444"}');

-- ============================================================
-- 17. FUNÇÃO: Criar perfil automaticamente após signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO perfis (id, nome, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'vereador')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
