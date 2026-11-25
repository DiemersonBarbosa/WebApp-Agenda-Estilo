'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Wallet,
  TrendingUp,
  LogOut,
  Filter,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

function formatBRL(value) {
  let num = value;

  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d,-]/g, '').replace(',', '.');
    num = Number(cleaned);
  } else {
    num = Number(value);
  }

  if (!Number.isFinite(num)) {
    return 'R$ 0,00';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export default function PainelBarbeiro() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [fechamentosPagos, setFechamentosPagos] = useState([]);
  const [comissaoPercentual, setComissaoPercentual] = useState(50);
  const [nomeBarbeiro, setNomeBarbeiro] = useState('');
  const [barbeiroId, setBarbeiroId] = useState(null);
  const [fotoBarbeiro, setFotoBarbeiro] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [processandoId, setProcessandoId] = useState(null);
  const [atualizandoDados, setAtualizandoDados] = useState(false);

  const [abaAtiva, setAbaAtiva] = useState('dia');
  const [modalLogoutOpen, setModalLogoutOpen] = useState(false);

  const [modalFeedback, setModalFeedback] = useState({
    isOpen: false,
    tipo: 'sucesso',
    titulo: '',
    mensagem: '',
  });

  const perfilRef = useRef({ id: null, nome: '' });
  const sincronizandoRef = useRef(false);
  const pendenteNovaSincronizacaoRef = useRef(false);

  const obterDataLocalIso = (d = new Date()) => {
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  const [dataSelecionada, setDataSelecionada] = useState(obterDataLocalIso());

  const [mesSelecionado, setMesSelecionado] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  });

  const [dataEspecificaHistorico, setDataEspecificaHistorico] = useState('');

  const extrairDataIso = useCallback((item) => {
    const dataStr = item?.data_hora || item?.data || item?.created_at || '';
    if (!dataStr) return '';
    try {
      const d = new Date(dataStr);
      if (Number.isNaN(d.getTime())) return String(dataStr).substring(0, 10);
      return obterDataLocalIso(d);
    } catch {
      return String(dataStr).substring(0, 10);
    }
  }, []);

  const normalizarComissao = useCallback((perfil) => {
    const bruta = perfil?.taxa_comissao ?? perfil?.comissao ?? perfil?.comissao_padrao ?? 50;
    const numero = Number(bruta);
    if (Number.isNaN(numero)) return 50;
    return numero > 0 && numero <= 1 ? numero * 100 : numero;
  }, []);

  const isStatusConcluido = useCallback((statusRaw) => {
    const s = String(statusRaw || '').trim().toLowerCase();
    return s.includes('concluid') || s.includes('concluí') || s.includes('realiz') || s.includes('finaliz');
  }, []);

  const isStatusPendente = useCallback((statusRaw) => {
    const s = String(statusRaw || 'agendado').trim().toLowerCase();
    return (
      !s.includes('concluid') &&
      !s.includes('concluí') &&
      !s.includes('realiz') &&
      !s.includes('finaliz') &&
      !s.includes('cancel')
    );
  }, []);

  const obterValorAtendimento = useCallback((item) => {
    const bruto =
      item?.valor_total ??
      item?.preco ??
      item?.valor ??
      item?.total ??
      item?.servicos?.preco ??
      item?.servico?.preco ??
      0;

    if (typeof bruto === 'number') {
      return Number.isNaN(bruto) ? 0 : bruto;
    }

    const normalizado = String(bruto)
      .replace('R$', '')
      .trim()
      .replace(/\s+/g, '')
      .replace(',', '.');

    const num = Number(normalizado);
    return Number.isNaN(num) ? 0 : num;
  }, []);

  const obterValorFechamento = useCallback((fechamento) => {
    const bruto =
      fechamento?.valor_comissao ??
      fechamento?.comissao_valor ??
      fechamento?.valor_total ??
      fechamento?.valor ??
      0;
    const num = Number(bruto);
    return Number.isNaN(num) ? 0 : num;
  }, []);

  const carregarPainelDoBarbeiro = useCallback(async ({ silencioso = false } = {}) => {
    if (sincronizandoRef.current) {
      pendenteNovaSincronizacaoRef.current = true;
      return;
    }

    sincronizandoRef.current = true;

    if (!silencioso) {
      setLoading(true);
    } else {
      setAtualizandoDados(true);
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        setAtualizandoDados(false);
        return;
      }

      const { data: perfilBarbeiro, error: perfilError } = await supabase
        .from('barbeiros')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (perfilError || !perfilBarbeiro) {
        setLoading(false);
        setAtualizandoDados(false);
        return;
      }

      perfilRef.current = {
        id: perfilBarbeiro.id,
        nome: (perfilBarbeiro.nome || '').trim(),
      };

      setBarbeiroId(perfilBarbeiro.id);
      setNomeBarbeiro(perfilBarbeiro.nome || '');
      setFotoBarbeiro(perfilBarbeiro.foto || perfilBarbeiro.avatar || perfilBarbeiro.imagem || '');
      setComissaoPercentual(normalizarComissao(perfilBarbeiro));

      let resultadosTotais = [];

      const { data: porId } = await supabase
        .from('agendamentos')
        .select(`
          *,
          clientes (nome),
          servicos (nome, preco),
          cliente:clientes(nome),
          servico:servicos(nome)
        `)
        .eq('barbeiro_id', perfilBarbeiro.id);

      if (Array.isArray(porId)) {
        resultadosTotais = [...porId];
      }

      if (perfilBarbeiro.nome) {
        const { data: porNome } = await supabase
          .from('agendamentos')
          .select(`
            *,
            clientes (nome),
            servicos (nome, preco),
            cliente:clientes(nome),
            servico:servicos(nome)
          `)
          .eq('barbeiro', perfilBarbeiro.nome);

        if (Array.isArray(porNome)) {
          const mapaIds = new Map();
          [...resultadosTotais, ...porNome].forEach((item) => {
            if (item && item.id !== undefined && item.id !== null) {
              mapaIds.set(String(item.id), item);
            }
          });
          resultadosTotais = Array.from(mapaIds.values());
        }
      }

      resultadosTotais.sort((a, b) => {
        const dataA = new Date(a.data_hora || a.data || a.created_at || 0);
        const dataB = new Date(b.data_hora || b.data || b.created_at || 0);
        return dataA - dataB;
      });

      const { data: fechamentosData, error: fechError } = await supabase
        .from('fechamentos_comissoes')
        .select('*')
        .eq('barbeiro_id', perfilBarbeiro.id)
        .eq('status', 'pago')
        .order('created_at', { ascending: false });

      if (!fechError && Array.isArray(fechamentosData)) {
        setFechamentosPagos(fechamentosData);
      } else {
        setFechamentosPagos([]);
      }

      setAgendamentos(resultadosTotais);
    } catch (err) {
      console.error('Erro ao carregar painel:', err);
    } finally {
      sincronizandoRef.current = false;
      setLoading(false);
      setAtualizandoDados(false);

      if (pendenteNovaSincronizacaoRef.current) {
        pendenteNovaSincronizacaoRef.current = false;
        carregarPainelDoBarbeiro({ silencioso: true });
      }
    }
  }, [normalizarComissao]);

  useEffect(() => {
    let ativo = true;
    let canalRealtime = null;

    const iniciar = async () => {
      await carregarPainelDoBarbeiro();
      if (!ativo) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !ativo) return;

      const { data: perfilBarbeiro } = await supabase
        .from('barbeiros')
        .select('id, nome')
        .eq('user_id', user.id)
        .single();

      if (!perfilBarbeiro || !ativo) return;

      perfilRef.current = {
        id: perfilBarbeiro.id,
        nome: (perfilBarbeiro.nome || '').trim(),
      };

      const nomeCanalUnico = `realtime-painel-barbeiro-${perfilBarbeiro.id}`;

      canalRealtime = supabase
        .channel(nomeCanalUnico)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'agendamentos' },
          (payload) => {
            if (!ativo) return;
            const registro = payload.new || payload.old || {};
            const meuId = String(perfilRef.current.id || '');
            const meuNome = (perfilRef.current.nome || '').toLowerCase();

            const idDoRegistro = String(registro.barbeiro_id || registro.profissional_id || '');
            const nomeDoRegistro = String(
              registro.barbeiro || registro.barbeiro_nome || registro.profissional_nome || ''
            )
              .trim()
              .toLowerCase();

            const pertenceAoBarbeiro =
              (meuId && idDoRegistro === meuId) ||
              (meuNome && nomeDoRegistro === meuNome) ||
              payload.eventType === 'DELETE';

            if (pertenceAoBarbeiro) {
              carregarPainelDoBarbeiro({ silencioso: true });
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'fechamentos_comissoes' },
          (payload) => {
            if (!ativo) return;
            const registro = payload.new || payload.old || {};
            const meuId = String(perfilRef.current.id || '');
            const idDoFechamento = String(registro.barbeiro_id || '');

            if (!idDoFechamento || (meuId && idDoFechamento === meuId) || payload.eventType === 'DELETE') {
              carregarPainelDoBarbeiro({ silencioso: true });
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'barbeiros',
            filter: `id=eq.${perfilBarbeiro.id}`,
          },
          (payload) => {
            if (!ativo || !payload?.new) return;
            perfilRef.current = {
              id: payload.new.id,
              nome: (payload.new.nome || '').trim(),
            };
            setComissaoPercentual(normalizarComissao(payload.new));
            if (payload.new.foto) setFotoBarbeiro(payload.new.foto);
            if (payload.new.nome) setNomeBarbeiro(payload.new.nome);
            carregarPainelDoBarbeiro({ silencioso: true });
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setTimeout(() => {
              if (ativo) carregarPainelDoBarbeiro({ silencioso: true });
            }, 1500);
          }
        });
    };

    iniciar();

    const handleVisibilidade = () => {
      if (document.visibilityState === 'visible' && ativo) {
        carregarPainelDoBarbeiro({ silencioso: true });
      }
    };

    const handleFoco = () => {
      if (ativo) {
        carregarPainelDoBarbeiro({ silencioso: true });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilidade);
    window.addEventListener('focus', handleFoco);

    return () => {
      ativo = false;
      document.removeEventListener('visibilitychange', handleVisibilidade);
      window.removeEventListener('focus', handleFoco);
      if (canalRealtime) {
        supabase.removeChannel(canalRealtime);
      }
    };
  }, [carregarPainelDoBarbeiro, normalizarComissao]);

  const handleAlterarFoto = async (e) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo || !barbeiroId) return;

    setUploadingFoto(true);
    try {
      const fileExt = arquivo.name.split('.').pop();
      const fileName = `barbeiro-${barbeiroId}-${Math.random()}.${fileExt}`;
      const filePath = `barbeiros/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('barbearia-bucket')
        .upload(filePath, arquivo);

      if (uploadError) throw uploadError;

      const { data: publicURLData } = supabase.storage
        .from('barbearia-bucket')
        .getPublicUrl(filePath);

      const novaFotoUrl = publicURLData.publicUrl;

      const { error: updateError } = await supabase
        .from('barbeiros')
        .update({ foto: novaFotoUrl })
        .eq('id', barbeiroId);

      if (updateError) throw updateError;

      setFotoBarbeiro(novaFotoUrl);
      setModalFeedback({
        isOpen: true,
        tipo: 'sucesso',
        titulo: 'Foto Atualizada',
        mensagem: 'Sua foto de perfil foi atualizada com sucesso.'
      });
    } catch (err) {
      console.error('Erro no upload:', err);
      setModalFeedback({
        isOpen: true,
        tipo: 'erro',
        titulo: 'Erro no Envio',
        mensagem: 'Não foi possível atualizar a foto de perfil. Tente novamente.'
      });
    } finally {
      setUploadingFoto(false);
    }
  };

  const alterarStatusAgendamento = async (id, novoStatus) => {
    setProcessandoId(id);

    setAgendamentos((prev) =>
      prev.map((item) => (String(item.id) === String(id) ? { ...item, status: novoStatus } : item))
    );

    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ status: novoStatus })
        .eq('id', id);

      if (error) throw error;
      await carregarPainelDoBarbeiro({ silencioso: true });
    } catch (err) {
      await carregarPainelDoBarbeiro({ silencioso: true });
      setModalFeedback({
        isOpen: true,
        tipo: 'erro',
        titulo: 'Erro ao Atualizar',
        mensagem: err.message || 'Não foi possível atualizar o status do agendamento.'
      });
    } finally {
      setProcessandoId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/admin/login';
    } catch (err) {
      console.error('Erro ao sair:', err);
      window.location.href = '/admin/login';
    }
  };

  const gerarProximosDias = () => {
    const dias = [];
    const hoje = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(hoje);
      d.setDate(hoje.getDate() + i);
      const iso = obterDataLocalIso(d);
      const nomeDia = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
      const numeroDia = d.getDate();
      const nomeMes = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      dias.push({ iso, nomeDia, numeroDia, nomeMes });
    }
    return dias;
  };

  const proximaSemanaDias = gerarProximosDias();

  const atendimentosConcluidosEmAberto = useMemo(() => {
    const concluidosOrdenados = agendamentos
      .filter((item) => isStatusConcluido(item.status))
      .sort(
        (a, b) =>
          new Date(a.data_hora || a.data || a.created_at || 0) -
          new Date(b.data_hora || b.data || b.created_at || 0)
      );

    const idsQuitados = new Set();
    const fechamentosSemIds = [];

    (fechamentosPagos || []).forEach((f) => {
      if (Array.isArray(f.atendimentos_ids) && f.atendimentos_ids.length > 0) {
        f.atendimentos_ids.forEach((id) => idsQuitados.add(String(id)));
      } else {
        fechamentosSemIds.push(f);
      }
    });

    let restantes = concluidosOrdenados.filter((ag) => !idsQuitados.has(String(ag.id)));

    fechamentosSemIds.forEach((f) => {
      const qtd = Number(f.qtd_atendimentos || 0);
      if (qtd <= 0) return;

      const dataFechamento = new Date(f.created_at || 0);
      const elegiveisCorte = restantes.filter((ag) => {
        const dataAg = new Date(ag.data_hora || ag.data || ag.created_at || 0);
        return !Number.isNaN(dataFechamento.getTime()) ? dataAg <= dataFechamento : true;
      });

      const idsCortados = new Set(elegiveisCorte.slice(0, qtd).map((ag) => String(ag.id)));
      restantes = restantes.filter((ag) => !idsCortados.has(String(ag.id)));
    });

    return restantes;
  }, [agendamentos, fechamentosPagos, isStatusConcluido]);

  const idsConcluidosEmAberto = useMemo(() => {
    return new Set(atendimentosConcluidosEmAberto.map((ag) => String(ag.id)));
  }, [atendimentosConcluidosEmAberto]);

  const totalJaRecebidoMes = useMemo(() => {
    return (fechamentosPagos || [])
      .filter((f) => {
        const dataRef = String(f.data_pagamento || f.periodo_referencia || f.data || f.created_at || '');
        if (dataEspecificaHistorico) {
          return extrairDataIso({ ...f, data: dataRef }) === dataEspecificaHistorico;
        }
        return dataRef.startsWith(mesSelecionado);
      })
      .reduce((acc, f) => acc + obterValorFechamento(f), 0);
  }, [fechamentosPagos, mesSelecionado, dataEspecificaHistorico, extrairDataIso, obterValorFechamento]);

  const agendamentosDoDiaPendentes = agendamentos.filter((item) => {
    const dataMatch = extrairDataIso(item) === dataSelecionada;
    return dataMatch && isStatusPendente(item.status);
  });

  const agendamentosConcluidosNoDia = agendamentos.filter((item) => {
    const dataMatch = extrairDataIso(item) === dataSelecionada;
    return dataMatch && isStatusConcluido(item.status);
  });

  const agendamentosConcluidosDiaEmAberto = agendamentosConcluidosNoDia.filter((item) =>
    idsConcluidosEmAberto.has(String(item.id))
  );

  const totalFaturadoDiaEmAberto = agendamentosConcluidosDiaEmAberto.reduce(
    (acc, item) => acc + obterValorAtendimento(item),
    0
  );

  const comissaoDia = totalFaturadoDiaEmAberto * (comissaoPercentual / 100);

  const agendamentosFiltradosHistorico = useMemo(() => {
    return agendamentos
      .filter((item) => {
        const isoItem = extrairDataIso(item);
        if (!isoItem) return false;

        if (dataEspecificaHistorico) {
          return isoItem === dataEspecificaHistorico;
        }

        return isoItem.substring(0, 7) === mesSelecionado;
      })
      .sort((a, b) => {
        const dataA = new Date(a.data_hora || a.data || a.created_at || 0).getTime();
        const dataB = new Date(b.data_hora || b.data || b.created_at || 0).getTime();
        return dataB - dataA;
      });
  }, [agendamentos, dataEspecificaHistorico, extrairDataIso, mesSelecionado]);

  const totalFaturadoHistoricoEmAberto = agendamentosFiltradosHistorico
    .filter((item) => isStatusConcluido(item.status) && idsConcluidosEmAberto.has(String(item.id)))
    .reduce((acc, item) => acc + obterValorAtendimento(item), 0);

  const comissaoHistorico = totalFaturadoHistoricoEmAberto * (comissaoPercentual / 100);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 text-stone-400 text-xs font-medium gap-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
        <span>Carregando painel do barbeiro...</span>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto min-h-screen flex flex-col p-3.5 sm:p-5 bg-stone-50 font-sans pb-24 gap-3.5 relative">

      {/* 1. CABEÇALHO DO PERFIL */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-4 shrink-0">
        <div className="flex justify-between items-center gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <label className="relative cursor-pointer group shrink-0" title="Clique para alterar foto">
              {fotoBarbeiro ? (
                <img
                  src={fotoBarbeiro}
                  alt={nomeBarbeiro}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-stone-200 shadow-xs group-hover:opacity-75 transition-opacity"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-stone-900 text-white font-black flex items-center justify-center text-lg shadow-xs group-hover:opacity-75 transition-opacity">
                  {(nomeBarbeiro || 'P').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[9px] font-bold uppercase tracking-wider">
                Foto
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleAlterarFoto}
                disabled={uploadingFoto}
                className="hidden"
              />
            </label>

            <div className="min-w-0">
              <span className="text-[9px] font-black text-stone-400 uppercase tracking-wider block">Painel do Profissional</span>
              <h2 className="text-base sm:text-lg font-black text-stone-900 leading-tight truncate">
                Olá, {nomeBarbeiro || 'Barbeiro'}
              </h2>
              {uploadingFoto && <span className="text-[10px] text-amber-600 font-bold block">Enviando foto...</span>}
              {atualizandoDados && !uploadingFoto && (
                <span className="text-[10px] text-emerald-600 font-semibold block">Sincronizando em tempo real...</span>
              )}
            </div>
          </div>

          <span className="bg-stone-100 text-stone-800 text-[10px] font-black px-3 py-1.5 rounded-2xl border border-stone-200/80 shrink-0">
            {comissaoPercentual}% Comissão
          </span>
        </div>

        {/* CARDS DE GANHOS: DIA E MÊS */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${abaAtiva === 'dia' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-stone-50 border-stone-200/60'}`}>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Wallet className={`w-3.5 h-3.5 ${abaAtiva === 'dia' ? 'text-emerald-700' : 'text-stone-500'}`} />
                <span className={`text-[10px] font-black uppercase tracking-wider ${abaAtiva === 'dia' ? 'text-emerald-800' : 'text-stone-500'}`}>
                  A Receber (Dia)
                </span>
              </div>
              <span className={`text-base sm:text-lg font-black block ${abaAtiva === 'dia' ? 'text-emerald-700' : 'text-stone-800'}`}>
                {formatBRL(comissaoDia)}
              </span>
              <span className="text-[9px] text-stone-400 font-bold block">Em aberto: {formatBRL(totalFaturadoDiaEmAberto)}</span>
            </div>

            <div className="mt-2.5 pt-2 border-t border-stone-200/70 flex items-center justify-between gap-2 text-[9px]">
              <span className="text-stone-400 font-semibold shrink-0">Serviços dia</span>
              <span className="font-black text-stone-700 whitespace-nowrap">
                {agendamentosConcluidosNoDia.length} concluído{agendamentosConcluidosNoDia.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          <div className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${abaAtiva === 'mes' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-stone-50 border-stone-200/60'}`}>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className={`w-3.5 h-3.5 ${abaAtiva === 'mes' ? 'text-emerald-700' : 'text-stone-500'}`} />
                <span className={`text-[10px] font-black uppercase tracking-wider ${abaAtiva === 'mes' ? 'text-emerald-800' : 'text-stone-500'}`}>
                  {dataEspecificaHistorico ? 'A Receber (Data)' : 'A Receber (Mês)'}
                </span>
              </div>
              <span className={`text-base sm:text-lg font-black block ${abaAtiva === 'mes' ? 'text-emerald-700' : 'text-stone-800'}`}>
                {formatBRL(comissaoHistorico)}
              </span>
              <span className="text-[9px] text-stone-400 font-bold block">Em aberto: {formatBRL(totalFaturadoHistoricoEmAberto)}</span>
            </div>

            <div className="mt-2.5 pt-2 border-t border-stone-200/70 flex items-center justify-between gap-2 text-[9px]">
              <span className="text-stone-500 font-bold shrink-0">
                {dataEspecificaHistorico ? 'Recebido (Data)' : 'Recebido (Mês)'}
              </span>
              <span className="font-black text-emerald-700 whitespace-nowrap">
                {formatBRL(totalJaRecebidoMes)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CONTEÚDO DA ABA 1: AGENDA DO DIA */}
      {abaAtiva === 'dia' && (
        <div className="space-y-3.5">

          {/* MINI CALENDÁRIO DIÁRIO */}
          <div className="bg-white rounded-3xl p-3.5 pt-4 border border-stone-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">Próximos Dias</span>
              <button
                type="button"
                onClick={async () => {
                  await carregarPainelDoBarbeiro({ silencioso: true });
                  if (typeof window !== 'undefined') {
                    window.location.reload();
                  }
                }}
                disabled={atualizandoDados}
                className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-stone-900 bg-stone-100 hover:bg-stone-200 px-3 py-1 rounded-full border border-stone-200 transition-all cursor-pointer active:scale-95 disabled:opacity-60"
                title="Atualizar página e dados"
              >
                <RefreshCw className={`w-3 h-3 ${atualizandoDados ? 'animate-spin' : ''}`} />
                <span>{atualizandoDados ? 'Atualizando...' : 'Atualizar'}</span>
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 pt-1 pb-1">
              {proximaSemanaDias.map((dia) => {
                const selecionado = dataSelecionada === dia.iso;

                const qtdPendentesNoDia = agendamentos.filter((item) => {
                  const dataItem = extrairDataIso(item);
                  return dataItem === dia.iso && isStatusPendente(item.status);
                }).length;

                return (
                  <button
                    key={dia.iso}
                    type="button"
                    onClick={() => setDataSelecionada(dia.iso)}
                    className={`flex flex-col items-center justify-center py-2 px-0.5 rounded-2xl transition-all cursor-pointer relative ${
                      selecionado
                        ? 'bg-stone-900 text-white shadow-md scale-105 border border-stone-900'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200/70'
                    }`}
                  >
                    <span className={`text-[8px] uppercase font-bold tracking-wider ${selecionado ? 'text-stone-300' : 'text-stone-400'}`}>
                      {dia.nomeDia}
                    </span>
                    <span className="text-xs sm:text-sm font-black my-0.5">
                      {dia.numeroDia}
                    </span>
                    <span className={`text-[8px] uppercase font-semibold ${selecionado ? 'text-stone-400' : 'text-stone-500'}`}>
                      {dia.nomeMes}
                    </span>

                    {qtdPendentesNoDia > 0 && (
                      <span className={`absolute -top-1.5 -right-1 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center shadow-xs ${
                        selecionado ? 'bg-emerald-400 text-stone-950' : 'bg-stone-900 text-white'
                      }`}>
                        {qtdPendentesNoDia}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* LISTA DE PENDENTES DO DIA SELECIONADO */}
          <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs p-4 sm:p-5 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <h3 className="text-xs font-black text-stone-900 uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span>Pendentes • {new Date(dataSelecionada + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
              </h3>
              <span className="text-[10px] font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
                {agendamentosDoDiaPendentes.length} na fila
              </span>
            </div>

            {agendamentosDoDiaPendentes.length === 0 ? (
              <div className="py-12 text-center text-stone-400 text-xs font-medium">
                Nenhum agendamento pendente para esta data.
              </div>
            ) : (
              <div className="space-y-3">
                {agendamentosDoDiaPendentes.map((item) => {
                  const cliente = item.cliente_nome || item.cliente?.nome || item.clientes?.nome || item.nome_cliente || item.cliente || 'Cliente';
                  const servico = item.servico_nome || item.servico?.nome || item.servicos?.nome || item.nome_servico || item.servico || 'Serviço';
                  const valor = obterValorAtendimento(item);

                  let horaFormatada = '--:--';
                  const rawData = item.data_hora || item.data || item.created_at;
                  if (rawData) {
                    try {
                      const dataObj = new Date(rawData);
                      horaFormatada = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    } catch {
                      horaFormatada = '';
                    }
                  }

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl border border-stone-200/90 bg-white shadow-xs space-y-3"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-0.5">
                          <span className="text-xs font-black text-stone-900 block">{cliente}</span>
                          <span className="text-xs font-bold text-stone-600 block">{servico}</span>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-stone-900 block">{formatBRL(valor)}</span>
                          <span className="text-[11px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-lg border border-stone-200 inline-block mt-0.5">
                            {horaFormatada}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                        <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider bg-amber-100 text-amber-800">
                          {item.status || 'AGENDADO'}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => alterarStatusAgendamento(item.id, 'concluido')}
                            disabled={processandoId === item.id}
                            className="py-1.5 px-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Concluir</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => alterarStatusAgendamento(item.id, 'cancelado')}
                            disabled={processandoId === item.id}
                            className="py-1.5 px-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer border border-stone-200 active:scale-95 disabled:opacity-50"
                          >
                            <XCircle className="w-3 h-3 text-stone-400" />
                            <span>Cancelar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* 3. CONTEÚDO DA ABA 2: HISTÓRICO */}
      {abaAtiva === 'mes' && (
        <div className="space-y-3.5">

          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-stone-500" />
                <span className="text-xs font-black text-stone-900 uppercase tracking-wider">Filtros do Histórico</span>
              </div>

              <button
                type="button"
                onClick={() => carregarPainelDoBarbeiro({ silencioso: true })}
                className="p-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 rounded-xl transition-colors active:scale-95 cursor-pointer shadow-xs"
                title="Atualizar dados"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${atualizandoDados ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-stone-400 block">Mês Completo</label>
                <input
                  type="month"
                  value={mesSelecionado}
                  onChange={(e) => {
                    setMesSelecionado(e.target.value);
                    setDataEspecificaHistorico('');
                  }}
                  className="w-full bg-stone-50 border border-stone-200 text-stone-900 text-xs font-bold px-3 py-2 rounded-2xl focus:outline-none cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-extrabold uppercase text-stone-400 block">Dia Específico</label>
                  {dataEspecificaHistorico && (
                    <button
                      type="button"
                      onClick={() => setDataEspecificaHistorico('')}
                      className="text-[9px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" /> Limpar dia
                    </button>
                  )}
                </div>
                <input
                  type="date"
                  value={dataEspecificaHistorico}
                  onChange={(e) => setDataEspecificaHistorico(e.target.value)}
                  className={`w-full border text-xs font-bold px-3 py-2 rounded-2xl focus:outline-none cursor-pointer transition-colors ${
                    dataEspecificaHistorico
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-stone-50 border-stone-200 text-stone-900'
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs p-4 sm:p-5 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <h3 className="text-xs font-black text-stone-900 uppercase tracking-wide">
                {dataEspecificaHistorico
                  ? `Registros do dia ${dataEspecificaHistorico.split('-').reverse().join('/')}`
                  : 'Todos os Registros do Mês'}
              </h3>
              <span className="text-xs text-stone-400 font-bold">{agendamentosFiltradosHistorico.length} encontrados</span>
            </div>

            {agendamentosFiltradosHistorico.length === 0 ? (
              <div className="py-12 text-center text-stone-400 text-xs font-medium">
                Nenhum agendamento encontrado para este filtro.
              </div>
            ) : (
              <div className="space-y-2.5">
                {agendamentosFiltradosHistorico.map((item) => {
                  const cliente = item.cliente_nome || item.cliente?.nome || item.clientes?.nome || item.nome_cliente || item.cliente || 'Cliente';
                  const servico = item.servico_nome || item.servico?.nome || item.servicos?.nome || item.nome_servico || item.servico || 'Serviço';
                  const valor = obterValorAtendimento(item);
                  const status = (item.status || 'AGENDADO').toUpperCase();

                  let dataFmt = '';
                  const rawData = item.data_hora || item.data || item.created_at;
                  if (rawData) {
                    try {
                      const dataObj = new Date(rawData);
                      dataFmt =
                        dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) +
                        ' às ' +
                        dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    } catch {
                      dataFmt = rawData;
                    }
                  }

                  const concluido = isStatusConcluido(item.status);
                  const jaPagoNoFechamento = concluido && !idsConcluidosEmAberto.has(String(item.id));

                  return (
                    <div key={item.id} className="p-3.5 rounded-2xl border border-stone-100 bg-stone-50/50 flex justify-between items-center text-xs gap-3">
                      <div className="space-y-0.5 overflow-hidden">
                        <span className="font-bold text-stone-900 block truncate">{cliente}</span>
                        <span className="text-stone-600 font-medium block truncate">{servico}</span>
                        {dataFmt && <span className="text-[10px] text-stone-400 block">{dataFmt}</span>}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-bold text-stone-900 block">{formatBRL(valor)}</span>
                        <span
                          className={`px-2 py-0.5 text-[9px] font-black rounded-md inline-block mt-1 tracking-wider ${
                            jaPagoNoFechamento
                              ? 'bg-sky-100 text-sky-800'
                              : concluido
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {jaPagoNoFechamento ? 'COMISSÃO PAGA' : status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* 4. RODAPÉ FIXO DE NAVEGAÇÃO DO BARBEIRO */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-4 py-2 flex items-center justify-around max-w-xl mx-auto shadow-lg">
        <button
          type="button"
          onClick={() => setAbaAtiva('dia')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
            abaAtiva === 'dia'
              ? 'text-stone-900 font-black scale-105'
              : 'text-stone-400 hover:text-stone-600 font-semibold'
          }`}
        >
          <div
            className={`p-2 rounded-xl transition-all ${
              abaAtiva === 'dia' ? 'bg-stone-900 text-white shadow-sm' : 'bg-transparent'
            }`}
          >
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Agenda</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva('mes')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
            abaAtiva === 'mes'
              ? 'text-stone-900 font-black scale-105'
              : 'text-stone-400 hover:text-stone-600 font-semibold'
          }`}
        >
          <div
            className={`p-2 rounded-xl transition-all ${
              abaAtiva === 'mes' ? 'bg-stone-900 text-white shadow-sm' : 'bg-transparent'
            }`}
          >
            <Calendar className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Histórico</span>
        </button>

        <button
          type="button"
          onClick={() => setModalLogoutOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-2xl text-rose-600 hover:text-rose-700 font-semibold transition-all cursor-pointer"
          title="Sair / Trocar de Conta"
        >
          <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/80 shadow-2xs">
            <LogOut className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-black">Sair</span>
        </button>
      </footer>

      {/* 5. MODAL CUSTOMIZADO DE CONFIRMAÇÃO DE SAÍDA */}
      {modalLogoutOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-5 text-center relative text-slate-900">

            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto shadow-sm">
              <LogOut className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-slate-900">Deseja realmente sair?</h3>
              <p className="text-xs font-medium text-slate-500">
                Você precisará fazer login novamente para acessar o seu painel de agendamentos.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setModalLogoutOpen(false)}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all cursor-pointer border border-slate-200 active:scale-95"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => {
                  setModalLogoutOpen(false);
                  handleLogout();
                }}
                className="py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-md active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>Sair da conta</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 6. MODAL DE FEEDBACK */}
      {modalFeedback.isOpen && (
        <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] max-w-sm w-full p-6 shadow-2xl border border-stone-200 space-y-5 text-center">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto shadow-inner ${
                modalFeedback.tipo === 'sucesso'
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-rose-50 text-rose-600'
              }`}
            >
              {modalFeedback.tipo === 'sucesso' ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <AlertCircle className="w-6 h-6" />
              )}
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-stone-900">{modalFeedback.titulo}</h3>
              <p className="text-xs text-stone-500 leading-relaxed px-2">
                {modalFeedback.mensagem}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setModalFeedback({ isOpen: false, tipo: 'sucesso', titulo: '', mensagem: '' })}
              className="w-full py-3 bg-stone-900 hover:bg-black text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-md"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
