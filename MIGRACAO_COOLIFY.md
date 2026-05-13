# Migração para Hetzner + Coolify + Supabase self-hosted

> Playbook do deploy deste app na VPS `alavank-server` (Hetzner CPX31, IP `5.78.42.251`) via Coolify v4 + Supabase self-hosted por template.

## Arquitetura

- 1 VPS Hetzner compartilhada entre todos os apps pessoais (Coolify gerencia).
- Cada app vira um **Coolify Project** com 2 resources:
  - **Service Supabase** (template oficial do Coolify) — Postgres + GoTrue + PostgREST + Storage + Studio.
  - **Application** apontando para o repo GitHub, build via Dockerfile.
- TLS automático Let's Encrypt via `sslip.io` (sem domínio próprio).

## Hostnames

| Endpoint | URL |
|---|---|
| App | `https://regulacao-app-5-78-42-251.sslip.io` |
| API Supabase (Kong) | `https://regulacao-api-5-78-42-251.sslip.io` |
| Studio | `https://regulacao-studio-5-78-42-251.sslip.io` |

## Passos no Coolify

### 1. Criar Project
Dashboard → `Projects` (sidebar ou `+` ao lado do título) → **+ Add** → Nome: `regulacao-oficial`.

### 2. Resource: Supabase
Dentro do project → **+ New Resource** → **Databases / Services** → **Supabase** (template oficial).

Configurar antes de deploy:
- Domains:
  - Kong/API: `regulacao-api-5-78-42-251.sslip.io`
  - Studio: `regulacao-studio-5-78-42-251.sslip.io`
- Env vars principais (já preenchidas pelo template, ajustar):
  - `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD` — login do Studio
  - `SITE_URL` = `https://regulacao-app-5-78-42-251.sslip.io`
  - `API_EXTERNAL_URL` = `https://regulacao-api-5-78-42-251.sslip.io`
  - `ENABLE_EMAIL_SIGNUP=false`
  - `ENABLE_EMAIL_AUTOCONFIRM=true` (espelha fluxo `@regulacao.local`)
  - `SMTP_*` — pode deixar default (sem email real)

Deploy. Coolify gera automaticamente: `POSTGRES_PASSWORD`, `JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY`. **Copiar `ANON_KEY` e `SERVICE_ROLE_KEY`** — vamos precisar no passo 4.

### 3. Aplicar schema do app
Após o Supabase subir, abrir Studio (`regulacao-studio-...sslip.io`) → SQL Editor → rodar **em ordem**:

1. `supabase/schema.sql`
2. `supabase/migration-v2.sql`
3. `supabase/migration-v3.sql`
4. `supabase/migration-v3-fix.sql`
5. `supabase/migration-v4-fix-rls.sql`
6. `supabase/migration-v4b-migrar-logins.sql`
7. `supabase/migration-v5-acl.sql`

Conferir depois:
- Extensão `uuid-ossp` (`\dx` ou Database → Extensions).
- Função `public.get_my_role()` existe com `SECURITY DEFINER`.
- Trigger `handle_new_user` em `auth.users`.
- Bucket `avatars` em Storage.
- Views `transparencia_publica` e `auditoria_humanizada` em Database → Views.

### 4. Resource: Application (este repo)
Dentro do project → **+ New Resource** → **Application** → **Public Repository** (ou Private via GitHub App):

- Repo: `https://github.com/alavank/regulacao-oficial`
- Branch: `main`
- Build Pack: **Dockerfile**
- Dockerfile location: `Dockerfile` (raiz)
- Port: `3000`
- Domain: `regulacao-app-5-78-42-251.sslip.io`

**Build args** (Vite faz inline em build time, então PRECISA ser build arg):
- `VITE_SUPABASE_URL` = `https://regulacao-api-5-78-42-251.sslip.io`
- `VITE_SUPABASE_ANON_KEY` = `<copiar do Supabase>`

**Environment variables** (runtime, para o Express):
- `VITE_SUPABASE_URL` = `https://regulacao-api-5-78-42-251.sslip.io`
- `SUPABASE_SERVICE_ROLE_KEY` = `<copiar do Supabase>`
- `PORT` = `3000`

Deploy.

### 5. Smoke test

- [ ] `https://regulacao-studio-...sslip.io` loga, lista tabelas `perfis`, `demandas`, `parametros`, `auditoria_logs`, `user_permissions`.
- [ ] `curl https://regulacao-api-...sslip.io/rest/v1/parametros -H "apikey: <ANON_KEY>"` retorna seed data.
- [ ] `https://regulacao-app-...sslip.io` carrega login, console sem 404 do service worker.
- [ ] Criar primeiro admin: Studio → Authentication → invite user `admin@regulacao.local`, depois `update perfis set papel='admin' where email='admin@regulacao.local';`
- [ ] Login + ativar TOTP + relogar funciona.
- [ ] Upload de avatar em Configurações funciona, arquivo aparece em `storage.objects`.
- [ ] DevTools → Application → Service Worker ativo, cache `supabase-api-cache` apontando para `regulacao-api-...sslip.io` (não mais `*.supabase.co`).

### 6. Backup
Coolify → Service Supabase → **Backups** → habilitar nightly + retenção 30 dias.

---

## Mudanças de código aplicadas (Fase G)

- `vite.config.ts` — Workbox regex agora derivado de `VITE_SUPABASE_URL` via `loadEnv` (não mais hardcoded em `*.supabase.co`).
- `.env.example` — adicionado `SUPABASE_SERVICE_ROLE_KEY`.
- `Dockerfile` (novo) — multi-stage Node 20 alpine, build Vite + serve via Express.
- `.dockerignore` (novo) — `node_modules`, `dist`, `.env*`, `.git`.

**Sem mudança:** `supabase/` (schema+migrations), `src/lib/supabase.ts`, `server/index.js`.
