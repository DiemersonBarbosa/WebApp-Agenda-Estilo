'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, Search, Plus, Trash2, Check, User, 
  CreditCard, Banknote, QrCode, X, Scissors, Package, Lock, Unlock, BarChart3, ShieldCheck 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function PDVBarbearia({ barbeariaId }) {
  const [busca, setBusca] = useState('');
  const [produtosServicos, setProdutosServicos] = useState([]);
  const [resultadosBusca, setResultadosBusca] = useState([]);
  const [comanda, setComanda] = useState([]);
  const [nomeCliente, setNomeCliente] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('dinheiro');
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [caixaAberto, setCaixaAberto] = useState(true);

  // Estados para o Fechamento de Caixa
  const [modalFechamentoAberto, setModalFechamentoAberto] = useState(false);
  const [vendasDoDia, setVendasDoDia] = useState([]);
  
  const searchRef = useRef(null);

  useEffect(() => {
    async function carregarDados() {
      if (!barbeariaId) return;
      try {
        const [resServicos, resProdutos, resVendas] = await Promise.all([
          supabase.from('servicos').select('id, nome, preco').eq('barbearia_id', barbeariaId),
          supabase.from('produtos').select('id, nome, preco, estoque').eq('barbearia_id', barbeariaId),
          supabase.from('vendas_pdv').select('*').eq('barbearia_id', barbeariaId)
        ]);

        const listaServicos = (resServicos.data || []).map(s => ({ ...s, tipo: 'servico' }));
        const listaProdutos = (resProdutos.data || []).map(p => ({ ...p, tipo: 'produto' }));

        setProdutosServicos([...listaServicos, ...listaProdutos]);

        if (resVendas.data) {
          const hojeStr = new Date().toISOString().split('T')[0];
          const vendasHoje = resVendas.data.filter(v => {
            const dataVenda = new Date(v.criado_em).toISOString().split('T')[0];
            return dataVenda === hojeStr;
          });
          setVendasDoDia(vendasHoje);
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      }
    }
    carregarDados();
  }, [barbeariaId]);

  useEffect(() => {
    if (!busca.trim()) {
      setResultadosBusca([]);
      setDropdownAberto(false);
      return;
    }

    const filtrados = produtosServicos.filter(item => 
      item.nome.toLowerCase().includes(busca.toLowerCase())
    );
    setResultadosBusca(filtrados);
    setDropdownAberto(true);
  }, [busca, produtosServicos]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setDropdownAberto(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const adicionarItem = (item) => {
    if (!caixaAberto) return;
    setComanda(prev => {
      const existe = prev.find(i => i.id === item.id && i.tipo === item.tipo);
      if (existe) {
        return prev.map(i => i.id === item.id && i.tipo === item.tipo ? { ...i, quantidade: i.quantidade + 1 } : i);
      }
      return [...prev, { ...item, quantidade: 1 }];
    });
    setBusca('');
    setDropdownAberto(false);
  };

  const alterarQuantidade = (id, tipo, delta) => {
    setComanda(prev => prev.map(item => {
      if (item.id === id && item.tipo === tipo) {
        const novaQtd = item.quantidade + delta;
        return novaQtd > 0 ? { ...item, quantidade: novaQtd } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const removerItem = (id, tipo) => {
    setComanda(prev => prev.filter(i => !(i.id === id && i.tipo === tipo)));
  };

  const totalComanda = comanda.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);

  const finalizarVenda = async () => {
    if (comanda.length === 0 || !caixaAberto || !barbeariaId) return;
    setCarregando(true);

    try {
      const itensFormatados = comanda.map(i => ({
        id: i.id,
        nome: i.nome,
        tipo: i.tipo,
        quantidade: i.quantidade,
        preco_unitario: i.preco,
        subtotal: i.preco * i.quantidade
      }));

      const novaVenda = {
        barbearia_id: barbeariaId,
        cliente_nome: nomeCliente || 'Cliente Balcão',
        total: totalComanda,
        forma_pagamento: formaPagamento,
        itens: itensFormatados,
        criado_em: new Date().toISOString()
      };

      const { data, error: vendaError } = await supabase
        .from('vendas_pdv')
        .insert([novaVenda])
        .select();

      if (vendaError) throw vendaError;

      if (data) {
        setVendasDoDia(prev => [data[0], ...prev]);
      }

      for (const item of comanda) {
        if (item.tipo === 'produto') {
          const { data: prodBanco, error: errBusca } = await supabase
            .from('produtos')
            .select('estoque')
            .eq('id', item.id)
            .single();

          if (!errBusca && prodBanco) {
            const novoEstoque = Math.max(0, prodBanco.estoque - item.quantidade);
            await supabase
              .from('produtos')
              .update({ estoque: novoEstoque })
              .eq('id', item.id);
          }
        }
      }

      setSucesso(true);
      setTimeout(() => {
        setComanda([]);
        setNomeCliente('');
        setSucesso(false);
        setCarregando(false);
      }, 1500);

    } catch (err) {
      console.error('Erro ao finalizar venda no PDV:', err.message);
      alert('Erro ao finalizar venda: ' + err.message);
      setCarregando(false);
    }
  };

  const totalDinheiro = vendasDoDia
    .filter(v => v.forma_pagamento?.toLowerCase() === 'dinheiro')
    .reduce((acc, v) => acc + Number(v.total), 0);

  const totalCartao = vendasDoDia
    .filter(v => v.forma_pagamento?.toLowerCase() === 'cartao' || v.forma_pagamento?.toLowerCase() === 'cartão')
    .reduce((acc, v) => acc + Number(v.total), 0);

  const totalPix = vendasDoDia
    .filter(v => v.forma_pagamento?.toLowerCase() === 'pix')
    .reduce((acc, v) => acc + Number(v.total), 0);

  const faturamentoTotalDia = totalDinheiro + totalCartao + totalPix;

  return (
    <div className="w-full max-w-md mx-auto flex flex-col justify-between h-[calc(100vh-7.5rem)] px-3 pb-20 pt-2 text-stone-900 font-sans select-none">
      
      {/* TOPO: TÍTULO ACIMA DE TUDO + AÇÕES ALINHADAS */}
      <div className="space-y-2 shrink-0">
        
        {/* Linha 1: Título Principal Grande e Sem Cortes */}
        <div className="flex items-center gap-2.5 px-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-stone-900 to-stone-950 text-white flex items-center justify-center shadow-md shrink-0">
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
          </div>
          <h1 className="text-base font-black text-stone-900 tracking-tight">
            Frente de Caixa
          </h1>
        </div>

        {/* Linha 2: Barra de Status (Aberto/Fechado à esquerda) e Resumo (à direita) */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-white/90 backdrop-blur-md rounded-2xl border border-stone-200/80 shadow-2xs">
          
          {/* Esquerda: Status do Caixa */}
          <button
            type="button"
            onClick={() => setCaixaAberto(!caixaAberto)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              caixaAberto 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100' 
                : 'bg-rose-50 text-rose-700 border border-rose-200/80 hover:bg-rose-100'
            }`}
          >
            {caixaAberto ? <Unlock className="w-3.5 h-3.5 text-emerald-600" /> : <Lock className="w-3.5 h-3.5 text-rose-600" />}
            <span>{caixaAberto ? 'Caixa Aberto' : 'Caixa Fechado'}</span>
          </button>

          {/* Direita: Botão Resumo */}
          <button
            type="button"
            onClick={() => setModalFechamentoAberto(true)}
            className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Resumo</span>
          </button>

        </div>

        {/* CAMPO DE BUSCA COM AUTOCOMPLETE */}
        <div className="relative" ref={searchRef}>
          <div className="flex items-center bg-white border border-stone-200/90 rounded-2xl px-3.5 py-2.5 shadow-2xs focus-within:border-stone-900 transition-all">
            <Search className="w-4 h-4 text-stone-400 mr-2.5 shrink-0" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onFocus={() => { if (busca.trim() && caixaAberto) setDropdownAberto(true); }}
              placeholder={caixaAberto ? "Pesquisar produto ou serviço..." : "Caixa fechado"}
              disabled={!caixaAberto}
              className="w-full bg-transparent text-xs font-bold text-stone-900 placeholder:text-stone-400 focus:outline-none disabled:cursor-not-allowed"
            />
            {busca && (
              <button onClick={() => { setBusca(''); setDropdownAberto(false); }} className="text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {dropdownAberto && resultadosBusca.length > 0 && caixaAberto && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-stone-200 rounded-2xl shadow-xl max-h-44 overflow-y-auto z-50 divide-y divide-stone-50">
              {resultadosBusca.map((item) => (
                <button
                  key={`${item.tipo}-${item.id}`}
                  onClick={() => adicionarItem(item)}
                  className="w-full px-3.5 py-2 text-left flex items-center justify-between hover:bg-stone-50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                      item.tipo === 'servico' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {item.tipo === 'servico' ? <Scissors className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-stone-800 group-hover:text-stone-950 truncate">{item.nome}</p>
                      <span className="text-[9px] text-stone-400 font-semibold uppercase">
                        {item.tipo} {item.tipo === 'produto' && `• Estoque: ${item.estoque}`}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-stone-900 shrink-0 ml-2">
                    R$ {Number(item.preco).toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CORPO: CLIENTE & COMANDA */}
      <div className="flex-1 flex flex-col justify-between space-y-2 my-2">
        
        {/* Cliente Opcional */}
        <div className="flex items-center bg-white border border-stone-200/90 rounded-2xl px-3.5 py-2 shadow-2xs shrink-0">
          <User className="w-3.5 h-3.5 text-stone-400 mr-2.5 shrink-0" />
          <input
            type="text"
            value={nomeCliente}
            onChange={(e) => setNomeCliente(e.target.value)}
            placeholder="Nome do cliente (Opcional)..."
            disabled={!caixaAberto}
            className="w-full bg-transparent text-xs font-medium text-stone-800 placeholder:text-stone-400 focus:outline-none truncate disabled:cursor-not-allowed"
          />
        </div>

        {/* Lista de Itens na Comanda */}
        <div className="bg-white border border-stone-200/90 rounded-2xl p-3 flex flex-col shadow-2xs flex-1 max-h-40 overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100 shrink-0">
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Comanda Atual</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
              {comanda.reduce((acc, i) => acc + i.quantidade, 0)} itens
            </span>
          </div>

          <div className="overflow-y-auto divide-y divide-stone-50 pr-1 my-1.5 flex-1">
            {!caixaAberto ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-rose-500 py-3">
                <Lock className="w-6 h-6 stroke-1 mb-1 opacity-60" />
                <p className="text-xs font-bold">Caixa Fechado</p>
              </div>
            ) : comanda.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-stone-400 py-3">
                <ShoppingBag className="w-6 h-6 stroke-1 mb-1 opacity-30" />
                <p className="text-[11px] font-medium">Nenhum item adicionado</p>
              </div>
            ) : (
              comanda.map((item) => (
                <div key={`${item.tipo}-${item.id}`} className="py-2 flex items-center justify-between gap-2">
                  <div className="truncate flex-1">
                    <p className="text-xs font-bold text-stone-900 truncate">{item.nome}</p>
                    <p className="text-[9px] font-semibold text-stone-400">R$ {Number(item.preco).toFixed(2)} un</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center bg-stone-100 rounded-lg p-0.5 border border-stone-200/60">
                      <button 
                        onClick={() => alterarQuantidade(item.id, item.tipo, -1)}
                        className="w-4 h-4 flex items-center justify-center text-stone-600 hover:bg-white rounded font-bold text-xs"
                      >-</button>
                      <span className="w-5 text-center text-xs font-bold text-stone-800">{item.quantidade}</span>
                      <button 
                        onClick={() => alterarQuantidade(item.id, item.tipo, 1)}
                        className="w-4 h-4 flex items-center justify-center text-stone-600 hover:bg-white rounded font-bold text-xs"
                      >+</button>
                    </div>

                    <span className="text-xs font-black text-stone-900 w-12 text-right">
                      R$ {(item.preco * item.quantidade).toFixed(2)}
                    </span>

                    <button 
                      onClick={() => removerItem(item.id, item.tipo)}
                      className="text-rose-400 hover:text-rose-600 p-1 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* FORMA DE PAGAMENTO */}
        <div className="grid grid-cols-3 gap-2 shrink-0">
          {[
            { id: 'dinheiro', label: 'Dinheiro', icon: Banknote },
            { id: 'cartao', label: 'Cartão', icon: CreditCard },
            { id: 'pix', label: 'PIX', icon: QrCode },
          ].map((pag) => {
            const Icon = pag.icon;
            const ativo = formaPagamento === pag.id;
            return (
              <button
                key={pag.id}
                type="button"
                disabled={!caixaAberto}
                onClick={() => setFormaPagamento(pag.id)}
                className={`py-2 px-2 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  ativo 
                    ? 'bg-stone-900 text-white border-stone-900 shadow-sm' 
                    : 'bg-white text-stone-700 border-stone-200/80 hover:bg-stone-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${ativo ? 'text-emerald-400' : 'text-stone-500'}`} />
                <span>{pag.label}</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* RODAPÉ: TOTAL & BOTÃO DE CONFIRMAÇÃO */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-3 shadow-md shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Total a Pagar</span>
          <span className="text-sm font-black text-stone-900 tracking-tight">
            R$ {totalComanda.toFixed(2)}
          </span>
        </div>

        <button
          type="button"
          disabled={comanda.length === 0 || carregando || !caixaAberto}
          onClick={finalizarVenda}
          className={`w-full py-2.5 rounded-xl text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            sucesso ? 'bg-emerald-600' : 'bg-stone-900 hover:bg-stone-800'
          }`}
        >
          {sucesso ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>Venda Confirmada!</span>
            </>
          ) : carregando ? (
            <span className="animate-pulse">Processando...</span>
          ) : (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Confirmar Venda • R$ {totalComanda.toFixed(2)}</span>
            </>
          )}
        </button>
      </div>

      {/* MODAL MODERNO DE FECHAMENTO DE CAIXA */}
      {modalFechamentoAberto && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl space-y-5 border border-stone-100">
            
            {/* Header do Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-stone-900">Resumo do Caixa</h3>
                  <p className="text-[10px] text-stone-400 font-medium">Entradas registradas hoje</p>
                </div>
              </div>
              <button 
                onClick={() => setModalFechamentoAberto(false)} 
                className="text-stone-400 hover:text-stone-600 p-1.5 rounded-xl hover:bg-stone-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Faturamento Total Destaque */}
            <div className="bg-stone-900 text-white rounded-2xl p-4 text-center space-y-1 shadow-md">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-400">Faturamento Total do Dia</span>
              <h2 className="text-2xl font-black text-emerald-400 tracking-tight">R$ {faturamentoTotalDia.toFixed(2)}</h2>
              <p className="text-[10px] text-stone-300">{vendasDoDia.length} transação(ões) realizada(s)</p>
            </div>

            {/* Detalhes por Forma de Pagamento */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 block px-1">Detalhamento por Método</span>
              
              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Banknote className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-stone-800">Dinheiro</span>
                </div>
                <span className="text-xs font-black text-stone-900">R$ {totalDinheiro.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <CreditCard className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-stone-800">Cartão</span>
                </div>
                <span className="text-xs font-black text-stone-900">R$ {totalCartao.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                    <QrCode className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-stone-800">PIX</span>
                </div>
                <span className="text-xs font-black text-stone-900">R$ {totalPix.toFixed(2)}</span>
              </div>
            </div>

            {/* Botão Fechar Modal */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setModalFechamentoAberto(false)}
                className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer"
              >
                Concluir / Voltar ao PDV
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}