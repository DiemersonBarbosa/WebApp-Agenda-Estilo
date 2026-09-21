'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, CheckCircle2, AlertCircle, Clock, ArrowRight, Calendar as CalendarIcon, XCircle, Edit3, Scissors, User, Award, Gift, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AgendamentoChat({ barbeariaId }) {
  const [barbearia, setBarbearia] = useState(null);
  const [servicos, setServicos] = useState([]);
  const [barbeiros, setBarbeiros] = useState([]);
  const [horariosOcupados, setHorariosOcupados] = useState([]);
  const [datasBloqueadas, setDatasBloqueadas] = useState([]);

  const [dataAtualNavegacao, setDataAtualNavegacao] = useState(new Date());

  const [etapa, setEtapa] = useState('telefone');
  const [telefone, setTelefone] = useState('');
  const [nome, setNome] = useState('');
  const [clienteId, setClienteId] = useState(null);
  const [agendamentosCliente, setAgendamentosCliente] = useState([]);
  const [dadosFidelidade, setDadosFidelidade] = useState({ selos_atuais: 0, total_resgates: 0, id: null });
  
  const [agendamentoEmEdicao, setAgendamentoEmEdicao] = useState(null);
  const [servicoEscolhido, setServicoEscolhido] = useState(null);
  const [barbeiroEscolhido, setBarbeiroEscolhido] = useState(null);
  const [dataEscolhida, setDataEscolhida] = useState('');
  const [horaEscolhida, setHoraEscolhida] = useState('');

  const [inputTexto, setInputTexto] = useState('');
  const [mensagens, setMensagens] = useState([]);
  const [estaDigitando, setEstaDigitando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  const metaSelos = 10;
  const chatContainerRef = useRef(null);
  const inicializadoRef = useRef(false);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [mensagens, estaDigitando]);

  const isClean = barbearia?.cor_tema === 'clean';
  const corTema = isClean ? '#064e3b' : '#10b981';
  
  const estiloFundoGlobal = isClean ? 'bg-[#f8fafc] text-slate-800' : 'bg-[#050507] text-white';
  const estiloFundoContainer = isClean 
    ? 'bg-[#ffffff] text-slate-900 border-none shadow-none md:border md:border-slate-300 md:rounded-[2.5rem] md:shadow-2xl' 
    : 'bg-[#050507] text-white border-none shadow-none md:border md:border-white/15 md:rounded-[2.5rem] md:shadow-2xl';

  const estiloHeader = isClean ? 'bg-white/95 border-slate-200 text-slate-900' : 'bg-[#050507]/95 border-white/10 text-white';
  const estiloBotMsg = isClean ? 'bg-slate-100 border border-slate-200 text-slate-800 shadow-sm' : 'bg-stone-900 border border-white/10 text-slate-200 shadow-inner';
  const estiloInput = isClean ? 'bg-slate-100 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-stone-900 border-white/10 text-white placeholder-slate-500';

  // Gerador de dias do mês (ocultando dias passados e exibindo apenas a partir de hoje no mês atual)
  const gerarDiasDoMes = () => {
    const ano = dataAtualNavegacao.getFullYear();
    const mes = dataAtualNavegacao.getMonth();
    
    const totalDias = new Date(ano, mes + 1, 0).getDate();
    const dias = [];
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const isMesAtual = hoje.getFullYear() === ano && hoje.getMonth() === mes;
    const diaInicio = isMesAtual ? hoje.getDate() : 1;

    for (let i = diaInicio; i <= totalDias; i++) {
      const d = new Date(ano, mes, i);
      
      const anoIso = d.getFullYear();
      const mesIso = String(d.getMonth() + 1).padStart(2, '0');
      const diaIso = String(d.getDate()).padStart(2, '0');
      const dataIso = `${anoIso}-${mesIso}-${diaIso}`;

      const diasSemanaMap = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
      const nomeDiaSemana = diasSemanaMap[d.getDay()];

      const configHorarios = barbearia?.horarios;
      let diaAtivo = true;
      if (configHorarios && configHorarios[nomeDiaSemana]) {
        diaAtivo = configHorarios[nomeDiaSemana].ativo;
      }

      const bloqueado = datasBloqueadas.includes(dataIso) || !diaAtivo;

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

  const avancarMes = () => {
    setDataAtualNavegacao(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const voltarMes = () => {
    const hoje = new Date();
    const mesAnterior = new Date(dataAtualNavegacao.getFullYear(), dataAtualNavegacao.getMonth() - 1, 1);
    if (mesAnterior.getFullYear() >= hoje.getFullYear() && mesAnterior.getMonth() >= hoje.getMonth()) {
      setDataAtualNavegacao(mesAnterior);
    }
  };

  const getHorariosDisponiveisParaData = (dataStr) => {
    if (!dataStr || datasBloqueadas.includes(dataStr)) return [];

    const [ano, mes, dia] = dataStr.split('-').map(Number);
    const dateObj = new Date(ano, mes - 1, dia);
    const diasSemanaMap = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const nomeDia = diasSemanaMap[dateObj.getDay()];

    const configHorarios = barbearia?.horarios;
    let aberturaStr = '08:00';
    let fechamentoStr = '19:00';
    let pausaInicio = '';
    let pausaFim = '';

    if (configHorarios && configHorarios[nomeDia]) {
      const diaConfig = configHorarios[nomeDia];
      if (!diaConfig.ativo) return [];

      aberturaStr = diaConfig.abertura || '08:00';
      fechamentoStr = diaConfig.fechamento || '19:00';
      pausaInicio = diaConfig.pausaInicio;
      pausaFim = diaConfig.pausaFim;
    }

    const [horaInicio] = aberturaStr.split(':').map(Number);
    const [horaFim] = fechamentoStr.split(':').map(Number);

    const horariosGerados = [];
    for (let h = horaInicio; h < horaFim; h++) {
      const horaFormatada = `${String(h).padStart(2, '0')}:00`;
      if (pausaInicio && pausaFim && horaFormatada >= pausaInicio && horaFormatada < pausaFim) continue;
      horariosGerados.push(horaFormatada);
    }

    return horariosGerados;
  };

  const horariosDisponiveisAtuais = getHorariosDisponiveisParaData(dataEscolhida);

  const adicionarMensagemBotComDelay = (textoResposta, proximaEtapa = null) => {
    setEstaDigitando(true);
    setTimeout(() => {
      setEstaDigitando(false);
      setMensagens((prev) => [...prev, { remetente: 'bot', texto: textoResposta }]);
      if (proximaEtapa) setEtapa(proximaEtapa);
    }, 800);
  };

  useEffect(() => {
    async function carregarDados() {
      if (inicializadoRef.current) return;
      inicializadoRef.current = true;

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
        setDatasBloqueadas((resBloqueios.data || []).map(b => b.data_bloqueio));

        adicionarMensagemBotComDelay('Olá! Seja muito bem-vindo. Para começarmos, por favor, informe o seu celular/WhatsApp:');
      } catch (err) {
        console.error('Erro ao carregar dados do chat:', err);
      }
    }

    if (barbeariaId) carregarDados();
  }, [barbeariaId]);

  useEffect(() => {
    async function buscarOcupados() {
      const barbIdParaConsulta = etapa.startsWith('editar') ? agendamentoEmEdicao?.barbeiro_id : barbeiroEscolhido?.id;
      if (!barbIdParaConsulta || !dataEscolhida) return;

      try {
        const inicio = `${dataEscolhida}T00:00:00`;
        const fim = `${dataEscolhida}T23:59:59`;

        const { data } = await supabase
          .from('agendamentos')
          .select('data_hora')
          .eq('barbeiro_id', barbIdParaConsulta)
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
  }, [barbeiroEscolhido, agendamentoEmEdicao, dataEscolhida, etapa]);

  const carregarDadosCliente = async (cliId) => {
    try {
      const { data: agsAtivos } = await supabase
        .from('agendamentos')
        .select('*, servicos(nome), barbeiros(nome)')
        .eq('cliente_id', cliId)
        .neq('status', 'cancelado')
        .gte('data_hora', new Date().toISOString());

      setAgendamentosCliente(agsAtivos || []);

      const { data: fidData } = await supabase
        .from('fidelidade_clientes')
        .select('*')
        .eq('cliente_id', cliId)
        .maybeSingle();

      setDadosFidelidade(fidData || { selos_atuais: 0, total_resgates: 0, id: null });
      return agsAtivos || [];
    } catch (err) {
      console.error('Erro ao carregar dados do cliente:', err);
      return [];
    }
  };

  const handleResgatarPremioCliente = async () => {
    if (!dadosFidelidade || dadosFidelidade.selos_atuais < metaSelos) return;

    setLoading(true);
    try {
      const novosSelos = dadosFidelidade.selos_atuais - metaSelos;
      const novosResgates = (dadosFidelidade.total_resgates || 0) + 1;

      await supabase.from('fidelidade_clientes').update({
        selos_atuais: novosSelos,
        total_resgates: novosResgates,
        atualizado_em: new Date().toISOString()
      }).eq('id', dadosFidelidade.id);

      await supabase.from('fidelidade_resgates').insert([{
        barbearia_id: barbeariaId,
        cliente_id: clienteId,
        premio_concedido: 'Corte Grátis'
      }]);

      setDadosFidelidade(prev => ({ ...prev, selos_atuais: novosSelos, total_resgates: novosResgates }));
      adicionarMensagemBotComDelay('🎉 Prêmio resgatado com sucesso! Apresente esta confirmação na barbearia para garantir o seu Corte Grátis.');
    } catch (err) {
      setErro('Erro ao resgatar prêmio. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarResposta = async (e) => {
    e.preventDefault();
    if (!inputTexto.trim() && !['servico', 'barbeiro', 'horario', 'menu_inicial', 'gerenciar', 'resumo'].includes(etapa)) return;

    const valorInput = inputTexto.trim();
    setInputTexto('');
    setErro(null);

    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    if (valorInput) setMensagens((prev) => [...prev, { remetente: 'usuario', texto: valorInput }]);

    if (etapa === 'telefone') {
      if (valorInput.length < 8) {
        setErro('Por favor, informe um número de celular válido.');
        return;
      }
      setTelefone(valorInput);

      try {
        const { data: cliExistente } = await supabase.from('clientes').select('id, nome').eq('barbearia_id', barbeariaId).eq('telefone', valorInput).maybeSingle();

        if (cliExistente) {
          setClienteId(cliExistente.id);
          setNome(cliExistente.nome);
          const agsAtivos = await carregarDadosCliente(cliExistente.id);

          if (agsAtivos.length > 0) {
            adicionarMensagemBotComDelay(`Que bom vê-lo novamente, ${cliExistente.nome}! Verificamos os seus agendamentos e o seu cartão fidelidade abaixo:`, 'menu_inicial');
          } else {
            if (barbearia?.permite_agendamentos === false) {
              adicionarMensagemBotComDelay(`Que bom vê-lo novamente, ${cliExistente.nome}! No momento, os agendamentos online estão pausados pela barbearia.`, 'menu_inicial');
            } else {
              adicionarMensagemBotComDelay(`Que bom vê-lo novamente, ${cliExistente.nome}! Confira também o seu cartão fidelidade e escolha o serviço desejado:`, 'servico');
            }
          }
        } else {
          adicionarMensagemBotComDelay('Não encontramos seu cadastro. Como podemos chamá-lo? Por favor, informe seu nome completo:', 'nome');
        }
      } catch (err) {
        setErro('Erro ao verificar cliente.');
      }
    } else if (etapa === 'nome') {
      if (valorInput.length < 2) {
        setErro('Por favor, informe um nome válido.');
        return;
      }
      setNome(valorInput);

      try {
        const { data: novoCli } = await supabase.from('clientes').insert([{ barbearia_id: barbeariaId, nome: valorInput, telefone }]).select('id').single();
        setClienteId(novoCli.id);
        await carregarDadosCliente(novoCli.id);
        
        if (barbearia?.permite_agendamentos === false) {
          adicionarMensagemBotComDelay(`Prazer em conhecê-lo, ${valorInput}! No momento, os agendamentos online estão pausados.`, 'menu_inicial');
        } else {
          adicionarMensagemBotComDelay(`Prazer em conhecê-lo, ${valorInput}! Agora, escolha um dos nossos serviços abaixo:`, 'servico');
        }
      } catch (err) {
        setErro('Erro ao cadastrar cliente.');
      }
    }
  };

  const escolherOpcaoMenu = (opcao) => {
    if (opcao === 'novo') {
      if (barbearia?.permite_agendamentos === false) {
        setMensagens((prev) => [...prev, { remetente: 'usuario', texto: 'Fazer novo agendamento' }]);
        adicionarMensagemBotComDelay('⚠️ No momento, esta barbearia está com os agendamentos online pausados.');
        return;
      }
      setMensagens((prev) => [...prev, { remetente: 'usuario', texto: 'Fazer novo agendamento' }]);
      adicionarMensagemBotComDelay('Perfeito! Escolha o serviço que deseja realizar:', 'servico');
    } else if (opcao === 'gerenciar') {
      setMensagens((prev) => [...prev, { remetente: 'usuario', texto: 'Ver meus agendamentos e selos' }]);
      carregarDadosCliente(clienteId);
      adicionarMensagemBotComDelay('Aqui estão os seus dados atualizados:', 'gerenciar');
    }
  };

  const cancelarAgendamento = async (agId) => {
    try {
      await supabase.from('agendamentos').update({ status: 'cancelado' }).eq('id', agId);
      await carregarDadosCliente(clienteId);
      adicionarMensagemBotComDelay('O agendamento foi cancelado com sucesso. O que deseja fazer?', 'menu_inicial');
    } catch (err) {
      setErro('Erro ao cancelar agendamento.');
    }
  };

  const iniciarEdicao = (ag) => {
    setAgendamentoEmEdicao(ag);
    setMensagens((prev) => [...prev, { remetente: 'usuario', texto: `Editar agendamento de ${ag.servicos?.nome || 'Serviço'}` }]);
    adicionarMensagemBotComDelay('Selecione a nova data para o seu atendimento:', 'editar_data');
  };

  const confirmarDataModerna = (dataSelecionada, bloqueado) => {
    if (bloqueado) {
      setErro('⚠️ Esta data está bloqueada ou o estabelecimento está fechado.');
      return;
    }
    setErro(null);
    setDataEscolhida(dataSelecionada);
    const dataFmt = dataSelecionada.split('-').reverse().join('/');
    setMensagens((prev) => [...prev, { remetente: 'usuario', texto: dataFmt }]);
    
    if (etapa.startsWith('editar')) {
      adicionarMensagemBotComDelay('Agora, selecione o novo horário disponível:', 'editar_horario');
    } else {
      adicionarMensagemBotComDelay('Data definida. Escolha um horário disponível:', 'horario');
    }
  };

  const salvarEdicaoHorario = async (hora) => {
    setLoading(true);
    try {
      const dataHoraIso = new Date(`${dataEscolhida}T${hora}:00`).toISOString();
      await supabase.from('agendamentos').update({ data_hora: dataHoraIso }).eq('id', agendamentoEmEdicao.id);
      await carregarDadosCliente(clienteId);
      setMensagens((prev) => [...prev, { remetente: 'usuario', texto: hora }]);
      adicionarMensagemBotComDelay(`Agendamento atualizado com sucesso para ${dataEscolhida.split('-').reverse().join('/')} às ${hora}!`, 'sucesso');
    } catch (err) {
      setErro('Erro ao atualizar agendamento.');
    } finally {
      setLoading(false);
    }
  };

  const selecionarServico = (servico) => {
    setServicoEscolhido(servico);
    setMensagens((prev) => [...prev, { remetente: 'usuario', texto: `${servico.nome} - R$ ${Number(servico.preco).toFixed(2)}` }]);
    adicionarMensagemBotComDelay(`Perfeito! Escolheu ${servico.nome}. Agora, selecione o profissional de sua preferência:`, 'barbeiro');
  };

  const selecionarBarbeiro = (barbeiro) => {
    setBarbeiroEscolhido(barbeiro);
    setMensagens((prev) => [...prev, { remetente: 'usuario', texto: barbeiro.nome }]);
    adicionarMensagemBotComDelay(`Ótima escolha! O atendimento será com ${barbeiro.nome}. Para qual data deseja agendar?`, 'data');
  };

  const selecionarHorario = (hora) => {
    setHoraEscolhida(hora);
    setMensagens((prev) => [...prev, { remetente: 'usuario', texto: hora }]);
    adicionarMensagemBotComDelay('Por favor, confira o resumo do seu agendamento abaixo antes de confirmar:', 'resumo');
  };

  const confirmarAgendamentoFinal = async () => {
    if (barbearia?.permite_agendamentos === false || datasBloqueadas.includes(dataEscolhida)) {
      setErro('Os agendamentos online estão pausados ou esta data está bloqueada.');
      return;
    }

    setLoading(true);
    try {
      const dataHoraIso = new Date(`${dataEscolhida}T${horaEscolhida}:00`).toISOString();
      await supabase.from('agendamentos').insert([{
        barbearia_id: barbeariaId,
        cliente_id: clienteId,
        barbeiro_id: barbeiroEscolhido.id,
        servico_id: servicoEscolhido.id,
        valor_total: servicoEscolhido.preco,
        data_hora: dataHoraIso,
        status: 'agendado',
        lido: false
      }]);

      await carregarDadosCliente(clienteId);
      setMensagens((prev) => [...prev, { remetente: 'usuario', texto: 'Confirmar Agendamento' }]);
      adicionarMensagemBotComDelay(`Tudo pronto! O seu agendamento foi confirmado com sucesso para ${dataEscolhida.split('-').reverse().join('/')} às ${horaEscolhida}. Aguardamos a sua visita!`, 'sucesso');
    } catch (err) {
      setErro('Erro ao concluir agendamento.');
    } finally {
      setLoading(false);
    }
  };

  const renderCartaoFidelidade = () => {
    const selos = dadosFidelidade?.selos_atuais || 0;
    const percentual = Math.min(100, (selos / metaSelos) * 100);
    const atingiuMeta = selos >= metaSelos;

    return (
      <div className={`p-4 rounded-3xl border backdrop-blur-xl space-y-3 shadow-lg ${isClean ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-stone-900 border-white/10 text-white'}`}>
        <div className={`flex items-center justify-between border-b pb-2.5 ${isClean ? 'border-slate-200' : 'border-white/10'}`}>
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center border ${isClean ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-500/20 text-amber-400 border-amber-500/40'}`}>
              <Award className="w-4 h-4" />
            </div>
            <span className="text-xs font-black uppercase tracking-wider">O seu Cartão Fidelidade</span>
          </div>
          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${atingiuMeta ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : isClean ? 'bg-slate-200 text-slate-700 border-slate-300' : 'bg-amber-500/20 text-amber-400 border-amber-500/40'}`}>
            {atingiuMeta ? '🎁 Resgate Disponível!' : `${selos} / ${metaSelos} Selos`}
          </span>
        </div>
        <div className="space-y-1.5">
          <div className={`w-full h-2.5 rounded-full overflow-hidden p-0.5 border ${isClean ? 'bg-slate-200 border-slate-300' : 'bg-stone-950 border-slate-800'}`}>
            <div className={`h-full rounded-full transition-all duration-500 ${atingiuMeta ? 'bg-emerald-400' : isClean ? 'bg-emerald-900' : 'bg-amber-400'}`} style={{ width: `${percentual}%` }}></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-medium">
            <span>Resgates: {dadosFidelidade?.total_resgates || 0}</span>
            <span>{atingiuMeta ? 'Parabéns! Ganhou um corte grátis' : `Faltam ${metaSelos - selos} selos`}</span>
          </div>
        </div>
        {atingiuMeta && (
          <button disabled={loading} onClick={handleResgatarPremioCliente} className={`w-full mt-2 py-2.5 rounded-xl font-black text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 ${isClean ? 'bg-emerald-900 hover:bg-emerald-950 text-white' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'}`}>
            <Gift className="w-4 h-4 text-emerald-400" />
            <span>Resgatar Corte Grátis Agora</span>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={`fixed inset-0 w-full h-[100dvh] flex flex-col items-center justify-between overflow-hidden m-0 p-0 pb-6 md:pb-0 ${estiloFundoGlobal}`}>
      <div className={`w-full h-full md:max-w-xl md:h-[90vh] md:my-auto flex flex-col overflow-hidden relative ${estiloFundoContainer}`}>
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-[3px] z-30" style={{ background: `linear-gradient(to right, transparent, ${corTema}, transparent)` }}></div>

        <div className={`shrink-0 z-20 backdrop-blur-xl border-b ${estiloHeader}`}>
          {/* Capa maior (ajustada de h-24 sm:h-28 para h-32 sm:h-40) */}
          <div className={`relative h-32 sm:h-40 w-full overflow-hidden ${isClean ? 'bg-slate-200' : 'bg-stone-900'}`}>
            {barbearia?.capa_url ? (
              <img src={barbearia.capa_url} alt="Capa" className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full flex items-center justify-center ${isClean ? 'bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 text-slate-500' : 'bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-stone-500'}`}>
                <span className="text-[10px] font-bold tracking-wider uppercase">Capa da Unidade</span>
              </div>
            )}
            <div className={`absolute inset-0 ${isClean ? 'bg-gradient-to-t from-white/95 via-white/40 to-transparent' : 'bg-gradient-to-t from-black/95 via-black/50 to-transparent'}`}></div>
          </div>

          {/* Foto de perfil maior (ajustada para w-16 h-16 sm:w-20 sm:h-20 e margem -mt-10) */}
          <div className="px-5 pb-3.5 pt-0 relative flex items-center gap-4 -mt-10 sm:-mt-12">
            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-1 shadow-2xl border-2 overflow-hidden flex items-center justify-center shrink-0 backdrop-blur-xl ${isClean ? 'bg-white border-slate-200 shadow-md' : 'bg-black border-white/30'}`}>
              {barbearia?.logo_url ? (
                <img src={barbearia.logo_url} alt={barbearia.nome} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-stone-800 to-black text-white rounded-xl flex items-center justify-center font-black text-lg">
                  {barbearia?.nome?.charAt(0) || 'B'}
                </div>
              )}
            </div>
            <div className="pt-2">
              <h2 className={`text-base sm:text-lg font-black tracking-tight ${isClean ? 'text-slate-900' : 'text-white'}`}>{barbearia?.nome}</h2>
              <p className="text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 mt-0.5" style={{ color: corTema }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: corTema }}></span>
                Assistente Virtual Inteligente
              </p>
            </div>
          </div>
        </div>

        <div ref={chatContainerRef} className="flex-1 p-4 sm:p-6 pb-16 space-y-4 overflow-y-auto overscroll-contain">
          {barbearia?.permite_agendamentos === false && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs flex items-center gap-2 backdrop-blur-md">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Atenção: Os agendamentos online estão pausados temporariamente pela barbearia.</span>
            </div>
          )}

          {mensagens.map((msg, index) => (
            <div key={index} className={`flex items-start gap-2.5 ${msg.remetente === 'usuario' ? 'flex-row-reverse' : 'flex-row'}`}>
              {msg.remetente === 'bot' && (
                <div className="w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 shadow-sm mt-1" style={{ backgroundColor: `${corTema}20`, borderColor: `${corTema}50`, color: corTema }}>
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}
              <div className={`p-3.5 rounded-3xl text-xs leading-relaxed max-w-[85%] backdrop-blur-md ${msg.remetente === 'usuario' ? 'text-white font-bold rounded-tr-sm shadow-lg' : estiloBotMsg}`} style={msg.remetente === 'usuario' ? { backgroundColor: corTema, boxShadow: `0 5px 20px ${corTema}40` } : {}}>
                {msg.texto}
              </div>
            </div>
          ))}

          {estaDigitando && (
            <div className="flex items-start gap-2.5 flex-row animate-fade-in">
              <div className="w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 shadow-sm mt-1" style={{ backgroundColor: `${corTema}20`, borderColor: `${corTema}50`, color: corTema }}>
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className={`p-4 rounded-3xl rounded-tl-sm border flex items-center gap-1.5 backdrop-blur-md shadow-inner ${isClean ? 'bg-slate-100 border-slate-200' : 'bg-stone-900 border-white/10'}`}>
                <div className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s]" style={{ backgroundColor: corTema }}></div>
                <div className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s]" style={{ backgroundColor: corTema }}></div>
                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: corTema }}></div>
              </div>
            </div>
          )}

          {clienteId && !estaDigitando && ['menu_inicial', 'gerenciar', 'servico'].includes(etapa) && renderCartaoFidelidade()}

          {etapa === 'menu_inicial' && !estaDigitando && (
            <div className="grid grid-cols-1 gap-2 pt-2">
              {barbearia?.permite_agendamentos !== false && (
                <button onClick={() => escolherOpcaoMenu('novo')} className="p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer backdrop-blur-md font-bold text-xs" style={{ backgroundColor: `${corTema}15`, borderColor: `${corTema}40`, color: isClean ? '#0f172a' : '#ffffff' }}>
                  <span>Fazer novo agendamento</span>
                  <ArrowRight className="w-4 h-4" style={{ color: corTema }} />
                </button>
              )}
              <button onClick={() => escolherOpcaoMenu('gerenciar')} className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer backdrop-blur-md font-bold text-xs ${isClean ? 'bg-slate-100 border-slate-200 text-slate-800' : 'bg-stone-900 border-white/10 text-white'}`}>
                <span>Ver / Gerenciar meus agendamentos</span>
                <CalendarIcon className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          )}

          {etapa === 'gerenciar' && !estaDigitando && (
            <div className="space-y-3 pt-2">
              {agendamentosCliente.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-2">Você não tem agendamentos ativos no momento.</p>
              ) : (
                agendamentosCliente.map((ag) => {
                  const dataFormatada = new Date(ag.data_hora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
                  return (
                    <div key={ag.id} className={`p-4 rounded-2xl border flex items-center justify-between gap-3 backdrop-blur-md ${isClean ? 'bg-slate-50 border-slate-200' : 'bg-stone-900 border-white/10'}`}>
                      <div>
                        <p className={`text-xs font-bold ${isClean ? 'text-slate-900' : 'text-white'}`}>{ag.servicos?.nome || 'Serviço'}</p>
                        <p className="text-[10px] font-medium" style={{ color: corTema }}>Profissional: {ag.barbeiros?.nome || 'Barbeiro'}</p>
                        <p className={`text-[10px] mt-0.5 ${isClean ? 'text-slate-600' : 'text-slate-300'}`}>📅 {dataFormatada}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => iniciarEdicao(ag)} className="px-3 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-500 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer">
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                        <button onClick={() => cancelarAgendamento(ag.id)} className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-500 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancelar</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
              {barbearia?.permite_agendamentos !== false && (
                <button onClick={() => { setEtapa('servico'); setMensagens((prev) => [...prev, { remetente: 'bot', texto: 'Perfeito, vamos prosseguir com o novo agendamento. Escolha o serviço:' }]); }} className="w-full py-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer mt-2" style={{ backgroundColor: `${corTema}20`, color: corTema, borderColor: `${corTema}40` }}>
                  Fazer novo agendamento
                </button>
              )}
            </div>
          )}

          {/* CALENDÁRIO COM FILTRO DE MÊS E DIAS ANTERIORES OCULTOS */}
          {(etapa === 'data' || etapa === 'editar_data') && !estaDigitando && (
            <div className={`p-5 rounded-3xl border backdrop-blur-xl space-y-4 shadow-xl ${isClean ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-stone-900 border-white/15 text-white'}`}>
              
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center shadow" style={{ backgroundColor: `${corTema}20`, color: corTema }}>
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider">Selecione o Dia</span>
                </div>

                {/* Navegador de Meses */}
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={voltarMes}
                    className="w-7 h-7 rounded-lg border flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
                    style={{ borderColor: `${corTema}50` }}
                  >
                    <ChevronLeft className="w-4 h-4" style={{ color: corTema }} />
                  </button>
                  <span className="text-xs font-black uppercase tracking-tight px-1">
                    {dataAtualNavegacao.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </span>
                  <button 
                    onClick={avancarMes}
                    className="w-7 h-7 rounded-lg border flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
                    style={{ borderColor: `${corTema}50` }}
                  >
                    <ChevronRight className="w-4 h-4" style={{ color: corTema }} />
                  </button>
                </div>
              </div>

              {/* Grade de Dias (Apenas de hoje em diante para o mês atual) */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto pr-1">
                {gerarDiasDoMes().map((diaObj) => {
                  const selecionado = dataEscolhida === diaObj.dataIso;
                  return (
                    <button
                      key={diaObj.dataIso}
                      disabled={diaObj.bloqueado}
                      onClick={() => confirmarDataModerna(diaObj.dataIso, diaObj.bloqueado)}
                      className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center transition-all ${
                        diaObj.bloqueado
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 opacity-40 cursor-not-allowed line-through'
                          : selecionado
                          ? 'text-white shadow-lg scale-105'
                          : isClean ? 'bg-white border-slate-200 hover:border-emerald-700 text-slate-800' : 'bg-stone-950 border-white/10 hover:border-white/30 text-white'
                      }`}
                      style={selecionado ? { backgroundColor: corTema, borderColor: corTema } : {}}
                    >
                      <span className="text-[10px] uppercase font-bold opacity-70">{diaObj.diaSemanaStr}</span>
                      <span className="text-lg font-black my-0.5">{diaObj.diaNum}</span>
                      <span className="text-[9px] uppercase font-semibold opacity-60">{diaObj.mesStr}</span>
                      {diaObj.bloqueado && <span className="text-[8px] mt-1 text-rose-500 font-bold no-underline">Fechado</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {etapa === 'editar_horario' && !estaDigitando && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
              {horariosDisponiveisAtuais.map((h) => {
                const ocupado = horariosOcupados.includes(h);
                return (
                  <button key={h} disabled={ocupado || loading} onClick={() => salvarEdicaoHorario(h)} className={`py-2.5 rounded-xl text-xs font-black border transition-all backdrop-blur-md ${ocupado ? 'bg-slate-500/10 text-slate-400 border-slate-200 line-through opacity-40 cursor-not-allowed' : isClean ? 'bg-slate-100 text-slate-800 border-slate-300 cursor-pointer hover:border-emerald-700' : 'bg-stone-900 text-white border-white/10 cursor-pointer hover:border-white/30'}`}>
                    {h}
                  </button>
                );
              })}
            </div>
          )}

          {etapa === 'servico' && !estaDigitando && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              {servicos.map((s) => (
                <button key={s.id} onClick={() => selecionarServico(s)} className={`p-4 rounded-3xl border text-left flex flex-col justify-between transition-all cursor-pointer backdrop-blur-xl group hover:scale-[1.02] shadow-lg ${isClean ? 'bg-slate-50 border-slate-200 hover:border-emerald-700' : 'bg-stone-900 border-white/10 hover:border-white/30'}`}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3 shadow-inner" style={{ backgroundColor: `${corTema}25`, color: corTema }}>
                    <Scissors className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={`text-xs font-extrabold tracking-tight ${isClean ? 'text-slate-900' : 'text-white'}`}>{s.nome}</p>
                    <p className={`text-[10px] mt-0.5 ${isClean ? 'text-slate-500' : 'text-slate-400'}`}>{s.duracao_minutos || 30} min</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Preço</span>
                    <span className="text-xs font-black" style={{ color: corTema }}>R$ {Number(s.preco).toFixed(2)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {etapa === 'barbeiro' && !estaDigitando && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              {barbeiros.map((b) => {
                const foto = b.foto || b.avatar || b.imagem;
                return (
                  <button key={b.id} onClick={() => selecionarBarbeiro(b)} className={`p-3.5 rounded-3xl border text-left flex flex-col items-center text-center transition-all cursor-pointer backdrop-blur-xl group hover:scale-[1.02] shadow-lg ${isClean ? 'bg-slate-50 border-slate-200 hover:border-emerald-700' : 'bg-stone-900 border-white/10 hover:border-white/30'}`}>
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 mb-3 shadow-2xl relative" style={{ borderColor: `${corTema}66` }}>
                      {foto ? (
                        <img src={foto} alt={b.nome} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full text-white flex items-center justify-center font-black text-lg" style={{ backgroundColor: corTema }}>
                          {b.nome?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <p className={`text-xs font-black tracking-tight line-clamp-1 ${isClean ? 'text-slate-900' : 'text-white'}`}>{b.nome}</p>
                    <span className="text-[9px] font-semibold mt-0.5 px-2 py-0.5 rounded-full border" style={{ backgroundColor: `${corTema}15`, color: corTema, borderColor: `${corTema}33` }}>
                      Profissional
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {etapa === 'horario' && !estaDigitando && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
              {horariosDisponiveisAtuais.length === 0 ? (
                <p className="text-xs text-rose-500 font-semibold italic text-center col-span-full py-4">⚠️ Esta data está bloqueada (Feriado ou Folga).</p>
              ) : (
                horariosDisponiveisAtuais.map((h) => {
                  const ocupado = horariosOcupados.includes(h);
                  const selecionado = horaEscolhida === h;
                  return (
                    <button
                      key={h}
                      disabled={ocupado || loading}
                      onClick={() => selecionarHorario(h)}
                      className={`py-2.5 rounded-xl text-xs font-black border transition-all backdrop-blur-md ${
                        ocupado
                          ? 'bg-slate-500/10 text-slate-400 border-slate-200 line-through opacity-40 cursor-not-allowed'
                          : selecionado
                          ? 'text-white shadow-lg scale-105'
                          : isClean ? 'bg-slate-100 text-slate-800 border-slate-300 cursor-pointer hover:border-emerald-700' : 'bg-stone-900 text-white border-white/10 cursor-pointer hover:border-white/30'
                      }`}
                      style={selecionado ? { backgroundColor: corTema, borderColor: corTema } : {}}
                    >
                      {h}
                    </button>
                  );
                })
              )}
            </div>
          )}

          {etapa === 'resumo' && !estaDigitando && (
            <div className={`p-4 rounded-2xl border space-y-2.5 backdrop-blur-md mt-2 ${isClean ? 'bg-slate-50 border-emerald-700/40 text-slate-800' : 'bg-stone-900 border-emerald-500/40 text-slate-200'}`} style={{ borderColor: `${corTema}66` }}>
              <h4 className="text-xs font-black uppercase tracking-wider" style={{ color: corTema }}>Resumo do Agendamento</h4>
              <div className="space-y-1 text-xs">
                <p>✂️ <strong>Serviço:</strong> {servicoEscolhido?.nome} (R$ {Number(servicoEscolhido?.preco || 0).toFixed(2)})</p>
                <p>👤 <strong>Profissional:</strong> {barbeiroEscolhido?.nome}</p>
                <p>📅 <strong>Data:</strong> {dataEscolhida.split('-').reverse().join('/')}</p>
                <p>⏰ <strong>Horário:</strong> {horaEscolhida}</p>
                <p>👤 <strong>Cliente:</strong> {nome} ({telefone})</p>
              </div>
              <button disabled={loading} onClick={confirmarAgendamentoFinal} className="w-full mt-3 py-3 rounded-xl text-white font-black text-xs uppercase tracking-widest cursor-pointer shadow-lg hover:brightness-110 transition-all" style={{ backgroundColor: corTema }}>
                {loading ? 'A confirmar...' : 'Confirmar Agendamento'}
              </button>
            </div>
          )}

          {etapa === 'sucesso' && !estaDigitando && (
            <div className="pt-2 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl text-white flex items-center justify-center mx-auto shadow-lg" style={{ backgroundColor: corTema }}>
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="grid grid-cols-1 gap-2 pt-2">
                {barbearia?.permite_agendamentos !== false && (
                  <button onClick={() => { setEtapa('servico'); setMensagens((prev) => [...prev, { remetente: 'bot', texto: 'Escolha o serviço para o novo agendamento:' }]); }} className="w-full py-3 rounded-2xl text-white font-bold text-xs transition-all cursor-pointer shadow-md" style={{ backgroundColor: corTema }}>
                    Fazer Novo Agendamento
                  </button>
                )}
                <button onClick={() => { carregarDadosCliente(clienteId); setEtapa('gerenciar'); }} className={`w-full py-3 rounded-2xl font-bold text-xs transition-all cursor-pointer border ${isClean ? 'bg-slate-200 border-slate-300 text-slate-800' : 'bg-stone-900 text-white border-white/10'}`}>
                  Ver Meus Agendamentos e Selos
                </button>
              </div>
            </div>
          )}
        </div>

        {erro && (
          <div className="mx-4 mb-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2 backdrop-blur-md shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {(etapa === 'telefone' || etapa === 'nome') && !estaDigitando && (
          <form onSubmit={handleEnviarResposta} className={`p-4 sm:p-5 pb-8 sm:pb-5 border-t backdrop-blur-xl flex items-center gap-2 shrink-0 ${isClean ? 'bg-white/95 border-slate-200' : 'bg-[#050507]/95 border-white/10'}`}>
            <input
              type={etapa === 'telefone' ? 'tel' : 'text'}
              placeholder={etapa === 'telefone' ? 'Digite seu celular...' : 'Digite seu nome completo...'}
              value={inputTexto}
              onChange={(e) => setInputTexto(e.target.value)}
              className={`w-full rounded-2xl px-4 py-3.5 text-xs focus:outline-none shadow-inner ${estiloInput}`}
            />
            <button type="submit" className="w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-lg shrink-0 cursor-pointer" style={{ backgroundColor: corTema }}>
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}

      </div>
    </div>
  );
}