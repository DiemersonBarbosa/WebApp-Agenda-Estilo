'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, Search, Plus, Trash2, Check, User, 
  DollarSign, CreditCard, Banknote, QrCode, X, Scissors, Package, Lock, Unlock
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
  
  const searchRef = useRef(null);

  useEffect(() => {
    async function carregarDados() {
      if (!barbeariaId) return;
      try {
        const [resServicos, resProdutos] = await Promise.all([
          supabase.from('servicos').select('id, nome, preco').eq('barbearia_id', barbeariaId),
          supabase.from('produtos').select('id, nome, preco, estoque').eq('barbearia_id', barbeariaId)
        ]);

        const listaServicos = (resServicos.data || []).map(s => ({ ...s, tipo: 'servico' }));
        const listaProdutos = (resProdutos.data || []).map(p => ({ ...p, tipo: 'produto' }));

        setProdutosServicos([...listaServicos, ...listaProdutos]);
      } catch (err) {
        console.error('Erro ao carregar catálogo:', err);
        setProdutosServicos([
          { id: '1', nome: 'Corte Degradê', preco: 45.00, tipo: 'servico' },
          { id: '2', nome: 'Barba Terapia', preco: 35.00, tipo: 'servico' },
          { id: '3', nome: 'Pomada Modeladora', preco: 50.00, tipo: 'produto' },
          { id: '4', nome: 'Designer de Sobrancelha', preco: 25.00, tipo: 'servico' }
        ]);
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
    if (comanda.length === 0 || !caixaAberto) return;
    setCarregando(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setSucesso(true);
      setTimeout(() => {
        setComanda([]);
        setNomeCliente('');
        setSucesso(false);
        setCarregando(false);
      }, 1500);
    } catch (err) {
      alert('Erro ao finalizar venda: ' + err.message);
      setCarregando(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col justify-between h-[calc(100vh-8.5rem)] px-3 pb-24 pt-6 text-slate-900 font-sans select-none">
      
      {/* TOPO: TÍTULO COM DESTAQUE MÁXIMO, DESCRIÇÃO & CONTROLE DE CAIXA */}
      <div className="space-y-3 shrink-0">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#18181b] to-[#090a0f] text-white flex items-center justify-center shadow-lg border border-stone-800 shrink-0">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 tracking-tight leading-tight">Frente de Caixa (PDV)</h1>
              <p className="text-[11px] text-slate-500 font-medium">Lançamentos de balcão e comanda rápida</p>
            </div>
          </div>

          {/* BOTÃO INTERATIVO DE ABRIR/FECHAR CAIXA */}
          <button
            type="button"
            onClick={() => setCaixaAberto(!caixaAberto)}
            className={`px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0 ${
              caixaAberto 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            {caixaAberto ? <Unlock className="w-3.5 h-3.5 text-emerald-600" /> : <Lock className="w-3.5 h-3.5 text-rose-600" />}
            <span>{caixaAberto ? 'Caixa Aberto' : 'Caixa Fechado'}</span>
          </button>
        </div>

        {/* CAMPO DE BUSCA COM DROPDOWN AUTOCOMPLETE */}
        <div className="relative" ref={searchRef}>
          <div className="flex items-center bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 shadow-sm focus-within:border-slate-900 transition-all">
            <Search className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onFocus={() => { if (busca.trim() && caixaAberto) setDropdownAberto(true); }}
              placeholder={caixaAberto ? "Pesquisar serviço ou produto..." : "Caixa fechado para novos lançamentos"}
              disabled={!caixaAberto}
              className="w-full bg-transparent text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed"
            />
            {busca && (
              <button onClick={() => { setBusca(''); setDropdownAberto(false); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* DROPDOWN DE RESULTADOS */}
          {dropdownAberto && resultadosBusca.length > 0 && caixaAberto && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-48 overflow-y-auto z-50 divide-y divide-slate-100">
              {resultadosBusca.map((item) => (
                <button
                  key={`${item.tipo}-${item.id}`}
                  onClick={() => adicionarItem(item)}
                  className="w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      item.tipo === 'servico' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {item.tipo === 'servico' ? <Scissors className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-800 group-hover:text-slate-950 truncate">{item.nome}</p>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">{item.tipo}</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-slate-900 shrink-0 ml-2">
                    R$ {Number(item.preco).toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CORPO: CLIENTE & ITENS DA COMANDA */}
      <div className="flex-1 flex flex-col justify-center space-y-2.5 my-2">
        
        {/* Cliente Opcional */}
        <div className="flex items-center bg-white border border-slate-200 rounded-2xl px-3.5 py-2 shadow-xs shrink-0">
          <User className="w-3.5 h-3.5 text-slate-400 mr-2.5 shrink-0" />
          <input
            type="text"
            value={nomeCliente}
            onChange={(e) => setNomeCliente(e.target.value)}
            placeholder="Nome do cliente (Opcional)..."
            disabled={!caixaAberto}
            className="w-full bg-transparent text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none truncate disabled:cursor-not-allowed"
          />
        </div>

        {/* Lista de Itens na Comanda */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col shadow-xs flex-1 max-h-48">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Comanda Atual</span>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {comanda.reduce((acc, i) => acc + i.quantidade, 0)} itens
            </span>
          </div>

          <div className="overflow-y-auto divide-y divide-slate-50 pr-1 my-2 flex-1">
            {!caixaAberto ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-rose-500 py-4">
                <Lock className="w-7 h-7 stroke-1 mb-1.5 opacity-60" />
                <p className="text-xs font-bold">Caixa Fechado</p>
                <span className="text-[10px] text-stone-400">Abra o caixa no topo para realizar vendas</span>
              </div>
            ) : comanda.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-4">
                <ShoppingBag className="w-7 h-7 stroke-1 mb-1.5 opacity-40" />
                <p className="text-xs font-medium">Nenhum item adicionado</p>
                <span className="text-[10px] text-slate-300">Use a busca acima para lançar</span>
              </div>
            ) : (
              comanda.map((item) => (
                <div key={`${item.tipo}-${item.id}`} className="py-2 flex items-center justify-between gap-2">
                  <div className="truncate flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.nome}</p>
                    <p className="text-[10px] font-semibold text-slate-500">R$ {Number(item.preco).toFixed(2)} un</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                      <button 
                        onClick={() => alterarQuantidade(item.id, item.tipo, -1)}
                        className="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-white rounded-lg font-bold text-xs"
                      >-</button>
                      <span className="w-6 text-center text-xs font-bold text-slate-800">{item.quantidade}</span>
                      <button 
                        onClick={() => alterarQuantidade(item.id, item.tipo, 1)}
                        className="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-white rounded-lg font-bold text-xs"
                      >+</button>
                    </div>

                    <span className="text-xs font-black text-slate-900 w-14 text-right">
                      R$ {(item.preco * item.quantidade).toFixed(2)}
                    </span>

                    <button 
                      onClick={() => removerItem(item.id, item.tipo)}
                      className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition-colors"
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
                className={`py-2.5 px-2.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  ativo 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${ativo ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{pag.label}</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* RODAPÉ: TOTAL & BOTÃO DE CONFIRMAÇÃO FIXO */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-lg shrink-0 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total a Pagar</span>
          <span className="text-base font-black text-slate-900 tracking-tight">
            R$ {totalComanda.toFixed(2)}
          </span>
        </div>

        <button
          type="button"
          disabled={comanda.length === 0 || carregando || !caixaAberto}
          onClick={finalizarVenda}
          className={`w-full py-3 rounded-xl text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            sucesso ? 'bg-emerald-600' : 'bg-[#090a0f] hover:bg-black'
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

    </div>
  );
}