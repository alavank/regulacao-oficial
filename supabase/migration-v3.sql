-- ============================================================
-- MIGRAÇÃO V3: Troca de senha obrigatória, perfil completo
-- Rode este SQL no editor do Supabase
-- ============================================================

-- 1. Campo para forçar troca de senha no primeiro login
ALTER TABLE perfis ADD COLUMN IF NOT EXISTS deve_trocar_senha BOOLEAN DEFAULT TRUE;

-- Marcar admin atual como já trocou (para não travar)
UPDATE perfis SET deve_trocar_senha = FALSE WHERE role = 'admin';

-- 2. Campo telefone no perfil
ALTER TABLE perfis ADD COLUMN IF NOT EXISTS telefone TEXT;

-- 3. Campo ativo para soft-delete de usuários
ALTER TABLE perfis ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;

-- 4. Atualizar trigger de novo usuário para incluir deve_trocar_senha
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO perfis (id, nome, email, role, deve_trocar_senha)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'vereador'),
    TRUE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Criar bucket de storage para fotos de perfil (se não existir)
-- NOTA: Rode isso separadamente se der erro, pois depende do schema storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Policy para upload de avatars
CREATE POLICY avatars_upload ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.uid() IS NOT NULL
  );

CREATE POLICY avatars_select ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY avatars_update ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND auth.uid() IS NOT NULL
  );

CREATE POLICY avatars_delete ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND auth.uid() IS NOT NULL
  );
