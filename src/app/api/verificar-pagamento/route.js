import { NextResponse } from 'next/server';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(request) {
  try {
    const { paymentId } = await request.json();

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
        'Authorization': `Bearer ${accessTokenMP}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Erro ao consultar Mercado Pago' }, 
        { status: res.status, headers: corsHeaders() }
      );
    }

    return NextResponse.json({ status: data.status }, { headers: corsHeaders() });
  } catch (error) {
    return NextResponse.json(
      { error: error.message }, 
      { status: 500, headers: corsHeaders() }
    );
  }
}