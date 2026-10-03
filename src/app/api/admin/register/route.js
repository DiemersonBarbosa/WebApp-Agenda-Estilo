import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Função para aplicar os cabeçalhos CORS em todas as respostas
function setCorsHeaders(res) {
  res.headers.set('Access-Control-Allow-Origin', '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return res
}

// 1. Trata o Preflight Request (OPTIONS) diretamente sem redirecionar
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 })
  return setCorsHeaders(response)
}

// 2. Trata a requisição principal de cadastro (POST)
export async function POST(req) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      const errRes = NextResponse.json(
        { error: 'Configuração do servidor incompleta. Verifique as variáveis de ambiente.' },
        { status: 500 }
      )
      return setCorsHeaders(errRes)
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const body = await req.json()
    const { email, password, nomeBarbearia, telefone, slug } = body

    if (!email || !password || !nomeBarbearia) {
      const errRes = NextResponse.json(
        { error: 'Por favor, preencha todos os campos obrigatórios.' },
        { status: 400 }
      )
      return setCorsHeaders(errRes)
    }

    let finalSlug = slug
    if (!finalSlug || typeof finalSlug !== 'string' || !finalSlug.trim()) {
      finalSlug = nomeBarbearia
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
    }

    if (!finalSlug || !finalSlug.trim()) {
      finalSlug = `barbearia-${Date.now()}`
    }

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nomeBarbearia },
    })

    if (authError) {
      const errRes = NextResponse.json({ error: authError.message }, { status: 400 })
      return setCorsHeaders(errRes)
    }

    // Inserir os dados na tabela barbearias
    const { data: barbearia, error: dbError } = await supabaseAdmin
      .from('barbearias')
      .insert([
        {
          user_id: authData.user.id,
          nome: nomeBarbearia,
          slug: finalSlug,
          telefone: telefone,
          status_assinatura: 'teste',
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (dbError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      const errRes = NextResponse.json({ error: dbError.message }, { status: 400 })
      return setCorsHeaders(errRes)
    }

    const successRes = NextResponse.json({ success: true, user: authData.user, barbearia })
    return setCorsHeaders(successRes)

  } catch (error) {
    const errRes = NextResponse.json(
      { error: error.message || 'Erro interno no servidor de cadastro.' },
      { status: 500 }
    )
    return setCorsHeaders(errRes)
  }
}