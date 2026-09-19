'use client';

import React, { useState } from 'react';
import { Store, Save, Check, Image as ImageIcon, Layout, ExternalLink, Share2, Copy, MessageCircle, Send, X, MessageSquare, Bot, Grid, Sparkles, Palette } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ConfiguracoesBarbearia({ barbearia, onUpdate }) {
  const [nome, setNome] = useState(barbearia?.nome || '');
  const [slug, setSlug] = useState(barbearia?.slug || '');
  const [logoUrl, setLogoUrl] = useState(barbearia?.logo_url || '');
  const [capaUrl, setCapaUrl] = useState(barbearia?.capa_url || '');
  
  const [temaVisual, setTemaVisual] = useState(barbearia?.cor_tema === '#10b981' || barbearia?.cor_tema === 'clean' ? 'clean' : 'dark');
  const [modoAtendimento, setModoAtendimento] = useState(
    barbearia?.tipo_atendimento || barbearia?.modo_agendamento || barbearia?.modo_chatbot || 'conversacional'
  );

  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [modalCompartilharOpen, setModalCompartilharOpen] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const corDestaqueAtiva = temaVisual === 'clean' ? '#0ea5e9' : '#10b981';

  const urlCliente = typeof window !== 'undefined' 
    ? `${window.location.origin}/agendar/${slug || barbearia?.slug || 'barbearia'}`
    : `https://seuapp.com/agendar/${slug || 'barbearia'}`;

  const handleCopiarLink = () => {
    navigator.clipboard.writeText(urlCliente);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  const handleCompartilharWhatsApp = () => {
    const texto = encodeURIComponent(`Olá! Agende seu horário na ${nome || 'nossa barbearia'} através do link abaixo: \n\n${urlCliente}`);
    window.open(`https://api.whatsapp.com/send?text=${texto}`, '_blank');
  };

  const handleCompartilharTelegram = () => {
    const texto = encodeURIComponent(`Agende seu horário na ${nome || 'nossa barbearia'}: ${urlCliente}`);
    window.open(`https://t.me/share/url?url=${urlCliente}&text=${texto}`, '_blank');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setSucesso(false);

    try {
      const { error } = await supabase
        .from('barbearias')
        .update({ 
          nome, 
          slug, 
          logo_url: logoUrl, 
          capa_url: capaUrl,
          cor_tema: temaVisual,
          tipo_atendimento: modoAtendimento,
          modo_agendamento: modoAtendimento
        })
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
    <div className="max-w-4xl mx-auto space-y-6 pb-28 px-4 sm:px-6 text-slate-100 font-sans">
      
      {/* CAPA E PERFIL UNIFICADOS */}
      <div className="relative rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        <div className="relative h-44 sm:h-52 w-full bg-slate-950 overflow-hidden">
          {capaUrl ? (
            <img src={capaUrl} alt="Capa" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-slate-900 to-slate-950 flex items-center justify-center">
              <span className="text-xs font-medium text-slate-500 tracking-wider uppercase">Nenhuma capa cadastrada</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
          
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            <button 
              type="button"
              onClick={() => setModalCompartilharOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md rounded-xl text-xs font-semibold text-white shadow transition-all cursor-pointer border border-slate-700 active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" style={{ color: corDestaqueAtiva }} />
              <span>Compartilhar</span>
            </button>
            <a 
              href={`/agendar/${slug || 'barbearia'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-9 h-9 bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md rounded-xl text-white shadow transition-all cursor-pointer border border-slate-700"
              title="Abrir página pública"
            >
              <ExternalLink className="w-4 h-4" style={{ color: corDestaqueAtiva }} />
            </a>
          </div>
        </div>

        <div className="px-6 sm:px-8 pb-6 pt-0 relative flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-14 sm:-mt-16">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="relative z-20">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-900 p-1 shadow-2xl border-2 border-slate-800 overflow-hidden flex items-center justify-center">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 text-white rounded-xl flex items-center justify-center font-black text-2xl">
                    {(nome || 'B').charAt(0)}
                  </div>
                )}
              </div>
              <span className="absolute bottom-1 right-1 w-4 h-4 border-2 border-slate-950 rounded-full shadow" style={{ backgroundColor: corDestaqueAtiva }}></span>
            </div>
            <div className="pt-2 sm:pt-0">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">{nome || 'Minha Barbearia'}</h1>
              <p className="text-xs text-slate-400 mt-0.5">Painel de Configurações • Personalize a experiência dos seus clientes</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* BLOCO ÚNICO DE CONFIGURAÇÕES (ESTILO PAINEL CONTÍNUO) */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl space-y-8">
          
          {/* SEÇÃO 1: IDENTIDADE E ACESSO */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <Store className="w-4 h-4" style={{ color: corDestaqueAtiva }} />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">Identidade e Acesso</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Nome da Barbearia</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-medium text-white focus:outline-none focus:border-slate-600 transition-all shadow-inner"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Link Personalizado (Slug)</label>
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl overflow-hidden focus-within:border-slate-600 shadow-inner">
                  <span className="pl-3.5 text-[11px] text-slate-500 font-medium">/agendar/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full bg-transparent px-2 py-3 text-xs font-medium text-white focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: MÍDIA & IDENTIDADE VISUAL */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <Palette className="w-4 h-4" style={{ color: corDestaqueAtiva }} />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">Mídia & Identidade Visual</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">URL da Logo / Perfil</label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://exemplo.com/logo.png"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-medium text-white focus:outline-none focus:border-slate-600 transition-all shadow-inner"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">URL da Imagem de Capa</label>
                <input
                  type="url"
                  value={capaUrl}
                  onChange={(e) => setCapaUrl(e.target.value)}
                  placeholder="https://exemplo.com/capa.png"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-medium text-white focus:outline-none focus:border-slate-600 transition-all shadow-inner"
                />
              </div>
            </div>

            {/* SELETOR DE TEMAS */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-slate-300 block">Padrão de Cores e Estilo Visual</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                <div 
                  onClick={() => setTemaVisual('clean')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    temaVisual === 'clean' 
                      ? 'bg-sky-500/10 border-sky-500 shadow-sm' 
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 text-slate-950 flex items-center justify-center font-bold text-xs shadow">✨</div>
                      <div>
                        <h4 className="font-bold text-white text-xs">Modo Clean</h4>
                        <p className="text-[10px] text-slate-400">Tons claros e elegantes</p>
                      </div>
                    </div>
                    {temaVisual === 'clean' && <Check className="w-4 h-4 text-sky-400" />}
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-900 space-y-1.5 pointer-events-none">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded bg-sky-500 text-white flex items-center justify-center text-[8px]">🤖</div>
                      <div className="bg-white p-1.5 rounded-lg text-[8px] border border-slate-200 text-slate-800">Olá! Qual o serviço?</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-[8px] font-bold text-slate-800 flex justify-between">
                      <span>Corte Cabelo</span>
                      <span className="text-sky-600">R$ 40,00</span>
                    </div>
                  </div>
                </div>

                <div 
                  onClick={() => setTemaVisual('dark')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    temaVisual === 'dark' 
                      ? 'bg-emerald-500/10 border-emerald-500 shadow-sm' 
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-700 text-slate-950 flex items-center justify-center font-bold text-xs shadow">🖤</div>
                      <div>
                        <h4 className="font-bold text-white text-xs">Modo Dark</h4>
                        <p className="text-[10px] text-slate-400">Tons escuros sofisticados</p>
                      </div>
                    </div>
                    {temaVisual === 'dark' && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white space-y-1.5 pointer-events-none">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded bg-emerald-500 text-slate-950 flex items-center justify-center text-[8px]">🤖</div>
                      <div className="bg-slate-900 p-1.5 rounded-lg text-[8px] border border-slate-800 text-slate-200">Olá! Qual o serviço?</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[8px] font-bold text-white flex justify-between">
                      <span>Corte Cabelo</span>
                      <span className="text-emerald-400">R$ 40,00</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* SEÇÃO 3: EXPERIÊNCIA DE ATENDIMENTO */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <MessageSquare className="w-4 h-4" style={{ color: corDestaqueAtiva }} />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">Experiência de Atendimento</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              <div 
                onClick={() => setModoAtendimento('conversacional')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  modoAtendimento === 'conversacional'
                    ? 'border-opacity-100 shadow-sm'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
                style={modoAtendimento === 'conversacional' ? { backgroundColor: `${corDestaqueAtiva}10`, borderColor: corDestaqueAtiva } : {}}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-950 font-bold shadow" style={{ backgroundColor: corDestaqueAtiva }}>
                    <Bot className="w-4 h-4" />
                  </div>
                  {modoAtendimento === 'conversacional' && (
                    <span className="text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border" style={{ backgroundColor: `${corDestaqueAtiva}20`, color: corDestaqueAtiva, borderColor: `${corDestaqueAtiva}40` }}>
                      Ativo
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs">Modo Conversacional</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Chat interativo guiado passo a passo.</p>
                </div>
              </div>

              <div 
                onClick={() => setModoAtendimento('classico')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  modoAtendimento === 'classico'
                    ? 'border-opacity-100 shadow-sm'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
                style={modoAtendimento === 'classico' ? { backgroundColor: `${corDestaqueAtiva}10`, borderColor: corDestaqueAtiva } : {}}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-950 font-bold shadow" style={{ backgroundColor: corDestaqueAtiva }}>
                    <Grid className="w-4 h-4" />
                  </div>
                  {modoAtendimento === 'classico' && (
                    <span className="text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border" style={{ backgroundColor: `${corDestaqueAtiva}20`, color: corDestaqueAtiva, borderColor: `${corDestaqueAtiva}40` }}>
                      Ativo
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs">Modo Clássico</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Layout tradicional em grade para seleção rápida.</p>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* BOTÃO DE SALVAR */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={salvando}
            className="w-full py-4 rounded-2xl text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.99] shadow-xl flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            style={{ backgroundColor: corDestaqueAtiva }}
          >
            {sucesso ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{salvando ? 'Salvando alterações...' : sucesso ? 'Alterações salvas com sucesso!' : 'Salvar Alterações'}</span>
          </button>
        </div>

      </form>

      {/* MODAL DE COMPARTILHAMENTO */}
      {modalCompartilharOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 space-y-6 relative text-white">
            <button 
              type="button"
              onClick={() => setModalCompartilharOpen(false)}
              className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: corDestaqueAtiva }}>Divulgação</span>
              <h3 className="text-base font-bold text-white">Compartilhar Link do Cliente</h3>
              <p className="text-xs text-slate-400">Envie o link de agendamento online diretamente para seus clientes.</p>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-2 rounded-2xl shadow-inner">
              <input 
                type="text" 
                readOnly 
                value={urlCliente} 
                className="w-full bg-transparent px-3 text-xs font-medium text-slate-200 outline-none truncate"
              />
              <button 
                type="button"
                onClick={handleCopiarLink}
                className="px-4 py-2.5 text-slate-950 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer shadow"
                style={{ backgroundColor: corDestaqueAtiva }}
              >
                {copiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiado ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>

            <div className="space-y-2.5 pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Enviar via Redes Sociais</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleCompartilharWhatsApp}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={handleCompartilharTelegram}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 font-bold text-xs transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Telegram</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}