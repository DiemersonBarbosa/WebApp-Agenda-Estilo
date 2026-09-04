import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const paymentId = body.paymentId || body.id;

    if (!paymentId) {
      return NextResponse.json(
        { status: 'error', message: 'ID do pagamento não fornecido' }, 
        { status: 400 }
      );
    }

    const accessTokenMP = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    if (!accessTokenMP) {
      return NextResponse.json(
        { status: 'error', message: 'Token do Mercado Pago não configurado no servidor' }, 
        { status: 500 }
      );
    }

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessTokenMP}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { status: 'error', message: data.message || 'Erro ao consultar pagamento' }, 
        { status: response.status }
      );
    }

    return NextResponse.json({ 
      status: data.status, 
      status_detail: data.status_detail 
    });

  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: error.message || 'Erro interno' }, 
      { status: 500 }
    );
  }
}