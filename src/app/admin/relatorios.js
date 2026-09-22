'use client';

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Calendar, CheckCircle2, Percent, Receipt, XCircle } from 'lucide-react';

export default function RelatoriosPage({ agendamentos = [], despesas = [], barbeiros = [], servicos = [], barbearia = {} }) {
  const [filtroMes, setFiltroMes] = useState(() => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    return `${ano}-${mes}`;
  });

  const [secaoAtiva, setSecaoAtiva] = useState('atendimentos');

  const getNomeCliente = (item) => {
    return item.clientes?.nome || item.cliente_nome || item.nome_cliente || item.cliente?.name || 'Cliente';
  };

  const getNomeServico = (item) => {
    return item.servicos?.nome || item.servico_nome || item.servico?.nome || item.nome_servico || 'Serviço';
  };

  const getNomeBarbeiro = (item) => {
    return item.barbeiros?.nome || item.barbeiro_nome || item.profissional_nome || item.barbeiros?.name || 'Profissional';
  };

  const getValorServico = (item) => {
    const val = item.servicos?.valor || item.servicos?.preco || item.valor || item.preco || item.total || item.valor_servico || 0;
    return Number(val) || 0;
  };

  const getComissaoTaxa = (item, nomeBarbeiro) => {
    const taxaDireta = item.barbeiros?.taxa_comissao ?? item.barbeiros?.comissao_padrao ?? item.barbeiros?.comissao ?? item.barbeiros?.porcentagem;
    if (taxaDireta !== undefined && taxaDireta !== null && taxaDireta !== '') {
      const num = Number(taxaDireta);
      return num > 1 ? num / 100 : num; 
    }

    if (Array.isArray(barbeiros) && barbeiros.length > 0) {
      let found = barbeiros.find(b => String(b.id) === String(item.barbeiro_id));
      if (!found && nomeBarbeiro) {
        found = barbeiros.find(b => {
          const nomeB = (b.nome || b.nome_barbeiro || '').trim().toLowerCase();
          const nomeA = nomeBarbeiro.trim().toLowerCase();
          return nomeB === nomeA || nomeB.includes(nomeA) || nomeA.includes(nomeB);
        });
      }

      if (found) {
        const taxaProp = found.taxa_comissao ?? found.comissao_padrao ?? found.comissao ?? found.porcentagem ?? found.taxa;
        if (taxaProp !== undefined && taxaProp !== null && taxaProp !== '') {
          const num = Number(taxaProp);
          return num > 1 ? num / 100 : num;
        }
      }
    }
    return 0.50;
  };

  const pertenceAoMesSelecionado = (dataStr) => {
    if (!dataStr) return false;
    const mesAnoItem = String(dataStr).substring(0, 7);
    return mesAnoItem === filtroMes;
  };

  const agendamentosFiltrados = Array.isArray(agendamentos)
    ? agendamentos.filter(item => {
        const dataItem = item.data_hora || item.data || item.created_at;
        return pertenceAoMesSelecionado(dataItem);
      })
    : [];

  const despesasFiltradas = Array.isArray(despesas)
    ? despesas.filter(item => {
        const dataItem = item.data || item.created_at || item.data_despesa;
        return pertenceAoMesSelecionado(dataItem);
      })
    : [];

  const atendimentosConcluidos = agendamentosFiltrados.filter(item => {
    const status = (item.status || '').toLowerCase();
    return status === 'concluido' || status === 'concluida' || status === 'realizado' || status === 'finalizado';
  });

  const atendimentosCancelados = agendamentosFiltrados.filter(item => {
    const status = (item.status || '').toLowerCase();
    return status === 'cancelado' || status === 'cancelada';
  });
  
  const faturamentoTotal = atendimentosConcluidos.reduce((acc, item) => acc + getValorServico(item), 0);
  const custosTotais = despesasFiltradas.reduce((acc, item) => acc + Number(item.valor || item.preco || item.custo || 0), 0);
  const lucroLiquidoReal = faturamentoTotal - custosTotais;
  const ticketMedioCalculado = atendimentosConcluidos.length > 0 ? faturamentoTotal / atendimentosConcluidos.length : 0;

  const comissoesPorBarbeiro = (() => {
    const mapa = {};
    atendimentosConcluidos.forEach(item => {
      const nomeBarbeiro = getNomeBarbeiro(item);
      const valorNum = getValorServico(item);
      const taxa = getComissaoTaxa(item, nomeBarbeiro);

      if (!mapa[nomeBarbeiro]) {
        mapa[nomeBarbeiro] = { faturamento: 0, quantidade: 0, taxa };
      }
      mapa[nomeBarbeiro].faturamento += valorNum;
      mapa[nomeBarbeiro].quantidade += 1;
      mapa[nomeBarbeiro].taxa = taxa;
    });

    return Object.keys(mapa).map(nome => ({
      nome,
      quantidade: mapa[nome].quantidade,
      faturamento: mapa[nome].faturamento,
      taxa: mapa[nome].taxa,
      comissaoEstimada: mapa[nome].faturamento * mapa[nome].taxa
    }));
  })();

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-28 px-2 sm:px-0">
      
      {/* Cards de Indicadores (KPIs) */}
      <div className="grid grid-cols-2 gap-3.5 md:gap-5 mb-2">
        
        {/* 1. Faturamento */}
        <div 
          className="relative rounded-3xl md:rounded-[2.5rem] p-5 sm:p-6 md:p-7 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
            boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.8)'
          }}
        >
          <div className="flex flex-col justify-center min-w-0 pr-2">
            <span className="text-[9px] sm:text-[10px] md:text-xs font-bold text-stone-400 uppercase tracking-wider truncate block">Faturamento</span>
            <h3 className="text-lg sm:text-2xl md:text-3xl font-black text-white mt-1 truncate">R$ {faturamentoTotal.toFixed(0)}</h3>
            <p className="text-[10px] text-emerald-400 font-medium mt-0.5">{atendimentosConcluidos.length} concluídos</p>
          </div>
          <div 
            className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)',
              boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 1), inset 0 -4px 6px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.9)'
            }}
          >
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
          </div>
        </div>

        {/* 2. Despesas */}
        <div 
          className="relative rounded-3xl md:rounded-[2.5rem] p-5 sm:p-6 md:p-7 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
            boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.8)'
          }}
        >
          <div className="flex flex-col justify-center min-w-0 pr-2">
            <span className="text-[9px] sm:text-[10px] md:text-xs font-bold text-stone-400 uppercase tracking-wider truncate block">Despesas</span>
            <h3 className="text-lg sm:text-2xl md:text-3xl font-black text-white mt-1 truncate">R$ {custosTotais.toFixed(0)}</h3>
            <p className="text-[10px] text-rose-400 font-medium mt-0.5">{despesasFiltradas.length} cadastradas</p>
          </div>
          <div 
            className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)',
              boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 1), inset 0 -4px 6px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.9)'
            }}
          >
            <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
          </div>
        </div>

        {/* 3. Lucro Líquido */}
        <div 
          className="relative rounded-3xl md:rounded-[2.5rem] p-5 sm:p-6 md:p-7 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
            boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.8)'
          }}
        >
          <div className="flex flex-col justify-center min-w-0 pr-2">
            <span className="text-[9px] sm:text-[10px] md:text-xs font-bold text-stone-400 uppercase tracking-wider truncate block">Lucro Líquido</span>
            <h3 className={`text-lg sm:text-2xl md:text-3xl font-black mt-1 truncate ${lucroLiquidoReal >= 0 ? 'text-sky-400' : 'text-rose-400'}`}>
              R$ {lucroLiquidoReal.toFixed(0)}
            </h3>
            <p className="text-[10px] text-stone-400 font-medium mt-0.5">Entradas - Saídas</p>
          </div>
          <div 
            className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)',
              boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 1), inset 0 -4px 6px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.9)'
            }}
          >
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
          </div>
        </div>

        {/* 4. Ticket Médio */}
        <div 
          className="relative rounded-3xl md:rounded-[2.5rem] p-5 sm:p-6 md:p-7 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
            boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.8)'
          }}
        >
          <div className="flex flex-col justify-center min-w-0 pr-2">
            <span className="text-[9px] sm:text-[10px] md:text-xs font-bold text-stone-400 uppercase tracking-wider truncate block">Ticket Médio</span>
            <h3 className="text-lg sm:text-2xl md:text-3xl font-black text-white mt-1 truncate">R$ {ticketMedioCalculado.toFixed(0)}</h3>
            <p className="text-[10px] text-stone-400 font-medium mt-0.5">Média por atendimento</p>
          </div>
          <div 
            className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)',
              boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 1), inset 0 -4px 6px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.9)'
            }}
          >
            <PieChart className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
          </div>
        </div>

      </div>

      {/* BLOCO ÚNICO INTEGRADO */}
      <div 
        className="relative rounded-[2.5rem] p-5 sm:p-8 border border-white/80 overflow-hidden shadow-sm space-y-6"
        style={{
          background: 'linear-gradient(135deg, #f7f9f8 0%, #edf1f0 50%, #e2e8e6 100%)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08), inset 0 2px 4px rgba(255, 255, 255, 0.9), inset 0 -3px 6px rgba(0, 0, 0, 0.05)'
        }}
      >
        
        {/* Topo com Título e Filtro de Mês/Ano */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-stone-300/60 gap-3">
          <h2 className="text-lg sm:text-xl font-extrabold text-stone-900 flex items-center gap-3 tracking-tight">
            <span className="w-3 h-3 bg-[#111111] rounded-full shadow-[0_0_8px_rgba(17,17,17,0.4)]"></span>
            Relatório Financeiro
          </h2>
          
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl text-xs font-bold text-stone-700 border border-stone-200 shadow-xs flex-1 sm:flex-initial">
              <Calendar className="w-4 h-4 text-stone-500 shrink-0" />
              <input 
                type="month"
                value={filtroMes}
                onChange={(e) => setFiltroMes(e.target.value)}
                className="bg-transparent text-xs font-black text-stone-900 focus:outline-none cursor-pointer w-full"
              />
            </div>
            <button
              onClick={() => {
                const hoje = new Date();
                const ano = hoje.getFullYear();
                const mes = String(hoje.getMonth() + 1).padStart(2, '0');
                setFiltroMes(`${ano}-${mes}`);
              }}
              className="px-4 py-2.5 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
            >
              Atual
            </button>
          </div>
        </div>

        {/* ABAS EM FORMATO DE SLIDE HORIZONTAL COM BOTÕES MAIORES */}
        <div className="flex overflow-x-auto pb-2 gap-3 no-scrollbar scroll-smooth">
          
          {/* Aba 1: Atendimentos */}
          <button
            onClick={() => setSecaoAtiva('atendimentos')}
            className={`py-3.5 px-6 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2.5 text-xs font-bold shrink-0 min-w-[150px] ${
              secaoAtiva === 'atendimentos'
                ? 'text-white border border-stone-700/50 shadow-md scale-[1.02]'
                : 'bg-white/90 hover:bg-white text-stone-700 border border-stone-200/80 shadow-xs'
            }`}
            style={secaoAtiva === 'atendimentos' ? {
              background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
              boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.2)'
            } : {}}
          >
            <CheckCircle2 className={`w-4 h-4 shrink-0 ${secaoAtiva === 'atendimentos' ? 'text-emerald-400' : 'text-stone-500'}`} />
            <span>Atendimentos</span>
          </button>

          {/* Aba 2: Comissões */}
          <button
            onClick={() => setSecaoAtiva('comissoes')}
            className={`py-3.5 px-6 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2.5 text-xs font-bold shrink-0 min-w-[150px] ${
              secaoAtiva === 'comissoes'
                ? 'text-white border border-stone-700/50 shadow-md scale-[1.02]'
                : 'bg-white/90 hover:bg-white text-stone-700 border border-stone-200/80 shadow-xs'
            }`}
            style={secaoAtiva === 'comissoes' ? {
              background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
              boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.2)'
            } : {}}
          >
            <Percent className={`w-4 h-4 shrink-0 ${secaoAtiva === 'comissoes' ? 'text-emerald-400' : 'text-stone-500'}`} />
            <span>Comissões</span>
          </button>

          {/* Aba 3: Despesas */}
          <button
            onClick={() => setSecaoAtiva('despesas')}
            className={`py-3.5 px-6 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2.5 text-xs font-bold shrink-0 min-w-[150px] ${
              secaoAtiva === 'despesas'
                ? 'text-white border border-stone-700/50 shadow-md scale-[1.02]'
                : 'bg-white/90 hover:bg-white text-stone-700 border border-stone-200/80 shadow-xs'
            }`}
            style={secaoAtiva === 'despesas' ? {
              background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
              boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.2)'
            } : {}}
          >
            <Receipt className={`w-4 h-4 shrink-0 ${secaoAtiva === 'despesas' ? 'text-rose-400' : 'text-stone-500'}`} />
            <span>Despesas</span>
          </button>

          {/* Aba 4: Cancelados */}
          <button
            onClick={() => setSecaoAtiva('cancelados')}
            className={`py-3.5 px-6 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2.5 text-xs font-bold shrink-0 min-w-[150px] ${
              secaoAtiva === 'cancelados'
                ? 'text-white border border-stone-700/50 shadow-md scale-[1.02]'
                : 'bg-white/90 hover:bg-white text-stone-700 border border-stone-200/80 shadow-xs'
            }`}
            style={secaoAtiva === 'cancelados' ? {
              background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
              boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.2)'
            } : {}}
          >
            <XCircle className={`w-4 h-4 shrink-0 ${secaoAtiva === 'cancelados' ? 'text-amber-400' : 'text-stone-500'}`} />
            <span>Cancelados</span>
          </button>

        </div>

        {/* CONTEÚDO DINÂMICO */}
        <div className="pt-2 animate-fadeIn">
          
          {/* 1. ATENDIMENTOS REALIZADOS */}
          {(secaoAtiva === 'atendimentos') && (
            <div className="bg-white rounded-[2rem] border border-stone-200/90 p-5 sm:p-6 space-y-4 shadow-xs">
              <h3 className="font-extrabold text-stone-900 text-sm sm:text-base tracking-tight flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Atendimentos Realizados
              </h3>
              {atendimentosConcluidos.length === 0 ? (
                <p className="text-xs text-stone-400 py-8 text-center">Nenhum atendimento concluído registrado neste mês.</p>
              ) : (
                <>
                  <div className="print:hidden sm:hidden space-y-3">
                    {atendimentosConcluidos.map((item, index) => (
                      <div key={index} className="p-4 rounded-2xl bg-stone-50 border border-stone-200/70 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-stone-900 text-xs block">{getNomeCliente(item)}</span>
                            <span className="text-[11px] text-stone-500">{getNomeServico(item)}</span>
                          </div>
                          <span className="font-black text-emerald-600 text-xs">R$ {getValorServico(item).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-stone-200/60 text-[11px] text-stone-500 font-medium">
                          <span>👤 {getNomeBarbeiro(item)}</span>
                          <span>📅 {item.data_hora ? new Date(item.data_hora).toLocaleDateString('pt-BR') : 'N/A'}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden print:block sm:block overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-100 text-stone-600 uppercase font-bold border-b border-stone-200">
                        <tr>
                          <th className="p-3.5 rounded-l-xl">Cliente</th>
                          <th className="p-3.5">Serviço</th>
                          <th className="p-3.5">Profissional</th>
                          <th className="p-3.5">Data</th>
                          <th className="p-3.5 text-right rounded-r-xl">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {atendimentosConcluidos.map((item, index) => (
                          <tr key={index} className="hover:bg-stone-50/70 transition-colors">
                            <td className="p-3.5 font-bold text-stone-900">{getNomeCliente(item)}</td>
                            <td className="p-3.5 text-stone-600">{getNomeServico(item)}</td>
                            <td className="p-3.5 text-stone-600">{getNomeBarbeiro(item)}</td>
                            <td className="p-3.5 text-stone-500">{item.data_hora ? new Date(item.data_hora).toLocaleDateString('pt-BR') : 'N/A'}</td>
                            <td className="p-3.5 text-right font-extrabold text-emerald-600">R$ {getValorServico(item).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 2. COMISSÕES */}
          {(secaoAtiva === 'comissoes') && (
            <div className="bg-white rounded-[2rem] border border-stone-200/90 p-5 sm:p-6 space-y-4 shadow-xs">
              <h3 className="font-extrabold text-stone-900 text-sm sm:text-base tracking-tight flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Resumo de Comissões por Profissional
              </h3>
              {comissoesPorBarbeiro.length === 0 ? (
                <p className="text-xs text-stone-400 py-8 text-center">Nenhum dado de comissão disponível neste mês.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {comissoesPorBarbeiro.map((barb, idx) => (
                    <div key={idx} className="bg-stone-50 p-5 rounded-2xl border border-stone-200/70 space-y-3 shadow-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-stone-900 text-sm">{barb.nome}</span>
                        <span className="text-[10px] bg-stone-200/70 px-2.5 py-1 rounded-xl font-bold text-stone-700">{barb.quantidade} atendimentos</span>
                      </div>
                      <div className="space-y-2 text-xs pt-1 border-t border-stone-200/60">
                        <div className="flex justify-between text-stone-500">
                          <span>Faturamento gerado:</span>
                          <span className="font-semibold text-stone-800">R$ {barb.faturamento.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-stone-500">
                          <span>Comissão ({Math.round(barb.taxa * 100)}%):</span>
                          <span className="font-extrabold text-emerald-600">R$ {barb.comissaoEstimada.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. DESPESAS */}
          {(secaoAtiva === 'despesas') && (
            <div className="bg-white rounded-[2rem] border border-stone-200/90 p-5 sm:p-6 space-y-4 shadow-xs">
              <h3 className="font-extrabold text-stone-900 text-sm sm:text-base tracking-tight flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Detalhamento de Custos e Despesas
              </h3>
              {despesasFiltradas.length === 0 ? (
                <p className="text-xs text-stone-400 py-8 text-center">Nenhuma despesa cadastrada neste mês.</p>
              ) : (
                <>
                  <div className="print:hidden sm:hidden space-y-3">
                    {despesasFiltradas.map((item, index) => (
                      <div key={index} className="p-4 rounded-2xl bg-stone-50 border border-stone-200/70 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-stone-900 text-xs block">{item.descricao || item.nome || 'Despesa'}</span>
                          <span className="text-[10px] text-stone-500 font-medium">{item.categoria || 'Geral'} • {item.data ? new Date(item.data).toLocaleDateString('pt-BR') : 'N/A'}</span>
                        </div>
                        <span className="font-black text-rose-600 text-xs">R$ {Number(item.valor || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="hidden print:block sm:block overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-100 text-stone-600 uppercase font-bold border-b border-stone-200">
                        <tr>
                          <th className="p-3.5 rounded-l-xl">Descrição</th>
                          <th className="p-3.5">Categoria</th>
                          <th className="p-3.5">Data</th>
                          <th className="p-3.5 text-right rounded-r-xl">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {despesasFiltradas.map((item, index) => (
                          <tr key={index} className="hover:bg-stone-50/70 transition-colors">
                            <td className="p-3.5 font-bold text-stone-900">{item.descricao || item.nome || 'Despesa'}</td>
                            <td className="p-3.5 text-stone-600">{item.categoria || 'Geral'}</td>
                            <td className="p-3.5 text-stone-500">{item.data ? new Date(item.data).toLocaleDateString('pt-BR') : 'N/A'}</td>
                            <td className="p-3.5 text-right font-extrabold text-rose-600">R$ {Number(item.valor || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 4. CANCELADOS */}
          {(secaoAtiva === 'cancelados') && (
            <div className="bg-white rounded-[2rem] border border-stone-200/90 p-5 sm:p-6 space-y-4 shadow-xs">
              <h3 className="font-extrabold text-stone-900 text-sm sm:text-base tracking-tight flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Histórico de Agendamentos Cancelados
              </h3>
              {atendimentosCancelados.length === 0 ? (
                <p className="text-xs text-stone-400 py-8 text-center">Nenhum agendamento cancelado neste mês.</p>
              ) : (
                <>
                  <div className="print:hidden sm:hidden space-y-3">
                    {atendimentosCancelados.map((item, index) => (
                      <div key={index} className="p-4 rounded-2xl bg-stone-50 border border-stone-200/70 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-stone-900 text-xs block">{getNomeCliente(item)}</span>
                            <span className="text-[11px] text-stone-500">{getNomeServico(item)}</span>
                          </div>
                          <span className="font-bold text-stone-400 text-xs line-through">R$ {getValorServico(item).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-stone-200/60 text-[11px] text-stone-500 font-medium">
                          <span>👤 {getNomeBarbeiro(item)}</span>
                          <span>📅 {item.data_hora ? new Date(item.data_hora).toLocaleDateString('pt-BR') : 'N/A'}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden print:block sm:block overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-100 text-stone-600 uppercase font-bold border-b border-stone-200">
                        <tr>
                          <th className="p-3.5 rounded-l-xl">Cliente</th>
                          <th className="p-3.5">Serviço</th>
                          <th className="p-3.5">Profissional</th>
                          <th className="p-3.5">Data</th>
                          <th className="p-3.5 text-right rounded-r-xl">Valor Perdido</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {atendimentosCancelados.map((item, index) => (
                          <tr key={index} className="hover:bg-stone-50/70 transition-colors">
                            <td className="p-3.5 font-bold text-stone-900">{getNomeCliente(item)}</td>
                            <td className="p-3.5 text-stone-600">{getNomeServico(item)}</td>
                            <td className="p-3.5 text-stone-600">{getNomeBarbeiro(item)}</td>
                            <td className="p-3.5 text-stone-500">{item.data_hora ? new Date(item.data_hora).toLocaleDateString('pt-BR') : 'N/A'}</td>
                            <td className="p-3.5 text-right font-bold text-stone-400 line-through">R$ {getValorServico(item).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}