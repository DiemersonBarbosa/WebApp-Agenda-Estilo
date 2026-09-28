'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Calendar, CheckCircle2, Percent, Receipt, XCircle } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function RelatoriosPage({ agendamentos = [], despesas = [], barbeiros = [], servicos = [], barbearia = {} }) {
  const [listaAgendamentos, setListaAgendamentos] = useState(agendamentos);
  const [listaDespesas, setListaDespesas] = useState(despesas);
  const [listaBarbeiros, setListaBarbeiros] = useState(barbeiros);
  const [erroFatal, setErroFatal] = useState(null);

  useEffect(() => { if (agendamentos?.length > 0) setListaAgendamentos(agendamentos); }, [agendamentos]);
  useEffect(() => { if (despesas?.length > 0) setListaDespesas(despesas); }, [despesas]);
  useEffect(() => { if (barbeiros?.length > 0) setListaBarbeiros(barbeiros); }, [barbeiros]);

  const [filtroMes, setFiltroMes] = useState(() => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    return `${ano}-${mes}`;
  });

  const [secaoAtiva, setSecaoAtiva] = useState('atendimentos');

  const carregarDadosDoBanco = async () => {
    try {
      setErroFatal(null);
      let barbeariaAtiva = barbearia?.id;

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

      let queryAgendamentos = supabase
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
        queryAgendamentos = queryAgendamentos.eq('barbearia_id', barbeariaAtiva);
      }

      const { data: dataAgendamentos, error: errAg } = await queryAgendamentos;
      if (errAg) throw errAg;
      if (dataAgendamentos) setListaAgendamentos(dataAgendamentos);

      let queryDespesas = supabase.from('despesas').select('*').order('data', { ascending: false });
      if (barbeariaAtiva) queryDespesas = queryDespesas.eq('barbearia_id', barbeariaAtiva);
      const { data: dataDesp } = await queryDespesas;
      if (dataDesp) setListaDespesas(dataDesp);

      let queryBarbeiros = supabase.from('barbeiros').select('*');
      if (barbeariaAtiva) queryBarbeiros = queryBarbeiros.eq('barbearia_id', barbeariaAtiva);
      const { data: dataBarb } = await queryBarbeiros;
      if (dataBarb) setListaBarbeiros(dataBarb);

    } catch (err) {
      setErroFatal(err.message);
    }
  };

  useEffect(() => {
    carregarDadosDoBanco();

    const channel = supabase
      .channel('realtime-relatorios-pagina')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agendamentos' },
        () => {
          carregarDadosDoBanco();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'despesas' },
        () => {
          carregarDadosDoBanco();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [barbearia?.id]);

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
    const val = item.valor_total || item.servicos?.preco || item.valor || item.preco || item.total || item.valor_servico || 0;
    return Number(val) || 0;
  };

  const getComissaoTaxa = (item, nomeBarbeiro) => {
    const taxaDireta = item.barbeiros?.taxa_comissao ?? item.barbeiros?.comissao_padrao ?? item.barbeiros?.comissao ?? item.barbeiros?.porcentagem;
    if (taxaDireta !== undefined && taxaDireta !== null && taxaDireta !== '') {
      const num = Number(taxaDireta);
      return num > 1 ? num / 100 : num; 
    }

    if (Array.isArray(listaBarbeiros) && listaBarbeiros.length > 0) {
      let found = listaBarbeiros.find(b => String(b.id) === String(item.barbeiro_id));
      if (!found && nomeBarbeiro) {
        found = listaBarbeiros.find(b => {
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

  const agendamentosFiltrados = Array.isArray(listaAgendamentos)
    ? listaAgendamentos.filter(item => {
        const dataItem = item.data_hora || item.data || item.created_at;
        return pertenceAoMesSelecionado(dataItem);
      })
    : [];

  const despesasFiltradas = Array.isArray(listaDespesas)
    ? listaDespesas.filter(item => {
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
      
      {erroFatal && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-2xl shadow-sm">
          <div className="text-red-700 text-sm font-medium">Erro ao carregar relatórios: {erroFatal}</div>
        </div>
      )}

      {/* Cards de Indicadores (KPIs) com largura e tamanho de fonte otimizados */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-2">
        
        {/* 1. Faturamento */}
        <div 
          className="relative rounded-3xl p-4 sm:p-5 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
            boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.8)'
          }}
        >
          <div className="flex flex-col justify-center min-w-0 pr-1.5">
            <span className="text-[9px] sm:text-[10px] xl:text-xs font-bold text-stone-400 uppercase tracking-wider truncate block">Faturamento</span>
            <h3 className="text-base sm:text-xl xl:text-2xl font-black text-white mt-0.5 whitespace-nowrap">R$ {faturamentoTotal.toFixed(0)}</h3>
            <p className="text-[10px] text-emerald-400 font-medium mt-0.5 truncate">{atendimentosConcluidos.length} concluídos</p>
          </div>
          <div 
            className="w-9 h-9 sm:w-10 sm:h-10 xl:w-11 xl:h-11 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)',
              boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 1), inset 0 -4px 6px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.9)'
            }}
          >
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
          </div>
        </div>

        {/* 2. Despesas */}
        <div 
          className="relative rounded-3xl p-4 sm:p-5 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
            boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.8)'
          }}
        >
          <div className="flex flex-col justify-center min-w-0 pr-1.5">
            <span className="text-[9px] sm:text-[10px] xl:text-xs font-bold text-stone-400 uppercase tracking-wider truncate block">Despesas</span>
            <h3 className="text-base sm:text-xl xl:text-2xl font-black text-white mt-0.5 whitespace-nowrap">R$ {custosTotais.toFixed(0)}</h3>
            <p className="text-[10px] text-rose-400 font-medium mt-0.5 truncate">{despesasFiltradas.length} cadastradas</p>
          </div>
          <div 
            className="w-9 h-9 sm:w-10 sm:h-10 xl:w-11 xl:h-11 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)',
              boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 1), inset 0 -4px 6px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.9)'
            }}
          >
            <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
          </div>
        </div>

        {/* 3. Lucro Líquido */}
        <div 
          className="relative rounded-3xl p-4 sm:p-5 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
            boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.8)'
          }}
        >
          <div className="flex flex-col justify-center min-w-0 pr-1.5">
            <span className="text-[9px] sm:text-[10px] xl:text-xs font-bold text-stone-400 uppercase tracking-wider truncate block">Lucro Líquido</span>
            <h3 className={`text-base sm:text-xl xl:text-2xl font-black mt-0.5 whitespace-nowrap ${lucroLiquidoReal >= 0 ? 'text-sky-400' : 'text-rose-400'}`}>
              R$ {lucroLiquidoReal.toFixed(0)}
            </h3>
            <p className="text-[10px] text-stone-400 font-medium mt-0.5 truncate">Entradas - Saídas</p>
          </div>
          <div 
            className="w-9 h-9 sm:w-10 sm:h-10 xl:w-11 xl:h-11 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)',
              boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 1), inset 0 -4px 6px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.9)'
            }}
          >
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
          </div>
        </div>

        {/* 4. Ticket Médio */}
        <div 
          className="relative rounded-3xl p-4 sm:p-5 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
            boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.8)'
          }}
        >
          <div className="flex flex-col justify-center min-w-0 pr-1.5">
            <span className="text-[9px] sm:text-[10px] xl:text-xs font-bold text-stone-400 uppercase tracking-wider truncate block">Ticket Médio</span>
            <h3 className="text-base sm:text-xl xl:text-2xl font-black text-white mt-0.5 whitespace-nowrap">R$ {ticketMedioCalculado.toFixed(0)}</h3>
            <p className="text-[10px] text-stone-400 font-medium mt-0.5 truncate">Média por atendimento</p>
          </div>
          <div 
            className="w-9 h-9 sm:w-10 sm:h-10 xl:w-11 xl:h-11 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)',
              boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 1), inset 0 -4px 6px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.9)'
            }}
          >
            <PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
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

        {/* NAVEGAÇÃO DE ABAS EXPANDIDA */}
        <div className="grid grid-cols-2 sm:grid-cols-4 w-full gap-2.5 sm:gap-3">
          
          <button
            onClick={() => setSecaoAtiva('atendimentos')}
            className={`w-full py-4 px-4 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2.5 text-xs sm:text-sm font-extrabold ${
              secaoAtiva === 'atendimentos'
                ? 'text-white border border-stone-700/50 shadow-md scale-[1.01]'
                : 'bg-white/90 hover:bg-white text-stone-700 border border-stone-200/80 shadow-xs'
            }`}
            style={secaoAtiva === 'atendimentos' ? {
              background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
              boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.2)'
            } : {}}
          >
            <CheckCircle2 className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${secaoAtiva === 'atendimentos' ? 'text-emerald-400' : 'text-stone-500'}`} />
            <span>Atendimentos</span>
          </button>

          <button
            onClick={() => setSecaoAtiva('comissoes')}
            className={`w-full py-4 px-4 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2.5 text-xs sm:text-sm font-extrabold ${
              secaoAtiva === 'comissoes'
                ? 'text-white border border-stone-700/50 shadow-md scale-[1.01]'
                : 'bg-white/90 hover:bg-white text-stone-700 border border-stone-200/80 shadow-xs'
            }`}
            style={secaoAtiva === 'comissoes' ? {
              background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
              boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.2)'
            } : {}}
          >
            <Percent className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${secaoAtiva === 'comissoes' ? 'text-emerald-400' : 'text-stone-500'}`} />
            <span>Comissões</span>
          </button>

          <button
            onClick={() => setSecaoAtiva('despesas')}
            className={`w-full py-4 px-4 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2.5 text-xs sm:text-sm font-extrabold ${
              secaoAtiva === 'despesas'
                ? 'text-white border border-stone-700/50 shadow-md scale-[1.01]'
                : 'bg-white/90 hover:bg-white text-stone-700 border border-stone-200/80 shadow-xs'
            }`}
            style={secaoAtiva === 'despesas' ? {
              background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
              boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.2)'
            } : {}}
          >
            <Receipt className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${secaoAtiva === 'despesas' ? 'text-rose-400' : 'text-stone-500'}`} />
            <span>Despesas</span>
          </button>

          <button
            onClick={() => setSecaoAtiva('cancelados')}
            className={`w-full py-4 px-4 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2.5 text-xs sm:text-sm font-extrabold ${
              secaoAtiva === 'cancelados'
                ? 'text-white border border-stone-700/50 shadow-md scale-[1.01]'
                : 'bg-white/90 hover:bg-white text-stone-700 border border-stone-200/80 shadow-xs'
            }`}
            style={secaoAtiva === 'cancelados' ? {
              background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
              boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.2)'
            } : {}}
          >
            <XCircle className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${secaoAtiva === 'cancelados' ? 'text-amber-400' : 'text-stone-500'}`} />
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