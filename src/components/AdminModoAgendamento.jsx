'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, LayoutGrid, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminModoAgendamento({ barbeariaId }) {
  const [modoAtivo, setModoAtivo] = useState('conversa');
  const [salvando, setSalvando] = useState(false);

  // Carrega o modo atual salvo no Supabase ao iniciar
  useEffect(() => {
    if (!supabase || !barbeariaId) return;

    const carregarModoAtual = async () => {
      const { data, error } = await supabase
        .from('barbearias')
        .select('modo_agendamento')
        .eq('id', barbeariaId)
        .maybeSingle();

      if (!error && data?.modo_agendamento) {
        setModoAtivo(data.modo_agendamento);
      }
    };

    carregarModoAtual();
  }, [barbeariaId]);

  const alterarModo = async (novoModo) => {
    setModoAtivo(novoModo);
    setSalvando(true);

    if (!supabase || !barbeariaId) {
      setSalvando(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('barbearias')
        .update({ modo_agendamento: novoModo })
        .eq('id', barbeariaId);

      if (error) throw error;
    } catch (err) {
      console.error('Erro ao atualizar modo de agendamento:', err);
      alert('Erro ao salvar alteração no banco de dados.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Opção Modo Conversacional */}
        <div 
          onClick={() => alterarModo('conversa')}
          className={`relative p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
            modoAtivo === 'conversa'
              ? 'bg-stone-900 border-emerald-500 text-white shadow-md'
              : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              modoAtivo === 'conversa' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white text-stone-500 border-stone-200'
            }`}>
              <MessageSquare className="w-5 h-5" />
            </div>
            {modoAtivo === 'conversa' && (
              <span className="flex items-center gap-1 text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Ativo
              </span>
            )}
          </div>
          <div>
            <h4 className="font-black text-sm">Modo Conversacional</h4>
            <p className="text-[11px] mt-0.5 opacity-80">Chat interativo guiado passo a passo para o cliente agendar.</p>
          </div>
        </div>

        {/* Opção Modo Clássico */}
        <div 
          onClick={() => alterarModo('classico')}
          className={`relative p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
            modoAtivo === 'classico'
              ? 'bg-stone-900 border-emerald-500 text-white shadow-md'
              : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              modoAtivo === 'classico' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white text-stone-500 border-stone-200'
            }`}>
              <LayoutGrid className="w-5 h-5" />
            </div>
            {modoAtivo === 'classico' && (
              <span className="flex items-center gap-1 text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Ativo
              </span>
            )}
          </div>
          <div>
            <h4 className="font-black text-sm">Modo Clássico</h4>
            <p className="text-[11px] mt-0.5 opacity-80">Layout tradicional em grelha para seleção direta.</p>
          </div>
        </div>

      </div>

      {salvando && (
        <p className="text-[10px] text-stone-400 font-bold text-right">A sincronizar com o Supabase...</p>
      )}
    </div>
  );
}