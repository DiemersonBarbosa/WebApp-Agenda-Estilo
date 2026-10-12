'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AgendamentoChat from '@/components/AgendamentoChat';
import AgendamentoClassico from '@/components/AgendamentoClassico';

export default function AgendamentoClientPage({ slug: initialSlug }) {
  const [barbearia, setBarbearia] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarDadosBarbearia() {
      // No APK/SPA, tenta obter o slug dinâmico da URL caso o parâmetro estático seja 'default'
      let slug = initialSlug;
      
      if (typeof window !== 'undefined' && (!slug || slug === 'default')) {
        const pathParts = window.location.pathname.split('/');
        slug = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];
      }

      if (!slug || slug === 'default') {
        setCarregando(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('barbearias')
          .select('*')
          .eq('slug', slug)
          .single();

        if (!error && data) {
          setBarbearia(data);
        }
      } catch (err) {
        console.error('Erro ao buscar barbearia:', err);
      } finally {
        setCarregando(false);
      }
    }

    carregarDadosBarbearia();
  }, [initialSlug]);

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#050507] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-white">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-medium text-slate-400">Carregando agendamento...</span>
        </div>
      </div>
    );
  }

  if (!barbearia) {
    return (
      <div className="min-h-screen bg-[#050507] flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-[2.5rem] bg-gradient-to-br from-[#0c0d10] via-[#050507] to-[#000000] border border-white/10 shadow-2xl text-center space-y-3 backdrop-blur-2xl text-white">
          <h2 className="text-lg font-black text-white">Barbearia não encontrada</h2>
          <p className="text-xs text-slate-400">Verifique o link digitado ou tente novamente mais tarde.</p>
        </div>
      </div>
    );
  }

  const tipoAtendimento = (barbearia.tipo_atendimento || '').trim().toLowerCase();
  const modoAgendamento = (barbearia.modo_agendamento || '').trim().toLowerCase();
  
  const modoClassico = tipoAtendimento === 'classico' || modoAgendamento === 'classico' || modoAgendamento === 'class';
  const isClean = barbearia.cor_tema === 'clean' || barbearia.cor_tema === '#10b981';

  const estiloFundoPagina = isClean 
    ? 'bg-[#f8fafc] text-slate-900' 
    : 'bg-[#050507] text-white';

  const corLuzFundo = isClean ? 'bg-emerald-600/5' : 'bg-emerald-500/10';

  return (
    <main className={`min-h-screen ${estiloFundoPagina} py-8 px-4 relative overflow-x-hidden flex flex-col items-center justify-between transition-colors duration-0`}>
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-72 ${corLuzFundo} blur-[120px] pointer-events-none`}></div>

      <div className="w-full relative z-10 flex justify-center my-auto">
        {modoClassico ? (
          <AgendamentoClassico barbeariaId={barbearia.id} tema={isClean ? 'clean' : 'dark'} />
        ) : (
          <AgendamentoChat barbeariaId={barbearia.id} tema={isClean ? 'clean' : 'dark'} />
        )}
      </div>
    </main>
  );
}