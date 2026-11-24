'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Store, Save, Check, ExternalLink, Share2,
  Send, X, MessageSquare, Bot, Grid, Palette,
  Clock, Trash2, Upload, Image as ImageIcon,
  Link as LinkIcon, Timer, Mail, Lock, CalendarOff, Globe,
  ZoomIn, ZoomOut, RotateCcw, Copy, Eye, EyeOff, ShieldCheck, Building2, Scissors
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  PRESETS_TEMA,
  FONTES_DISPONIVEIS,
  resolverTemaBarbearia,
} from '@/lib/temaAgendamento';
import {
  TEMPLATE_WHATSAPP_PADRAO,
  VARIAVEIS_WHATSAPP,
  renderizarMensagemConfirmacao,
} from '@/lib/mensagemWhatsapp';

const DIAS_SEMANA_NOMES = [
  { key: 'segunda', label: 'Segunda-feira' },
  { key: 'terca', label: 'Terça-feira' },
  { key: 'quarta', label: 'Quarta-feira' },
  { key: 'quinta', label: 'Quinta-feira' },
  { key: 'sexta', label: 'Sexta-feira' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' }
];

const FUSOS_HORARIOS = [
  { value: 'America/Sao_Paulo', label: 'Brasília (GMT-3) — SP, Sul, Sudeste e Nordeste' },
  { value: 'America/Manaus', label: 'Manaus (GMT-4) — Amazonas e Rondônia' },
  { value: 'America/Cuiaba', label: 'Cuiabá (GMT-4) — Mato Grosso e MS' },
  { value: 'America/Rio_Branco', label: 'Rio Branco (GMT-5) — Acre' },
  { value: 'America/Noronha', label: 'Fernando de Noronha (GMT-2)' }
];

const ESTILO_BOTAO_PRATEADO = {
  background: 'linear-gradient(145deg, #ffffff 0%, #f1f5f9 55%, #cbd5e1 100%)',
  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08), inset 0 1px 1.5px rgba(255, 255, 255, 0.85), inset 0 -1px 2px rgba(100, 116, 139, 0.16)',
};

const ESTILO_BOTAO_PRATEADO_PRESSIONADO = {
  background: 'linear-gradient(145deg, #e2e8f0 0%, #f8fafc 60%, #cbd5e1 100%)',
  boxShadow: 'inset 0 2px 4px rgba(15, 23, 42, 0.14), inset 0 -1px 1px rgba(255, 255, 255, 0.75)',
};

const renderDetalheDecorativo = (temaObj) => {
  const cor = temaObj?.cor_primaria || '#ec4899';
  switch (temaObj?.decoracao) {
    case 'coracao':
    case 'coracao_3d':
      return (
        <span
          className="pointer-events-none select-none text-lg opacity-35"
          style={{ color: cor }}
        >
          ♥
        </span>
      );
    case 'coroa':
      return (
        <span
          className="pointer-events-none select-none text-base opacity-45"
          style={{ color: cor }}
        >
          ♛
        </span>
      );
    case 'folhas':
      return (
        <span
          className="pointer-events-none select-none text-base opacity-35"
          style={{ color: cor }}
        >
          ❀
        </span>
      );
    case 'tesoura':
    case 'tesoura_vermelha':
      return (
        <span
          className="pointer-events-none select-none text-base opacity-35"
          style={{ color: cor }}
        >
          ✂
        </span>
      );
    case 'barber_pole':
      return (
        <span
          className="pointer-events-none select-none text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border opacity-50"
          style={{ color: cor, borderColor: cor }}
        >
          BARBER
        </span>
      );
    default:
      return null;
  }
};

export default function ConfiguracoesBarbearia({ barbearia, onUpdate }) {
  const [secaoAtiva, setSecaoAtiva] = useState('geral');

  const [nome, setNome] = useState(barbearia?.nome || '');
  const [slug, setSlug] = useState(barbearia?.slug || '');
  const [logoUrl, setLogoUrl] = useState(barbearia?.logo_url || '');
  const [capaUrl, setCapaUrl] = useState(barbearia?.capa_url || '');
  const [antecedenciaMinima, setAntecedenciaMinima] = useState(barbearia?.antecedencia_minima_minutos ?? 30);
  const [timezone, setTimezone] = useState(barbearia?.timezone || 'America/Sao_Paulo');
  const [mensagemWhatsapp, setMensagemWhatsapp] = useState(
    barbearia?.mensagem_whatsapp_confirmacao || TEMPLATE_WHATSAPP_PADRAO
  );
  const textareaWhatsappRef = useRef(null);

  const [email, setEmail] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [slugCopiado, setSlugCopiado] = useState(false);

  const [temaPersonalizado, setTemaPersonalizado] = useState(() => resolverTemaBarbearia(barbearia));
  const [modoPreview, setModoPreview] = useState('chat');
  const [filtroEstilos, setFiltroEstilos] = useState('todos');

  const [modoAtendimento, setModoAtendimento] = useState(
    barbearia?.tipo_atendimento || barbearia?.modo_agendamento || barbearia?.modo_chatbot || 'conversacional'
  );

  const [enviandoLogo, setEnviandoLogo] = useState(false);
  const [enviandoCapa, setEnviandoCapa] = useState(false);

  const [modalRecorte, setModalRecorte] = useState({
    aberto: false,
    tipo: 'logo',
    src: '',
    naturalWidth: 0,
    naturalHeight: 0,
    zoom: 1,
    posX: 0,
    posY: 0,
  });
  const [arrastando, setArrastando] = useState(false);
  const inicioArrasteRef = useRef({ x: 0, y: 0, baseX: 0, baseY: 0 });
  const caixaRecorteRef = useRef(null);

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

  const [servicosBarbearia, setServicosBarbearia] = useState([]);
  const [barbeiros, setBarbeiros] = useState([]);
  const [barbeiroSelecionado, setBarbeiroSelecionado] = useState(null);
  const [horariosBarbeiro, setHorariosBarbeiro] = useState({});
  const [servicosBarbeiro, setServicosBarbeiro] = useState([]);

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
    setTemaPersonalizado(resolverTemaBarbearia(barbearia));
    if (barbearia) {
      setMensagemWhatsapp(barbearia.mensagem_whatsapp_confirmacao || TEMPLATE_WHATSAPP_PADRAO);
    }
  }, [barbearia]);

  useEffect(() => {
    if (modoAtendimento === 'classico') {
      setModoPreview('classico');
    } else {
      setModoPreview('chat');
    }
  }, [modoAtendimento]);

  const atualizarCampoTema = (campo, valor) => {
    setTemaPersonalizado((prev) => ({ ...prev, [campo]: valor }));
  };

  const inserirVariavelWhatsapp = (variavel) => {
    const el = textareaWhatsappRef.current;
    if (!el) {
      setMensagemWhatsapp((prev) => `${prev}${variavel}`);
      return;
    }

    const inicio = el.selectionStart ?? mensagemWhatsapp.length;
    const fim = el.selectionEnd ?? mensagemWhatsapp.length;
    const novoTexto =
      mensagemWhatsapp.slice(0, inicio) + variavel + mensagemWhatsapp.slice(fim);

    setMensagemWhatsapp(novoTexto);

    requestAnimationFrame(() => {
      el.focus();
      const novaPosicao = inicio + variavel.length;
      el.setSelectionRange(novaPosicao, novaPosicao);
    });
  };

  useEffect(() => {
    async function carregarUsuarioAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
      }
    }
    carregarUsuarioAuth();
  }, []);

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
    async function carregarEquipeEServicos() {
      if (!barbearia?.id) return;
      const [resBarbeiros, resServicos] = await Promise.all([
        supabase.from('barbeiros').select('*').eq('barbearia_id', barbearia.id),
        supabase.from('servicos').select('*').eq('barbearia_id', barbearia.id).order('nome', { ascending: true }),
      ]);

      const listaServicos = resServicos.data || [];
      setServicosBarbearia(listaServicos);

      if (resBarbeiros.data && resBarbeiros.data.length > 0) {
        setBarbeiros(resBarbeiros.data);
        selecionarBarbeiroParaEditar(resBarbeiros.data[0]);
      }
    }
    carregarEquipeEServicos();
  }, [barbearia?.id]);

  const selecionarBarbeiroParaEditar = (barbeiro) => {
    setBarbeiroSelecionado(barbeiro);
    setHorariosBarbeiro(barbeiro.horarios_trabalho || {});
    setServicosBarbeiro(Array.isArray(barbeiro.servicos_ids) ? barbeiro.servicos_ids : []);
  };

  const atualizarServicosDoBarbeiro = (novaListaIds) => {
    const unicos = Array.from(new Set(novaListaIds));
    setServicosBarbeiro(unicos);

    if (barbeiroSelecionado) {
      setBarbeiroSelecionado((prev) => ({ ...prev, servicos_ids: unicos }));
      setBarbeiros((prev) =>
        prev.map((b) => (b.id === barbeiroSelecionado.id ? { ...b, servicos_ids: unicos } : b))
      );
    }
  };

  const handleToggleServicoBarbeiro = (servicoId) => {
    const existe = servicosBarbeiro.includes(servicoId);
    const atualizada = existe
      ? servicosBarbeiro.filter((id) => id !== servicoId)
      : [...servicosBarbeiro, servicoId];
    atualizarServicosDoBarbeiro(atualizada);
  };

  const handleMarcarTodosServicosBarbeiro = () => {
    atualizarServicosDoBarbeiro(servicosBarbearia.map((s) => s.id));
  };

  const handleLimparServicosBarbeiro = () => {
    atualizarServicosDoBarbeiro([]);
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

  const abrirModalRecorte = (e, tipo) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = String(event.target?.result || '');
      const img = new Image();
      img.onload = () => {
        setModalRecorte({
          aberto: true,
          tipo,
          src,
          naturalWidth: img.naturalWidth || img.width,
          naturalHeight: img.naturalHeight || img.height,
          zoom: 1,
          posX: 0,
          posY: 0,
        });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handlePointerDownRecorte = (e) => {
    e.preventDefault();
    setArrastando(true);
    inicioArrasteRef.current = {
      x: e.clientX,
      y: e.clientY,
      baseX: modalRecorte.posX,
      baseY: modalRecorte.posY,
    };
  };

  const handlePointerMoveRecorte = (e) => {
    if (!arrastando) return;
    const dx = e.clientX - inicioArrasteRef.current.x;
    const dy = e.clientY - inicioArrasteRef.current.y;
    setModalRecorte((prev) => ({
      ...prev,
      posX: inicioArrasteRef.current.baseX + dx,
      posY: inicioArrasteRef.current.baseY + dy,
    }));
  };

  const handlePointerUpRecorte = () => {
    setArrastando(false);
  };

  const calcularDimensoesVisuaisImagem = () => {
    const isLogo = modalRecorte.tipo === 'logo';
    const caixaW = caixaRecorteRef.current?.clientWidth || (isLogo ? 224 : 360);
    const caixaH = caixaRecorteRef.current?.clientHeight || (isLogo ? 224 : 176);

    if (!modalRecorte.naturalWidth || !modalRecorte.naturalHeight) {
      return { width: caixaW, height: caixaH, baseScale: 1 };
    }

    const baseScale = Math.max(caixaW / modalRecorte.naturalWidth, caixaH / modalRecorte.naturalHeight);
    const escalaTotal = baseScale * modalRecorte.zoom;

    return {
      width: modalRecorte.naturalWidth * escalaTotal,
      height: modalRecorte.naturalHeight * escalaTotal,
      baseScale,
    };
  };

  const confirmarEnquadramentoEEnviar = async () => {
    if (!modalRecorte.src) return;
    const isLogo = modalRecorte.tipo === 'logo';
    if (isLogo) setEnviandoLogo(true);
    else setEnviandoCapa(true);

    try {
      const img = await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = modalRecorte.src;
      });

      const larguraSaida = isLogo ? 500 : 1200;
      const alturaSaida = isLogo ? 500 : 600;
      const canvas = document.createElement('canvas');
      canvas.width = larguraSaida;
      canvas.height = alturaSaida;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, larguraSaida, alturaSaida);

      const larguraCaixaVisual = caixaRecorteRef.current?.clientWidth || (isLogo ? 224 : 360);
      const alturaCaixaVisual = caixaRecorteRef.current?.clientHeight || (isLogo ? 224 : 176);

      const escalaBaseVisual = Math.max(larguraCaixaVisual / img.width, alturaCaixaVisual / img.height);
      const larguraVisualFinal = img.width * escalaBaseVisual * modalRecorte.zoom;
      const alturaVisualFinal = img.height * escalaBaseVisual * modalRecorte.zoom;

      const fatorEscalaSaidaX = larguraSaida / larguraCaixaVisual;
      const fatorEscalaSaidaY = alturaSaida / alturaCaixaVisual;

      const larguraDesenhada = larguraVisualFinal * fatorEscalaSaidaX;
      const alturaDesenhada = alturaVisualFinal * fatorEscalaSaidaY;

      const centroX = larguraSaida / 2 + modalRecorte.posX * fatorEscalaSaidaX;
      const centroY = alturaSaida / 2 + modalRecorte.posY * fatorEscalaSaidaY;

      ctx.drawImage(
        img,
        centroX - larguraDesenhada / 2,
        centroY - alturaDesenhada / 2,
        larguraDesenhada,
        alturaDesenhada
      );

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Falha ao gerar imagem recortada.'))),
          'image/jpeg',
          0.9
        );
      });

      const arquivoOtimizado = new File([blob], `${modalRecorte.tipo}-${Date.now()}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });

      const fileName = `${barbearia?.id}-${modalRecorte.tipo}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('barbearia-bucket')
        .upload(fileName, arquivoOtimizado, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicURLData } = supabase.storage
        .from('barbearia-bucket')
        .getPublicUrl(fileName);

      const urlPublica = publicURLData.publicUrl;

      if (isLogo) setLogoUrl(urlPublica);
      else setCapaUrl(urlPublica);

      setModalRecorte((prev) => ({ ...prev, aberto: false, src: '' }));
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

  const handleCopiarSlugInline = () => {
    navigator.clipboard.writeText(urlCliente);
    setSlugCopiado(true);
    setTimeout(() => setSlugCopiado(false), 2500);
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
      const mensagemWhatsappSalvar =
        mensagemWhatsapp.trim() && mensagemWhatsapp.trim() !== TEMPLATE_WHATSAPP_PADRAO.trim()
          ? mensagemWhatsapp
          : null;

      const { error: erroBarbearia } = await supabase
        .from('barbearias')
        .update({
          nome,
          slug,
          logo_url: logoUrl,
          capa_url: capaUrl,
          cor_tema: temaPersonalizado.modo_base || 'dark',
          tema_personalizado: temaPersonalizado,
          tipo_atendimento: modoAtendimento,
          modo_agendamento: modoAtendimento,
          permite_agendamentos: permiteAgendamentos,
          horarios: horariosSemana,
          antecedencia_minima_minutos: Number(antecedenciaMinima),
          timezone: timezone,
          mensagem_whatsapp_confirmacao: mensagemWhatsappSalvar,
        })
        .eq('id', barbearia.id);

      if (erroBarbearia) throw erroBarbearia;

      for (const b of barbeiros) {
        const { error: erroBarb } = await supabase
          .from('barbeiros')
          .update({
            horarios_trabalho: b.horarios_trabalho,
            servicos_ids: Array.isArray(b.servicos_ids) ? b.servicos_ids : [],
          })
          .eq('id', b.id);

        if (erroBarb) throw erroBarb;
      }

      const authUpdates = {};
      if (email && email.trim() !== '') authUpdates.email = email;

      if (novaSenha && novaSenha.trim() !== '') {
        if (novaSenha.length < 6) {
          throw new Error('A nova senha deve ter pelo menos 6 caracteres.');
        }
        authUpdates.password = novaSenha;
      }

      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabase.auth.updateUser(authUpdates);
        if (authError) throw authError;
      }

      setSucesso(true);
      setNovaSenha('');
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

  const presetsFiltrados = [...PRESETS_TEMA]
    .sort((a, b) => {
      const peso = (grupo) => (grupo === 'masculino' ? 0 : grupo === 'feminino' ? 1 : 2);
      return peso(a.grupo) - peso(b.grupo);
    })
    .filter((p) => {
      if (filtroEstilos === 'todos') return true;
      return p.grupo === filtroEstilos;
    });

  const isRecorteLogo = modalRecorte.tipo === 'logo';
  const dimensoesVisuais = calcularDimensoesVisuaisImagem();

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-2 space-y-2.5 font-sans text-slate-800 select-none pb-28">

      {/* HEADER / CARTÃO DE PERFIL EXECUTIVO REFINADO */}
      <div className="bg-white/95 backdrop-blur-md rounded-[28px] p-3 border border-slate-200/80 relative space-y-2">
        <div className="h-36 sm:h-44 w-full relative bg-slate-900 overflow-hidden rounded-2xl group">
          {capaUrl ? (
            <img src={capaUrl} alt="Capa" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-slate-950 via-slate-900 to-zinc-900 flex items-center justify-center">
              <span className="text-slate-500/40 font-black text-xl uppercase tracking-widest">{nome || 'AgendaEstilo'}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-black/15 to-transparent" />

          <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
            <button
              type="button"
              onClick={() => setModalCompartilharOpen(true)}
              style={ESTILO_BOTAO_PRATEADO}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-900 border border-white/90 transition-all cursor-pointer active:scale-95"
              title="Compartilhar Link"
            >
              <Share2 className="w-4 h-4 stroke-[2.2]" />
            </button>
            <a
              href={urlCliente}
              target="_blank"
              rel="noopener noreferrer"
              style={ESTILO_BOTAO_PRATEADO}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-900 border border-white/90 transition-all cursor-pointer active:scale-95"
              title="Abrir Página Pública"
            >
              <ExternalLink className="w-4 h-4 stroke-[2.2]" />
            </a>
          </div>
        </div>

        <div className="flex flex-col items-center text-center -mt-16 relative z-10 space-y-1">
          <div className="w-22 h-22 sm:w-26 sm:h-26 rounded-full bg-white p-1.5 border border-slate-200 ring-4 ring-white/90 overflow-hidden flex items-center justify-center relative group">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-slate-900 to-zinc-800 text-white rounded-full flex items-center justify-center font-black text-2xl">
                {(nome || 'B').charAt(0)}
              </div>
            )}
          </div>
          <h2 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
            {nome || 'Minha Barbearia'}
          </h2>
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
              style={ativo ? ESTILO_BOTAO_PRATEADO_PRESSIONADO : ESTILO_BOTAO_PRATEADO}
              className={`p-2 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 text-center ${
                ativo
                  ? 'text-slate-950 border-slate-300 translate-y-[1px]'
                  : 'text-slate-800 border-white/85 hover:brightness-[1.02]'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-white/80 border border-slate-300/80 flex items-center justify-center text-slate-900">
                <Icone className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
              <span className={`text-[10px] tracking-tight truncate w-full ${ativo ? 'font-black' : 'font-bold'}`}>
                {btn.titulo}
              </span>
            </button>
          );
        })}
      </div>

      {/* PAINEL DE CONTEÚDO MODERNO */}
      <div className="bg-white/95 backdrop-blur-md rounded-[28px] border border-slate-200/80 p-3.5 sm:p-5 space-y-4">

        {/* ================= GERAL & PERFIL ================= */}
        {secaoAtiva === 'geral' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in fade-in duration-200">

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4 space-y-4">
              <div className="flex items-start gap-3 pb-3 border-b border-slate-200/70">
                <div
                  style={ESTILO_BOTAO_PRATEADO}
                  className="w-10 h-10 rounded-full border border-white text-slate-900 flex items-center justify-center shrink-0"
                >
                  <Building2 className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    Perfil do Estabelecimento
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Identidade pública, endereço de agendamento e fuso local.
                  </p>
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Nome da barbearia</span>
                    <span className="text-[10px] font-medium text-slate-400">Visível aos clientes</span>
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="w-full h-10 bg-white border border-slate-200 rounded-xl pl-10 pr-3.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                      placeholder="Ex: Barbearia do Vidal"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Link de agendamento</span>
                    <button
                      type="button"
                      onClick={handleCopiarSlugInline}
                      style={ESTILO_BOTAO_PRATEADO}
                      className="px-2.5 py-1 rounded-full border border-white text-[10px] font-bold text-slate-900 flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      {slugCopiado ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{slugCopiado ? 'Copiado!' : 'Copiar link'}</span>
                    </button>
                  </label>
                  <div className="flex items-center h-10 bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-slate-900/10 focus-within:border-slate-900 transition-all">
                    <span className="h-full px-3 flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-slate-100/80 border-r border-slate-200 shrink-0">
                      <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                      /agendar/
                    </span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                      className="w-full h-full bg-transparent px-3 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                      placeholder="sua-barbearia"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Fuso horário da agenda
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full h-10 bg-white border border-slate-200 rounded-xl pl-10 pr-8 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all truncate"
                    >
                      {FUSOS_HORARIOS.map((fuso) => (
                        <option key={fuso.value} value={fuso.value}>
                          {fuso.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-start gap-3 pb-3 border-b border-slate-200/70">
                  <div
                    style={ESTILO_BOTAO_PRATEADO}
                    className="w-10 h-10 rounded-full border border-white text-slate-900 flex items-center justify-center shrink-0"
                  >
                    <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      Acesso e Segurança
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Credenciais de login do painel administrativo.
                    </p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 block">
                      E-mail administrativo
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-10 bg-white border border-slate-200 rounded-xl pl-10 pr-3.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                        placeholder="seuemail@exemplo.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                      <span>Nova senha</span>
                      <span className="text-[10px] font-medium text-slate-400">Opcional</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={mostrarSenha ? 'text' : 'password'}
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                        autoComplete="new-password"
                        className="w-full h-10 bg-white border border-slate-200 rounded-xl pl-10 pr-10 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                        placeholder="Mínimo de 6 caracteres"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarSenha((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 cursor-pointer p-0.5"
                        title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Deixe em branco para manter sua senha atual sem alterações.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-800 truncate">Página pública ativa</p>
                  <p className="text-[10px] text-slate-500 truncate">{urlCliente}</p>
                </div>
                <a
                  href={urlCliente}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={ESTILO_BOTAO_PRATEADO}
                  className="px-3 py-1.5 rounded-full border border-white text-slate-900 text-[11px] font-bold shrink-0 transition-all flex items-center gap-1 active:scale-95"
                >
                  <span>Abrir</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

          </div>
        )}

        {/* ================= VISUAL, CORES & PREVIEW AO VIVO ================= */}
        {secaoAtiva === 'visual' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-50/80 p-2 rounded-2xl border border-slate-200/60 space-y-1 flex flex-col items-center text-center">
                <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider w-full text-left">Logo</label>
                <label
                  style={ESTILO_BOTAO_PRATEADO}
                  className="w-full border border-white rounded-xl p-2 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-[0.99]"
                >
                  <input type="file" accept="image/*" onChange={(e) => abrirModalRecorte(e, 'logo')} className="hidden" />
                  {logoUrl ? <img src={logoUrl} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-white" /> : <Upload className="w-4 h-4 text-slate-800" />}
                  <span className="text-[10px] font-bold text-slate-900">{enviandoLogo ? 'Enviando...' : 'Enquadrar Logo'}</span>
                </label>
              </div>

              <div className="bg-slate-50/80 p-2 rounded-2xl border border-slate-200/60 space-y-1 flex flex-col items-center text-center">
                <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider w-full text-left">Capa</label>
                <label
                  style={ESTILO_BOTAO_PRATEADO}
                  className="w-full border border-white rounded-xl p-2 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-[0.99]"
                >
                  <input type="file" accept="image/*" onChange={(e) => abrirModalRecorte(e, 'capa')} className="hidden" />
                  {capaUrl ? <img src={capaUrl} alt="" className="w-full h-8 rounded-lg object-cover ring-1 ring-white" /> : <ImageIcon className="w-4 h-4 text-slate-800" />}
                  <span className="text-[10px] font-bold text-slate-900">{enviandoCapa ? 'Enviando...' : 'Enquadrar Capa'}</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
              <div className="lg:col-span-7 bg-slate-50/90 p-3 rounded-2xl border border-slate-200/70 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      Estilos Prontos
                    </span>
                    <div className="flex items-center gap-1">
                      {[
                        { id: 'todos', label: 'Todos' },
                        { id: 'masculino', label: 'Dark / Clássicos' },
                        { id: 'feminino', label: 'Rosas / Glam' },
                      ].map((f) => {
                        const ativoFiltro = filtroEstilos === f.id;
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setFiltroEstilos(f.id)}
                            style={ativoFiltro ? ESTILO_BOTAO_PRATEADO_PRESSIONADO : ESTILO_BOTAO_PRATEADO}
                            className="px-2.5 py-1 rounded-full border border-white text-[9px] font-bold text-slate-900 cursor-pointer"
                          >
                            {f.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {presetsFiltrados.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setTemaPersonalizado(preset.tema)}
                        className="p-2 rounded-xl bg-white border border-slate-200 hover:border-slate-400 text-left transition-all cursor-pointer flex items-center gap-2"
                      >
                        <span
                          className="w-4 h-4 rounded-full shrink-0 border border-black/10"
                          style={{ background: preset.tema.botao_estilo || preset.tema.cor_primaria }}
                        />
                        <span className="text-[10px] font-bold text-slate-800 truncate">
                          {preset.nome}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 pt-1 border-t border-slate-200/70">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    Cores da Página & Balões
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { label: 'Cor Principal', campo: 'cor_primaria' },
                      { label: 'Fundo Página', campo: 'cor_fundo' },
                      { label: 'Fundo Painel', campo: 'cor_container' },
                      { label: 'Balão / Card Bot', campo: 'cor_balao_bot' },
                      { label: 'Texto do Bot', campo: 'cor_texto_bot' },
                      { label: 'Balão Cliente', campo: 'cor_balao_usuario' },
                      { label: 'Texto Cliente', campo: 'cor_texto_usuario' },
                      { label: 'Texto Geral', campo: 'cor_texto_geral' },
                    ].map((item) => (
                      <label
                        key={item.campo}
                        className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200/90 cursor-pointer"
                      >
                        <span className="text-[10px] font-bold text-slate-700 truncate">
                          {item.label}
                        </span>
                        <input
                          type="color"
                          value={temaPersonalizado[item.campo] || '#10b981'}
                          onChange={(e) => atualizarCampoTema(item.campo, e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0 shrink-0"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200/70">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">
                      Fonte Tipográfica
                    </label>
                    <select
                      value={temaPersonalizado.fonte || 'Inter, sans-serif'}
                      onChange={(e) => atualizarCampoTema('fonte', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none"
                    >
                      {FONTES_DISPONIVEIS.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">
                      Arredondamento
                    </label>
                    <select
                      value={temaPersonalizado.raio_borda || '24px'}
                      onChange={(e) => atualizarCampoTema('raio_borda', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none"
                    >
                      <option value="10px">Leve (10px)</option>
                      <option value="18px">Médio (18px)</option>
                      <option value="24px">Arredondado (24px)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 bg-slate-100 p-3 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
                    Prévia em Tempo Real
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setModoPreview('chat')}
                      style={modoPreview === 'chat' ? ESTILO_BOTAO_PRATEADO_PRESSIONADO : ESTILO_BOTAO_PRATEADO}
                      className="px-2.5 py-0.5 rounded-full border border-white text-[10px] font-bold text-slate-900 cursor-pointer"
                    >
                      Chat
                    </button>
                    <button
                      type="button"
                      onClick={() => setModoPreview('classico')}
                      style={modoPreview === 'classico' ? ESTILO_BOTAO_PRATEADO_PRESSIONADO : ESTILO_BOTAO_PRATEADO}
                      className="px-2.5 py-0.5 rounded-full border border-white text-[10px] font-bold text-slate-900 cursor-pointer"
                    >
                      Clássico
                    </button>
                  </div>
                </div>

                <div
                  className="p-3 transition-all duration-300 overflow-hidden border relative"
                  style={{
                    background: temaPersonalizado.fundo_estilo || temaPersonalizado.cor_fundo,
                    color: temaPersonalizado.cor_texto_geral,
                    fontFamily: temaPersonalizado.fonte,
                    borderRadius: temaPersonalizado.raio_borda,
                    borderColor: temaPersonalizado.cor_borda,
                  }}
                >
                  <div
                    className="p-3 space-y-3 border relative overflow-hidden"
                    style={{
                      backgroundColor: temaPersonalizado.cor_container,
                      borderRadius: temaPersonalizado.raio_borda,
                      borderColor: temaPersonalizado.cor_borda,
                    }}
                  >
                    <div
                      className="flex items-center justify-between gap-2 pb-2 border-b"
                      style={{ borderColor: temaPersonalizado.cor_borda }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center font-black text-xs shrink-0 ring-2"
                          style={{
                            background: temaPersonalizado.botao_estilo || temaPersonalizado.cor_primaria,
                            color: temaPersonalizado.cor_texto_usuario,
                            borderColor: temaPersonalizado.cor_primaria,
                          }}
                        >
                          {logoUrl ? (
                            <img src={logoUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            (nome || 'B').charAt(0)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black truncate">{nome || 'Minha Barbearia'}</p>
                          <p
                            className="text-[10px] font-semibold truncate"
                            style={{ color: temaPersonalizado.cor_primaria }}
                          >
                            {modoPreview === 'chat' ? 'Assistente Virtual Online' : 'Agendamento Online'}
                          </p>
                        </div>
                      </div>
                      {renderDetalheDecorativo(temaPersonalizado)}
                    </div>

                    {modoPreview === 'chat' ? (
                      <div className="space-y-2">
                        <div
                          className="p-2.5 text-[11px] leading-snug max-w-[88%] border"
                          style={{
                            background: temaPersonalizado.cor_balao_bot,
                            color: temaPersonalizado.cor_texto_bot,
                            borderColor: temaPersonalizado.cor_borda,
                            borderRadius: '14px',
                          }}
                        >
                          Olá! Qual serviço você gostaria de agendar hoje?
                        </div>

                        <button
                          type="button"
                          className="w-full py-2.5 px-3 text-[11px] font-black tracking-wide flex items-center justify-between cursor-default transition-all"
                          style={{
                            background: temaPersonalizado.botao_estilo || temaPersonalizado.cor_primaria,
                            color: temaPersonalizado.cor_texto_usuario,
                            boxShadow: temaPersonalizado.sombra_botao || 'none',
                            borderRadius: '12px',
                          }}
                        >
                          <span>✂ Corte Degradê - R$ 45,00</span>
                          <span>›</span>
                        </button>

                        <button
                          type="button"
                          className="w-full py-2 px-3 text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-between border cursor-default"
                          style={{
                            backgroundColor: temaPersonalizado.cor_card,
                            color: temaPersonalizado.cor_primaria,
                            borderColor: temaPersonalizado.cor_borda,
                            borderRadius: '12px',
                          }}
                        >
                          <span>📅 Confirmar Horário</span>
                          <span>›</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-1.5">
                          <div
                            className="p-2 border text-[10px]"
                            style={{
                              background: temaPersonalizado.cor_balao_bot,
                              color: temaPersonalizado.cor_texto_bot,
                              borderColor: temaPersonalizado.cor_primaria,
                              borderRadius: '12px',
                            }}
                          >
                            <p className="font-bold truncate">Corte Social</p>
                            <p className="font-black mt-0.5" style={{ color: temaPersonalizado.cor_primaria }}>
                              R$ 35,00
                            </p>
                          </div>
                          <div
                            className="p-2 border text-[10px]"
                            style={{
                              background: temaPersonalizado.cor_balao_bot,
                              color: temaPersonalizado.cor_texto_bot,
                              borderColor: temaPersonalizado.cor_borda,
                              borderRadius: '12px',
                            }}
                          >
                            <p className="font-bold truncate">Barba Completa</p>
                            <p className="font-black mt-0.5" style={{ color: temaPersonalizado.cor_primaria }}>
                              R$ 30,00
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="w-full py-2 text-[11px] font-black uppercase tracking-wider cursor-default"
                          style={{
                            background: temaPersonalizado.botao_estilo || temaPersonalizado.cor_primaria,
                            color: temaPersonalizado.cor_texto_usuario,
                            boxShadow: temaPersonalizado.sombra_botao || 'none',
                            borderRadius: '12px',
                          }}
                        >
                          Avançar Agendamento
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= ATENDIMENTO ================= */}
        {secaoAtiva === 'atendimento' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">

              <div className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-200/60 space-y-2 flex flex-col justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Fluxo do Cliente</span>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    onClick={() => setModoAtendimento('conversacional')}
                    style={modoAtendimento === 'conversacional' ? ESTILO_BOTAO_PRATEADO_PRESSIONADO : ESTILO_BOTAO_PRATEADO}
                    className="p-2.5 rounded-2xl border border-white cursor-pointer transition-all flex flex-col items-center text-center gap-1 text-slate-900"
                  >
                    <div className="w-7 h-7 rounded-full bg-white/80 border border-slate-300/80 flex items-center justify-center text-slate-900">
                      <Bot className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <span className="font-bold text-[11px]">Chat</span>
                  </div>

                  <div
                    onClick={() => setModoAtendimento('classico')}
                    style={modoAtendimento === 'classico' ? ESTILO_BOTAO_PRATEADO_PRESSIONADO : ESTILO_BOTAO_PRATEADO}
                    className="p-2.5 rounded-2xl border border-white cursor-pointer transition-all flex flex-col items-center text-center gap-1 text-slate-900"
                  >
                    <div className="w-7 h-7 rounded-full bg-white/80 border border-slate-300/80 flex items-center justify-center text-slate-900">
                      <Grid className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <span className="font-bold text-[11px]">Grade</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-200/60 space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Regras & Exceções</span>

                <div className="space-y-0.5">
                  <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Timer className="w-3 h-3 text-slate-500" /> Antecedência Mínima (min)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={antecedenciaMinima}
                    onChange={(e) => setAntecedenciaMinima(e.target.value)}
                    className="w-full bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                    placeholder="30"
                  />
                </div>

                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={() => setModalHorariosGeraisOpen(true)}
                    style={ESTILO_BOTAO_PRATEADO}
                    className="w-full py-2.5 px-3 border border-white text-slate-900 rounded-2xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                  >
                    <span className="w-6 h-6 rounded-full bg-white/80 border border-slate-300/80 flex items-center justify-center">
                      <CalendarOff className="w-3.5 h-3.5 text-slate-900 stroke-[2.2]" />
                    </span>
                    <span>Gerenciar Feriados & Bloqueios</span>
                  </button>
                </div>
              </div>

            </div>

            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    Mensagem de Confirmação (WhatsApp)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Personalize o texto enviado automaticamente após o agendamento ser confirmado.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setMensagemWhatsapp(TEMPLATE_WHATSAPP_PADRAO)}
                  style={ESTILO_BOTAO_PRATEADO}
                  className="px-3 py-1.5 rounded-full border border-white text-[10px] font-bold text-slate-900 cursor-pointer active:scale-95"
                >
                  Restaurar padrão
                </button>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">
                  Inserir variável no texto
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {VARIAVEIS_WHATSAPP.map((v) => (
                    <button
                      key={v.chave}
                      type="button"
                      onClick={() => inserirVariavelWhatsapp(v.chave)}
                      style={ESTILO_BOTAO_PRATEADO}
                      className="px-2.5 py-1 rounded-full border border-white text-[10px] font-bold text-slate-900 cursor-pointer active:scale-95"
                    >
                      + {v.label} ({v.chave})
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                ref={textareaWhatsappRef}
                rows={7}
                value={mensagemWhatsapp}
                onChange={(e) => setMensagemWhatsapp(e.target.value)}
                placeholder={TEMPLATE_WHATSAPP_PADRAO}
                className="w-full rounded-xl p-3 text-xs leading-relaxed border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
              />

              <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Prévia no WhatsApp
                </span>
                <pre className="text-xs whitespace-pre-wrap font-sans text-slate-800 leading-relaxed">
  {renderizarMensagemConfirmacao(mensagemWhatsapp, {
    cliente: 'Diemerson',
    local: nome || 'Seu Estabelecimento',
    servico: 'Corte Degradê',
    profissional: 'Vidal',
    data: '21/11/2026',
    hora: '15:00',
    valor: 'R$ 45,00',
  })}
</pre>
              </div>
            </div>
          </div>
        )}

        {/* ================= EQUIPE, SERVIÇOS & ESCALA ================= */}
        {secaoAtiva === 'barbeiros_horarios' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="space-y-2.5">
              <div className="flex flex-wrap gap-1.5 pb-0.5">
                {barbeiros.map((b) => {
                  const selecionado = barbeiroSelecionado?.id === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => selecionarBarbeiroParaEditar(b)}
                      style={selecionado ? ESTILO_BOTAO_PRATEADO_PRESSIONADO : ESTILO_BOTAO_PRATEADO}
                      className="px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-900 border border-white transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      <span>{b.nome}</span>
                    </button>
                  );
                })}
              </div>

              {barbeiroSelecionado && (
                <>
                  {/* VÍNCULO DE SERVIÇOS POR PROFISSIONAL */}
                  <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-3 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/70">
                      <div className="flex items-center gap-2">
                        <Scissors className="w-3.5 h-3.5 text-slate-700" />
                        <div>
                          <span className="text-[11px] font-black text-slate-900 block">
                            Serviços executados por {barbeiroSelecionado.nome}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {servicosBarbeiro.length === 0
                              ? 'Nenhum marcado = disponível para todos os serviços'
                              : `${servicosBarbeiro.length} serviço(s) vinculado(s)`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleMarcarTodosServicosBarbeiro}
                          style={ESTILO_BOTAO_PRATEADO}
                          className="px-2.5 py-1 rounded-full border border-white text-[10px] font-bold text-slate-900 cursor-pointer active:scale-95"
                        >
                          Marcar todos
                        </button>
                        <button
                          type="button"
                          onClick={handleLimparServicosBarbeiro}
                          style={ESTILO_BOTAO_PRATEADO}
                          className="px-2.5 py-1 rounded-full border border-white text-[10px] font-bold text-slate-900 cursor-pointer active:scale-95"
                        >
                          Todos (padrão)
                        </button>
                      </div>
                    </div>

                    {servicosBarbearia.length === 0 ? (
                      <p className="text-[11px] text-slate-500 py-1">
                        Nenhum serviço cadastrado nesta barbearia ainda.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {servicosBarbearia.map((srv) => {
                          const marcado = servicosBarbeiro.includes(srv.id);
                          return (
                            <label
                              key={srv.id}
                              className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs cursor-pointer transition-all ${
                                marcado
                                  ? 'bg-slate-900 text-white border-slate-900 font-bold'
                                  : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 font-semibold'
                              }`}
                            >
                              <span className="flex items-center gap-2 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={marcado}
                                  onChange={() => handleToggleServicoBarbeiro(srv.id)}
                                  className="w-3.5 h-3.5 accent-emerald-500 rounded shrink-0"
                                />
                                <span className="truncate">{srv.nome}</span>
                              </span>
                              <span className={`text-[10px] shrink-0 ${marcado ? 'text-slate-300' : 'text-slate-500'}`}>
                                R$ {Number(srv.preco || 0).toFixed(2)}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ESCALA DE HORÁRIOS */}
                  <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-2 space-y-1.5">
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
                              className="w-[240px] sm:w-[250px] snap-center p-2.5 rounded-xl border bg-white border-slate-200 shrink-0 flex flex-col justify-between"
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
                </>
              )}
            </div>
          </div>
        )}

        {/* BOTÃO DE SALVAR */}
        <div className="pt-4 pb-2 flex justify-center border-t border-slate-100 mt-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={salvando}
            style={ESTILO_BOTAO_PRATEADO}
            className="w-56 py-2.5 text-slate-950 font-black text-[11px] uppercase tracking-wider rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border border-white active:scale-95 group"
          >
            <span className="w-6 h-6 rounded-full bg-white/85 border border-slate-300/80 flex items-center justify-center">
              {sucesso ? <Check className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" /> : <Save className="w-3.5 h-3.5 text-slate-950 stroke-[2.2] transition-transform group-hover:scale-110" />}
            </span>
            <span>{salvando ? 'Salvando...' : sucesso ? 'Salvo com Sucesso!' : 'Salvar Alterações'}</span>
          </button>
        </div>

      </div>

      {/* MODAL DE ENQUADRAMENTO ESTILO WHATSAPP */}
      {modalRecorte.aberto && (
        <div
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onPointerMove={handlePointerMoveRecorte}
          onPointerUp={handlePointerUpRecorte}
          onPointerCancel={handlePointerUpRecorte}
        >
          <div className="bg-zinc-900 text-white border border-white/10 rounded-3xl p-5 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-black">
                  {isRecorteLogo ? 'Enquadrar Logo' : 'Enquadrar Capa'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Arraste para centralizar e ajuste o zoom como no WhatsApp.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalRecorte((prev) => ({ ...prev, aberto: false, src: '' }))}
                style={ESTILO_BOTAO_PRATEADO}
                className="w-8 h-8 rounded-full border border-white text-slate-900 flex items-center justify-center cursor-pointer active:scale-95"
              >
                <X className="w-4 h-4 stroke-[2.2]" />
              </button>
            </div>

            <div className="flex items-center justify-center py-2">
              <div
                ref={caixaRecorteRef}
                onPointerDown={handlePointerDownRecorte}
                className={`relative overflow-hidden bg-zinc-950 border-2 border-slate-300/80 touch-none select-none flex items-center justify-center ${
                  arrastando ? 'cursor-grabbing' : 'cursor-grab'
                } ${
                  isRecorteLogo
                    ? 'w-56 h-56 rounded-full'
                    : 'w-full h-44 rounded-2xl'
                }`}
              >
                <img
                  src={modalRecorte.src}
                  alt="Prévia de enquadramento"
                  draggable={false}
                  className="max-w-none pointer-events-none shrink-0"
                  style={{
                    width: `${dimensoesVisuais.width}px`,
                    height: `${dimensoesVisuais.height}px`,
                    transform: `translate(${modalRecorte.posX}px, ${modalRecorte.posY}px)`,
                  }}
                />
                {!isRecorteLogo && (
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-30">
                    <div className="border-r border-b border-white/40" />
                    <div className="border-r border-b border-white/40" />
                    <div className="border-b border-white/40" />
                    <div className="border-r border-b border-white/40" />
                    <div className="border-r border-b border-white/40" />
                    <div className="border-b border-white/40" />
                    <div className="border-r border-white/40" />
                    <div className="border-r border-white/40" />
                    <div />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 bg-white/5 p-3 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between text-[11px] text-slate-300 font-bold">
                <span className="flex items-center gap-1.5">
                  <ZoomIn className="w-3.5 h-3.5 text-slate-200" />
                  Zoom: {Math.round(modalRecorte.zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setModalRecorte((prev) => ({ ...prev, zoom: 1, posX: 0, posY: 0 }))}
                  className="text-[10px] text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Centralizar
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalRecorte((prev) => ({ ...prev, zoom: Math.max(1, Number((prev.zoom - 0.1).toFixed(2))) }))}
                  style={ESTILO_BOTAO_PRATEADO}
                  className="w-8 h-8 rounded-full border border-white text-slate-900 flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
                >
                  <ZoomOut className="w-3.5 h-3.5 stroke-[2.2]" />
                </button>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={modalRecorte.zoom}
                  onChange={(e) => setModalRecorte((prev) => ({ ...prev, zoom: Number(e.target.value) }))}
                  className="w-full accent-slate-200 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => setModalRecorte((prev) => ({ ...prev, zoom: Math.min(3, Number((prev.zoom + 0.1).toFixed(2))) }))}
                  style={ESTILO_BOTAO_PRATEADO}
                  className="w-8 h-8 rounded-full border border-white text-slate-900 flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
                >
                  <ZoomIn className="w-3.5 h-3.5 stroke-[2.2]" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setModalRecorte((prev) => ({ ...prev, aberto: false, src: '' }))}
                className="py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEnquadramentoEEnviar}
                disabled={enviandoLogo || enviandoCapa}
                style={ESTILO_BOTAO_PRATEADO}
                className="py-2.5 rounded-full border border-white text-slate-950 text-xs font-black cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {enviandoLogo || enviandoCapa ? 'Enviando...' : 'Aplicar e Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE COMPARTILHAMENTO */}
      {modalCompartilharOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 space-y-4 relative">
            <button
              onClick={() => setModalCompartilharOpen(false)}
              style={ESTILO_BOTAO_PRATEADO}
              className="w-8 h-8 rounded-full border border-white text-slate-900 flex items-center justify-center absolute top-4 right-4 cursor-pointer active:scale-95"
            >
              <X className="w-4 h-4 stroke-[2.2]" />
            </button>
            <h3 className="text-sm font-black text-slate-900">Compartilhar Link de Agendamento</h3>
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
              <input type="text" readOnly value={urlCliente} className="w-full bg-transparent text-xs truncate outline-none font-semibold text-slate-700 px-1" />
              <button
                onClick={handleCopiarLink}
                style={ESTILO_BOTAO_PRATEADO}
                className="px-4 py-1.5 border border-white text-slate-950 rounded-full text-xs font-bold cursor-pointer shrink-0 active:scale-95"
              >
                {copiado ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={handleCompartilharWhatsApp}
                style={ESTILO_BOTAO_PRATEADO}
                className="p-3 border border-white text-slate-900 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <MessageSquare className="w-4 h-4 stroke-[2.2]" /> WhatsApp
              </button>
              <button
                onClick={handleCompartilharTelegram}
                style={ESTILO_BOTAO_PRATEADO}
                className="p-3 border border-white text-slate-900 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Send className="w-4 h-4 stroke-[2.2]" /> Telegram
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE HORÁRIOS GERAIS E BLOQUEIOS */}
      {modalHorariosGeraisOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Bloqueios & Feriados</h3>
              <button
                onClick={() => setModalHorariosGeraisOpen(false)}
                style={ESTILO_BOTAO_PRATEADO}
                className="w-8 h-8 rounded-full border border-white text-slate-900 flex items-center justify-center cursor-pointer active:scale-95"
              >
                <X className="w-4 h-4 stroke-[2.2]" />
              </button>
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
                  style={permiteAgendamentos ? ESTILO_BOTAO_PRATEADO : ESTILO_BOTAO_PRATEADO_PRESSIONADO}
                  className="px-4 py-1.5 rounded-full border border-white text-xs font-bold text-slate-900 cursor-pointer active:scale-95"
                >
                  {permiteAgendamentos ? 'Ativo' : 'Pausado'}
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-xs text-slate-900">Adicionar Data Bloqueada / Folga</h4>
                <div className="space-y-2">
                  <select
                    id="select-barbeiro-bloqueio"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                  >
                    <option value="">Bloquear para Toda a Barbearia (Geral)</option>
                    {barbeiros.map(b => (
                      <option key={b.id} value={b.id}>Apenas para o profissional: {b.nome}</option>
                    ))}
                  </select>
                  <input type="date" value={novaDataBloqueio} onChange={(e) => setNovaDataBloqueio(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900" />
                  <input type="text" placeholder="Motivo (Ex: Folga / Particular)" value={novoMotivoBloqueio} onChange={(e) => setNovoMotivoBloqueio(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900" />
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (!novaDataBloqueio) return;
                    const barbIdSelect = document.getElementById('select-barbeiro-bloqueio').value || null;
                    try {
                      const { data, error } = await supabase
                        .from('bloqueios_agenda')
                        .insert([{
                          barbearia_id: barbearia.id,
                          barbeiro_id: barbIdSelect,
                          data_bloqueio: novaDataBloqueio,
                          motivo: novoMotivoBloqueio || 'Folga / Indisponível'
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
                  }}
                  style={ESTILO_BOTAO_PRATEADO}
                  className="w-full py-2.5 border border-white text-slate-950 rounded-full text-xs font-black cursor-pointer mt-1 active:scale-[0.99]"
                >
                  Adicionar Bloqueio
                </button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {listaBloqueios.map(b => {
                  const barbEncontrado = barbeiros.find(x => String(x.id) === String(b.barbeiro_id));
                  return (
                    <div key={b.id} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-xs font-semibold">
                      <div>
                        <span>{b.data_bloqueio} - {b.motivo}</span>
                        <span className="block text-[9px] text-slate-500">
                          {barbEncontrado ? `Profissional: ${barbEncontrado.nome}` : 'Geral (Toda a barbearia)'}
                        </span>
                      </div>
                      <button type="button" onClick={() => handleRemoverBloqueio(b.id)} className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setModalHorariosGeraisOpen(false)}
              style={ESTILO_BOTAO_PRATEADO}
              className="w-full py-3 border border-white text-slate-950 rounded-full text-xs font-black cursor-pointer active:scale-[0.99]"
            >
              Concluir
            </button>
          </div>
        </div>
      )}

    </div>
  );
}