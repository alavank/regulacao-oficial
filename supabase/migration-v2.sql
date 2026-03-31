-- ============================================================
-- MIGRAÇÃO V2: Adequação ao escopo completo do sistema
-- Rode este SQL no editor do Supabase
-- ============================================================

-- 1. ALTERAR TABELA DEMANDAS
-- Remover TMAT calculado, adicionar campos da regulação
-- ============================================================

-- Remover coluna tmat gerada automaticamente e recriar como texto
ALTER TABLE demandas DROP COLUMN IF EXISTS tmat;
ALTER TABLE demandas ADD COLUMN IF NOT EXISTS tmat TEXT;

-- Remover CHECK fixo de classificacao_cor (agora é dinâmico via parâmetros)
ALTER TABLE demandas DROP CONSTRAINT IF EXISTS demandas_classificacao_cor_check;
ALTER TABLE demandas ALTER COLUMN classificacao_cor DROP DEFAULT;
ALTER TABLE demandas ALTER COLUMN classificacao_cor SET DEFAULT NULL;

-- Adicionar campo descrição como dropdown (renomear para diferenciar)
-- descricao_demanda = dropdown de parâmetros | descricao = texto antigo (manter compatibilidade)
ALTER TABLE demandas ADD COLUMN IF NOT EXISTS descricao_demanda TEXT;

-- Adicionar campo de resposta da regulação
ALTER TABLE demandas ADD COLUMN IF NOT EXISTS resposta_regulacao TEXT;

-- Adicionar quem da regulação está responsável
ALTER TABLE demandas ADD COLUMN IF NOT EXISTS regulador_id UUID REFERENCES perfis(id);

-- Tempo de resposta calculado (dias) - para exibição
ALTER TABLE demandas ADD COLUMN IF NOT EXISTS tempo_resposta_dias INTEGER;

-- 2. ATUALIZAR TABELA PARÂMETROS - adicionar mais categorias
-- ============================================================
ALTER TABLE parametros DROP CONSTRAINT IF EXISTS parametros_categoria_check;
ALTER TABLE parametros ADD CONSTRAINT parametros_categoria_check
  CHECK (categoria IN ('tipo', 'descricao', 'cor', 'status', 'setor'));

-- 3. INSERIR PARÂMETROS DE DESCRIÇÃO E SETOR (se não existirem)
-- ============================================================
INSERT INTO parametros (categoria, valor, config) VALUES
  ('descricao', 'Encaminhamento para especialista', '{"descricao": "Paciente precisa de consulta especializada"}'),
  ('descricao', 'Solicitação de exame', '{"descricao": "Pedido de exame diagnóstico"}'),
  ('descricao', 'Agendamento de cirurgia', '{"descricao": "Solicitação de procedimento cirúrgico"}'),
  ('descricao', 'Internação hospitalar', '{"descricao": "Necessidade de internação"}'),
  ('descricao', 'Solicitação de medicamento', '{"descricao": "Pedido de medicamento especial/alto custo"}'),
  ('descricao', 'Transporte para tratamento', '{"descricao": "TFD - Tratamento Fora do Domicílio"}'),
  ('descricao', 'Acompanhamento de tratamento', '{"descricao": "Retorno ou continuidade de tratamento"}'),
  ('descricao', 'Outra solicitação', '{"descricao": "Demanda que não se encaixa nas anteriores"}')
ON CONFLICT DO NOTHING;

-- Setores
INSERT INTO parametros (categoria, valor, config) VALUES
  ('setor', 'Regulação Ambulatorial', '{}'),
  ('setor', 'Regulação Hospitalar', '{}'),
  ('setor', 'Central de Exames', '{}'),
  ('setor', 'Farmácia de Alto Custo', '{}'),
  ('setor', 'TFD', '{}'),
  ('setor', 'Outro', '{}')
ON CONFLICT DO NOTHING;

-- Atualizar cores com campo hex para blocos visuais
UPDATE parametros SET config = '{"label": "Verde", "descricao": "Prioridade normal", "hex": "#10B981"}' WHERE categoria = 'cor' AND valor = 'verde';
UPDATE parametros SET config = '{"label": "Amarelo", "descricao": "Prioridade média", "hex": "#F59E0B"}' WHERE categoria = 'cor' AND valor = 'amarelo';
UPDATE parametros SET config = '{"label": "Vermelho", "descricao": "Alta prioridade / Urgente", "hex": "#EF4444"}' WHERE categoria = 'cor' AND valor = 'vermelho';

-- Adicionar mais cores disponíveis
INSERT INTO parametros (categoria, valor, config) VALUES
  ('cor', 'azul', '{"label": "Azul", "descricao": "Classificação azul", "hex": "#3B82F6"}'),
  ('cor', 'laranja', '{"label": "Laranja", "descricao": "Classificação laranja", "hex": "#F97316"}'),
  ('cor', 'roxo', '{"label": "Roxo", "descricao": "Classificação especial", "hex": "#8B5CF6"}')
ON CONFLICT DO NOTHING;

-- 4. RECRIAR VIEW TRANSPARÊNCIA com novos campos
-- ============================================================
CREATE OR REPLACE VIEW transparencia_publica AS
SELECT
  d.codigo_unico,
  anonimizar_nome(d.nome_paciente) AS iniciais_paciente,
  anonimizar_cpf(d.cpf_paciente) AS cpf_anonimizado,
  d.tipo_demanda,
  d.descricao_demanda,
  d.status,
  d.classificacao_cor,
  d.data_abertura,
  d.data_conclusao,
  d.tmat,
  d.tempo_resposta_dias,
  p.nome AS nome_vereador,
  ROW_NUMBER() OVER (ORDER BY d.data_abertura ASC) AS posicao_fila
FROM demandas d
JOIN perfis p ON d.vereador_id = p.id
WHERE d.status NOT IN ('cancelado')
ORDER BY d.data_abertura ASC;

GRANT SELECT ON transparencia_publica TO anon;
GRANT SELECT ON transparencia_publica TO authenticated;

-- 5. ATUALIZAR VIEW AUDITORIA HUMANIZADA
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
      RETURN p_usuario_nome || ' cadastrou nova demanda de ' || COALESCE(p_detalhes->>'tipo_demanda', 'saúde') || ' (Cód: ' || COALESCE(p_detalhes->>'codigo', '') || ')';
    WHEN 'demanda.visualizar' THEN
      RETURN p_usuario_nome || ' visualizou a demanda ' || COALESCE(p_detalhes->>'codigo', '');
    WHEN 'demanda.atualizar_status' THEN
      RETURN p_usuario_nome || ' alterou status da demanda ' || COALESCE(p_detalhes->>'codigo', '') || ' para "' || COALESCE(p_detalhes->>'novo_status', '') || '"';
    WHEN 'demanda.responder' THEN
      RETURN p_usuario_nome || ' respondeu a demanda ' || COALESCE(p_detalhes->>'codigo', '') || ' com classificação ' || COALESCE(p_detalhes->>'classificacao', '');
    WHEN 'demanda.editar' THEN
      RETURN p_usuario_nome || ' editou a demanda ' || COALESCE(p_detalhes->>'codigo', '') || ' (campos: ' || COALESCE(p_detalhes->>'campos', '') || ')';
    WHEN 'demanda.cancelar' THEN
      RETURN p_usuario_nome || ' cancelou a demanda ' || COALESCE(p_detalhes->>'codigo', '');
    WHEN 'modulo.acessar' THEN
      RETURN p_usuario_nome || ' acessou o módulo "' || COALESCE(p_detalhes->>'modulo_nome', '') || '"';
    WHEN 'auth.login' THEN
      RETURN p_usuario_nome || ' realizou login no sistema';
    WHEN 'auth.logout' THEN
      RETURN p_usuario_nome || ' saiu do sistema';
    WHEN 'auth.mfa_ativar' THEN
      RETURN p_usuario_nome || ' ativou autenticação de dois fatores';
    WHEN 'perfil.editar' THEN
      RETURN p_usuario_nome || ' atualizou seu perfil';
    WHEN 'parametro.criar' THEN
      RETURN p_usuario_nome || ' criou parâmetro "' || COALESCE(p_detalhes->>'valor', '') || '" na categoria "' || COALESCE(p_detalhes->>'categoria', '') || '"';
    WHEN 'parametro.editar' THEN
      RETURN p_usuario_nome || ' editou parâmetro "' || COALESCE(p_detalhes->>'valor', '') || '"';
    WHEN 'parametro.excluir' THEN
      RETURN p_usuario_nome || ' desativou parâmetro "' || COALESCE(p_detalhes->>'valor', '') || '"';
    WHEN 'usuario.criar' THEN
      RETURN p_usuario_nome || ' cadastrou novo usuário "' || COALESCE(p_detalhes->>'nome', '') || '" como ' || COALESCE(p_detalhes->>'role', '');
    ELSE
      RETURN p_usuario_nome || ' executou: ' || p_acao;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

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
