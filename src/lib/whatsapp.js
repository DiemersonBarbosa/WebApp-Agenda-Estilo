export async function enviarMensagemWhatsApp({
  phone,
  nomeCliente,
  servico,
  data,
  hora,
  nomeBarbearia,
  mensagem: mensagemCustomizada,
}) {
  try {
    const estabelecimento = nomeBarbearia || 'Estabelecimento';

    const mensagemPadrao = [
      `Olá, *${nomeCliente}*! Seu horário está confirmado.`,
      ``,
      `• *Local:* ${estabelecimento}`,
      `• *Serviço:* ${servico}`,
      `• *Data:* ${data}`,
      `• *Horário:* ${hora}`,
      ``,
      `Agradecemos a sua confiança!`,
    ].join('\n');

    const mensagem = mensagemCustomizada || mensagemPadrao;

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
