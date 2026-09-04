import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      body = {};
    }

    const { transaction_amount, description, payer_email, payer_name } = body;
    const valorFinal = Number(transaction_amount) || 9.90;

    const accessTokenMP = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    if (!accessTokenMP) {
      return NextResponse.json(
        { error: { message: 'Token do Mercado Pago não configurado no servidor' } }, 
        { status: 500 }
      );
    }

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessTokenMP}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${Date.now()}`
      },
      body: JSON.stringify({
        transaction_amount: valorFinal,
        description: description || 'Assinatura Mensal Gestor',
        payment_method_id: 'pix',
        payer: {
          email: payer_email || 'diemersonlimabarbosa@gmail.com',
          first_name: payer_name || 'Gestor'
        }
      })
    });

    const responseText = await mpResponse.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      return NextResponse.json(
        { error: { message: `Erro no formato de resposta do Mercado Pago` } }, 
        { status: 500 }
      );
    }

    if (!mpResponse.ok) {
      return NextResponse.json(
        { error: { message: data.message || 'Erro ao processar pagamento no Mercado Pago' } }, 
        { status: 400 }
      );
    }

    const pointOfInteraction = data.point_of_interaction?.transaction_data;

    return NextResponse.json({
      qrCodeBase64: pointOfInteraction?.qr_code_base64 || '',
      copiaECola: pointOfInteraction?.qr_code || '',
      paymentId: data.id
    });

  } catch (error) {
    return NextResponse.json(
      { error: { message: error.message || 'Erro interno no servidor' } }, 
      { status: 500 }
    );
  }
}