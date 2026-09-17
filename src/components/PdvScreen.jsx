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
  const [carrinho, setCarrinho] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('pix');
  const [busca, setBusca] = useState('');
  const [finalizando, setFinalizando] = useState(false);

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
      const { error: erroVenda } = await supabase.from('vendas_pdv').insert([{
        barbearia_id: barbeariaId,
        cliente_nome: clienteSelecionado || 'Cliente Balcão',
        forma_pagamento: formaPagamento,
        total: totalGeral,
        itens: carrinho
      }]);

      if (erroVenda) throw erroVenda;

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
    <div className="max-w-7xl mx-auto px-2 sm:px-0 space-y-6 pb-28 font-sans">
      
      {/* CABEÇALHO DO PDV */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-stone-200/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#111111] text-white flex items-center justify-center shadow-md shrink-0">
            <ShoppingBag className="w-5 h-5 text-stone-200" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-stone-900 tracking-tight">PDV / Frente de Caixa</h1>
            <p className="text-xs text-stone-500 mt-0.5">Lançamento rápido de serviços e produtos de balcão.</p>
          </div>
        </div>
        
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar serviço ou produto..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-stone-200 text-xs font-bold text-stone-800 focus:outline-none focus:border-stone-900 shadow-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CATÁLOGO RÁPIDO */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-black text-stone-500 uppercase tracking-widest px-1">Catálogo Rápido</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            {itensFiltrados.map((item) => (
              <button
                key={item.id}
                onClick={() => adicionarAoCarrinho(item)}
                className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-[0_4px_15px_rgba(0,0,0,0.02)] hover:shadow-lg hover:border-stone-400 transition-all text-left flex flex-col justify-between space-y-4 cursor-pointer active:scale-95 group"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-2xl">{item.icone}</span>
                  <span className={`text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full ${item.tipo === 'servico' ? 'bg-stone-100 text-stone-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {item.tipo}
                  </span>
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 text-xs group-hover:text-stone-950 truncate">{item.nome}</h3>
                  <p className="text-xs font-black text-stone-900 mt-1">R$ {item.preco.toFixed(2)}</p>
                  {item.tipo === 'produto' && (
                    <span className="text-[10px] text-stone-400 font-medium block mt-0.5">Estoque: {item.estoque}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* COMANDA / CARRINHO ATUAL (Estilo Painel Black Piano / Cartão Destacado) */}
        <div className="bg-white p-6 sm:p-7 rounded-[2.5rem] border border-stone-200/85 shadow-[0_10px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-stone-100">
              <h2 className="font-black text-stone-900 text-sm flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-stone-700" /> Comanda Atual
              </h2>
              <span className="text-xs font-bold bg-stone-100 px-3 py-1 rounded-full text-stone-700 border border-stone-200/60">
                {carrinho.reduce((acc, i) => acc + i.quantidade, 0)} itens
              </span>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1.5">Cliente (Opcional)</label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Nome do cliente..."
                  value={clienteSelecionado}
                  onChange={(e) => setClienteSelecionado(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 focus:outline-none focus:border-stone-900 shadow-xs"
                />
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-2.5 pr-1">
              {carrinho.length === 0 ? (
                <div className="text-center py-12 text-stone-400 text-xs border border-dashed border-stone-200 rounded-3xl">
                  Nenhum item na comanda.
                </div>
              ) : (
                carrinho.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-stone-50/80 p-3 rounded-2xl border border-stone-200/60 text-xs">
                    <div className="min-w-0 pr-2">
                      <p className="font-extrabold text-stone-900 truncate">{item.nome}</p>
                      <p className="text-[11px] text-stone-500">{item.quantidade}x R$ {item.preco.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-black text-stone-900">R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                      <button onClick={() => removerDoCarrinho(item.id)} className="text-stone-400 hover:text-rose-600 cursor-pointer p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-stone-100">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-2">Forma de Pagamento</label>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => setFormaPagamento('pix')} 
                  className={`py-3 rounded-2xl border text-[11px] font-bold flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                    formaPagamento === 'pix' 
                      ? 'bg-[#111111] text-white border-[#111111] shadow-md' 
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <QrCode className="w-4 h-4" /> PIX
                </button>
                <button 
                  onClick={() => setFormaPagamento('cartao')} 
                  className={`py-3 rounded-2xl border text-[11px] font-bold flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                    formaPagamento === 'cartao' 
                      ? 'bg-[#111111] text-white border-[#111111] shadow-md' 
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <CreditCard className="w-4 h-4" /> Cartão
                </button>
                <button 
                  onClick={() => setFormaPagamento('dinheiro')} 
                  className={`py-3 rounded-2xl border text-[11px] font-bold flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                    formaPagamento === 'dinheiro' 
                      ? 'bg-[#111111] text-white border-[#111111] shadow-md' 
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <Banknote className="w-4 h-4" /> Dinheiro
                </button>
              </div>
            </div>

            {/* Totalizador Black Piano */}
            <div 
              className="flex items-center justify-between text-white p-4 rounded-2xl shadow-lg border border-stone-700/50"
              style={{
                background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
              }}
            >
              <span className="text-xs text-stone-400 font-bold uppercase tracking-wider">Total Geral</span>
              <span className="text-lg font-black">R$ {totalGeral.toFixed(2)}</span>
            </div>

            <button
              onClick={handleFinalizarVenda}
              disabled={finalizando || carrinho.length === 0}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4 text-emerald-200" />
              {finalizando ? 'Processando...' : 'Concluir Venda'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}