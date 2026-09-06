import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { barbeiroId, email, password } = await request.json();

    // Cliente admin utilizando a chave secreta do servidor
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Cria o usuário no Auth ignorando confirmação por e-mail
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 400 });
    }

    const userId = userData.user.id;

    // 2. Vincula o ID gerado à tabela de barbeiros
    const { error: dbError } = await supabaseAdmin
      .from('barbeiros')
      .update({ user_id: userId })
      .eq('id', barbeiroId);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Acesso criado com sucesso!' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}