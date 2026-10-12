'use client';

import { useEffect } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { supabase } from '@/lib/supabase';

export function usePushNotifications(barbeariaId) {
  useEffect(() => {
    if (!barbeariaId) return;

    // 1. Pedir permissão ao Android para enviar notificações
    async function solicitarPermissoes() {
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') {
        await LocalNotifications.requestPermissions();
      }
    }

    solicitarPermissoes();

    // 2. Criar canal do Supabase Realtime para escutar agendamentos
    const channel = supabase
      .channel(`notificacoes_barbearia_${barbeariaId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Escuta INSERT, UPDATE e DELETE
          schema: 'public',
          table: 'agendamentos',
          filter: `barbearia_id=eq.${barbeariaId}`,
        },
        async (payload) => {
          let titulo = '';
          let corpo = '';

          const clienteNome = payload.new?.cliente_nome || payload.old?.cliente_nome || 'Cliente';
          const servico = payload.new?.servico_nome || 'Serviço';
          const horario = payload.new?.horario || '';

          // Trata os 3 tipos de eventos
          if (payload.eventType === 'INSERT') {
            titulo = '📅 Novo Agendamento!';
            corpo = `${clienteNome} agendou ${servico}${horario ? ' às ' + horario : ''}.`;
          } else if (payload.eventType === 'UPDATE') {
            // Se o agendamento for cancelado
            if (payload.new?.status === 'cancelado') {
              titulo = '❌ Agendamento Cancelado';
              corpo = `${clienteNome} cancelou o agendamento de ${servico}.`;
            } else {
              titulo = '✏️ Agendamento Alterado';
              corpo = `O agendamento de ${clienteNome} foi atualizado.`;
            }
          } else if (payload.eventType === 'DELETE') {
            titulo = '🗑️ Agendamento Removido';
            corpo = `Um agendamento de ${clienteNome} foi excluído do sistema.`;
          }

          // 3. Disparar a notificação na barra de notificações do Android
          if (titulo) {
            await LocalNotifications.schedule({
              notifications: [
                {
                  title: titulo,
                  body: corpo,
                  id: new Date().getTime(),
                  schedule: { at: new Date(Date.now() + 100) }, // Dispara imediatamente
                  sound: 'default',
                  smallIcon: 'ic_stat_icon_config', // Ícone padrão do Android
                  actionTypeId: '',
                  extra: null,
                },
              ],
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [barbeariaId]);
}