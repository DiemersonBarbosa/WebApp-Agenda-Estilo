'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function PainelAgendaDia({ profissionalId, barbeariaId, taxaComissao = 50 }) {
  const [agendamentosHoje, setAgendamentosHoje] = useState([]);
  const [todosAgendamentos, setTodosAgendamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroFatal, setErroFatal] = useState(null);
  const [processandoId, setProcessandoId] = useState(null);
  const [mostrarOutrosDias, setMostrarOutrosDias] = useState(false);

  const [filtroDataHistorico, setFiltroDataHistorico] = useState('');

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* ERRO FATAL */}
      {erroFatal && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-2xl shadow-sm">
          <div className="text-red-700 text-sm font-medium">Erro ao carregar agenda: {erroFatal}</div>
        </div>
      )}

      {/* CARDS DE RESUMO DO TOPO */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        
        <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col justify-between">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400">Agendamentos</span>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-lg sm:text-2xl font-bold text-gray-900">{totalAtendimentosHoje}</h3>
            <div className="p-2 sm:p-3 bg-gray-50 text-gray-700 rounded-2xl border border-gray-100">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col justify-between">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400">Concluídos</span>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-lg sm:text-2xl font-bold text-gray-900">{concluidosHoje}/{totalAtendimentosHoje}</h3>
            <div className="p-2 sm:p-3 bg-gray-50 text-gray-700 rounded-2xl border border-gray-100">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col justify-between">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400">Projeção</span>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-xs sm:text-2xl font-bold text-gray-900 truncate">R$ {valorTotalHoje.toFixed(0)}</h3>
            <div className="p-2 sm:p-3 bg-gray-50 text-gray-700 rounded-2xl border border-gray-100">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

      </div>

      {/* SEÇÃO PRINCIPAL: LINHA DO TEMPO DOS ATENDIMENTOS DE HOJE */}
      <div className="bg-white shadow-[0_10px_30px_rgba(0,0,0,0.04)] rounded-[2.5rem] p-5 sm:p-8 border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-gray-100 gap-3">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-3">
            <span className="w-3 h-3 bg-gray-900 rounded-full"></span>
            Linha do Tempo • Atendimentos de Hoje
            <span className="text-xs sm:text-sm font-medium text-gray-500 bg-gray-100 px-3 py-0.5 rounded-full">
              {agendamentosHoje.length}
            </span>
          </h2>
          <span className="text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 px-3.5 py-1.5 rounded-2xl self-start sm:self-auto">
            {new Date().toLocaleDateString('pt-BR')}
          </span>
        </div>

        {carregando ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : agendamentosHoje.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm font-medium">
            Nenhum atendimento agendado para hoje.
          </div>
        ) : (
          <div className="relative mt-8 pl-1 sm:pl-2 space-y-6 before:absolute before:left-[35px] sm:before:left-[39px] before:top-4 before:bottom-4 before:w-0.5 before:bg-gray-100">
            {agendamentosHoje.map((item) => (
              <div key={item.id} className="relative flex items-center gap-3 sm:gap-5 group">
                
                {/* Marcador de Hora na Linha do Tempo */}
                <div className="relative z-10 flex-shrink-0">
                  <div className="w-[64px] h-[32px] sm:w-[70px] sm:h-[34px] rounded-xl bg-gray-900 text-white flex items-center justify-center font-bold text-[11px] sm:text-xs shadow-md border-2 border-white tracking-wider">
                    {extrairHoraMinuto(item.data_hora)}
                  </div>
                </div>

                {/* Cartão do Atendimento */}
                <div className="flex-1 bg-white border border-gray-200/80 rounded-3xl p-5 shadow-[0_4px_15px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-3">
                      <h3 className="font-bold text-gray-900 text-base truncate">
                        {item.clientes?.nome || 'Cliente não identificado'}
                      </h3>
                      <span className="text-gray-900 font-bold text-sm bg-gray-100 px-3 py-1 rounded-2xl border border-gray-200/60">
                        R$ {Number(item.valor_total || item.servicos?.preco || 0).toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="mt-3 space-y-2 text-xs text-gray-600">
                      <p className="flex items-center gap-2.5 font-medium text-gray-800">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7.846 15.356l15.154-11.236m-15.154 11.236c-1.419 1.05-3.846.541-3.846-1.356 0-1.897 2.427-2.406 3.846-1.356zm0 0l7.154 5.304m-7.154-5.304c-1.419-1.05-3.846-.541-3.846 1.356 0 1.897 2.427 2.406 3.846 1.356zm0 0L15 21m-7.154-5.644L15 9" />
                        </svg>
                        {item.servicos?.nome || 'Serviço não especificado'}
                      </p>
                      <p className="flex items-center gap-2.5 text-gray-500">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                        Profissional: <span className="text-gray-800 font-medium">{item.barbeiros?.nome || 'Não atribuído'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                      item.status === 'concluido' ? 'bg-blue-900 text-white' :
                      item.status === 'cancelado' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {item.status || 'agendado'}
                    </span>

                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => concluirAgendamento(item.id)}
                        disabled={processandoId === item.id}
                        className="p-2 text-blue-900 hover:bg-blue-50 rounded-2xl transition-colors disabled:opacity-50"
                        title="Concluir Atendimento"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => cancelarAgendamento(item.id)}
                        disabled={processandoId === item.id}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-2xl transition-colors disabled:opacity-50"
                        title="Cancelar Atendimento"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => excluirAgendamento(item.id)}
                        disabled={processandoId === item.id}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-2xl transition-colors disabled:opacity-50"
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

      {/* BOTÃO PARA MOSTRAR / OCULTAR HISTÓRICO */}
      <div className="text-center pt-2">
        <button
          onClick={() => setMostrarOutrosDias(!mostrarOutrosDias)}
          className="w-full sm:w-auto px-8 py-3.5 bg-white border border-gray-200/80 shadow-[0_4px_15px_rgba(0,0,0,0.03)] rounded-2xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2.5 mx-auto tracking-widest uppercase"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {mostrarOutrosDias ? 'Ocultar Histórico / Outros Dias' : 'Ver Histórico / Outros Dias'}
        </button>
      </div>

      {/* SEÇÃO: HISTÓRICO / OUTROS DIAS */}
      {mostrarOutrosDias && (
        <div className="bg-white shadow-[0_10px_30px_rgba(0,0,0,0.04)] rounded-[2.5rem] p-5 sm:p-8 border border-gray-100 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-gray-100 gap-4">
            <h2 className="text-lg font-bold text-gray-900">
              Histórico e Outros Registros
            </h2>
            
            {/* Filtro de Data */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Filtrar Data:</label>
              <input 
                type="date" 
                value={filtroDataHistorico || ''} 
                onChange={(e) => setFiltroDataHistorico(e.target.value)}
                className="border border-gray-200 rounded-2xl px-3.5 py-2 text-xs focus:outline-none focus:border-gray-900 bg-gray-50 text-gray-800"
              />
              {filtroDataHistorico && (
                <button 
                  onClick={() => setFiltroDataHistorico('')} 
                  className="text-xs text-gray-900 font-semibold hover:underline px-1"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {todosAgendamentos.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                Nenhum registro encontrado no histórico.
              </div>
            ) : (
              todosAgendamentos
                .filter(item => !filtroDataHistorico || extrairDataIso(item) === filtroDataHistorico)
                .map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 hover:bg-gray-100/70 rounded-2xl border border-gray-100 transition-all gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900 text-base">
                          {item.clientes?.nome || 'Cliente'}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                          item.status === 'concluido' ? 'bg-blue-900 text-white' :
                          item.status === 'cancelado' ? 'bg-red-100 text-red-800' : 'bg-gray-200 text-gray-800'
                        }`}>
                          {item.status || 'agendado'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-1 items-center">
                        <span className="flex items-center gap-1 text-gray-700 font-medium">
                          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7.846 15.356l15.154-11.236m-15.154 11.236c-1.419 1.05-3.846.541-3.846-1.356 0-1.897 2.427-2.406 3.846-1.356zm0 0l7.154 5.304m-7.154-5.304c-1.419-1.05-3.846-.541-3.846 1.356 0 1.897 2.427 2.406 3.846 1.356zm0 0L15 21m-7.154-5.644L15 9" />
                          </svg>
                          {item.servicos?.nome || 'Serviço'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                          </svg>
                          {item.barbeiros?.nome || 'Barbeiro'}
                        </span>
                        <span>•</span>
                        <span className="text-gray-700 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatarDataHora(item.data_hora)}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-200/60">
                      <span className="text-base font-bold text-gray-900">
                        R$ {Number(item.valor_total || item.servicos?.preco || 0).toFixed(2)}
                      </span>
                      <button 
                        onClick={() => excluirAgendamento(item.id)}
                        disabled={processandoId === item.id}
                        className="px-3.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-2xl transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                        Excluir
                      </button>
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