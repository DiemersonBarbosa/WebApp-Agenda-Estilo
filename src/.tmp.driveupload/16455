'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, Clock, Scissors, User, Check, CheckCircle2, AlertCircle, ArrowRight, Gift, Sparkles, Edit3, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AgendamentoClassico({ barbeariaId }) {
  const [barbearia, setBarbearia] = useState(null);
  const [servicos, setServicos] = useState([]);
  const [barbeiros, setBarbeiros] = useState([]);
  const [horariosOcupados, setHorariosOcupados] = useState([]);
  const [datasBloqueadas, setDatasBloqueadas] = useState([]);

  // Estado da Identificação do Cliente
  const [telefone, setTelefone] = useState('');
  const [nome, setNome] = useState('');
  const [clienteId, setClienteId] = useState(null);
  const [clienteIdentificado, setClienteIdentificado] = useState(false);
  const [isNovoCliente, setIsNovoCliente] = useState(false);
  
  // Dados de Fidelidade exatamente como no Chat
  const [dadosFidelidade, setDadosFidelidade] = useState({ selos_atuais: 0, total_resgates: 0, id: null });
  const [agendamentosAtivos, setAgendamentosAtivos] = useState([]);
  const [modoVisualizacao, setModoVisualizacao] = useState('agendar');

  // Seleções
  const [agendamentoEmEdicao, setAgendamentoEmEdicao] = useState(null);
  const [servicoEscolhido, setServicoEscolhido] = useState(null);
  const [barbeiroEscolhido, setBarbeiroEscolhido] = useState(null);
  const [dataEscolhida, setDataEscolhida] = useState('');
  const [horaEscolhida, setHoraEscolhida] = useState('');

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(false);

  const metaSelos = 10;

  // Refs para Scroll Automático
  const servicoRef = useRef(null);
  const barbeiroRef = useRef(null);
  const dataRef = useRef(null);
  const horarioRef = useRef(null);
  const resumoRef = useRef(null);

  const isClean = barbearia?.cor_tema === 'clean';
  const corTema = barbearia?.cor_primaria || (isClean ? '#0f172a' : '#10b981');

  const estiloFundoContainer = isClean 
    ? 'bg-white text-slate-900 border-slate-200/90 shadow-[0_20px_50px_rgba(0,0,0,0.1)]' 
    : 'bg-[#0b0c10]/95 text-white border-white/10 shadow-[0_25px_70px_rgba(0,0,0,0.85)]';

  const estiloInput = isClean 
    ? 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-slate-800 focus:bg-white' 
    : 'bg-black/60 border-white/10 text-white placeholder-slate-500 focus:border-white/30';

  useEffect(() => {
    async function carregarDados() {
      try {
        const { data: barb } = await supabase.from('barbearias').select('*').eq('id', barbeariaId).single();
        if (barb) setBarbearia(barb);

        const [resServicos, resBarbeiros, resBloqueios] = await Promise.all([
          supabase.from('servicos').select('*').eq('barbearia_id', barbeariaId),
          supabase.from('barbeiros').select('*').eq('barbearia_id', barbeariaId),
          supabase.from('bloqueios_agenda').select('data_bloqueio').eq('barbearia_id', barbeariaId)
        ]);

        setServicos(resServicos.data || []);
        setBarbeiros(resBarbeiros.data || []);

        const bloqueiosFormatados = (resBloqueios.data || []).map(b => {
          if (!b.data_bloqueio) return '';
          return String(b.data_bloqueio).split('T')[0];
        }).filter(Boolean);

        setDatasBloqueadas(bloqueiosFormatados);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      }
    }
    if (barbeariaId) carregarDados();
  }, [barbeariaId]);

  useEffect(() => {
    async function buscarOcupados() {
      const bId = barbeiroEscolhido?.id || agendamentoEmEdicao?.barbeiro_id;
      if (!bId || !dataEscolhida) return;

      try {
        const dataFmt = dataEscolhida.split('T')[0];
        const inicio = `${dataFmt}T00:00:00`;
        const fim = `${dataFmt}T23:59:59`;

        const { data } = await supabase
          .from('agendamentos')
          .select('data_hora')
          .eq('barbeiro_id', bId)
          .neq('status', 'cancelado')
          .gte('data_hora', new Date(inicio).toISOString())
          .lte('data_hora', new Date(fim).toISOString());

        const ocupados = (data || []).map((ag) => {
          const d = new Date(ag.data_hora);
          return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        });

        setHorariosOcupados(ocupados);
      } catch (err) {
        console.error('Erro horários:', err);
      }
    }
    buscarOcupados();
  }, [barbeiroEscolhido, agendamentoEmEdicao, dataEscolhida]);

  const carregarDadosCliente = async (cliId) => {
    try {
      const { data: agsAtivos } = await supabase
        .from('agendamentos')
        .select('*, servicos(nome, preco), barbeiros(nome)')
        .eq('cliente_id', cliId)
        .neq('status', 'cancelado')
        .order('data_hora', { ascending: true });

      setAgendamentosAtivos(agsAtivos || []);

      const { data: fidData } = await supabase
        .from('fidelidade_clientes')
        .select('*')
        .eq('cliente_id', cliId)
        .maybeSingle();

      setDadosFidelidade(fidData || { selos_atuais: 0, total_resgates: 0, id: null });
      return agsAtivos || [];
    } catch (err) {
      console.error('Erro ao carregar cliente:', err);
      return [];
    }
  };

  const checarDiaAtivo = (configObj, dataObj) => {
    if (!configObj) return undefined;
    
    const diasSemanaMap = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const diasSemanaComAcento = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
    const indexDia = dataObj.getDay();
    
    const nomeSemAcento = diasSemanaMap[indexDia];
    const nomeComAcento = diasSemanaComAcento[indexDia];

    const conf = configObj[nomeSemAcento] !== undefined ? configObj[nomeSemAcento] : configObj[nomeComAcento];
    if (conf === undefined) return undefined;

    if (typeof conf === 'boolean') return conf;
    if (typeof conf === 'object' && conf !== null) {
      if (conf.ativo !== undefined) return conf.ativo !== false;
      if (conf.trabalha !== undefined) return conf.trabalha !== false;
    }
    return true;
  };

  const gerarDiasDisponiveis = () => {
    const dias = [];
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const barbeiroAtivo = barbeiroEscolhido || barbeiros.find(b => b.id === agendamentoEmEdicao?.barbeiro_id);

    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(hoje.getDate() + i);

      const anoIso = d.getFullYear();
      const mesIso = String(d.getMonth() + 1).padStart(2, '0');
      const diaIso = String(d.getDate()).padStart(2, '0');
      const dataIso = `${anoIso}-${mesIso}-${diaIso}`;

      let diaAtivo = true;
      const ativoBarbeiro = checarDiaAtivo(barbeiroAtivo?.horarios_trabalho, d);

      if (ativoBarbeiro !== undefined) {
        diaAtivo = ativoBarbeiro;
      } else {
        const ativoBarbearia = checarDiaAtivo(barbearia?.horarios, d);
        if (ativoBarbearia !== undefined) {
          diaAtivo = ativoBarbearia;
        } else if (d.getDay() === 0 || d.getDay() === 6) {
          diaAtivo = false;
        }
      }

      const estaBloqueadoNoBanco = datasBloqueadas.some(b => b.startsWith(dataIso));
      const bloqueado = estaBloqueadoNoBanco || !diaAtivo;

      dias.push({
        dataIso,
        diaNum: diaIso,
        mesStr: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        diaSemanaStr: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
        bloqueado
      });
    }
    return dias;
  };

  const gerarHorariosDisponiveisDinamico = () => {
    if (!dataEscolhida) return [];

    const dataFmt = dataEscolhida.split('T')[0];
    if (datasBloqueadas.some(b => b.startsWith(dataFmt))) {
      return [];
    }

    const barbeiroAtivo = barbeiroEscolhido || barbeiros.find(b => b.id === agendamentoEmEdicao?.barbeiro_id);
    const [ano, mes, dia] = dataFmt.split('-').map(Number);
    const dateObj = new Date(ano, mes - 1, dia);

    const diasSemanaMap = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const diasSemanaComAcento = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
    const indexDia = dateObj.getDay();

    const nomeSemAcento = diasSemanaMap[indexDia];
    const nomeComAcento = diasSemanaComAcento[indexDia];

    let configHorariosBarbeiro = barbeiroAtivo?.horarios_trabalho?.[nomeSemAcento] || barbeiroAtivo?.horarios_trabalho?.[nomeComAcento];

    let aberturaStr = '08:00';
    let fechamentoStr = '18:00';
    let pausaInicioStr = '';
    let pausaFimStr = '';

    if (configHorariosBarbeiro) {
      if (configHorariosBarbeiro.ativo === false) return [];
      aberturaStr = configHorariosBarbeiro.abertura || '08:00';
      fechamentoStr = configHorariosBarbeiro.fechamento || '18:00';
      pausaInicioStr = configHorariosBarbeiro.pausaInicio || '';
      pausaFimStr = configHorariosBarbeiro.pausaFim || '';
    } else {
      const configGeral = barbearia?.horarios?.[nomeSemAcento] || barbearia?.horarios?.[nomeComAcento];
      if (configGeral !== undefined) {
        if (typeof configGeral === 'boolean' && configGeral === false) return [];
        if (typeof configGeral === 'object' && configGeral !== null && configGeral.ativo === false) return [];
        aberturaStr = configGeral.abertura || '08:00';
        fechamentoStr = configGeral.fechamento || '18:00';
        pausaInicioStr = configGeral.pausaInicio || '';
        pausaFimStr = configGeral.pausaFim || '';
      }
    }

    const paraMinutos = (horaStr) => {
      if (!horaStr) return null;
      const [h, m] = horaStr.split(':').map(Number);
      return h * 60 + m;
    };

    const paraHoraStr = (minutos) => {
      const h = Math.floor(minutos / 60).toString().padStart(2, '0');
      const m = (minutos % 60).toString().padStart(2, '0');
      return `${h}:${m}`;
    };

    const minAbertura = paraMinutos(aberturaStr);
    const minFechamento = paraMinutos(fechamentoStr);
    const minPausaInicio = paraMinutos(pausaInicioStr);
    const minPausaFim = paraMinutos(pausaFimStr);

    if (minAbertura === null || minFechamento === null || minAbertura >= minFechamento) {
      return [];
    }

    const horariosGerados = [];
    const intervaloMinutos = 60;

    for (let min = minAbertura; min < minFechamento; min += intervaloMinutos) {
      if (minPausaInicio !== null && minPausaFim !== null) {
        if (min >= minPausaInicio && min < minPausaFim) {
          continue;
        }
      }
      horariosGerados.push(paraHoraStr(min));
    }

    return horariosGerados;
  };

  const handleVerificarTelefone = async (e) => {
    e.preventDefault();
    if (telefone.length < 8) {
      setErro('Informe um número de celular / WhatsApp válido.');
      return;
    }
    setErro(null);
    setLoading(true);

    try {
      const { data: cli } = await supabase
        .from('clientes')
        .select('*')
        .eq('barbearia_id', barbeariaId)
        .eq('telefone', telefone)
        .maybeSingle();

      if (cli) {
        setClienteId(cli.id);
        setNome(cli.nome);
        setClienteIdentificado(true);
        setIsNovoCliente(false);
        
        await carregarDadosCliente(cli.id);
        setModoVisualizacao('agendar');
        setTimeout(() => servicoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      } else {
        setIsNovoCliente(true);
      }
    } catch (err) {
      setErro('Erro ao verificar cliente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCadastrarNovoCliente = async (e) => {
    e.preventDefault();
    if (nome.length < 2) {
      setErro('Por favor, digite seu nome completo.');
      return;
    }
    setErro(null);
    setLoading(true);

    try {
      const { data: novoCli } = await supabase
        .from('clientes')
        .insert([{ barbearia_id: barbeariaId, nome, telefone }])
        .select('*')
        .single();

      if (novoCli) {
        setClienteId(novoCli.id);
        setClienteIdentificado(true);
        setIsNovoCliente(false);
        await carregarDadosCliente(novoCli.id);
        setModoVisualizacao('agendar');
        setTimeout(() => servicoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      }
    } catch (err) {
      setErro('Erro ao cadastrar novo cliente.');
    } finally {
      setLoading(false);
    }
  };

  const cancelarAgendamento = async (agId) => {
    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ status: 'cancelado' })
        .eq('id', agId);

      if (error) throw error;
      await carregarDadosCliente(clienteId);
    } catch (err) {
      setErro('Erro ao cancelar agendamento.');
    }
  };

  const confirmarEdicaoHorario = async (hora) => {
    setLoading(true);
    try {
      const dataFmt = dataEscolhida.split('T')[0];
      const dataHoraIso = new Date(`${dataFmt}T${hora}:00`).toISOString();
      const { error } = await supabase
        .from('agendamentos')
        .update({ data_hora: dataHoraIso })
        .eq('id', agendamentoEmEdicao.id);

      if (error) throw error;
      await carregarDadosCliente(clienteId);
      setAgendamentoEmEdicao(null);
      setSucesso(true);
    } catch (err) {
      setErro('Erro ao atualizar agendamento.');
    } finally {
      setLoading(false);
    }
  };

  const confirmarAgendamento = async () => {
    if (!servicoEscolhido || !barbeiroEscolhido || !dataEscolhida || !horaEscolhida) {
      setErro('Selecione todos os dados para finalizar o agendamento.');
      return;
    }

    setLoading(true);
    try {
      const dataFmt = dataEscolhida.split('T')[0];
      const dataHoraIso = new Date(`${dataFmt}T${horaEscolhida}:00`).toISOString();
      const { error } = await supabase.from('agendamentos').insert([{
        barbearia_id: barbeariaId,
        cliente_id: clienteId,
        barbeiro_id: barbeiroEscolhido.id,
        servico_id: servicoEscolhido.id,
        valor_total: servicoEscolhido.preco,
        data_hora: dataHoraIso,
        status: 'agendado',
        lido: false
      }]);

      if (error) throw error;
      await carregarDadosCliente(clienteId);
      setSucesso(true);
    } catch (err) {
      setErro('Erro ao concluir agendamento.');
    } finally {
      setLoading(false);
    }
  };

  const renderCartaoFidelidade = () => {
    if (barbearia?.fidelidade_ativa === false) return null;

    const selos = dadosFidelidade?.selos_atuais || 0;
    const atingiuMeta = selos >= metaSelos;

    return (
      <div className={`p-4 rounded-3xl border flex items-center justify-between gap-3 shadow-sm relative overflow-hidden ${
        isClean ? 'bg-slate-900 text-white border-slate-800' : 'bg-white/5 border-white/10'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm bg-white/10 text-white">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-black">{nome}</p>
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border bg-white/10 border-white/20 text-white">
                Cliente VIP
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Programa de Fidelidade</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-black block text-slate-100">{selos} / {metaSelos} Selos</span>
          <span className="text-[9px] font-semibold text-slate-400">{atingiuMeta ? '🎁 Resgate Disponível!' : 'Cartão Ativo'}</span>
        </div>
      </div>
    );
  };

  return (
    <div className={`w-full max-w-xl mx-auto rounded-[2.5rem] border overflow-hidden relative backdrop-blur-2xl transition-all duration-300 ${estiloFundoContainer}`}>
      
      {/* FRISO SUPERIOR */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[3px] z-30 shadow-lg" style={{ background: `linear-gradient(to right, transparent, ${corTema}, transparent)` }} />

      {/* CAPA DA UNIDADE */}
      <div className="relative h-36 w-full bg-slate-900 overflow-hidden">
        {barbearia?.capa_url ? (
          <img src={barbearia.capa_url} alt="Capa" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-slate-900 flex items-center justify-center">
            <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Capa da Unidade</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </div>

      {/* HEADER: LOGO E NOME */}
      <div className="px-6 pb-2 pt-0 relative flex flex-col items-center text-center -mt-12 mb-3 z-10">
        <div className="w-20 h-20 rounded-[1.8rem] bg-white p-1 shadow-2xl border border-slate-200 overflow-hidden flex items-center justify-center mb-2">
          {barbearia?.logo_url ? (
            <img src={barbearia.logo_url} alt={barbearia.nome} className="w-full h-full object-cover rounded-[1.4rem]" />
          ) : (
            <div className="w-full h-full text-white rounded-[1.4rem] flex items-center justify-center font-black text-xl" style={{ backgroundColor: corTema }}>
              {barbearia?.nome?.charAt(0) || 'B'}
            </div>
          )}
        </div>
        <h2 className={`text-lg font-black tracking-tight ${isClean ? 'text-slate-900' : 'text-white'}`}>{barbearia?.nome}</h2>
        <p className="text-[10px] font-extrabold uppercase tracking-widest mt-0.5 flex items-center gap-1" style={{ color: corTema }}>
          <Sparkles className="w-3 h-3" /> Agendamento Online
        </p>
      </div>

      <div className="p-6 sm:p-8 pt-0 space-y-6">

        {/* IDENTIFICAÇÃO WHATSAPP */}
        {!clienteIdentificado ? (
          <div className="space-y-4">
            {!isNovoCliente ? (
              <form onSubmit={handleVerificarTelefone} className="space-y-3.5">
                <div className="space-y-1">
                  <label className={`text-[10px] font-black uppercase tracking-wider block ${isClean ? 'text-slate-600' : 'text-slate-400'}`}>
                    1. Informe seu Celular / WhatsApp
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="(00) 00000-0000"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className={`w-full rounded-2xl px-4 py-3.5 text-xs font-bold focus:outline-none transition-all ${estiloInput}`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all hover:brightness-110 active:scale-98"
                  style={{ backgroundColor: corTema }}
                >
                  <span>{loading ? 'A verificar...' : 'Avançar'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleCadastrarNovoCliente} className="space-y-3.5">
                <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold">
                  Seja bem-vindo(a)! Notamos que é o seu primeiro agendamento.
                </div>
                <div className="space-y-1">
                  <label className={`text-[10px] font-black uppercase tracking-wider block ${isClean ? 'text-slate-600' : 'text-slate-400'}`}>
                    Qual o seu nome completo?
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Seu Nome Completo"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className={`w-full rounded-2xl px-4 py-3.5 text-xs font-bold focus:outline-none transition-all ${estiloInput}`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all hover:brightness-110 active:scale-98"
                  style={{ backgroundColor: corTema }}
                >
                  <span>Iniciar Agendamento</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        ) : (
          /* PASSO SEGUINTE: CLIENTE AUTENTICADO */
          <div className="space-y-6">
            
            {/* CARTÃO VIP DE FIDELIDADE */}
            {renderCartaoFidelidade()}

            {/* BARRA DE ALTERNÂNCIA (Novo Agendamento) */}
            <div className={`flex gap-1.5 p-1 rounded-2xl border ${
              isClean ? 'bg-slate-100 border-slate-200' : 'bg-black/40 border-white/10'
            }`}>
              <button
                onClick={() => setModoVisualizacao('agendar')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  modoVisualizacao === 'agendar'
                    ? 'text-white shadow-md'
                    : isClean ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                }`}
                style={modoVisualizacao === 'agendar' ? { backgroundColor: corTema } : {}}
              >
                Novo Agendamento
              </button>
              
              {agendamentosAtivos.length > 0 && (
                <button
                  onClick={() => setModoVisualizacao('gerenciar')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    modoVisualizacao === 'gerenciar'
                      ? 'text-white shadow-md'
                      : isClean ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
                  style={modoVisualizacao === 'gerenciar' ? { backgroundColor: corTema } : {}}
                >
                  Meus Agendamentos ({agendamentosAtivos.length})
                </button>
              )}
            </div>

            {/* MODO GERENCIAR MEUS AGENDAMENTOS */}
            {modoVisualizacao === 'gerenciar' ? (
              <div className="space-y-3">
                <h3 className={`text-xs font-black uppercase tracking-wider ${isClean ? 'text-slate-600' : 'text-slate-400'}`}>Seus Agendamentos Ativos</h3>
                {agendamentosAtivos.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4">Você não possui agendamentos ativos no momento.</p>
                ) : (
                  agendamentosAtivos.map((ag) => {
                    const isConcluido = ag.status === 'concluido';

                    return (
                      <div key={ag.id} className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                        isClean ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                      }`}>
                        <div>
                          <p className={`text-xs font-bold ${isClean ? 'text-slate-900' : 'text-white'}`}>{ag.servicos?.nome}</p>
                          <p className="text-[10px] font-bold" style={{ color: corTema }}>{ag.barbeiros?.nome}</p>
                          <p className={`text-[10px] mt-0.5 ${isClean ? 'text-slate-500' : 'text-slate-400'}`}>
                            📅 {new Date(ag.data_hora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                          {isConcluido ? (
                            <span className="text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 shadow-sm">
                              Concluído
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setAgendamentoEmEdicao(ag);
                                  setDataEscolhida('');
                                  setHoraEscolhida('');
                                  setModoVisualizacao('agendar');
                                }}
                                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer hover:bg-slate-800"
                              >
                                <Edit3 className="w-3.5 h-3.5" /> Editar
                              </button>
                              <button
                                onClick={() => cancelarAgendamento(ag.id)}
                                className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-[10px] font-bold flex items-center gap-1 cursor-pointer hover:bg-rose-100"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Cancelar
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <button
                  onClick={() => setModoVisualizacao('agendar')}
                  className="w-full py-3.5 rounded-2xl text-white font-bold text-xs uppercase tracking-wider cursor-pointer shadow-md mt-2"
                  style={{ backgroundColor: corTema }}
                >
                  Fazer Novo Agendamento
                </button>
              </div>
            ) : (
              /* MODO NOVO AGENDAMENTO */
              <>
                {/* SELEÇÃO 1: SERVIÇO */}
                <div ref={servicoRef} className="space-y-3 scroll-mt-6">
                  <div className="flex items-center justify-between">
                    <label className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${isClean ? 'text-slate-700' : 'text-slate-400'}`}>
                      <Scissors className="w-4 h-4" style={{ color: corTema }} />
                      1. Escolha o Serviço
                    </label>
                    {servicoEscolhido && (
                      <span className="text-[10px] font-bold text-slate-900 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-900" /> Selecionado
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {servicos.map((s) => {
                      const isSelected = servicoEscolhido?.id === s.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => {
                            setServicoEscolhido(s);
                            setBarbeiroEscolhido(null);
                            setDataEscolhida('');
                            setHoraEscolhida('');
                            setTimeout(() => barbeiroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
                          }}
                          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                            isSelected 
                              ? 'border-2 shadow-md bg-slate-900 text-white border-slate-900 scale-[1.01]' 
                              : isClean ? 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-900' : 'bg-white/5 border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div>
                            <p className="text-xs font-black">{s.nome}</p>
                            <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>{s.duracao_minutos || 30} min</p>
                          </div>
                          <span className={`text-xs font-black shrink-0 ml-2 ${isSelected ? 'text-white' : ''}`} style={!isSelected ? { color: corTema } : {}}>
                            R$ {Number(s.preco).toFixed(2)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SELEÇÃO 2: PROFISSIONAL */}
                {servicoEscolhido && (
                  <div ref={barbeiroRef} className={`space-y-3 pt-4 border-t scroll-mt-6 ${isClean ? 'border-slate-200' : 'border-white/10'}`}>
                    <label className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${isClean ? 'text-slate-700' : 'text-slate-400'}`}>
                      <User className="w-4 h-4" style={{ color: corTema }} />
                      2. Escolha o Profissional
                    </label>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {barbeiros.map((b) => {
                        const isSelected = barbeiroEscolhido?.id === b.id;
                        const foto = b.foto || b.avatar || b.imagem;
                        return (
                          <button
                            key={b.id}
                            onClick={() => {
                              setBarbeiroEscolhido(b);
                              setDataEscolhida('');
                              setHoraEscolhida('');
                              setTimeout(() => dataRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
                            }}
                            className={`p-3 rounded-2xl border text-center flex flex-col items-center transition-all cursor-pointer ${
                              isSelected 
                                ? 'border-2 shadow-md bg-slate-900 text-white border-slate-900 scale-[1.02]' 
                                : isClean ? 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-900' : 'bg-white/5 border-white/10 hover:border-white/20'
                            }`}
                          >
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 mb-1.5 shrink-0 border-slate-300">
                              {foto ? (
                                <img src={foto} alt={b.nome} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full text-white flex items-center justify-center font-black text-sm bg-slate-900">
                                  {b.nome?.charAt(0)}
                                </div>
                              )}
                            </div>
                            <p className="text-xs font-bold line-clamp-1">{b.nome}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SELEÇÃO 3: DATA */}
                {(barbeiroEscolhido || agendamentoEmEdicao) && (
                  <div ref={dataRef} className={`space-y-3 pt-4 border-t scroll-mt-6 ${isClean ? 'border-slate-200' : 'border-white/10'}`}>
                    <label className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${isClean ? 'text-slate-700' : 'text-slate-400'}`}>
                      <CalendarIcon className="w-4 h-4" style={{ color: corTema }} />
                      3. Escolha a Data
                    </label>

                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                      {gerarDiasDisponiveis().map((d) => {
                        const isSelected = dataEscolhida === d.dataIso;
                        return (
                          <button
                            key={d.dataIso}
                            disabled={d.bloqueado}
                            onClick={() => {
                              setDataEscolhida(d.dataIso);
                              setHoraEscolhida('');
                              setTimeout(() => horarioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
                            }}
                            className={`shrink-0 w-20 p-3 rounded-2xl border text-center transition-all flex flex-col items-center ${
                              d.bloqueado
                                ? 'opacity-30 border-slate-200 bg-slate-100 cursor-not-allowed'
                                : isSelected
                                ? 'border-2 font-bold shadow-md bg-slate-900 text-white border-slate-900 scale-[1.02]'
                                : isClean
                                ? 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-900'
                                : 'bg-white/5 border-white/10 hover:border-white/20'
                            }`}
                          >
                            <span className={`text-[9px] font-extrabold uppercase ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>{d.diaSemanaStr}</span>
                            <span className="text-base font-black my-0.5">{d.diaNum}</span>
                            <span className="text-[9px] font-bold uppercase" style={{ color: d.bloqueado ? '#f43f5e' : (isSelected ? '#ffffff' : corTema) }}>
                              {d.bloqueado ? 'Fechado' : d.mesStr}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SELEÇÃO 4: HORÁRIO */}
                {dataEscolhida && (
                  <div ref={horarioRef} className={`space-y-3 pt-4 border-t scroll-mt-6 ${isClean ? 'border-slate-200' : 'border-white/10'}`}>
                    <label className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${isClean ? 'text-slate-700' : 'text-slate-400'}`}>
                      <Clock className="w-4 h-4" style={{ color: corTema }} />
                      4. Escolha o Horário
                    </label>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[180px] overflow-y-auto pr-1">
                      {gerarHorariosDisponiveisDinamico().map((h) => {
                        const ocupado = horariosOcupados.includes(h);
                        const isSelected = horaEscolhida === h;
                        return (
                          <button
                            key={h}
                            disabled={ocupado}
                            onClick={() => {
                              setHoraEscolhida(h);
                              if (agendamentoEmEdicao) {
                                confirmarEdicaoHorario(h);
                              } else {
                                setTimeout(() => resumoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
                              }
                            }}
                            className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                              ocupado 
                                ? 'opacity-30 line-through cursor-not-allowed border-slate-200' 
                                : isSelected
                                ? 'border-2 font-extrabold shadow-md bg-slate-900 text-white border-slate-900'
                                : isClean ? 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800' : 'bg-white/5 border-white/10 hover:border-white/20'
                            }`}
                          >
                            {h}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* RESUMO E CONFIRMAÇÃO FINAL */}
                {horaEscolhida && !sucesso && !agendamentoEmEdicao && (
                  <div ref={resumoRef} className={`p-5 rounded-3xl border space-y-4 shadow-lg scroll-mt-6 ${
                    isClean ? 'bg-slate-900 text-white border-slate-800' : 'bg-gradient-to-br from-black/80 via-black/60 to-stone-900 border-white/15'
                  }`}>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Resumo da Reserva</h4>
                    
                    <div className="space-y-1.5 text-xs text-slate-300">
                      <p>✂️ <strong>Serviço:</strong> {servicoEscolhido?.nome} (R$ {Number(servicoEscolhido?.preco || 0).toFixed(2)})</p>
                      <p>👤 <strong>Profissional:</strong> {barbeiroEscolhido?.nome}</p>
                      <p>📅 <strong>Data:</strong> {dataEscolhida.split('T')[0].split('-').reverse().join('/')}</p>
                      <p>⏰ <strong>Horário:</strong> {horaEscolhida}</p>
                      <p>📱 <strong>Cliente:</strong> {nome} ({telefone})</p>
                    </div>

                    <button
                      disabled={loading}
                      onClick={confirmarAgendamento}
                      className="w-full py-4 rounded-2xl text-white font-black text-xs uppercase tracking-widest cursor-pointer shadow-lg hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2"
                      style={{ backgroundColor: corTema }}
                    >
                      {loading ? 'A processar...' : 'Confirmar Agendamento'}
                    </button>
                  </div>
                )}

                {/* SUCESSO DO AGENDAMENTO */}
                {sucesso && (
                  <div className={`py-6 text-center space-y-4 border-t ${isClean ? 'border-slate-200' : 'border-white/10'}`}>
                    <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto shadow-md bg-slate-900 text-white">
                      <Check className="w-8 h-8 stroke-[3]" />
                    </div>
                    <h3 className={`text-base font-black ${isClean ? 'text-slate-900' : 'text-white'}`}>Agendamento Concluído!</h3>
                    <p className={`text-xs ${isClean ? 'text-slate-500' : 'text-slate-400'}`}>
                      Horário registado com sucesso para {dataEscolhida.split('T')[0].split('-').reverse().join('/')} às {horaEscolhida}.
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                      <button
                        onClick={() => {
                          setSucesso(false);
                          setServicoEscolhido(null);
                          setBarbeiroEscolhido(null);
                          setDataEscolhida('');
                          setHoraEscolhida('');
                          setModoVisualizacao('agendar');
                        }}
                        className="w-full py-3.5 rounded-2xl text-white font-bold text-xs uppercase shadow-md hover:brightness-110 cursor-pointer"
                        style={{ backgroundColor: corTema }}
                      >
                        Novo Agendamento
                      </button>
                      <button
                        onClick={() => {
                          setSucesso(false);
                          setModoVisualizacao('gerenciar');
                        }}
                        className={`w-full py-3.5 rounded-2xl font-bold text-xs uppercase border cursor-pointer ${
                          isClean ? 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200' : 'bg-white/10 border-white/10 text-white'
                        }`}
                      >
                        Ver Meus Agendamentos
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

          </div>
        )}

      </div>

      {erro && (
        <div className="mx-6 mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

    </div>
  );
}