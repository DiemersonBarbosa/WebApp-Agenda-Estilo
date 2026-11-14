import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

function initFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  });
}

export async function POST(req) {
  try {
    const firebaseApp = initFirebaseAdmin();

    if (!firebaseApp) {
      return NextResponse.json(
        { error: 'Serviço Firebase Admin não configurado no servidor.' },
        { status: 500 }
      );
    }

    // Recebemos também o telefone e os dados do agendamento na requisição
    const { fcmToken, titulo, corpo, telefone, nomeCliente, servico, data, hora } = await req.json();

    let whatsappResult = null;

    // Se o telefone foi enviado, disparamos o WhatsApp para a VPS
    if (telefone) {
      try {
        const mensagemWhats = `Olá, *${nomeCliente || 'Cliente'}*! O seu agendamento para *${servico || 'Serviço'}* foi confirmado para o dia *${data || ''}* às *${hora || ''}*. Obrigado pela preferência!`;

        const waResponse = await fetch('http://184.107.106.72:8080/api/barbearia/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: telefone,
            message: mensagemWhats,
          }),
        });
        whatsappResult = await waResponse.json();
      } catch (waError) {
        console.error('Erro ao disparar WhatsApp na API:', waError);
      }
    }

    // Se houver token FCM, envia a notificação push do Firebase normalmente
    let fcmResponse = null;
    if (fcmToken) {
      const message = {
        notification: {
          title: titulo || '📅 Novo Agendamento!',
          body: corpo || 'Sua agenda recebeu uma nova atualização.',
        },
        data: {
          title: titulo || '📅 Novo Agendamento!',
          body: corpo || 'Sua agenda recebeu uma nova atualização.',
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            priority: 'max',
            visibility: 'public',
            channelId: 'agendamentos_channel',
          },
        },
        token: fcmToken,
      };

      fcmResponse = await admin.messaging().send(message);
    }

    return NextResponse.json({ 
      success: true, 
      messageId: fcmResponse,
      whatsapp: whatsappResult 
    });
  } catch (error) {
    console.error('Erro na rota /api/notificar-agendamento:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
