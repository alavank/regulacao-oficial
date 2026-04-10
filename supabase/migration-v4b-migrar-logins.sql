-- ============================================================
-- MIGRAÇÃO V4b: Converter emails antigos para o novo formato de login
-- Rode DEPOIS da migration-v4-fix-rls.sql
--
-- INSTRUÇÕES: Ajuste os logins abaixo para cada usuário.
-- O formato deve ser: nome.sobrenome (só letras minúsculas e ponto)
-- ============================================================

-- 1. admin@admin.com → admin.sistema (ou o login que preferir)
UPDATE auth.users
  SET email = 'admin.sistema@regulacao.local',
      raw_user_meta_data = raw_user_meta_data || '{"login": "admin.sistema"}'::jsonb
  WHERE email = 'admin@admin.com';

UPDATE public.perfis
  SET email = 'admin.sistema@regulacao.local'
  WHERE email = 'admin@admin.com';

-- 2. regulacao@teste.com → regulacao.saude (ou o login que preferir)
UPDATE auth.users
  SET email = 'regulacao.saude@regulacao.local',
      raw_user_meta_data = raw_user_meta_data || '{"login": "regulacao.saude"}'::jsonb
  WHERE email = 'regulacao@teste.com';

UPDATE public.perfis
  SET email = 'regulacao.saude@regulacao.local'
  WHERE email = 'regulacao@teste.com';

-- 3. vereador@vereador.com → vereador.teste (ou o login que preferir)
UPDATE auth.users
  SET email = 'vereador.teste@regulacao.local',
      raw_user_meta_data = raw_user_meta_data || '{"login": "vereador.teste"}'::jsonb
  WHERE email = 'vereador@vereador.com';

UPDATE public.perfis
  SET email = 'vereador.teste@regulacao.local'
  WHERE email = 'vereador@vereador.com';
