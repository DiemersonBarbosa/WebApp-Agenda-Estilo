'use client';

import React, { useState } from 'react';
import { Store, Save, Check, Image as ImageIcon, Palette, Layout, ExternalLink, Share2, Copy, MessageCircle, Send, X, MessageSquare, Bot, Grid } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ConfiguracoesBarbearia({ barbearia, onUpdate }) {
  const [nome, setNome] = useState(barbearia?.nome || '');
  const [slug, setSlug] = useState(barbearia?.slug || '');
  const [logoUrl, setLogoUrl] = useState(barbearia?.logo_url || '');
  const [capaUrl, setCapaUrl] = useState(barbearia?.capa_url || '');
  const [corTema, setCorTema] = useState(barbearia?.cor_tema || '#10b981');
  
  const [modoAtendimento, setModoAtendimento] = useState(
    barbearia?.tipo_atendimento || barbearia?.modo_agendamento || barbearia?.modo_chatbot || 'conversacional'
  );

  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  
  const [modalCompartilharOpen, setModalCompartilharOpen] = useState(false);
  const [copiado, setCopiado] = useState(false);

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
          cor_tema: corTema, // <-- Salva a cor personalizada no banco
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
    <div className="max-w-4xl mx-auto space-y-6 pb-28 px-2 sm:px-0 text-slate-100">
      
      {/* HEADER DE CAPA E AVATAR */}
      <div className="bg-gradient-to-br from-[#0c0d10] via-[#050507] to-[#000000] rounded-[2.5rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-2xl">
        <div className="relative h-44 sm:h-56 w-full bg-stone-900 overflow-hidden">
          {capaUrl ? (
            <img src={capaUrl} alt="Capa" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center">
              <span className="text-xs font-bold text-stone-500 tracking-wider uppercase">Sem imagem de capa cadastrada</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
          
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            <button 
              onClick={() => setModalCompartilharOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-2xl text-xs font-bold text-white shadow-lg transition-all cursor-pointer border border-white/15 active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" style={{ color: corTema }} />
              <span>Compartilhar Link</span>
            </button>
            <a 
              href={`/agendar/${slug || 'barbearia'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-9 h-9 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-2xl text-white shadow-lg transition-all cursor-pointer border border-white/15"
              title="Abrir em nova aba"
            >
              <ExternalLink className="w-4 h-4" style={{ color: corTema }} />
            </a>
          </div>
        </div>

        <div className="px-6 pb-8 pt-0 relative flex flex-col items-center text-center">
          <div className="-mt-16 sm:-mt-20 mb-4 relative z-20">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-[2rem] bg-black/60 p-1.5 shadow-2xl border border-white/20 overflow-hidden flex items-center justify-center backdrop-blur-xl">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-[1.6rem]" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-stone-800 to-black text-white rounded-[1.6rem] flex items-center justify-center font-black text-2xl">
                  {(nome || 'B').charAt(0)}
                </div>
              )}
            </div>
            <span className="absolute bottom-1 right-1 w-4 h-4 border-2 border-black rounded-full shadow-[0_0_10px]" style={{ backgroundColor: corTema }}></span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">{nome || 'Sua Barbearia'}</h2>
          <p className="text-xs text-slate-400 font-medium mt-1 max-w-md">Personalize a identidade visual, altere links de acesso e configure as preferências da sua unidade.</p>
        </div>
      </div>

      {/* FORMULÁRIO DE CONFIGURAÇÕES */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* BLOCO 1: IDENTIFICAÇÃO */}
        <div className="bg-gradient-to-br from-[#0c0d10] via-[#050507] to-[#000000] rounded-[2.5rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-6 sm:p-8 space-y-5 backdrop-blur-2xl">
          <div className="flex items-center gap-3 pb-4 border-b border-white/10">
            <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-md shrink-0" style={{ color: corTema }}>
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight">Identidade e Acesso</h3>
              <p className="text-[11px] text-slate-400">Nome comercial e link exclusivo para o agendamento dos clientes.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Nome da Barbearia</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 text-xs font-bold text-white focus:outline-none transition-all shadow-inner backdrop-blur-md"
                style={{ '--tw-border-opacity': '1' }}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Link Personalizado (Slug)</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 text-xs font-bold text-white focus:outline-none transition-all shadow-inner backdrop-blur-md"
                required
              />
              <span className="text-[10px] text-slate-400 font-medium pl-1 block mt-1">URL: seuapp.com/agendar/{slug || 'url'}</span>
            </div>
          </div>
        </div>

        {/* BLOCO 2: MÍDIA E TEMA VISUAL */}
        <div className="bg-gradient-to-br from-[#0c0d10] via-[#050507] to-[#000000] rounded-[2.5rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-6 sm:p-8 space-y-5 backdrop-blur-2xl">
          <div className="flex items-center gap-3 pb-4 border-b border-white/10">
            <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-md shrink-0" style={{ color: corTema }}>
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight">Mídia, Imagens & Cores</h3>
              <p className="text-[11px] text-slate-400">Insira os links das imagens oficiais e defina a cor principal.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" style={{ color: corTema }} /> URL da Logo / Perfil
              </label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://exemplo.com/logo.png"
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 text-xs font-bold text-white focus:outline-none transition-all shadow-inner backdrop-blur-md"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5" style={{ color: corTema }} /> URL da Imagem de Capa
              </label>
              <input
                type="url"
                value={capaUrl}
                onChange={(e) => setCapaUrl(e.target.value)}
                placeholder="https://exemplo.com/capa.png"
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 text-xs font-bold text-white focus:outline-none transition-all shadow-inner backdrop-blur-md"
              />
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" style={{ color: corTema }} /> Cor Principal do Tema
              </label>
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-2xl border border-white/20 overflow-hidden shadow-inner shrink-0 flex items-center justify-center">
                  <input
                    type="color"
                    value={corTema}
                    onChange={(e) => setCorTema(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="w-full h-full" style={{ backgroundColor: corTema }}></div>
                </div>
                <input
                  type="text"
                  value={corTema}
                  onChange={(e) => setCorTema(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 text-xs font-bold text-white focus:outline-none transition-all shadow-inner uppercase tracking-wider backdrop-blur-md"
                />
              </div>
            </div>
          </div>
        </div>

        {/* BLOCO 3: EXPERIÊNCIA DO CLIENTE */}
        <div className="bg-gradient-to-br from-[#0c0d10] via-[#050507] to-[#000000] rounded-[2.5rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-6 sm:p-8 space-y-5 backdrop-blur-2xl">
          <div className="flex items-center gap-3 pb-4 border-b border-white/10">
            <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-md shrink-0" style={{ color: corTema }}>
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight">Experiência do Cliente</h3>
              <p className="text-[11px] text-slate-400">Escolha o formato de atendimento exibido no link de agendamento.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div 
              onClick={() => setModoAtendimento('conversacional')}
              className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between backdrop-blur-xl ${
                modoAtendimento === 'conversacional'
                  ? 'border-opacity-100 shadow-lg'
                  : 'bg-black/40 border-white/10 hover:border-white/20'
              }`}
              style={modoAtendimento === 'conversacional' ? { backgroundColor: `${corTema}15`, borderColor: corTema } : {}}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${modoAtendimento === 'conversacional' ? 'text-slate-950 shadow-lg' : 'bg-white/5 text-slate-400 border border-white/10'}`} style={modoAtendimento === 'conversacional' ? { backgroundColor: corTema } : {}}>
                  <Bot className="w-5 h-5" />
                </div>
                {modoAtendimento === 'conversacional' && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1 shadow-sm border" style={{ backgroundColor: `${corTema}33`, color: corTema, borderColor: `${corTema}66` }}>
                    <Check className="w-3 h-3" /> Ativo
                  </span>
                )}
              </div>
              <div>
                <h4 className="font-extrabold text-white text-sm">Modo Conversacional</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Chat interativo guiado passo a passo com inteligência para o cliente agendar.</p>
              </div>
            </div>

            <div 
              onClick={() => setModoAtendimento('classico')}
              className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between backdrop-blur-xl ${
                modoAtendimento === 'classico'
                  ? 'border-opacity-100 shadow-lg'
                  : 'bg-black/40 border-white/10 hover:border-white/20'
              }`}
              style={modoAtendimento === 'classico' ? { backgroundColor: `${corTema}15`, borderColor: corTema } : {}}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${modoAtendimento === 'classico' ? 'text-slate-950 shadow-lg' : 'bg-white/5 text-slate-400 border border-white/10'}`} style={modoAtendimento === 'classico' ? { backgroundColor: corTema } : {}}>
                  <Grid className="w-5 h-5" />
                </div>
                {modoAtendimento === 'classico' && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1 shadow-sm border" style={{ backgroundColor: `${corTema}33`, color: corTema, borderColor: `${corTema}66` }}>
                    <Check className="w-3 h-3" /> Ativo
                  </span>
                )}
              </div>
              <div>
                <h4 className="font-extrabold text-white text-sm">Modo Clássico</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Layout tradicional em grelha / passos diretos para seleção rápida.</p>
              </div>
            </div>
          </div>
        </div>

        {/* BOTÃO DE SALVAR */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={salvando}
            className="w-full py-4 text-white rounded-[2rem] text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-[0_15px_35px_rgba(0,0,0,0.8)] flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #16181d 0%, #0a0b0e 50%, #000000 100%)',
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.8), inset 0 1px 2px rgba(255, 255, 255, 0.25), inset 0 -2px 4px rgba(0, 0, 0, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            {sucesso ? <Check className="w-4 h-4" style={{ color: corTema }} /> : <Save className="w-4 h-4" style={{ color: corTema }} />}
            <span>{salvando ? 'A salvar alterações...' : sucesso ? 'Alterações salvas com sucesso!' : 'Salvar Todas as Alterações'}</span>
          </button>
        </div>

      </form>

      {/* MODAL DE COMPARTILHAMENTO */}
      {modalCompartilharOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-gradient-to-br from-[#0c0d10] via-[#050507] to-[#000000] border border-white/15 rounded-[2.5rem] shadow-2xl w-full max-w-md p-6 sm:p-8 space-y-6 relative backdrop-blur-2xl text-white">
            
            <button 
              onClick={() => setModalCompartilharOpen(false)}
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-white/10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: corTema }}>Divulgação</span>
              <h3 className="text-lg font-black text-white tracking-tight">Compartilhar Link do Cliente</h3>
              <p className="text-xs text-slate-400">Envie o link de agendamento online diretamente para seus clientes.</p>
            </div>

            <div className="flex items-center gap-2 bg-black/40 border border-white/10 p-2 rounded-2xl backdrop-blur-md">
              <input 
                type="text" 
                readOnly 
                value={urlCliente} 
                className="w-full bg-transparent px-3 text-xs font-bold text-slate-200 outline-none truncate"
              />
              <button 
                onClick={handleCopiarLink}
                className="px-4 py-2 text-slate-950 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer shadow-md"
                style={{ backgroundColor: corTema }}
              >
                {copiado ? <Check className="w-3.5 h-3.5 text-slate-950" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiado ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>

            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Enviar via Redes Sociais</span>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleCompartilharWhatsApp}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 transition-all font-bold text-xs cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform font-bold">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={handleCompartilharTelegram}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 transition-all font-bold text-xs cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-xl bg-sky-500 text-slate-950 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform font-bold">
                    <Send className="w-4 h-4" />
                  </div>
                  <span>Telegram</span>
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex justify-between items-center">
              <span className="text-[11px] text-slate-400">Deseja testar a página?</span>
              <a 
                href={urlCliente}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold hover:underline inline-flex items-center gap-1"
                style={{ color: corTema }}
              >
                <span>Abrir página</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}