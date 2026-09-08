'use client';

import React, { useState, useEffect } from 'react';
import { CalendarCheck, DollarSign, Percent, Clock, ChevronDown, ChevronUp, Check, X, Calendar, Filter, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function PainelAgendaDia({ profissionalId, taxaComissao = 50, handleUpdateStatus }) {
  const [agendamentosHoje, setAgendamentosHoje] = useState([]);
  const [todosAgendamentos, setTodosAgendamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [debugDadosBrutos, setDebugDadosBrutos] = useState([]);
  
  const [mostrarOutrosDias, setMostrarOutrosDias] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('TODOS');

  const HOJE_ISO = '2026-09-07';

  // Função inteligente que procura a data em qualquer propriedade do objeto
  const extrairDataIso = (item) => {
    if (!item) return '';
    // Varre todas as chaves do objeto para achar qualquer coisa que pareça data
    const valores = Object.values(item);
    for (const val of valores) {
      if (val && typeof val === 'string') {
        const str = val.trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
          return str.substring(0, 10);
        }
        if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) {
          const [dia, mes, ano] = str.split('T')[0].split(' ')[0].split('/');
          return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
        }
      }
    }
    return '';
  };

  const carregarAgenda = async () => {
    setCarregando(true);

    const { data, error } = await supabase
      .from('agendamentos')
      .select('*');

    if (error) {
      console.error('Erro ao buscar agendamentos:', error);
      setAgendamentosHoje([]);
      setTodosAgendamentos([]);
      setDebugDadosBrutos([]);
    } else if (data) {
      setDebugDadosBrutos(data); // Guarda para inspecionar caso precise

      // Se quiser ignorar o filtro de profissional temporariamente para testes, comente o filtro abaixo. 
      // Aqui vamos filtrar por profissional apenas se o campo existir no registro:
      const filtradosPorProfissional = data.filter(item => {
        if (!profissionalId) return true;
        const profStr = String(profissionalId).toLowerCase();
        return (
          String(item.barbeiro_id || '').toLowerCase() === profStr || 
          String(item.profissional_id || '').toLowerCase() === profStr ||
          String(item.barbeiro || '').toLowerCase().includes(profStr) ||
          String(item.profissional_nome || '').toLowerCase().includes(profStr)
        );
      });

      const listaGeral = filtradosPorProfissional.length > 0 ? filtradosPorProfissional : data;

      setTodosAgendamentos(listaGeral);

      // Filtra os de HOJE comparando com o formato ISO extraído de qualquer coluna
      const doDia = listaGeral.filter(item => {
        const dataExtraida = extrairDataIso(item);
        return dataExtraida === HOJE_ISO;
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
    const s = String(a.status || '').toLowerCase();
    return s.includes('concluido') || s.includes('concluído');
  }).length;
  
  const faturamentoPrevisto = agendamentosHoje.reduce((acc, item) => {
    const val = item.valor_total || item.valor || item.preco || item.price || 0;
    return acc + Number(val);
  }, 0);
  
  const comissaoEstimada = faturamentoPrevisto * ((taxaComissao || 0) / 100);

  const formatarDataHora = (item) => {
    const dataStr = item.data_hora || item.horario || item.data || item.created_at || '';
    return String(dataStr);
  };

  const agendamentosOutrosDias = todosAgendamentos.filter(item => {
    return extrairDataIso(item) !== HOJE_ISO;
  }).filter(item => {
    if (filtroStatus === 'TODOS') return true;
    const statusItem = (item.status || 'PENDENTE').toUpperCase();
    if (filtroStatus === 'CONCLUIDO') return statusItem.includes('CONCLU');
    if (filtroStatus === 'PENDENTE') return statusItem.includes('PENDENTE') || statusItem.includes('AGENDADO');
    if (filtroStatus === 'CANCELADO') return statusItem.includes('CANCELADO');
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
      {/* PAINEL DE DIAGNÓSTICO (Caso o banco retorne vazio ou colunas diferentes) */}
      {debugDadosBrutos.length === 0 && !carregando && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 text-amber-800 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
          <div>
            <strong className="block font-bold text-sm mb-1">Aviso de Diagnóstico:</strong>
            O Supabase retornou 0 registros na tabela <code className="bg-amber-100 px-1 py-0.5 rounded">agendamentos</code>. Verifique se a tabela possui dados salvos ou se o nome da tabela está correto no banco de dados.
          </div>
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
          <div className="py-8 text-center space-y-2">
            <p className="text-sm text-stone-400">Nenhum atendimento agendado para hoje (07/09/2026).</p>
            <p className="text-[11px] text-stone-400">Total de registros encontrados no banco: {debugDadosBrutos.length}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {agendamentosHoje.map((item) => {
              const statusItem = (item.status || 'AGENDADO').toUpperCase();
              const isConcluido = statusItem.includes('CONCLU');
              
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
          <span>{mostrarOutrosDias ? 'Ocultar Histórico / Outros Dias' : 'Ver Agendamentos de Outros Dias (Histórico e Filtros)'}</span>
          {mostrarOutrosDias ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* BLOCO RECOLHÍVEL COM O RESTANTE DOS DIAS */}
      {mostrarOutrosDias && (
        <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
            <div>
              <h4 className="font-bold text-stone-900 text-base">Outros Dias e Histórico</h4>
              <p className="text-xs text-stone-400">Gerencie consultas passadas ou futuras</p>
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
            <p className="text-sm text-stone-400 py-8 text-center">Nenhum agendamento encontrado para os filtros selecionados.</p>
          ) : (
            <div className="space-y-3">
              {agendamentosOutrosDias.map((item) => {
                const statusItem = (item.status || 'AGENDADO').toUpperCase();
                const isConcluido = statusItem.includes('CONCLU');
                
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
