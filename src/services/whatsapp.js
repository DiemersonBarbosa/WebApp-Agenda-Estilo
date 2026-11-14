export async function enviarConfirmacaoWhatsApp({ phone, nomeCliente, servico, data, hora }) {
  try {
    const mensagem = `Olá, *${nomeCliente}*! O seu agendamento para *${servico}* foi confirmado para o dia *${data}* às *${hora}*. Obrigado pela preferência!`;

    const response = await fetch('http://184.107.106.72:8080/api/barbearia/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: phone, // Exemplo: '5541998406295'
        message: mensagem,
      }),
    });

    const dataRes = await response.json();

    if (!response.ok) {
      throw new Error(dataRes.error || 'Erro ao enviar mensagem pelo WhatsApp');
    }

    return { success: true, data: dataRes };
  } catch (error) {
    console.error('Falha na integração com o WhatsApp:', error);
    return { success: false, error: error.message };
  }
}