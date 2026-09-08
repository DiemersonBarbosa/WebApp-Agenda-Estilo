'use client';

import React, { useState, useEffect } from 'react';
import { CalendarCheck, DollarSign, Percent, Clock, ChevronDown, ChevronUp, Check, X, Calendar, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function PainelAgendaDia({ profissionalId, taxaComissao = 50, handleUpdateStatus }) {
  const [agendamentosHoje, setAgendamentosHoje] = useState([]);
  const [todosAgendamentos, setTodosAgendamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroBanco, setErroBanco] = useState(null);
  
  const [mostrarOutrosDias, setMostrarOutrosDias] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('TODOS');

  const carregarAgenda = async () => {
    setCarregando(true);
    setErroBanco(null);

    console.log('🔄 Buscando dados da tabela "agendamentos"...');

    const { data, error } = await supabase
      .from('agendamentos')
      .select('*');

    if (error) {
      console.error('❌ Erro retornado pelo Supabase:', error);
      setErroBanco(error.message);
      setAgendamentosHoje([]);
      setTodosAgendamentos([]);
    } else {
      console.log('✅ Dados brutos recebidos do Supabase:', data);
      
      if (!data || data.length === 0) {
        console.warn('⚠️ A tabela "agendamentos" retornou vazia (0 registros). Verifique se há dados cadastrados.');
        setErroBanco('A tabela "agendamentos" está vazia ou sem registros.');
      }

      const listaGeral = data || [];

      // Ordena a lista geral por data decrescente
      listaGeral.sort((a, b) => {
        const tA = String(a.data || a.data_hora || a.horario || a.created_at || '');
        const tB = String(b.data || b.data_hora || b.horario || b.created_at || '');
        return tB.localeCompare(tA);
      });

      setTodosAgendamentos(listaGeral);

      // Data de hoje fixa para teste (07/09/2026)
      const hojeIso = '2026-09-07';
      const hojeBr = '07/09/2026';

      // Filtra os de HOJE buscando a data em QUALQUER propriedade do objeto
      const doDia = listaGeral.filter(item => {
        return Object.values(item).some(val => {
          const valStr = String(val || '');
          return valStr.includes(hojeIso) || valStr.includes(hojeBr);
        });
      });

      console.log('🎯 Agendamentos encontrados para hoje:', doDia);

      // Ordena os de hoje por horário crescente
      doDia.sort((a, b) => {
        const tA = String(a.data || a.data_hora || a.horario || '');
        const tB = String(b.data || b.data_hora || b.horario || '');
        return tA.localeCompare(tB);
      });

      setAgendamentosHoje(doDia);
    }

    setCarregando(false);
  };

  useEffect(() => {
    carregarAgenda();
  }, [profissionalId]);

  const totalAtendimentos = agendamentosHoje.length;
  const concluidos = agendamentosHoje.filter(a => {
    const s = (a.status || '').toLowerCase();
    return s === 'concluido' || s === 'concluído';
  }).length;
  
  const faturamentoPrevisto = agendamentosHoje.reduce((acc, item) => {
    const val = item.valor_total || item.valor || item.preco || 0;
    return acc + Number(val);
  }, 0);
  
  const comissaoEstimada = faturamentoPrevisto * ((taxaComissao || 0) / 100);

  const formatarDataHora = (item) => {
    const dataStr = item.data_hora || item.horario || item.data || '';
    if (String(dataStr).includes('T')) {
      const [dataPart, horaPart] = dataStr.split('T');
      const [ano, mes, dia] = dataPart.split('-');
      const hora = horaPart ? horaPart.substring(0, 5) : '';
      return hora ? `${dia}/${mes}/${ano} às ${hora}` : `${dia}/${mes}/${ano}`;
    }
    if (String(dataStr).includes('-') && String(dataStr).includes(':')) {
      const [dataPart, horaPart] = dataStr.split(' ');
      const [ano, mes, dia] = dataPart.split('-');
      const hora = horaPart ? horaPart.substring(0, 5) : '';
      return hora ? `${dia}/${mes}/${ano} às ${hora}` : `${dia}/${mes}/${ano}`;
    }
    return dataStr || '-';
  };

  const agendamentosOutrosDias = todosAgendamentos.filter(item => {
    const hojeIso = '2026-09-07';
    const hojeBr = '07/09/2026';
    const ehHoje = Object.values(item).some(val => {
      const valStr = String(val || '');
      return valStr.includes(hojeIso) || valStr.includes(hojeBr);
    });
    return !ehHoje;
  }).filter(item => {
    if (filtroStatus === 'TODOS') return true;
    const statusItem = (item.status || 'PENDENTE').toUpperCase();
    if (filtroStatus === 'CONCLUIDO') return statusItem === 'CONCLUIDO' || statusItem === 'CONCLUÍDO';
    if (filtroStatus === 'PENDENTE') return statusItem === 'PENDENTE' || statusItem === 'AGENDADO';
    if (filtroStatus === 'CANCELADO') return statusItem === 'CANCELADO';
    return true;
  });

  const executarAcaoStatus = async (id, novoStatus) => {
    if (handleUpdateStatus) {
      await handleUpdateStatus(id, novoStatus);
      carregarAgenda(); 
    }
  };

  return (
    <div className="space-y-6">
      {/* AVISO DE DIAGNÓSTICO SE HOUVER ERRO OU TABELA VAZIA */}
      {erroBanco && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-xs space-y-1">
          <p className="font-bold">⚠️ Diagnóstico do Supabase:</p>
          <p>{erroBanco}</p>
          <p className="text-[10px] text-amber-600">Dica: Abra o console do navegador (F12) para ver os detalhes completos retornados pelo banco.</p>
        </div>
      )}

      {/* GRID DE CARDS DE MÉTRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Atendimentos Hoje</p>
            <h3 className="text-2xl font-bold text-stone-900 mt-1">
              {concluidos} <span className="text-sm font-normal text-stone-400">/ {totalAtendimentos}</span>
            </h3>
            <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full mt-2 inline-block">
              {totalAtendimentos > 0 ? `${Math.round((concluidos / totalAtendimentos) * 100)}% concluído` : 'Sem agendamentos'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Faturamento Previsto</p>
            <h3 className="text-2xl font-bold text-stone-900 mt-1">
              R$ {faturamentoPrevisto.toFixed(2).replace('.', ',')}
            </h3>
            <span className="text-[11px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full mt-2 inline-block">
              Bruto estimado
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Comissão Estimada</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">
              R$ {comissaoEstimada.toFixed(2).replace('.', ',')}
            </h3>
            <span className="text-[11px] text-stone-600 font-bold bg-stone-100 px-2 py-0.5 rounded-full mt-2 inline-block">
              Taxa de {taxaComissao}%
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Percent className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Status da Agenda</p>
            <h3 className="text-lg font-bold text-stone-900 mt-1">
              {carregando ? 'Carregando...' : (totalAtendimentos > 0 ? 'Agenda Ativa' : 'Livre')}
            </h3>
            <span className="text-[11px] text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-full mt-2 inline-block">
              Tempo real
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* LISTAGEM PRINCIPAL DE HOJE */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-stone-800 text-sm uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" /> Atendimentos de Hoje (07/09/2026)
          </h4>
          <span className="text-xs font-semibold bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full">
            {agendamentosHoje.length} hoje
          </span>
        </div>

        {agendamentosHoje.length === 0 ? (
          <p className="text-sm text-stone-400 py-6 text-center">Nenhum atendimento agendado para hoje (07/09/2026). Total geral na tabela: {todosAgendamentos.length}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {agendamentosHoje.map((item) => {
              const statusItem = (item.status || 'AGENDADO').toUpperCase();
              const isConcluido = statusItem === 'CONCLUIDO' || statusItem === 'CONCLUÍDO';
              
              const nomeCliente = item.cliente_nome || item.nome_cliente || item.cliente || item.nome || 'Cliente';
              const nomeServico = item.servico_nome || item.nome_servico || item.servico || 'Serviço';
              const valorItem = Number(item.valor_total || item.valor || item.preco || 0);

              return (
                <div key={item.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-200/60 flex flex-col justify-between gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Cliente</span>
                      <h4 className="text-xs font-bold text-stone-900">{nomeCliente}</h4>
                      <p className="text-xs text-stone-500 font-medium">
                        {nomeServico} • <span className="text-stone-700">{formatarDataHora(item)}</span>
                      </p>
                    </div>
                    <div className="text-right space-y-2">
                      <span className="font-semibold text-emerald-600 text-xs block">
                        R$ {valorItem.toFixed(2)}
                      </span>
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md uppercase inline-block ${
                        isConcluido ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {statusItem}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-200/60 text-xs text-stone-500">
                    <span>Profissional: <strong className="text-stone-700">{item.barbeiro || item.profissional_nome || 'Patrícia'}</strong></span>
                    
                    <div className="flex items-center gap-2">
                      {handleUpdateStatus && (
                        <>
                          <button
                            onClick={() => executarAcaoStatus(item.id, 'concluido')}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-xl flex items-center gap-1 transition-colors border border-emerald-200 text-xs cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> Concluir
                          </button>
                          <button
                            onClick={() => executarAcaoStatus(item.id, 'cancelado')}
                            className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl flex items-center gap-1 transition-colors border border-rose-200 text-xs cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" /> Cancelar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* BOTÃO EXPANSÍVEL PARA HISTÓRICO / OUTROS DIAS */}
      <div className="pt-2">
        <button
          onClick={() => setMostrarOutrosDias(!mostrarOutrosDias)}
          className="w-full py-3.5 px-4 bg-white hover:bg-stone-50 border border-stone-200/80 rounded-2xl text-stone-700 font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <span>{mostrarOutrosDias ? 'Ocultar Histórico / Outros Dias' : `Ver Todos os Registros do Banco (${todosAgendamentos.length})`}</span>
          {mostrarOutrosDias ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* BLOCO RECOLHÍVEL COM O RESTANTE DOS DIAS */}
      {mostrarOutrosDias && (
        <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
            <div>
              <h4 className="font-bold text-stone-900 text-base">Outros Dias e Histórico</h4>
              <p className="text-xs text-stone-400">Total geral de registros carregados: {todosAgendamentos.length}</p>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <span className="text-xs text-stone-400 flex items-center gap-1 mr-1">
                <Filter className="w-3 h-3" /> Filtro:
              </span>
              {['TODOS', 'PENDENTE', 'CONCLUIDO', 'CANCELADO'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFiltroStatus(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    filtroStatus === status
                      ? 'bg-stone-900 text-white shadow-sm'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {status === 'TODOS' ? 'Todos' : status.charAt(0) + status.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {agendamentosOutrosDias.length === 0 ? (
            <p className="text-sm text-stone-400 py-8 text-center">Nenhum outro agendamento encontrado.</p>
          ) : (
            <div className="space-y-3">
              {agendamentosOutrosDias.map((item) => {
                const statusItem = (item.status || 'AGENDADO').toUpperCase();
                const isConcluido = statusItem === 'CONCLUIDO' || statusItem === 'CONCLUÍDO';
                
                const nomeCliente = item.cliente_nome || item.nome_cliente || item.cliente || item.nome || 'Cliente';
                const nomeServico = item.servico_nome || item.nome_servico || item.servico || 'Serviço';
                const valorItem = Number(item.valor_total || item.valor || item.preco || 0);

                return (
                  <div key={item.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-200/60 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Cliente</span>
                        <h4 className="text-xs font-bold text-stone-900">{nomeCliente}</h4>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {nomeServico} • <span className="font-medium text-stone-700">{formatarDataHora(item)}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-emerald-600 text-xs block">
                          R$ {valorItem.toFixed(2)}
                        </span>
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md uppercase inline-block mt-1 ${
                          isConcluido ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {statusItem}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-200/60 text-xs text-stone-500">
                      <span>Profissional: <strong className="text-stone-700">{item.barbeiro || item.profissional_nome || 'Patrícia'}</strong></span>
                      
                      <div className="flex items-center gap-2">
                        {handleUpdateStatus && (
                          <>
                            <button
                              onClick={() => executarAcaoStatus(item.id, 'concluido')}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-xl flex items-center gap-1 transition-colors border border-emerald-200 text-xs cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" /> Concluir
                            </button>
                            <button
                              onClick={() => executarAcaoStatus(item.id, 'cancelado')}
                              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl flex items-center gap-1 transition-colors border border-rose-200 text-xs cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" /> Cancelar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
