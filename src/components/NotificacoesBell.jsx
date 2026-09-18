'use client';

import { useState, useEffect } from 'react';
import { Bell, Calendar, X, Sparkles, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function NotificacoesBell({ barbeariaId }) {
  const [agendamentosHoje, setAgendamentosHoje] = useState([]);
  const [modalNotifAberto, setModalNotifAberto] = useState(false);
  const [limpoPeloUsuario, setLimpoPeloUsuario] = useState(false);

  const HOJE_ISO = new Date().toISOString().split('T')[0];

  const extrairDataIso = (dataHoraStr) => {
    if (!dataHoraStr) return '';
    return String(dataHoraStr).substring(0, 10);
  };

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
          clientes:cliente_id (nome),
          servicos:servico_id (nome, preco)
        `)
        .order('data_hora', { ascending: true });

      if (barbeariaId) {
        query = query.eq('barbearia_id', barbeariaId);
      }

      const { data, error } = await query;

      if (!error && data) {
        const doDia = data.filter(item => extrairDataIso(item.data_hora) === HOJE_ISO);
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

  const limparNotificacoes = () => {
    setLimpoPeloUsuario(true);
  };

  // Se o usuário limpou nesta sessão, mostra vazio. Se chegar um novo agendamento, atualiza a lista.
  const listaExibida = limpoPeloUsuario ? [] : agendamentosHoje;
  const naoLidas = listaExibida.length;

  return (
    <div className="relative">
      {/* Botão do Sininho */}
      <button
        onClick={() => setModalNotifAberto(!modalNotifAberto)}
        className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white border border-stone-200/80 flex items-center justify-center text-stone-700 hover:bg-stone-50 transition-all shadow-xs cursor-pointer group"
        title="Notificações de Agendamentos"
      >
        <Bell className="w-5 h-5 text-stone-800 group-hover:rotate-12 transition-transform" />
        {naoLidas > 0 && !limpoPeloUsuario && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse"></span>
        )}
      </button>

      {/* Dropdown Estilo Smartphone */}
      {modalNotifAberto && (
        <div className="absolute right-0 mt-3 w-84 sm:w-96 bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-stone-200/90 p-5 sm:p-6 z-50 animate-in fade-in zoom-in-95 duration-150">
          
          {/* Cabeçalho */}
          <div className="flex items-center justify-between pb-3.5 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <h3 className="font-black text-stone-900 text-xs uppercase tracking-wider">Atendimentos de Hoje</h3>
              <span className="text-[10px] bg-stone-100 text-stone-600 font-bold px-2 py-0.5 rounded-full">
                {naoLidas}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {naoLidas > 0 && (
                <button
                  onClick={limparNotificacoes}
                  className="text-[11px] font-bold text-stone-400 hover:text-rose-600 px-2 py-1 rounded-xl hover:bg-rose-50 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Limpar notificações"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpar</span>
                </button>
              )}
              <button 
                onClick={() => setModalNotifAberto(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Lista em formato de cartões mobile */}
          <div className="max-h-80 overflow-y-auto space-y-3 pt-3.5 pr-1">
            {listaExibida.length === 0 ? (
              <div className="text-center py-12 text-stone-400 text-xs border border-dashed border-stone-200 rounded-3xl bg-stone-50/50 flex flex-col items-center justify-center gap-2">
                <Sparkles className="w-6 h-6 text-stone-300 animate-bounce" />
                <span>Nenhuma notificação no momento.</span>
              </div>
            ) : (
              listaExibida.map((item) => (
                <div 
                  key={item.id}
                  className="relative p-4 rounded-3xl bg-stone-50/80 border border-stone-200/70 hover:bg-white hover:shadow-md transition-all flex items-start gap-3.5 group overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l-full"></div>

                  <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 shadow-xs">
                    <Calendar className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-black text-stone-900 text-xs tracking-tight truncate">
                        {item.clientes?.nome || 'Cliente'}
                      </p>
                      <span className="text-[10px] font-bold text-stone-400 bg-white px-2 py-0.5 rounded-md border border-stone-200/60 shadow-2xs">
                        {item.data_hora ? new Date(item.data_hora).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                      </span>
                    </div>

                    <p className="text-[11px] text-stone-600 font-medium mt-1 truncate">
                      {item.servicos?.nome || 'Serviço'} • <strong className="text-stone-900">R$ {Number(item.valor_total || item.servicos?.preco || 0).toFixed(2)}</strong>
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex items-center text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 tracking-wider">
                        {item.status || 'Agendado'}
                      </span>
                    </div>
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
