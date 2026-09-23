'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Calendar, CheckCircle2, DollarSign, TrendingUp, TrendingDown, 
  Users, Settings, Percent, Scissors, ClipboardPenLine, ShoppingCart, 
  ShoppingBag, MessageCircleCheck, LogOut, History, X, Search, Filter, Clock, Trash2, ChevronRight, ChevronLeft 
} from 'lucide-react';

import NotificacoesBell from '@/components/NotificacoesBell';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function PainelAgendaDia({ profissionalId, barbeariaId, taxaComissao = 50, setActiveTab, setModalInfoAssinaturaOpen, handleLogout, mobileMenuOpen, setMobileMenuOpen, fecharMenuMobile }) {
  const [todosAgendamentos, setTodosAgendamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroFatal, setErroFatal] = useState(null);
  const [processandoId, setProcessandoId] = useState(null);
  
  // Estado para controlar a Data Selecionada no Mini Calendário (Padrão: Hoje no fuso local)
  const obterDataLocalIso = (d = new Date()) => {
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  const [dataSelecionada, setDataSelecionada] = useState(obterDataLocalIso());

  // Estado para controlar o Modal de Histórico Completo
  const [modalHistoricoOpen, setModalHistoricoOpen] = useState(false);
  const [filtroDataHistorico, setFiltroDataHistorico] = useState('');
  const [filtroStatusHistorico, setFiltroStatusHistorico] = useState('todos');

  const extrairDataIso = (item) => {
    const dataStr = item.data_hora || item.data || item.created_at || '';
    if (!dataStr) return '';
    try {
      const d = new Date(dataStr);
      return obterDataLocalIso(d);
    } catch {
      return String(dataStr).substring(0, 10);
    }
  };

  const formatarDataHora = (dataHoraStr) => {
    if (!dataHoraStr) return '';
    try {
      const data = new Date(dataHoraStr);
      return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dataHoraStr;
    }
  };

  const extrairHoraMinuto = (dataHoraStr) => {
    if (!dataHoraStr) return '--:--';
    try {
      const data = new Date(dataHoraStr);
      return data.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const carregarAgenda = async () => {
    try {
      setCarregando(true);
      setErroFatal(null);

      let barbeariaAtiva = barbeariaId;

      if (!barbeariaAtiva) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: barbeariaData } = await supabase
            .from('barbearias')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (barbeariaData) {
            barbeariaAtiva = barbeariaData.id;
          }
        }
      }

      let query = supabase
        .from('agendamentos')
        .select(`
          id,
          cliente_id,
          barbeiro_id,
          servico_id,
          data_hora,
          status,
          valor_total,
          barbearia_id,
          clientes:cliente_id (nome),
          servicos:servico_id (nome, preco),
          barbeiros:barbeiro_id (nome, barbearia_id)
        `)
        .order('data_hora', { ascending: true });

      if (barbeariaAtiva) {
        query = query.eq('barbearia_id', barbeariaAtiva);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        setTodosAgendamentos(data);
      }
    } catch (err) {
      setErroFatal(err.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarAgenda();
  }, [barbeariaId, profissionalId]);

  const concluirAgendamento = async (id) => {
    try {
      setProcessandoId(id);
      const { error } = await supabase
        .from('agendamentos')
        .update({ status: 'concluido' })
        .eq('id', id);

      if (error) throw error;
      carregarAgenda();
    } catch (err) {
      alert('Erro ao concluir agendamento: ' + err.message);
    } finally {
      setProcessandoId(null);
    }
  };

  const cancelarAgendamento = async (id) => {
    try {
      setProcessandoId(id);
      const { error } = await supabase
        .from('agendamentos')
        .update({ status: 'cancelado' })
        .eq('id', id);

      if (error) throw error;
      carregarAgenda();
    } catch (err) {
      alert('Erro ao cancelar agendamento: ' + err.message);
    } finally {
      setProcessandoId(null);
    }
  };

  const excluirAgendamento = async (id) => {
    if (!window.confirm('Deseja realmente excluir este agendamento?')) return;
    try {
      setProcessandoId(id);
      const { error } = await supabase
        .from('agendamentos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      carregarAgenda();
    } catch (err) {
      alert('Erro ao excluir agendamento: ' + err.message);
    } finally {
      setProcessandoId(null);
    }
  };

  // Filtrar agendamentos com base na data selecionada no mini calendário
  const agendamentosDoDiaSelecionado = todosAgendamentos.filter(item => extrairDataIso(item) === dataSelecionada);

  const totalAtendimentosDia = agendamentosDoDiaSelecionado.length;
  const concluidosDia = agendamentosDoDiaSelecionado.filter(i => i.status === 'concluido').length;
  const valorTotalDia = agendamentosDoDiaSelecionado
    .filter(i => i.status !== 'cancelado')
    .reduce((acc, item) => acc + Number(item.valor_total || item.servicos?.preco || 0), 0);

  const agendamentosPendentesDia = agendamentosDoDiaSelecionado.filter(item => {
    const status = (item.status || 'agendado').toLowerCase();
    return status !== 'concluido' && status !== 'cancelado';
  });

  // Gerar os próximos 7 dias para o Mini Calendário
  const gerarProximosDias = () => {
    const dias = [];
    const hoje = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(hoje);
      d.setDate(hoje.getDate() + i);
      const iso = obterDataLocalIso(d);
      const nomeDia = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
      const numeroDia = d.getDate();
      const nomeMes = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      dias.push({ iso, nomeDia, numeroDia, nomeMes });
    }
    return dias;
  };

  const proximaSemanaDias = gerarProximosDias();

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-0 space-y-5 pb-24">
      
      {/* ERRO FATAL */}
      {erroFatal && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-2xl shadow-sm">
          <div className="text-red-700 text-sm font-medium">Erro ao carregar agenda: {erroFatal}</div>
        </div>
      )}

      {/* CARDS DE RESUMO DO TOPO */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 md:gap-5">
        
        {/* 1. Card: Agendamentos */}
        <div 
          className="relative rounded-3xl md:rounded-[2.5rem] p-5 sm:p-6 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
            boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.8)'
          }}
        >
          <div className="flex flex-col justify-center min-w-0 pr-2">
            <span className="text-[9px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-wider truncate block">Agendamentos</span>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-1 truncate">{totalAtendimentosDia}</h3>
          </div>
          <div 
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)',
              boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 1), inset 0 -4px 6px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.9)'
            }}
          >
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
          </div>
        </div>

        {/* 2. Card: Concluídos */}
        <div 
          className="relative rounded-3xl md:rounded-[2.5rem] p-5 sm:p-6 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
            boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.8)'
          }}
        >
          <div className="flex flex-col justify-center min-w-0 pr-2">
            <span className="text-[9px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-wider truncate block">Concluídos</span>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-1 truncate">{concluidosDia}/{totalAtendimentosDia}</h3>
          </div>
          <div 
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)',
              boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 1), inset 0 -4px 6px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.9)'
            }}
          >
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
          </div>
        </div>

        {/* 3. Card: Projeção */}
        <div 
          className="relative rounded-3xl md:rounded-[2.5rem] p-5 sm:p-6 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
            boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.8)'
          }}
        >
          <div className="flex flex-col justify-center min-w-0 pr-2">
            <span className="text-[9px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-wider truncate block">Projeção</span>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-1 truncate">R$ {valorTotalDia.toFixed(0)}</h3>
          </div>
          <div 
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)',
              boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 1), inset 0 -4px 6px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.9)'
            }}
          >
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
          </div>
        </div>

        {/* 4. Botão Estratégico: Ver Histórico */}
        <button
          onClick={() => setModalHistoricoOpen(true)}
          className="relative rounded-3xl md:rounded-[2.5rem] p-5 sm:p-6 flex items-center justify-between border border-stone-200/80 bg-white transition-all cursor-pointer group min-w-0 overflow-hidden shadow-sm"
        >
          <div className="flex flex-col justify-center min-w-0 pr-2 text-left">
            <span className="text-[9px] sm:text-[10px] font-extrabold text-stone-400 uppercase tracking-wider truncate block">Registros</span>
            <span className="text-sm sm:text-lg font-black text-stone-900 mt-1 truncate">Ver Histórico</span>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#222222] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <History className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </button>

      </div>

      {/* MINI CALENDÁRIO ESTILOSO (PRÓXIMOS 7 DIAS) - COM ESPAÇAMENTO SUPERIOR CORRIGIDO */}
      <div className="bg-white rounded-[2rem] p-4 pt-5 border border-stone-200/90 shadow-sm space-y-2.5 overflow-visible">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">Selecionar Dia</span>
          <span className="text-[11px] font-bold text-stone-900 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200 truncate max-w-[200px]">
            {new Date(dataSelecionada + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 overflow-visible pt-1 pb-1">
          {proximaSemanaDias.map((dia) => {
            const selecionado = dataSelecionada === dia.iso;
            const qtdNoDia = todosAgendamentos.filter(item => extrairDataIso(item) === dia.iso && (item.status || 'agendado') !== 'cancelado').length;

            return (
              <button
                key={dia.iso}
                onClick={() => setDataSelecionada(dia.iso)}
                className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl transition-all cursor-pointer relative ${
                  selecionado 
                    ? 'bg-stone-900 text-white shadow-md scale-105 border border-stone-900' 
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200/70'
                }`}
              >
                <span className={`text-[8px] sm:text-[9px] uppercase font-bold tracking-wider ${selecionado ? 'text-stone-300' : 'text-stone-400'}`}>
                  {dia.nomeDia}
                </span>
                <span className="text-sm sm:text-base font-black my-0.5">
                  {dia.numeroDia}
                </span>
                <span className={`text-[8px] uppercase font-semibold ${selecionado ? 'text-stone-400' : 'text-stone-500'}`}>
                  {dia.nomeMes}
                </span>

                {qtdNoDia > 0 && (
                  <span className={`absolute -top-2 -right-1 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center shadow-xs z-10 ${
                    selecionado ? 'bg-emerald-400 text-stone-950' : 'bg-stone-900 text-white'
                  }`}>
                    {qtdNoDia}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SEÇÃO PRINCIPAL: LISTA MODERNA DE AGENDAMENTOS PENDENTES DO DIA SELECIONADO */}
      <div 
        className="relative rounded-[2.5rem] p-5 sm:p-8 border border-white/80 overflow-hidden shadow-sm"
        style={{
          background: 'linear-gradient(135deg, #f7f9f8 0%, #edf1f0 50%, #e2e8e6 100%)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08), inset 0 2px 4px rgba(255, 255, 255, 0.9), inset 0 -3px 6px rgba(0, 0, 0, 0.05)'
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-stone-300/60 gap-3">
          <h2 className="text-base sm:text-lg font-extrabold text-stone-900 flex items-center gap-2.5 tracking-tight truncate">
            <span className="w-2.5 h-2.5 bg-[#111111] rounded-full shrink-0 shadow-[0_0_8px_rgba(17,17,17,0.4)]"></span>
            <span className="truncate">Pendentes • {new Date(dataSelecionada + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
            <span className="text-xs font-bold text-stone-700 bg-white px-2.5 py-0.5 rounded-full border border-stone-200 shadow-xs shrink-0">
              {agendamentosPendentesDia.length}
            </span>
          </h2>
          
          <div className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-bold text-stone-700 self-start sm:self-auto bg-white border border-stone-200 shadow-xs">
            {new Date(dataSelecionada + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
          </div>
        </div>

        {carregando ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
          </div>
        ) : agendamentosPendentesDia.length === 0 ? (
          <div className="text-center py-16 text-stone-400 text-sm font-medium">
            Nenhum atendimento pendente para esta data.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {agendamentosPendentesDia.map((item) => (
              <div 
                key={item.id} 
                className="w-full bg-white border border-stone-200/90 rounded-[2rem] p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.07)] transition-all flex flex-col justify-between gap-4"
              >
                
                {/* Topo do Card: Badge de Horário & Valor */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <div 
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black text-white border border-stone-700/50"
                      style={{
                        background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
                        boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.2)'
                      }}
                    >
                      <Clock className="w-3.5 h-3.5 text-stone-300" />
                      <span>{extrairHoraMinuto(item.data_hora)}</span>
                    </div>
                    <h3 className="font-black text-stone-900 text-base sm:text-lg tracking-tight truncate pt-0.5">
                      {item.clientes?.nome || 'Cliente não identificado'}
                    </h3>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Valor</span>
                    <span className="text-stone-900 font-black text-sm sm:text-base bg-stone-100 px-3 py-1 rounded-2xl border border-stone-200/60 inline-block mt-0.5">
                      R$ {Number(item.valor_total || item.servicos?.preco || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Detalhes do Serviço & Profissional */}
                <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200/70 space-y-1 text-xs">
                  <div className="flex items-center gap-2 font-bold text-stone-900 text-sm">
                    <span className="w-2 h-2 rounded-full bg-stone-900"></span>
                    <span>{item.servicos?.nome || 'Serviço não especificado'}</span>
                  </div>
                  <div className="text-stone-500 pl-4 font-medium">
                    Profissional: <span className="text-stone-800 font-bold">{item.barbeiros?.nome || 'Não atribuído'}</span>
                  </div>
                </div>

                {/* Rodapé do Card: Status e Botões de Ação */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-stone-100">
                  <div className="flex items-center justify-between sm:justify-start">
                    <span className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider bg-stone-100 text-stone-700 border border-stone-200">
                      {item.status || 'agendado'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 sm:flex sm:items-center">
                    
                    {/* Botão Concluir */}
                    <button 
                      onClick={() => concluirAgendamento(item.id)}
                      disabled={processandoId === item.id}
                      className="py-2 px-1.5 sm:px-2.5 text-white rounded-xl transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1 text-[10px] sm:text-xs font-bold shadow-sm"
                      style={{
                        background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
                        boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.2)'
                      }}
                      title="Concluir"
                    >
                      <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-emerald-400" />
                      <span className="truncate">Concluir</span>
                    </button>

                    {/* Botão Cancelar */}
                    <button 
                      onClick={() => cancelarAgendamento(item.id)}
                      disabled={processandoId === item.id}
                      className="py-2 px-1.5 sm:px-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 rounded-xl transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1 text-[10px] sm:text-xs font-bold shadow-xs"
                      title="Cancelar"
                    >
                      <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-stone-500" />
                      <span className="truncate">Cancelar</span>
                    </button>

                    {/* Botão Excluir */}
                    <button 
                      onClick={() => excluirAgendamento(item.id)}
                      disabled={processandoId === item.id}
                      className="py-2 px-1.5 sm:px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1 text-[10px] sm:text-xs font-bold shadow-xs"
                      title="Excluir"
                    >
                      <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                      <span className="truncate">Excluir</span>
                    </button>

                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* BOTÃO ESTRATÉGICO PARA ABRIR O HISTÓRICO EM MODAL */}
      <div className="text-center pt-2">
        <button
          onClick={() => setModalHistoricoOpen(true)}
          className="w-full sm:w-auto px-8 py-4 bg-white border border-stone-200/80 shadow-[0_10px_25px_rgba(0,0,0,0.04)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.08)] rounded-2xl text-xs font-bold text-stone-700 hover:bg-stone-50 transition-all flex items-center justify-center gap-3 mx-auto tracking-widest uppercase cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-[#222222] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <History className="w-4 h-4" />
          </div>
          <span>Ver Histórico Completo & Outros Dias</span>
        </button>
      </div>

      {/* =========================================================
          MODAL DE HISTÓRICO E FILTROS AVANÇADOS
          ========================================================= */}
      {modalHistoricoOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          
          <div 
            onClick={() => setModalHistoricoOpen(false)}
            className="fixed inset-0 bg-stone-950/50 backdrop-blur-sm transition-opacity"
          />

          <div className="relative w-full max-w-3xl max-h-[85vh] bg-stone-100 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-white/80 z-10 flex flex-col overflow-hidden">
            
            <div className="flex items-center justify-between pb-5 border-b border-stone-300/60">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#222222] text-white flex items-center justify-center shadow-md">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-stone-900 tracking-tight">Histórico de Agendamentos</h3>
                  <p className="text-xs text-stone-500">Consulte e filtre todos os registros do sistema.</p>
                </div>
              </div>
              <button 
                onClick={() => setModalHistoricoOpen(false)}
                className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer shadow-xs"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4 border-b border-stone-300/40">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Filtrar por Data:</label>
                <div className="relative flex items-center">
                  <input 
                    type="date" 
                    value={filtroDataHistorico || ''} 
                    onChange={(e) => setFiltroDataHistorico(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-2.5 text-xs font-medium text-stone-800 focus:outline-none focus:border-stone-900 shadow-xs"
                  />
                  {filtroDataHistorico && (
                    <button 
                      onClick={() => setFiltroDataHistorico('')} 
                      className="absolute right-3 text-xs text-stone-500 hover:text-stone-900 font-bold"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Filtrar por Status:</label>
                <select 
                  value={filtroStatusHistorico}
                  onChange={(e) => setFiltroStatusHistorico(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-2.5 text-xs font-medium text-stone-800 focus:outline-none focus:border-stone-900 shadow-xs"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="agendado">Agendados</option>
                  <option value="concluido">Concluídos</option>
                  <option value="cancelado">Cancelados</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
              {todosAgendamentos.length === 0 ? (
                <div className="text-center py-16 text-stone-400 text-sm">
                  Nenhum registro encontrado no histórico.
                </div>
              ) : (
                todosAgendamentos
                  .filter(item => !filtroDataHistorico || extrairDataIso(item) === filtroDataHistorico)
                  .filter(item => filtroStatusHistorico === 'todos' || (item.status || 'agendado') === filtroStatusHistorico)
                  .map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white hover:bg-stone-50 rounded-2xl border border-stone-200/80 transition-all gap-4 shadow-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-stone-900 text-sm sm:text-base">
                            {item.clientes?.nome || 'Cliente'}
                          </span>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                            item.status === 'concluido' ? 'bg-[#222222] text-white' :
                            item.status === 'cancelado' ? 'bg-red-100 text-red-800' : 'bg-stone-200 text-stone-800'
                          }`}>
                            {item.status || 'agendado'}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 flex flex-wrap gap-x-3 gap-y-1 items-center">
                          <span className="text-stone-700 font-medium">{item.servicos?.nome || 'Serviço'}</span>
                          <span>•</span>
                          <span>{item.barbeiros?.nome || 'Barbeiro'}</span>
                          <span>•</span>
                          <span className="font-semibold text-stone-700">{formatarDataHora(item.data_hora)}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                        <span className="text-sm sm:text-base font-extrabold text-stone-900">
                          R$ {Number(item.valor_total || item.servicos?.preco || 0).toFixed(2)}
                        </span>
                        <button 
                          onClick={() => excluirAgendamento(item.id)}
                          disabled={processandoId === item.id}
                          className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="pt-4 border-t border-stone-300/60 flex justify-end">
              <button
                onClick={() => setModalHistoricoOpen(false)}
                className="px-6 py-2.5 bg-[#222222] text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer shadow-md"
              >
                Fechar
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}