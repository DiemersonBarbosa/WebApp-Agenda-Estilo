import React, { useRef } from 'react';

export default function RelatoriosPage({ agendamentos = [], despesas = [], barbeiros = [], servicos = [], barbearia = {} }) {
  const scrollContainerRef = useRef(null);

  const handleExportarPDF = () => {
    window.print();
  };

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

  const atendimentosConcluidos = Array.isArray(agendamentos) 
    ? agendamentos.filter(item => {
        const status = (item.status || '').toLowerCase();
        return status === 'concluido' || status === 'concluida' || status === 'realizado' || status === 'finalizado';
      }) 
    : [];

  const atendimentosCancelados = Array.isArray(agendamentos) 
    ? agendamentos.filter(item => {
        const status = (item.status || '').toLowerCase();
        return status === 'cancelado' || status === 'cancelada';
      }) 
    : [];
  
  const faturamentoTotal = atendimentosConcluidos.reduce((acc, item) => acc + getValorServico(item), 0);
  
  const custosTotais = Array.isArray(despesas) 
    ? despesas.reduce((acc, item) => acc + Number(item.valor || item.preco || item.custo || 0), 0) 
    : 0;
  
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
    <div className="space-y-6 pb-24 px-2 sm:px-0">
      
      {/* Cabeçalho da Barbearia exclusivo para o PDF */}
      <div className="hidden print:flex items-center gap-3 pb-4 border-b border-stone-200">
        {barbearia?.logo || barbearia?.logo_url ? (
          <img 
            src={barbearia.logo || barbearia.logo_url} 
            alt="Logo" 
            className="w-10 h-10 rounded-xl object-cover border border-stone-200"
          />
        ) : (
          <div className="w-10 h-10 bg-stone-900 text-white rounded-xl flex items-center justify-center font-bold">
            {(barbearia?.nome || 'B').charAt(0)}
          </div>
        )}
        <div>
          <h2 className="text-base font-bold text-stone-900">{barbearia?.nome || 'Minha Barbearia'}</h2>
          <p className="text-xs text-stone-500">Relatório Financeiro & Operacional Completo</p>
        </div>
      </div>

      {/* Cabeçalho padrão da tela */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200/80 shadow-sm">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-stone-900">Relatório Financeiro & Operacional</h3>
          <p className="text-[11px] sm:text-xs text-stone-400">Visão completa de entradas, saídas e comissões.</p>
        </div>
        <button 
          onClick={handleExportarPDF}
          className="bg-stone-900 hover:bg-stone-800 text-white px-4 py-2.5 rounded-2xl text-xs font-semibold transition-colors cursor-pointer"
        >
          Exportar Relatório PDF
        </button>
      </div>

      {/* Cards de Indicadores (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-stone-200/80 shadow-sm space-y-1">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-stone-400">Faturamento</span>
          <div className="text-lg sm:text-2xl font-black text-stone-950 truncate">R$ {faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <p className="text-[10px] text-emerald-600 font-medium">{atendimentosConcluidos.length} concluídos</p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-stone-200/80 shadow-sm space-y-1">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-stone-400">Despesas</span>
          <div className="text-lg sm:text-2xl font-black text-stone-950 truncate">R$ {custosTotais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <p className="text-[10px] text-rose-600 font-medium">{despesas.length} cadastradas</p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-stone-200/80 shadow-sm space-y-1">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-stone-400">Lucro Líquido</span>
          <div className={`text-lg sm:text-2xl font-black truncate ${lucroLiquidoReal >= 0 ? 'text-sky-600' : 'text-rose-600'}`}>
            R$ {lucroLiquidoReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-stone-400 font-medium">Entradas - Saídas</p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-stone-200/80 shadow-sm space-y-1">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-stone-400">Ticket Médio</span>
          <div className="text-lg sm:text-2xl font-black text-stone-950 truncate">R$ {ticketMedioCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <p className="text-[10px] text-stone-400 font-medium">Média por atendimento</p>
        </div>
      </div>

      {/* =========================================================
          SEÇÃO 1: ATENDIMENTOS REALIZADOS
          ========================================================= */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm p-4 sm:p-6 space-y-4">
        <h4 className="font-bold text-stone-900 text-xs sm:text-sm">Atendimentos Realizados</h4>
        {atendimentosConcluidos.length === 0 ? (
          <p className="text-xs text-stone-400 py-4 text-center">Nenhum atendimento concluído registrado.</p>
        ) : (
          <>
            {/* Visualização em Cards Fluidos (Perfeito para Celular / some no PC e PDF) */}
            <div className="print:hidden sm:hidden space-y-3">
              {atendimentosConcluidos.map((item, index) => (
                <div key={index} className="p-3.5 rounded-2xl bg-stone-50/80 border border-stone-100 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-stone-900 text-xs block">{getNomeCliente(item)}</span>
                      <span className="text-[11px] text-stone-500">{getNomeServico(item)}</span>
                    </div>
                    <span className="font-black text-emerald-600 text-xs">R$ {getValorServico(item).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-stone-200/60 text-[11px] text-stone-400">
                    <span>👤 {getNomeBarbeiro(item)}</span>
                    <span>📅 {item.data_hora ? new Date(item.data_hora).toLocaleDateString('pt-BR') : 'N/A'}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Visualização em Tabela (Visível no PC e no PDF) */}
            <div className="hidden print:block sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-500 uppercase font-semibold border-b border-stone-100">
                  <tr>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Serviço</th>
                    <th className="p-3">Profissional</th>
                    <th className="p-3">Data</th>
                    <th className="p-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {atendimentosConcluidos.map((item, index) => (
                    <tr key={index} className="hover:bg-stone-50/50">
                      <td className="p-3 font-bold text-stone-900">{getNomeCliente(item)}</td>
                      <td className="p-3 text-stone-600">{getNomeServico(item)}</td>
                      <td className="p-3 text-stone-600">{getNomeBarbeiro(item)}</td>
                      <td className="p-3 text-stone-500">{item.data_hora ? new Date(item.data_hora).toLocaleDateString('pt-BR') : 'N/A'}</td>
                      <td className="p-3 text-right font-extrabold text-emerald-600">R$ {getValorServico(item).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* =========================================================
          SEÇÃO 2: COMISSÕES
          ========================================================= */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm p-4 sm:p-6 space-y-4">
        <h4 className="font-bold text-stone-900 text-xs sm:text-sm">Resumo de Comissões por Profissional</h4>
        {comissoesPorBarbeiro.length === 0 ? (
          <p className="text-xs text-stone-400 py-4 text-center">Nenhum dado de comissão disponível.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {comissoesPorBarbeiro.map((barb, idx) => (
              <div key={idx} className="bg-stone-50/70 p-4 rounded-2xl border border-stone-200/70 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-stone-900 text-xs sm:text-sm">{barb.nome}</span>
                  <span className="text-[10px] bg-stone-200/80 px-2 py-0.5 rounded-full font-semibold text-stone-700">{barb.quantidade} atendimentos</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-stone-500">
                    <span>Faturamento gerado:</span>
                    <span className="font-semibold text-stone-800">R$ {barb.faturamento.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-stone-500">
                    <span>Comissão ({Math.round(barb.taxa * 100)}%):</span>
                    <span className="font-bold text-emerald-600">R$ {barb.comissaoEstimada.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =========================================================
          SEÇÃO 3: DESPESAS
          ========================================================= */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm p-4 sm:p-6 space-y-4">
        <h4 className="font-bold text-stone-900 text-xs sm:text-sm">Detalhamento de Custos e Despesas</h4>
        {despesas.length === 0 ? (
          <p className="text-xs text-stone-400 py-4 text-center">Nenhuma despesa cadastrada.</p>
        ) : (
          <>
            {/* Cards para celular */}
            <div className="print:hidden sm:hidden space-y-3">
              {despesas.map((item, index) => (
                <div key={index} className="p-3.5 rounded-2xl bg-stone-50/80 border border-stone-100 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-stone-900 text-xs block">{item.descricao || item.nome || 'Despesa'}</span>
                    <span className="text-[10px] text-stone-400">{item.categoria || 'Geral'} • {item.data ? new Date(item.data).toLocaleDateString('pt-BR') : 'N/A'}</span>
                  </div>
                  <span className="font-black text-rose-600 text-xs">R$ {Number(item.valor || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Tabela para PC / PDF */}
            <div className="hidden print:block sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-500 uppercase font-semibold border-b border-stone-100">
                  <tr>
                    <th className="p-3">Descrição</th>
                    <th className="p-3">Categoria</th>
                    <th className="p-3">Data</th>
                    <th className="p-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {despesas.map((item, index) => (
                    <tr key={index} className="hover:bg-stone-50/50">
                      <td className="p-3 font-bold text-stone-900">{item.descricao || item.nome || 'Despesa'}</td>
                      <td className="p-3 text-stone-600">{item.categoria || 'Geral'}</td>
                      <td className="p-3 text-stone-500">{item.data ? new Date(item.data).toLocaleDateString('pt-BR') : 'N/A'}</td>
                      <td className="p-3 text-right font-extrabold text-rose-600">R$ {Number(item.valor || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* =========================================================
          SEÇÃO 4: CANCELADOS
          ========================================================= */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm p-4 sm:p-6 space-y-4">
        <h4 className="font-bold text-stone-900 text-xs sm:text-sm">Histórico de Agendamentos Cancelados</h4>
        {atendimentosCancelados.length === 0 ? (
          <p className="text-xs text-stone-400 py-4 text-center">Nenhum agendamento cancelado.</p>
        ) : (
          <>
            {/* Cards para celular */}
            <div className="print:hidden sm:hidden space-y-3">
              {atendimentosCancelados.map((item, index) => (
                <div key={index} className="p-3.5 rounded-2xl bg-stone-50/80 border border-stone-100 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-stone-900 text-xs block">{getNomeCliente(item)}</span>
                      <span className="text-[11px] text-stone-500">{getNomeServico(item)}</span>
                    </div>
                    <span className="font-bold text-stone-400 text-xs line-through">R$ {getValorServico(item).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-stone-200/60 text-[11px] text-stone-400">
                    <span>👤 {getNomeBarbeiro(item)}</span>
                    <span>📅 {item.data_hora ? new Date(item.data_hora).toLocaleDateString('pt-BR') : 'N/A'}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Tabela para PC / PDF */}
            <div className="hidden print:block sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-500 uppercase font-semibold border-b border-stone-100">
                  <tr>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Serviço</th>
                    <th className="p-3">Profissional</th>
                    <th className="p-3">Data</th>
                    <th className="p-3 text-right">Valor Perdido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {atendimentosCancelados.map((item, index) => (
                    <tr key={index} className="hover:bg-stone-50/50">
                      <td className="p-3 font-bold text-stone-900">{getNomeCliente(item)}</td>
                      <td className="p-3 text-stone-600">{getNomeServico(item)}</td>
                      <td className="p-3 text-stone-600">{getNomeBarbeiro(item)}</td>
                      <td className="p-3 text-stone-500">{item.data_hora ? new Date(item.data_hora).toLocaleDateString('pt-BR') : 'N/A'}</td>
                      <td className="p-3 text-right font-bold text-stone-400 line-through">R$ {getValorServico(item).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

    </div>
  );
}