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
    <div className="w-full max-w-xl mx-auto space-y-6 pb-32 px-4 pt-3 text-slate-950 font-sans">
      
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Container principal mais largo e com margem segura */}
        <div className="rounded-[2.5rem] bg-white border border-slate-200 shadow-xl overflow-hidden">
          <div className="relative h-44 sm:h-52 w-full bg-[#090a0f] overflow-hidden border-b border-white/15">
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
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-black/75 hover:bg-black/90 backdrop-blur-md rounded-xl text-xs font-semibold text-white shadow transition-all cursor-pointer border border-white/20 active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-200" />
                <span>Compartilhar</span>
              </button>
              <a 
                href={`/agendar/${slug || 'barbearia'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-9 h-9 bg-black/75 hover:bg-black/90 backdrop-blur-md rounded-xl text-white shadow transition-all cursor-pointer border border-white/20"
                title="Abrir página pública"
              >
                <ExternalLink className="w-4 h-4 text-slate-200" />
              </a>
            </div>
          </div>

          <div className="px-6 sm:px-10 pb-6 pt-0 relative flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-14 sm:-mt-16 mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
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
                {/* Nome da barbearia alterado para preto (text-slate-950) */}
                <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">{nome || 'Minha Barbearia'}</h1>
                {/* Frase logo abaixo alterada para preto com tom firme (text-slate-900) */}
                <p className="text-xs text-slate-900 mt-1 font-bold">Painel de Configurações • Personalize a experiência</p>
              </div>
            </div>
          </div>

          {/* MENU DE ABAS EM FORMATO DE SLIDE HORIZONTAL */}
          <div 
            ref={scrollContainerRef}
            className="px-6 sm:px-10 border-t border-slate-200 bg-slate-50 flex gap-3 overflow-x-auto py-3.5 no-scrollbar scroll-smooth snap-x snap-mandatory"
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
                  className={`flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl text-xs font-bold transition-all shrink-0 min-w-[170px] snap-center cursor-pointer ${
                    ativa 
                      ? 'text-white border border-stone-700/50 shadow-md scale-[1.02]' 
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/90 shadow-xs'
                  }`}
                  style={ativa ? {
                    background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
                    boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.2)'
                  } : {}}
                >
                  <Icone className={`w-4 h-4 shrink-0 ${ativa ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span className="truncate">{aba.label}</span>
                </button>
              );
            })}
          </div>

          {/* CONTEÚDO DINÂMICO DAS ABAS */}
          <div className="px-6 sm:px-10 py-8 space-y-6 bg-white text-slate-900 min-h-[320px]">
            
            {/* ABA 1: GERAL & PERFIL */}
            {abaAtiva === 'geral' && (
              <div className="space-y-6 animate-fade-in">
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

                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2">
                    <Clock className="w-4 h-4 text-slate-700" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Horários & Expediente</h2>
                  </div>

                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900 text-xs">Gestão de Horários, Pausas e Feriados</h4>
                      <p className="text-[11px] text-slate-500">Configure os dias de funcionamento, abertura, fechamento e pausas.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalHorariosOpen(true)}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-2 shrink-0"
                    >
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Configurar Horários</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ABA 2: VISUAL & MÍDIA */}
            {abaAtiva === 'visual' && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2">
                    <Palette className="w-4 h-4 text-slate-700" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Mídia & Identidade Visual</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Upload Logo */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 block">Logo / Foto de Perfil</label>
                      <label className="border-2 border-dashed border-slate-300 hover:border-slate-500 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 bg-slate-50 cursor-pointer transition-all text-center">
                        <input type="file" accept="image/*" onChange={(e) => handleUploadImagem(e, 'logo')} className="hidden" />
                        {enviandoLogo ? (
                          <span className="text-xs font-bold text-slate-500 animate-pulse">Enviando logo...</span>
                        ) : logoUrl ? (
                          <div className="flex items-center gap-3 w-full">
                            <img src={logoUrl} alt="Logo Preview" className="w-12 h-12 rounded-xl object-cover border" />
                            <div className="text-left overflow-hidden">
                              <p className="text-xs font-bold text-slate-900 truncate">Logo carregada</p>
                              <span className="text-[10px] text-emerald-600 font-bold">Clique para alterar</span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shadow-inner">
                              <Upload className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">Clique para enviar a Logo</p>
                              <span className="text-[10px] text-slate-400">PNG, JPG ou WEBP</span>
                            </div>
                          </>
                        )}
                      </label>
                    </div>

                    {/* Upload Capa */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 block">Imagem de Capa</label>
                      <label className="border-2 border-dashed border-slate-300 hover:border-slate-500 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 bg-slate-50 cursor-pointer transition-all text-center">
                        <input type="file" accept="image/*" onChange={(e) => handleUploadImagem(e, 'capa')} className="hidden" />
                        {enviandoCapa ? (
                          <span className="text-xs font-bold text-slate-500 animate-pulse">Enviando capa...</span>
                        ) : capaUrl ? (
                          <div className="flex items-center gap-3 w-full">
                            <img src={capaUrl} alt="Capa Preview" className="w-16 h-10 rounded-lg object-cover border" />
                            <div className="text-left overflow-hidden">
                              <p className="text-xs font-bold text-slate-900 truncate">Capa carregada</p>
                              <span className="text-[10px] text-emerald-600 font-bold">Clique para alterar</span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shadow-inner">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">Clique para enviar a Capa</p>
                              <span className="text-[10px] text-slate-400">PNG, JPG ou WEBP</span>
                            </div>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-bold text-slate-700 block">Padrão de Cores e Estilo Visual</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div 
                        onClick={() => setTemaVisual('clean')}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between shadow-sm ${
                          temaVisual === 'clean' ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900/10' : 'border-slate-200 bg-white hover:border-slate-300'
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
                          temaVisual === 'dark' ? 'border-stone-900 bg-stone-950 text-white ring-2 ring-black/10' : 'border-slate-200 bg-white hover:border-slate-300'
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
              </div>
            )}

            {/* ABA 3: ATENDIMENTO & ALERTAS */}
            {abaAtiva === 'atendimento' && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2">
                    <MessageSquare className="w-4 h-4 text-slate-700" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Experiência de Atendimento</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div 
                      onClick={() => setModoAtendimento('conversacional')}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between shadow-sm ${
                        modoAtendimento === 'conversacional' ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900/10' : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold shadow bg-slate-900">
                          <Bot className="w-4 h-4" />
                        </div>
                        {modoAtendimento === 'conversacional' && (
                          <span className="text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-900 text-white">Ativo</span>
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
                        modoAtendimento === 'classico' ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900/10' : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold shadow bg-slate-900">
                          <Grid className="w-4 h-4" />
                        </div>
                        {modoAtendimento === 'classico' && (
                          <span className="text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-900 text-white">Ativo</span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">Modo Clássico</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">Layout tradicional em grade para seleção rápida.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* NOTIFICAÇÕES E ALERTAS - BLOQUEADO (EM BREVE) */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2.5">
                      <BellRing className="w-4 h-4 text-slate-400" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Notificações e Alertas</h2>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 shadow-xs">
                      <Lock className="w-3 h-3" />
                      <span>Em breve</span>
                    </span>
                  </div>

                  <div className="space-y-1.5 p-4 rounded-2xl bg-slate-100/70 border border-slate-200/80 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-400 block">WhatsApp para Alertas de Agendamento</label>
                      <span className="text-[10px] text-slate-500 font-medium italic">Funcionalidade bloqueada temporariamente</span>
                    </div>
                    <input
                      type="text"
                      disabled
                      value={whatsappNotificacoes}
                      placeholder="Disponível em breve..."
                      className="w-full bg-slate-200/80 border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold text-slate-400 cursor-not-allowed select-none shadow-inner"
                    />
                    <p className="text-[10px] text-slate-400">Esta funcionalidade de avisos automáticos via WhatsApp estará disponível em uma próxima atualização.</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Botão de Salvar Global */}
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

      {/* MODAL DE HORÁRIOS & BLOQUEIOS */}
      {modalHorariosOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden relative text-slate-900">
            
            <div className="flex items-center justify-between p-6 sm:p-8 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow">
                  <Clock className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Horários & Expediente</h3>
                  <p className="text-xs text-slate-500">Defina expediente semanal, pausas e bloqueio de feriados.</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setModalHorariosOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
              
              {/* Controle Geral */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-slate-800" />
                    <h4 className="font-bold text-slate-900 text-xs">Novos Agendamentos Online</h4>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {permiteAgendamentos ? 'Aceitando novos agendamentos.' : 'Agendamentos pausados.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setPermiteAgendamentos(!permiteAgendamentos)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-sm ${
                    permiteAgendamentos 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                      : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  {permiteAgendamentos ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-rose-600" />}
                  <span>{permiteAgendamentos ? 'Ativo (Aceitando)' : 'Desativado (Pausado)'}</span>
                </button>
              </div>

              {/* Bloqueio de Datas Específicas */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <CalendarOff className="w-4 h-4 text-rose-600" />
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Bloqueio de Feriados / Folgas</h4>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <input 
                    type="date"
                    value={novaDataBloqueio}
                    onChange={(e) => setNovaDataBloqueio(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none cursor-pointer flex-1"
                  />
                  <input 
                    type="text"
                    placeholder="Motivo (Ex: Feriado, Viagem...)"
                    value={novoMotivoBloqueio}
                    onChange={(e) => setNovoMotivoBloqueio(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAdicionarBloqueio}
                    disabled={!novaDataBloqueio}
                    className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40 shadow-sm shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Bloquear</span>
                  </button>
                </div>

                <div className="space-y-2 pt-2">
                  {carregandoBloqueios ? (
                    <p className="text-[11px] text-slate-400 italic">Carregando bloqueios...</p>
                  ) : listaBloqueios.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">Nenhuma data bloqueada cadastrada.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {listaBloqueios.map((bloqueio) => {
                        const dataFmt = bloqueio.data_bloqueio.split('-').reverse().join('/');
                        return (
                          <div key={bloqueio.id} className="flex items-center justify-between bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-xs text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-900">📅 {dataFmt}</span>
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-600 font-medium">{bloqueio.motivo}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoverBloqueio(bloqueio.id)}
                              className="text-rose-600 hover:text-rose-800 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Lista de Dias da Semana */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Expediente Semanal & Pausas</h4>

                <div className="space-y-2.5">
                  {ordemDiasSemana.map(({ key: diaKey, label }) => {
                    const diaConfig = horariosSemana[diaKey] || { ativo: false, abertura: '09:00', fechamento: '19:00', pausaInicio: '', pausaFim: '' };
                    return (
                      <div 
                        key={diaKey}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                          diaConfig.ativo ? 'bg-slate-50 border-slate-200' : 'bg-slate-100/60 border-slate-200/50 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between md:w-40 shrink-0">
                          <span className="font-bold text-slate-900 text-xs capitalize">{label}</span>
                          <button
                            type="button"
                            onClick={() => handleToggleDia(diaKey)}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                              diaConfig.ativo ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {diaConfig.ativo ? 'Aberto' : 'Fechado'}
                          </button>
                        </div>

                        {diaConfig.ativo ? (
                          <div className="flex flex-wrap items-center gap-2 flex-1 justify-end text-xs">
                            <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-inner">
                              <span className="text-[9px] font-bold text-slate-400 uppercase">Abertura:</span>
                              <input 
                                type="time"
                                value={diaConfig.abertura}
                                onChange={(e) => handleChangeHorario(diaKey, 'abertura', e.target.value)}
                                className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
                              />
                            </div>

                            <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-inner">
                              <span className="text-[9px] font-bold text-slate-400 uppercase">Fechamento:</span>
                              <input 
                                type="time"
                                value={diaConfig.fechamento}
                                onChange={(e) => handleChangeHorario(diaKey, 'fechamento', e.target.value)}
                                className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic font-medium py-1">Fechado neste dia.</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            <div className="p-6 sm:p-8 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 bg-slate-50">
              <button
                type="button"
                onClick={() => setModalHorariosOpen(false)}
                className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-sm"
              >
                Concluir / Fechar
              </button>
            </div>

          </div>
        </div>
      )}

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
