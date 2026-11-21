'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Award,
  Gift,
  Users,
  Plus,
  Minus,
  Search,
  History,
  Settings,
  BarChart3,
  Save,
  Edit3,
  X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

function normalizarTexto(texto = '') {
  return String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export default function FidelizacaoAdmin({ barbeariaId }) {
  const [clientes, setClientes] = useState([]);
  const [fidelidadeMap, setFidelidadeMap] = useState({});
  const [resgatesHistorico, setResgatesHistorico] = useState([]);
  const [busca, setBusca] = useState('');
  const [metaSelos, setMetaSelos] = useState(10);
  const [metaSelosInput, setMetaSelosInput] = useState(10);
  const [fidelidadeAtiva, setFidelidadeAtiva] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('clientes');
  const [loading, setLoading] = useState(false);

  // Estados do Modal de Edição de Cliente
  const [clienteEditando, setClienteEditando] = useState(null);
  const [nomeEdit, setNomeEdit] = useState('');
  const [telefoneEdit, setTelefoneEdit] = useState('');
  const [salvandoCliente, setSalvandoCliente] = useState(false);

  const carregarResgates = useCallback(async () => {
    if (!barbeariaId) return;
    const { data: resData } = await supabase
      .from('fidelidade_resgates')
      .select('*, clientes(nome, telefone)')
      .eq('barbearia_id', barbeariaId)
      .order('criado_em', { ascending: false })
      .limit(20);

    setResgatesHistorico(resData || []);
  }, [barbeariaId]);

  useEffect(() => {
    async function carregarDadosFidelidade() {
      if (!barbeariaId) return;
      setLoading(true);

      try {
        const { data: barbData } = await supabase
          .from('barbearias')
          .select('fidelidade_ativa, meta_selos')
          .eq('id', barbeariaId)
          .single();

        if (barbData) {
          if (typeof barbData.fidelidade_ativa === 'boolean') {
            setFidelidadeAtiva(barbData.fidelidade_ativa);
          }
          if (barbData.meta_selos) {
            setMetaSelos(barbData.meta_selos);
            setMetaSelosInput(barbData.meta_selos);
          }
        }

        const { data: cliData } = await supabase
          .from('clientes')
          .select('*')
          .eq('barbearia_id', barbeariaId);

        const unicosClientes = Array.from(
          new Map((cliData || []).map((c) => [c.id, c])).values()
        );
        setClientes(unicosClientes);

        const { data: fidData } = await supabase
          .from('fidelidade_clientes')
          .select('*')
          .eq('barbearia_id', barbeariaId);

        const mapa = {};
        (fidData || []).forEach((f) => {
          mapa[f.cliente_id] = {
            selos_atuais: f.selos_atuais || 0,
            total_resgates: f.total_resgates || 0,
            id: f.id
          };
        });
        setFidelidadeMap(mapa);

        await carregarResgates();
      } catch (err) {
        console.error('Erro ao carregar dados de fidelização:', err);
      } finally {
        setLoading(false);
      }
    }

    carregarDadosFidelidade();
  }, [barbeariaId, carregarResgates]);

  const alternarStatusFidelidade = async () => {
    const novoStatus = !fidelidadeAtiva;
    try {
      const { error } = await supabase
        .from('barbearias')
        .update({ fidelidade_ativa: novoStatus })
        .eq('id', barbeariaId);

      if (error) throw error;
      setFidelidadeAtiva(novoStatus);
    } catch (err) {
      alert('Erro ao atualizar status: ' + err.message);
    }
  };

  const salvarMetaSelos = async () => {
    try {
      const novaMeta = Number(metaSelosInput);
      if (isNaN(novaMeta) || novaMeta <= 0) {
        alert('Digite um valor válido para a meta de selos.');
        return;
      }

      const { error } = await supabase
        .from('barbearias')
        .update({ meta_selos: novaMeta })
        .eq('id', barbeariaId);

      if (error) throw error;

      setMetaSelos(novaMeta);
      alert('Meta de selos salva com sucesso!');
    } catch (err) {
      alert('Erro ao salvar meta: ' + err.message);
    }
  };

  const abrirEdicaoCliente = (cliente) => {
    setClienteEditando(cliente);
    setNomeEdit(cliente.nome || '');
    setTelefoneEdit(cliente.telefone || '');
  };

  const fecharEdicaoCliente = () => {
    setClienteEditando(null);
    setNomeEdit('');
    setTelefoneEdit('');
  };

  const salvarEdicaoCliente = async (e) => {
    if (e) e.preventDefault();
    if (!clienteEditando) return;

    const nomeLimpo = nomeEdit.trim();
    const telefoneLimpo = telefoneEdit.trim();

    if (!nomeLimpo) {
      alert('Informe o nome do cliente.');
      return;
    }

    setSalvandoCliente(true);
    try {
      const { error } = await supabase
        .from('clientes')
        .update({ nome: nomeLimpo, telefone: telefoneLimpo })
        .eq('id', clienteEditando.id);

      if (error) throw error;

      setClientes((prev) =>
        prev.map((c) =>
          c.id === clienteEditando.id
            ? { ...c, nome: nomeLimpo, telefone: telefoneLimpo }
            : c
        )
      );
      fecharEdicaoCliente();
    } catch (err) {
      alert('Erro ao atualizar cliente: ' + err.message);
    } finally {
      setSalvandoCliente(false);
    }
  };

  const garantirRegistroFidelidade = async (clienteId, selosIniciais = 0) => {
    const existente = fidelidadeMap[clienteId];
    if (existente && existente.id) {
      return existente.id;
    }

    const { data, error } = await supabase
      .from('fidelidade_clientes')
      .insert([
        {
          barbearia_id: barbeariaId,
          cliente_id: clienteId,
          selos_atuais: selosIniciais,
          total_resgates: 0
        }
      ])
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  };

  const alterarSelos = async (clienteId, delta) => {
    const atual = fidelidadeMap[clienteId]?.selos_atuais || 0;
    const novoValor = Math.max(0, atual + delta);

    try {
      const registroId = await garantirRegistroFidelidade(clienteId, novoValor);

      const { error } = await supabase
        .from('fidelidade_clientes')
        .update({ selos_atuais: novoValor, atualizado_em: new Date().toISOString() })
        .eq('id', registroId);

      if (error) throw error;

      setFidelidadeMap((prev) => ({
        ...prev,
        [clienteId]: {
          ...(prev[clienteId] || { total_resgates: 0 }),
          selos_atuais: novoValor,
          id: registroId
        }
      }));
    } catch (err) {
      alert('Erro ao atualizar selos: ' + err.message);
    }
  };

  const resgatarPremioAdmin = async (clienteId) => {
    const registro = fidelidadeMap[clienteId];
    if (!registro || registro.selos_atuais < metaSelos) return;

    const novosSelos = registro.selos_atuais - metaSelos;
    const novosResgates = (registro.total_resgates || 0) + 1;

    try {
      const { error } = await supabase
        .from('fidelidade_clientes')
        .update({
          selos_atuais: novosSelos,
          total_resgates: novosResgates,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', registro.id);

      if (error) throw error;

      await supabase.from('fidelidade_resgates').insert([
        {
          barbearia_id: barbeariaId,
          cliente_id: clienteId,
          premio_concedido: 'Corte Grátis'
        }
      ]);

      setFidelidadeMap((prev) => ({
        ...prev,
        [clienteId]: {
          ...prev[clienteId],
          selos_atuais: novosSelos,
          total_resgates: novosResgates
        }
      }));

      await carregarResgates();
      alert('Prêmio resgatado com sucesso!');
    } catch (err) {
      alert('Erro ao resgatar prêmio: ' + err.message);
    }
  };

  const termoBusca = normalizarTexto(busca);
  const clientesFiltrados = clientes.filter((c) => {
    const campos = [c.nome, c.telefone, c.email].filter(Boolean).map(normalizarTexto);
    const matchBusca = !termoBusca || campos.some((campo) => campo.includes(termoBusca));

    if (abaAtiva === 'resgates') {
      const fid = fidelidadeMap[c.id];
      return matchBusca && fid && fid.selos_atuais >= metaSelos;
    }
    return matchBusca;
  });

  const totalSelosEmitidos = Object.values(fidelidadeMap).reduce(
    (acc, curr) => acc + (curr.selos_atuais || 0),
    0
  );
  const totalResgatesFeitos = Object.values(fidelidadeMap).reduce(
    (acc, curr) => acc + (curr.total_resgates || 0),
    0
  );

  const iconeMetalicoStyle = {
    background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)',
    boxShadow:
      'inset 0 2px 3px rgba(255, 255, 255, 1), inset 0 -4px 6px rgba(0, 0, 0, 0.25)',
    border: '1px solid rgba(255, 255, 255, 0.9)'
  };

  const cardEscuroStyle = {
    background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
    boxShadow:
      'inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.8)'
  };

  const getBotaoAbaStyle = (ativo) => ({
    background: ativo
      ? 'linear-gradient(145deg, #e2e8f0 0%, #cbd5e1 55%, #b8c4d4 100%)'
      : 'linear-gradient(145deg, #f8fafc 0%, #eef2f6 55%, #e2e8f0 100%)',
    boxShadow: ativo
      ? '0 8px 18px rgba(15, 23, 42, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.95)'
      : '0 6px 14px rgba(15, 23, 42, 0.05), inset 0 1px 2px rgba(255, 255, 255, 0.95)'
  });

  const renderBotaoAba = (id, label, IconComponent) => {
    const ativo = abaAtiva === id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => setAbaAtiva(id)}
        style={getBotaoAbaStyle(ativo)}
        className={`relative rounded-2xl py-3 px-2 flex flex-col items-center justify-center gap-1.5 border transition-all cursor-pointer ${
          ativo
            ? 'text-slate-950 border-slate-400 ring-1 ring-slate-300'
            : 'text-slate-700 border-white/90 hover:border-slate-300'
        }`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center border ${
            ativo
              ? 'bg-[#18181b] border-stone-800 text-white shadow-xs'
              : 'bg-white/80 border-slate-200/90 text-slate-800 shadow-2xs'
          }`}
        >
          <IconComponent className="w-4 h-4" />
        </div>
        <span
          className={`text-[10px] sm:text-xs tracking-tight truncate w-full text-center ${
            ativo ? 'font-black text-slate-950' : 'font-bold text-slate-700'
          }`}
        >
          {label}
        </span>
      </button>
    );
  };

  const renderBarraProgresso = (selos, atingiuMeta) => {
    const percentual = Math.min(100, (selos / Math.max(1, metaSelos)) * 100);
    return (
      <div className="mt-2 space-y-1">
        <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              atingiuMeta ? 'bg-emerald-600' : 'bg-stone-900'
            }`}
            style={{ width: `${percentual}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-stone-500 font-semibold">
          <span>
            {selos}/{metaSelos} selos
          </span>
          <span>
            {atingiuMeta
              ? 'Pronto para resgatar'
              : `Faltam ${Math.max(0, metaSelos - selos)}`}
          </span>
        </div>
      </div>
    );
  };

  const cardsResumo = [
    { label: 'Clientes', valor: clientes.length, Icon: Users },
    { label: 'Selos Ativos', valor: totalSelosEmitidos, Icon: Award },
    { label: 'Resgates', valor: totalResgatesFeitos, Icon: Gift }
  ];

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-0 space-y-4 pb-24">
      {/* CARDS DO TOPO */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {cardsResumo.map(({ label, valor, Icon }) => (
          <div
            key={label}
            className="relative rounded-3xl p-4 sm:p-5 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
            style={cardEscuroStyle}
          >
            <div className="flex flex-col justify-center min-w-0 pr-2">
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider truncate block">
                {label}
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white mt-0.5 truncate">
                {valor}
              </h3>
            </div>
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0"
              style={iconeMetalicoStyle}
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
            </div>
          </div>
        ))}

        <div
          className="relative rounded-3xl p-4 sm:p-5 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
          style={cardEscuroStyle}
        >
          <div className="flex flex-col justify-center min-w-0 pr-2">
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider truncate block">
              Fidelização
            </span>
            <h3
              className={`text-lg sm:text-xl font-black mt-0.5 truncate ${
                fidelidadeAtiva ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {fidelidadeAtiva ? 'Ativo' : 'Desativado'}
            </h3>
          </div>
          <button
            type="button"
            onClick={alternarStatusFidelidade}
            className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer shrink-0 ${
              fidelidadeAtiva ? 'bg-emerald-500' : 'bg-stone-700'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                fidelidadeAtiva ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* MENU DE ABAS */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {renderBotaoAba('clientes', 'Clientes', Users)}
        {renderBotaoAba('resgates', 'Resgates', Gift)}
        {renderBotaoAba('config', 'Ajustes', Settings)}
        {renderBotaoAba('stats', 'Painel', BarChart3)}
      </div>

      {/* APENAS BARRA DE PESQUISA FUNCIONAL */}
      {(abaAtiva === 'clientes' || abaAtiva === 'resgates') && (
        <div className="bg-white rounded-3xl p-3 sm:p-4 border border-stone-200/90 shadow-xs">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar cliente por nome ou celular..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className={`w-full pl-10 ${
                busca ? 'pr-9' : 'pr-4'
              } py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs text-stone-900 focus:outline-none focus:border-stone-900 font-medium shadow-2xs`}
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca('')}
                className="w-6 h-6 rounded-full hover:bg-stone-200 text-stone-500 flex items-center justify-center absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer transition-colors"
                title="Limpar pesquisa"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* CONTEÚDO DAS ABAS */}
      <div className="min-h-[420px] w-full">
        {abaAtiva === 'config' ? (
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
              <Settings className="w-4 h-4 text-stone-900" />
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-900">
                Meta do Programa
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={metaSelosInput}
                onChange={(e) => setMetaSelosInput(e.target.value)}
                className="w-32 px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-bold text-stone-900 focus:outline-none focus:border-stone-900 shadow-2xs"
              />
              <span className="text-xs font-bold text-stone-700">Selos necessários</span>
              <button
                type="button"
                onClick={salvarMetaSelos}
                className="ml-auto px-4 py-2.5 rounded-2xl bg-stone-900 hover:bg-black text-white font-black text-xs transition-all shadow-xs cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <Save className="w-4 h-4 text-amber-400" />
                <span>Salvar</span>
              </button>
            </div>
          </div>
        ) : abaAtiva === 'stats' ? (
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
              <BarChart3 className="w-4 h-4 text-stone-900" />
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-900">
                Métricas Gerais
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {cardsResumo.map(({ label, valor }) => (
                <div
                  key={label}
                  className="p-4 bg-stone-50 rounded-2xl border border-stone-200/60"
                >
                  <span className="text-[10px] font-bold text-stone-400 uppercase">
                    {label}
                  </span>
                  <h4 className="text-lg font-black text-stone-900 mt-1">{valor}</h4>
                </div>
              ))}
            </div>
          </div>
        ) : abaAtiva === 'resgates' ? (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-stone-900" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-stone-900">
                    Elegíveis para Resgate
                  </h3>
                </div>
                <span className="text-xs font-bold text-stone-700">
                  {clientesFiltrados.length}
                </span>
              </div>

              {clientesFiltrados.length === 0 ? (
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/60 text-center text-xs font-bold text-stone-400">
                  {termoBusca
                    ? 'Nenhum cliente apto encontrado para a pesquisa.'
                    : 'Nenhum cliente apto no momento.'}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {clientesFiltrados.map((cliente) => {
                    const fid = fidelidadeMap[cliente.id] || { selos_atuais: 0 };
                    const selos = fid.selos_atuais;

                    return (
                      <div
                        key={cliente.id}
                        className="p-4 bg-stone-50 rounded-2xl border border-stone-200/70 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <span className="font-bold text-stone-900 text-xs block truncate">
                              {cliente.nome}
                            </span>
                            <span className="text-[10px] text-stone-500 block">
                              {cliente.telefone || 'Sem telefone'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => resgatarPremioAdmin(cliente.id)}
                            className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-black text-white font-black text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95 shrink-0"
                          >
                            <Gift className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Resgatar</span>
                          </button>
                        </div>
                        {renderBarraProgresso(selos, true)}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
                <History className="w-4 h-4 text-stone-900" />
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-900">
                  Histórico de Resgates
                </h3>
              </div>

              {resgatesHistorico.length === 0 ? (
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/60 text-center text-xs font-bold text-stone-400">
                  Nenhum registro encontrado.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {resgatesHistorico.map((res) => {
                    const dataResgate = new Date(res.criado_em).toLocaleString('pt-BR', {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    });
                    return (
                      <div
                        key={res.id}
                        className="p-4 bg-stone-50 rounded-2xl border border-stone-200/70 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-stone-900 block truncate">
                            {res.clientes?.nome || 'Cliente'}
                          </span>
                          <span className="text-[10px] text-stone-500 block">
                            {res.clientes?.telefone || 'Sem telefone'} •{' '}
                            <strong className="text-emerald-600">{res.premio_concedido}</strong>
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-stone-400 shrink-0">
                          {dataResgate}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-stone-900" />
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-900">
                  Cartões Fidelidade
                </h3>
              </div>
              <span className="text-xs font-bold text-stone-700">{clientesFiltrados.length}</span>
            </div>

            {loading ? (
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/60 text-center text-xs font-bold text-stone-400">
                Carregando...
              </div>
            ) : clientesFiltrados.length === 0 ? (
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/60 text-center text-xs font-bold text-stone-400">
                Nenhum cliente encontrado.
              </div>
            ) : (
              <div className="space-y-2.5">
                {clientesFiltrados.map((cliente) => {
                  const fid = fidelidadeMap[cliente.id] || { selos_atuais: 0, total_resgates: 0 };
                  const selos = fid.selos_atuais;
                  const atingiuMeta = selos >= metaSelos;

                  return (
                    <div
                      key={cliente.id}
                      className="p-4 bg-stone-50 rounded-2xl border border-stone-200/70 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="font-bold text-stone-900 text-xs block truncate">
                            {cliente.nome}
                          </span>
                          <span className="text-[10px] text-stone-500 block">
                            {cliente.telefone || 'Sem telefone'} • {fid.total_resgates} resgates
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => abrirEdicaoCliente(cliente)}
                            className="w-8 h-8 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 flex items-center justify-center transition-all cursor-pointer"
                            title="Editar Cliente"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => alterarSelos(cliente.id, -1)}
                            disabled={selos <= 0 || !fidelidadeAtiva}
                            className="w-8 h-8 rounded-xl bg-white hover:bg-stone-100 disabled:opacity-30 text-stone-700 border border-stone-200 flex items-center justify-center transition-all cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => alterarSelos(cliente.id, 1)}
                            disabled={!fidelidadeAtiva}
                            className="w-8 h-8 rounded-xl bg-stone-900 hover:bg-black disabled:opacity-30 text-white flex items-center justify-center transition-all cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 text-amber-400" />
                          </button>
                          {atingiuMeta && fidelidadeAtiva && (
                            <button
                              type="button"
                              onClick={() => resgatarPremioAdmin(cliente.id)}
                              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                            >
                              <Gift className="w-3.5 h-3.5" />
                              <span>Resgatar</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {renderBarraProgresso(selos, atingiuMeta)}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL DE EDIÇÃO DE CLIENTE */}
      {clienteEditando && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <form
            onSubmit={salvarEdicaoCliente}
            className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl border border-stone-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-sm font-black text-stone-900 uppercase tracking-wider flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-stone-900" />
                Editar Cliente
              </h3>
              <button
                type="button"
                onClick={fecharEdicaoCliente}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                  Nome do Cliente
                </label>
                <input
                  type="text"
                  value={nomeEdit}
                  onChange={(e) => setNomeEdit(e.target.value)}
                  placeholder="Digite o nome completo"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-semibold text-stone-900 focus:outline-none focus:border-stone-900"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="tel"
                  value={telefoneEdit}
                  onChange={(e) => setTelefoneEdit(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-semibold text-stone-900 focus:outline-none focus:border-stone-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={fecharEdicaoCliente}
                className="px-4 py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs cursor-pointer transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvandoCliente}
                className="px-4 py-2.5 rounded-2xl bg-stone-900 hover:bg-black disabled:opacity-50 text-white font-black text-xs cursor-pointer transition-all shadow-xs flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5 text-amber-400" />
                <span>{salvandoCliente ? 'Salvando...' : 'Salvar Alterações'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}