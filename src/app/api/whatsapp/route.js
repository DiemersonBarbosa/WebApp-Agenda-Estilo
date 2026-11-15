import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { telefone, mensagem } = body;

    const response = await fetch('http://localhost:8080/api/barbearia/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 9916131399Di@11081996Pa@'
      },
      body: JSON.stringify({ phone: telefone, message: mensagem })
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro no proxy do WhatsApp:', error);
    return NextResponse.json({ success: false, erro: error.message }, { status: 500 });
  }
}