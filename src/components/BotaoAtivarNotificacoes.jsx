import React from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/lib/supabaseClient';

export default function BotaoAtivarNotificacoes({ barbeariaId }) {
  
  const lidarComClique = async () => {
    if (!Capacitor.isNativePlatform()) {
      alert('As notificações push nativas só funcionam no aplicativo Android.');
      return;
    }

    try {
      // 1. Solicita permissão ao sistema Android
      let permStatus = await PushNotifications.checkPermissions();
      if (permStatus.receive !== 'granted') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        alert('Permissão de notificação negada pelo utilizador.');
        return;
      }

      alert('Permissão concedida! A gerar token...');

      // 2. Remove ouvintes anteriores para evitar duplicidade
      await PushNotifications.removeAllListeners();

      // 3. Regista o ouvinte do token gerado pelo Firebase
      await PushNotifications.addListener('registration', async (token) => {
        console.log('FCM Token obtido com sucesso:', token.value);
        alert('Token obtido! A guardar no Supabase...');

        const { error } = await supabase
          .from('barbearias')
          .update({ fcm_token: token.value })
          .eq('id', barbeariaId);

        if (error) {
          console.error('Erro ao atualizar no Supabase:', error);
          alert('Erro ao gravar token na base de dados: ' + error.message);
        } else {
          alert('Sucesso absoluto! Token guardado na base de dados.');
        }
      });

      // 4. Regista o ouvinte de erros do FCM
      await PushNotifications.addListener('registrationError', (err) => {
        console.error('Erro de registo FCM:', err);
        alert('Erro no Firebase: ' + JSON.stringify(err));
      });

      // 5. Dispara o comando oficial de registo nativo
      await PushNotifications.register();

    } catch (erro) {
      console.error('Erro crítico ao ativar notificações:', erro);
      alert('Erro inesperado: ' + erro.message);
    }
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <button 
        type="button"
        onClick={lidarComClique}
        style={{
          backgroundColor: '#059669',
          color: '#ffffff',
          padding: '16px 28px',
          borderRadius: '12px',
          border: 'none',
          fontSize: '18px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
        }}
      >
        ATIVAR NOTIFICAÇÕES PUSH
      </button>
    </div>
  );
}