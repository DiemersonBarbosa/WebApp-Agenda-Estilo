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
  const [notificacaoSucesso, setNotificacaoSucesso] = useState(false);

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

  const dispararNotificacao = () => {
    setNotificacaoSucesso(true);
    setTimeout(() => {
      setNotificacaoSucesso(false);
    }, 3000);
  };

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

    // Exibe a notificação customizada no lugar do alert do navegador
    dispararNotificacao();
  };

  const produtosFiltrados = produtosLocal.filter(p => {
    if (!busca.trim()) return false;
    const termo = busca.toLowerCase().trim();
    const nomeProd = (p.nome || '').toLowerCase();
    const catProd = (p.categoria || '').toLowerCase();
    return nomeProd.includes(termo) || catProd.includes(termo);
  });

  return (
    <div className="max-w-md mx-auto sm:max-w-4xl px-2 sm:px-0 space-y-3 pb-48 font-sans relative">
      
      {/* NOTIFICAÇÃO FLUTUANTE (TOAST DE SUCESSO) */}
      {notificacaoSucesso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-stone-900/95 backdrop-blur-md border border-stone-800 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3.5 pointer-events-auto">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h5 className="font-bold text-sm">Venda Realizada!</h5>
              <p className="text-[11px] text-stone-400">Registrada e estoque atualizado com sucesso.</p>
            </div>
          </div>
        </div>
      )}

      {/* HEADER DO PDV MOBILE */}
      <div className="bg-white rounded-2xl p-3.5 border border-stone-200 shadow-sm flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-xs">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold text-stone-900 tracking-tight">Frente de Caixa (PDV)</h3>
            <p className="text-[10px] text-stone-500">Toque para buscar e vender rápido.</p>
          </div>
        </div>

        <button
          onClick={() => setModalFechamentoAberto(true)}
          className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-stone-200"
        >
          <Clock className="w-3.5 h-3.5 text-emerald-600" />
          <span>Caixa Hoje</span>
        </button>
      </div>

      {/* BARRA DE BUSCA RÁPIDA DE PRODUTOS */}
      <div className="relative">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="🔍 Buscar produto por nome ou categoria..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-stone-300 rounded-2xl text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 shadow-xs"
          />
        </div>

        {/* LISTA FLUTUANTE DE RESULTADOS DA BUSCA */}
        {busca.trim() && (
          <div className="absolute left-0 right-0 top-14 bg-white rounded-2xl border border-stone-200 shadow-xl z-30 max-h-56 overflow-y-auto p-2 space-y-1">
            {produtosFiltrados.length === 0 ? (
              <div className="p-3 text-center text-stone-400 text-xs">
                Nenhum produto encontrado para &quot;{busca}&quot;.
              </div>
            ) : (
              produtosFiltrados.map((prod) => {
                const estoqueQtd = Number(prod.estoque || 0);
                const esgotado = estoqueQtd <= 0;

                return (
                  <div 
                    key={prod.id}
                    onClick={() => !esgotado && adicionarAoCarrinho(prod)}
                    className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                      esgotado ? 'bg-stone-100/50 border-stone-200 opacity-50 cursor-not-allowed' : 'bg-stone-50 hover:bg-stone-100 border-stone-200 cursor-pointer'
                    }`}
                  >
                    <div className="min-w-0 pr-1">
                      <h5 className="font-extrabold text-stone-900 text-xs truncate">{prod.nome}</h5>
                      <span className="text-[11px] text-stone-600 font-bold">R$ {Number(prod.preco).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${esgotado ? 'bg-rose-100 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {esgotado ? 'Esgotado' : `${estoqueQtd} em estoque`}
                      </span>
                      {!esgotado && (
                        <span className="text-[11px] font-bold bg-stone-900 text-white px-2.5 py-1 rounded-lg">
                          + Adicionar
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ÁREA DO CARRINHO E OPÇÕES */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <h4 className="font-black text-stone-900 text-xs tracking-wider uppercase flex items-center gap-1.5">
            <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" /> Itens no Carrinho ({totalItensCarrinho})
          </h4>
          {carrinho.length > 0 && (
            <button onClick={() => setCarrinho([])} className="text-[11px] font-bold text-rose-600 hover:underline">
              Esvaziar
            </button>
          )}
        </div>

        {/* NOME DO CLIENTE */}
        <div>
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Cliente (Opcional)</label>
          <input
            type="text"
            placeholder="Nome do cliente no balcão..."
            value={clienteNome}
            onChange={(e) => setClienteNome(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
          />
        </div>

        {/* LISTA DE PRODUTOS SELECIONADOS */}
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {carrinho.length === 0 ? (
            <div className="py-8 text-center text-stone-400 text-xs border border-dashed border-stone-200 rounded-xl space-y-1">
              <Package className="w-5 h-5 mx-auto text-stone-300" />
              <p>Nenhum item adicionado ainda.</p>
              <span className="text-[10px] text-stone-400">Use a busca acima para incluir produtos.</span>
            </div>
          ) : (
            carrinho.map((item) => (
              <div key={item.id} className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-2">
                <div className="min-w-0 pr-1">
                  <h6 className="font-extrabold text-stone-900 text-xs truncate">{item.nome}</h6>
                  <span className="text-[11px] text-stone-500 font-semibold">R$ {Number(item.preco).toFixed(2)} un.</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center bg-white border border-stone-200 rounded-lg overflow-hidden shadow-xs">
                    <button onClick={() => alterarQuantidade(item.id, -1)} className="p-1.5 hover:bg-stone-100 text-stone-700">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2 text-xs font-bold text-stone-900">{item.quantidade}</span>
                    <button onClick={() => alterarQuantidade(item.id, 1)} className="p-1.5 hover:bg-stone-100 text-stone-700">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button onClick={() => removerDoCarrinho(item.id)} className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* FORMA DE PAGAMENTO */}
        <div className="pt-2">
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1.5">Forma de Pagamento</label>
          <div className="grid grid-cols-3 gap-2">
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
                  className={`py-2.5 px-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    selecionado ? 'bg-stone-900 text-white border-stone-900 shadow-sm' : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{metodo.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* BARRA INFERIOR FIXA COM MARGEM SEGURA DA BARRA DE NAVEGAÇÃO MOBILE */}
      <div className="fixed bottom-20 left-3 right-3 bg-white/95 backdrop-blur-md border border-stone-200 p-3.5 z-30 shadow-xl rounded-2xl max-w-md mx-auto sm:max-w-4xl sm:bottom-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-extrabold text-stone-400 uppercase block">Total a Pagar</span>
            <span className="text-lg font-black text-emerald-600">R$ {valorTotalCarrinho.toFixed(2)}</span>
          </div>

          <button
            onClick={finalizarVenda}
            disabled={carrinho.length === 0 || salvando}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
              carrinho.length === 0 || salvando ? 'bg-stone-200 text-stone-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            {salvando ? 'Processando...' : 'Finalizar Venda Agora'}
          </button>
        </div>
      </div>

      {/* MODAL DE RESUMO DO CAIXA */}
      {modalFechamentoAberto && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h4 className="font-black text-stone-900 text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" /> Resumo do Caixa (Hoje)
                </h4>
                <p className="text-[11px] text-stone-400">Valores consolidados até o momento.</p>
              </div>
              <button onClick={() => setModalFechamentoAberto(false)} className="text-stone-400 hover:text-stone-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-stone-900 rounded-2xl p-5 text-center space-y-1 text-white shadow-inner">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Faturamento Total do Dia</span>
              <h3 className="text-2xl font-black text-emerald-400">R$ {faturamentoTotalDia.toFixed(2)}</h3>
              <p className="text-[11px] text-stone-300">{vendasHoje.length} venda(s) realizada(s)</p>
            </div>

            <div className="space-y-2.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 block">Detalhamento por Pagamento</span>
              
              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200">
                <span className="font-bold text-xs text-stone-700 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" /> Dinheiro
                </span>
                <span className="font-extrabold text-xs text-stone-900">R$ {totalDinheiro.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200">
                <span className="font-bold text-xs text-stone-700 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-600" /> Cartão
                </span>
                <span className="font-extrabold text-xs text-stone-900">R$ {totalCartao.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200">
                <span className="font-bold text-xs text-stone-700 flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-teal-600" /> PIX
                </span>
                <span className="font-extrabold text-xs text-stone-900">R$ {totalPix.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => setModalFechamentoAberto(false)}
              className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl shadow-md text-center cursor-pointer mt-2"
            >
              Fechar Resumo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}