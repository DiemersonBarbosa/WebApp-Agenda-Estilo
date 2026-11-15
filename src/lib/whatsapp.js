export async function enviarMensagemWhatsApp(telefone, mensagem) {
  try {
    const res = await fetch('/api/whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ telefone, mensagem }),
    });

    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Erro ao chamar API de WhatsApp:', err);
    return { sucesso: false, erro: err.message };
  }
}