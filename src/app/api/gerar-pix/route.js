import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const accessTokenMP = process.env.MP_ACCESS_TOKEN || process.env.MERCADO_PAGO_ACCESS_TOKEN;

    if (!accessTokenMP) {
      return NextResponse.json(
        { error: { message: 'Token do Mercado Pago não configurado no servidor' } }, 
        { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
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
        transaction_amount: Number(body.transaction_amount) || 9.90,
        description: body.description || 'Assinatura Mensal Gestor',
        payment_method_id: 'pix',
        external_reference: body.barbeariaId || null,
        payer: {
          email: body.payer_email || 'diemersonlimabarbosa@gmail.com',
          first_name: body.payer_name || 'Gestor'
        }
      })
    });

    const data = await mpResponse.json();

    if (!mpResponse.ok) {
      return NextResponse.json(
        { error: { message: data.message || 'Erro ao processar pagamento no Mercado Pago' } }, 
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const pointOfInteraction = data.point_of_interaction?.transaction_data;

    return NextResponse.json({
      qrCodeBase64: pointOfInteraction?.qr_code_base64 || '',
      copiaECola: pointOfInteraction?.qr_code || '',
      paymentId: data.id
    }, { 
      headers: { 'Access-Control-Allow-Origin': '*' } 
    });

  } catch (error) {
    return NextResponse.json(
      { error: { message: `Erro interno: ${error.message}` } }, 
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}