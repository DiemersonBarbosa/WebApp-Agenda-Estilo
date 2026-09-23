'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Store, Save, Check, ExternalLink, Share2, Copy, MessageCircle, 
  Send, X, MessageSquare, Bot, Grid, Palette, Moon, BellRing, 
  Clock, Sliders, CalendarOff, Trash2, Plus, Upload, Image as ImageIcon,
  Lock
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ConfiguracoesBarbearia({ barbearia, onUpdate }) {
  const [abaAtiva, setAbaAtiva] = useState('geral');
  const scrollContainerRef = useRef(null);

  const rolarParaBotao = (e) => {
    const elemento = e.currentTarget;
    if (scrollContainerRef.current) {
      elemento.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
      });
    }
  };

  const [nome, setNome] = useState(barbearia?.nome || '');
  const [slug, setSlug] = useState(barbearia?.slug || '');
  const [logoUrl, setLogoUrl] = useState(barbearia?.logo_url || '');
  const [capaUrl, setCapaUrl] = useState(barbearia?.capa_url || '');
  const [whatsappNotificacoes, setWhatsappNotificacoes] = useState(barbearia?.whatsapp_notificacoes || '');
  
  const [temaVisual, setTemaVisual] = useState(barbearia?.cor_tema === '#10b981' || barbearia?.cor_tema === 'clean' ? 'clean' : 'dark');
  const [modoAtendimento, setModoAtendimento] = useState(
    barbearia?.tipo_atendimento || barbearia?.modo_agendamento || barbearia?.modo_chatbot || 'conversacional'
  );

  const [enviandoLogo, setEnviandoLogo] = useState(false);
  const [enviandoCapa, setEnviandoCapa] = useState(false);

  const [modalHorariosOpen, setModalHorariosOpen] = useState(false);
  const [permiteAgendamentos, setPermiteAgendamentos] = useState(barbearia?.permite_agendamentos ?? true);
  const [horariosSemana, setHorariosSemana] = useState(barbearia?.horarios || {
    segunda: { ativo: true, abertura: '09:00', fechamento: '19:00', pausaInicio: '12:00', pausaFim: '13:00' },
    terca: { ativo: true, abertura: '09:00', fechamento: '19:00', pausaInicio: '12:00', pausaFim: '13:00' },
    quarta: { ativo: true, abertura: '09:00', fechamento: '19:00', pausaInicio: '12:00', pausaFim: '13:00' },
    quinta: { ativo: true, abertura: '09:00', fechamento: '19:00', pausaInicio: '12:00', pausaFim: '13:00' },
    sexta: { ativo: true, abertura: '09:00', fechamento: '19:00', pausaInicio: '12:00', pausaFim: '13:00' },
    sabado: { ativo: true, abertura: '09:00', fechamento: '18:00', pausaInicio: '12:00', pausaFim: '13:00' },
    domingo: { ativo: false, abertura: '09:00', fechamento: '14:00', pausaInicio: '', pausaFim: '' },
  });

  const [listaBloqueios, setListaBloqueios] = useState([]);
  const [novaDataBloqueio, setNovaDataBloqueio] = useState('');
  const [novoMotivoBloqueio, setNovoMotivoBloqueio] = useState('');
  const [carregandoBloqueios, setCarregandoBloqueios] = useState(false);

  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [modalCompartilharOpen, setModalCompartilharOpen] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const ordemDiasSemana = [
    { key: 'segunda', label: 'Segunda-feira' },
    { key: 'terca', label: 'Terça-feira' },
    { key: 'quarta', label: 'Quarta-feira' },
    { key: 'quinta', label: 'Quinta-feira' },
    { key: 'sexta', label: 'Sexta-feira' },
    { key: 'sabado', label: 'Sábado' },
    { key: 'domingo', label: 'Domingo' }
  ];

  const corDestaqueAtiva = '#09090b';

  const urlCliente = typeof window !== 'undefined' 
    ? `${window.location.origin}/agendar/${slug || barbearia?.slug || 'barbearia'}`
    : `https://seuapp.com/agendar/${slug || 'barbearia'}`;

  const comprimirImagem = (file, larguraMaxima = 1200, qualidade = 0.82) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > larguraMaxima) {
            height = Math.round((height * larguraMaxima) / width);
            width = larguraMaxima;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Falha ao comprimir imagem.'));
                return;
              }
              const arquivoComprimido = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.jpg', {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(arquivoComprimido);
            },
            'image/jpeg',
            qualidade
          );
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleUploadImagem = async (e, tipo) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isLogo = tipo === 'logo';
    if (isLogo) setEnviandoLogo(true);
    else setEnviandoCapa(true);

    try {
      const larguraMax = isLogo ? 500 : 1200;
      const arquivoOtimizado = await comprimirImagem(file, larguraMax, 0.82);

      const fileName = `${barbearia?.id}-${tipo}-${Date.now()}.jpg`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('barbearias')
        .upload(filePath, arquivoOtimizado, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicURLData } = supabase.storage
        .from('barbearias')
        .getPublicUrl(filePath);

      const urlPublica = publicURLData.publicUrl;

      if (isLogo) setLogoUrl(urlPublica);
      else setCapaUrl(urlPublica);
    } catch (err) {
      alert('Erro ao fazer upload da imagem: ' + (err.message || err));
    } finally {
      if (isLogo) setEnviandoLogo(false);
      else setEnviandoCapa(false);
    }
  };

  useEffect(() => {
    async function buscarBloqueios() {
      if (!barbearia?.id) return;
      try {
        setCarregandoBloqueios(true);
        const { data, error } = await supabase
          .from('bloqueios_agenda')
          .select('*')
          .eq('barbearia_id', barbearia.id)
          .order('data_bloqueio', { ascending: true });

        if (!error && data) setListaBloqueios(data);
      } catch (err) {
        console.error('Erro ao buscar bloqueios:', err);
      } finally {
        setCarregandoBloqueios(false);
      }
    }

    if (modalHorariosOpen) buscarBloqueios();
  }, [modalHorariosOpen, barbearia?.id]);

  const handleAdicionarBloqueio = async () => {
    if (!novaDataBloqueio) return;
    try {
      const { data, error } = await supabase
        .from('bloqueios_agenda')
        .insert([{
          barbearia_id: barbearia.id,
          data_bloqueio: novaDataBloqueio,
          motivo: novoMotivoBloqueio || 'Feriado / Folga'
        }])
        .select()
        .single();

      if (error) throw error;

      setListaBloqueios(prev => [...prev, data]);
      setNovaDataBloqueio('');
      setNovoMotivoBloqueio('');
    } catch (err) {
      alert('Erro ao adicionar bloqueio: ' + err.message);
    }
  };

  const handleRemoverBloqueio = async (idBloqueio) => {
    try {
      const { error } = await supabase
        .from('bloqueios_agenda')
        .delete()
        .eq('id', idBloqueio);

      if (error) throw error;
      setListaBloqueios(prev => prev.filter(b => b.id !== idBloqueio));
    } catch (err) {
      alert('Erro ao remover bloqueio: ' + err.message);
    }
  };

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

  const handleToggleDia = (dia) => {
    setHorariosSemana(prev => ({
      ...prev,
      [dia]: { ...prev[dia], ativo: !prev[dia].ativo }
    }));
  };

  const handleChangeHorario = (dia, campo, valor) => {
    setHorariosSemana(prev => ({
      ...prev,
      [dia]: { ...prev[dia], [campo]: valor }
    }));
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
          whatsapp_notificacoes: whatsappNotificacoes,
          permite_agendamentos: permiteAgendamentos,
          horarios: horariosSemana
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
    <div className="w-full h-[calc(100vh-80px)] flex flex-col justify-between overflow-hidden px-2.5 sm:px-4 pt-1 text-slate-950 font-sans">
      
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden space-y-3">
        
        {/* Container principal ajustado para preencher a tela exata sem transbordar */}
        <div className="rounded-[2rem] bg-white border border-slate-200 shadow-xl overflow-hidden flex flex-col flex-1 w-full">
          
          {/* Capa Compacta */}
          <div className="relative h-28 sm:h-36 w-full bg-[#090a0f] overflow-hidden border-b border-white/15 shrink-0">
            {capaUrl ? (
              <img src={capaUrl} alt="Capa" className="w-full h-full object-cover opacity-90" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center">
                <span className="text-[10px] font-medium text-stone-400 tracking-wider uppercase">Nenhuma capa cadastrada</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-[#090a0f]/60 to-black/30"></div>
            
            <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
              <button 
                type="button"
                onClick={() => setModalCompartilharOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-black/75 hover:bg-black/90 backdrop-blur-md rounded-xl text-[11px] font-semibold text-white shadow transition-all cursor-pointer border border-white/20"
              >
                <Share2 className="w-3 h-3 text-slate-200" />
                <span>Compartilhar</span>
              </button>
              <a 
                href={`/agendar/${slug || 'barbearia'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-8 h-8 bg-black/75 hover:bg-black/90 backdrop-blur-md rounded-xl text-white shadow transition-all cursor-pointer border border-white/20"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-200" />
              </a>
            </div>
          </div>

          {/* Perfil Header */}
          <div className="px-5 pb-3 pt-0 relative flex items-end justify-between gap-4 -mt-10 mb-2 shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="relative z-20">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-black p-1 shadow-2xl border-2 border-white/30 overflow-hidden flex items-center justify-center">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-stone-800 to-black text-white rounded-xl flex items-center justify-center font-black text-xl">
                      {(nome || 'B').charAt(0)}
                    </div>
                  )}
                </div>
                <span className="absolute bottom-1 right-1 w-3 h-3 border-2 border-slate-950 rounded-full shadow" style={{ backgroundColor: corDestaqueAtiva }}></span>
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black text-slate-950 tracking-tight leading-tight">{nome || 'Minha Barbearia'}</h1>
                <p className="text-[11px] text-slate-900 font-bold">Painel de Configurações</p>
              </div>
            </div>
          </div>

          {/* MENU DE ABAS HORIZONTAL */}
          <div 
            ref={scrollContainerRef}
            className="px-5 border-t border-slate-200 bg-slate-50 flex gap-2.5 overflow-x-auto py-2.5 no-scrollbar scroll-smooth shrink-0"
          >
            {[
              { id: 'geral', label: 'Geral & Perfil', icon: Store },
              { id: 'visual', label: 'Visual & Mídia', icon: Palette },
              { id: 'atendimento', label: 'Atendimento & Alertas', icon: MessageSquare },
            ].map((aba) => {
              const Icone = aba.icon;
              const ativa = abaAtiva === aba.id;
              return (
                <button
                  key={aba.id}
                  type="button"
                  onClick={(e) => {
                    setAbaAtiva(aba.id);
                    rolarParaBotao(e);
                  }}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    ativa 
                      ? 'text-white border border-stone-700/50 shadow-md' 
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/90 shadow-xs'
                  }`}
                  style={ativa ? {
                    background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)'
                  } : {}}
                >
                  <Icone className={`w-3.5 h-3.5 shrink-0 ${ativa ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span className="truncate">{aba.label}</span>
                </button>
              );
            })}
          </div>

          {/* CONTEÚDO DINÂMICO COM SCROLL INTERNO INDIVIDUAL */}
          <div className="px-5 py-4 space-y-4 bg-white text-slate-900 flex-1 overflow-y-auto">
            
            {/* ABA 1: GERAL & PERFIL */}
            {abaAtiva === 'geral' && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
                    <Store className="w-3.5 h-3.5 text-slate-700" />
                    <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-800">Identidade e Acesso</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">Nome da Barbearia</label>
                      <input
                        type="text"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-500 shadow-inner"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">Link Personalizado (Slug)</label>
                      <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl overflow-hidden focus-within:border-slate-500 shadow-inner">
                        <span className="pl-3 text-[10px] text-slate-400 font-bold bg-slate-100 border-r border-slate-300 py-2.5">/agendar/</span>
                        <input
                          type="text"
                          value={slug}
                          onChange={(e) => setSlug(e.target.value)}
                          className="w-full bg-transparent px-2 py-2.5 text-xs font-bold text-slate-900 focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-700" />
                    <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-800">Horários & Expediente</h2>
                  </div>

                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3.5 flex items-center justify-between gap-3 shadow-sm">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">Gestão de Horários e Pausas</h4>
                      <p className="text-[10px] text-slate-500">Configure dias, abertura, fechamento e feriados.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalHorariosOpen(true)}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <Clock className="w-3 h-3 text-emerald-400" />
                      <span>Configurar</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ABA 2: VISUAL & MÍDIA */}
            {abaAtiva === 'visual' && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
                    <Palette className="w-3.5 h-3.5 text-slate-700" />
                    <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-800">Mídia & Identidade Visual</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">Logo / Perfil</label>
                      <label className="border border-dashed border-slate-300 hover:border-slate-500 rounded-xl p-3 flex items-center gap-3 bg-slate-50 cursor-pointer transition-all">
                        <input type="file" accept="image/*" onChange={(e) => handleUploadImagem(e, 'logo')} className="hidden" />
                        {enviandoLogo ? (
                          <span className="text-xs font-bold text-slate-500 animate-pulse">Enviando...</span>
                        ) : logoUrl ? (
                          <div className="flex items-center gap-2.5 w-full">
                            <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-cover border" />
                            <div className="overflow-hidden">
                              <p className="text-xs font-bold text-slate-900 truncate">Logo ativa</p>
                              <span className="text-[9px] text-emerald-600 font-bold">Alterar</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Upload className="w-4 h-4 text-slate-500" />
                            <span className="text-xs font-bold text-slate-800">Enviar Logo</span>
                          </div>
                        )}
                      </label>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">Imagem de Capa</label>
                      <label className="border border-dashed border-slate-300 hover:border-slate-500 rounded-xl p-3 flex items-center gap-3 bg-slate-50 cursor-pointer transition-all">
                        <input type="file" accept="image/*" onChange={(e) => handleUploadImagem(e, 'capa')} className="hidden" />
                        {enviandoCapa ? (
                          <span className="text-xs font-bold text-slate-500 animate-pulse">Enviando...</span>
                        ) : capaUrl ? (
                          <div className="flex items-center gap-2.5 w-full">
                            <img src={capaUrl} alt="Capa" className="w-12 h-8 rounded-lg object-cover border" />
                            <div className="overflow-hidden">
                              <p className="text-xs font-bold text-slate-900 truncate">Capa ativa</p>
                              <span className="text-[9px] text-emerald-600 font-bold">Alterar</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-slate-500" />
                            <span className="text-xs font-bold text-slate-800">Enviar Capa</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Estilo Visual</label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div 
                        onClick={() => setTemaVisual('clean')}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          temaVisual === 'clean' ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">✨</span>
                          <span className="font-bold text-xs text-slate-900">Modo Clean</span>
                        </div>
                        {temaVisual === 'clean' && <Check className="w-3.5 h-3.5 text-slate-900" />}
                      </div>

                      <div 
                        onClick={() => setTemaVisual('dark')}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          temaVisual === 'dark' ? 'border-stone-900 bg-stone-950 text-white' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Moon className="w-3.5 h-3.5 text-slate-200" />
                          <span className={`font-bold text-xs ${temaVisual === 'dark' ? 'text-white' : 'text-slate-900'}`}>Modo Dark</span>
                        </div>
                        {temaVisual === 'dark' && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ABA 3: ATENDIMENTO & ALERTAS */}
            {abaAtiva === 'atendimento' && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-700" />
                    <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-800">Experiência de Atendimento</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div 
                      onClick={() => setModoAtendimento('conversacional')}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        modoAtendimento === 'conversacional' ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Bot className="w-4 h-4 text-slate-900" />
                        {modoAtendimento === 'conversacional' && <span className="text-[8px] font-bold uppercase px-2 py-0.5 rounded bg-slate-900 text-white">Ativo</span>}
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs">Conversacional</h4>
                    </div>

                    <div 
                      onClick={() => setModoAtendimento('classico')}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        modoAtendimento === 'classico' ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Grid className="w-4 h-4 text-slate-900" />
                        {modoAtendimento === 'classico' && <span className="text-[8px] font-bold uppercase px-2 py-0.5 rounded bg-slate-900 text-white">Ativo</span>}
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs">Clássico</h4>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Notificações</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">Em breve</span>
                  </div>
                  <input
                    type="text"
                    disabled
                    value={whatsappNotificacoes}
                    placeholder="WhatsApp para Alertas (Em breve)"
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Botão de Salvar Fixo na parte inferior */}
        <div className="shrink-0 pt-1">
          <button
            type="submit"
            disabled={salvando}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.99] shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 bg-[#090a0f] hover:bg-black border border-stone-800"
          >
            {sucesso ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{salvando ? 'Salvando...' : sucesso ? 'Salvo com sucesso!' : 'Salvar Alterações'}</span>
          </button>
        </div>

      </form>

      {/* MODAL DE HORÁRIOS & BLOQUEIOS */}
      {modalHorariosOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden relative text-slate-900">
            
            <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow">
                  <Clock className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Horários & Expediente</h3>
                  <p className="text-[10px] text-slate-500">Defina expediente semanal e folgas.</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setModalHorariosOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">Novos Agendamentos</h4>
                  <p className="text-[10px] text-slate-500">{permiteAgendamentos ? 'Aceitando agendamentos.' : 'Pausados.'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPermiteAgendamentos(!permiteAgendamentos)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    permiteAgendamentos ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {permiteAgendamentos ? 'Ativo' : 'Pausado'}
                </button>
              </div>

              {/* Lista Dias da Semana */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Expediente Semanal</h4>
                <div className="space-y-2">
                  {ordemDiasSemana.map(({ key: diaKey, label }) => {
                    const diaConfig = horariosSemana[diaKey] || { ativo: false, abertura: '09:00', fechamento: '19:00' };
                    return (
                      <div key={diaKey} className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${diaConfig.ativo ? 'bg-slate-50 border-slate-200' : 'bg-slate-100 opacity-60'}`}>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-900 text-xs w-24">{label}</span>
                          <button
                            type="button"
                            onClick={() => handleToggleDia(diaKey)}
                            className={`text-[10px] font-bold px-2 py-1 rounded cursor-pointer ${diaConfig.ativo ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'}`}
                          >
                            {diaConfig.ativo ? 'Aberto' : 'Fechado'}
                          </button>
                        </div>

                        {diaConfig.ativo && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <input 
                              type="time"
                              value={diaConfig.abertura}
                              onChange={(e) => handleChangeHorario(diaKey, 'abertura', e.target.value)}
                              className="bg-white px-2 py-1 rounded border border-slate-200 font-bold text-slate-900"
                            />
                            <span>às</span>
                            <input 
                              type="time"
                              value={diaConfig.fechamento}
                              onChange={(e) => handleChangeHorario(diaKey, 'fechamento', e.target.value)}
                              className="bg-white px-2 py-1 rounded border border-slate-200 font-bold text-slate-900"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end shrink-0 bg-slate-50">
              <button
                type="button"
                onClick={() => setModalHorariosOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Concluir
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL COMPARTILHAR */}
      {modalCompartilharOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5 relative text-slate-900">
            <button 
              type="button"
              onClick={() => setModalCompartilharOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900">Compartilhar Link</h3>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-2xl">
              <input type="text" readOnly value={urlCliente} className="w-full bg-transparent px-2 text-xs font-medium text-slate-700 outline-none truncate" />
              <button type="button" onClick={handleCopiarLink} className="px-3 py-2 text-white bg-slate-900 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1">
                {copiado ? <Check className="w-3 h-3" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiado ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button type="button" onClick={handleCompartilharWhatsApp} className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </button>
              <button type="button" onClick={handleCompartilharTelegram} className="flex items-center justify-center gap-2 p-3 rounded-xl bg-sky-50 text-sky-700 font-bold text-xs border border-sky-200">
                <Send className="w-4 h-4" /> Telegram
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
