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

    const { fcmToken, titulo, corpo } = await req.json();

    if (!fcmToken) {
      return NextResponse.json({ error: 'Token FCM não fornecido' }, { status: 400 });
    }

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

    const response = await admin.messaging().send(message);

    return NextResponse.json({ success: true, messageId: response });
  } catch (error) {
    console.error('Erro na rota /api/notificar-agendamento:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}