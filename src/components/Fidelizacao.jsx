'use client';

import React, { useState, useEffect } from 'react';
import { Award, Gift, Users, Star, Plus, Minus, CheckCircle2, Search, Sparkles, History } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Fidelizacao({ barbeariaId }) {
  const [clientes, setClientes] = useState([]);
  const [fidelidadeMap, setFidelidadeMap] = useState({});
  const [resgatesHistorico, setResgatesHistorico] = useState([]);
  const [busca, setBusca] = useState('');
  const [metaSelos, setMetaSelos] = useState(10);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function carregarDadosFidelidade() {
      if (!barbeariaId) return;
      setLoading(true);

      try {
        // 1. Buscar clientes da unidade
        const { data: cliData } = await supabase
          .from('clientes')
          .select('*')
          .eq('barbearia_id', barbeariaId);

        setClientes(cliData || []);

        // 2. Buscar registros de fidelidade
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

        // 3. Buscar histórico de resgates com os dados do cliente
        const { data: resData } = await supabase
          .from('fidelidade_resgates')
          .select('*, clientes(nome, telefone)')
          .eq('barbearia_id', barbeariaId)
          .order('criado_em', { ascending: false })
          .limit(10);

        setResgatesHistorico(resData || []);

      } catch (err) {
        console.error('Erro ao carregar dados de fidelização:', err);
      } finally {
        setLoading(false);
      }
    }

    carregarDadosFidelidade();
  }, [barbeariaId]);

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

      // Recarregar histórico
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

  const clientesFiltrados = clientes.filter(c => 
    (c.nome || '').toLowerCase().includes(busca.toLowerCase()) ||
    (c.telefone || '').includes(busca)
  );

  const totalSelosEmitidos = Object.values(fidelidadeMap).reduce((acc, curr) => acc + curr.selos_atuais, 0);
  const totalResgatesFeitos = Object.values(fidelidadeMap).reduce((acc, curr) => acc + curr.total_resgates, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-28 px-2 sm:px-0 text-slate-100 font-sans">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 p-5 rounded-3xl backdrop-blur-xl shadow-xl">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">Fidelização de Clientes</h1>
          <p className="text-xs text-slate-400 mt-0.5">Gerencie os cartões de fidelidade e premie seus clientes mais frequentes.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-2xl text-xs font-semibold text-slate-300 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Meta: {metaSelos} Selos</span>
        </div>
      </div>

      {/* CARDS DE INDICADORES (KPIS) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5 md:gap-5">
        
        <div 
          className="relative rounded-3xl md:rounded-[2.5rem] p-5 sm:p-6 md:p-7 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden shadow-xl"
          style={{ background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)', boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5)' }}
        >
          <div className="flex flex-col justify-center min-w-0 pr-2">
            <span className="text-[9px] sm:text-[10px] md:text-xs font-bold text-stone-400 uppercase tracking-wider truncate block">Total Clientes</span>
            <h3 className="text-lg sm:text-2xl md:text-3xl font-black text-white mt-1 truncate">{clientes.length}</h3>
            <p className="text-[10px] text-emerald-400 font-medium mt-0.5">Base cadastrada</p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shrink-0 shadow-lg" style={{ background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)' }}>
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-stone-800" />
          </div>
        </div>

        <div 
          className="relative rounded-3xl md:rounded-[2.5rem] p-5 sm:p-6 md:p-7 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden shadow-xl"
          style={{ background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)', boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5)' }}
        >
          <div className="flex flex-col justify-center min-w-0 pr-2">
            <span className="text-[9px] sm:text-[10px] md:text-xs font-bold text-stone-400 uppercase tracking-wider truncate block">Selos Ativos</span>
            <h3 className="text-lg sm:text-2xl md:text-3xl font-black text-white mt-1 truncate">{totalSelosEmitidos}</h3>
            <p className="text-[10px] text-amber-400 font-medium mt-0.5">Em circulação</p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shrink-0 shadow-lg" style={{ background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)' }}>
            <Award className="w-5 h-5 sm:w-6 sm:h-6 text-stone-800" />
          </div>
        </div>

        <div 
          className="relative rounded-3xl md:rounded-[2.5rem] p-5 sm:p-6 md:p-7 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden shadow-xl col-span-2 lg:col-span-1"
          style={{ background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)', boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5)' }}
        >
          <div className="flex flex-col justify-center min-w-0 pr-2">
            <span className="text-[9px] sm:text-[10px] md:text-xs font-bold text-stone-400 uppercase tracking-wider truncate block">Prêmios Resgatados</span>
            <h3 className="text-lg sm:text-2xl md:text-3xl font-black text-white mt-1 truncate">{totalResgatesFeitos}</h3>
            <p className="text-[10px] text-sky-400 font-medium mt-0.5">Brindes entregues</p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shrink-0 shadow-lg" style={{ background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)' }}>
            <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-stone-800" />
          </div>
        </div>

      </div>

      {/* LISTA DE CLIENTES E CONTROLE DE SELOS */}
      <div className="bg-slate-900/80 rounded-[2.5rem] border border-slate-800 shadow-xl p-6 sm:p-8 space-y-5 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-extrabold text-white text-sm sm:text-base tracking-tight flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            Cartões Fidelidade dos Clientes
          </h3>
          
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar cliente por nome ou celular..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 shadow-inner"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 py-12 text-center">Carregando dados de fidelização...</p>
        ) : clientesFiltrados.length === 0 ? (
          <p className="text-xs text-slate-400 py-12 text-center">Nenhum cliente encontrado.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {clientesFiltrados.map((cliente) => {
              const fid = fidelidadeMap[cliente.id] || { selos_atuais: 0, total_resgates: 0 };
              const selos = fid.selos_atuais;
              const percentual = Math.min(100, (selos / metaSelos) * 100);
              const atingiuMeta = selos >= metaSelos;

              return (
                <div key={cliente.id} className="p-5 rounded-3xl bg-slate-950/70 border border-slate-800/80 space-y-4 shadow-inner flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-white text-xs block">{cliente.nome}</span>
                      <span className="text-[11px] text-slate-400">{cliente.telefone || 'Sem telefone'}</span>
                    </div>
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-xl border ${
                      atingiuMeta 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {atingiuMeta ? '🎁 Resgate Disponível' : `${selos} / ${metaSelos} Selos`}
                    </span>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="space-y-1.5">
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${atingiuMeta ? 'bg-emerald-400' : 'bg-amber-400'}`}
                        style={{ width: `${percentual}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                      <span>Resgates feitos: {fid.total_resgates}</span>
                      <span>{atingiuMeta ? 'Pronto para resgatar!' : `Faltam ${metaSelos - selos} selos`}</span>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => alterarSelos(cliente.id, -1)}
                        disabled={selos <= 0}
                        className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white flex items-center justify-center transition-all cursor-pointer"
                        title="Remover selo"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => alterarSelos(cliente.id, 1)}
                        className="w-8 h-8 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 flex items-center justify-center transition-all cursor-pointer font-bold text-xs"
                        title="Adicionar selo"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {atingiuMeta && (
                      <button
                        onClick={() => resgatarPremioAdmin(cliente.id)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>Resgatar Prêmio</span>
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* HISTÓRICO RECENTE DE RESGATES */}
      <div className="bg-slate-900/80 rounded-[2.5rem] border border-slate-800 shadow-xl p-6 sm:p-8 space-y-4 backdrop-blur-xl">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
          <History className="w-5 h-5 text-sky-400" />
          <h3 className="font-extrabold text-white text-sm sm:text-base tracking-tight">Histórico Recente de Resgates</h3>
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
                <div key={res.id} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">{res.clientes?.nome || 'Cliente'}</span>
                    <span className="text-[11px] text-slate-400">{res.clientes?.telefone || 'Sem telefone'} • <strong className="text-amber-400">{res.premio_concedido}</strong></span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500">{dataResgate}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}