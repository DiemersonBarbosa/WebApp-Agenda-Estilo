'use client';

import { useState, useEffect } from 'react';
import { Bell, Calendar, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function NotificacoesBell() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [modalNotifAberto, setModalNotifAberto] = useState(false);

  // Busca direta e bruta na tabela de agendamentos (sem filtros restritivos)
  const buscarAgendamentos = async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .order('criado_em', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Erro ao buscar no Supabase:', error);
      }

      if (data) {
        console.log('Agendamentos encontrados pelo sininho:', data);
        setAgendamentos(data);
      }
    } catch (err) {
      console.error('Erro:', err);
    }
  };

  useEffect(() => {
    buscarAgendamentos();

    // Polling a cada 10 segundos para atualizar o sininho
    const intervalo = setInterval(() => {
      buscarAgendamentos();
    }, 10000);

    return () => clearInterval(intervalo);
  }, []);

  const naoLidas = agendamentos.length;

  return (
    <div className="relative">
      {/* Botão do Sininho */}
      <button
        onClick={() => setModalNotifAberto(!modalNotifAberto)}
        className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white border border-stone-200/80 flex items-center justify-center text-stone-700 hover:bg-stone-50 transition-all shadow-xs cursor-pointer"
      >
        <Bell className="w-5 h-5 text-stone-800" />
        {naoLidas > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse"></span>
        )}
      </button>

      {/* Dropdown de Notificações */}
      {modalNotifAberto && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-[2.5rem] shadow-2xl border border-stone-200/80 p-6 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-3.5 border-b border-stone-100">
            <h3 className="font-black text-stone-900 text-sm tracking-tight">Notificações de Agendamentos</h3>
            <button 
              onClick={() => setModalNotifAberto(false)}
              className="text-stone-400 hover:text-stone-600 p-1 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2.5 pt-3.5 pr-1">
            {agendamentos.length === 0 ? (
              <div className="text-center py-10 text-stone-400 text-xs border border-dashed border-stone-200 rounded-3xl">
                Nenhum agendamento encontrado na tabela.
              </div>
            ) : (
              agendamentos.map((item) => (
                <div 
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/60 flex items-start gap-3 hover:bg-stone-100/60 transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-stone-900 text-xs truncate">
                      {item.cliente_nome || 'Cliente Teste'}
                    </p>
                    <p className="text-[11px] text-stone-600 font-medium mt-0.5">
                      Serviço: <strong className="text-stone-900">{item.servico_nome || 'Corte'}</strong>
                    </p>
                    <span className="text-[10px] text-stone-400 block mt-1">
                      Horário: {item.horario || item.data_hora}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
