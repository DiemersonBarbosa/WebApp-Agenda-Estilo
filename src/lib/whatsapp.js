export async function enviarConfirmacaoWhatsApp({ phone, nomeCliente, servico, data, hora, nomeBarbearia }) {
  try {
    const mensagem = `Olá, *${nomeCliente}*! O seu agendamento na *${nomeBarbearia || 'Barbearia'}* para *${servico}* foi confirmado para o dia *${data}* às *${hora}*. Obrigado pela preferência!`;

    const response = await fetch('http://localhost:8080/api/barbearia/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 9916131399Di@11081996Pa@'
      },
      body: JSON.stringify({
        phone: phone,
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