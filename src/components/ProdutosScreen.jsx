'use client';

import { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, Search, X, CheckCircle, DollarSign, ShoppingCart, TrendingUp, AlertCircle, Calendar, Clock, ChevronRight, FolderPlus, Settings } from 'lucide-react';

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
        // Se não houver nenhuma cadastrada, cria as padrões no banco
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

  // Adicionar Nova Categoria no Banco
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

  // Salvar Edição de Categoria no Banco
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

  // Excluir Categoria do Banco
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

  // Cálculos de Datas para Faturamento Diário e Mensal
  const hojeStr = new Date().toISOString().split('T')[0];
  const mesAtual = new Date().getMonth();
  const anoAtual = new Date().getFullYear();

  const vendasHoje = vendasPdV.filter(v => {
    const dataVenda = new Date(v.criado_em).toISOString().split('T')[0];
    return dataVenda === hojeStr;
  });
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
    <div className="space-y-6 font-sans">
      
      {/* PAINEL DE MÉTRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-600" /> Faturamento Hoje
            </p>
            <h4 className="text-xl font-extrabold text-stone-900">R$ {faturamentoDiario.toFixed(2)}</h4>
            <p className="text-[10px] text-emerald-600 font-semibold">{vendasHoje.length} comanda(s) hoje</p>
          </div>
          <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3 text-stone-600" /> Faturamento do Mês
            </p>
            <h4 className="text-xl font-extrabold text-stone-900">R$ {faturamentoMensal.toFixed(2)}</h4>
            <p className="text-[10px] text-stone-500 font-semibold">{vendasMes.length} venda(s) este mês</p>
          </div>
          <div className="w-11 h-11 bg-stone-100 text-stone-700 rounded-2xl flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Itens Vendidos (Mês)</p>
            <h4 className="text-xl font-extrabold text-stone-900">{totalItensVendidosMes} un.</h4>
            <p className="text-[10px] text-stone-500 font-semibold">Saídas via PDV no mês</p>
          </div>
          <div className="w-11 h-11 bg-stone-100 text-stone-700 rounded-2xl flex items-center justify-center shrink-0">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Valor em Estoque</p>
            <h4 className="text-xl font-extrabold text-stone-900">R$ {valorTotalEstoque.toFixed(2)}</h4>
            <p className="text-[10px] text-stone-500 font-semibold">Potencial em mercadorias</p>
          </div>
          <div className="w-11 h-11 bg-stone-100 text-stone-700 rounded-2xl flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* SEÇÃO PRINCIPAL DE CATEGORIAS E ESTOQUE */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <h3 className="text-lg font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
              <Package className="w-5 h-5 text-stone-700" /> Catálogo de Produtos & Categorias
            </h3>
            <p className="text-xs text-stone-400">Gerencie suas categorias e os itens de balcão disponíveis no PDV.</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setModalGerenciarCatAberto(true)}
              className="bg-stone-100 hover:bg-stone-200 text-stone-800 px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Settings className="w-4 h-4" /> Gerenciar Categorias
            </button>
            <button
              onClick={() => setModalCategoriaAberto(true)}
              className="bg-stone-100 hover:bg-stone-200 text-stone-800 px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" /> Nova Categoria
            </button>
            <button
              onClick={handleNovoProduto}
              className="bg-stone-950 hover:bg-stone-800 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" /> Cadastrar Produto
            </button>
          </div>
        </div>

        {/* CARDS DINÂMICOS DE CATEGORIAS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {categorias.map((catObj) => {
            const produtosDaCat = produtos.filter(p => (p.categoria || categorias[0]?.nome) === catObj.nome);
            const estoqueCat = produtosDaCat.reduce((acc, p) => acc + Number(p.estoque || 0), 0);

            return (
              <div 
                key={catObj.id}
                onClick={() => setCategoriaModal(catObj.nome)}
                className="bg-stone-50/80 hover:bg-stone-100/80 p-5 rounded-2xl border border-stone-200/80 space-y-3 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md hover:border-stone-300 group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Categoria</span>
                    <h4 className="font-extrabold text-stone-900 text-sm group-hover:text-stone-950">{catObj.nome}</h4>
                  </div>
                  <span className="text-2xl">📦</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-stone-200/50 text-xs">
                  <span className="text-stone-500">Estoque: <strong className="text-emerald-600">{estoqueCat} un.</strong></span>
                  <span className="text-stone-900 font-bold flex items-center gap-1 group-hover:underline">Ver itens <ChevronRight className="w-3.5 h-3.5" /></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* HISTÓRICO DE VENDAS DO DIA */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <div>
            <h3 className="text-sm font-extrabold text-stone-900 tracking-wider uppercase flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" /> Vendas de Balcão Realizadas Hoje
            </h3>
            <p className="text-xs text-stone-400">Acompanhe em tempo real o fluxo de caixa dos produtos vendidos hoje.</p>
          </div>
          <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full">
            {vendasHoje.length} venda(s) hoje
          </span>
        </div>
        
        {vendasHoje.length === 0 ? (
          <div className="p-10 text-center text-stone-400 text-xs border border-dashed border-stone-200 rounded-2xl">
            Nenhuma venda de produto registrada hoje até o momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-100 text-[11px] font-bold text-stone-400 uppercase">
                  <th className="py-3 px-4">Horário</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Pagamento</th>
                  <th className="py-3 px-4">Itens Comprados</th>
                  <th className="py-3 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50 text-xs text-stone-700">
                {vendasHoje.map((venda) => (
                  <tr key={venda.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="py-3.5 px-4 text-stone-500 font-medium">
                      {new Date(venda.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-stone-900">{venda.cliente_nome}</td>
                    <td className="py-3.5 px-4 uppercase font-semibold text-[10px]">
                      <span className="bg-stone-100 text-stone-700 px-2.5 py-1 rounded-lg border border-stone-200/60">
                        {venda.forma_pagamento}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-stone-600 font-medium">
                      {(venda.itens || []).map(i => `${i.quantidade}x ${i.nome}`).join(', ')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600 text-sm">
                      R$ {Number(venda.total).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL PARA CRIAR NOVA CATEGORIA */}
      {modalCategoriaAberto && (
        <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h4 className="font-extrabold text-stone-900 text-base">Nova Categoria</h4>
              <button onClick={() => setModalCategoriaAberto(false)} className="text-stone-400 hover:text-stone-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAdicionarCategoria} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Nome da Categoria</label>
                <input
                  type="text"
                  placeholder="Ex: Acessórios, Bonés, Barba..."
                  value={novaCategoriaNome}
                  onChange={(e) => setNovaCategoriaNome(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalCategoriaAberto(false)} className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-stone-950 hover:bg-stone-800 text-white text-xs font-bold rounded-xl">
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
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h4 className="font-extrabold text-stone-900 text-base">Gerenciar Categorias</h4>
              <button onClick={() => { setModalGerenciarCatAberto(false); setCategoriaEmEdicao(null); }} className="text-stone-400 hover:text-stone-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {categorias.map((catObj) => (
                <div key={catObj.id} className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-200/80">
                  {categoriaEmEdicao === catObj.id ? (
                    <form onSubmit={(e) => handleSalvarEdicaoCategoria(e, catObj)} className="flex items-center gap-2 w-full">
                      <input
                        type="text"
                        value={nomeEditadoCat}
                        onChange={(e) => setNomeEditadoCat(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs font-medium text-stone-900 focus:outline-none"
                        required
                      />
                      <button type="submit" className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl">Salvar</button>
                      <button type="button" onClick={() => setCategoriaEmEdicao(null)} className="px-2 py-1.5 text-stone-500 hover:bg-stone-200 rounded-xl text-xs">Cancelar</button>
                    </form>
                  ) : (
                    <>
                      <span className="font-bold text-xs text-stone-800">{catObj.nome}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => { setCategoriaEmEdicao(catObj.id); setNomeEditadoCat(catObj.nome); }}
                          className="p-1.5 bg-white hover:bg-stone-100 text-stone-700 rounded-lg border border-stone-200"
                          title="Renomear Categoria"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleExcluirCategoria(catObj)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-100"
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
              <button onClick={() => { setModalGerenciarCatAberto(false); setCategoriaEmEdicao(null); }} className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DA CATEGORIA SELECIONADA (VER ITENS) */}
      {categoriaModal && (
        <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Itens da Categoria</span>
                <h4 className="font-extrabold text-stone-900 text-base">{categoriaModal}</h4>
              </div>
              <button onClick={() => setCategoriaModal(null)} className="text-stone-400 hover:text-stone-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {produtos.filter(p => (p.categoria || categorias[0]?.nome) === categoriaModal).length === 0 ? (
              <div className="p-12 text-center text-stone-400 text-xs border border-dashed border-stone-200 rounded-2xl">
                Nenhum produto cadastrado nesta categoria.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {produtos.filter(p => (p.categoria || categorias[0]?.nome) === categoriaModal).map((prod) => {
                  const qtdEstoque = Number(prod.estoque || 0);
                  const isZerado = qtdEstoque === 0;

                  return (
                    <div key={prod.id} className="p-4 rounded-2xl border border-stone-200 bg-stone-50/60 flex flex-col justify-between space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-bold text-stone-900 text-xs">{prod.nome}</h5>
                          <span className="text-sm font-extrabold text-stone-900">R$ {Number(prod.preco).toFixed(2)}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isZerado ? 'bg-rose-100 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          {qtdEstoque > 0 ? `${qtdEstoque} un.` : 'Esgotado'}
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-stone-200/50">
                        <button
                          onClick={() => {
                            setCategoriaModal(null);
                            handleEditarProduto(prod);
                          }}
                          className="px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-700 text-xs font-semibold rounded-lg border border-stone-200 cursor-pointer flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" /> Editar
                        </button>
                        <button
                          onClick={() => handleExcluir(prod.id, prod.nome)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-lg border border-rose-100 cursor-pointer flex items-center gap-1"
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
              <button onClick={() => setCategoriaModal(null)} className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CADASTRO / EDIÇÃO DE PRODUTO */}
      {modalAberto && (
        <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h4 className="font-extrabold text-stone-900 text-base">
                {produtoEmEdicao ? 'Editar Produto' : 'Novo Produto'}
              </h4>
              <button onClick={() => setModalAberto(false)} className="text-stone-400 hover:text-stone-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Nome do Produto</label>
                <input
                  type="text"
                  placeholder="Ex: Pomada Matte 150g..."
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Categoria</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 cursor-pointer"
                >
                  {categorias.map(catObj => (
                    <option key={catObj.id} value={catObj.nome}>{catObj.nome}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Preço de Venda (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={preco}
                    onChange={(e) => setPreco(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Estoque Inicial</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={estoque}
                    onChange={(e) => setEstoque(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button type="button" onClick={() => setModalAberto(false)} className="px-4 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl">
                  Cancelar
                </button>
                <button type="submit" disabled={salvando} className="px-5 py-2.5 bg-stone-950 hover:bg-stone-800 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
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