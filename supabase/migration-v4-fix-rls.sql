-- ============================================================
-- MIGRAÇÃO V4: Correção de RLS e função get_my_role()
-- Rode este SQL no editor SQL do Supabase
-- ============================================================

-- 1. CRIAR FUNÇÃO get_my_role() que faltava
-- Usada nas policies para verificar role do usuário autenticado
-- SECURITY DEFINER para evitar recursão infinita com RLS
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.perfis WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 2. CORRIGIR POLICY DE INSERT NA TABELA DEMANDAS
-- Permitir que qualquer usuário autenticado (vereador, admin, regulacao) crie demandas
-- ============================================================
DROP POLICY IF EXISTS demandas_insert ON demandas;
CREATE POLICY demandas_insert ON demandas
  FOR INSERT WITH CHECK (
    vereador_id = auth.uid()
    AND auth.uid() IS NOT NULL
  );

-- 3. CORRIGIR POLICY DE UPDATE NA TABELA PERFIS
-- Admin pode editar qualquer perfil, usuário edita o próprio
-- ============================================================
DROP POLICY IF EXISTS perfis_update_own ON perfis;
DROP POLICY IF EXISTS perfis_update ON perfis;
CREATE POLICY perfis_update ON perfis
  FOR UPDATE USING (
    id = auth.uid()
    OR public.get_my_role() = 'admin'
  )
  WITH CHECK (
    id = auth.uid()
    OR public.get_my_role() = 'admin'
  );

-- 4. CORRIGIR POLICY DE DELETE NA TABELA PERFIS (para desativar)
-- ============================================================
DROP POLICY IF EXISTS perfis_delete_admin ON perfis;
CREATE POLICY perfis_delete_admin ON perfis
  FOR DELETE USING (
    public.get_my_role() = 'admin'
  );

-- 5. CORRIGIR POLICY DE SELECT NA TABELA DEMANDAS
-- Usar get_my_role() para evitar recursão RLS
-- ============================================================
DROP POLICY IF EXISTS demandas_select ON demandas;
CREATE POLICY demandas_select ON demandas
  FOR SELECT USING (
    vereador_id = auth.uid()
    OR public.get_my_role() IN ('admin', 'regulacao')
  );

-- 6. CORRIGIR POLICY DE UPDATE NA TABELA DEMANDAS
-- ============================================================
DROP POLICY IF EXISTS demandas_update ON demandas;
CREATE POLICY demandas_update ON demandas
  FOR UPDATE USING (
    vereador_id = auth.uid()
    OR public.get_my_role() IN ('admin', 'regulacao')
  );

-- 7. CORRIGIR POLICY DE SELECT NOS PERFIS
-- Usar get_my_role() para evitar recursão RLS
-- ============================================================
DROP POLICY IF EXISTS perfis_select_own ON perfis;
CREATE POLICY perfis_select ON perfis
  FOR SELECT USING (
    id = auth.uid()
    OR public.get_my_role() IN ('admin', 'regulacao')
  );

-- 8. CORRIGIR POLICY DE INSERT NOS PERFIS
-- ============================================================
DROP POLICY IF EXISTS perfis_insert_admin ON perfis;
CREATE POLICY perfis_insert_admin ON perfis
  FOR INSERT WITH CHECK (
    public.get_my_role() = 'admin'
    OR NOT EXISTS (SELECT 1 FROM public.perfis)
  );

-- 9. CORRIGIR POLICIES DE AUDITORIA
-- Usar get_my_role() para evitar recursão RLS
-- ============================================================
DROP POLICY IF EXISTS auditoria_select_admin ON auditoria_logs;
CREATE POLICY auditoria_select_admin ON auditoria_logs
  FOR SELECT USING (
    public.get_my_role() = 'admin'
  );

-- 10. CORRIGIR POLICIES DE PARÂMETROS
-- ============================================================
DROP POLICY IF EXISTS parametros_insert_admin ON parametros;
CREATE POLICY parametros_insert_admin ON parametros
  FOR INSERT WITH CHECK (
    public.get_my_role() = 'admin'
  );

DROP POLICY IF EXISTS parametros_update_admin ON parametros;
CREATE POLICY parametros_update_admin ON parametros
  FOR UPDATE USING (
    public.get_my_role() = 'admin'
  );
