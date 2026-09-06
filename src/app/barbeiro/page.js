'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function PainelBarbeiro() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [comissaoPercentual, setComissaoPercentual] = useState(50);
  const [nomeBarbeiro, setNomeBarbeiro] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Estado para o filtro de mês (formato "YYYY-MM")
  const [mesSelecionado, setMesSelecionado] = useState('2026-09');

  useEffect(() => {
    async function carregarPainelDoBarbeiro() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: perfilBarbeiro } = await supabase
        .from('barbeiros')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!perfilBarbeiro) {
        setLoading(false);
        return;
      }

      setNomeBarbeiro(perfilBarbeiro.nome);
      setComissaoPercentual(perfilBarbeiro.comissao ?? perfilBarbeiro.comissao_padrao ?? 50);

      let resultadosTotais = [];

      const { data: porId } = await supabase
        .from('agendamentos')
        .select(`
          *,
          clientes (nome),
          servicos (nome, preco),
          cliente:clientes(nome),
          servico:servicos(nome)
        `)
        .eq('barbeiro_id', perfilBarbeiro.id);

      if (porId) resultadosTotais = [...porId];

      if (perfilBarbeiro.nome) {
        const { data: porNome } = await supabase
          .from('agendamentos')
          .select(`
            *,
            clientes (nome),
            servicos (nome, preco),
            cliente:clientes(nome),
            servico:servicos(nome)
          `)
          .eq('barbeiro', perfilBarbeiro.nome);

        if (porNome) {
          const mapaIds = new Map();
          [...resultadosTotais, ...porNome].forEach(item => {
            if (item && item.id) mapaIds.set(item.id, item);
          });
          resultadosTotais = Array.from(mapaIds.values());
        }
      }

      resultadosTotais.sort((a, b) => {
        const dataA = new Date(a.data_hora || a.data || a.created_at || 0);
        const dataB = new Date(b.data_hora || b.data || b.created_at || 0);
        return dataB - dataA;
      });

      setAgendamentos(resultadosTotais);
      setLoading(false);
    }

    carregarPainelDoBarbeiro();

    const subscription = supabase
      .channel('barbeiro-comissao-channel')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'barbeiros' }, (payload) => {
        if (payload.new && (payload.new.comissao !== undefined || payload.new.comissao_padrao !== undefined)) {
          setComissaoPercentual(payload.new.comissao ?? payload.new.comissao_padrao ?? 50);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Filtra os agendamentos com base no mês selecionado
  const agendamentosFiltrados = agendamentos.filter(item => {
    const rawData = item.data_hora || item.data || item.created_at;
    if (!rawData) return false;
    const anoMes = String(rawData).substring(0, 7);
    return anoMes === mesSelecionado;
  });

  // Cálculos de faturamento baseados apenas nos serviços concluídos do mês filtrado
  const totalFaturado = agendamentosFiltrados
    .filter(item => {
      const s = item.status?.toLowerCase() || '';
      return s.includes('concluido') || s.includes('concluído') || s.includes('realizado');
    })
    .reduce((acc, item) => {
      const preco = Number(item.valor_total || item.preco || item.servicos?.preco || item.servico?.preco || 0);
      return acc + preco;
    }, 0);

  const valorComissaoReceber = totalFaturado * (comissaoPercentual / 100);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 text-stone-400 text-xs font-medium">
        Carregando painel restrito...
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto h-screen flex flex-col p-4 sm:p-6 bg-stone-50 font-sans overflow-hidden gap-6">
      
      {/* HEADER FIXO NO TOPO COM AS BORDAS ORIGINAIS */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200/60 shadow-sm space-y-4 shrink-0">
        <div className="flex justify-between items-start gap-2">
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Área do Profissional</span>
            <h2 className="text-xl font-bold text-stone-900 mt-0.5">Olá, {nomeBarbeiro || 'Profissional'}</h2>
          </div>
          <span className="bg-stone-100 text-stone-700 text-[11px] font-semibold px-3 py-1 rounded-full shrink-0">
            {comissaoPercentual}% comissão
          </span>
        </div>

        {/* Seletor de Mês */}
        <div className="flex items-center justify-between bg-stone-50 px-4 py-2.5 rounded-2xl border border-stone-100">
          <span className="text-xs font-medium text-stone-600">Filtrar por Mês:</span>
          <input 
            type="month" 
            value={mesSelecionado}
            onChange={(e) => setMesSelecionado(e.target.value)}
            className="bg-white border border-stone-200 text-stone-800 text-xs font-semibold px-3 py-1.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-400 cursor-pointer"
          />
        </div>

        <div className="bg-emerald-50/60 border border-emerald-100/80 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-800/80 font-medium block">Comissão do Mês</span>
            <span className="text-[10px] text-emerald-600/70">Baseada nos serviços concluídos</span>
          </div>
          <span className="text-2xl font-black text-emerald-600">
            R$ {valorComissaoReceber.toFixed(2)}
          </span>
        </div>
      </div>

      {/* CONTAINER DOS ATENDIMENTOS COM BORDAS E SCROLL INTERNO */}
      <div className="bg-white rounded-3xl border border-stone-200/60 shadow-sm p-6 flex-1 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center pb-4 shrink-0">
          <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wide">Atendimentos do Mês</h3>
          <span className="text-xs text-stone-400 font-medium">{agendamentosFiltrados.length} encontrados</span>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          {agendamentosFiltrados.length === 0 ? (
            <div className="py-12 text-center text-stone-400 text-xs">
              Nenhum agendamento encontrado para este mês.
            </div>
          ) : (
            <div className="space-y-3">
              {agendamentosFiltrados.map((item) => {
                const cliente = item.cliente_nome || item.cliente?.nome || item.clientes?.nome || item.nome_cliente || item.cliente || 'Cliente sem nome';
                const servico = item.servico_nome || item.servico?.nome || item.servicos?.nome || item.nome_servico || item.servico || 'Serviço';
                const valor = Number(item.valor_total || item.preco || item.servicos?.preco || item.servico?.preco || 0);
                const status = (item.status || 'AGENDADO').toUpperCase();
                
                let dataFormatada = '';
                const rawData = item.data_hora || item.data || item.created_at;
                if (rawData) {
                  try {
                    const dataObj = new Date(rawData);
                    dataFormatada = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' às ' + dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  } catch (e) {
                    dataFormatada = rawData;
                  }
                }

                const isConcluido = status.includes('CONCLU') || status.includes('REALIZADO');

                return (
                  <div key={item.id} className="p-4 rounded-2xl border border-stone-100 bg-stone-50/50 hover:bg-stone-50 transition-colors flex justify-between items-center text-xs gap-3">
                    <div className="space-y-1 overflow-hidden">
                      <span className="font-bold text-stone-900 block truncate">{cliente}</span>
                      <span className="text-stone-600 font-medium block truncate">{servico}</span>
                      {dataFormatada && <span className="text-[10px] text-stone-400 block">{dataFormatada}</span>}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-stone-900 block">R$ {valor.toFixed(2)}</span>
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md inline-block mt-1 tracking-wide ${
                        isConcluido 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}