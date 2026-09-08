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
        .order('data_hora', { ascending: false });

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      
      {/* ERRO FATAL */}
      {erroFatal && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm">
          <div className="flex">
            <div className="text-red-700 text-sm font-medium">Erro ao carregar agenda: {erroFatal}</div>
          </div>
        </div>
      )}

      {/* CARDS DE RESUMO E PROJEÇÃO DE HOJE */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Agendamentos Hoje</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalAtendimentosHoje}</h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Concluídos</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{concluidosHoje} / {totalAtendimentosHoje}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Projeção / Faturamento Hoje</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">R$ {valorTotalHoje.toFixed(2)}</h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* SEÇÃO: ATENDIMENTOS DE HOJE */}
      <div className="bg-white shadow-lg rounded-2xl p-5 sm:p-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-100 gap-2">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="w-3 h-3 bg-indigo-600 rounded-full animate-pulse"></span>
            Atendimentos de Hoje
            <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
              {agendamentosHoje.length}
            </span>
          </h2>
          <span className="text-sm font-medium text-gray-500 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg self-start sm:self-auto">
            {new Date().toLocaleDateString('pt-BR')}
          </span>
        </div>

        {carregando ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : agendamentosHoje.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            Nenhum atendimento agendado para hoje.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {agendamentosHoje.map((item) => (
              <div key={item.id} className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-semibold text-gray-900 text-base truncate">
                      {item.clientes?.nome || 'Cliente não identificado'}
                    </h3>
                    <span className="text-emerald-600 font-bold text-base bg-emerald-50 px-2.5 py-1 rounded-lg">
                      R$ {Number(item.valor_total || item.servicos?.preco || 0).toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="mt-3 space-y-2 text-sm text-gray-600">
                    <p className="flex items-center gap-2 font-medium text-gray-700">
                      <svg className="w-4 h-4 text-indigo-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.121 14.121L19 19m-7-7l-7-7m7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.242-4.242 3 3 0 004.242 4.242z" />
                      </svg>
                      {item.servicos?.nome || 'Serviço não especificado'}
                    </p>
                    <p className="flex items-center gap-2 text-gray-500">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profissional: <span className="text-gray-800 font-medium">{item.barbeiros?.nome || 'Não atribuído'}</span>
                    </p>
                    <p className="flex items-center gap-2 text-gray-500">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Horário: <span className="text-gray-800 font-medium">{formatarDataHora(item.data_hora)}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    item.status === 'concluido' ? 'bg-emerald-100 text-emerald-800' :
                    item.status === 'cancelado' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.status || 'agendado'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => concluirAgendamento(item.id)}
                      disabled={processandoId === item.id}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Concluir Atendimento"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => cancelarAgendamento(item.id)}
                      disabled={processandoId === item.id}
                      className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Cancelar Atendimento"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => excluirAgendamento(item.id)}
                      disabled={processandoId === item.id}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Excluir Registro"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BOTÃO PARA MOSTRAR / OCULTAR HISTÓRICO */}
      <div className="text-center">
        <button
          onClick={() => setMostrarOutrosDias(!mostrarOutrosDias)}
          className="w-full sm:w-auto px-6 py-3 bg-white border border-gray-200 shadow-sm rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 mx-auto"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {mostrarOutrosDias ? 'Ocultar Histórico / Outros Dias' : 'Ver Histórico / Outros Dias'}
        </button>
      </div>

      {/* SEÇÃO: HISTÓRICO / OUTROS DIAS */}
      {mostrarOutrosDias && (
        <div className="bg-white shadow-lg rounded-2xl p-5 sm:p-6 border border-gray-100 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-100 gap-4">
            <h2 className="text-lg font-bold text-gray-800">
              Histórico e Outros Registros
            </h2>
            
            {/* Filtro de Data */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Filtrar Data:</label>
              <input 
                type="date" 
                value={filtroDataHistorico || ''} 
                onChange={(e) => setFiltroDataHistorico(e.target.value)}
                className="border border-gray-300 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
              />
              {filtroDataHistorico && (
                <button 
                  onClick={() => setFiltroDataHistorico('')} 
                  className="text-xs text-indigo-600 font-semibold hover:underline px-1"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {todosAgendamentos.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                Nenhum registro encontrado no histórico.
              </div>
            ) : (
              todosAgendamentos
                .filter(item => !filtroDataHistorico || extrairDataIso(item) === filtroDataHistorico)
                .map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 hover:bg-gray-100/80 rounded-xl border border-gray-200/60 transition-all gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-900 text-base">
                          {item.clientes?.nome || 'Cliente'}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          item.status === 'concluido' ? 'bg-emerald-100 text-emerald-800' :
                          item.status === 'cancelado' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.status || 'agendado'}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 flex flex-wrap gap-x-3 gap-y-1 items-center">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.121 14.121L19 19m-7-7l-7-7m7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.242-4.242 3 3 0 004.242 4.242z" />
                          </svg>
                          {item.servicos?.nome || 'Serviço'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {item.barbeiros?.nome || 'Barbeiro'}
                        </span>
                        <span>•</span>
                        <span className="font-medium text-gray-700 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatarDataHora(item.data_hora)}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200">
                      <span className="text-base font-bold text-gray-900">
                        R$ {Number(item.valor_total || item.servicos?.preco || 0).toFixed(2)}
                      </span>
                      <button 
                        onClick={() => excluirAgendamento(item.id)}
                        disabled={processandoId === item.id}
                        className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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