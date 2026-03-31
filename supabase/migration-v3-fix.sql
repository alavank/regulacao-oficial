-- ============================================================
-- FIX: RLS para admin editar/desativar outros perfis
-- ============================================================

-- Admin pode editar qualquer perfil
DROP POLICY IF EXISTS perfis_update_own ON perfis;
CREATE POLICY perfis_update ON perfis
  FOR UPDATE USING (
    id = auth.uid()
    OR public.get_my_role() = 'admin'
  )
  WITH CHECK (
    id = auth.uid()
    OR public.get_my_role() = 'admin'
  );

-- Admin pode deletar perfis (soft delete via ativo=false)
DROP POLICY IF EXISTS perfis_delete_admin ON perfis;
CREATE POLICY perfis_delete_admin ON perfis
  FOR DELETE USING (
    public.get_my_role() = 'admin'
  );
