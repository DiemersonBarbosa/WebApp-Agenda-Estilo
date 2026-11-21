'use client';

import React, { useState, useEffect } from 'react';
import { Award, Gift, Users, Plus, Minus, Search, Sparkles, History, Settings, BarChart3, Save, Edit3, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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

        setClientes(cliData || []);

        const { data: fidData } = await supabase
          .from('fidelidade_clientes')
          .select('*')
          .eq('barbearia_id', barbeariaId);

        const mapa = {};
        (fidData || []).forEach(f => {
          mapa[f.cliente_id] = {
            selos_atuais: f.selos_atuais || 0,
            total_resgates: f.total_resgates || 0,
            id: f.id
          };
        });
        setFidelidadeMap(mapa);

        const { data: resData } = await supabase
          .from('fidelidade_resgates')
          .select('*, clientes(nome, telefone)')
          .eq('barbearia_id', barbeariaId)
          .order('criado_em', { ascending: false })
          .limit(20);

        setResgatesHistorico(resData || []);

      } catch (err) {
        console.error('Erro ao carregar dados de fidelização:', err);
      } finally {
        setLoading(false);
      }
    }

    carregarDadosFidelidade();
  }, [barbeariaId]);

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

  const salvarEdicaoCliente = async () => {
    if (!clienteEditando) return;
    try {
      const { error } = await supabase
        .from('clientes')
        .update({ nome: nomeEdit, telefone: telefoneEdit })
        .eq('id', clienteEditando.id);

      if (error) throw error;

      setClientes(prev => prev.map(c => c.id === clienteEditando.id ? { ...c, nome: nomeEdit, telefone: telefoneEdit } : c));
      setClienteEditando(null);
      alert('Cliente atualizado com sucesso!');
    } catch (err) {
      alert('Erro ao atualizar cliente: ' + err.message);
    }
  };

  const alterarSelos = async (clienteId, delta) => {
    const atual = fidelidadeMap[clienteId]?.selos_atuais || 0;
    const novoValor = Math.max(0, atual + delta);

    try {
      let registroExistente = fidelidadeMap[clienteId];

      if (registroExistente && registroExistente.id) {
        const { error } = await supabase
          .from('fidelidade_clientes')
          .update({ selos_atuais: novoValor, atualizado_em: new Date().toISOString() })
          .eq('id', registroExistente.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('fidelidade_clientes')
          .insert([{
            barbearia_id: barbeariaId,
            cliente_id: clienteId,
            selos_atuais: novoValor,
            total_resgates: 0
          }])
          .select('id')
          .single();

        if (error) throw error;
        registroExistente = { id: data.id };
      }

      setFidelidadeMap(prev => ({
        ...prev,
        [clienteId]: {
          ...(prev[clienteId] || { total_resgates: 0 }),
          selos_atuais: novoValor,
          id: prev[clienteId]?.id || registroExistente?.id
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

      await supabase.from('fidelidade_resgates').insert([{
        barbearia_id: barbeariaId,
        cliente_id: clienteId,
        premio_concedido: 'Corte Grátis'
      }]);

      setFidelidadeMap(prev => ({
        ...prev,
        [clienteId]: {
          ...prev[clienteId],
          selos_atuais: novosSelos,
          total_resgates: novosResgates
        }
      }));

      const { data: resData } = await supabase
        .from('fidelidade_resgates')
        .select('*, clientes(nome, telefone)')
        .eq('barbearia_id', barbeariaId)
        .order('criado_em', { ascending: false })
        .limit(20);

      setResgatesHistorico(resData || []);
      alert('Prêmio resgatado com sucesso!');
    } catch (err) {
      alert('Erro ao resgatar prêmio: ' + err.message);
    }
  };

  const clientesFiltrados = clientes.filter(c => {
    const matchBusca = (c.nome || '').toLowerCase().includes(busca.toLowerCase()) ||
      (c.telefone || '').includes(busca);
    
    if (abaAtiva === 'resgates') {
      const fid = fidelidadeMap[c.id];
      return matchBusca && fid && fid.selos_atuais >= metaSelos;
    }
    return matchBusca;
  });

  const totalSelosEmitidos = Object.values(fidelidadeMap).reduce((acc, curr) => acc + curr.selos_atuais, 0);
  const totalResgatesFeitos = Object.values(fidelidadeMap).reduce((acc, curr) => acc + curr.total_resgates, 0);

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
    <div className="max-w-7xl mx-auto px-2 sm:px-0 space-y-4 pb-24">
      
      {/* CARDS DO TOPO */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div 
          className="relative rounded-3xl p-4 sm:p-5 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
          style={cardEscuroStyle}
        >
          <div className="flex flex-col justify-center min-w-0 pr-2">
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider truncate block">Clientes</span>
            <h3 className="text-lg sm:text-xl font-black text-white mt-0.5 truncate">{clientes.length}</h3>
          </div>
          <div 
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0"
            style={iconeMetalicoStyle}
          >
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
          </div>
        </div>

        <div 
          className="relative rounded-3xl p-4 sm:p-5 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
          style={cardEscuroStyle}
        >
          <div className="flex flex-col justify-center min-w-0 pr-2">
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider truncate block">Selos Ativos</span>
            <h3 className="text-lg sm:text-xl font-black text-white mt-0.5 truncate">{totalSelosEmitidos}</h3>
          </div>
          <div 
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0"
            style={iconeMetalicoStyle}
          >
            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
          </div>
        </div>

        <div 
          className="relative rounded-3xl p-4 sm:p-5 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
          style={cardEscuroStyle}
        >
          <div className="flex flex-col justify-center min-w-0 pr-2">
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider truncate block">Resgates</span>
            <h3 className="text-lg sm:text-xl font-black text-white mt-0.5 truncate">{totalResgatesFeitos}</h3>
          </div>
          <div 
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0"
            style={iconeMetalicoStyle}
          >
            <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
          </div>
        </div>

        <div 
          className="relative rounded-3xl p-4 sm:p-5 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
          style={cardEscuroStyle}
        >
          <div className="flex flex-col justify-center min-w-0 pr-2">
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider truncate block">Fidelização</span>
            <h3 className={`text-lg sm:text-xl font-black mt-0.5 truncate ${fidelidadeAtiva ? 'text-emerald-400' : 'text-rose-400'}`}>
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
            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${fidelidadeAtiva ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {/* MENU DE ABAS */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => setAbaAtiva('clientes')}
          style={getBotaoAbaStyle(abaAtiva === 'clientes')}
          className={`relative rounded-2xl py-3 px-2 flex flex-col items-center justify-center gap-1.5 border transition-all cursor-pointer ${
            abaAtiva === 'clientes'
              ? 'text-slate-950 border-slate-400 ring-1 ring-slate-300'
              : 'text-slate-700 border-white/90 hover:border-slate-300'
          }`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
            abaAtiva === 'clientes'
              ? 'bg-[#18181b] border-stone-800 text-white shadow-xs'
              : 'bg-white/80 border-slate-200/90 text-slate-800 shadow-2xs'
          }`}>
            <Users className="w-4 h-4" />
          </div>
          <span className={`text-[10px] sm:text-xs tracking-tight truncate w-full text-center ${
            abaAtiva === 'clientes' ? 'font-black text-slate-950' : 'font-bold text-slate-700'
          }`}>Clientes</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva('resgates')}
          style={getBotaoAbaStyle(abaAtiva === 'resgates')}
          className={`relative rounded-2xl py-3 px-2 flex flex-col items-center justify-center gap-1.5 border transition-all cursor-pointer ${
            abaAtiva === 'resgates'
              ? 'text-slate-950 border-slate-400 ring-1 ring-slate-300'
              : 'text-slate-700 border-white/90 hover:border-slate-300'
          }`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
            abaAtiva === 'resgates'
              ? 'bg-[#18181b] border-stone-800 text-white shadow-xs'
              : 'bg-white/80 border-slate-200/90 text-slate-800 shadow-2xs'
          }`}>
            <Gift className="w-4 h-4" />
          </div>
          <span className={`text-[10px] sm:text-xs tracking-tight truncate w-full text-center ${
            abaAtiva === 'resgates' ? 'font-black text-slate-950' : 'font-bold text-slate-700'
          }`}>Resgates</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva('config')}
          style={getBotaoAbaStyle(abaAtiva === 'config')}
          className={`relative rounded-2xl py-3 px-2 flex flex-col items-center justify-center gap-1.5 border transition-all cursor-pointer ${
            abaAtiva === 'config'
              ? 'text-slate-950 border-slate-400 ring-1 ring-slate-300'
              : 'text-slate-700 border-white/90 hover:border-slate-300'
          }`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
            abaAtiva === 'config'
              ? 'bg-[#18181b] border-stone-800 text-white shadow-xs'
              : 'bg-white/80 border-slate-200/90 text-slate-800 shadow-2xs'
          }`}>
            <Settings className="w-4 h-4" />
          </div>
          <span className={`text-[10px] sm:text-xs tracking-tight truncate w-full text-center ${
            abaAtiva === 'config' ? 'font-black text-slate-950' : 'font-bold text-slate-700'
          }`}>Ajustes</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva('stats')}
          style={getBotaoAbaStyle(abaAtiva === 'stats')}
          className={`relative rounded-2xl py-3 px-2 flex flex-col items-center justify-center gap-1.5 border transition-all cursor-pointer ${
            abaAtiva === 'stats'
              ? 'text-slate-950 border-slate-400 ring-1 ring-slate-300'
              : 'text-slate-700 border-white/90 hover:border-slate-300'
          }`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
            abaAtiva === 'stats'
              ? 'bg-[#18181b] border-stone-800 text-white shadow-xs'
              : 'bg-white/80 border-slate-200/90 text-slate-800 shadow-2xs'
          }`}>
            <BarChart3 className="w-4 h-4" />
          </div>
          <span className={`text-[10px] sm:text-xs tracking-tight truncate w-full text-center ${
            abaAtiva === 'stats' ? 'font-black text-slate-950' : 'font-bold text-slate-700'
          }`}>Painel</span>
        </button>
      </div>

      {/* BARRA DE BUSCA */}
      {(abaAtiva === 'clientes' || abaAtiva === 'resgates') && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-stone-900" />
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-900">
                {abaAtiva === 'resgates' ? 'Prontos para Resgate' : 'Busca de Clientes'}
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700 bg-stone-50 px-2.5 py-1 rounded-xl border border-stone-200 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Meta: {metaSelos}</span>
            </div>
          </div>

          <div className="relative w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Digite o nome ou celular..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs text-stone-900 focus:outline-none focus:border-stone-900 font-medium shadow-2xs"
            />
          </div>
        </div>
      )}

      {/* CONTEÚDO DAS ABAS */}
      <div className="min-h-[420px] w-full">
        {abaAtiva === 'config' ? (
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
              <Settings className="w-4 h-4 text-stone-900" />
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-900">Meta do Programa</h3>
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
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-900">Métricas Gerais</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/60">
                <span className="text-[10px] font-bold text-stone-400 uppercase">Total de Clientes</span>
                <h4 className="text-lg font-black text-stone-900 mt-1">{clientes.length}</h4>
              </div>
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/60">
                <span className="text-[10px] font-bold text-stone-400 uppercase">Selos Ativos</span>
                <h4 className="text-lg font-black text-stone-900 mt-1">{totalSelosEmitidos}</h4>
              </div>
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/60">
                <span className="text-[10px] font-bold text-stone-400 uppercase">Resgates Realizados</span>
                <h4 className="text-lg font-black text-stone-900 mt-1">{totalResgatesFeitos}</h4>
              </div>
            </div>
          </div>
        ) : abaAtiva === 'resgates' ? (
          <div className="space-y-4">
            <div 
              className="relative rounded-3xl p-4 sm:p-6 border border-white/80 overflow-hidden shadow-xs"
              style={{
                background: 'linear-gradient(135deg, #f7f9f8 0%, #edf1f0 50%, #e2e8e6 100%)',
                boxShadow: '0 15px 30px rgba(0, 0, 0, 0.05), inset 0 2px 4px rgba(255, 255, 255, 0.9), inset 0 -3px 6px rgba(0, 0, 0, 0.03)'
              }}
            >
              <div className="flex items-center justify-between pb-4 border-b border-stone-300/50">
                <h2 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#111111] rounded-full"></span>
                  <span>Elegíveis para Resgate</span>
                </h2>
                <span className="text-[11px] font-bold text-stone-700 bg-white px-2.5 py-0.5 rounded-full border border-stone-200 shadow-2xs">
                  {clientesFiltrados.length}
                </span>
              </div>

              {clientesFiltrados.length === 0 ? (
                <div className="text-center py-10 text-stone-500 text-[11px] font-bold uppercase tracking-wider">
                  Nenhum cliente apto no momento.
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {clientesFiltrados.map((cliente) => {
                    const fid = fidelidadeMap[cliente.id] || { selos_atuais: 0 };
                    return (
                      <div key={cliente.id} className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between gap-3 pb-2 border-b border-stone-100">
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-black text-stone-900 truncate">{cliente.nome}</h4>
                            <span className="text-[10px] text-stone-500 font-medium block">{cliente.telefone || 'Sem telefone'}</span>
                          </div>
                          <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-xl border bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0">
                            Pronto
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs font-bold text-stone-700">{fid.selos_atuais} / {metaSelos} Selos</span>
                          <button
                            type="button"
                            onClick={() => resgatarPremioAdmin(cliente.id)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
                          >
                            <Gift className="w-3.5 h-3.5" />
                            <span>Resgatar</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-stone-200/90 shadow-xs space-y-4">
              <div className="flex items-center gap-2 px-1 pb-3 border-b border-stone-100">
                <History className="w-4 h-4 text-stone-900" />
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-900">Histórico de Resgates</h3>
              </div>

              {resgatesHistorico.length === 0 ? (
                <div className="text-center py-6 text-stone-400 text-[11px] font-bold uppercase tracking-wider">
                  Nenhum registro encontrado.
                </div>
              ) : (
                <div className="space-y-2">
                  {resgatesHistorico.map((res) => {
                    const dataResgate = new Date(res.criado_em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
                    return (
                      <div key={res.id} className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-stone-900 block">{res.clientes?.nome || 'Cliente'}</span>
                          <span className="text-[10px] text-stone-500">{res.clientes?.telefone || 'Sem telefone'} • <strong className="text-emerald-600">{res.premio_concedido}</strong></span>
                        </div>
                        <span className="text-[10px] font-bold text-stone-400">{dataResgate}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div 
            className="relative rounded-3xl p-4 sm:p-6 border border-white/80 overflow-hidden shadow-xs"
            style={{
              background: 'linear-gradient(135deg, #f7f9f8 0%, #edf1f0 50%, #e2e8e6 100%)',
              boxShadow: '0 15px 30px rgba(0, 0, 0, 0.05), inset 0 2px 4px rgba(255, 255, 255, 0.9), inset 0 -3px 6px rgba(0, 0, 0, 0.03)'
            }}
          >
            <div className="flex items-center justify-between pb-4 border-b border-stone-300/50">
              <h2 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#111111] rounded-full"></span>
                <span>Cartões Fidelidade</span>
              </h2>
              <span className="text-[11px] font-bold text-stone-700 bg-white px-2.5 py-0.5 rounded-full border border-stone-200 shadow-2xs">
                {clientesFiltrados.length}
              </span>
            </div>

            {loading ? (
              <div className="text-center py-12 text-stone-500 text-[11px] font-bold uppercase tracking-wider">
                Carregando...
              </div>
            ) : clientesFiltrados.length === 0 ? (
              <div className="text-center py-12 text-stone-500 text-[11px] font-bold uppercase tracking-wider">
                Nenhum cliente encontrado.
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {clientesFiltrados.map((cliente) => {
                  const fid = fidelidadeMap[cliente.id] || { selos_atuais: 0, total_resgates: 0 };
                  const selos = fid.selos_atuais;
                  const percentual = Math.min(100, (selos / metaSelos) * 100);
                  const atingiuMeta = selos >= metaSelos;

                  return (
                    <div key={cliente.id} className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs space-y-3 relative">
                      <div className="flex items-center justify-between gap-3 pb-3 border-b border-stone-100">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-black text-stone-900 truncate">{cliente.nome}</h4>
                            <button
                              type="button"
                              onClick={() => abrirEdicaoCliente(cliente)}
                              className="p-1 rounded-lg hover:bg-stone-100 text-stone-500 transition-all cursor-pointer"
                              title="Editar Cliente"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="text-[10px] text-stone-500 font-medium block">{cliente.telefone || 'Sem telefone'}</span>
                        </div>
                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-xl border shrink-0 ${
                          atingiuMeta ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-stone-50 text-stone-700 border-stone-200'
                        }`}>
                          {atingiuMeta ? 'Pronto' : `${selos} / ${metaSelos}`}
                        </span>
                      </div>

                      <div className="space-y-1.5 bg-stone-50/80 p-3 rounded-xl border border-stone-200/60">
                        <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden p-0.5">
                          <div className={`h-full rounded-full transition-all duration-500 ${atingiuMeta ? 'bg-emerald-600' : 'bg-stone-900'}`} style={{ width: `${percentual}%` }}></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-stone-500 font-bold uppercase">
                          <span>Resgates: {fid.total_resgates}</span>
                          <span>{atingiuMeta ? 'Meta Atingida' : `Faltam ${metaSelos - selos}`}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => alterarSelos(cliente.id, -1)}
                            disabled={selos <= 0 || !fidelidadeAtiva}
                            className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 disabled:opacity-30 text-stone-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => alterarSelos(cliente.id, 1)}
                            disabled={!fidelidadeAtiva}
                            className="w-8 h-8 rounded-xl bg-stone-900 hover:bg-black disabled:opacity-30 text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                          >
                            <Plus className="w-3.5 h-3.5 text-amber-400" />
                          </button>
                        </div>

                        {atingiuMeta && fidelidadeAtiva && (
                          <button
                            type="button"
                            onClick={() => resgatarPremioAdmin(cliente.id)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
                          >
                            <Gift className="w-3.5 h-3.5 text-emerald-200" />
                            <span>Resgatar</span>
                          </button>
                        )}
                      </div>
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
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-sm font-black text-stone-900 uppercase tracking-wider flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-stone-900" />
                Editar Cliente
              </h3>
              <button 
                type="button"
                onClick={() => setClienteEditando(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Nome</label>
                <input
                  type="text"
                  value={nomeEdit}
                  onChange={(e) => setNomeEdit(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-semibold text-stone-900 focus:outline-none focus:border-stone-900"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Telefone</label>
                <input
                  type="text"
                  value={telefoneEdit}
                  onChange={(e) => setTelefoneEdit(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-semibold text-stone-900 focus:outline-none focus:border-stone-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setClienteEditando(null)}
                className="px-4 py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs cursor-pointer transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvarEdicaoCliente}
                className="px-4 py-2.5 rounded-2xl bg-stone-900 hover:bg-black text-white font-black text-xs cursor-pointer transition-all shadow-xs flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5 text-amber-400" />
                <span>Salvar</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}