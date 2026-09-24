'use client';

import React, { useState } from 'react';
import { DollarSign, TrendingUp, ShoppingBag, Plus, Settings, Package, ShoppingCart } from 'lucide-react';

export default function ProdutosEstoquePage({ produtos = [], categorias = [], vendas = [], barbearia = {} }) {
  const [filtroMes, setFiltroMes] = useState(() => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    return `${ano}-${mes}`;
  });

  // Estados para controlar os modais/ações dos botões
  const [modalGerenciarOpen, setModalGerenciarOpen] = useState(false);
  const [modalCategoriaOpen, setModalCategoriaOpen] = useState(false);
  const [modalProdutoOpen, setModalProdutoOpen] = useState(false);

  // Cálculos simulados ou baseados nas props
  const faturamentoHoje = 15.00;
  const faturamentoMes = 28.00;
  const itensVendidosHoje = 6;
  const valorEstoque = 3275.00;

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-28 px-2 sm:px-0">
      
      {/* 4 Cards de Indicadores (KPIs) do Topo */}
      <div className="grid grid-cols-2 gap-3.5 md:gap-5">
        
        {/* 1. Faturamento Hoje */}
        <div 
          className="relative rounded-3xl md:rounded-[2.5rem] p-4 sm:p-6 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
            boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.8)'
          }}
        >
          <div className="flex flex-col justify-center min-w-0 pr-2">
            <span className="text-[9px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Fat. Hoje</span>
            <h3 className="text-sm sm:text-2xl font-black text-white mt-1 truncate">R$ {faturamentoHoje.toFixed(2)}</h3>
            <p className="text-[10px] text-emerald-400 font-medium mt-0.5 truncate">3 comanda(s)</p>
          </div>
          <div 
            className="w-9 h-9 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)',
              boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 1), inset 0 -4px 6px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.9)'
            }}
          >
            <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
          </div>
        </div>

        {/* 2. Faturamento Mês */}
        <div 
          className="relative rounded-3xl md:rounded-[2.5rem] p-4 sm:p-6 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
            boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.8)'
          }}
        >
          <div className="flex flex-col justify-center min-w-0 pr-2">
            <span className="text-[9px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Fat. do Mês</span>
            <h3 className="text-sm sm:text-2xl font-black text-white mt-1 truncate">R$ {faturamentoMes.toFixed(2)}</h3>
            <p className="text-[10px] text-sky-400 font-medium mt-0.5 truncate">6 vendas mês</p>
          </div>
          <div 
            className="w-9 h-9 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)',
              boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 1), inset 0 -4px 6px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.9)'
            }}
          >
            <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
          </div>
        </div>

        {/* 3. Itens Vendidos */}
        <div 
          className="relative rounded-3xl md:rounded-[2.5rem] p-4 sm:p-6 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
            boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.8)'
          }}
        >
          <div className="flex flex-col justify-center min-w-0 pr-2">
            <span className="text-[9px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Itens Vendidos</span>
            <h3 className="text-sm sm:text-2xl font-black text-white mt-1 truncate">{itensVendidosHoje} un.</h3>
            <p className="text-[10px] text-stone-400 font-medium mt-0.5 truncate">Saídas PDV</p>
          </div>
          <div 
            className="w-9 h-9 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)',
              boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 1), inset 0 -4px 6px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.9)'
            }}
          >
            <ShoppingCart className="w-4 h-4 sm:w-6 sm:h-6 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
          </div>
        </div>

        {/* 4. Valor em Estoque */}
        <div 
          className="relative rounded-3xl md:rounded-[2.5rem] p-4 sm:p-6 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
            boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.8)'
          }}
        >
          <div className="flex flex-col justify-center min-w-0 pr-2">
            <span className="text-[9px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Vlr. em Estoque</span>
            <h3 className="text-sm sm:text-2xl font-black text-white mt-1 truncate">R$ {valorEstoque.toFixed(2)}</h3>
            <p className="text-[10px] text-stone-400 font-medium mt-0.5 truncate">Mercadorias</p>
          </div>
          <div 
            className="w-9 h-9 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)',
              boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 1), inset 0 -4px 6px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.9)'
            }}
          >
            <Package className="w-4 h-4 sm:w-6 sm:h-6 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
          </div>
        </div>

      </div>

      {/* BLOCO PRINCIPAL: CATÁLOGO DE PRODUTOS & CATEGORIAS */}
      <div 
        className="relative rounded-[2.5rem] p-5 sm:p-8 border border-white/80 overflow-hidden shadow-sm space-y-6"
        style={{
          background: 'linear-gradient(135deg, #f7f9f8 0%, #edf1f0 50%, #e2e8e6 100%)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08), inset 0 2px 4px rgba(255, 255, 255, 0.9), inset 0 -3px 6px rgba(0, 0, 0, 0.05)'
        }}
      >
        
        {/* Cabeçalho do Catálogo */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-stone-300/60 gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-stone-900 text-white flex items-center justify-center shadow-md shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-stone-900 tracking-tight">Catálogo de Produtos & Categorias</h2>
              <p className="text-xs text-stone-500">Gerencie suas categorias e os itens de balcão disponíveis no PDV.</p>
            </div>
          </div>
        </div>

        {/* Botões de Ação com onClick funcional */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            onClick={() => setModalGerenciarOpen(true)}
            className="flex-1 sm:flex-none px-4 py-3 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200/90 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Settings className="w-4 h-4 text-stone-500" />
            <span>Gerenciar</span>
          </button>
          
          <button 
            onClick={() => setModalCategoriaOpen(true)}
            className="flex-1 sm:flex-none px-4 py-3 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200/90 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Package className="w-4 h-4 text-stone-500" />
            <span>Nova Categoria</span>
          </button>
          
          <button 
            onClick={() => setModalProdutoOpen(true)}
            className="w-full sm:w-auto px-5 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Produto</span>
          </button>
        </div>

        {/* Card de Categoria Exemplo com Clique */}
        <div 
          onClick={() => alert('Abrir itens da categoria Bebidas')}
          className="bg-white rounded-[2rem] border border-stone-200/90 p-5 shadow-xs flex items-center justify-between cursor-pointer hover:border-stone-400 transition-all"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider block">Categoria</span>
            <h3 className="font-black text-stone-900 text-base">Bebidas</h3>
            <p className="text-xs text-stone-600 font-medium pt-1">
              Estoque: <span className="text-emerald-600 font-bold">155 un.</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-stone-100 flex items-center justify-center text-xl shadow-xs">
              📦
            </div>
            <span className="text-xs font-bold text-stone-900 hover:underline flex items-center gap-1">
              Ver itens &gt;
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}