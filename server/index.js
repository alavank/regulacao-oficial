import express from 'express'
import rateLimit from 'express-rate-limit'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())

// Supabase Admin client (service_role) - só no backend
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getAdminClient() {
  if (!supabaseUrl || !supabaseServiceKey) return null
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

// Middleware: verificar se é admin via token
async function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Não autenticado' })

  const admin = getAdminClient()
  if (!admin) return res.status(500).json({ error: 'Serviço indisponível' })

  const { data: { user }, error } = await admin.auth.getUser(token)
  if (error || !user) return res.status(401).json({ error: 'Token inválido' })

  const { data: perfil } = await admin.from('perfis').select('role').eq('id', user.id).single()
  if (!perfil || perfil.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' })

  req.adminUser = user
  next()
}

// Rate limiting para rotas sensíveis
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em 1 minuto.' },
})

// Permissões default por role (usadas como template ao criar novo usuário)
const ALL_MODULOS = ['demandas', 'usuarios', 'auditoria', 'parametros', 'transparencia', 'dashboard', 'configuracoes']

function getDefaultPermissions(role, userId) {
  const perm = (modulo, ver, criar, editar, excluir) => ({
    user_id: userId, modulo, pode_ver: ver, pode_criar: criar, pode_editar: editar, pode_excluir: excluir,
  })

  if (role === 'admin') {
    return ALL_MODULOS.map(m => perm(m, true, true, true, true))
  }
  if (role === 'regulacao') {
    return [
      perm('demandas', true, true, true, false),
      perm('dashboard', true, false, false, false),
      perm('transparencia', true, false, false, false),
      perm('configuracoes', true, true, false, false),
    ]
  }
  // vereador (default)
  return [
    perm('demandas', true, true, false, false),
    perm('dashboard', true, false, false, false),
    perm('transparencia', true, false, false, false),
    perm('configuracoes', true, false, false, false),
  ]
}

// Rota: criar usuário sem trocar a sessão do admin
const ALLOWED_ROLES = ['vereador', 'admin', 'regulacao']

app.post('/api/users', apiLimiter, requireAdmin, async (req, res) => {
  const { login, password, nome, role } = req.body

  if (!login || !password || !nome) {
    return res.status(400).json({ error: 'Login, senha e nome são obrigatórios' })
  }

  // Sanitizar nome: remover tags HTML e limitar tamanho
  const sanitizedNome = String(nome).replace(/<[^>]*>/g, '').trim().slice(0, 120)
  if (!sanitizedNome) {
    return res.status(400).json({ error: 'Nome inválido' })
  }

  // Validar formato nome.sobrenome
  if (!/^[a-z]+\.[a-z]+$/.test(login)) {
    return res.status(400).json({ error: 'Login deve ter o formato nome.sobrenome (ex: joao.silva)' })
  }

  // Validar role contra whitelist
  const safeRole = ALLOWED_ROLES.includes(role) ? role : 'vereador'

  const admin = getAdminClient()

  const { data, error } = await admin.auth.admin.createUser({
    email: `${login}@regulacao.local`,
    password,
    email_confirm: true,
    user_metadata: { nome: sanitizedNome, role: safeRole, login },
  })

  if (error) {
    if (error.message.includes('already been registered')) {
      return res.status(400).json({ error: 'Este login já está em uso' })
    }
    return res.status(400).json({ error: error.message })
  }

  // Criar permissões default baseadas no role
  const userId = data.user.id
  const defaultPerms = getDefaultPermissions(safeRole, userId)
  if (defaultPerms.length > 0) {
    await admin.from('user_permissions').upsert(defaultPerms, { onConflict: 'user_id,modulo' })
  }

  res.json({ user: data.user })
})

// Servir arquivos estáticos do build do Vite
app.use(express.static(join(__dirname, '..', 'dist')))

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, '..', 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})
