'use client';

import React, { useState, useEffect } from 'react';
import { Award, Gift, Users, Search, Settings, History, Plus, Minus, Edit3, Trash2, X, Check, Power } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function FidelizacaoAdmin({ barbeariaId }) {
  const [clientes, setClientes] = useState([]);
  const [fidelidadeMap, setFidelidadeMap] = useState({});
  const [resgatesHistorico, setResgatesHistorico] = useState([]);
  const [busca, setBusca] = useState('');
  
  const [metaSelos, setMetaSelos] = useState(10);
  const [fidelidadeAtiva, setFidelidadeAtiva] = useState(true);
  const [premioDescricao, setPremioDescricao] = useState('Corte Grátis');
  
  const [clienteEmEdicao, setClienteEmEdicao] = useState(null);
  const [nomeEditado, setNomeEditado] = useState('');
  const [telefoneEditado, setTelefoneEditado] = useState('');

  // Estado para controlar a abertura do Modal de Ajustes
  const [modalAjustesOpen, setModalAjustesOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [salvandoConfig, setSalvandoConfig] = useState(false);

  useEffect(() => {
    async function carregarDadosAdmin() {
      if (!barbeariaId) return;
      setLoading(true);

      try {
        const { data: barbData } = await supabase
          .from('barbearias')
          .select('*')
          .eq('id', barbeariaId)
          .single();

        if (barbData) {
          if (barbData.meta_fidelidade) {
            setMetaSelos(barbData.meta_fidelidade);
          }
          if (barbData.fidelidade_ativa !== undefined) {
            setFidelidadeAtiva(barbData.fidelidade_ativa);
          }
        }

        const { data: cliData } = await supabase
          .from('clientes')
          .select('*')
          .eq('barbearia_id', barbeariaId)
          .order('nome', { ascending: true });

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
          .limit(10);

        setResgatesHistorico(resData || []);

      } catch (err) {
        console.error('Erro ao carregar dados administrativos de fidelização:', err);
      } finally {
        setLoading(false);
      }
    }

    carregarDadosAdmin();
  }, [barbeariaId]);

  const salvarConfiguracoes = async () => {
    setSalvandoConfig(true);
    try {
      const { error } = await supabase
        .from('barbearias')
        .update({ 
          meta_fidelidade: metaSelos,
          fidelidade_ativa: fidelidadeAtiva 
        })
        .eq('id', barbeariaId);

      if (error) throw error;
      alert('Configurações atualizadas com sucesso!');
      setModalAjustesOpen(false);
    } catch (err) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSalvandoConfig(false);
    }
  };

  const alterarSelosAdmin = async (clienteId, delta) => {
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
        premio_concedido: premioDescricao
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
        .limit(10);

      setResgatesHistorico(resData || []);
      alert('Prêmio resgatado com sucesso!');
    } catch (err) {
      alert('Erro ao resgatar prêmio: ' + err.message);
    }
  };

  const iniciarEdicaoCliente = (cli) => {
    setClienteEmEdicao(cli);
    setNomeEditado(cli.nome || '');
    setTelefoneEditado(cli.telefone || '');
  };

  const salvarEdicaoCliente = async () => {
    if (!clienteEmEdicao) return;
    try {
      const { error } = await supabase
        .from('clientes')
        .update({ nome: nomeEditado, telefone: telefoneEditado })
        .eq('id', clienteEmEdicao.id);

      if (error) throw error;

      setClientes(prev => prev.map(c => c.id === clienteEmEdicao.id ? { ...c, nome: nomeEditado, telefone: telefoneEditado } : c));
      setClienteEmEdicao(null);
      alert('Cliente atualizado com sucesso!');
    } catch (err) {
      alert('Erro ao atualizar cliente: ' + err.message);
    }
  };

  const excluirCliente = async (cliId) => {
    if (!confirm('Tem certeza que deseja excluir este cliente? Todos os dados vinculados serão removidos.')) return;

    try {
      await supabase.from('fidelidade_clientes').delete().eq('cliente_id', cliId);
      const { error } = await supabase.from('clientes').delete().eq('id', cliId);
      if (error) throw error;

      setClientes(prev => prev.filter(c => c.id !== cliId));
      alert('Cliente excluído com sucesso.');
    } catch (err) {
      alert('Erro ao excluir cliente: ' + err.message);
    }
  };

  const clientesFiltrados = clientes.filter(c => 
    (c.nome || '').toLowerCase().includes(busca.toLowerCase()) ||
    (c.telefone || '').includes(busca)
  );

  const totalSelosEmitidos = Object.values(fidelidadeMap).reduce((acc, curr) => acc + curr.selos_atuais, 0);
  const totalResgatesFeitos = Object.values(fidelidadeMap).reduce((acc, curr) => acc + curr.total_resgates, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-28 px-2 sm:px-0 text-slate-800 font-sans">
      
      {/* 1. TOPO: 4 CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div 
          className="relative rounded-[2.5rem] p-5 flex items-center justify-between border border-white/10 shadow-2xl overflow-hidden text-white"
          style={{ background: 'linear-gradient(135deg, #18181b 0%, #09090b 50%, #000000 100%)' }}
        >
          <div className="min-w-0 pr-2">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">CLIENTES</span>
            <h3 className="text-2xl font-black text-white mt-1 truncate">{clientes.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
            <Users className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        <div 
          className="relative rounded-[2.5rem] p-5 flex items-center justify-between border border-white/10 shadow-2xl overflow-hidden text-white"
          style={{ background: 'linear-gradient(135deg, #18181b 0%, #09090b 50%, #000000 100%)' }}
        >
          <div className="min-w-0 pr-2">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">SELOS ATIVOS</span>
            <h3 className="text-2xl font-black text-white mt-1 truncate">{totalSelosEmitidos}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
            <Award className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        <div 
          className="relative rounded-[2.5rem] p-5 flex items-center justify-between border border-white/10 shadow-2xl overflow-hidden text-white"
          style={{ background: 'linear-gradient(135deg, #18181b 0%, #09090b 50%, #000000 100%)' }}
        >
          <div className="min-w-0 pr-2">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">RESGATES</span>
            <h3 className="text-2xl font-black text-white mt-1 truncate">{totalResgatesFeitos}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
            <Gift className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        <div 
          onClick={() => setModalAjustesOpen(true)}
          className="relative rounded-[2.5rem] p-5 flex items-center justify-between bg-white border border-slate-200/80 shadow-lg cursor-pointer transition-all hover:border-emerald-700/50 hover:shadow-xl group"
        >
          <div className="min-w-0 pr-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">STATUS</span>
            <span className={`text-sm font-black mt-1 block truncate transition-colors ${fidelidadeAtiva ? 'text-emerald-700' : 'text-rose-600'}`}>
              {fidelidadeAtiva ? 'Ativo' : 'Desativado'}
            </span>
          </div>
          <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-inner transition-all ${fidelidadeAtiva ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-600'}`}>
            <Settings className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* AVISO CASO ESTEJA DESATIVADO */}
      {!fidelidadeAtiva && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between shadow-xs">
          <span>⚠️ O programa de fidelidade está atualmente <strong>desativado</strong> para os seus clientes. Você ainda pode gerenciar os dados abaixo, mas eles não visualizarão o progresso na página de agendamento.</span>
          <button 
            onClick={() => setModalAjustesOpen(true)}
            className="px-3 py-1.5 bg-amber-800 text-white rounded-xl font-bold text-[10px] shrink-0 ml-3 hover:bg-amber-900 transition-colors"
          >
            Ativar Agora
          </button>
        </div>
      )}

      {/* 2. GRANDE PAINEL CENTRAL (GESTÃO DE CLIENTES) */}
      <div className="p-6 sm:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-xl space-y-6">
        
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className={`w-3 h-3 rounded-full shadow-sm ${fidelidadeAtiva ? 'bg-emerald-700' : 'bg-slate-400'}`}></div>
          <div>
            <h2 className="font-black text-slate-900 text-base tracking-tight">Gestão de Clientes e Metas de Fidelidade</h2>
            <p className="text-xs text-slate-500 mt-0.5">Controle o progresso dos selos e gerencie os cartões dos clientes.</p>
          </div>
        </div>

        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar cliente por nome ou celular..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 shadow-2xs"
          />
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 py-12 text-center animate-pulse">Carregando cartões de clientes...</p>
        ) : clientesFiltrados.length === 0 ? (
          <p className="text-xs text-slate-400 py-12 text-center">Nenhum cliente encontrado.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clientesFiltrados.map((cliente) => {
              const fid = fidelidadeMap[cliente.id] || { selos_atuais: 0, total_resgates: 0 };
              const selos = fid.selos_atuais;
              const percentual = Math.min(100, (selos / metaSelos) * 100);
              const atingiuMeta = selos >= metaSelos;

              return (
                <div 
                  key={cliente.id} 
                  className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-3.5 shadow-2xs flex flex-col justify-between transition-all hover:border-slate-300"
                >
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 pr-2">
                      <span className="font-black text-slate-900 text-xs tracking-tight truncate block">{cliente.nome}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">{cliente.telefone || 'Sem telefone'}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => iniciarEdicaoCliente(cliente)}
                        className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-all cursor-pointer border border-slate-200 shadow-2xs"
                        title="Editar Cliente"
                      >
                        <Edit3 className="w-3 h-3 text-sky-700" />
                      </button>
                      <button
                        onClick={() => excluirCliente(cliente.id)}
                        className="w-7 h-7 rounded-lg bg-white hover:bg-rose-50 text-slate-600 flex items-center justify-center transition-all cursor-pointer border border-slate-200 hover:border-rose-200 shadow-2xs"
                        title="Excluir Cliente"
                      >
                        <Trash2 className="w-3 h-3 text-rose-600" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className={atingiuMeta ? 'text-emerald-800 font-black' : 'text-slate-700'}>
                      {atingiuMeta ? '🎁 Resgate Disponível!' : `${selos} / ${metaSelos} Selos`}
                    </span>
                    <span className="text-slate-400 font-medium">Resgates: {fid.total_resgates}</span>
                  </div>

                  <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden p-0.5">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${atingiuMeta ? 'bg-emerald-700 shadow-sm' : 'bg-emerald-900'}`}
                      style={{ width: `${percentual}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => alterarSelosAdmin(cliente.id, -1)}
                        disabled={selos <= 0}
                        className="w-7 h-7 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 disabled:opacity-30 text-slate-700 flex items-center justify-center transition-all cursor-pointer text-xs font-bold shadow-2xs"
                        title="Remover selo"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => alterarSelosAdmin(cliente.id, 1)}
                        className="w-7 h-7 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center justify-center transition-all cursor-pointer font-bold text-xs"
                        title="Adicionar selo"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {atingiuMeta && (
                      <button
                        onClick={() => resgatarPremioAdmin(cliente.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white font-black text-[10px] transition-all shadow-sm cursor-pointer flex items-center gap-1"
                      >
                        <Gift className="w-3 h-3" />
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

      {/* 3. HISTÓRICO RECENTE */}
      <div className="p-6 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-xl space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800">
            <History className="w-4 h-4" />
          </div>
          <h3 className="font-black text-slate-900 text-sm tracking-tight">Histórico Recente de Resgates</h3>
        </div>

        {resgatesHistorico.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">Nenhum prêmio resgatado até o momento.</p>
        ) : (
          <div className="space-y-2.5">
            {resgatesHistorico.map((res) => {
              const dataResgate = new Date(res.criado_em).toLocaleString('pt-BR', {
                dateStyle: 'short',
                timeStyle: 'short'
              });
              return (
                <div key={res.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs shadow-2xs">
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">{res.clientes?.nome || 'Cliente'}</span>
                    <span className="text-[11px] text-slate-500">{res.clientes?.telefone || 'Sem telefone'} • <strong className="text-emerald-800">{res.premio_concedido}</strong></span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400">{dataResgate}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL DE AJUSTES (CONFIGURAÇÃO DE META E STATUS) */}
      {modalAjustesOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white border border-slate-200 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-800" />
                <h3 className="font-black text-slate-900 text-sm">Ajustes do Programa</h3>
              </div>
              <button 
                onClick={() => setModalAjustesOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 py-2">
              {/* BOTÃO DE ATIVAR / DESATIVAR */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 block">Status do Programa</span>
                  <span className="text-[10px] text-slate-500 block">Habilitar ou desabilitar o sistema de fidelidade.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFidelidadeAtiva(!fidelidadeAtiva)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                    fidelidadeAtiva 
                      ? 'bg-emerald-700 text-white' 
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{fidelidadeAtiva ? 'Ativado' : 'Desativado'}</span>
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Meta de Selos para Resgate</label>
                <p className="text-[10px] text-slate-400 mb-2">Defina quantos selos o cliente precisa acumular para ganhar o prêmio.</p>
                <input 
                  type="number"
                  min="1"
                  max="30"
                  value={metaSelos}
                  onChange={(e) => setMetaSelos(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-emerald-700"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setModalAjustesOpen(false)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={salvarConfiguracoes}
                disabled={salvandoConfig}
                className="w-1/2 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white font-black text-xs transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{salvandoConfig ? 'Salvando...' : 'Salvar Alterações'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE CLIENTE */}
      {clienteEmEdicao && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm">Editar Cliente</h3>
              <button 
                onClick={() => setClienteEmEdicao(null)}
                className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Nome Completo</label>
                <input 
                  type="text"
                  value={nomeEditado}
                  onChange={(e) => setNomeEditado(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-emerald-700"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Celular / WhatsApp</label>
                <input 
                  type="text"
                  value={telefoneEditado}
                  onChange={(e) => setTelefoneEditado(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-emerald-700"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setClienteEmEdicao(null)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={salvarEdicaoCliente}
                className="w-1/2 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white font-black text-xs transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Salvar</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}