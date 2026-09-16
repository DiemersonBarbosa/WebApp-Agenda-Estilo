'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Calendar, CheckCircle2, DollarSign, TrendingUp, TrendingDown, 
  Users, Settings, Percent, Scissors, ClipboardPenLine, ShoppingCart, 
  ShoppingBag, MessageCircleCheck, LogOut, History, X, Search, Filter 
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function PainelAgendaDia({ profissionalId, barbeariaId, taxaComissao = 50, setActiveTab, setModalInfoAssinaturaOpen, handleLogout, mobileMenuOpen, setMobileMenuOpen, fecharMenuMobile }) {
  const [agendamentosHoje, setAgendamentosHoje] = useState([]);
  const [todosAgendamentos, setTodosAgendamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroFatal, setErroFatal] = useState(null);
  const [processandoId, setProcessandoId] = useState(null);
  
  // Estado para controlar o Modal de Histórico Completo
  const [modalHistoricoOpen, setModalHistoricoOpen] = useState(false);
  const [filtroDataHistorico, setFiltroDataHistorico] = useState('');
  const [filtroStatusHistorico, setFiltroStatusHistorico] = useState('todos');

  const HOJE_ISO = new Date().toISOString().split('T')[0];

  const extrairDataIso = (item) => {
    const dataStr = item.data_hora || item.data || item.created_at || '';
    if (!dataStr) return '';
    return String(dataStr).substring(0, 10);
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
        const doDia = data.filter(item => extrairDataIso(item) === HOJE_ISO);
        setAgendamentosHoje(doDia);
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

  const totalAtendimentosHoje = agendamentosHoje.length;
  const concluidosHoje = agendamentosHoje.filter(i => i.status === 'concluido').length;
  const valorTotalHoje = agendamentosHoje
    .filter(i => i.status !== 'cancelado')
    .reduce((acc, item) => acc + Number(item.valor_total || item.servicos?.preco || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24">
      
      {/* ERRO FATAL */}
      {erroFatal && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-2xl shadow-sm">
          <div className="text-red-700 text-sm font-medium">Erro ao carregar agenda: {erroFatal}</div>
        </div>
      )}

      {/* CARDS DE RESUMO DO TOPO (Estilo Black Piano Degradê & 3D) */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-3 md:gap-4 mb-6">
        
        {/* 1. Card: Agendamentos */}
        <div 
          className="relative rounded-2xl md:rounded-[2rem] px-2.5 py-2.5 sm:p-4 md:p-5 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.45), inset 0 1.5px 2px rgba(255, 255, 255, 0.25), inset 0 -2px 4px rgba(0, 0, 0, 0.8)'
          }}
        >
          <div className="flex flex-col justify-center min-w-0 pr-1">
            <span className="text-[7.5px] sm:text-[9px] md:text-[10px] font-bold text-stone-400 uppercase tracking-wider truncate block">Agendamentos</span>
            <h3 className="text-sm sm:text-xl md:text-2xl font-black text-white mt-0.5 truncate">{totalAtendimentosHoje}</h3>
          </div>
          <div 
            className="w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1.5px 2px rgba(255, 255, 255, 1), inset 0 -3px 4px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.9)'
            }}
          >
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
          </div>
        </div>

        {/* 2. Card: Concluídos */}
        <div 
          className="relative rounded-2xl md:rounded-[2rem] px-2.5 py-2.5 sm:p-4 md:p-5 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.45), inset 0 1.5px 2px rgba(255, 255, 255, 0.25), inset 0 -2px 4px rgba(0, 0, 0, 0.8)'
          }}
        >
          <div className="flex flex-col justify-center min-w-0 pr-1">
            <span className="text-[7.5px] sm:text-[9px] md:text-[10px] font-bold text-stone-400 uppercase tracking-wider truncate block">Concluídos</span>
            <h3 className="text-sm sm:text-xl md:text-2xl font-black text-white mt-0.5 truncate">{concluidosHoje}/{totalAtendimentosHoje}</h3>
          </div>
          <div 
            className="w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1.5px 2px rgba(255, 255, 255, 1), inset 0 -3px 4px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.9)'
            }}
          >
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
          </div>
        </div>

        {/* 3. Card: Projeção */}
        <div 
          className="relative rounded-2xl md:rounded-[2rem] px-2.5 py-2.5 sm:p-4 md:p-5 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.45), inset 0 1.5px 2px rgba(255, 255, 255, 0.25), inset 0 -2px 4px rgba(0, 0, 0, 0.8)'
          }}
        >
          <div className="flex flex-col justify-center min-w-0 pr-1">
            <span className="text-[7.5px] sm:text-[9px] md:text-[10px] font-bold text-stone-400 uppercase tracking-wider truncate block">Projeção</span>
            <h3 className="text-sm sm:text-xl md:text-2xl font-black text-white mt-0.5 truncate">R$ {valorTotalHoje.toFixed(0)}</h3>
          </div>
          <div 
            className="w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1.5px 2px rgba(255, 255, 255, 1), inset 0 -3px 4px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.9)'
            }}
          >
            <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
          </div>
        </div>

      </div>

      {/* SEÇÃO PRINCIPAL: LINHA DO TEMPO DOS ATENDIMENTOS DE HOJE */}
      <div 
        className="relative rounded-[2.5rem] p-5 sm:p-8 border border-white/80"
        style={{
          background: 'linear-gradient(135deg, #f7f9f8 0%, #edf1f0 50%, #e2e8e6 100%)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08), inset 0 2px 4px rgba(255, 255, 255, 0.9), inset 0 -3px 6px rgba(0, 0, 0, 0.05)'
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-stone-300/60 gap-3">
          <h2 className="text-lg sm:text-xl font-extrabold text-stone-900 flex items-center gap-3 tracking-tight">
            <span className="w-3 h-3 bg-[#102a43] rounded-full shadow-[0_0_8px_rgba(16,42,67,0.4)]"></span>
            Linha do Tempo • Atendimentos de Hoje
            <span className="text-xs sm:text-sm font-bold text-stone-600 bg-white/80 px-3 py-0.5 rounded-full border border-stone-200">
              {agendamentosHoje.length}
            </span>
          </h2>
          
          <div 
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-stone-700 self-start sm:self-auto"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #eceeee 70%, #d8dedb 100%)',
              boxShadow: '0 6px 15px rgba(0, 0, 0, 0.1), inset 0 2px 2px rgba(255, 255, 255, 1), inset 0 -3px 4px rgba(0, 0, 0, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.9)'
            }}
          >
            {new Date().toLocaleDateString('pt-BR')}
          </div>
        </div>

        {carregando ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
          </div>
        ) : agendamentosHoje.length === 0 ? (
          <div className="text-center py-16 text-stone-400 text-sm font-medium">
            Nenhum atendimento agendado para hoje.
          </div>
        ) : (
          <div className="relative mt-8 pl-1 sm:pl-2 space-y-6 before:absolute before:left-[35px] sm:before:left-[39px] before:top-4 before:bottom-4 before:w-0.5 before:bg-stone-300/60">
            {agendamentosHoje.map((item) => (
              <div key={item.id} className="relative flex items-center gap-3 sm:gap-5 group">
                
                {/* Marcador de Hora 3D na Linha do Tempo */}
                <div className="relative z-10 flex-shrink-0">
                  <div 
                    className="w-[64px] h-[32px] sm:w-[70px] sm:h-[34px] rounded-xl text-white flex items-center justify-center font-bold text-[11px] sm:text-xs tracking-wider border border-white/20"
                    style={{
                      background: 'linear-gradient(135deg, #102a43 0%, #0b1d2d 100%)',
                      boxShadow: '0 6px 15px rgba(11, 29, 45, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.3), inset 0 -2px 3px rgba(0, 0, 0, 0.4)'
                    }}
                  >
                    {extrairHoraMinuto(item.data_hora)}
                  </div>
                </div>

                {/* Cartão do Atendimento com Estilo 3D */}
                <div className="flex-1 bg-white/90 border border-stone-200/80 rounded-3xl p-5 shadow-[0_4px_15px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-3">
                      <h3 className="font-bold text-stone-900 text-base truncate">
                        {item.clientes?.nome || 'Cliente não identificado'}
                      </h3>
                      <span className="text-stone-900 font-bold text-sm bg-stone-100 px-3 py-1 rounded-2xl border border-stone-200/60">
                        R$ {Number(item.valor_total || item.servicos?.preco || 0).toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="mt-3 space-y-2 text-xs text-stone-600">
                      <p className="flex items-center gap-2.5 font-medium text-stone-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
                        {item.servicos?.nome || 'Serviço não especificado'}
                      </p>
                      <p className="flex items-center gap-2.5 text-stone-500">
                        Profissional: <span className="text-stone-800 font-medium">{item.barbeiros?.nome || 'Não atribuído'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                      item.status === 'concluido' ? 'bg-[#102a43] text-white' :
                      item.status === 'cancelado' ? 'bg-red-100 text-red-800' : 'bg-stone-200 text-stone-700'
                    }`}>
                      {item.status || 'agendado'}
                    </span>

                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => concluirAgendamento(item.id)}
                        disabled={processandoId === item.id}
                        className="p-2 text-[#102a43] hover:bg-sky-50 rounded-2xl transition-colors disabled:opacity-50 cursor-pointer"
                        title="Concluir Atendimento"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => cancelarAgendamento(item.id)}
                        disabled={processandoId === item.id}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-2xl transition-colors disabled:opacity-50 cursor-pointer"
                        title="Cancelar Atendimento"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => excluirAgendamento(item.id)}
                        disabled={processandoId === item.id}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-2xl transition-colors disabled:opacity-50 cursor-pointer"
                        title="Excluir Registro"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
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
          <div className="w-8 h-8 rounded-xl bg-[#102a43] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
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
          
          {/* Backdrop Escuro com Blur */}
          <div 
            onClick={() => setModalHistoricoOpen(false)}
            className="fixed inset-0 bg-stone-950/50 backdrop-blur-sm transition-opacity"
          />

          {/* Janela do Modal */}
          <div className="relative w-full max-w-3xl max-h-[85vh] bg-stone-100 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-white/80 z-10 flex flex-col overflow-hidden">
            
            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between pb-5 border-b border-stone-300/60">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#102a43] text-white flex items-center justify-center shadow-md">
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

            {/* Barra de Filtros (Data + Status) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4 border-b border-stone-300/40">
              
              {/* Filtro por Data */}
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

              {/* Filtro por Status */}
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

            {/* Lista de Registros no Modal (Com Scroll) */}
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
                            item.status === 'concluido' ? 'bg-[#102a43] text-white' :
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

            {/* Rodapé do Modal */}
            <div className="pt-4 border-t border-stone-300/60 flex justify-end">
              <button
                onClick={() => setModalHistoricoOpen(false)}
                className="px-6 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer shadow-md"
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