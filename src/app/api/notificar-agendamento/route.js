import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { phone, name, service, date, time } = body;

    if (!phone || !name) {
      return NextResponse.json({ success: false, error: 'Dados incompletos para notificação.' }, { status: 400 });
    }

    // Mensagem personalizada para o cliente da barbearia
    const message = `Olá *${name}*! O seu agendamento para *${service || 'Serviço'}* foi confirmado para o dia *${date}* às *${time}*. Obrigado por escolher a AgendaEstilo!`;

    // Dispara o pedido para o nosso servidor de WhatsApp local na porta 8080
    const whatsappResponse = await fetch('http://localhost:8080/api/barbearia/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message })
    });

    const whatsappResult = await whatsappResponse.json();

    if (!whatsappResponse.ok) {
      console.error('Erro retornado pelo bot de WhatsApp:', whatsappResult);
      return NextResponse.json({ success: false, error: 'Erro ao enviar mensagem pelo WhatsApp.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Agendamento registado e WhatsApp disparado com sucesso!', whatsappResult });
  } catch (error) {
    console.error('Erro na API de notificação:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
