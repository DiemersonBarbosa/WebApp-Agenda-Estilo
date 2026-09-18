'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Calendar, Sparkles, Trash2, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function NotificacoesBell({ barbeariaId }) {
  const [agendamentosHoje, setAgendamentosHoje] = useState([]);
  const [modalNotifAberto, setModalNotifAberto] = useState(false);
  const [novaNotificacaoToast, setNovaNotificacaoToast] = useState(null);

  const modalRef = useRef(null);
  const idsConhecidosRef = useRef(new Set());
  const primeiraCargaRef = useRef(true);

  const HOJE_ISO = new Date().toISOString().split('T')[0];

  const carregarNotificacoesDoDia = async () => {
    if (!supabase) return;

    try {
      let query = supabase
        .from('agendamentos')
        .select(`
          id,
          cliente_id,
          data_hora,
          status,
          valor_total,
          barbearia_id,
          lido,
          clientes:cliente_id (nome),
          servicos:servico_id (nome, preco)
        `)
        .eq('lido', false)
        .order('data_hora', { ascending: true });

      if (barbeariaId) {
        query = query.eq('barbearia_id', barbeariaId);
      }

      const { data, error } = await query;

      if (!error && data) {
        const doDia = data.filter(item => {
          if (!item.data_hora) return false;
          return item.data_hora.substring(0, 10) === HOJE_ISO;
        });

        if (!primeiraCargaRef.current) {
          const novosItens = doDia.filter(item => !idsConhecidosRef.current.has(item.id));
          
          if (novosItens.length > 0) {
            const ultimoNovo = novosItens[novosItens.length - 1];
            setNovaNotificacaoToast(ultimoNovo);
            
            setTimeout(() => {
              setNovaNotificacaoToast(null);
            }, 4500);
          }
        }

        doDia.forEach(item => idsConhecidosRef.current.add(item.id));
        primeiraCargaRef.current = false;

        setAgendamentosHoje(doDia);
      }
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);
    }
  };

  useEffect(() => {
    carregarNotificacoesDoDia();

    const intervalo = setInterval(() => {
      carregarNotificacoesDoDia();
    }, 10000);

    return () => clearInterval(intervalo);
  }, [barbeariaId]);

  useEffect(() => {
    const handleClickFora = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setModalNotifAberto(false);
      }
    };

    if (modalNotifAberto) {
      document.addEventListener('mousedown', handleClickFora);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickFora);
    };
  }, [modalNotifAberto]);

  const limparNotificacoesOnline = async () => {
    if (!supabase || agendamentosHoje.length === 0) return;

    const idsParaMarcarComoLidos = agendamentosHoje.map(item => item.id);

    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ lido: true })
        .in('id', idsParaMarcarComoLidos);

      if (!error) {
        setAgendamentosHoje([]);
        setModalNotifAberto(false);
      }
    } catch (err) {
      console.error('Erro ao limpar notificações online:', err);
    }
  };

  const naoLidas = agendamentosHoje.length;

  return (
    <div className="relative inline-block">
      
      {/* Botão do Sininho */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setModalNotifAberto(!modalNotifAberto);
        }}
        className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white border border-stone-200/80 flex items-center justify-center text-stone-700 hover:bg-stone-50 transition-all shadow-xs cursor-pointer group"
        title="Notificações de Agendamentos"
      >
        <Bell className="w-5 h-5 text-stone-800 group-hover:rotate-12 transition-transform" />
        {naoLidas > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse"></span>
        )}
      </button>

      {/* Prévia Flutuante (Toast) */}
      {novaNotificacaoToast && (
        <div className="fixed top-5 right-5 z-[9999] w-84 bg-gradient-to-b from-[#000]/95 via-[#2a2a2b]/95 to-[#292929]/90 backdrop-blur-2xl text-white px-5 py-4 rounded-[2rem] shadow-[0_20px_50px_rgba(29,78,216,0.3)] border border-blue-400/30 flex items-center gap-3.5 animate-in slide-in-from-top-5 duration-300">
          <div className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center shrink-0 border border-white/20 shadow-xs">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-blue-200">Novo Agendamento</p>
            <p className="text-xs font-extrabold truncate mt-0.5 text-white">
              {novaNotificacaoToast.clientes?.nome || 'Cliente'} - {novaNotificacaoToast.servicos?.nome || 'Serviço'}
            </p>
          </div>
        </div>
      )}

      {/* Painel Dropdown com Efeito de Vidro Azulado e Degradê */}
      {modalNotifAberto && (
        <div 
          ref={modalRef}
          className="fixed left-0 right-0 top-0 w-full bg-gradient-to-b from-[#000]/95 via-[#2a2a2b]/95 to-[#292929]/90 backdrop-blur-2xl text-white  border-b border-blue-400/30 rounded-b-[3rem] p-5 sm:p-8 z-50 transition-all duration-300 ease-in-out transform translate-y-0 animate-in slide-in-from-top duration-300"
        >
          
          <div className="max-w-4xl mx-auto pt-1">

            {/* Lista de Notificações com Balões Black Piano Compactos */}
            <div className="max-h-80 overflow-y-auto space-y-3 pt-1 pr-1">
              {agendamentosHoje.length === 0 ? (
                <div className="text-center py-10 text-blue-200 text-xs border border-dashed border-blue-400/30 rounded-[2.5rem] bg-white/10 flex flex-col items-center justify-center gap-2 shadow-xs">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-blue-200 border border-white/20">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  </div>
                  <span className="font-bold text-white">Nenhuma notificação pendente</span>
                  <span className="text-[10px] text-blue-200">Você está em dia com os horários de hoje!</span>
                </div>
              ) : (
                agendamentosHoje.map((item) => (
                  <div 
                    key={item.id}
                    className="relative px-4 py-3 sm:px-5 sm:py-3.5 rounded-[2rem]  bg-white/15 border border-white/25 hover:bg-white/25 transition-all shadow-sm flex items-center gap-2 cursor-pointer backdrop-blur-md"
                  >
                    {/* Lado Esquerdo: Ícone Minimalista + Informações */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-stone-900 text-emerald-400 flex items-center justify-center shrink-0 border border-stone-800 shadow-2xs">
                        <Calendar className="w-4 h-4" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-black text-white text-xs sm:text-sm tracking-tight truncate">
                            {item.clientes?.nome || 'Cliente'}
                          </p>
                          <span className="inline-flex items-center text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800/40 tracking-wider shrink-0">
                            {item.status || 'Agendado'}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-400 font-medium truncate mt-0.5">
                          {item.servicos?.nome || 'Serviço'} • <strong className="text-stone-200 font-bold">R$ {Number(item.valor_total || item.servicos?.preco || 0).toFixed(2)}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Lado Direito: Horário Sofisticado */}
                    <div className="shrink-0 ">
                      <span className="text-[11px] font-extrabold text-stone-200 bg-stone-900 px-3 py-1.5 rounded-xl border border-stone-800 shadow-2xs flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        {item.data_hora ? new Date(item.data_hora).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                      </span>
                    </div>

                  </div>
                ))
              )}
            </div>

            {/* Botão de Limpar Tudo */}
            {naoLidas > 0 && (
              <div className="mt-4 pt-3  flex justify-center">
                <button
                  onClick={limparNotificacoesOnline}
                  className="text-xs font-black text-white px-6 py-2.5 rounded-2xl bg-white/15 border border-white/25 hover:bg-white/25 transition-all shadow-sm flex items-center gap-2 cursor-pointer backdrop-blur-md"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>Limpar tudo</span>
                </button>
              </div>
            )}

          </div>

        </div>
      )}
    </div>
  );
}