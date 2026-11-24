import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

async function ativarAssinaturaNoBanco(barbeariaId, paymentId) {
  if (!barbeariaId) return null;

  const hoje = new Date();
  const vencimento = new Date(hoje);
  vencimento.setDate(vencimento.getDate() + 30);

  const { data: atual, error: erroBusca } = await supabaseAdmin
    .from('barbearias')
    .select('id, status_assinatura, data_inicio_assinatura, data_vencimento, ultimo_pagamento_id')
    .eq('id', barbeariaId)
    .single();

  if (erroBusca || !atual) {
    throw new Error(`Barbearia não encontrada: ${erroBusca?.message || barbeariaId}`);
  }

  // Evita estender +30 dias duas vezes para o mesmo pagamento
  if (atual.ultimo_pagamento_id && String(atual.ultimo_pagamento_id) === String(paymentId)) {
    return atual;
  }

  const { data: atualizada, error: erroUpdate } = await supabaseAdmin
    .from('barbearias')
    .update({
      status_assinatura: 'ativo',
      data_inicio_assinatura: hoje.toISOString(),
      data_vencimento: vencimento.toISOString(),
      ultimo_pagamento_id: String(paymentId),
    })
    .eq('id', barbeariaId)
    .select('id, status_assinatura, data_inicio_assinatura, data_vencimento')
    .single();

  if (erroUpdate) {
    throw new Error(`Erro ao atualizar assinatura: ${erroUpdate.message}`);
  }

  return atualizada;
}

async function processarConsulta(request, bodyData = null) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = bodyData?.paymentId || searchParams.get('paymentId');
    const barbeariaIdParam = bodyData?.barbeariaId || searchParams.get('barbeariaId');

    if (!paymentId) {
      return NextResponse.json(
        { error: 'ID de pagamento não fornecido' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const accessTokenMP = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessTokenMP}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Erro ao consultar Mercado Pago', details: data },
        { status: res.status, headers: corsHeaders() }
      );
    }

    const status = String(data.status || '').toLowerCase();
    const barbeariaId =
      barbeariaIdParam ||
      data.metadata?.barbearia_id ||
      data.metadata?.barbeariaId ||
      data.external_reference;

    let barbeariaAtualizada = null;

    if (status === 'approved' && barbeariaId) {
      barbeariaAtualizada = await ativarAssinaturaNoBanco(barbeariaId, data.id || paymentId);
    }

    return NextResponse.json(
      {
        status: data.status,
        payment_status: data.status,
        barbearia: barbeariaAtualizada,
      },
      { headers: corsHeaders() }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders() }
    );
  }
}

export async function GET(request) {
  return processarConsulta(request);
}

export async function POST(request) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  return processarConsulta(request, body);
}