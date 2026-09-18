'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Calendar, X, Sparkles, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function NotificacoesBell({ barbeariaId }) {
  const [agendamentosHoje, setAgendamentosHoje] = useState([]);
  const [modalNotifAberto, setModalNotifAberto] = useState(false);
  const [novaNotificacaoToast, setNovaNotificacaoToast] = useState(null);

  // Referência para controlar os IDs já processados e evitar alertas repetidos
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

        // Se não for a primeira carga, verifica se há novos IDs que ainda não conhecíamos
        if (!primeiraCargaRef.current) {
          const novosItens = doDia.filter(item => !idsConhecidosRef.current.has(item.id));
          
          if (novosItens.length > 0) {
            // Pega o mais recente para exibir na prévia flutuante
            const ultimoNovo = novosItens[novosItens.length - 1];
            setNovaNotificacaoToast(ultimoNovo);
            
            setTimeout(() => {
              setNovaNotificacaoToast(null);
            }, 4500); // Exibe por 4.5 segundos
          }
        }

        // Atualiza o registro dos IDs conhecidos
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
    }, 10000); // Verifica a cada 10 segundos

    return () => clearInterval(intervalo);
  }, [barbeariaId]);

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
      }
    } catch (err) {
      console.error('Erro ao limpar notificações online:', err);
    }
  };

  const naoLidas = agendamentosHoje.length;

  return (
    <div className="relative">
      
      {/* Botão do Sininho */}
      <button
        onClick={() => setModalNotifAberto(!modalNotifAberto)}
        className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white border border-stone-200/80 flex items-center justify-center text-stone-700 hover:bg-stone-50 transition-all shadow-xs cursor-pointer group"
        title="Notificações de Agendamentos"
      >
        <Bell className="w-5 h-5 text-stone-800 group-hover:rotate-12 transition-transform" />
        {naoLidas > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse"></span>
        )}
      </button>

      {/* Prévia Flutuante Temporária na Tela (Toast Black Piano) */}
      {novaNotificacaoToast && (
        <div className="fixed top-5 right-5 z-[9999] w-80 bg-[#121212] text-white px-5 py-4 rounded-2xl shadow-2xl border border-stone-800 flex items-center gap-3.5 animate-in slide-in-from-top-5 duration-300">
          <div className="w-10 h-10 rounded-xl bg-stone-900 text-emerald-400 flex items-center justify-center shrink-0 border border-stone-800">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black uppercase tracking-wider text-emerald-400">Novo Agendamento</p>
            <p className="text-xs font-bold truncate mt-0.5 text-stone-200">
              {novaNotificacaoToast.clientes?.nome || 'Cliente'} - {novaNotificacaoToast.servicos?.nome || 'Serviço'}
            </p>
          </div>
        </div>
      )}

      {/* Dropdown Black Piano */}
      {modalNotifAberto && (
        <>
          <div 
            onClick={() => setModalNotifAberto(false)}
            className="fixed inset-0 z-40 bg-transparent"
          />

          <div className="absolute right-0 mt-3 w-84 sm:w-96 bg-[#121212] text-stone-100 rounded-3xl shadow-2xl border border-stone-800 p-5 z-50 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Cabeçalho */}
            <div className="flex items-center justify-between pb-3.5 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <h3 className="font-black text-white text-xs uppercase tracking-wider">Atendimentos de Hoje</h3>
                <span className="text-[10px] bg-stone-800 text-stone-300 font-bold px-2 py-0.5 rounded-full border border-stone-700">
                  {naoLidas}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {naoLidas > 0 && (
                  <button
                    onClick={limparNotificacoesOnline}
                    className="text-[11px] font-bold text-stone-400 hover:text-rose-400 px-2.5 py-1 rounded-xl hover:bg-stone-800 transition-colors flex items-center gap-1 cursor-pointer"
                    title="Limpar notificações online"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Limpar</span>
                  </button>
                )}
                <button 
                  onClick={() => setModalNotifAberto(false)}
                  className="text-stone-400 hover:text-white p-1.5 rounded-xl hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Lista com cartões estilo Black Piano */}
            <div className="max-h-80 overflow-y-auto space-y-3 pt-3.5 pr-1">
              {agendamentosHoje.length === 0 ? (
                <div className="text-center py-12 text-stone-500 text-xs border border-dashed border-stone-800 rounded-2xl bg-stone-900/40 flex flex-col items-center justify-center gap-2">
                  <Sparkles className="w-6 h-6 text-stone-600 animate-bounce" />
                  <span>Nenhuma notificação no momento.</span>
                </div>
              ) : (
                agendamentosHoje.map((item) => (
                  <div 
                    key={item.id}
                    className="relative p-4 rounded-2xl bg-[#1a1a1a] border border-stone-800 hover:border-stone-700 transition-all flex items-start gap-3.5 group overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l-full"></div>

                    <div className="w-9 h-9 rounded-xl bg-stone-900 text-emerald-400 flex items-center justify-center shrink-0 border border-stone-800 shadow-xs">
                      <Calendar className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-black text-white text-xs tracking-tight truncate">
                          {item.clientes?.nome || 'Cliente'}
                        </p>
                        <span className="text-[10px] font-bold text-stone-400 bg-stone-900 px-2 py-0.5 rounded-md border border-stone-800">
                          {item.data_hora ? new Date(item.data_hora).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                        </span>
                      </div>

                      <p className="text-[11px] text-stone-400 font-medium mt-1 truncate">
                        {item.servicos?.nome || 'Serviço'} • <strong className="text-stone-200">R$ {Number(item.valor_total || item.servicos?.preco || 0).toFixed(2)}</strong>
                      </p>

                      <div className="mt-2 flex items-center gap-2">
                        <span className="inline-flex items-center text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/50 tracking-wider">
                          {item.status || 'Agendado'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
