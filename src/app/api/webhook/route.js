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
        // Consulta os detalhes do pagamento diretamente na API do Mercado Pago usando a variável de produção correta
        const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
          },
        });

        if (response.ok) {
          const paymentData = await response.json();
          
          const status = paymentData.status; // Ex: 'approved', 'pending', 'rejected'
          const externalReference = paymentData.external_reference; // ID da barbearia ou usuário passado na hora de gerar o Pix

          console.log(`Pagamento ${paymentId} recebido com status: ${status}`);

          // Se o pagamento foi aprovado, atualizamos o status e projetamos a validade para 30 dias
          if (status === 'approved') {
            const dataInicio = new Date();
            const dataVencimento = new Date();
            dataVencimento.setDate(dataVencimento.getDate() + 30);

            // Substitua 'barbearias' pelo nome exato da sua tabela no Supabase se for diferente
            const { error } = await supabaseAdmin
              .from('barbearias') 
              .update({ 
                status_assinatura: 'ativo', 
                data_inicio_assinatura: dataInicio.toISOString(),
                data_vencimento: dataVencimento.toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', externalReference); 

            if (error) {
              console.error('Erro ao atualizar banco de dados:', error);
            } else {
              console.log(`Assinatura atualizada com sucesso para a barbearia ID: ${externalReference}`);
            }
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