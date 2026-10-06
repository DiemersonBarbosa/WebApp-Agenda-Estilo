import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Inicializa a SDK do Firebase Admin no servidor (apenas uma vez)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export async function POST(req) {
  try {
    const { fcmToken, titulo, corpo } = await req.json();

    if (!fcmToken) {
      return NextResponse.json({ error: 'Token FCM não fornecido' }, { status: 400 });
    }

    // Monta a estrutura da mensagem Push
    const message = {
      notification: {
        title: titulo || '📅 Novo Agendamento!',
        body: corpo || 'A sua agenda recebeu uma nova marcação.',
      },
      token: fcmToken, // Token do telemóvel guardado no banco de dados
    };

    // Envia a notificação diretamente para o Google Firebase
    const response = await admin.messaging().send(message);

    return NextResponse.json({ success: true, messageId: response });
  } catch (error) {
    console.error('Erro ao enviar Push via Firebase:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}