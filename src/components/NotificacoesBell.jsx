'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Calendar, Sparkles, Trash2, Clock, Scissors } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function NotificacoesBell({ barbeariaId }) {
  const [agendamentosNotif, setAgendamentosNotif] = useState([]);
  const [modalNotifAberto, setModalNotifAberto] = useState(false);
  const [novaNotificacaoToast, setNovaNotificacaoToast] = useState(null);

  const modalRef = useRef(null);
  const idsConhecidosRef = useRef(new Set());
  const primeiraCargaRef = useRef(true);

  const carregarNotificacoes = async () => {
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
          barbeiro_id,
          clientes:cliente_id (nome),
          servicos:servico_id (nome, preco),
          barbeiros:barbeiro_id (nome)
        `)
        .order('data_hora', { ascending: false })
        .limit(20);

      if (barbeariaId) {
        query = query.eq('barbearia_id', barbeariaId);
      }

      const { data, error } = await query;

      if (!error && data) {
        // Filtramos para mostrar os que não foram lidos (ou se 'lido' for nulo/falso)
        const listaNotificacoes = data.filter(item => item.lido === false || item.lido === null);

        if (!primeiraCargaRef.current) {
          const novosItens = listaNotificacoes.filter(item => !idsConhecidosRef.current.has(item.id));
          
          if (novosItens.length > 0) {
            const ultimoNovo = novosItens[0];
            setNovaNotificacaoToast(ultimoNovo);
            
            setTimeout(() => {
              setNovaNotificacaoToast(null);
            }, 4500);
          }
        }

        listaNotificacoes.forEach(item => idsConhecidosRef.current.add(item.id));
        primeiraCargaRef.current = false;

        setAgendamentosNotif(listaNotificacoes);
      }
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);
    }
  };

  useEffect(() => {
    carregarNotificacoes();

    const intervalo = setInterval(() => {
      carregarNotificacoes();
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
    if (!supabase || agendamentosNotif.length === 0) return;

    const idsParaMarcarComoLidos = agendamentosNotif.map(item => item.id);

    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ lido: true })
        .in('id', idsParaMarcarComoLidos);

      if (!error) {
        setAgendamentosNotif([]);
        setModalNotifAberto(false);
      }
    } catch (err) {
      console.error('Erro ao limpar notificações online:', err);
    }
  };

  const naoLidas = agendamentosNotif.length;

  const formatarDataNotificacao = (dataHora) => {
    if (!dataHora) return '';
    try {
      const dataObj = new Date(dataHora);
      return dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="relative inline-block">
      
      {/* Botão do Sininho */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setModalNotifAberto(!modalNotifAberto);
        }}
        className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/80 backdrop-blur-md border border-stone-200/80 flex items-center justify-center text-stone-700 hover:bg-white transition-all shadow-xs cursor-pointer group"
        title="Notificações de Agendamentos"
      >
        <Bell className="w-5 h-5 text-stone-800 group-hover:rotate-12 transition-transform" />
        {naoLidas > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse"></span>
        )}
      </button>

      {/* Prévia Flutuante (Toast) */}
      {novaNotificacaoToast && (
        <div className="fixed top-5 right-5 z-[9999] w-84 bg-white/85 backdrop-blur-xl text-slate-900 px-5 py-4 rounded-[2rem] shadow-2xl border border-white/40 flex items-center gap-3.5 animate-in slide-in-from-top-5 duration-300">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Nova Movimentação na Agenda</p>
            <p className="text-xs font-extrabold truncate mt-0.5 text-slate-900">
              {novaNotificacaoToast.clientes?.nome || 'Cliente'} - {novaNotificacaoToast.servicos?.nome || 'Serviço'}
            </p>
          </div>
        </div>
      )}

      {/* Painel Dropdown */}
      {modalNotifAberto && (
        <div 
          ref={modalRef}
          className="fixed left-0 right-0 top-0 w-full bg-gradient-to-b from-white/95 via-slate-50/90 to-stone-100/95 backdrop-blur-2xl text-slate-900 border-b border-stone-200/80 shadow-[0_25px_60px_rgba(0,0,0,0.15)] rounded-b-[2.5rem] p-4 sm:p-6 z-50 transition-all duration-300 ease-in-out transform translate-y-0 animate-in slide-in-from-top duration-300"
        >
          
          <div className="max-w-xl mx-auto pt-2">

            {/* Cabeçalho do Painel */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-200/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-stone-900 text-emerald-400 flex items-center justify-center shadow-xs shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Notificações</h3>
                  <p className="text-[10px] text-stone-500 font-medium">Movimentações e agendamentos</p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-3 py-1 rounded-full bg-stone-200/70 text-stone-800">
                {naoLidas} {naoLidas === 1 ? 'pendente' : 'pendentes'}
              </span>
            </div>

            {/* Lista de Notificações */}
            <div className="max-h-[60vh] overflow-y-auto space-y-2.5 pr-1">
              {agendamentosNotif.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs border border-dashed border-stone-300/70 rounded-3xl bg-white/50 backdrop-blur-md flex flex-col items-center justify-center gap-2 shadow-inner">
                  <div className="w-10 h-10 rounded-2xl bg-white text-emerald-600 flex items-center justify-center border border-stone-200 shadow-xs">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  </div>
                  <span className="font-bold text-slate-800">Nenhuma notificação pendente</span>
                  <span className="text-[10px] text-slate-500">Todas as movimentações foram lidas!</span>
                </div>
              ) : (
                agendamentosNotif.map((item) => {
                  const nomeProfissional = item.barbeiros?.nome || 'Não atribuído';

                  return (
                    <div 
                      key={item.id}
                      className="relative p-3.5 rounded-2xl bg-white border border-stone-200/90 hover:border-stone-300 transition-all shadow-xs flex items-center justify-between gap-3"
                    >
                      {/* Esquerda: Ícone + Detalhes */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-xl bg-stone-900 text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
                          <Calendar className="w-4 h-4" />
                        </div>

                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-black text-slate-900 text-xs tracking-tight truncate max-w-[140px]">
                              {item.clientes?.nome || 'Cliente'}
                            </p>
                            <span className="inline-flex items-center text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 tracking-wider">
                              {item.status || 'Agendado'}
                            </span>
                          </div>

                          <p className="text-[11px] text-stone-500 font-medium truncate">
                            {item.servicos?.nome || 'Serviço'} • <strong className="text-stone-900 font-bold">R$ {Number(item.valor_total || item.servicos?.preco || 0).toFixed(2)}</strong>
                          </p>

                          <div className="flex items-center gap-1 text-[10px] text-stone-600 font-semibold">
                            <Scissors className="w-3 h-3 text-stone-400" />
                            <span>Profissional: <strong className="text-stone-900">{nomeProfissional}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Direita: Data e Hora Juntas e Compactas */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-lg border border-stone-200/60">
                          {formatarDataNotificacao(item.data_hora)}
                        </span>
                        <span className="text-[11px] font-extrabold text-slate-800 bg-stone-50 px-2.5 py-1 rounded-xl border border-stone-200 shadow-2xs flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-600" />
                          {item.data_hora ? new Date(item.data_hora).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                        </span>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

            {/* Botão de Limpar Tudo */}
            {naoLidas > 0 && (
              <div className="mt-4 pt-3 border-t border-stone-200/60 flex justify-center">
                <button
                  onClick={limparNotificacoesOnline}
                  className="text-xs font-black text-stone-700 px-6 py-2.5 rounded-2xl bg-white border border-stone-200 hover:bg-stone-50 transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
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