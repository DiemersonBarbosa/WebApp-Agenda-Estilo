'use client';

import { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, Search, X, CheckCircle, DollarSign, ShoppingCart, TrendingUp, AlertCircle, Calendar, Clock, ChevronRight, FolderPlus, Settings, ShoppingBag } from 'lucide-react';

export default function ProdutosScreen({ produtos = [], barbeariaId, supabase, onReload }) {
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [modalCategoriaAberto, setModalCategoriaAberto] = useState(false);
  const [modalGerenciarCatAberto, setModalGerenciarCatAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [produtoEmEdicao, setProdutoEmEdicao] = useState(null);

  // Estado de Categorias vindas do Banco de Dados
  const [categorias, setCategorias] = useState([]);
  const [novaCategoriaNome, setNovaCategoriaNome] = useState('');
  const [categoriaEmEdicao, setCategoriaEmEdicao] = useState(null);
  const [nomeEditadoCat, setNomeEditadoCat] = useState('');

  // Estado para controlar o Modal de Categoria Selecionada para ver os itens
  const [categoriaModal, setCategoriaModal] = useState(null);

  // Estados de Faturamento de Produtos
  const [vendasPdV, setVendasPdV] = useState([]);

  // Form State para Produto
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [estoque, setEstoque] = useState('');
  const [categoria, setCategoria] = useState('');

  useEffect(() => {
    if (barbeariaId && supabase) {
      carregarVendasPdV();
      carregarCategorias();
      if (onReload) onReload();
    }
  }, [barbeariaId]);

  const carregarCategorias = async () => {
    if (!supabase || !barbeariaId) return;
    const { data, error } = await supabase
      .from('categorias_produtos')
      .select('*')
      .eq('barbearia_id', barbeariaId)
      .order('criado_em', { ascending: true });

    if (!error && data) {
      if (data.length > 0) {
        setCategorias(data);
      } else {
        const padroes = ['Bebidas & Conveniência', 'Pomadas & Cabelo'];
        const insercoes = padroes.map(nome => ({ barbearia_id: barbeariaId, nome }));
        const { data: novasData, error: insError } = await supabase
          .from('categorias_produtos')
          .insert(insercoes)
          .select('*');
        if (!insError && novasData) {
          setCategorias(novasData);
        }
      }
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

  const handleAdicionarCategoria = async (e) => {
    e.preventDefault();
    if (!novaCategoriaNome.trim()) return;
    const catTrim = novaCategoriaNome.trim();

    if (categorias.some(c => c.nome.toLowerCase() === catTrim.toLowerCase())) {
      alert('Esta categoria já existe!');
      return;
    }

    const { data, error } = await supabase
      .from('categorias_produtos')
      .insert([{ barbearia_id: barbeariaId, nome: catTrim }])
      .select('*');

    if (error) {
      alert('Erro ao criar categoria: ' + error.message);
    } else if (data) {
      setCategorias([...categorias, data[0]]);
      setNovaCategoriaNome('');
      setModalCategoriaAberto(false);
    }
  };

  const handleSalvarEdicaoCategoria = async (e, catObj) => {
    e.preventDefault();
    if (!nomeEditadoCat.trim()) return;
    const novoNome = nomeEditadoCat.trim();

    const { error } = await supabase
      .from('categorias_produtos')
      .update({ nome: novoNome })
      .eq('id', catObj.id);

    if (error) {
      alert('Erro ao atualizar categoria: ' + error.message);
    } else {
      setCategorias(categorias.map(c => c.id === catObj.id ? { ...c, nome: novoNome } : c));
      setCategoriaEmEdicao(null);
      setNomeEditadoCat('');
    }
  };

  const handleExcluirCategoria = async (catObj) => {
    if (categorias.length <= 1) {
      alert('Você precisa ter pelo menos uma categoria cadastrada.');
      return;
    }
    if (!confirm(`Deseja excluir a categoria "${catObj.nome}"?`)) return;

    const { error } = await supabase
      .from('categorias_produtos')
      .delete()
      .eq('id', catObj.id);

    if (error) {
      alert('Erro ao excluir categoria: ' + error.message);
    } else {
      setCategorias(categorias.filter(c => c.id !== catObj.id));
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
  const mesAtual = new Date().getMonth();
  const anoAtual = new Date().getFullYear();

  const vendasHoje = vendasPdV.filter(v => extrairDataIso(v) === hojeStr);
  const faturamentoDiario = vendasHoje.reduce((acc, v) => acc + Number(v.total), 0);

  const vendasMes = vendasPdV.filter(v => {
    const d = new Date(v.criado_em);
    return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
  });
  const faturamentoMensal = vendasMes.reduce((acc, v) => acc + Number(v.total), 0);

  const totalItensVendidosMes = vendasMes.reduce((acc, v) => {
    return acc + (v.itens || []).reduce((subAcc, item) => subAcc + item.quantidade, 0);
  }, 0);
  
  const valorTotalEstoque = produtos.reduce((acc, p) => acc + (Number(p.preco) * Number(p.estoque || 0)), 0);

  const handleNovoProduto = () => {
    setProdutoEmEdicao(null);
    setNome('');
    setPreco('');
    setEstoque('');
    setCategoria(categorias[0]?.nome || 'Geral');
    setModalAberto(true);
  };

  const handleEditarProduto = (prod) => {
    setProdutoEmEdicao(prod);
    setNome(prod.nome);
    setPreco(prod.preco);
    setEstoque(prod.estoque);
    setCategoria(prod.categoria || categorias[0]?.nome || 'Geral');
    setModalAberto(true);
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (!nome || !preco) return alert('Preencha pelo menos o nome e o preço.');

    setSalvando(true);
    const dadosProduto = {
      barbearia_id: barbeariaId,
      nome: nome.trim(),
      preco: parseFloat(preco),
      estoque: parseInt(estoque || 0, 10),
      categoria: categoria || categorias[0]?.nome || 'Geral',
    };

    let error;
    if (produtoEmEdicao) {
      const res = await supabase.from('produtos').update(dadosProduto).eq('id', produtoEmEdicao.id);
      error = res.error;
    } else {
      const res = await supabase.from('produtos').insert([dadosProduto]);
      error = res.error;
    }

    setSalvando(false);
    if (error) {
      alert('Erro ao salvar produto: ' + error.message);
    } else {
      setModalAberto(false);
      if (onReload) onReload();
    }
  };

  const handleExcluir = async (id, nomeProduto) => {
    if (!confirm(`Deseja realmente excluir o produto "${nomeProduto}"?`)) return;
    const { error } = await supabase.from('produtos').delete().eq('id', id);
    if (error) {
      alert('Erro ao excluir: ' + error.message);
    } else {
      if (onReload) onReload();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-0 space-y-6 pb-28 font-sans">
      
      {/* 4 CARDS DE MÉTRICAS (Com tamanhos de texto ajustados para não cortar) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 md:gap-5 mb-6">
        
        {/* 1. Faturamento Hoje */}
        <div 
          className="relative rounded-3xl md:rounded-[2.5rem] p-4 sm:p-6 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden shadow-xl"
          style={{
            background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5), inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.8)'
          }}
        >
          <div className="flex flex-col justify-center min-w-0 pr-1">
            <span className="text-[9px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-wider truncate block">Fat. Hoje</span>
            <h3 className="text-lg sm:text-2xl font-black text-white mt-1 truncate">R$ {faturamentoDiario.toFixed(2)}</h3>
            <p className="text-[10px] text-emerald-400 font-medium mt-0.5 truncate">{vendasHoje.length} comanda(s)</p>
          </div>
          <div 
            className="w-9 h-9 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 shadow-lg"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)',
              boxShadow: '0 6px 15px rgba(0, 0, 0, 0.4), inset 0 2px 3px rgba(255, 255, 255, 1), inset 0 -4px 6px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.9)'
            }}
          >
            <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
          </div>
        </div>

        {/* 2. Faturamento do Mês */}
        <div 
          className="relative rounded-3xl md:rounded-[2.5rem] p-4 sm:p-6 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden shadow-xl"
          style={{
            background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5), inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.8)'
          }}
        >
          <div className="flex flex-col justify-center min-w-0 pr-1">
            <span className="text-[9px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-wider truncate block">Fat. do Mês</span>
            <h3 className="text-lg sm:text-2xl font-black text-white mt-1 truncate">R$ {faturamentoMensal.toFixed(2)}</h3>
            <p className="text-[10px] text-stone-400 font-medium mt-0.5 truncate">{vendasMes.length} vendas mês</p>
          </div>
          <div 
            className="w-9 h-9 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 shadow-lg"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)',
              boxShadow: '0 6px 15px rgba(0, 0, 0, 0.4), inset 0 2px 3px rgba(255, 255, 255, 1), inset 0 -4px 6px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.9)'
            }}
          >
            <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
          </div>
        </div>

        {/* 3. Itens Vendidos (Mês) */}
        <div 
          className="relative rounded-3xl md:rounded-[2.5rem] p-4 sm:p-6 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden shadow-xl"
          style={{
            background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5), inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.8)'
          }}
        >
          <div className="flex flex-col justify-center min-w-0 pr-1">
            <span className="text-[9px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-wider truncate block">Itens Vendidos</span>
            <h3 className="text-lg sm:text-2xl font-black text-white mt-1 truncate">{totalItensVendidosMes} un.</h3>
            <p className="text-[10px] text-stone-400 font-medium mt-0.5 truncate">Saídas PDV mês</p>
          </div>
          <div 
            className="w-9 h-9 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 shadow-lg"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)',
              boxShadow: '0 6px 15px rgba(0, 0, 0, 0.4), inset 0 2px 3px rgba(255, 255, 255, 1), inset 0 -4px 6px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.9)'
            }}
          >
            <ShoppingCart className="w-4 h-4 sm:w-6 sm:h-6 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
          </div>
        </div>

        {/* 4. Valor em Estoque */}
        <div 
          className="relative rounded-3xl md:rounded-[2.5rem] p-4 sm:p-6 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden shadow-xl"
          style={{
            background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5), inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.8)'
          }}
        >
          <div className="flex flex-col justify-center min-w-0 pr-1">
            <span className="text-[9px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-wider truncate block">Vlr. em Estoque</span>
            <h3 className="text-base sm:text-2xl font-black text-white mt-1 truncate">R$ {valorTotalEstoque.toFixed(2)}</h3>
            <p className="text-[10px] text-stone-400 font-medium mt-0.5 truncate">Mercadorias</p>
          </div>
          <div 
            className="w-9 h-9 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 shadow-lg"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)',
              boxShadow: '0 6px 15px rgba(0, 0, 0, 0.4), inset 0 2px 3px rgba(255, 255, 255, 1), inset 0 -4px 6px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.9)'
            }}
          >
            <Package className="w-4 h-4 sm:w-6 sm:h-6 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
          </div>
        </div>

      </div>

      {/* SEÇÃO PRINCIPAL DE CATÁLOGO */}
      <div 
        className="relative rounded-[2.5rem] p-5 sm:p-8 border border-white/80 overflow-hidden shadow-sm space-y-6"
        style={{
          background: 'linear-gradient(135deg, #f7f9f8 0%, #edf1f0 50%, #e2e8e6 100%)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08), inset 0 2px 4px rgba(255, 255, 255, 0.9), inset 0 -3px 6px rgba(0, 0, 0, 0.05)'
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-stone-300/60 gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-stone-900 text-white flex items-center justify-center shadow-md shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-stone-900 tracking-tight">Catálogo de Produtos & Categorias</h3>
              <p className="text-xs text-stone-500">Gerencie suas categorias e os itens de balcão disponíveis no PDV.</p>
            </div>
          </div>
        </div>

        {/* Botões de Ação (Com flex-1 para manter o mesmo tamanho) */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setModalGerenciarCatAberto(true)}
            className="flex-1 px-3 py-3 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200/90 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer truncate"
          >
            <Settings className="w-4 h-4 text-stone-500 shrink-0" />
            <span className="truncate">Gerenciar Categorias</span>
          </button>
          
          <button
            onClick={() => setModalCategoriaAberto(true)}
            className="flex-1 px-3 py-3 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200/90 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer truncate"
          >
            <FolderPlus className="w-4 h-4 text-stone-500 shrink-0" />
            <span className="truncate">Nova Categoria</span>
          </button>
          
          <button
            onClick={handleNovoProduto}
            className="w-full sm:w-auto px-5 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Produto</span>
          </button>
        </div>

        {/* CARDS DINÂMICOS DE CATEGORIAS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {categorias.map((catObj) => {
            const produtosDaCat = produtos.filter(p => (p.categoria || categorias[0]?.nome) === catObj.nome);
            const estoqueCat = produtosDaCat.reduce((acc, p) => acc + Number(p.estoque || 0), 0);

            return (
              <div 
                key={catObj.id}
                onClick={() => setCategoriaModal(catObj.nome)}
                className="bg-white rounded-[2rem] border border-stone-200/90 p-5 shadow-xs flex items-center justify-between cursor-pointer hover:border-stone-400 transition-all group"
              >
                <div className="space-y-1 min-w-0 pr-2">
                  <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider block">Categoria</span>
                  <h4 className="font-black text-stone-900 text-base truncate">{catObj.nome}</h4>
                  <p className="text-xs text-stone-600 font-medium pt-1">
                    Estoque: <span className="text-emerald-600 font-bold">{estoqueCat} un.</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-10 h-10 rounded-2xl bg-stone-100 flex items-center justify-center text-xl shadow-xs">
                    📦
                  </div>
                  <span className="text-xs font-bold text-stone-900 hover:underline flex items-center gap-1">
                    Ver itens &gt;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* HISTÓRICO DE VENDAS DO DIA (Adaptado para cards responsivos sem estourar a tela) */}
      <div className="bg-white rounded-[2.5rem] border border-stone-200/85 shadow-[0_10px_30px_rgba(0,0,0,0.03)] p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between pb-3.5 border-b border-stone-100 gap-2">
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-black text-stone-900 tracking-wider uppercase flex items-center gap-2 truncate">
              <Clock className="w-4 h-4 text-emerald-600 shrink-0" /> <span className="truncate">Vendas de Balcão Realizadas Hoje</span>
            </h3>
            <p className="text-[11px] text-stone-400 mt-0.5 truncate">Fluxo de caixa dos produtos vendidos hoje.</p>
          </div>
          <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full shrink-0">
            {vendasHoje.length} venda(s)
          </span>
        </div>
        
        {vendasHoje.length === 0 ? (
          <div className="p-10 text-center text-stone-400 text-xs border border-dashed border-stone-200 rounded-3xl">
            Nenhuma venda de produto registrada hoje até o momento.
          </div>
        ) : (
          <div className="space-y-3">
            {vendasHoje.map((venda) => (
              <div key={venda.id} className="p-4 rounded-2xl bg-stone-50 border border-stone-200/70 space-y-2.5">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <span className="font-bold text-stone-900 text-xs block truncate">{venda.cliente_nome}</span>
                    <span className="text-[11px] text-stone-500 block truncate">
                      {(venda.itens || []).map(i => `${i.quantidade}x ${i.nome}`).join(', ')}
                    </span>
                  </div>
                  <span className="font-black text-emerald-600 text-xs shrink-0">R$ {Number(venda.total).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t border-stone-200/60 text-[11px] text-stone-500 font-medium">
                  <span className="bg-stone-200/70 text-stone-700 px-2 py-0.5 rounded-lg uppercase text-[10px] font-bold">
                    {venda.forma_pagamento}
                  </span>
                  <span>🕒 {new Date(venda.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL PARA CRIAR NOVA CATEGORIA */}
      {modalCategoriaAberto && (
        <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3.5 border-b border-stone-100">
              <h4 className="font-black text-stone-900 text-base">Nova Categoria</h4>
              <button onClick={() => setModalCategoriaAberto(false)} className="text-stone-400 hover:text-stone-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAdicionarCategoria} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Nome da Categoria</label>
                <input
                  type="text"
                  placeholder="Ex: Acessórios, Bonés, Barba..."
                  value={novaCategoriaNome}
                  onChange={(e) => setNovaCategoriaNome(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-bold text-stone-900 focus:outline-none focus:border-stone-900"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalCategoriaAberto(false)} className="px-4 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-2xl">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2.5 bg-[#111111] hover:bg-stone-800 text-white text-xs font-bold rounded-2xl shadow-md">
                  Criar Categoria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA GERENCIAR / EDITAR / EXCLUIR CATEGORIAS */}
      {modalGerenciarCatAberto && (
        <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3.5 border-b border-stone-100">
              <h4 className="font-black text-stone-900 text-base">Gerenciar Categorias</h4>
              <button onClick={() => { setModalGerenciarCatAberto(false); setCategoriaEmEdicao(null); }} className="text-stone-400 hover:text-stone-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {categorias.map((catObj) => (
                <div key={catObj.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
                  {categoriaEmEdicao === catObj.id ? (
                    <form onSubmit={(e) => handleSalvarEdicaoCategoria(e, catObj)} className="flex items-center gap-2 w-full">
                      <input
                        type="text"
                        value={nomeEditadoCat}
                        onChange={(e) => setNomeEditadoCat(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-none"
                        required
                      />
                      <button type="submit" className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl">Salvar</button>
                      <button type="button" onClick={() => setCategoriaEmEdicao(null)} className="px-2 py-2 text-stone-500 hover:bg-stone-200 rounded-xl text-xs">Cancelar</button>
                    </form>
                  ) : (
                    <>
                      <span className="font-bold text-xs text-stone-800">{catObj.nome}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => { setCategoriaEmEdicao(catObj.id); setNomeEditadoCat(catObj.nome); }}
                          className="p-2 bg-white hover:bg-stone-100 text-stone-700 rounded-xl border border-stone-200"
                          title="Renomear Categoria"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleExcluirCategoria(catObj)}
                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-100"
                          title="Excluir Categoria"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-stone-100">
              <button onClick={() => { setModalGerenciarCatAberto(false); setCategoriaEmEdicao(null); }} className="px-6 py-2.5 bg-[#111111] hover:bg-stone-800 text-white text-xs font-bold rounded-2xl shadow-md">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DA CATEGORIA SELECIONADA (VER ITENS) */}
      {categoriaModal && (
        <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-[2.5rem] p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3.5 border-b border-stone-100">
              <div>
                <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider block">Itens da Categoria</span>
                <h4 className="font-black text-stone-900 text-base">{categoriaModal}</h4>
              </div>
              <button onClick={() => setCategoriaModal(null)} className="text-stone-400 hover:text-stone-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {produtos.filter(p => (p.categoria || categorias[0]?.nome) === categoriaModal).length === 0 ? (
              <div className="p-12 text-center text-stone-400 text-xs border border-dashed border-stone-200 rounded-3xl">
                Nenhum produto cadastrado nesta categoria.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {produtos.filter(p => (p.categoria || categorias[0]?.nome) === categoriaModal).map((prod) => {
                  const qtdEstoque = Number(prod.estoque || 0);
                  const isZerado = qtdEstoque === 0;

                  return (
                    <div key={prod.id} className="p-4.5 rounded-3xl border border-stone-200/80 bg-stone-50/80 flex flex-col justify-between space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-extrabold text-stone-900 text-xs">{prod.nome}</h5>
                          <span className="text-sm font-black text-stone-900">R$ {Number(prod.preco).toFixed(2)}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${isZerado ? 'bg-rose-100 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          {qtdEstoque > 0 ? `${qtdEstoque} un.` : 'Esgotado'}
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-stone-200/60">
                        <button
                          onClick={() => {
                            setCategoriaModal(null);
                            handleEditarProduto(prod);
                          }}
                          className="px-3.5 py-1.5 bg-white hover:bg-stone-100 text-stone-700 text-xs font-bold rounded-xl border border-stone-200 cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          <Edit className="w-3 h-3" /> Editar
                        </button>
                        <button
                          onClick={() => handleExcluir(prod.id, prod.nome)}
                          className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl border border-rose-100 cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          <Trash2 className="w-3 h-3" /> Excluir
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-stone-100">
              <button onClick={() => setCategoriaModal(null)} className="px-6 py-2.5 bg-[#111111] hover:bg-stone-800 text-white text-xs font-bold rounded-2xl shadow-md">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CADASTRO / EDIÇÃO DE PRODUTO */}
      {modalAberto && (
        <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3.5 border-b border-stone-100">
              <h4 className="font-black text-stone-900 text-base">
                {produtoEmEdicao ? 'Editar Produto' : 'Novo Produto'}
              </h4>
              <button onClick={() => setModalAberto(false)} className="text-stone-400 hover:text-stone-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Nome do Produto</label>
                <input
                  type="text"
                  placeholder="Ex: Pomada Matte 150g..."
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-bold text-stone-900 focus:outline-none focus:border-stone-900"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Categoria</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-bold text-stone-900 focus:outline-none focus:border-stone-900 cursor-pointer"
                >
                  {categorias.map(catObj => (
                    <option key={catObj.id} value={catObj.nome}>{catObj.nome}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={preco}
                    onChange={(e) => setPreco(e.target.value)}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-bold text-stone-900 focus:outline-none focus:border-stone-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Estoque Inicial</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={estoque}
                    onChange={(e) => setEstoque(e.target.value)}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-bold text-stone-900 focus:outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button type="button" onClick={() => setModalAberto(false)} className="px-4 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-2xl">
                  Cancelar
                </button>
                <button type="submit" disabled={salvando} className="px-5 py-2.5 bg-[#111111] hover:bg-stone-800 text-white text-xs font-bold rounded-2xl shadow-md flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  {salvando ? 'Salvando...' : 'Salvar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}