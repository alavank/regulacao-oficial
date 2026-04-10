import express from 'express'
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

// Rota: criar usuário sem trocar a sessão do admin
app.post('/api/users', requireAdmin, async (req, res) => {
  const { login, password, nome, role } = req.body

  if (!login || !password || !nome) {
    return res.status(400).json({ error: 'Login, senha e nome são obrigatórios' })
  }

  // Validar formato nome.sobrenome
  if (!/^[a-z]+\.[a-z]+$/.test(login)) {
    return res.status(400).json({ error: 'Login deve ter o formato nome.sobrenome (ex: joao.silva)' })
  }

  const admin = getAdminClient()

  const { data, error } = await admin.auth.admin.createUser({
    email: `${login}@regulacao.local`,
    password,
    email_confirm: true,
    user_metadata: { nome, role: role || 'vereador', login },
  })

  if (error) {
    if (error.message.includes('already been registered')) {
      return res.status(400).json({ error: 'Este login já está em uso' })
    }
    return res.status(400).json({ error: error.message })
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
