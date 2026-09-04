import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializa o cliente do Supabase com a Service Role Key (Admin) para atualizar o banco sem travar por RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();

    // O Mercado Pago envia notificações de diferentes tipos (payment, subscription, etc.)
    const { action, data, type } = body;

    // Verificamos se a notificação é referente a um pagamento
    if (type === 'payment' || action === 'payment.created' || action === 'payment.updated') {
      const paymentId = data?.id;

      if (paymentId) {
        // Consulta os detalhes do pagamento diretamente na API do Mercado Pago
        const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
          },
        });

        if (response.ok) {
          const paymentData = await response.json();
          
          const status = paymentData.status; // Ex: 'approved', 'pending', 'rejected'
          const externalReference = paymentData.external_reference; // Aqui você pode passar o ID da barbearia ou do usuário, se configurado

          console.log(`Pagamento ${paymentId} recebido com status: ${status}`);

          // Se o pagamento foi aprovado, atualizamos o status no Supabase
          if (status === 'approved') {
            // Exemplo de atualização na sua tabela de barbearias ou assinaturas
            // Ajuste o nome da tabela e das colunas de acordo com o seu banco de dados atual
            /*
            const { error } = await supabaseAdmin
              .from('barbearias') // ou 'assinaturas'
              .update({ status_assinatura: 'ativo', updated_at: new Date() })
              .eq('id', externalReference); // ou por e-mail: .eq('email', paymentData.payer.email)

            if (error) {
              console.error('Erro ao atualizar banco de dados:', error);
            }
            */
          }
        }
      }
    }

    // Retorna status 200 para o Mercado Pago saber que recebemos a notificação com sucesso
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Erro no webhook do Mercado Pago:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}