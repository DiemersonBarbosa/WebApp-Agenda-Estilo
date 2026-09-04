'use client';

import React, { useState } from 'react';
import { Store, Save, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ConfiguracoesBarbearia({ barbearia, onUpdate }) {
  const [nome, setNome] = useState(barbearia?.nome || '');
  const [slug, setSlug] = useState(barbearia?.slug || '');
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setSucesso(false);

    try {
      const { error } = await supabase
        .from('barbearias')
        .update({ nome, slug })
        .eq('id', barbearia.id);

      if (error) throw error;

      setSucesso(true);
      if (onUpdate) onUpdate();
      setTimeout(() => setSucesso(false), 3000);
    } catch (err) {
      alert('Erro ao salvar configurações: ' + err.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm overflow-hidden p-6 max-w-2xl">
      <div className="flex items-center gap-3 pb-6 border-b border-stone-100 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-stone-900 text-white flex items-center justify-center">
          <Store className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-stone-900">Configurações da Barbearia</h3>
          <p className="text-xs text-stone-400">Altere o nome e o link público de agendamento.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-stone-600">Nome da Barbearia</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-stone-600">Link Personalizado (Slug)</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900"
            required
          />
          <span className="text-[11px] text-stone-400">Exemplo de URL: seuapp.com/agendar/{slug}</span>
        </div>

        <button
          type="submit"
          disabled={salvando}
          className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3 rounded-xl transition duration-200 text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
        >
          {sucesso ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
          {salvando ? 'Salvando...' : sucesso ? 'Salvo com Sucesso!' : 'Salvar Alterações'}
        </button>
      </form>
    </div>
  );
}