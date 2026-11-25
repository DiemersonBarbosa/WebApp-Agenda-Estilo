'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Receipt,
  Search,
  Calendar,
  Filter
} from 'lucide-react';

function formatBRL(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

function obterDataLocalIso(d = new Date()) {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function obterMesAtualIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function parseDataSegura(dataStr) {
  if (!dataStr) return null;
  if (dataStr instanceof Date) {
    return Number.isNaN(dataStr.getTime()) ? null : dataStr;
  }
  const str = String(dataStr).trim();
  if (!str) return null;

  // Se vier no formato "YYYY-MM-DD HH:mm:ss" sem timezone, trata como local
  const normalizada = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(str)
    ? str.replace(' ', 'T')
    : str;

  const d = new Date(normalizada);
  return Number.isNaN(d.getTime()) ? null : d;
}

function extrairDataIso(item) {
  const rawData = item?.criado_em ?? item?.created_at ?? item?.data ?? '';
  const d = parseDataSegura(rawData);
  if (d) return obterDataLocalIso(d);
  const str = String(rawData);
  return str.length >= 10 ? str.substring(0, 10) : '';
}

function obterQuantidadeItem(item) {
  const q = Number(item?.quantidade ?? item?.qtd ?? 1);
  return Number.isFinite(q) ? q : 0;
}

export default function ProdutosScreen({ produtos = [], barbeariaId, supabase, onReload }) {
  const [abaAtiva, setAbaAtiva] = useState('catalogo'); // 'catalogo' | 'categorias' | 'vendas'
  const [modalAberto, setModalAberto] = useState(false);
  const [modalCategoriaAberto, setModalCategoriaAberto] = useState(false);
  const [modalGerenciarCatAberto, setModalGerenciarCatAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [produtoEmEdicao, setProdutoEmEdicao] = useState(null);

  // Busca e filtro rápido da aba Catálogo
  const [buscaCatalogo, setBuscaCatalogo] = useState('');
  const [filtroCategoriaCatalogo, setFiltroCategoriaCatalogo] = useState('todas');

  // Estado de Categorias vindas do Banco de Dados
  const [categorias, setCategorias] = useState([]);
  const [novaCategoriaNome, setNovaCategoriaNome] = useState('');
  const [categoriaEmEdicao, setCategoriaEmEdicao] = useState(null);
  const [nomeEditadoCat, setNomeEditadoCat] = useState('');

  // Estado para controlar o Modal de Categoria Selecionada para ver os itens
  const [categoriaModal, setCategoriaModal] = useState(null);

  // Estados de Faturamento de Produtos
  const [vendasPdV, setVendasPdV] = useState([]);

  const [tipoFiltro, setTipoFiltro] = useState('mes'); // 'hoje' | 'dia' | 'mes' | 'todos'
  const [dataFiltro, setDataFiltro] = useState(obterDataLocalIso());
  const [mesFiltro, setMesFiltro] = useState(obterMesAtualIso());
  const [buscaVendas, setBuscaVendas] = useState('');
  const [filtroPagamentoVendas, setFiltroPagamentoVendas] = useState('todos');

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
  }, [barbeariaId, supabase]);

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

  const hojeStr = obterDataLocalIso();
  const mesAtual = new Date().getMonth();
  const anoAtual = new Date().getFullYear();

  const vendasHoje = useMemo(
    () => vendasPdV.filter((v) => extrairDataIso(v) === hojeStr),
    [vendasPdV, hojeStr]
  );

  const faturamentoDiario = useMemo(
    () => vendasHoje.reduce((acc, v) => acc + Number(v.total || 0), 0),
    [vendasHoje]
  );

  const vendasMes = useMemo(
    () =>
      vendasPdV.filter((v) => {
        const d = parseDataSegura(v?.criado_em ?? v?.created_at ?? v?.data);
        return d && d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
      }),
    [vendasPdV, mesAtual, anoAtual]
  );

  const faturamentoMensal = useMemo(
    () => vendasMes.reduce((acc, v) => acc + Number(v.total || 0), 0),
    [vendasMes]
  );

  const totalItensVendidosMes = useMemo(
    () =>
      vendasMes.reduce((acc, v) => {
        const itens = Array.isArray(v?.itens) ? v.itens : [];
        return acc + itens.reduce((subAcc, item) => subAcc + obterQuantidadeItem(item), 0);
      }, 0),
    [vendasMes]
  );

  const valorTotalEstoque = useMemo(
    () =>
      produtos.reduce(
        (acc, p) => acc + Number(p?.preco || 0) * Number(p?.estoque || 0),
        0
      ),
    [produtos]
  );

  // Produtos filtrados para a aba Catálogo
  const produtosFiltradosCatalogo = useMemo(() => {
    const termo = buscaCatalogo.trim().toLowerCase();
    return produtos.filter((p) => {
      const catProd = p.categoria || categorias[0]?.nome || 'Geral';
      const bateCategoria = filtroCategoriaCatalogo === 'todas' || catProd === filtroCategoriaCatalogo;
      const bateBusca =
        !termo ||
        (p.nome || '').toLowerCase().includes(termo) ||
        catProd.toLowerCase().includes(termo);
      return bateCategoria && bateBusca;
    });
  }, [produtos, buscaCatalogo, filtroCategoriaCatalogo, categorias]);

  // Formas de pagamento únicas para filtro na aba Vendas
  const formasPagamentoDisponiveis = useMemo(() => {
    const setFormas = new Set();
    vendasPdV.forEach((v) => {
      if (v.forma_pagamento) setFormas.add(String(v.forma_pagamento).toLowerCase());
    });
    return Array.from(setFormas);
  }, [vendasPdV]);

  // Vendas filtradas para a aba Vendas
  const vendasFiltradas = useMemo(() => {
    const termo = buscaVendas.trim().toLowerCase();
    return vendasPdV.filter((v) => {
      const dataIso = extrairDataIso(v);
      let bateData = true;
      if (tipoFiltro === 'hoje') bateData = dataIso === hojeStr;
      else if (tipoFiltro === 'dia') bateData = dataIso === dataFiltro;
      else if (tipoFiltro === 'mes') bateData = dataIso.startsWith(mesFiltro);

      const forma = String(v.forma_pagamento || '').toLowerCase();
      const batePagamento = filtroPagamentoVendas === 'todos' || forma === filtroPagamentoVendas;

      const textoItens = (Array.isArray(v.itens) ? v.itens : [])
        .map((i) => i.nome || '')
        .join(' ')
        .toLowerCase();
      const bateBusca =
        !termo ||
        (v.cliente_nome || 'cliente balcão').toLowerCase().includes(termo) ||
        textoItens.includes(termo);

      return bateData && batePagamento && bateBusca;
    });
  }, [vendasPdV, tipoFiltro, hojeStr, dataFiltro, mesFiltro, filtroPagamentoVendas, buscaVendas]);

  const totalVendasFiltradas = useMemo(
    () => vendasFiltradas.reduce((acc, v) => acc + Number(v.total || 0), 0),
    [vendasFiltradas]
  );

  const ticketMedioFiltrado =
    vendasFiltradas.length > 0 ? totalVendasFiltradas / vendasFiltradas.length : 0;

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
      {/* 1. 4 CARDS DE MÉTRICAS PADRONIZADOS */}
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-4 gap-3 md:gap-4">
        <div
          className="relative rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-2.5 border border-stone-700/50 min-w-0 w-full overflow-hidden"
          style={cardEscuroStyle}
        >
          <div className="flex flex-col justify-center min-w-0 flex-1">
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider truncate block">
              Fat. Hoje
            </span>
            <h3 className="text-[15px] sm:text-xl font-black text-white mt-0.5 tabular-nums leading-tight truncate">
              {formatBRL(faturamentoDiario)}
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
          className="relative rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-2.5 border border-stone-700/50 min-w-0 w-full overflow-hidden"
          style={cardEscuroStyle}
        >
          <div className="flex flex-col justify-center min-w-0 flex-1">
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider truncate block">
              Fat. do Mês
            </span>
            <h3 className="text-[15px] sm:text-xl font-black text-white mt-0.5 tabular-nums leading-tight truncate">
              {formatBRL(faturamentoMensal)}
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
          className="relative rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-2.5 border border-stone-700/50 min-w-0 w-full overflow-hidden"
          style={cardEscuroStyle}
        >
          <div className="flex flex-col justify-center min-w-0 flex-1">
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider truncate block">
              Itens Vendidos
            </span>
            <h3 className="text-[15px] sm:text-xl font-black text-white mt-0.5 tabular-nums leading-tight truncate">
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
          className="relative rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-2.5 border border-stone-700/50 min-w-0 w-full overflow-hidden"
          style={cardEscuroStyle}
        >
          <div className="flex flex-col justify-center min-w-0 flex-1">
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider truncate block">
              Vlr. em Estoque
            </span>
            <h3 className="text-[15px] sm:text-xl font-black text-white mt-0.5 tabular-nums leading-tight truncate">
              {formatBRL(valorTotalEstoque)}
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

      {/* 2. 4 BOTÕES DE NAVEGAÇÃO */}
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
                        {produtosDaCat.length} {produtosDaCat.length === 1 ? 'item' : 'itens'} •{' '}
                        <strong className="text-emerald-600">{estoqueCat} un.</strong>
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
            {/* Cabeçalho e Resumo do Período */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-2">
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-black text-stone-900 tracking-wider uppercase flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Histórico de Vendas de Balcão</span>
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Acompanhe o desempenho detalhado de vendas por período e pagamento.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-bold text-stone-700 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200">
                  {vendasFiltradas.length} {vendasFiltradas.length === 1 ? 'venda' : 'vendas'}
                </span>
                <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 tabular-nums">
                  {formatBRL(totalVendasFiltradas)}
                </span>
              </div>
            </div>

            {/* Painel de Filtros Profissional */}
            <div className="bg-stone-50/90 p-3.5 rounded-2xl border border-stone-200/80 space-y-3">
              {/* Linha 1: Busca + Seletor Segmentado de Período */}
              <div className="flex flex-col lg:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por cliente ou produto vendido..."
                    value={buscaVendas}
                    onChange={(e) => setBuscaVendas(e.target.value)}
                    className="w-full pl-10 pr-8 py-2.5 bg-white border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:border-stone-900"
                  />
                  {buscaVendas && (
                    <button
                      type="button"
                      onClick={() => setBuscaVendas('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-4 bg-stone-200/70 p-1 rounded-xl border border-stone-200/80 shrink-0">
                  {[
                    { id: 'hoje', label: 'Hoje' },
                    { id: 'dia', label: 'Por Dia' },
                    { id: 'mes', label: 'Por Mês' },
                    { id: 'todos', label: 'Todas' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setTipoFiltro(tab.id)}
                      className={`px-3 py-1.5 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                        tipoFiltro === tab.id
                          ? 'bg-stone-900 text-white shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Linha 2: Seletor de Data/Mês + Filtro por Forma de Pagamento + Ticket Médio */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-200/70">
                <div className="flex flex-wrap items-center gap-2">
                  {tipoFiltro === 'dia' && (
                    <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-xl px-3 py-1.5">
                      <Calendar className="w-3.5 h-3.5 text-stone-500" />
                      <input
                        type="date"
                        value={dataFiltro}
                        onChange={(e) => setDataFiltro(e.target.value)}
                        className="text-[11px] font-bold text-stone-800 focus:outline-none cursor-pointer bg-transparent"
                      />
                    </div>
                  )}

                  {tipoFiltro === 'mes' && (
                    <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-xl px-3 py-1.5">
                      <Calendar className="w-3.5 h-3.5 text-stone-500" />
                      <input
                        type="month"
                        value={mesFiltro}
                        onChange={(e) => setMesFiltro(e.target.value)}
                        className="text-[11px] font-bold text-stone-800 focus:outline-none cursor-pointer bg-transparent"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-xl px-3 py-1.5">
                    <Filter className="w-3.5 h-3.5 text-stone-500" />
                    <select
                      value={filtroPagamentoVendas}
                      onChange={(e) => setFiltroPagamentoVendas(e.target.value)}
                      className="text-[11px] font-bold text-stone-800 focus:outline-none cursor-pointer bg-transparent uppercase"
                    >
                      <option value="todos">Todos os Pagamentos</option>
                      {formasPagamentoDisponiveis.map((forma) => (
                        <option key={forma} value={forma}>
                          {forma}
                        </option>
                      ))}
                    </select>
                  </div>

                  {(buscaVendas || filtroPagamentoVendas !== 'todos') && (
                    <button
                      type="button"
                      onClick={() => {
                        setBuscaVendas('');
                        setFiltroPagamentoVendas('todos');
                      }}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-700 px-2.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200/80 cursor-pointer"
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>

                <div className="text-[11px] text-stone-500 font-semibold">
                  Ticket Médio:{' '}
                  <strong className="text-stone-900 font-black tabular-nums">
                    {formatBRL(ticketMedioFiltrado)}
                  </strong>
                </div>
              </div>
            </div>

            {vendasFiltradas.length === 0 ? (
              <div className="p-10 text-center text-stone-400 text-xs border border-dashed border-stone-200 rounded-2xl">
                Nenhuma venda encontrada para os filtros selecionados.
              </div>
            ) : (
              <div className="space-y-2.5">
                {vendasFiltradas.map((venda) => {
                  const dataVenda = parseDataSegura(
                    venda?.criado_em ?? venda?.created_at ?? venda?.data
                  );
                  const itensVenda = Array.isArray(venda?.itens) ? venda.itens : [];

                  return (
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
                            {itensVenda
                              .map((i) => `${obterQuantidadeItem(i)}x ${i.nome}`)
                              .join(', ')}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-black text-emerald-600 text-xs block tabular-nums">
                            {formatBRL(venda.total)}
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
                          {dataVenda
                            ? `${dataVenda.toLocaleDateString('pt-BR')} às ${dataVenda.toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}`
                            : String(venda?.criado_em || '')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ABA CATÁLOGO: LISTA COMPLETA DE PRODUTOS COM BUSCA, EDITAR E EXCLUIR */
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
                <span>Catálogo de Produtos</span>
              </h2>
              <span className="text-[11px] font-bold text-stone-700 bg-white px-2.5 py-1 rounded-full border border-stone-200 shadow-2xs shrink-0">
                {produtosFiltradosCatalogo.length}{' '}
                {produtosFiltradosCatalogo.length === 1 ? 'produto' : 'produtos'}
              </span>
            </div>

            {/* Barra de Pesquisa + Filtro Rápido de Categorias */}
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Pesquisar produto por nome ou categoria..."
                  value={buscaCatalogo}
                  onChange={(e) => setBuscaCatalogo(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 bg-white border border-stone-200/90 rounded-2xl text-xs font-medium text-stone-900 focus:outline-none focus:border-stone-900 shadow-2xs"
                />
                {buscaCatalogo && (
                  <button
                    type="button"
                    onClick={() => setBuscaCatalogo('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <button
                  type="button"
                  onClick={() => setFiltroCategoriaCatalogo('todas')}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-black whitespace-nowrap transition-all cursor-pointer ${
                    filtroCategoriaCatalogo === 'todas'
                      ? 'bg-stone-900 text-white shadow-2xs'
                      : 'bg-white text-stone-600 border border-stone-200/80 hover:text-stone-900'
                  }`}
                >
                  Todos ({produtos.length})
                </button>
                {categorias.map((catObj) => {
                  const ativo = filtroCategoriaCatalogo === catObj.nome;
                  return (
                    <button
                      key={catObj.id}
                      type="button"
                      onClick={() => setFiltroCategoriaCatalogo(catObj.nome)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-black whitespace-nowrap transition-all cursor-pointer ${
                        ativo
                          ? 'bg-stone-900 text-white shadow-2xs'
                          : 'bg-white text-stone-600 border border-stone-200/80 hover:text-stone-900'
                      }`}
                    >
                      {catObj.nome}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lista de Todos os Produtos */}
            {produtosFiltradosCatalogo.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center text-stone-400 border border-dashed border-stone-200 text-xs font-semibold space-y-2">
                <p>Nenhum produto encontrado.</p>
                {produtos.length === 0 && (
                  <button
                    type="button"
                    onClick={handleNovoProduto}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold cursor-pointer mt-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Cadastrar primeiro produto
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {produtosFiltradosCatalogo.map((prod) => {
                  const qtdEstoque = Number(prod.estoque || 0);
                  const isZerado = qtdEstoque <= 0;
                  const isBaixo = qtdEstoque > 0 && qtdEstoque <= 3;

                  return (
                    <div
                      key={prod.id}
                      className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs flex flex-col justify-between space-y-3 hover:border-stone-300 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="min-w-0 space-y-1">
                          <span className="inline-block text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200/70 truncate max-w-full">
                            {prod.categoria || categorias[0]?.nome || 'Geral'}
                          </span>
                          <h4 className="font-black text-stone-900 text-sm leading-snug line-clamp-2">
                            {prod.nome}
                          </h4>
                        </div>

                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full shrink-0 ${
                            isZerado
                              ? 'bg-rose-100 text-rose-700'
                              : isBaixo
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {qtdEstoque > 0 ? `${qtdEstoque} un.` : 'Esgotado'}
                        </span>
                      </div>

                      <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[9px] font-bold text-stone-400 uppercase block">
                            Preço Unitário
                          </span>
                          <span className="text-sm sm:text-base font-black text-stone-900 tabular-nums">
                            {formatBRL(prod.preco)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEditarProduto(prod)}
                            className="px-2.5 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-800 text-[11px] font-bold rounded-xl border border-stone-200 cursor-pointer flex items-center gap-1 transition-colors"
                            title="Editar produto"
                          >
                            <Edit className="w-3.5 h-3.5 text-stone-600" />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExcluir(prod.id, prod.nome)}
                            className="w-8 h-8 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200/80 cursor-pointer flex items-center justify-center transition-colors"
                            title="Excluir produto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
                {(Array.isArray(vendaSelecionada.itens) ? vendaSelecionada.itens : []).map(
                  (item, idx) => {
                    const qtd = obterQuantidadeItem(item);
                    const unit = Number(item.preco_unitario ?? item.preco ?? 0);
                    return (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-3 rounded-2xl bg-stone-50 border border-stone-200/70 text-xs"
                      >
                        <div>
                          <span className="font-bold text-stone-900 block">{item.nome}</span>
                          <span className="text-[10px] text-stone-500">
                            {qtd}x {formatBRL(unit)}
                          </span>
                        </div>
                        <span className="font-extrabold text-stone-900 tabular-nums">
                          {formatBRL(qtd * unit)}
                        </span>
                      </div>
                    );
                  }
                )}
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
                    {(() => {
                      const d = parseDataSegura(
                        vendaSelecionada?.criado_em ??
                          vendaSelecionada?.created_at ??
                          vendaSelecionada?.data
                      );
                      return d
                        ? `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}`
                        : String(vendaSelecionada?.criado_em || '');
                    })()}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-stone-200">
                  <span className="text-sm font-black text-stone-900">Total da Venda:</span>
                  <span className="text-base font-black text-emerald-600 tabular-nums">
                    {formatBRL(vendaSelecionada.total)}
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
                            <span className="text-sm font-black text-stone-900 tabular-nums">
                              {formatBRL(prod.preco)}
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
