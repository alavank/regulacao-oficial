-- ============================================================
-- MIGRAÇÃO V5: Sistema de Permissões Granulares (ACL)
-- Substitui lógica role-based por permissões individuais por usuário
-- Rode este SQL no editor SQL do Supabase
-- ============================================================

-- 1. TABELA: user_permissions
-- Cada linha = uma permissão de um usuário em um módulo específico
-- ============================================================
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  modulo TEXT NOT NULL CHECK (modulo IN (
    'demandas', 'usuarios', 'auditoria', 'parametros',
    'transparencia', 'dashboard', 'configuracoes'
  )),
  pode_ver BOOLEAN DEFAULT FALSE,
  pode_criar BOOLEAN DEFAULT FALSE,
  pode_editar BOOLEAN DEFAULT FALSE,
  pode_excluir BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, modulo)
);

-- 2. ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_modulo ON user_permissions(user_id, modulo);

-- 3. TRIGGER: updated_at automático
-- ============================================================
CREATE TRIGGER set_user_permissions_updated_at
  BEFORE UPDATE ON user_permissions
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- 4. RLS
-- ============================================================
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Usuário lê suas próprias permissões; admin lê todas
CREATE POLICY user_permissions_select ON user_permissions
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.get_my_role() = 'admin'
  );

-- Apenas admin gerencia permissões
CREATE POLICY user_permissions_insert ON user_permissions
  FOR INSERT WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY user_permissions_update ON user_permissions
  FOR UPDATE USING (public.get_my_role() = 'admin');

CREATE POLICY user_permissions_delete ON user_permissions
  FOR DELETE USING (public.get_my_role() = 'admin');

-- 5. FUNÇÃO HELPER: verificar permissão granular
-- Usada nas policies RLS e no frontend
-- ============================================================
CREATE OR REPLACE FUNCTION public.user_has_permission(
  p_modulo TEXT,
  p_acao TEXT  -- 'ver', 'criar', 'editar', 'excluir'
)
RETURNS BOOLEAN AS $$
DECLARE
  result BOOLEAN;
BEGIN
  CASE p_acao
    WHEN 'ver' THEN
      SELECT pode_ver INTO result FROM user_permissions
        WHERE user_id = auth.uid() AND modulo = p_modulo;
    WHEN 'criar' THEN
      SELECT pode_criar INTO result FROM user_permissions
        WHERE user_id = auth.uid() AND modulo = p_modulo;
    WHEN 'editar' THEN
      SELECT pode_editar INTO result FROM user_permissions
        WHERE user_id = auth.uid() AND modulo = p_modulo;
    WHEN 'excluir' THEN
      SELECT pode_excluir INTO result FROM user_permissions
        WHERE user_id = auth.uid() AND modulo = p_modulo;
    ELSE
      result := FALSE;
  END CASE;
  RETURN COALESCE(result, FALSE);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 6. SEED: Migrar permissões dos usuários existentes com base no role atual
-- ============================================================

-- Admins: acesso total a todos os módulos
INSERT INTO user_permissions (user_id, modulo, pode_ver, pode_criar, pode_editar, pode_excluir)
SELECT p.id, m.modulo, TRUE, TRUE, TRUE, TRUE
FROM perfis p
CROSS JOIN (VALUES
  ('demandas'), ('usuarios'), ('auditoria'), ('parametros'),
  ('transparencia'), ('dashboard'), ('configuracoes')
) AS m(modulo)
WHERE p.role = 'admin'
ON CONFLICT (user_id, modulo) DO NOTHING;

-- Regulação: demandas (ver/criar/editar), dashboard, transparência
INSERT INTO user_permissions (user_id, modulo, pode_ver, pode_criar, pode_editar, pode_excluir)
SELECT p.id, 'demandas', TRUE, TRUE, TRUE, FALSE FROM perfis p WHERE p.role = 'regulacao'
UNION ALL
SELECT p.id, 'dashboard', TRUE, FALSE, FALSE, FALSE FROM perfis p WHERE p.role = 'regulacao'
UNION ALL
SELECT p.id, 'transparencia', TRUE, FALSE, FALSE, FALSE FROM perfis p WHERE p.role = 'regulacao'
UNION ALL
SELECT p.id, 'configuracoes', TRUE, TRUE, FALSE, FALSE FROM perfis p WHERE p.role = 'regulacao'
ON CONFLICT (user_id, modulo) DO NOTHING;

-- Vereadores: demandas (ver/criar próprias), dashboard, transparência
INSERT INTO user_permissions (user_id, modulo, pode_ver, pode_criar, pode_editar, pode_excluir)
SELECT p.id, 'demandas', TRUE, TRUE, FALSE, FALSE FROM perfis p WHERE p.role = 'vereador'
UNION ALL
SELECT p.id, 'dashboard', TRUE, FALSE, FALSE, FALSE FROM perfis p WHERE p.role = 'vereador'
UNION ALL
SELECT p.id, 'transparencia', TRUE, FALSE, FALSE, FALSE FROM perfis p WHERE p.role = 'vereador'
UNION ALL
SELECT p.id, 'configuracoes', TRUE, FALSE, FALSE, FALSE FROM perfis p WHERE p.role = 'vereador'
ON CONFLICT (user_id, modulo) DO NOTHING;

-- ============================================================
-- NOTA: O campo 'role' em perfis é mantido por retrocompatibilidade.
-- O frontend e RLS devem migrar gradualmente para user_has_permission().
-- Numa migration futura (v6+), o campo 'role' pode ser removido.
-- ============================================================
