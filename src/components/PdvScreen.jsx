'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, DollarSign, CreditCard, QrCode, CheckCircle, X, Search, Clock, ShieldCheck, Package } from 'lucide-react';

export default function PdvScreen({ barbeariaId, supabase, produtos: produtosProp = [], onReload }) {
  const [busca, setBusca] = useState('');
  const [produtosLocal, setProdutosLocal] = useState(produtosProp);
  const [carrinho, setCarrinho] = useState([]);
  const [clienteNome, setClienteNome] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('dinheiro');
  const [modalFechamentoAberto, setModalFechamentoAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [vendasPdV, setVendasPdV] = useState([]);

  useEffect(() => {
    if (produtosProp && produtosProp.length > 0) {
      setProdutosLocal(produtosProp);
    }
  }, [produtosProp]);

  useEffect(() => {
    if (barbeariaId && supabase) {
      carregarVendasPdV();
      if (!produtosProp || produtosProp.length === 0) {
        carregarProdutosDireto();
      }
    }
  }, [barbeariaId, supabase]);

  const carregarProdutosDireto = async () => {
    if (!supabase || !barbeariaId) return;
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('barbearia_id', barbeariaId);

    if (!error && data) {
      setProdutosLocal(data);
    }
  };

  const carregarVendasPdV = async () => {
    if (!supabase || !barbeariaId) return;
    const { data, error } = await supabase
      .from('vendas_pdv')
      .select('*')
      .eq('barbearia_id', barbeariaId)
      .order('criado_em', { ascending: false });

    if (!error && data) {
      setVendasPdV(data);
    }
  };

  // Correção de fuso horário local até meia-noite
  const obterDataLocalIso = (d = new Date()) => {
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  const extrairDataIso = (item) => {
    const dataStr = item.criado_em || '';
    if (!dataStr) return '';
    try {
      const d = new Date(dataStr);
      return obterDataLocalIso(d);
    } catch {
      return String(dataStr).substring(0, 10);
    }
  };

  const hojeStr = obterDataLocalIso();
  const vendasHoje = vendasPdV.filter(v => extrairDataIso(v) === hojeStr);

  const faturamentoTotalDia = vendasHoje.reduce((acc, v) => acc + Number(v.total), 0);
  const totalDinheiro = vendasHoje.filter(v => v.forma_pagamento === 'dinheiro').reduce((acc, v) => acc + Number(v.total), 0);
  const totalCartao = vendasHoje.filter(v => v.forma_pagamento === 'cartao').reduce((acc, v) => acc + Number(v.total), 0);
  const totalPix = vendasHoje.filter(v => v.forma_pagamento === 'pix').reduce((acc, v) => acc + Number(v.total), 0);

  const adicionarAoCarrinho = (produto) => {
    if (Number(produto.estoque || 0) <= 0) {
      alert('Produto esgotado!');
      return;
    }

    setCarrinho(prev => {
      const itemExistente = prev.find(item => item.id === produto.id);
      if (itemExistente) {
        if (itemExistente.quantidade >= Number(produto.estoque)) {
          alert('Quantidade máxima em estoque atingida.');
          return prev;
        }
        return prev.map(item =>
          item.id === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item
        );
      }
      return [...prev, { ...produto, quantidade: 1 }];
    });

    // Limpa a busca e esconde a lista de produtos imediatamente após adicionar
    setBusca('');
  };

  const alterarQuantidade = (id, delta) => {
    setCarrinho(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const novaQtd = item.quantidade + delta;
          if (novaQtd <= 0) return null;
          if (novaQtd > Number(item.estoque || 999)) {
            alert('Estoque insuficiente.');
            return item;
          }
          return { ...item, quantidade: novaQtd };
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removerDoCarrinho = (id) => {
    setCarrinho(prev => prev.filter(item => item.id !== id));
  };

  const valorTotalCarrinho = carrinho.reduce((acc, item) => acc + (Number(item.preco) * item.quantidade), 0);
  const totalItensCarrinho = carrinho.reduce((acc, item) => acc + item.quantidade, 0);

  const finalizarVenda = async () => {
    if (carrinho.length === 0) {
      alert('O carrinho está vazio.');
      return;
    }

    setSalvando(true);

    const dadosVenda = {
      barbearia_id: barbeariaId,
      cliente_nome: clienteNome.trim() || 'Cliente Balcão',
      forma_pagamento: formaPagamento,
      total: valorTotalCarrinho,
      itens: carrinho.map(i => ({ id: i.id, nome: i.nome, preco: i.preco, quantidade: i.quantidade }))
    };

    const { error } = await supabase.from('vendas_pdv').insert([dadosVenda]);

    if (error) {
      alert('Erro ao registrar venda: ' + error.message);
      setSalvando(false);
      return;
    }

    for (const item of carrinho) {
      const novoEstoque = Math.max(0, Number(item.estoque || 0) - item.quantidade);
      await supabase.from('produtos').update({ estoque: novoEstoque }).eq('id', item.id);
    }

    setSalvando(false);
    setCarrinho([]);
    setClienteNome('');
    setBusca('');
    carregarVendasPdV();
    carregarProdutosDireto();
    if (onReload) onReload();
    alert('Venda realizada com sucesso!');
  };

  // Os produtos só aparecem se houver texto digitado na busca
  const produtosFiltrados = produtosLocal.filter(p => {
    if (!busca.trim()) return false;
    const termo = busca.toLowerCase().trim();
    const nomeProd = (p.nome || '').toLowerCase();
    const catProd = (p.categoria || '').toLowerCase();
    return nomeProd.includes(termo) || catProd.includes(termo);
  });

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-0 space-y-4 pb-28 font-sans">
      
      {/* HEADER DO PDV */}
      <div 
        className="relative rounded-3xl p-4 sm:p-5 border border-white/80 overflow-hidden shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3"
        style={{
          background: 'linear-gradient(135deg, #f7f9f8 0%, #edf1f0 50%, #e2e8e6 100%)',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05), inset 0 2px 3px rgba(255, 255, 255, 0.9)'
        }}
      >
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-2xl bg-stone-900 text-white flex items-center justify-center shadow-md shrink-0">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-stone-900 tracking-tight">PDV / Frente de Caixa</h3>
            <p className="text-[11px] text-stone-500">Vendas rápidas e controle de balcão.</p>
          </div>
        </div>

        <button
          onClick={() => setModalFechamentoAberto(true)}
          className="w-full sm:w-auto px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer shrink-0"
        >
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>Resumo do Caixa (Hoje)</span>
        </button>
      </div>

      {/* CATÁLOGO DE PRODUTOS COMPACTO */}
      <div className="bg-white rounded-[2rem] border border-stone-200/85 shadow-sm p-4 space-y-2.5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <h4 className="font-black text-stone-900 text-xs tracking-wider uppercase">Catálogo de Produtos</h4>
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Digite o nome do produto..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:border-stone-900"
            />
          </div>
        </div>

        {!busca.trim() ? (
          <div className="py-4 text-center text-stone-400 text-xs border border-dashed border-stone-200 rounded-2xl flex items-center justify-center gap-2">
            <Package className="w-4 h-4 text-stone-300" />
            <span>Digite o nome do produto na busca para exibi-lo aqui.</span>
          </div>
        ) : produtosFiltrados.length === 0 ? (
          <div className="py-4 text-center text-stone-400 text-xs border border-dashed border-stone-200 rounded-2xl">
            Nenhum produto encontrado para &quot;{busca}&quot;.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
            {produtosFiltrados.map((prod) => {
              const estoqueQtd = Number(prod.estoque || 0);
              const esgotado = estoqueQtd <= 0;

              return (
                <div 
                  key={prod.id}
                  onClick={() => !esgotado && adicionarAoCarrinho(prod)}
                  className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                    esgotado ? 'bg-stone-100/60 border-stone-200 opacity-60 cursor-not-allowed' : 'bg-stone-50/80 hover:bg-stone-100/80 border-stone-200/80 cursor-pointer shadow-xs hover:border-stone-400'
                  }`}
                >
                  <div className="min-w-0 pr-1">
                    <h5 className="font-extrabold text-stone-900 text-xs truncate">{prod.nome}</h5>
                    <span className="text-[10px] text-stone-500 font-bold">R$ {Number(prod.preco).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${esgotado ? 'bg-rose-100 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {esgotado ? 'Esg.' : `${estoqueQtd} un.`}
                    </span>
                    {!esgotado && (
                      <span className="text-[10px] font-bold bg-stone-900 text-white px-2 py-1 rounded-lg shadow-xs">
                        + Adicionar
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ÁREA DE DESTAQUE: CARRINHO / CHECKOUT EXPANDIDO */}
      <div className="bg-white rounded-[2rem] border border-stone-200/85 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="pb-3 border-b border-stone-100 flex items-center justify-between">
          <h4 className="font-black text-stone-900 text-xs tracking-wider uppercase flex items-center gap-1.5">
            <ShoppingCart className="w-4 h-4 text-emerald-600" /> Carrinho de Compras ({totalItensCarrinho})
          </h4>
          {carrinho.length > 0 && (
            <button onClick={() => setCarrinho([])} className="text-xs font-bold text-rose-600 hover:underline">
              Limpar Carrinho
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Nome do Cliente (Opcional)</label>
            <input
              type="text"
              placeholder="Ex: João Silva..."
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-bold text-stone-900 focus:outline-none focus:border-stone-900"
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Forma de Pagamento</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'dinheiro', label: 'Dinheiro', icon: DollarSign },
                { id: 'cartao', label: 'Cartão', icon: CreditCard },
                { id: 'pix', label: 'PIX', icon: QrCode },
              ].map((metodo) => {
                const Icon = metodo.icon;
                const selecionado = formaPagamento === metodo.id;
                return (
                  <button
                    key={metodo.id}
                    type="button"
                    onClick={() => setFormaPagamento(metodo.id)}
                    className={`py-2 px-1 rounded-2xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      selecionado ? 'bg-stone-900 text-white border-stone-900 shadow-xs' : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{metodo.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* LISTA DE ITENS NO CARRINHO (Com mais espaço vertical) */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {carrinho.length === 0 ? (
            <div className="p-12 text-center text-stone-400 text-xs border border-dashed border-stone-200 rounded-2xl space-y-1">
              <ShoppingCart className="w-6 h-6 mx-auto text-stone-300" />
              <p>O carrinho está vazio.</p>
              <span className="text-[10px] text-stone-400 block">Pesquise e selecione produtos acima para adicioná-los aqui.</span>
            </div>
          ) : (
            carrinho.map((item) => (
              <div key={item.id} className="p-3 rounded-2xl bg-stone-50 border border-stone-200/70 flex items-center justify-between gap-3">
                <div className="min-w-0 pr-1">
                  <h6 className="font-extrabold text-stone-900 text-xs truncate">{item.nome}</h6>
                  <span className="text-xs text-stone-500 font-medium">R$ {Number(item.preco).toFixed(2)} un.</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
                    <button onClick={() => alterarQuantidade(item.id, -1)} className="p-1.5 hover:bg-stone-100 text-stone-600">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2.5 text-xs font-bold text-stone-900">{item.quantidade}</span>
                    <button onClick={() => alterarQuantidade(item.id, 1)} className="p-1.5 hover:bg-stone-100 text-stone-600">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button onClick={() => removerDoCarrinho(item.id)} className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-100">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* TOTAL E BOTÃO FINALIZAR */}
        <div className="space-y-3 pt-3 border-t border-stone-100">
          <div className="flex justify-between items-center text-sm font-black text-stone-900">
            <span>Total a Pagar:</span>
            <span className="text-emerald-600 text-base">R$ {valorTotalCarrinho.toFixed(2)}</span>
          </div>

          <button
            onClick={finalizarVenda}
            disabled={carrinho.length === 0 || salvando}
            className={`w-full py-3.5 rounded-2xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
              carrinho.length === 0 || salvando ? 'bg-stone-200 text-stone-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            {salvando ? 'Processando...' : 'Finalizar Venda'}
          </button>
        </div>
      </div>

      {/* MODAL DE RESUMO DO CAIXA (ATÉ MEIA-NOITE) */}
      {modalFechamentoAberto && (
        <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3.5 border-b border-stone-100">
              <div>
                <h4 className="font-black text-stone-900 text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" /> Resumo do Caixa
                </h4>
                <p className="text-xs text-stone-400 mt-0.5">Entradas registradas hoje até meia-noite.</p>
              </div>
              <button onClick={() => setModalFechamentoAberto(false)} className="text-stone-400 hover:text-stone-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div 
              className="rounded-3xl p-6 text-center space-y-1 shadow-md text-white"
              style={{
                background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4), inset 0 2px 2px rgba(255, 255, 255, 0.2)'
              }}
            >
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Faturamento Total do Dia</span>
              <h3 className="text-3xl font-black text-emerald-400">R$ {faturamentoTotalDia.toFixed(2)}</h3>
              <p className="text-xs text-stone-300 font-medium pt-1">{vendasHoje.length} transação(ões) realizada(s)</p>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 block">Detalhamento por Método</span>
              
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
                <span className="font-bold text-xs text-stone-700 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" /> Dinheiro
                </span>
                <span className="font-extrabold text-xs text-stone-900">R$ {totalDinheiro.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
                <span className="font-bold text-xs text-stone-700 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-600" /> Cartão
                </span>
                <span className="font-extrabold text-xs text-stone-900">R$ {totalCartao.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
                <span className="font-bold text-xs text-stone-700 flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-teal-600" /> PIX
                </span>
                <span className="font-extrabold text-xs text-stone-900">R$ {totalPix.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-stone-100">
              <button
                onClick={() => setModalFechamentoAberto(false)}
                className="w-full py-3 bg-[#111111] hover:bg-stone-800 text-white text-xs font-bold rounded-2xl shadow-md text-center cursor-pointer"
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
