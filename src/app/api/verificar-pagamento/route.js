import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { paymentId } = body;

    if (!paymentId) {
      return NextResponse.json(
        { status: 'error', message: 'ID do pagamento não fornecido' }, 
        { status: 400 }
      );
    }

    if (!process.env.MP_ACCESS_TOKEN) {
      return NextResponse.json(
        { status: 'error', message: 'Token do Mercado Pago não configurado no servidor' }, 
        { status: 500 }
      );
    }

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { status: 'error', message: data.message || 'Erro ao consultar pagamento no Mercado Pago' }, 
        { status: response.status }
      );
    }

    return NextResponse.json({ 
      status: data.status, 
      status_detail: data.status_detail 
    });

  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: error.message || 'Erro interno no servidor' }, 
      { status: 500 }
    );
  }
}