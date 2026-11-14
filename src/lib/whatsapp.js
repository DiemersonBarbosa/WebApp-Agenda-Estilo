// src/lib/whatsapp.js

export async function enviarMensagemWhatsApp(telefone, mensagem) {
  // AQUI VOCÊ COLOCA O IP DO SEU VPS (ex: http://123.45.67.89:8080/...)
  // Substitua "SEU_IP_DO_VPS" pelo endereço IP real do seu servidor Ubuntu.
  const url = 'http://184.107.106.72:8080/api/barbearia/send-message';
  
  // A senha secreta que definimos no docker-compose.yml do VPS
  const secretKey = '9916131399Di@11081996Pa@';

  // Limpa o telefone para deixar apenas os números (ex: remove traços e parênteses)
  const numeroLimpo = telefone.replace(/\D/g, '');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secretKey}`
      },
      body: JSON.stringify({
        phone: `55${numeroLimpo}`, // Adiciona o DDI do Brasil (55) na frente
        message: mensagem
      })
    });

    const data = await response.json();
    return { sucesso: true, data };
  } catch (err) {
    console.error('Erro ao enviar WhatsApp:', err);
    return { sucesso: false, erro: err.message };
  }
}