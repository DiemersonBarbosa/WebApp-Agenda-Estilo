'use client';

import { useState } from 'react';
import { ShoppingBag, Search, User, CreditCard, Banknote, QrCode, Trash2, CheckCircle } from 'lucide-react';

export default function PdvScreen({ 
  servicosIniciais = [], 
  produtosIniciais = [], 
  barbeariaId, 
  supabase, 
  onVendaConcluida 
}) {
  // Estados do PDV
  const [carrinho, setCarrinho] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('pix');
  const [busca, setBusca] = useState('');
  const [finalizando, setFinalizando] = useState(false);

  // Combina os serviços e produtos cadastrados no banco em uma lista única para o PDV
  const itensDisponiveis = [
    ...(servicosIniciais || []).map(s => ({
      id: s.id,
      nome: s.nome,
      tipo: 'servico',
      preco: Number(s.preco),
      icone: '✂️'
    })),
    ...(produtosIniciais || []).map(p => ({
      id: p.id,
      nome: p.nome,
      tipo: 'produto',
      preco: Number(p.preco),
      icone: '🧴',
      estoque: p.estoque
    }))
  ];

  const adicionarAoCarrinho = (item) => {
    const itemExistente = carrinho.find((i) => i.id === item.id);
    if (itemExistente) {
      setCarrinho(
        carrinho.map((i) =>
          i.id === item.id ? { ...i, quantidade: i.quantidade + 1 } : i
        )
      );
    } else {
      setCarrinho([...carrinho, { ...item, quantidade: 1 }]);
    }
  };

  const removerDoCarrinho = (id) => {
    setCarrinho(carrinho.filter((i) => i.id !== id));
  };

  const totalGeral = carrinho.reduce((acc, item) => acc + item.preco * item.quantidade, 0);

  const handleFinalizarVenda = async () => {
    if (carrinho.length === 0) {
      alert('O carrinho está vazio!');
      return;
    }

    if (!supabase || !barbeariaId) {
      alert('Erro: Configuração da barbearia ou do Supabase ausente no PDV.');
      return;
    }

    setFinalizando(true);

    try {
      // 1. Grava a venda no Supabase para refletir no Relatório Financeiro
      const { error: erroVenda } = await supabase.from('vendas_pdv').insert([{
        barbearia_id: barbeariaId,
        cliente_nome: clienteSelecionado || 'Cliente Balcão',
        forma_pagamento: formaPagamento,
        total: totalGeral,
        itens: carrinho
      }]);

      if (erroVenda) throw erroVenda;

      // 2. Desconta o estoque dos produtos físicos vendidos
      for (const item of carrinho) {
        if (item.tipo === 'produto' && item.estoque !== undefined) {
          const novoEstoque = Math.max(0, item.estoque - item.quantidade);
          await supabase
            .from('produtos')
            .update({ estoque: novoEstoque })
            .eq('id', item.id);
        }
      }

      alert('Venda realizada e registrada no financeiro com sucesso!');
      setCarrinho([]);
      setClienteSelecionado('');
      
      // Atualiza os dados gerais do painel pai se a função foi passada
      if (onVendaConcluida) {
        onVendaConcluida();
      }

    } catch (err) {
      alert('Erro ao finalizar venda: ' + err.message);
    } finally {
      setFinalizando(false);
    }
  };

  const itensFiltrados = itensDisponiveis.filter((i) =>
    i.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">PDV / Frente de Caixa</h1>
          <p className="text-xs text-stone-500">Lançamento rápido de serviços e produtos de balcão.</p>
        </div>
        
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar serviço ou produto..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-stone-900"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-stone-800 uppercase tracking-wider">Catálogo Rápido</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {itensFiltrados.map((item) => (
              <button
                key={item.id}
                onClick={() => adicionarAoCarrinho(item)}
                className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm hover:border-stone-900 transition-all text-left flex flex-col justify-between space-y-3 cursor-pointer active:scale-95"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-2xl">{item.icone}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.tipo === 'servico' ? 'bg-stone-100 text-stone-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {item.tipo}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-xs">{item.nome}</h3>
                  <p className="text-xs font-extrabold text-stone-900 mt-1">R$ {item.preco.toFixed(2)}</p>
                  {item.tipo === 'produto' && (
                    <span className="text-[10px] text-stone-400 block mt-0.5">Estoque: {item.estoque}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h2 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" /> Comanda Atual
              </h2>
              <span className="text-xs font-bold bg-stone-100 px-2.5 py-1 rounded-full text-stone-700">
                {carrinho.reduce((acc, i) => acc + i.quantidade, 0)} itens
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-500 mb-1">Cliente (Opcional)</label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Nome do cliente..."
                  value={clienteSelecionado}
                  onChange={(e) => setClienteSelecionado(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-stone-900"
                />
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-2">
              {carrinho.length === 0 ? (
                <div className="text-center py-10 text-stone-400 text-xs">
                  Nenhum item na comanda.
                </div>
              ) : (
                carrinho.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-stone-50 p-2.5 rounded-xl border text-xs">
                    <div>
                      <p className="font-bold text-stone-900">{item.nome}</p>
                      <p className="text-[11px] text-stone-500">{item.quantidade}x R$ {item.preco.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-stone-900">R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                      <button onClick={() => removerDoCarrinho(item.id)} className="text-stone-400 hover:text-rose-600 cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-4 pt-3 border-t border-stone-100">
            <div>
              <label className="block text-[11px] font-semibold text-stone-500 mb-1.5">Pagamento</label>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setFormaPagamento('pix')} className={`py-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 cursor-pointer ${formaPagamento === 'pix' ? 'bg-stone-900 text-white border-stone-900' : 'bg-stone-50 text-stone-600 border-stone-200'}`}>
                  <QrCode className="w-4 h-4" /> PIX
                </button>
                <button onClick={() => setFormaPagamento('cartao')} className={`py-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 cursor-pointer ${formaPagamento === 'cartao' ? 'bg-stone-900 text-white border-stone-900' : 'bg-stone-50 text-stone-600 border-stone-200'}`}>
                  <CreditCard className="w-4 h-4" /> Cartão
                </button>
                <button onClick={() => setFormaPagamento('dinheiro')} className={`py-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 cursor-pointer ${formaPagamento === 'dinheiro' ? 'bg-stone-900 text-white border-stone-900' : 'bg-stone-50 text-stone-600 border-stone-200'}`}>
                  <Banknote className="w-4 h-4" /> Dinheiro
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between bg-stone-900 text-white p-3.5 rounded-2xl">
              <span className="text-xs text-stone-300">Total</span>
              <span className="text-lg font-extrabold">R$ {totalGeral.toFixed(2)}</span>
            </div>

            <button
              onClick={handleFinalizarVenda}
              disabled={finalizando || carrinho.length === 0}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              {finalizando ? 'Processando...' : 'Concluir Venda'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}