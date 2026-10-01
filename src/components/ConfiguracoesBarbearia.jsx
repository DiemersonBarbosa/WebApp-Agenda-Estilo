'use client';

import React, { useState, useEffect } from 'react';
import { 
  Store, Save, Check, ExternalLink, Share2, Copy, MessageCircle, 
  Send, X, MessageSquare, Bot, Grid, Palette, Moon, BellRing, 
  Clock, Sliders, CalendarOff, Trash2, Plus, Upload, Image as ImageIcon,
  Lock, Coffee, User
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const DIAS_SEMANA_NOMES = [
  { key: 'segunda', label: 'Segunda-feira' },
  { key: 'terca', label: 'Terça-feira' },
  { key: 'quarta', label: 'Quarta-feira' },
  { key: 'quinta', label: 'Quinta-feira' },
  { key: 'sexta', label: 'Sexta-feira' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' }
];

export default function ConfiguracoesBarbearia({ barbearia, onUpdate }) {
  const [modalAtiva, setModalAtiva] = useState(null);

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

  const [modalHorariosGeraisOpen, setModalHorariosGeraisOpen] = useState(false);
  const [permiteAgendamentos, setPermiteAgendamentos] = useState(barbearia?.permite_agendamentos ?? true);
  const [horariosSemana, setHorariosSemana] = useState(barbearia?.horarios || {
    segunda: { ativo: true },
    terca: { ativo: true },
    quarta: { ativo: true },
    quinta: { ativo: true },
    sexta: { ativo: true },
    sabado: { ativo: true },
    domingo: { ativo: false },
  });

  // ESTADOS DA GESTÃO DE HORÁRIOS DE BARBEIROS
  const [barbeiros, setBarbeiros] = useState([]);
  const [barbeiroSelecionado, setBarbeiroSelecionado] = useState(null);
  const [horariosBarbeiro, setHorariosBarbeiro] = useState({});
  const [salvandoBarbeiro, setSalvandoBarbeiro] = useState(false);
  const [sucessoBarbeiroMsg, setSucessoBarbeiroMsg] = useState(false);

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

  useEffect(() => {
    async function carregarBarbeiros() {
      if (!barbearia?.id) return;
      const { data } = await supabase
        .from('barbeiros')
        .select('*')
        .eq('barbearia_id', barbearia.id);

      if (data && data.length > 0) {
        setBarbeiros(data);
        selecionarBarbeiroParaEditar(data[0]);
      }
    }
    carregarBarbeiros();
  }, [barbearia?.id]);

  const selecionarBarbeiroParaEditar = (barbeiro) => {
    setBarbeiroSelecionado(barbeiro);
    setHorariosBarbeiro(barbeiro.horarios_trabalho || {});
    setSucessoBarbeiroMsg(false);
  };

  const handleToggleDiaBarbeiro = (diaKey) => {
    setHorariosBarbeiro(prev => ({
      ...prev,
      [diaKey]: {
        ...(prev[diaKey] || { abertura: '08:00', fechamento: '18:00', pausaInicio: '12:00', pausaFim: '13:00' }),
        ativo: !prev[diaKey]?.ativo
      }
    }));
  };

  const handleCampoChangeBarbeiro = (diaKey, campo, valor) => {
    setHorariosBarbeiro(prev => ({
      ...prev,
      [diaKey]: {
        ...(prev[diaKey] || { ativo: true, abertura: '08:00', fechamento: '18:00' }),
        [campo]: valor
      }
    }));
  };

  const salvarHorariosBarbeiro = async () => {
    if (!barbeiroSelecionado) return;
    setSalvandoBarbeiro(true);
    setSucessoBarbeiroMsg(false);

    try {
      const { error } = await supabase
        .from('barbeiros')
        .update({ horarios_trabalho: horariosBarbeiro })
        .eq('id', barbeiroSelecionado.id);

      if (error) throw error;

      setBarbeiros(prev => prev.map(b => b.id === barbeiroSelecionado.id ? { ...b, horarios_trabalho: horariosBarbeiro } : b));
      setSucessoBarbeiroMsg(true);
      setTimeout(() => setSucessoBarbeiroMsg(false), 3000);
    } catch (err) {
      alert('Erro ao salvar horários do barbeiro: ' + err.message);
    } finally {
      setSalvandoBarbeiro(false);
    }
  };

  const handleSalvarEFecharModalBarbeiros = async () => {
    if (barbeiroSelecionado) {
      await salvarHorariosBarbeiro();
    }
    setModalAtiva(null);
  };

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

    if (modalHorariosGeraisOpen) buscarBloqueios();
  }, [modalHorariosGeraisOpen, barbearia?.id]);

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
      [dia]: { ...prev[dia], ativo: !prev[dia]?.ativo }
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
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
    <div className="w-full min-h-screen px-2.5 sm:px-4 pt-3 pb-32 text-slate-950 font-sans touch-pan-y overflow-y-auto">
      
      <form onSubmit={handleSubmit} className="space-y-6 w-full">
        
        <div className="rounded-[2.5rem] bg-white border border-slate-200 shadow-xl overflow-hidden w-full">
          {/* BANNER DE CAPA */}
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

          {/* CABEÇALHO DA BARBEARIA */}
          <div className="px-6 sm:px-8 pb-4 pt-0 relative flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-14 sm:-mt-16 mb-4">
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
                <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">{nome || 'Minha Barbearia'}</h1>
                <p className="text-xs text-slate-900 mt-1 font-bold">Painel de Configurações • Personalize a experiência</p>
              </div>
            </div>
          </div>

          {/* PAINEL DOS 4 BOTÕES + BOTÃO SALVAR LOGO ABAIXO */}
          <div className="px-4 sm:px-8 border-t border-slate-200 bg-slate-50 py-5 space-y-4">
            
            {/* GRID 2X2 DOS 4 BOTÕES */}
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'geral', label: 'Geral & Perfil', icon: Store },
                { id: 'visual', label: 'Visual & Mídia', icon: Palette },
                { id: 'atendimento', label: 'Atendimento', icon: MessageSquare },
                { id: 'barbeiros_horarios', label: 'Configurar Horários', icon: Clock },
              ].map((item) => {
                const Icone = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setModalAtiva(item.id)}
                    className="flex items-center justify-center gap-2 px-3 h-12 rounded-2xl text-[11px] sm:text-xs font-extrabold transition-all cursor-pointer bg-white text-slate-800 hover:bg-slate-100 border border-slate-200/90 shadow-2xs hover:shadow-md active:scale-98"
                  >
                    <Icone className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                    <span className="text-center">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* BOTÃO DE SALVAR GLOBAL */}
            <div>
              <button
                type="submit"
                disabled={salvando}
                className="w-full py-4 rounded-2xl text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.99] shadow-xl flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 bg-[#090a0f] hover:bg-black border border-stone-800"
              >
                {sucesso ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4 text-emerald-400" />}
                <span>{salvando ? 'Salvando alterações...' : sucesso ? 'Alterações salvas com sucesso!' : 'Salvar Alterações'}</span>
              </button>
            </div>

          </div>

        </div>

      </form>

      {/* ========================================== */}
      {/* 1. MODAL: GERAL & PERFIL                  */}
      {/* ========================================== */}
      {modalAtiva === 'geral' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden relative text-slate-900">
            
            <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow">
                  <Store className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Geral & Perfil</h3>
                  <p className="text-xs text-slate-500">Nome, link de acesso e dias de funcionamento.</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setModalAtiva(null)}
                className="w-9 h-9 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto touch-pan-y overscroll-contain p-6 space-y-6">
              <div className="space-y-4">
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

              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-slate-700" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Funcionamento da Barbearia</h2>
                </div>

                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 text-xs">Dias Abertos & Bloqueios por Feriado/Folga</h4>
                    <p className="text-[11px] text-slate-500">Defina os dias em que a barbearia abre e bloqueie datas específicas.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalHorariosGeraisOpen(true)}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-2 shrink-0"
                  >
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Configurar Dias</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 bg-slate-50">
              <button
                type="button"
                onClick={() => setModalAtiva(null)}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                Concluir
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 2. MODAL: VISUAL & MÍDIA                  */}
      {/* ========================================== */}
      {modalAtiva === 'visual' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden relative text-slate-900">
            
            <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow">
                  <Palette className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Visual & Mídia</h3>
                  <p className="text-xs text-slate-500">Upload de logo, capa e seleção de tema visual.</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setModalAtiva(null)}
                className="w-9 h-9 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto touch-pan-y overscroll-contain p-6 space-y-6">
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

              <div className="space-y-2 pt-2 border-t border-slate-100">
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

            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 bg-slate-50">
              <button
                type="button"
                onClick={() => setModalAtiva(null)}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                Concluir
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 3. MODAL: ATENDIMENTO                    */}
      {/* ========================================== */}
      {modalAtiva === 'atendimento' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden relative text-slate-900">
            
            <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow">
                  <MessageSquare className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Atendimento & Alertas</h3>
                  <p className="text-xs text-slate-500">Escolha o layout de agendamento do seu cliente.</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setModalAtiva(null)}
                className="w-9 h-9 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto touch-pan-y overscroll-contain p-6 space-y-6">
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

              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
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
                    <span className="text-[10px] text-slate-500 font-medium italic">Bloqueado temporariamente</span>
                  </div>
                  <input
                    type="text"
                    disabled
                    value={whatsappNotificacoes}
                    placeholder="Disponível em breve..."
                    className="w-full bg-slate-200/80 border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold text-slate-400 cursor-not-allowed select-none shadow-inner"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 bg-slate-50">
              <button
                type="button"
                onClick={() => setModalAtiva(null)}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                Concluir
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================== */}
{/* 4. MODAL: CONFIGURAR HORÁRIOS (BARBEIROS)  */}
{/* ========================================== */}
{modalAtiva === 'barbeiros_horarios' && (
  <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4">
    <div 
      className="bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden relative text-slate-900 my-auto"
    >
      
      {/* CABEÇALHO DO MODAL (FIXO) */}
      <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 shrink-0 bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow shrink-0">
            <Clock className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Configurar Horários</h3>
            <p className="text-xs text-slate-500">Defina os turnos e pausas de cada barbeiro da equipe.</p>
          </div>
        </div>
        <button 
          type="button"
          onClick={() => setModalAtiva(null)}
          className="w-9 h-9 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* CORPO DO MODAL COM FUNÇÃO DE TOUCH MANUAL */}
      <div 
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 overscroll-contain"
        onTouchStart={(e) => {
          // Armazena a posição Y inicial do toque no próprio elemento
          e.currentTarget.dataset.startY = e.touches[0].clientY;
        }}
        onTouchMove={(e) => {
          const container = e.currentTarget;
          const startY = parseFloat(container.dataset.startY);
          const currentY = e.touches[0].clientY;
          const deltaY = startY - currentY; // Distância percorrida pelo dedo

          // Se arrastar para cima e ainda houver conteúdo acima, rola manualmente
          if (deltaY < 0 && container.scrollTop > 0) {
            container.scrollTop += deltaY;
            container.dataset.startY = currentY; // Atualiza a posição inicial
          } 
          // Se arrastar para baixo e ainda houver conteúdo abaixo, rola manualmente
          else if (deltaY > 0 && container.scrollTop < (container.scrollHeight - container.clientHeight)) {
            container.scrollTop += deltaY;
            container.dataset.startY = currentY; // Atualiza a posição inicial
          }
        }}
      >
        {/* SELETOR DE BARBEIROS (2 POR LINHA) */}
        <div className="space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Selecione o Barbeiro:
          </span>
          
          <div className="grid grid-cols-2 gap-2.5">
            {barbeiros.length === 0 ? (
              <p className="text-xs text-slate-400 italic col-span-2">Nenhum barbeiro cadastrado nesta barbearia.</p>
            ) : (
              barbeiros.map((b) => {
                const selecionado = barbeiroSelecionado?.id === b.id;
                const foto = b.foto || b.avatar || b.imagem;

                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => selecionarBarbeiroParaEditar(b)}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer shadow-xs border overflow-hidden ${
                      selecionado
                        ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-slate-900/20'
                        : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden min-w-0">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-200 border border-white/30 shrink-0 flex items-center justify-center text-[10px] font-black">
                        {foto ? (
                          <img src={foto} alt={b.nome} className="w-full h-full object-cover" />
                        ) : (
                          <span>{b.nome?.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <span className="truncate">{b.nome}</span>
                    </div>
                    {selecionado && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ESCALA DO BARBEIRO SELECCIONADO */}
        {barbeiroSelecionado && (
          <div className="bg-slate-50/70 rounded-3xl border border-slate-200 p-4 sm:p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-bold text-slate-900">
                  Escala de {barbeiroSelecionado.nome}
                </span>
              </div>

              {sucessoBarbeiroMsg && (
                <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  <Check className="w-3.5 h-3.5" /> Horários Salvos!
                </span>
              )}
            </div>

            <div className="space-y-3">
              {DIAS_SEMANA_NOMES.map(({ key, label }) => {
                const configDia = horariosBarbeiro[key] || {};
                const ativo = configDia.ativo !== false;

                return (
                  <div
                    key={key}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      ativo ? 'bg-white border-slate-200' : 'bg-slate-100/60 border-slate-200/40 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`cfg-${key}`}
                          checked={ativo}
                          onChange={() => handleToggleDiaBarbeiro(key)}
                          className="w-4 h-4 accent-slate-900 rounded-md cursor-pointer"
                        />
                        <label htmlFor={`cfg-${key}`} className="text-xs font-bold text-slate-900 cursor-pointer">
                          {label}
                        </label>
                      </div>

                      <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {ativo ? 'Trabalha' : 'Folga'}
                      </span>
                    </div>

                    {ativo && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                        {/* Expediente */}
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                            Turno de Trabalho
                          </span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="time"
                              value={configDia.abertura || '08:00'}
                              onChange={(e) => handleCampoChangeBarbeiro(key, 'abertura', e.target.value)}
                              className="bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold px-2 py-1.5 rounded-xl focus:outline-none w-full"
                            />
                            <span className="text-slate-400 text-xs font-bold">às</span>
                            <input
                              type="time"
                              value={configDia.fechamento || '18:00'}
                              onChange={(e) => handleCampoChangeBarbeiro(key, 'fechamento', e.target.value)}
                              className="bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold px-2 py-1.5 rounded-xl focus:outline-none w-full"
                            />
                          </div>
                        </div>

                        {/* Pausa / Almoço */}
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                            <Coffee className="w-3 h-3" /> Pausa / Almoço
                          </span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="time"
                              value={configDia.pausaInicio || ''}
                              onChange={(e) => handleCampoChangeBarbeiro(key, 'pausaInicio', e.target.value)}
                              className="bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold px-2 py-1.5 rounded-xl focus:outline-none w-full"
                            />
                            <span className="text-slate-400 text-xs font-bold">às</span>
                            <input
                              type="time"
                              value={configDia.pausaFim || ''}
                              onChange={(e) => handleCampoChangeBarbeiro(key, 'pausaFim', e.target.value)}
                              className="bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold px-2 py-1.5 rounded-xl focus:outline-none w-full"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* RODAPÉ DO MODAL (FIXO) */}
      <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 bg-slate-50">
        <button
          type="button"
          onClick={handleSalvarEFecharModalBarbeiros}
          disabled={salvandoBarbeiro}
          className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5 text-emerald-400" />
          <span>{salvandoBarbeiro ? 'Salvando...' : 'Salvar e Concluir'}</span>
        </button>
      </div>

    </div>
  </div>
)}

      {/* ========================================== */}
      {/* MODAL SECUNDÁRIA: FUNCIONAMENTO GERAL       */}
      {/* ========================================== */}
      {modalHorariosGeraisOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden relative text-slate-900">
            
            <div className="flex items-center justify-between p-6 sm:p-8 border-b border-slate-100 shrink-0 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow">
                  <Clock className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Funcionamento Geral da Barbearia</h3>
                  <p className="text-xs text-slate-500">Defina os dias em que a unidade abre e bloqueie feriados/folgas.</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setModalHorariosGeraisOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto touch-pan-y overscroll-contain p-6 sm:p-8 space-y-6">
              
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
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Bloqueio de Feriados / Folgas Globais</h4>
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
                    <div className="space-y-1.5 max-h-40 overflow-y-auto touch-pan-y overscroll-contain pr-1">
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

              {/* Lista de Dias da Semana Abertos/Fechados */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Dias de Funcionamento da Barbearia</h4>

                <div className="space-y-2.5">
                  {ordemDiasSemana.map(({ key: diaKey, label }) => {
                    const diaConfig = horariosSemana[diaKey] || { ativo: false };
                    return (
                      <div 
                        key={diaKey}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          diaConfig.ativo ? 'bg-slate-50 border-slate-200' : 'bg-slate-100/60 border-slate-200/50 opacity-60'
                        }`}
                      >
                        <span className="font-bold text-slate-900 text-xs capitalize">{label}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleDia(diaKey)}
                          className={`text-[10px] font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                            diaConfig.ativo ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {diaConfig.ativo ? 'Aberto' : 'Fechado'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            <div className="p-6 sm:p-8 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 bg-slate-50">
              <button
                type="button"
                onClick={() => setModalHorariosGeraisOpen(false)}
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 space-y-6 relative text-slate-900">
            <button 
              type="button"
              onClick={() => setModalCompartilharOpen(false)}
              className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
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