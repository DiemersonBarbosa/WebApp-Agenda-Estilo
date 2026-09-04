import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Inicializa o cliente do Supabase com a Service Role Key (Admin)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    const { email, password, nomeBarbearia, telefone, slug } = await req.json()

    // 1. Criar usuário no Supabase Auth já com e-mail confirmado (bypassa SMTP)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // 2. Inserir os dados da barbearia na tabela 'barbearias'
    const { data: barbearia, error: dbError } = await supabaseAdmin
      .from('barbearias')
      .insert([
        {
          user_id: authData.user.id,
          nome: nomeBarbearia,
          slug: slug,
          telefone: telefone,
        },
      ])
      .select()
      .single()

    if (dbError) {
      // Se falhar ao salvar no banco, remove o usuário criado para não deixar lixo
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: dbError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, user: authData.user, barbearia })
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Erro interno no servidor' }, { status: 500 })
  }
}