'use client';

import { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  X,
  CheckCircle,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Clock,
  FolderPlus,
  Settings,
  Eye,
  Layers,
  Receipt
} from 'lucide-react';

export default function ProdutosScreen({ produtos = [], barbeariaId, supabase, onReload }) {
  const [abaAtiva, setAbaAtiva] = useState('catalogo'); // 'catalogo' | 'categorias' | 'vendas'
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

  function obterDataLocalIso(d = new Date()) {
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  const obterMesAtualIso = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const [tipoFiltro, setTipoFiltro] = useState('mes'); // 'hoje' | 'dia' | 'mes'
  const [dataFiltro, setDataFiltro] = useState(obterDataLocalIso());
  const [mesFiltro, setMesFiltro] = useState(obterMesAtualIso());

  // Estado do Modal de Detalhes da Venda
  const [vendaSelecionada, setVendaSelecionada] = useState(null);

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
        const insercoes = padroes.map((nomeCat) => ({ barbearia_id: barbeariaId, nome: nomeCat }));
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

    if (categorias.some((c) => c.nome.toLowerCase() === catTrim.toLowerCase())) {
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
      setCategorias(categorias.map((c) => (c.id === catObj.id ? { ...c, nome: novoNome } : c)));
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
      setCategorias(categorias.filter((c) => c.id !== catObj.id));
    }
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

  const vendasHoje = vendasPdV.filter((v) => extrairDataIso(v) === hojeStr);
  const faturamentoDiario = vendasHoje.reduce((acc, v) => acc + Number(v.total), 0);

  const vendasMes = vendasPdV.filter((v) => {
    const d = new Date(v.criado_em);
    return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
  });
  const faturamentoMensal = vendasMes.reduce((acc, v) => acc + Number(v.total), 0);

  const totalItensVendidosMes = vendasMes.reduce((acc, v) => {
    return acc + (v.itens || []).reduce((subAcc, item) => subAcc + item.quantidade, 0);
  }, 0);

  const valorTotalEstoque = produtos.reduce(
    (acc, p) => acc + Number(p.preco) * Number(p.estoque || 0),
    0
  );

  const vendasFiltradas = vendasPdV.filter((v) => {
    const dataIso = extrairDataIso(v);
    if (tipoFiltro === 'hoje') return dataIso === hojeStr;
    if (tipoFiltro === 'dia') return dataIso === dataFiltro;
    if (tipoFiltro === 'mes') return dataIso.startsWith(mesFiltro);
    return true;
  });

  const totalVendasFiltradas = vendasFiltradas.reduce((acc, v) => acc + Number(v.total), 0);

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
      categoria: categoria || categorias[0]?.nome || 'Geral'
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

  const iconeMetalicoStyle = {
    background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)',
    boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 1), inset 0 -4px 6px rgba(0, 0, 0, 0.25)',
    border: '1px solid rgba(255, 255, 255, 0.9)'
  };

  const cardEscuroStyle = {
    background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
    boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.8)'
  };

  const getBotaoAbaStyle = (ativo) => ({
    background: ativo
      ? 'linear-gradient(145deg, #e2e8f0 0%, #cbd5e1 55%, #b8c4d4 100%)'
      : 'linear-gradient(145deg, #f8fafc 0%, #eef2f6 55%, #e2e8f0 100%)',
    boxShadow: ativo
      ? '0 8px 18px rgba(15, 23, 42, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.95)'
      : '0 6px 14px rgba(15, 23, 42, 0.05), inset 0 1px 2px rgba(255, 255, 255, 0.95)'
  });

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-0 space-y-4 pb-28 font-sans">
      {/* 1. 4 CARDS DE MÉTRICAS (APENAS DUAS LINHAS PARA MANTER ALTURA) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div
          className="relative rounded-3xl p-4 sm:p-5 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
          style={cardEscuroStyle}
        >
          <div className="flex flex-col justify-center min-w-0 pr-2">
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider truncate block">
              Fat. Hoje
            </span>
            <h3 className="text-lg sm:text-xl font-black text-white mt-0.5 truncate">
              R$ {faturamentoDiario.toFixed(2)}
            </h3>
          </div>
          <div
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0"
            style={iconeMetalicoStyle}
          >
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
          </div>
        </div>

        <div
          className="relative rounded-3xl p-4 sm:p-5 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
          style={cardEscuroStyle}
        >
          <div className="flex flex-col justify-center min-w-0 pr-2">
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider truncate block">
              Fat. do Mês
            </span>
            <h3 className="text-lg sm:text-xl font-black text-white mt-0.5 truncate">
              R$ {faturamentoMensal.toFixed(2)}
            </h3>
          </div>
          <div
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0"
            style={iconeMetalicoStyle}
          >
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
          </div>
        </div>

        <div
          className="relative rounded-3xl p-4 sm:p-5 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
          style={cardEscuroStyle}
        >
          <div className="flex flex-col justify-center min-w-0 pr-2">
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider truncate block">
              Itens Vendidos
            </span>
            <h3 className="text-lg sm:text-xl font-black text-white mt-0.5 truncate">
              {totalItensVendidosMes} un.
            </h3>
          </div>
          <div
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0"
            style={iconeMetalicoStyle}
          >
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
          </div>
        </div>

        <div
          className="relative rounded-3xl p-4 sm:p-5 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
          style={cardEscuroStyle}
        >
          <div className="flex flex-col justify-center min-w-0 pr-2">
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider truncate block">
              Vlr. em Estoque
            </span>
            <h3 className="text-lg sm:text-xl font-black text-white mt-0.5 truncate">
              R$ {valorTotalEstoque.toFixed(2)}
            </h3>
          </div>
          <div
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0"
            style={iconeMetalicoStyle}
          >
            <Package className="w-4 h-4 sm:w-5 sm:h-5 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
          </div>
        </div>
      </div>

      {/* 2. 4 BOTÕES NO ESTILO DA ABA FIDELIDADE */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => setAbaAtiva('catalogo')}
          style={getBotaoAbaStyle(abaAtiva === 'catalogo')}
          className={`relative rounded-2xl py-3 px-2 flex flex-col items-center justify-center gap-1.5 border transition-all cursor-pointer ${
            abaAtiva === 'catalogo'
              ? 'text-slate-950 border-slate-400 ring-1 ring-slate-300'
              : 'text-slate-700 border-white/90 hover:border-slate-300'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border ${
              abaAtiva === 'catalogo'
                ? 'bg-[#18181b] border-stone-800 text-white shadow-xs'
                : 'bg-white/80 border-slate-200/90 text-slate-800 shadow-2xs'
            }`}
          >
            <Package className="w-4 h-4" />
          </div>
          <span
            className={`text-[10px] sm:text-xs tracking-tight truncate w-full text-center ${
              abaAtiva === 'catalogo' ? 'font-black text-slate-950' : 'font-bold text-slate-700'
            }`}
          >
            Catálogo
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva('categorias')}
          style={getBotaoAbaStyle(abaAtiva === 'categorias')}
          className={`relative rounded-2xl py-3 px-2 flex flex-col items-center justify-center gap-1.5 border transition-all cursor-pointer ${
            abaAtiva === 'categorias'
              ? 'text-slate-950 border-slate-400 ring-1 ring-slate-300'
              : 'text-slate-700 border-white/90 hover:border-slate-300'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border ${
              abaAtiva === 'categorias'
                ? 'bg-[#18181b] border-stone-800 text-white shadow-xs'
                : 'bg-white/80 border-slate-200/90 text-slate-800 shadow-2xs'
            }`}
          >
            <Layers className="w-4 h-4" />
          </div>
          <span
            className={`text-[10px] sm:text-xs tracking-tight truncate w-full text-center ${
              abaAtiva === 'categorias' ? 'font-black text-slate-950' : 'font-bold text-slate-700'
            }`}
          >
            Categorias
          </span>
        </button>

        <button
          type="button"
          onClick={handleNovoProduto}
          style={getBotaoAbaStyle(false)}
          className="relative rounded-2xl py-3 px-2 flex flex-col items-center justify-center gap-1.5 border text-slate-700 border-white/90 hover:border-slate-300 transition-all cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center border bg-white/80 border-slate-200/90 text-slate-800 shadow-2xs">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-[10px] sm:text-xs font-bold tracking-tight truncate w-full text-center text-slate-700">
            Novo Item
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva('vendas')}
          style={getBotaoAbaStyle(abaAtiva === 'vendas')}
          className={`relative rounded-2xl py-3 px-2 flex flex-col items-center justify-center gap-1.5 border transition-all cursor-pointer ${
            abaAtiva === 'vendas'
              ? 'text-slate-950 border-slate-400 ring-1 ring-slate-300'
              : 'text-slate-700 border-white/90 hover:border-slate-300'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border ${
              abaAtiva === 'vendas'
                ? 'bg-[#18181b] border-stone-800 text-white shadow-xs'
                : 'bg-white/80 border-slate-200/90 text-slate-800 shadow-2xs'
            }`}
          >
            <Receipt className="w-4 h-4" />
          </div>
          <span
            className={`text-[10px] sm:text-xs tracking-tight truncate w-full text-center ${
              abaAtiva === 'vendas' ? 'font-black text-slate-950' : 'font-bold text-slate-700'
            }`}
          >
            Vendas
          </span>
        </button>
      </div>

      {/* 3. CONTEÚDO ORGANIZADO POR ABA */}
      <div className="min-h-[420px] w-full">
        {abaAtiva === 'categorias' ? (
          <div
            className="relative rounded-3xl p-4 sm:p-6 border border-white/80 overflow-hidden shadow-xs space-y-4"
            style={{
              background: 'linear-gradient(135deg, #f7f9f8 0%, #edf1f0 50%, #e2e8e6 100%)',
              boxShadow: '0 15px 30px rgba(0, 0, 0, 0.05), inset 0 2px 4px rgba(255, 255, 255, 0.9), inset 0 -3px 6px rgba(0, 0, 0, 0.03)'
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-300/50 gap-2">
              <h2 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#111111] rounded-full" />
                <span>Gestão de Categorias</span>
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalCategoriaAberto(true)}
                  className="px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Nova</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalGerenciarCatAberto(true)}
                  className="px-3 py-1.5 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categorias.map((catObj) => {
                const produtosDaCat = produtos.filter(
                  (p) => (p.categoria || categorias[0]?.nome) === catObj.nome
                );
                const estoqueCat = produtosDaCat.reduce((acc, p) => acc + Number(p.estoque || 0), 0);

                return (
                  <div
                    key={catObj.id}
                    onClick={() => setCategoriaModal(catObj.nome)}
                    className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs flex items-center justify-between cursor-pointer hover:border-stone-400 transition-all"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">
                        Categoria
                      </span>
                      <h4 className="font-black text-stone-900 text-sm truncate mt-0.5">{catObj.nome}</h4>
                      <span className="text-xs text-stone-600 font-semibold block mt-0.5">
                        {produtosDaCat.length} itens • <strong className="text-emerald-600">{estoqueCat} un.</strong>
                      </span>
                    </div>
                    <span className="text-xs font-bold text-stone-800 bg-stone-50 border border-stone-200 px-2.5 py-1 rounded-xl shrink-0">
                      Ver itens 
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : abaAtiva === 'vendas' ? (
          <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xs p-4 sm:p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-stone-100 gap-3">
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-black text-stone-900 tracking-wider uppercase flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Histórico de Vendas de Balcão</span>
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Total no período: <strong className="text-stone-900 font-black">R$ {totalVendasFiltradas.toFixed(2)}</strong> ({vendasFiltradas.length} vendas)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 bg-stone-50 p-1 rounded-2xl border border-stone-200/80">
                <button
                  type="button"
                  onClick={() => setTipoFiltro('hoje')}
                  className={`px-3 py-1.5 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
                    tipoFiltro === 'hoje' ? 'bg-stone-900 text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Hoje
                </button>
                <button
                  type="button"
                  onClick={() => setTipoFiltro('dia')}
                  className={`px-3 py-1.5 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
                    tipoFiltro === 'dia' ? 'bg-stone-900 text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Por Dia
                </button>
                <button
                  type="button"
                  onClick={() => setTipoFiltro('mes')}
                  className={`px-3 py-1.5 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
                    tipoFiltro === 'mes' ? 'bg-stone-900 text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Por Mês
                </button>

                {tipoFiltro === 'dia' && (
                  <input
                    type="date"
                    value={dataFiltro}
                    onChange={(e) => setDataFiltro(e.target.value)}
                    className="px-2.5 py-1 bg-white border border-stone-200 rounded-xl text-[11px] font-bold text-stone-800 focus:outline-none cursor-pointer"
                  />
                )}

                {tipoFiltro === 'mes' && (
                  <input
                    type="month"
                    value={mesFiltro}
                    onChange={(e) => setMesFiltro(e.target.value)}
                    className="px-2.5 py-1 bg-white border border-stone-200 rounded-xl text-[11px] font-bold text-stone-800 focus:outline-none cursor-pointer"
                  />
                )}
              </div>
            </div>

            {vendasFiltradas.length === 0 ? (
              <div className="p-10 text-center text-stone-400 text-xs border border-dashed border-stone-200 rounded-2xl">
                Nenhuma venda encontrada para o período selecionado.
              </div>
            ) : (
              <div className="space-y-2.5">
                {vendasFiltradas.map((venda) => (
                  <div
                    key={venda.id}
                    className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-stone-900 text-xs block truncate">
                          {venda.cliente_nome || 'Cliente Balcão'}
                        </span>
                        <span className="text-[11px] text-stone-500 block truncate">
                          {(venda.itens || []).map((i) => `${i.quantidade}x ${i.nome}`).join(', ')}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-black text-emerald-600 text-xs block">
                          R$ {Number(venda.total).toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setVendaSelecionada(venda)}
                          className="mt-1 text-[10px] font-bold text-stone-700 hover:text-stone-950 bg-white border border-stone-200 px-2 py-0.5 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-stone-500" /> Detalhes
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-stone-200/60 text-[11px] text-stone-500 font-medium">
                      <span className="bg-stone-200/80 text-stone-700 px-2 py-0.5 rounded-lg uppercase text-[10px] font-bold">
                        {venda.forma_pagamento}
                      </span>
                      <span>
                        {new Date(venda.criado_em).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(venda.criado_em).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ABA CATÁLOGO (PADRÃO) */
          <div
            className="relative rounded-3xl p-4 sm:p-6 border border-white/80 overflow-hidden shadow-xs space-y-4"
            style={{
              background: 'linear-gradient(135deg, #f7f9f8 0%, #edf1f0 50%, #e2e8e6 100%)',
              boxShadow: '0 15px 30px rgba(0, 0, 0, 0.05), inset 0 2px 4px rgba(255, 255, 255, 0.9), inset 0 -3px 6px rgba(0, 0, 0, 0.03)'
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-300/50">
              <h2 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#111111] rounded-full" />
                <span>Categorias e Estoque</span>
              </h2>
              <span className="text-[11px] font-bold text-stone-700 bg-white px-2.5 py-0.5 rounded-full border border-stone-200 shadow-2xs">
                {produtos.length} itens
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {categorias.map((catObj) => {
                const produtosDaCat = produtos.filter(
                  (p) => (p.categoria || categorias[0]?.nome) === catObj.nome
                );
                const estoqueCat = produtosDaCat.reduce((acc, p) => acc + Number(p.estoque || 0), 0);

                return (
                  <div
                    key={catObj.id}
                    onClick={() => setCategoriaModal(catObj.nome)}
                    className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs flex items-center justify-between cursor-pointer hover:border-stone-400 transition-all"
                  >
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">
                        Categoria
                      </span>
                      <h4 className="font-black text-stone-900 text-sm truncate">{catObj.nome}</h4>
                      <p className="text-xs text-stone-600 font-semibold pt-0.5">
                        Estoque: <span className="text-emerald-600 font-bold">{estoqueCat} un.</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-9 h-9 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-base">
                        📦
                      </div>
                      <span className="text-xs font-bold text-stone-900">Ver itens </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE DETALHES DA VENDA */}
      {vendaSelecionada && (
        <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider block">
                  Comanda / Venda PDV
                </span>
                <h4 className="font-black text-stone-900 text-base">
                  {vendaSelecionada.cliente_nome || 'Cliente Balcão'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setVendaSelecionada(null)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 block">
                Itens Comprados
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(vendaSelecionada.itens || []).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 rounded-2xl bg-stone-50 border border-stone-200/70 text-xs"
                  >
                    <div>
                      <span className="font-bold text-stone-900 block">{item.nome}</span>
                      <span className="text-[10px] text-stone-500">
                        {item.quantidade}x R$ {Number(item.preco_unitario || item.preco || 0).toFixed(2)}
                      </span>
                    </div>
                    <span className="font-extrabold text-stone-900">
                      R${' '}
                      {(
                        Number(item.quantidade) * Number(item.preco_unitario || item.preco || 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-stone-100 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 font-semibold">Forma de Pagamento:</span>
                  <span className="font-extrabold uppercase bg-stone-100 px-2.5 py-0.5 rounded-lg text-stone-800">
                    {vendaSelecionada.forma_pagamento}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-stone-500 font-semibold">Data e Hora:</span>
                  <span className="font-bold text-stone-800">
                    {new Date(vendaSelecionada.criado_em).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(vendaSelecionada.criado_em).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-stone-200">
                  <span className="text-sm font-black text-stone-900">Total da Venda:</span>
                  <span className="text-base font-black text-emerald-600">
                    R$ {Number(vendaSelecionada.total).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setVendaSelecionada(null)}
                className="w-full py-3 bg-[#111111] hover:bg-stone-800 text-white text-xs font-bold rounded-2xl shadow-md cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA CRIAR NOVA CATEGORIA */}
      {modalCategoriaAberto && (
        <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h4 className="font-black text-stone-900 text-base">Nova Categoria</h4>
              <button
                type="button"
                onClick={() => setModalCategoriaAberto(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAdicionarCategoria} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">
                  Nome da Categoria
                </label>
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
                <button
                  type="button"
                  onClick={() => setModalCategoriaAberto(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-2xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#111111] hover:bg-stone-800 text-white text-xs font-bold rounded-2xl shadow-md cursor-pointer"
                >
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
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h4 className="font-black text-stone-900 text-base">Gerenciar Categorias</h4>
              <button
                type="button"
                onClick={() => {
                  setModalGerenciarCatAberto(false);
                  setCategoriaEmEdicao(null);
                }}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              {categorias.map((catObj) => (
                <div
                  key={catObj.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-200/80"
                >
                  {categoriaEmEdicao === catObj.id ? (
                    <form
                      onSubmit={(e) => handleSalvarEdicaoCategoria(e, catObj)}
                      className="flex items-center gap-2 w-full"
                    >
                      <input
                        type="text"
                        value={nomeEditadoCat}
                        onChange={(e) => setNomeEditadoCat(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-none"
                        required
                      />
                      <button
                        type="submit"
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Salvar
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategoriaEmEdicao(null)}
                        className="px-2 py-2 text-stone-500 hover:bg-stone-200 rounded-xl text-xs cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </form>
                  ) : (
                    <>
                      <span className="font-bold text-xs text-stone-800">{catObj.nome}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setCategoriaEmEdicao(catObj.id);
                            setNomeEditadoCat(catObj.nome);
                          }}
                          className="p-2 bg-white hover:bg-stone-100 text-stone-700 rounded-xl border border-stone-200 cursor-pointer"
                          title="Renomear Categoria"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExcluirCategoria(catObj)}
                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-100 cursor-pointer"
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
              <button
                type="button"
                onClick={() => {
                  setModalGerenciarCatAberto(false);
                  setCategoriaEmEdicao(null);
                }}
                className="px-6 py-2.5 bg-[#111111] hover:bg-stone-800 text-white text-xs font-bold rounded-2xl shadow-md cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DA CATEGORIA SELECIONADA (VER ITENS) */}
      {categoriaModal && (
        <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider block">
                  Itens da Categoria
                </span>
                <h4 className="font-black text-stone-900 text-base">{categoriaModal}</h4>
              </div>
              <button
                type="button"
                onClick={() => setCategoriaModal(null)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {produtos.filter((p) => (p.categoria || categorias[0]?.nome) === categoriaModal)
              .length === 0 ? (
              <div className="p-10 text-center text-stone-400 text-xs border border-dashed border-stone-200 rounded-2xl">
                Nenhum produto cadastrado nesta categoria.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {produtos
                  .filter((p) => (p.categoria || categorias[0]?.nome) === categoriaModal)
                  .map((prod) => {
                    const qtdEstoque = Number(prod.estoque || 0);
                    const isZerado = qtdEstoque === 0;

                    return (
                      <div
                        key={prod.id}
                        className="p-4 rounded-2xl border border-stone-200/80 bg-stone-50/80 flex flex-col justify-between space-y-3"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h5 className="font-extrabold text-stone-900 text-xs">{prod.nome}</h5>
                            <span className="text-sm font-black text-stone-900">
                              R$ {Number(prod.preco).toFixed(2)}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                              isZerado
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {qtdEstoque > 0 ? `${qtdEstoque} un.` : 'Esgotado'}
                          </span>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200/60">
                          <button
                            type="button"
                            onClick={() => {
                              setCategoriaModal(null);
                              handleEditarProduto(prod);
                            }}
                            className="px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-700 text-xs font-bold rounded-xl border border-stone-200 cursor-pointer flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3" /> Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExcluir(prod.id, prod.nome)}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl border border-rose-100 cursor-pointer flex items-center gap-1"
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
              <button
                type="button"
                onClick={() => setCategoriaModal(null)}
                className="px-6 py-2.5 bg-[#111111] hover:bg-stone-800 text-white text-xs font-bold rounded-2xl shadow-md cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CADASTRO / EDIÇÃO DE PRODUTO */}
      {modalAberto && (
        <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h4 className="font-black text-stone-900 text-base">
                {produtoEmEdicao ? 'Editar Produto' : 'Novo Produto'}
              </h4>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">
                  Nome do Produto
                </label>
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
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">
                  Categoria
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-bold text-stone-900 focus:outline-none focus:border-stone-900 cursor-pointer"
                >
                  {categorias.map((catObj) => (
                    <option key={catObj.id} value={catObj.nome}>
                      {catObj.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">
                    Preço (R$)
                  </label>
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
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">
                    Estoque Inicial
                  </label>
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
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-2xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2.5 bg-[#111111] hover:bg-stone-800 text-white text-xs font-bold rounded-2xl shadow-md flex items-center gap-1.5 cursor-pointer"
                >
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