'use client';

import React, { useState } from 'react';
import { Store, Save, Check, ExternalLink, Share2, Copy, MessageCircle, Send, X, MessageSquare, Bot, Grid, Palette, Moon, BellRing } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ConfiguracoesBarbearia({ barbearia, onUpdate }) {
  const [nome, setNome] = useState(barbearia?.nome || '');
  const [slug, setSlug] = useState(barbearia?.slug || '');
  const [logoUrl, setLogoUrl] = useState(barbearia?.logo_url || '');
  const [capaUrl, setCapaUrl] = useState(barbearia?.capa_url || '');
  const [whatsappNotificacoes, setWhatsappNotificacoes] = useState(barbearia?.whatsapp_notificacoes || '');
  
  const [temaVisual, setTemaVisual] = useState(barbearia?.cor_tema === '#10b981' || barbearia?.cor_tema === 'clean' ? 'clean' : 'dark');
  const [modoAtendimento, setModoAtendimento] = useState(
    barbearia?.tipo_atendimento || barbearia?.modo_agendamento || barbearia?.modo_chatbot || 'conversacional'
  );

  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [modalCompartilharOpen, setModalCompartilharOpen] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // Cor de destaque fixa em preto corporativo
  const corDestaqueAtiva = '#09090b';

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
          modo_agendamento: modoAtendimento,
          whatsapp_notificacoes: whatsappNotificacoes
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
    <div className="max-w-4xl mx-auto space-y-6 pb-28 px-4 sm:px-6 text-slate-900 font-sans">
      
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* BLOCO ÚNICO CONTÍNUO */}
        <div className="rounded-[2.5rem] bg-white border border-slate-200 shadow-xl overflow-hidden">
          
          {/* TOPO: CAPA E PERFIL ESCUROS (BLACK PIANO) */}
          <div className="relative h-44 sm:h-52 w-full bg-[#090a0f] overflow-hidden border-b border-white/10">
            {capaUrl ? (
              <img src={capaUrl} alt="Capa" className="w-full h-full object-cover opacity-90" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center">
                <span className="text-xs font-medium text-stone-400 tracking-wider uppercase">Nenhuma capa cadastrada</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-[#090a0f]/60 to-black/30"></div>
            
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
              <button 
                type="button"
                onClick={() => setModalCompartilharOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-black/70 hover:bg-black/90 backdrop-blur-md rounded-xl text-xs font-semibold text-white shadow transition-all cursor-pointer border border-white/20 active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-200" />
                <span>Compartilhar</span>
              </button>
              <a 
                href={`/agendar/${slug || 'barbearia'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-9 h-9 bg-black/70 hover:bg-black/90 backdrop-blur-md rounded-xl text-white shadow transition-all cursor-pointer border border-white/20"
                title="Abrir página pública"
              >
                <ExternalLink className="w-4 h-4 text-slate-200" />
              </a>
            </div>
          </div>

          <div className="px-6 sm:px-8 pb-6 pt-0 relative flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-14 sm:-mt-16 mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="relative z-20">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-black p-1 shadow-2xl border-2 border-white/30 overflow-hidden flex items-center justify-center">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-stone-800 to-black text-white rounded-xl flex items-center justify-center font-black text-2xl">
                      {(nome || 'B').charAt(0)}
                    </div>
                  )}
                </div>
                <span className="absolute bottom-1 right-1 w-4 h-4 border-2 border-slate-950 rounded-full shadow" style={{ backgroundColor: corDestaqueAtiva }}></span>
              </div>
              <div className="pt-2 sm:pt-0">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">{nome || 'Minha Barbearia'}</h1>
                <p className="text-xs text-slate-300 mt-0.5 font-medium">Painel de Configurações • Personalize a experiência dos seus clientes</p>
              </div>
            </div>
          </div>

          {/* CONTEÚDO DO FORMULÁRIO (ESTILO CLEAN / CLARO) */}
          <div className="px-6 sm:px-8 pb-8 space-y-8 bg-white text-slate-900">
            
            {/* SEÇÃO 1: IDENTIDADE E ACESSO */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2">
                <Store className="w-4 h-4 text-slate-700" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Identidade e Acesso</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Nome da Barbearia</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-500 transition-all shadow-inner"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Link Personalizado (Slug)</label>
                  <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl overflow-hidden focus-within:border-slate-500 shadow-inner">
                    <span className="pl-3.5 text-[11px] text-slate-400 font-bold bg-slate-100 border-r border-slate-300 py-3">/agendar/</span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="w-full bg-transparent px-2 py-3 text-xs font-bold text-slate-900 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: MÍDIA & IDENTIDADE VISUAL */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2">
                <Palette className="w-4 h-4 text-slate-700" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Mídia & Identidade Visual</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">URL da Logo / Perfil</label>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://exemplo.com/logo.png"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-500 transition-all shadow-inner"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">URL da Imagem de Capa</label>
                  <input
                    type="url"
                    value={capaUrl}
                    onChange={(e) => setCapaUrl(e.target.value)}
                    placeholder="https://exemplo.com/capa.png"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-500 transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* SELETOR DE TEMAS */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold text-slate-700 block">Padrão de Cores e Estilo Visual</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  
                  <div 
                    onClick={() => setTemaVisual('clean')}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between shadow-sm ${
                      temaVisual === 'clean' 
                        ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900/10' 
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shadow-sm">✨</div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs">Modo Clean</h4>
                          <p className="text-[10px] text-slate-500">Tons claros e elegantes</p>
                        </div>
                      </div>
                      {temaVisual === 'clean' && <Check className="w-4 h-4 text-slate-900" />}
                    </div>
                  </div>

                  <div 
                    onClick={() => setTemaVisual('dark')}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between shadow-sm ${
                      temaVisual === 'dark' 
                        ? 'border-stone-900 bg-stone-950 text-white ring-2 ring-black/10' 
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-stone-900 text-white border border-stone-800 flex items-center justify-center shadow-inner">
                          <Moon className="w-4 h-4 text-slate-200" />
                        </div>
                        <div>
                          <h4 className={`font-bold text-xs ${temaVisual === 'dark' ? 'text-white' : 'text-slate-900'}`}>Modo Dark</h4>
                          <p className={`text-[10px] ${temaVisual === 'dark' ? 'text-stone-400' : 'text-slate-500'}`}>Tons escuros sofisticados</p>
                        </div>
                      </div>
                      {temaVisual === 'dark' && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* SEÇÃO 3: EXPERIÊNCIA DE ATENDIMENTO */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2">
                <MessageSquare className="w-4 h-4 text-slate-700" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Experiência de Atendimento</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                <div 
                  onClick={() => setModoAtendimento('conversacional')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between shadow-sm ${
                    modoAtendimento === 'conversacional'
                      ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900/10'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold shadow bg-slate-900">
                      <Bot className="w-4 h-4" />
                    </div>
                    {modoAtendimento === 'conversacional' && (
                      <span className="text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-900 text-white">
                        Ativo
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Modo Conversacional</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Chat interativo guiado passo a passo.</p>
                  </div>
                </div>

                <div 
                  onClick={() => setModoAtendimento('classico')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between shadow-sm ${
                    modoAtendimento === 'classico'
                      ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900/10'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold shadow bg-slate-900">
                      <Grid className="w-4 h-4" />
                    </div>
                    {modoAtendimento === 'classico' && (
                      <span className="text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-900 text-white">
                        Ativo
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Modo Clássico</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Layout tradicional em grade para seleção rápida.</p>
                  </div>
                </div>

              </div>
            </div>

            {/* SEÇÃO 4: NOTIFICAÇÕES WHATSAPP */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2">
                <BellRing className="w-4 h-4 text-slate-700" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Notificações e Alertas</h2>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">WhatsApp para Alertas de Agendamento</label>
                <input
                  type="text"
                  value={whatsappNotificacoes}
                  onChange={(e) => setWhatsappNotificacoes(e.target.value)}
                  placeholder="Ex: 5541999999999"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-500 transition-all shadow-inner"
                />
                <p className="text-[10px] text-slate-500">Informe o número com DDD e DDI (ex: 5541999999999) para receber os avisos automáticos na barra de notificações do celular.</p>
              </div>
            </div>

          </div>
        </div>

        {/* BOTÃO DE SALVAR */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={salvando}
            className="w-full py-4 rounded-2xl text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.99] shadow-xl flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 bg-[#090a0f] hover:bg-black border border-stone-800"
          >
            {sucesso ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{salvando ? 'Salvando alterações...' : sucesso ? 'Alterações salvas com sucesso!' : 'Salvar Alterações'}</span>
          </button>
        </div>

      </form>

      {/* MODAL DE COMPARTILHAMENTO */}
      {modalCompartilharOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 space-y-6 relative text-slate-900">
            <button 
              type="button"
              onClick={() => setModalCompartilharOpen(false)}
              className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Divulgação</span>
              <h3 className="text-base font-bold text-slate-900">Compartilhar Link do Cliente</h3>
              <p className="text-xs text-slate-500">Envie o link de agendamento online diretamente para seus clientes.</p>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-2xl shadow-inner">
              <input 
                type="text" 
                readOnly 
                value={urlCliente} 
                className="w-full bg-transparent px-3 text-xs font-medium text-slate-700 outline-none truncate"
              />
              <button 
                type="button"
                onClick={handleCopiarLink}
                className="px-4 py-2.5 text-white bg-slate-900 hover:bg-black rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer shadow"
              >
                {copiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiado ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>

            <div className="space-y-2.5 pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Enviar via Redes Sociais</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleCompartilharWhatsApp}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-xs transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={handleCompartilharTelegram}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 font-bold text-xs transition-all cursor-pointer"
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