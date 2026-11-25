'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { TrendingUp, TrendingDown, DollarSign, PieChart, CheckCircle2, Percent, Receipt, XCircle } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const MESES_PILLS = [
  { num: '01', label: 'Jan' },
  { num: '02', label: 'Fev' },
  { num: '03', label: 'Mar' },
  { num: '04', label: 'Abr' },
  { num: '05', label: 'Mai' },
  { num: '06', label: 'Jun' },
  { num: '07', label: 'Jul' },
  { num: '08', label: 'Ago' },
  { num: '09', label: 'Set' },
  { num: '10', label: 'Out' },
  { num: '11', label: 'Nov' },
  { num: '12', label: 'Dez' },
];

function parseNumeroBR(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim().replace(/\s+/g, '').replace('R$', '');
    const normalizado = trimmed.includes(',')
      ? trimmed.replace(/\./g, '').replace(',', '.')
      : trimmed;
    const num = Number(normalizado);
    return Number.isFinite(num) ? num : 0;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function formatBRL(value) {
  const num = parseNumeroBR(value);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export default function RelatoriosPage({ agendamentos = [], despesas = [], barbeiros = [], servicos = [], barbearia = {} }) {
  const [listaAgendamentos, setListaAgendamentos] = useState(agendamentos);
  const [listaDespesas, setListaDespesas] = useState(despesas);
  const [listaBarbeiros, setListaBarbeiros] = useState(barbeiros);
  const [erroFatal, setErroFatal] = useState(null);

  useEffect(() => { if (agendamentos?.length > 0) setListaAgendamentos(agendamentos); }, [agendamentos]);
  useEffect(() => { if (despesas?.length > 0) setListaDespesas(despesas); }, [despesas]);
  useEffect(() => { if (barbeiros?.length > 0) setListaBarbeiros(barbeiros); }, [barbeiros]);

  const obterMesAtualIso = () => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    return `${ano}-${mes}`;
  };

  const [filtroMes, setFiltroMes] = useState(obterMesAtualIso);
  const [secaoAtiva, setSecaoAtiva] = useState('atendimentos');
  const pillRefs = useRef({});

  const anoSelecionado = filtroMes.split('-')[0] || String(new Date().getFullYear());
  const mesSelecionadoNum = filtroMes.split('-')[1] || String(new Date().getMonth() + 1).padStart(2, '0');

  useEffect(() => {
    const elAtivo = pillRefs.current[mesSelecionadoNum];
    if (elAtivo) {
      elAtivo.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [mesSelecionadoNum]);

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
    const val = item.valor_total ?? item.servicos?.preco ?? item.valor ?? item.preco ?? item.total ?? item.valor_servico ?? 0;
    return parseNumeroBR(val);
  };

  const getComissaoTaxa = (item, nomeBarbeiro) => {
    const taxaDireta = item.barbeiros?.taxa_comissao ?? item.barbeiros?.comissao_padrao ?? item.barbeiros?.comissao ?? item.barbeiros?.porcentagem;
    if (taxaDireta !== undefined && taxaDireta !== null && taxaDireta !== '') {
      const num = parseNumeroBR(taxaDireta);
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
          const num = parseNumeroBR(taxaProp);
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
  const custosTotais = despesasFiltradas.reduce((acc, item) => acc + parseNumeroBR(item.valor ?? item.preco ?? item.custo ?? 0), 0);
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

  const abasNavegacao = [
    { id: 'atendimentos', label: 'Atendimentos', icon: CheckCircle2 },
    { id: 'comissoes', label: 'Comissões', icon: Percent },
    { id: 'despesas', label: 'Despesas', icon: Receipt },
    { id: 'cancelados', label: 'Cancelados', icon: XCircle }
  ];

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-0 space-y-4 pb-24">
      
      {erroFatal && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-2xl shadow-sm">
          <div className="text-red-700 text-xs font-medium">Erro ao carregar relatórios: {erroFatal}</div>
        </div>
      )}

      {/* Cards de Indicadores (KPIs) */}
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-4 gap-3 md:gap-4">
        
        {/* 1. Faturamento */}
        <div 
          className="relative rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-2 border border-stone-700/50 min-w-0 w-full overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
            boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.8)'
          }}
        >
          <div className="flex flex-col justify-center min-w-0 flex-1">
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider truncate block">Faturamento</span>
            <h3 className="text-[15px] sm:text-xl font-black text-white mt-0.5 tabular-nums leading-tight truncate">{formatBRL(faturamentoTotal)}</h3>
          </div>
          <div 
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0"
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
          className="relative rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-2 border border-stone-700/50 min-w-0 w-full overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
            boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.8)'
          }}
        >
          <div className="flex flex-col justify-center min-w-0 flex-1">
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider truncate block">Despesas</span>
            <h3 className="text-[15px] sm:text-xl font-black text-white mt-0.5 tabular-nums leading-tight truncate">{formatBRL(custosTotais)}</h3>
          </div>
          <div 
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0"
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
          className="relative rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-2 border border-stone-700/50 min-w-0 w-full overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
            boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.8)'
          }}
        >
          <div className="flex flex-col justify-center min-w-0 flex-1">
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider truncate block">Lucro Líquido</span>
            <h3 className={`text-[15px] sm:text-xl font-black mt-0.5 tabular-nums leading-tight truncate ${lucroLiquidoReal >= 0 ? 'text-sky-400' : 'text-rose-400'}`}>
              {formatBRL(lucroLiquidoReal)}
            </h3>
          </div>
          <div 
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0"
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
          className="relative rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-2 border border-stone-700/50 min-w-0 w-full overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
            boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.8)'
          }}
        >
          <div className="flex flex-col justify-center min-w-0 flex-1">
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider truncate block">Ticket Médio</span>
            <h3 className="text-[15px] sm:text-xl font-black text-white mt-0.5 tabular-nums leading-tight truncate">{formatBRL(ticketMedioCalculado)}</h3>
          </div>
          <div 
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0"
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
        className="relative rounded-3xl p-4 sm:p-6 border border-white/80 overflow-hidden shadow-xs space-y-3"
        style={{
          background: 'linear-gradient(135deg, #f7f9f8 0%, #edf1f0 50%, #e2e8e6 100%)',
          boxShadow: '0 15px 30px rgba(0, 0, 0, 0.05), inset 0 2px 4px rgba(255, 255, 255, 0.9), inset 0 -3px 6px rgba(0, 0, 0, 0.03)'
        }}
      >
        
        {/* Topo com Título e Seletor de Meses em Pílulas */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm sm:text-base font-extrabold text-stone-900 flex items-center gap-2 tracking-tight">
              <span className="w-2 h-2 bg-[#111111] rounded-full"></span>
              Relatório Financeiro
            </h2>
            <span className="text-[11px] font-bold text-stone-500">
              {anoSelecionado}
            </span>
          </div>

          <div className="bg-white/95 rounded-full border border-stone-200/80 p-1.5 shadow-2xs overflow-x-auto [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center gap-1.5 min-w-max">
              {MESES_PILLS.map((m) => {
                const ativo = m.num === mesSelecionadoNum;
                return (
                  <button
                    key={m.num}
                    ref={(el) => {
                      pillRefs.current[m.num] = el;
                    }}
                    type="button"
                    onClick={() => setFiltroMes(`${anoSelecionado}-${m.num}`)}
                    className={`px-4 py-2 rounded-full text-xs transition-all duration-200 cursor-pointer shrink-0 active:scale-95 ${
                      ativo
                        ? 'bg-[#111111] text-white font-black shadow-sm'
                        : 'bg-stone-100/90 hover:bg-stone-200/80 text-stone-600 font-bold'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4 BOTÕES NO PADRÃO DAS DEMAIS ABAS */}
        <div className="grid grid-cols-4 gap-2 sm:gap-2.5 w-full">
          {abasNavegacao.map((aba) => {
            const IconComponent = aba.icon;
            const isSelected = secaoAtiva === aba.id;

            return (
              <button
                key={aba.id}
                type="button"
                onClick={() => setSecaoAtiva(aba.id)}
                style={
                  isSelected
                    ? {
                        background: 'linear-gradient(145deg, #dfe6ee 0%, #cfd8e3 100%)',
                        boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.85), 0 4px 10px rgba(15, 23, 42, 0.08)'
                      }
                    : {
                        background: 'linear-gradient(145deg, #f8fafc 0%, #eef2f6 100%)',
                        boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.9), 0 2px 6px rgba(15, 23, 42, 0.04)'
                      }
                }
                className={`py-3 px-1.5 rounded-2xl transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-2 text-center active:scale-95 border ${
                  isSelected
                    ? 'border-slate-300/90 text-slate-900'
                    : 'border-white/90 text-slate-600 hover:border-slate-200'
                }`}
              >
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-[#111111] text-white shadow-sm'
                      : 'bg-white/90 text-slate-700 border border-slate-200/70'
                  }`}
                >
                  <IconComponent className="w-4 h-4 shrink-0" />
                </div>

                <span
                  className={`text-[10px] sm:text-xs tracking-tight leading-none truncate max-w-full ${
                    isSelected ? 'font-black text-slate-900' : 'font-semibold text-slate-600'
                  }`}
                >
                  {aba.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* CONTEÚDO DINÂMICO */}
        <div className="pt-1 animate-fadeIn">
          
          {/* 1. ATENDIMENTOS REALIZADOS */}
          {(secaoAtiva === 'atendimentos') && (
            <div className="bg-white rounded-3xl border border-stone-200/90 p-4 sm:p-5 space-y-4 shadow-xs">
              <h3 className="font-extrabold text-stone-900 text-xs sm:text-sm tracking-tight flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Atendimentos Realizados
              </h3>
              {atendimentosConcluidos.length === 0 ? (
                <p className="text-xs text-stone-400 py-8 text-center">Nenhum atendimento concluído registrado neste mês.</p>
              ) : (
                <>
                  <div className="print:hidden sm:hidden space-y-2.5">
                    {atendimentosConcluidos.map((item, index) => (
                      <div key={index} className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/70 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-stone-900 text-xs block">{getNomeCliente(item)}</span>
                            <span className="text-[11px] text-stone-500">{getNomeServico(item)}</span>
                          </div>
                          <span className="font-black text-emerald-600 text-xs">{formatBRL(getValorServico(item))}</span>
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
                            <td className="p-3.5 text-right font-extrabold text-emerald-600">{formatBRL(getValorServico(item))}</td>
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
            <div className="bg-white rounded-3xl border border-stone-200/90 p-4 sm:p-5 space-y-4 shadow-xs">
              <h3 className="font-extrabold text-stone-900 text-xs sm:text-sm tracking-tight flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Resumo de Comissões por Profissional
              </h3>
              {comissoesPorBarbeiro.length === 0 ? (
                <p className="text-xs text-stone-400 py-8 text-center">Nenhum dado de comissão disponível neste mês.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {comissoesPorBarbeiro.map((barb, idx) => (
                    <div key={idx} className="bg-stone-50 p-4 rounded-2xl border border-stone-200/70 space-y-3 shadow-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-stone-900 text-sm">{barb.nome}</span>
                        <span className="text-[10px] bg-stone-200/70 px-2.5 py-1 rounded-xl font-bold text-stone-700">{barb.quantidade} atendimentos</span>
                      </div>
                      <div className="space-y-2 text-xs pt-1 border-t border-stone-200/60">
                        <div className="flex justify-between text-stone-500">
                          <span>Faturamento gerado:</span>
                          <span className="font-semibold text-stone-800">{formatBRL(barb.faturamento)}</span>
                        </div>
                        <div className="flex justify-between text-stone-500">
                          <span>Comissão ({Math.round(barb.taxa * 100)}%):</span>
                          <span className="font-extrabold text-emerald-600">{formatBRL(barb.comissaoEstimada)}</span>
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
            <div className="bg-white rounded-3xl border border-stone-200/90 p-4 sm:p-5 space-y-4 shadow-xs">
              <h3 className="font-extrabold text-stone-900 text-xs sm:text-sm tracking-tight flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Detalhamento de Custos e Despesas
              </h3>
              {despesasFiltradas.length === 0 ? (
                <p className="text-xs text-stone-400 py-8 text-center">Nenhuma despesa cadastrada neste mês.</p>
              ) : (
                <>
                  <div className="print:hidden sm:hidden space-y-2.5">
                    {despesasFiltradas.map((item, index) => (
                      <div key={index} className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/70 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-stone-900 text-xs block">{item.descricao || item.nome || 'Despesa'}</span>
                          <span className="text-[10px] text-stone-500 font-medium">{item.categoria || 'Geral'} • {item.data ? new Date(item.data).toLocaleDateString('pt-BR') : 'N/A'}</span>
                        </div>
                        <span className="font-black text-rose-600 text-xs">{formatBRL(item.valor || 0)}</span>
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
                            <td className="p-3.5 text-right font-extrabold text-rose-600">{formatBRL(item.valor || 0)}</td>
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
            <div className="bg-white rounded-3xl border border-stone-200/90 p-4 sm:p-5 space-y-4 shadow-xs">
              <h3 className="font-extrabold text-stone-900 text-xs sm:text-sm tracking-tight flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Histórico de Agendamentos Cancelados
              </h3>
              {atendimentosCancelados.length === 0 ? (
                <p className="text-xs text-stone-400 py-8 text-center">Nenhum agendamento cancelado neste mês.</p>
              ) : (
                <>
                  <div className="print:hidden sm:hidden space-y-2.5">
                    {atendimentosCancelados.map((item, index) => (
                      <div key={index} className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/70 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-stone-900 text-xs block">{getNomeCliente(item)}</span>
                            <span className="text-[11px] text-stone-500">{getNomeServico(item)}</span>
                          </div>
                          <span className="font-bold text-stone-400 text-xs line-through">{formatBRL(getValorServico(item))}</span>
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
                            <td className="p-3.5 text-right font-bold text-stone-400 line-through">{formatBRL(getValorServico(item))}</td>
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
