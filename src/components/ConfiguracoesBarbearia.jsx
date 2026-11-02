'use client';

import React, { useState, useEffect } from 'react';
import { 
  Store, Save, Check, ExternalLink, Share2, 
  Send, X, MessageSquare, Bot, Grid, Palette, 
  Clock, Trash2, Upload, Image as ImageIcon, ShieldCheck,
  Link as LinkIcon, Type, Timer
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
  const [secaoAtiva, setSecaoAtiva] = useState('geral');

  const [nome, setNome] = useState(barbearia?.nome || '');
  const [slug, setSlug] = useState(barbearia?.slug || '');
  const [logoUrl, setLogoUrl] = useState(barbearia?.logo_url || '');
  const [capaUrl, setCapaUrl] = useState(barbearia?.capa_url || '');
  const [antecedenciaMinima, setAntecedenciaMinima] = useState(barbearia?.antecedencia_minima_minutos ?? 30);
  
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

  const [barbeiros, setBarbeiros] = useState([]);
  const [barbeiroSelecionado, setBarbeiroSelecionado] = useState(null);
  const [horariosBarbeiro, setHorariosBarbeiro] = useState({});

  const [listaBloqueios, setListaBloqueios] = useState([]);
  const [novaDataBloqueio, setNovaDataBloqueio] = useState('');
  const [novoMotivoBloqueio, setNovoMotivoBloqueio] = useState('');

  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [modalCompartilharOpen, setModalCompartilharOpen] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const baseUrl = typeof window !== 'undefined' && !window.location.origin.includes('localhost')
    ? window.location.origin
    : 'https://agendaestilo.com.br';

  const urlCliente = `${baseUrl}/agendar/${slug || barbearia?.slug || 'barbearia'}`;

  useEffect(() => {
    async function garantirBucket() {
      const { error } = await supabase.storage.getBucket('barbearia-bucket');
      if (error) {
        await supabase.storage.createBucket('barbearia-bucket', { public: true }).catch(err => {
          console.error('Erro ao criar bucket:', err);
        });
      }
    }
    garantirBucket();
  }, []);

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
  };

  const handleToggleDiaBarbeiro = (diaKey) => {
    const novosHorarios = {
      ...horariosBarbeiro,
      [diaKey]: {
        ...(horariosBarbeiro[diaKey] || { abertura: '08:00', fechamento: '18:00', pausaInicio: '12:00', pausaFim: '13:00' }),
        ativo: !(horariosBarbeiro[diaKey]?.ativo !== false)
      }
    };
    setHorariosBarbeiro(novosHorarios);
    
    if (barbeiroSelecionado) {
      setBarbeiros(prev => prev.map(b => b.id === barbeiroSelecionado.id ? { ...b, horarios_trabalho: novosHorarios } : b));
    }
  };

  const handleCampoChangeBarbeiro = (diaKey, campo, valor) => {
    const novosHorarios = {
      ...horariosBarbeiro,
      [diaKey]: {
        ...(horariosBarbeiro[diaKey] || { ativo: true, abertura: '08:00', fechamento: '18:00', pausaInicio: '12:00', pausaFim: '13:00' }),
        [campo]: valor
      }
    };
    setHorariosBarbeiro(novosHorarios);

    if (barbeiroSelecionado) {
      setBarbeiros(prev => prev.map(b => b.id === barbeiroSelecionado.id ? { ...b, horarios_trabalho: novosHorarios } : b));
    }
  };

  const comprimirImagem = (file, larguraMaxima = 1200, qualidade = 0.85) => {
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
      const arquivoOtimizado = await comprimirImagem(file, larguraMax, 0.85);

      const fileName = `${barbearia?.id}-${tipo}-${Date.now()}.jpg`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('barbearia-bucket')
        .upload(filePath, arquivoOtimizado, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicURLData } = supabase.storage
        .from('barbearia-bucket')
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
        const { data, error } = await supabase
          .from('bloqueios_agenda')
          .select('*')
          .eq('barbearia_id', barbearia.id)
          .order('data_bloqueio', { ascending: true });

        if (!error && data) setListaBloqueios(data);
      } catch (err) {
        console.error('Erro ao buscar bloqueios:', err);
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

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSalvando(true);
    setSucesso(false);

    try {
      const { error: erroBarbearia } = await supabase
        .from('barbearias')
        .update({ 
          nome, 
          slug, 
          logo_url: logoUrl, 
          capa_url: capaUrl,
          cor_tema: temaVisual,
          tipo_atendimento: modoAtendimento,
          modo_agendamento: modoAtendimento,
          permite_agendamentos: permiteAgendamentos,
          horarios: horariosSemana,
          antecedencia_minima_minutos: Number(antecedenciaMinima)
        })
        .eq('id', barbearia.id);

      if (erroBarbearia) throw erroBarbearia;

      for (const b of barbeiros) {
        await supabase
          .from('barbeiros')
          .update({ horarios_trabalho: b.horarios_trabalho })
          .eq('id', b.id);
      }

      setSucesso(true);
      if (onUpdate) onUpdate();
      setTimeout(() => setSucesso(false), 3000);
    } catch (err) {
      alert('Erro ao salvar configurações: ' + err.message);
    } finally {
      setSalvando(false);
    }
  };

  const botoesNavegacao = [
    { id: 'geral', titulo: 'Geral', icone: Store },
    { id: 'visual', titulo: 'Visual', icone: Palette },
    { id: 'atendimento', titulo: 'Atendimento', icone: MessageSquare },
    { id: 'barbeiros_horarios', titulo: 'Equipe', icone: Clock },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-2 space-y-2 font-sans text-slate-800 overflow-hidden select-none pb-28">
      
      {/* HEADER / CARTÃO DE PERFIL EXECUTIVO REFINADO (FIXO SEM SCROLL) */}
      <div className="bg-white/90 backdrop-blur-xl rounded-[28px] p-3 border border-slate-200/70 shadow-sm relative space-y-2">
        <div className="h-36 sm:h-44 w-full relative bg-slate-900 overflow-hidden rounded-2xl shadow-inner group">
          {capaUrl ? (
            <img src={capaUrl} alt="Capa" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-slate-950 via-slate-900 to-zinc-900 flex items-center justify-center">
              <span className="text-slate-500/40 font-black text-xl uppercase tracking-widest">{nome || 'AgendaEstilo'}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-black/20 to-transparent" />

          <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
            <button 
              type="button"
              onClick={() => setModalCompartilharOpen(true)}
              className="w-8 h-8 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 transition-all cursor-pointer shadow-md"
              title="Compartilhar Link"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <a 
              href={urlCliente}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 transition-all cursor-pointer shadow-md"
              title="Abrir Página Pública"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="flex flex-col items-center text-center -mt-16 relative z-10">
          <div className="w-22 h-22 sm:w-26 sm:h-26 rounded-full bg-white p-1.5 shadow-2xl ring-4 ring-white/90 overflow-hidden flex items-center justify-center bg-zinc-900 relative group">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-slate-900 to-zinc-800 text-white rounded-full flex items-center justify-center font-black text-2xl">
                {(nome || 'B').charAt(0)}
              </div>
            )}
          </div>
          <div className="mt-1 space-y-0.5">
            <h1 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight flex items-center justify-center gap-1.5">
              {nome || 'Minha Barbearia'}
              <ShieldCheck className="w-4 h-4 text-emerald-600 inline-block drop-shadow-xs" />
            </h1>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wide">@{slug || 'barbearia'}</p>
          </div>
        </div>
      </div>

      {/* ABAS DE NAVEGAÇÃO SUPERIORES */}
      <div className="grid grid-cols-4 gap-2">
        {botoesNavegacao.map((btn) => {
          const Icone = btn.icone;
          const ativo = secaoAtiva === btn.id;
          return (
            <button
              key={btn.id}
              type="button"
              onClick={() => setSecaoAtiva(btn.id)}
              className={`p-2 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 text-center shadow-xs ${
                ativo 
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.01]' 
                  : 'bg-white/80 hover:bg-white text-slate-600 border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${ativo ? 'bg-white/10 text-emerald-400' : 'bg-slate-100 text-slate-700'}`}>
                <Icone className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-bold tracking-tight truncate w-full">{btn.titulo}</span>
            </button>
          );
        })}
      </div>

      {/* PAINEL DE CONTEÚDO MODERNO (ESTÁTICO SEM ROLAGEM GERAL) */}
      <div className="bg-white/90 backdrop-blur-xl rounded-[28px] border border-slate-200/80 p-3 sm:p-3.5 shadow-sm space-y-2.5">
        
        {/* ================= GERAL & PERFIL ================= */}
        {secaoAtiva === 'geral' && (
          <div className="space-y-2.5 animate-in fade-in duration-200">
            <div className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-200/60 space-y-2">
              
              <div className="space-y-0.5">
                <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Type className="w-3 h-3 text-slate-400" /> Nome da Barbearia
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-white border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all shadow-2xs"
                  placeholder="Ex: Barbearia Executiva"
                />
              </div>

              <div className="space-y-0.5">
                <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <LinkIcon className="w-3 h-3 text-slate-400" /> Link Personalizado (Slug)
                </label>
                <div className="flex items-center bg-white border border-slate-200/80 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-slate-900/10 focus-within:border-slate-900 transition-all shadow-2xs">
                  <span className="pl-3 pr-2 text-[10px] text-slate-400 font-bold bg-slate-100 border-r border-slate-200/80 py-1.5">/agendar/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full bg-transparent px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none"
                    placeholder="sua-barbearia"
                  />
                </div>
              </div>

              <div className="space-y-0.5">
                <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Timer className="w-3 h-3 text-slate-400" /> Antecedência Mínima (minutos)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={antecedenciaMinima}
                  onChange={(e) => setAntecedenciaMinima(e.target.value)}
                  className="w-full bg-white border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all shadow-2xs"
                  placeholder="Ex: 30"
                />
              </div>
            </div>

            <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 to-zinc-900 text-white p-3 rounded-2xl shadow-md border border-slate-800">
              <div className="space-y-0.5">
                <h5 className="font-extrabold text-xs tracking-tight">Horários Gerais & Feriados</h5>
                <p className="text-[10px] text-slate-300 font-medium">Gerencie bloqueios de datas e exceções.</p>
              </div>
              <button
                type="button"
                onClick={() => setModalHorariosGeraisOpen(true)}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-black cursor-pointer shadow-sm transition-all"
              >
                Configurar
              </button>
            </div>
          </div>
        )}

        {/* ================= VISUAL & MÍDIA ================= */}
        {secaoAtiva === 'visual' && (
          <div className="space-y-2.5 animate-in fade-in duration-200">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-50/80 p-2 rounded-2xl border border-slate-200/60 space-y-1 flex flex-col items-center text-center">
                <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider w-full text-left">Logo</label>
                <label className="w-full border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-xl p-1.5 flex flex-col items-center justify-center gap-1 bg-white cursor-pointer transition-all shadow-2xs">
                  <input type="file" accept="image/*" onChange={(e) => handleUploadImagem(e, 'logo')} className="hidden" />
                  {logoUrl ? <img src={logoUrl} alt="" className="w-8 h-8 rounded-full object-cover shadow-xs ring-2 ring-slate-200" /> : <Upload className="w-3.5 h-3.5 text-slate-400" />}
                  <span className="text-[9px] font-bold text-slate-700">{enviandoLogo ? 'Enviando...' : 'Enviar Logo'}</span>
                </label>
              </div>

              <div className="bg-slate-50/80 p-2 rounded-2xl border border-slate-200/60 space-y-1 flex flex-col items-center text-center">
                <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider w-full text-left">Capa</label>
                <label className="w-full border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-xl p-1.5 flex flex-col items-center justify-center gap-1 bg-white cursor-pointer transition-all shadow-2xs">
                  <input type="file" accept="image/*" onChange={(e) => handleUploadImagem(e, 'capa')} className="hidden" />
                  {capaUrl ? <img src={capaUrl} alt="" className="w-full h-8 rounded-lg object-cover shadow-xs ring-1 ring-slate-200" /> : <ImageIcon className="w-3.5 h-3.5 text-slate-400" />}
                  <span className="text-[9px] font-bold text-slate-700">{enviandoCapa ? 'Enviando...' : 'Enviar Capa'}</span>
                </label>
              </div>
            </div>

            <div className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-200/60 space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">Tema Visual do App</label>
              <div className="grid grid-cols-2 gap-2">
                <div 
                  onClick={() => setTemaVisual('clean')}
                  className={`p-2 rounded-xl border cursor-pointer text-center transition-all flex flex-col items-center gap-0.5 bg-white ${temaVisual === 'clean' ? 'border-slate-900 ring-2 ring-slate-900/10 font-bold shadow-xs' : 'border-slate-200 text-slate-600'}`}
                >
                  <span className="text-xs text-slate-900 font-bold">Clean (Claro)</span>
                </div>
                <div 
                  onClick={() => setTemaVisual('dark')}
                  className={`p-2 rounded-xl border cursor-pointer text-center transition-all flex flex-col items-center gap-0.5 ${temaVisual === 'dark' ? 'border-zinc-900 bg-zinc-900 text-white font-bold shadow-xs' : 'border-slate-200 bg-white text-slate-600'}`}
                >
                  <span className="text-xs font-bold">Dark (Escuro)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= ATENDIMENTO ================= */}
        {secaoAtiva === 'atendimento' && (
          <div className="space-y-2.5 animate-in fade-in duration-200">
            <div className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-200/60 space-y-2">
              <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">Modo de Agendamento do Cliente</label>
              <div className="grid grid-cols-1 gap-1.5">
                <div 
                  onClick={() => setModoAtendimento('conversacional')}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2 bg-white ${modoAtendimento === 'conversacional' ? 'border-slate-900 ring-2 ring-slate-900/10 shadow-xs' : 'border-slate-200 hover:bg-slate-50'}`}
                >
                  <div className="w-5 h-5 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-900 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Conversacional (Chat)</h4>
                    <p className="text-[10px] text-slate-500 leading-tight">Assistente virtual passo a passo no agendamento.</p>
                  </div>
                </div>

                <div 
                  onClick={() => setModoAtendimento('classico')}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2 bg-white ${modoAtendimento === 'classico' ? 'border-slate-900 ring-2 ring-slate-900/10 shadow-xs' : 'border-slate-200 hover:bg-slate-50'}`}
                >
                  <div className="w-5 h-5 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-900 mt-0.5">
                    <Grid className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Clássico (Grade)</h4>
                    <p className="text-[10px] text-slate-500 leading-tight">Seleção tradicional em grade de horários disponíveis.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= EQUIPE & ESCALA ================= */}
        {secaoAtiva === 'barbeiros_horarios' && (
          <div className="space-y-2 animate-in fade-in duration-200">
            <div className="space-y-1.5">
              <div className="flex flex-wrap gap-1 pb-0.5">
                {barbeiros.map((b) => {
                  const selecionado = barbeiroSelecionado?.id === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => selecionarBarbeiroParaEditar(b)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                        selecionado ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{b.nome}</span>
                    </button>
                  );
                })}
              </div>

              {barbeiroSelecionado && (
                <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-2 space-y-1.5 shadow-inner">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-900">Escala de Horários: {barbeiroSelecionado.nome}</span>
                  </div>

                  <div className="relative">
                    <div className="flex items-stretch gap-2 overflow-x-auto pb-1.5 pt-0.5 px-0.5 snap-x snap-mandatory [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                      {DIAS_SEMANA_NOMES.map(({ key, label }) => {
                        const configDia = horariosBarbeiro[key] || {};
                        const ativo = configDia.ativo !== false;

                        return (
                          <div 
                            key={key} 
                            className="w-[240px] sm:w-[250px] snap-center p-2.5 rounded-xl border bg-white border-slate-200 shadow-xs shrink-0 flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={ativo}
                                    onChange={() => handleToggleDiaBarbeiro(key)}
                                    className="w-3.5 h-3.5 accent-slate-900 rounded"
                                  />
                                  <span className="text-[11px] font-black text-slate-800">{label}</span>
                                </label>
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                  {ativo ? 'Trabalha' : 'Folga'}
                                </span>
                              </div>

                              {ativo ? (
                                <div className="space-y-1.5 pt-1.5 text-[10px]">
                                  <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200/60 space-y-0.5">
                                    <span className="block text-[8px] font-bold text-slate-500 uppercase">Expediente</span>
                                    <div className="grid grid-cols-2 gap-1">
                                      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-1.5 py-0.5">
                                        <span className="text-[8px] text-slate-400">Das</span>
                                        <input
                                          type="time"
                                          value={configDia.abertura || '08:00'}
                                          onChange={(e) => handleCampoChangeBarbeiro(key, 'abertura', e.target.value)}
                                          className="w-full bg-transparent text-[10px] font-bold text-slate-900 focus:outline-none"
                                        />
                                      </div>
                                      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-1.5 py-0.5">
                                        <span className="text-[8px] text-slate-400">Até</span>
                                        <input
                                          type="time"
                                          value={configDia.fechamento || '18:00'}
                                          onChange={(e) => handleCampoChangeBarbeiro(key, 'fechamento', e.target.value)}
                                          className="w-full bg-transparent text-[10px] font-bold text-slate-900 focus:outline-none"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="bg-amber-50/40 p-1.5 rounded-lg border border-amber-200/60 space-y-0.5">
                                    <span className="block text-[8px] font-bold text-amber-900 uppercase">Almoço</span>
                                    <div className="grid grid-cols-2 gap-1">
                                      <div className="flex items-center gap-1 bg-white border border-amber-200 rounded px-1.5 py-0.5">
                                        <span className="text-[8px] text-amber-700/60">Das</span>
                                        <input
                                          type="time"
                                          value={configDia.pausaInicio || '12:00'}
                                          onChange={(e) => handleCampoChangeBarbeiro(key, 'pausaInicio', e.target.value)}
                                          className="w-full bg-transparent text-[10px] font-bold text-amber-900 focus:outline-none"
                                        />
                                      </div>
                                      <div className="flex items-center gap-1 bg-white border border-amber-200 rounded px-1.5 py-0.5">
                                        <span className="text-[8px] text-amber-700/60">Até</span>
                                        <input
                                          type="time"
                                          value={configDia.pausaFim || '13:00'}
                                          onChange={(e) => handleCampoChangeBarbeiro(key, 'pausaFim', e.target.value)}
                                          className="w-full bg-transparent text-[10px] font-bold text-amber-900 focus:outline-none"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="py-8 text-center text-slate-400 font-semibold text-[11px] flex flex-col items-center justify-center gap-0.5">
                                  <span>Dia de Folga</span>
                                  <span className="text-[8px] text-slate-400 font-normal">Nenhum atendimento</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* BOTÃO FIXO DE SALVAR COMPACTO E ELEGANTE */}
      <div className="fixed bottom-28 left-4 right-4 z-30 max-w-xs mx-auto pointer-events-none">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={salvando}
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] uppercase tracking-wider rounded-xl shadow-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 pointer-events-auto border border-white/10 backdrop-blur-md"
        >
          {sucesso ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5 text-emerald-400" />}
          <span>{salvando ? 'Salvando...' : sucesso ? 'Salvo!' : 'Salvar Alterações'}</span>
        </button>
      </div>

      {/* MODAL DE COMPARTILHAMENTO */}
      {modalCompartilharOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 relative">
            <button onClick={() => setModalCompartilharOpen(false)} className="absolute top-4 right-4 p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full cursor-pointer"><X className="w-4 h-4" /></button>
            <h3 className="text-sm font-black text-slate-900">Compartilhar Link de Agendamento</h3>
            <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
              <input type="text" readOnly value={urlCliente} className="w-full bg-transparent text-xs truncate outline-none font-semibold text-slate-700" />
              <button onClick={handleCopiarLink} className="px-3.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer shrink-0">{copiado ? 'Copiado!' : 'Copiar'}</button>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button onClick={handleCompartilharWhatsApp} className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-colors"><MessageSquare className="w-4 h-4" /> WhatsApp</button>
              <button onClick={handleCompartilharTelegram} className="p-3 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-colors"><Send className="w-4 h-4" /> Telegram</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE HORÁRIOS GERAIS E BLOQUEIOS */}
      {modalHorariosGeraisOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Bloqueios & Feriados Gerais</h3>
              <button onClick={() => setModalHorariosGeraisOpen(false)} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full cursor-pointer"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Agendamentos Online</h4>
                  <p className="text-[10px] text-slate-500">Ativar ou pausar novos agendamentos globais.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPermiteAgendamentos(!permiteAgendamentos)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold cursor-pointer shadow-2xs ${permiteAgendamentos ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}
                >
                  {permiteAgendamentos ? 'Ativo' : 'Pausado'}
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-xs text-slate-900">Adicionar Data Bloqueada / Feriado</h4>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={novaDataBloqueio} onChange={(e) => setNovaDataBloqueio(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900" />
                  <input type="text" placeholder="Motivo (Ex: Natal)" value={novoMotivoBloqueio} onChange={(e) => setNovoMotivoBloqueio(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900" />
                </div>
                <button type="button" onClick={handleAdicionarBloqueio} className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer mt-1">Adicionar Bloqueio</button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {listaBloqueios.map(b => (
                  <div key={b.id} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-xs font-semibold">
                    <span>{b.data_bloqueio} - {b.motivo}</span>
                    <button type="button" onClick={() => handleRemoverBloqueio(b.id)} className="text-rose-600 hover:text-rose-800 p-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>

            <button type="button" onClick={() => setModalHorariosGeraisOpen(false)} className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer">
              Concluir
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
