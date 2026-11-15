export async function enviarMensagemWhatsApp({ phone, nomeCliente, servico, data, hora, nomeBarbearia }) {
  try {
    const mensagem = `Olá, *${nomeCliente}*! O seu agendamento na *${nomeBarbearia || 'Barbearia'}* para *${servico}* foi confirmado para o dia *${data}* às *${hora}*. Obrigado pela preferência!`;

    const response = await fetch('/api/whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        telefone: phone,
        mensagem: mensagem,
      }),
    });

    const dataRes = await response.json();

    if (!response.ok || !dataRes.success) {
      throw new Error(dataRes.error || 'Erro ao enviar mensagem pelo WhatsApp');
    }

    return { success: true, data: dataRes };
  } catch (error) {
    console.error('Falha na integração com o WhatsApp:', error);
    return { success: false, error: error.message };
  }
}