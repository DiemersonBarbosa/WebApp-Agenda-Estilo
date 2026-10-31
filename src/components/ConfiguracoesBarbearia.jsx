'use client';

import React, { useState, useEffect } from 'react';
import { 
  Store, Save, Check, ExternalLink, Share2, Copy, MessageCircle, 
  Send, X, MessageSquare, Bot, Grid, Palette, 
  Clock, Trash2, Plus, Upload, Image as ImageIcon,
  User, ChevronRight, ArrowLeft
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
  const [secaoAtiva, setSecaoAtiva] = useState('principal');

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
  const [salvandoBarbeiro, setSalvandoBarbeiro] = useState(false);
  const [sucessoBarbeiroMsg, setSucessoBarbeiroMsg] = useState(false);

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
        ...(prev[diaKey] || { ativo: true, abertura: '08:00', fechamento: '18:00', pausaInicio: '12:00', pausaFim: '13:00' }),
        [campo]: valor
      }
    }));
  };

  const salvandoHorariosBarbeiro = async () => {
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
          permite_agendamentos: permiteAgendamentos,
          horarios: horariosSemana,
          antecedencia_minima_minutos: Number(antecedenciaMinima)
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

  const opcoesConfig = [
    { id: 'geral', titulo: 'Geral & Perfil', sub: 'Nome, link de acesso e antecedência', icone: Store },
    { id: 'visual', titulo: 'Visual & Mídia', sub: 'Logo, imagem de capa e tema de cores', icone: Palette },
    { id: 'atendimento', titulo: 'Modo de Atendimento', sub: 'Agendamento via chat ou layout clássico', icone: MessageSquare },
    { id: 'barbeiros_horarios', titulo: 'Horários da Equipe', sub: 'Turnos e folgas de cada profissional', icone: Clock },
  ];

  return (
    <div className="w-full h-full bg-slate-50 text-slate-900 overflow-hidden font-sans flex flex-col justify-between">
      <div className="overflow-hidden">
        <div className="w-full bg-white border-b border-slate-200 shadow-xs relative mb-3">
          <div className="h-32 sm:h-44 w-full relative bg-slate-900 overflow-hidden">
            {capaUrl ? (
              <img src={capaUrl} alt="Capa" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-slate-900 via-stone-800 to-slate-900 flex items-center justify-center">
                <span className="text-slate-600/40 font-black text-2xl uppercase tracking-widest">{nome || 'AgendaEstilo'}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

            <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
              <button 
                type="button"
                onClick={() => setModalCompartilharOpen(true)}
                className="w-8 h-8 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 transition-all cursor-pointer shadow"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
              <a 
                href={urlCliente}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 transition-all cursor-pointer shadow"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {secaoAtiva !== 'principal' && (
              <button 
                type="button"
                onClick={() => setSecaoAtiva('principal')}
                className="absolute top-3 left-3 bg-black/50 hover:bg-black/70 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all cursor-pointer z-10"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar
              </button>
            )}
          </div>

          <div className="max-w-4xl mx-auto px-4 flex flex-col items-center text-center -mt-12 relative z-10">
            <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-full bg-white p-1 shadow-xl ring-2 ring-slate-200 overflow-hidden flex items-center justify-center bg-stone-900">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-full" />
              ) : (
                <div className="w-full h-full bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-2xl">
                  {(nome || 'B').charAt(0)}
                </div>
              )}
            </div>
            <div className="pb-1 mt-0.5">
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">{nome || 'Minha Barbearia'}</h1>
              <p className="text-[11px] text-slate-500 font-bold">@{slug || 'barbearia'}</p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-3 sm:px-6">
          {secaoAtiva === 'principal' && (
            <div className="space-y-3 animate-in fade-in duration-200 py-1">
              <div className="space-y-2.5">
                {opcoesConfig.map((item) => {
                  const Icone = item.icone;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSecaoAtiva(item.id)}
                      className="w-full bg-white px-4 py-3.5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-slate-400 transition-all flex items-center justify-between text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-slate-900 group-hover:text-white text-slate-800 flex items-center justify-center shrink-0 transition-colors">
                          <Icone className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate">{item.titulo}</h3>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.sub}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {secaoAtiva === 'geral' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow">
                  <Store className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xs font-extrabold text-slate-900">Geral & Perfil</h2>
                  <p className="text-[10px] text-slate-500">Nome, link e antecedência.</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700">Nome da Barbearia</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700">Link Personalizado (Slug)</label>
                  <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl overflow-hidden">
                    <span className="pl-3 text-[10px] text-slate-400 font-bold bg-slate-100 border-r border-slate-300 py-2">/agendar/</span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="w-full bg-transparent px-2.5 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700">Antecedência Mínima para Agendamento (minutos)</label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={antecedenciaMinima}
                    onChange={(e) => setAntecedenciaMinima(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                    placeholder="Ex: 30"
                  />
                  <p className="text-[9px] text-slate-500">Impede que clientes marquem horários em cima da hora (ex: 30 minutos antes).</p>
                </div>

                <div className="pt-1 border-t border-slate-100 flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border">
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">Horários e Feriados</h5>
                    <p className="text-[9px] text-slate-500">Bloqueie datas e configure aberturas.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalHorariosGeraisOpen(true)}
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Configurar
                  </button>
                </div>
              </div>
            </div>
          )}

          {secaoAtiva === 'visual' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow">
                  <Palette className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xs font-extrabold text-slate-900">Visual & Mídia</h2>
                  <p className="text-[10px] text-slate-500">Logo, capa e cores.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700">Logo</label>
                  <label className="border-2 border-dashed border-slate-300 rounded-xl p-2.5 flex flex-col items-center justify-center gap-1 bg-slate-50 cursor-pointer text-center">
                    <input type="file" accept="image/*" onChange={(e) => handleUploadImagem(e, 'logo')} className="hidden" />
                    {logoUrl ? <img src={logoUrl} alt="" className="w-8 h-8 rounded-full object-cover" /> : <Upload className="w-4 h-4 text-slate-500" />}
                    <span className="text-[9px] font-bold text-slate-700">Enviar Logo</span>
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700">Capa</label>
                  <label className="border-2 border-dashed border-slate-300 rounded-xl p-2.5 flex flex-col items-center justify-center gap-1 bg-slate-50 cursor-pointer text-center">
                    <input type="file" accept="image/*" onChange={(e) => handleUploadImagem(e, 'capa')} className="hidden" />
                    {capaUrl ? <img src={capaUrl} alt="" className="w-12 h-7 rounded object-cover" /> : <ImageIcon className="w-4 h-4 text-slate-500" />}
                    <span className="text-[9px] font-bold text-slate-700">Enviar Capa</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-[10px] font-bold text-slate-700">Tema Visual</label>
                <div className="grid grid-cols-2 gap-2">
                  <div 
                    onClick={() => setTemaVisual('clean')}
                    className={`p-2.5 rounded-xl border cursor-pointer text-center ${temaVisual === 'clean' ? 'border-slate-900 bg-slate-100 font-bold' : 'border-slate-200'}`}
                  >
                    <span className="text-xs">Clean (Claro)</span>
                  </div>
                  <div 
                    onClick={() => setTemaVisual('dark')}
                    className={`p-2.5 rounded-xl border cursor-pointer text-center ${temaVisual === 'dark' ? 'border-stone-900 bg-stone-950 text-white font-bold' : 'border-slate-200'}`}
                  >
                    <span className="text-xs">Dark (Escuro)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {secaoAtiva === 'atendimento' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xs font-extrabold text-slate-900">Atendimento</h2>
                  <p className="text-[10px] text-slate-500">Chat ou clássico.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div 
                  onClick={() => setModoAtendimento('conversacional')}
                  className={`p-3 rounded-xl border cursor-pointer ${modoAtendimento === 'conversacional' ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900' : 'border-slate-200'}`}
                >
                  <Bot className="w-4 h-4 text-slate-900 mb-1" />
                  <h4 className="font-bold text-xs text-slate-900">Conversacional</h4>
                  <p className="text-[9px] text-slate-500">Chat guiado.</p>
                </div>

                <div 
                  onClick={() => setModoAtendimento('classico')}
                  className={`p-3 rounded-xl border cursor-pointer ${modoAtendimento === 'classico' ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900' : 'border-slate-200'}`}
                >
                  <Grid className="w-4 h-4 text-slate-900 mb-1" />
                  <h4 className="font-bold text-xs text-slate-900">Clássico</h4>
                  <p className="text-[9px] text-slate-500">Grade rápida.</p>
                </div>
              </div>
            </div>
          )}

          {secaoAtiva === 'barbeiros_horarios' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xs font-extrabold text-slate-900">Horários da Equipe</h2>
                  <p className="text-[10px] text-slate-500">Turnos, pausas e folgas.</p>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {barbeiros.map((b) => {
                    const selecionado = barbeiroSelecionado?.id === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => selecionarBarbeiroParaEditar(b)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border ${
                          selecionado ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-800 border-slate-200'
                        }`}
                      >
                        <span className="truncate">{b.nome}</span>
                      </button>
                    );
                  })}
                </div>

                {barbeiroSelecionado && (
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{barbeiroSelecionado.nome}</span>
                      {sucessoBarbeiroMsg && <span className="text-[10px] text-emerald-600 font-bold">Salvo!</span>}
                    </div>

                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {DIAS_SEMANA_NOMES.map(({ key, label }) => {
                        const configDia = horariosBarbeiro[key] || {};
                        const ativo = configDia.ativo !== false;

                        return (
                          <div key={key} className="p-2 rounded-xl border bg-white space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={ativo}
                                  onChange={() => handleToggleDiaBarbeiro(key)}
                                  className="w-3 h-3 accent-slate-900 rounded"
                                />
                                <span className="text-[10px] font-bold text-slate-800">{label}</span>
                              </label>

                              {ativo && (
                                <div className="flex items-center gap-1">
                                  <span className="text-[8px] text-slate-400">Exp:</span>
                                  <input
                                    type="time"
                                    value={configDia.abertura || '08:00'}
                                    onChange={(e) => handleCampoChangeBarbeiro(key, 'abertura', e.target.value)}
                                    className="bg-slate-50 border text-[9px] font-bold px-1 py-0.5 rounded"
                                  />
                                  <span className="text-[9px] text-slate-400">-</span>
                                  <input
                                    type="time"
                                    value={configDia.fechamento || '18:00'}
                                    onChange={(e) => handleCampoChangeBarbeiro(key, 'fechamento', e.target.value)}
                                    className="bg-slate-50 border text-[9px] font-bold px-1 py-0.5 rounded"
                                  />
                                </div>
                              )}
                            </div>

                            {ativo && (
                              <div className="flex items-center justify-end gap-1 pt-1 border-t border-slate-100">
                                <span className="text-[8px] text-amber-600 font-bold">Pausa Almoço:</span>
                                <input
                                  type="time"
                                  value={configDia.pausaInicio || '12:00'}
                                  onChange={(e) => handleCampoChangeBarbeiro(key, 'pausaInicio', e.target.value)}
                                  className="bg-amber-50/50 border border-amber-200 text-[9px] font-bold px-1 py-0.5 rounded text-amber-800"
                                />
                                <span className="text-[9px] text-slate-400">-</span>
                                <input
                                  type="time"
                                  value={configDia.pausaFim || '13:00'}
                                  onChange={(e) => handleCampoChangeBarbeiro(key, 'pausaFim', e.target.value)}
                                  className="bg-amber-50/50 border border-amber-200 text-[9px] font-bold px-1 py-0.5 rounded text-amber-800"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={salvandoHorariosBarbeiro}
                      disabled={salvandoBarbeiro}
                      className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      {salvandoBarbeiro ? 'Salvando...' : 'Salvar Escala'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {secaoAtiva === 'principal' && (
        <div className="max-w-4xl mx-auto px-3 sm:px-6 w-full pt-2 pb-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={salvando}
            className="w-full py-3.5 bg-slate-900 hover:bg-black text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {sucesso ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4 text-emerald-400" />}
            <span>{salvando ? 'Salvando...' : sucesso ? 'Salvo com Sucesso!' : 'Salvar Alterações'}</span>
          </button>
        </div>
      )}

      {modalCompartilharOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setModalCompartilharOpen(false)} className="absolute top-4 right-4 p-1 bg-slate-100 rounded-full cursor-pointer"><X className="w-4 h-4" /></button>
            <h3 className="text-sm font-bold text-slate-900">Compartilhar Link</h3>
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border">
              <input type="text" readOnly value={urlCliente} className="w-full bg-transparent text-xs truncate outline-none" />
              <button onClick={handleCopiarLink} className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer">{copiado ? 'Copiado!' : 'Copiar'}</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleCompartilharWhatsApp} className="p-2.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"><MessageCircle className="w-4 h-4" /> WhatsApp</button>
              <button onClick={handleCompartilharTelegram} className="p-2.5 bg-sky-50 text-sky-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"><Send className="w-4 h-4" /> Telegram</button>
            </div>
          </div>
        </div>
      )}

      {modalHorariosGeraisOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="font-bold text-slate-900 text-xs">Bloqueios & Feriados</h3>
              <button onClick={() => setModalHorariosGeraisOpen(false)} className="p-1 bg-slate-100 rounded-full cursor-pointer"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border">
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Agendamentos Online</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setPermiteAgendamentos(!permiteAgendamentos)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${permiteAgendamentos ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}
                >
                  {permiteAgendamentos ? 'Ativo' : 'Pausado'}
                </button>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-xs text-slate-900">Adicionar Bloqueio</h4>
                <div className="flex gap-1.5">
                  <input type="date" value={novaDataBloqueio} onChange={(e) => setNovaDataBloqueio(e.target.value)} className="bg-slate-50 border rounded-xl px-2 py-1.5 text-xs w-full" />
                  <input type="text" placeholder="Motivo" value={novoMotivoBloqueio} onChange={(e) => setNovoMotivoBloqueio(e.target.value)} className="bg-slate-50 border rounded-xl px-2 py-1.5 text-xs w-full" />
                  <button type="button" onClick={handleAdicionarBloqueio} className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer">OK</button>
                </div>
              </div>

              <div className="space-y-1 max-h-32 overflow-y-auto">
                {listaBloqueios.map(b => (
                  <div key={b.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg text-xs">
                    <span>{b.data_bloqueio} - {b.motivo}</span>
                    <button type="button" onClick={() => handleRemoverBloqueio(b.id)} className="text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            </div>

            <button type="button" onClick={() => setModalHorariosGeraisOpen(false)} className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer">
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}