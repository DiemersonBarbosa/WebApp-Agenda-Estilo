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
    const valorFinal = Number(transaction_amount);

    // SUA ACCESS TOKEN DO MERCADO PAGO (Certifique-se de colar a chave inteira de teste ou produção)
    const accessTokenMP = process.env.MERCADO_PAGO_ACCESS_TOKEN;

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

    // Pega o texto bruto da resposta primeiro para evitar quebra de JSON
    const responseText = await mpResponse.text();
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('RESPOSTA NÃO-JSON DO MERCADO PAGO:', responseText);
      return NextResponse.json(
        { error: { message: `Erro de autenticação ou formato no Mercado Pago: ${responseText.substring(0, 100)}` } }, 
        { status: 500 }
      );
    }

    if (!mpResponse.ok) {
      console.error('ERRO RETORNADO PELO MERCADO PAGO:', data);
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
    console.error('ERRO INTERNO NA ROTA DO NEXT.JS:', error);
    return NextResponse.json(
      { error: { message: error.message || 'Erro interno no servidor' } }, 
      { status: 500 }
    );
  }
}