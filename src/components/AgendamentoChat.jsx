'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, CheckCircle2, AlertCircle, ArrowRight, Calendar as CalendarIcon, XCircle, Edit3, Scissors, User, Award, Gift, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { enviarMensagemWhatsApp } from '@/lib/whatsapp';
import { resolverTemaBarbearia } from '@/lib/temaAgendamento';
import { renderizarMensagemConfirmacao } from '@/lib/mensagemWhatsapp';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://agendaestilo.com.br';

function barbeiroExecutaServico(barbeiro, servicoId) {
  if (!servicoId || !barbeiro) return true;
  if (barbeiro.faz_todos_servicos !== false) return true;
  if (!Array.isArray(barbeiro.servicos_ids) || barbeiro.servicos_ids.length === 0) {
    return true;
  }
  return barbeiro.servicos_ids.map(String).includes(String(servicoId));
}

function normalizarDataIso(valor) {
  if (!valor) return '';
  return String(valor).split('T')[0];
}

export default function AgendamentoChat({ barbeariaId }) {
  const [barbearia, setBarbearia] = useState(null);
  const [servicos, setServicos] = useState([]);
  const [barbeiros, setBarbeiros] = useState([]);
  const [horariosOcupados, setHorariosOcupados] = useState([]);
  const [bloqueiosAgenda, setBloqueiosAgenda] = useState([]);

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

  const tema = resolverTemaBarbearia(barbearia);
  const corTema = tema.cor_primaria || '#10b981';
  const corSecundaria = tema.cor_texto_secundario || '#94a3b8';

  const barbeirosDisponiveis = servicoEscolhido
    ? barbeiros.filter((b) => barbeiroExecutaServico(b, servicoEscolhido.id))
    : barbeiros;

  const getBarbeiroAtivoId = () => {
    if (etapa.startsWith('editar')) {
      return agendamentoEmEdicao?.barbeiro_id || barbeiroEscolhido?.id || null;
    }
    return barbeiroEscolhido?.id || null;
  };

  const isDataBloqueadaParaProfissional = (dataIso, barbId) => {
    const dataFmt = normalizarDataIso(dataIso);
    if (!dataFmt) return false;

    return bloqueiosAgenda.some((b) => {
      const dataBloq = normalizarDataIso(b.data_bloqueio);
      if (dataBloq !== dataFmt) return false;
      if (!b.barbeiro_id) return true;
      if (barbId && String(b.barbeiro_id) === String(barbId)) return true;
      return false;
    });
  };

  const getEstiloBotao3D = (ativo = false) => ({
    background: ativo ? tema.botao_ativo_estilo : tema.botao_estilo,
    color: tema.cor_texto_usuario,
    boxShadow: ativo ? tema.sombra_botao_ativa : tema.sombra_botao,
    borderColor: tema.borda_brilho_superior || 'rgba(255,255,255,0.45)',
  });

  const formatarTelefoneWhatsApp = (telBruto) => {
    const apenasNumeros = telBruto.replace(/\D/g, '');
    if (apenasNumeros.startsWith('55') && apenasNumeros.length >= 12) {
      return apenasNumeros;
    }
    return `55${apenasNumeros}`;
  };

  const gerarDiasDoMes = () => {
    const ano = dataAtualNavegacao.getFullYear();
    const mes = dataAtualNavegacao.getMonth();

    const totalDias = new Date(ano, mes + 1, 0).getDate();
    const dias = [];
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const isMesAtual = hoje.getFullYear() === ano && hoje.getMonth() === mes;
    const diaInicio = isMesAtual ? hoje.getDate() : 1;

    const barbIdAtivo = getBarbeiroAtivoId();
    const barbeiroAtivo = barbeiros.find((b) => String(b.id) === String(barbIdAtivo));

    for (let i = diaInicio; i <= totalDias; i++) {
      const d = new Date(ano, mes, i);

      const anoIso = d.getFullYear();
      const mesIso = String(d.getMonth() + 1).padStart(2, '0');
      const diaIso = String(d.getDate()).padStart(2, '0');
      const dataIso = `${anoIso}-${mesIso}-${diaIso}`;

      const diasSemanaMap = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
      const nomeDiaSemana = diasSemanaMap[d.getDay()];

      const diasSemanaComAcento = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
      const nomeDiaComAcento = diasSemanaComAcento[d.getDay()];

      const checarDiaAtivo = (configObj) => {
        if (!configObj) return undefined;
        const conf = configObj[nomeDiaSemana] !== undefined ? configObj[nomeDiaSemana] : configObj[nomeDiaComAcento];
        if (conf === undefined) return undefined;

        if (typeof conf === 'boolean') return conf;
        if (typeof conf === 'object' && conf !== null) {
          if (conf.ativo !== undefined) return conf.ativo !== false;
          if (conf.trabalha !== undefined) return conf.trabalha !== false;
        }
        return true;
      };

      let diaAtivo = true;
      const ativoBarbeiro = checarDiaAtivo(barbeiroAtivo?.horarios_trabalho);

      if (ativoBarbeiro !== undefined) {
        diaAtivo = ativoBarbeiro;
      } else {
        const ativoBarbearia = checarDiaAtivo(barbearia?.horarios);
        if (ativoBarbearia !== undefined) {
          diaAtivo = ativoBarbearia;
        } else if (d.getDay() === 0 || d.getDay() === 6) {
          diaAtivo = false;
        }
      }

      const estaBloqueadoNoBanco = isDataBloqueadaParaProfissional(dataIso, barbIdAtivo);
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
    if (!dataStr) return [];

    const dataFmt = normalizarDataIso(dataStr);
    const barbIdAtivo = getBarbeiroAtivoId();

    if (isDataBloqueadaParaProfissional(dataFmt, barbIdAtivo)) {
      return [];
    }

    const barbeiroAtivo = barbeiros.find((b) => String(b.id) === String(barbIdAtivo));

    const [ano, mes, dia] = dataFmt.split('-').map(Number);
    const dateObj = new Date(ano, mes - 1, dia);
    const diasSemanaMap = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const nomeDia = diasSemanaMap[dateObj.getDay()];

    const configHorariosBarbeiro = barbeiroAtivo?.horarios_trabalho?.[nomeDia];

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
      const configGeral = barbearia?.horarios?.[nomeDia];
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

    const antecedenciaMinima = barbearia?.antecedencia_minima_minutos ?? 30;
    const agora = new Date();
    const dataAtualIso = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;
    const isHoje = dataFmt === dataAtualIso;
    const minutosAtuaisDoDia = agora.getHours() * 60 + agora.getMinutes();
    const limiteMinutosComAntecedencia = minutosAtuaisDoDia + antecedenciaMinima;

    for (let min = minAbertura; min < minFechamento; min += intervaloMinutos) {
      if (minPausaInicio !== null && minPausaFim !== null) {
        if (min >= minPausaInicio && min < minPausaFim) {
          continue;
        }
      }

      if (isHoje && min < limiteMinutosComAntecedencia) {
        continue;
      }

      horariosGerados.push(paraHoraStr(min));
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
          supabase.from('bloqueios_agenda').select('data_bloqueio, barbeiro_id').eq('barbearia_id', barbeariaId)
        ]);

        setServicos(resServicos.data || []);
        setBarbeiros(resBarbeiros.data || []);
        setBloqueiosAgenda(resBloqueios.data || []);

        adicionarMensagemBotComDelay('Olá! Seja muito bem-vindo. Para começarmos, por favor, informe o seu celular/WhatsApp:');
      } catch (err) {
        console.error('Erro ao carregar dados do chat:', err);
      }
    }

    if (barbeariaId) carregarDados();
  }, [barbeariaId]);

  useEffect(() => {
    async function buscarOcupados() {
      const barbIdParaConsulta = getBarbeiroAtivoId();
      if (!barbIdParaConsulta || !dataEscolhida) return;

      try {
        const dataFmt = normalizarDataIso(dataEscolhida);
        const inicio = `${dataFmt}T00:00:00`;
        const fim = `${dataFmt}T23:59:59`;

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
        .order('data_hora', { ascending: true });

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

          const temFidelidade = barbearia?.fidelidade_ativa !== false;
          const msgTexto = temFidelidade
            ? `Que bom vê-lo novamente, ${cliExistente.nome}! Verificamos os seus agendamentos e o seu cartão fidelidade abaixo:`
            : `Que bom vê-lo novamente, ${cliExistente.nome}! Verificamos os seus agendamentos abaixo:`;

          if (agsAtivos.length > 0) {
            adicionarMensagemBotComDelay(msgTexto, 'menu_inicial');
          } else {
            if (barbearia?.permite_agendamentos === false) {
              adicionarMensagemBotComDelay(`Que bom vê-lo novamente, ${cliExistente.nome}! No momento, os agendamentos online estão pausados pela barbearia.`, 'menu_inicial');
            } else {
              const msgNovo = temFidelidade
                ? `Que bom vê-lo novamente, ${cliExistente.nome}! Confira também o seu cartão fidelidade e escolha o serviço desejado:`
                : `Que bom vê-lo novamente, ${cliExistente.nome}! Escolha o serviço desejado:`;
              adicionarMensagemBotComDelay(msgNovo, 'servico');
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
      const textoOpcao = barbearia?.fidelidade_ativa !== false ? 'Ver / Gerenciar meus agendamentos e selos' : 'Ver / Gerenciar meus agendamentos';
      setMensagens((prev) => [...prev, { remetente: 'usuario', texto: textoOpcao }]);
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
    const dataFmt = normalizarDataIso(dataSelecionada);
    const barbIdAtivo = getBarbeiroAtivoId();
    if (bloqueado || isDataBloqueadaParaProfissional(dataFmt, barbIdAtivo)) {
      setErro('⚠️ Esta data está bloqueada para este profissional ou o estabelecimento está fechado.');
      return;
    }
    setErro(null);
    setDataEscolhida(dataFmt);
    const dataExibicao = dataFmt.split('-').reverse().join('/');
    setMensagens((prev) => [...prev, { remetente: 'usuario', texto: dataExibicao }]);

    if (etapa.startsWith('editar')) {
      adicionarMensagemBotComDelay('Agora, selecione o novo horário disponível:', 'editar_horario');
    } else {
      adicionarMensagemBotComDelay('Data definida. Escolha um horário disponível:', 'horario');
    }
  };

  const salvarEdicaoHorario = async (hora) => {
    const dataFmt = normalizarDataIso(dataEscolhida);
    const barbIdAtivo = getBarbeiroAtivoId();
    if (isDataBloqueadaParaProfissional(dataFmt, barbIdAtivo)) {
      setErro('Esta data está bloqueada para este profissional.');
      return;
    }

    setLoading(true);
    try {
      const dataHoraIso = new Date(`${dataFmt}T${hora}:00`).toISOString();
      await supabase.from('agendamentos').update({ data_hora: dataHoraIso }).eq('id', agendamentoEmEdicao.id);
      await carregarDadosCliente(clienteId);
      setMensagens((prev) => [...prev, { remetente: 'usuario', texto: hora }]);
      adicionarMensagemBotComDelay(`Agendamento atualizado com sucesso para ${dataFmt.split('-').reverse().join('/')} às ${hora}!`, 'sucesso');
    } catch (err) {
      setErro('Erro ao atualizar agendamento.');
    } finally {
      setLoading(false);
    }
  };

  const selecionarServico = (servico) => {
    setServicoEscolhido(servico);
    setBarbeiroEscolhido(null);
    setDataEscolhida('');
    setHoraEscolhida('');
    setMensagens((prev) => [...prev, { remetente: 'usuario', texto: `${servico.nome} - R$ ${Number(servico.preco).toFixed(2)}` }]);
    adicionarMensagemBotComDelay(`Perfeito! Escolheu ${servico.nome}. Agora, selecione o profissional habilitado para este serviço:`, 'barbeiro');
  };

  const selecionarBarbeiro = (barbeiro) => {
    setBarbeiroEscolhido(barbeiro);
    setDataEscolhida('');
    setHoraEscolhida('');
    setMensagens((prev) => [...prev, { remetente: 'usuario', texto: barbeiro.nome }]);
    adicionarMensagemBotComDelay(`Ótima escolha! O atendimento será com ${barbeiro.nome}. Para qual data deseja agendar?`, 'data');
  };

  const selecionarHorario = (hora) => {
    setHoraEscolhida(hora);
    setMensagens((prev) => [...prev, { remetente: 'usuario', texto: hora }]);
    adicionarMensagemBotComDelay('Por favor, confira o resumo do seu agendamento abaixo antes de confirmar:', 'resumo');
  };

  const confirmarAgendamentoFinal = async () => {
    const dataFmt = normalizarDataIso(dataEscolhida);
    const barbIdAtivo = getBarbeiroAtivoId();
    if (barbearia?.permite_agendamentos === false || isDataBloqueadaParaProfissional(dataFmt, barbIdAtivo)) {
      setErro('Os agendamentos online estão pausados ou esta data está bloqueada para o profissional selecionado.');
      return;
    }

    setLoading(true);
    try {
      const dataHoraIso = new Date(`${dataFmt}T${horaEscolhida}:00`).toISOString();

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

      try {
        const telefoneFormatado = formatarTelefoneWhatsApp(telefone);
        const dataFormatadaBR = dataFmt.split('-').reverse().join('/');
        const nomeEstabelecimento = barbearia?.nome || 'AgendaEstilo';
        const valorFormatadoBR = `R$ ${Number(servicoEscolhido?.preco || 0).toFixed(2).replace('.', ',')}`;

        const mensagemPersonalizada = renderizarMensagemConfirmacao(
          barbearia?.mensagem_whatsapp_confirmacao,
          {
            cliente: nome,
            local: nomeEstabelecimento,
            servico: servicoEscolhido.nome,
            profissional: barbeiroEscolhido?.nome || 'Profissional',
            data: dataFormatadaBR,
            hora: horaEscolhida,
            valor: valorFormatadoBR,
          }
        );

        await enviarMensagemWhatsApp({
          phone: telefoneFormatado,
          nomeCliente: nome,
          servico: servicoEscolhido.nome,
          data: dataFormatadaBR,
          hora: horaEscolhida,
          nomeBarbearia: nomeEstabelecimento,
          slug: barbearia?.slug,
          mensagem: mensagemPersonalizada,
        });
      } catch (whatsErr) {
        console.error('Erro ao enviar mensagem via WhatsApp:', whatsErr);
      }

      try {
        const { data: barbData } = await supabase
          .from('barbearias')
          .select('fcm_token')
          .eq('id', barbeariaId)
          .single();

        if (barbData?.fcm_token) {
          await fetch(`${API_BASE_URL}/api/notificar-agendamento`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fcmToken: barbData.fcm_token,
              titulo: '📅 Novo Agendamento!',
              corpo: `${nome} agendou ${servicoEscolhido.nome} para o dia ${dataFmt.split('-').reverse().join('/')} às ${horaEscolhida}.`
            })
          });
        }
      } catch (pushErr) {
        console.error('Erro ao enviar Push para o servidor:', pushErr);
      }

      await carregarDadosCliente(clienteId);
      setMensagens((prev) => [...prev, { remetente: 'usuario', texto: 'Confirmar Agendamento' }]);
      adicionarMensagemBotComDelay(`Tudo pronto! O seu agendamento foi confirmado com sucesso para ${dataFmt.split('-').reverse().join('/')} às ${horaEscolhida}. Aguardamos a sua visita!`, 'sucesso');
    } catch (err) {
      setErro('Erro ao concluir agendamento.');
    } finally {
      setLoading(false);
    }
  };

  const renderCartaoFidelidade = () => {
    if (barbearia?.fidelidade_ativa === false) return null;

    const selos = dadosFidelidade?.selos_atuais || 0;
    const percentual = Math.min(100, (selos / metaSelos) * 100);
    const atingiuMeta = selos >= metaSelos;

    return (
      <div
        className="p-4 rounded-3xl border backdrop-blur-xl space-y-3 shadow-lg"
        style={{
          backgroundColor: tema.cor_card,
          borderColor: tema.cor_borda,
          color: tema.cor_texto_geral,
        }}
      >
        <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: tema.cor_borda }}>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full border flex items-center justify-center shadow-inner"
              style={getEstiloBotao3D(false)}
            >
              <Award className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className="text-xs font-black uppercase tracking-wider">O seu Cartão Fidelidade</span>
          </div>
          <span
            className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border"
            style={{ backgroundColor: `${corTema}20`, borderColor: `${corTema}40`, color: corTema }}
          >
            {atingiuMeta ? '🎁 Resgate Disponível!' : `${selos} / ${metaSelos} Selos`}
          </span>
        </div>
        <div className="space-y-1.5">
          <div className="w-full h-2.5 rounded-full overflow-hidden p-0.5 border bg-black/25" style={{ borderColor: tema.cor_borda }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${percentual}%`, background: tema.botao_estilo }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-medium" style={{ color: corSecundaria }}>
            <span>Resgates: {dadosFidelidade?.total_resgates || 0}</span>
            <span>{atingiuMeta ? 'Parabéns! Ganhou um corte grátis' : `Faltam ${metaSelos - selos} selos`}</span>
          </div>
        </div>
        {atingiuMeta && (
          <button
            disabled={loading}
            onClick={handleResgatarPremioCliente}
            style={getEstiloBotao3D(false)}
            className="w-full mt-2 py-2.5 rounded-full border font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Gift className="w-4 h-4" />
            <span>Resgatar Corte Grátis Agora</span>
          </button>
        )}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] flex flex-col items-center justify-between overflow-hidden m-0 p-0 pb-6 md:pb-0"
      style={{
        background: tema.fundo_estilo || tema.cor_fundo,
        color: tema.cor_texto_geral,
        fontFamily: tema.fonte,
      }}
    >
      <div
        className="w-full h-full md:max-w-xl md:h-[90vh] md:my-auto flex flex-col overflow-hidden relative md:border md:shadow-2xl"
        style={{
          backgroundColor: tema.cor_container,
          color: tema.cor_texto_geral,
          borderColor: tema.cor_borda,
          borderRadius: tema.raio_borda,
        }}
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-[3px] z-30"
          style={{ background: `linear-gradient(to right, transparent, ${corTema}, transparent)` }}
        />

        <div
          className="shrink-0 z-20 backdrop-blur-xl border-b"
          style={{
            backgroundColor: `${tema.cor_container}F2`,
            borderColor: tema.cor_borda,
            color: tema.cor_texto_geral,
          }}
        >
          <div className="relative h-40 sm:h-48 w-full overflow-hidden">
            {barbearia?.capa_url ? (
              <img src={barbearia.capa_url} alt="Capa" className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ backgroundColor: tema.cor_card, color: corSecundaria }}
              >
                <span className="text-[10px] font-bold tracking-wider uppercase">Capa da Unidade</span>
              </div>
            )}
          </div>

          <div className="px-5 pb-4 pt-0 relative flex items-center gap-4 -mt-12 sm:-mt-14">
            <div
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl p-1.5 shadow-2xl border-2 overflow-hidden flex items-center justify-center shrink-0 backdrop-blur-xl"
              style={{ backgroundColor: tema.cor_card, borderColor: tema.cor_borda }}
            >
              {barbearia?.logo_url ? (
                <img src={barbearia.logo_url} alt={barbearia.nome} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <div
                  className="w-full h-full rounded-2xl flex items-center justify-center font-black text-xl border"
                  style={getEstiloBotao3D(false)}
                >
                  {barbearia?.nome?.charAt(0) || 'B'}
                </div>
              )}
            </div>
            <div className="pt-3">
              <h2 className="text-base sm:text-lg font-black tracking-tight" style={{ color: tema.cor_texto_geral }}>
                {barbearia?.nome}
              </h2>
              <p className="text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 mt-0.5" style={{ color: corTema }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: corTema }} />
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
                <div
                  className="w-7 h-7 rounded-full border flex items-center justify-center shrink-0 mt-1"
                  style={getEstiloBotao3D(false)}
                >
                  <Bot className="w-3.5 h-3.5 stroke-[2.2]" />
                </div>
              )}
              <div
                className={`p-3.5 rounded-3xl text-xs leading-relaxed max-w-[85%] backdrop-blur-md ${
                  msg.remetente === 'usuario' ? 'font-bold rounded-tr-sm border' : 'border shadow-sm'
                }`}
                style={
                  msg.remetente === 'usuario'
                    ? getEstiloBotao3D(false)
                    : {
                        backgroundColor: tema.cor_balao_bot,
                        color: tema.cor_texto_bot,
                        borderColor: tema.cor_borda,
                      }
                }
              >
                {msg.texto}
              </div>
            </div>
          ))}

          {estaDigitando && (
            <div className="flex items-start gap-2.5 flex-row animate-fade-in">
              <div
                className="w-7 h-7 rounded-full border flex items-center justify-center shrink-0 mt-1"
                style={getEstiloBotao3D(false)}
              >
                <Bot className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
              <div
                className="p-4 rounded-3xl rounded-tl-sm border flex items-center gap-1.5 backdrop-blur-md shadow-inner"
                style={{ backgroundColor: tema.cor_balao_bot, borderColor: tema.cor_borda }}
              >
                <div className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s]" style={{ backgroundColor: corTema }} />
                <div className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s]" style={{ backgroundColor: corTema }} />
                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: corTema }} />
              </div>
            </div>
          )}

          {clienteId && !estaDigitando && ['menu_inicial', 'gerenciar', 'servico'].includes(etapa) && renderCartaoFidelidade()}

          {etapa === 'menu_inicial' && !estaDigitando && (
            <div className="grid grid-cols-1 gap-2.5 pt-2">
              {barbearia?.permite_agendamentos !== false && (
                <button
                  onClick={() => escolherOpcaoMenu('novo')}
                  style={getEstiloBotao3D(false)}
                  className="p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer font-black text-xs active:scale-98"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-black/15 flex items-center justify-center">
                      <Scissors className="w-3.5 h-3.5" />
                    </span>
                    <span>Fazer novo agendamento</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => escolherOpcaoMenu('gerenciar')}
                className="p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer backdrop-blur-md font-bold text-xs active:scale-98"
                style={{
                  backgroundColor: tema.cor_card,
                  borderColor: tema.cor_borda,
                  color: tema.cor_texto_geral,
                }}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-7 h-7 rounded-full border flex items-center justify-center"
                    style={getEstiloBotao3D(false)}
                  >
                    <CalendarIcon className="w-3.5 h-3.5" />
                  </span>
                  <span>{barbearia?.fidelidade_ativa !== false ? 'Ver / Gerenciar meus agendamentos e selos' : 'Ver / Gerenciar meus agendamentos'}</span>
                </div>
                <ArrowRight className="w-4 h-4" style={{ color: corSecundaria }} />
              </button>
            </div>
          )}

          {etapa === 'gerenciar' && !estaDigitando && (
            <div className="space-y-3 pt-2">
              {agendamentosCliente.length === 0 ? (
                <p className="text-xs italic text-center py-2" style={{ color: corSecundaria }}>
                  Você não tem agendamentos ativos no momento.
                </p>
              ) : (
                agendamentosCliente.map((ag) => {
                  const dataFormatada = new Date(ag.data_hora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
                  const isConcluido = ag.status === 'concluido';

                  return (
                    <div
                      key={ag.id}
                      className="p-4 rounded-2xl border flex items-center justify-between gap-3 backdrop-blur-md"
                      style={{ backgroundColor: tema.cor_card, borderColor: tema.cor_borda }}
                    >
                      <div>
                        <p className="text-xs font-bold" style={{ color: tema.cor_texto_geral }}>{ag.servicos?.nome || 'Serviço'}</p>
                        <p className="text-[10px] font-medium" style={{ color: corTema }}>Profissional: {ag.barbeiros?.nome || 'Barbeiro'}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: corSecundaria }}>📅 {dataFormatada}</p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                        {isConcluido ? (
                          <span className="text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm">
                            Concluído
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => iniciarEdicao(ag)}
                              style={getEstiloBotao3D(false)}
                              className="px-3 py-2 rounded-full border text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </button>
                            <button onClick={() => cancelarAgendamento(ag.id)} className="px-3 py-2 rounded-full bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-500 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Cancelar</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              {barbearia?.permite_agendamentos !== false && (
                <button
                  onClick={() => {
                    setEtapa('servico');
                    setMensagens((prev) => [...prev, { remetente: 'bot', texto: 'Perfeito, vamos prosseguir com o novo agendamento. Escolha o serviço:' }]);
                  }}
                  style={getEstiloBotao3D(false)}
                  className="w-full py-3 rounded-full border text-xs font-black transition-all cursor-pointer mt-2 active:scale-98"
                >
                  Fazer novo agendamento
                </button>
              )}
            </div>
          )}

          {(etapa === 'data' || etapa === 'editar_data') && !estaDigitando && (
            <div
              className="p-5 rounded-3xl border backdrop-blur-xl space-y-4 shadow-xl"
              style={{ backgroundColor: tema.cor_card, borderColor: tema.cor_borda, color: tema.cor_texto_geral }}
            >
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: tema.cor_borda }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full border flex items-center justify-center" style={getEstiloBotao3D(false)}>
                    <CalendarIcon className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider">Selecione o Dia</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={voltarMes}
                    style={getEstiloBotao3D(false)}
                    className="w-7 h-7 rounded-full border flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4 stroke-[2.2]" />
                  </button>
                  <span className="text-xs font-black uppercase tracking-tight px-1">
                    {dataAtualNavegacao.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </span>
                  <button
                    onClick={avancarMes}
                    style={getEstiloBotao3D(false)}
                    className="w-7 h-7 rounded-full border flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  >
                    <ChevronRight className="w-4 h-4 stroke-[2.2]" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto pr-1">
                {gerarDiasDoMes().map((diaObj) => {
                  const selecionado = dataEscolhida === diaObj.dataIso;
                  return (
                    <button
                      key={diaObj.dataIso}
                      disabled={diaObj.bloqueado}
                      onClick={() => confirmarDataModerna(diaObj.dataIso, diaObj.bloqueado)}
                      style={!diaObj.bloqueado ? getEstiloBotao3D(selecionado) : undefined}
                      className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center transition-all ${
                        diaObj.bloqueado
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 opacity-40 cursor-not-allowed line-through'
                          : selecionado
                          ? 'scale-[1.03] translate-y-[1px] cursor-pointer'
                          : 'cursor-pointer hover:brightness-105'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold opacity-80">{diaObj.diaSemanaStr}</span>
                      <span className="text-lg font-black my-0.5">{diaObj.diaNum}</span>
                      <span className="text-[9px] uppercase font-semibold opacity-75">{diaObj.mesStr}</span>
                      {diaObj.bloqueado && <span className="text-[8px] mt-1 text-rose-500 font-bold no-underline">Fechado</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {etapa === 'editar_horario' && !estaDigitando && (
            <div className="space-y-3 pt-2">
              {horariosDisponiveisAtuais.filter(h => !horariosOcupados.includes(h)).length === 0 ? (
                <div
                  className="p-5 rounded-3xl border backdrop-blur-xl space-y-4 shadow-xl"
                  style={{ backgroundColor: tema.cor_card, borderColor: tema.cor_borda, color: tema.cor_texto_geral }}
                >
                  <div className="flex items-center gap-3 pb-3 border-b border-rose-500/20">
                    <div className="w-9 h-9 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-rose-500 uppercase tracking-wider">Horários Indisponíveis</h4>
                      <p className="text-[11px] font-medium leading-tight mt-0.5" style={{ color: corSecundaria }}>
                        Nenhum horário livre nesta data (agenda cheia, estabelecimento fechado ou antecedência mínima atingida).
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      onClick={() => {
                        setDataEscolhida('');
                        setEtapa('editar_data');
                      }}
                      style={getEstiloBotao3D(false)}
                      className="w-full py-3.5 px-4 rounded-2xl border text-xs font-black transition-all cursor-pointer flex items-center justify-between active:scale-98"
                    >
                      <span className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        <span>Escolher outra data</span>
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {horariosDisponiveisAtuais
                    .filter(h => !horariosOcupados.includes(h))
                    .map((h) => (
                      <button
                        key={h}
                        disabled={loading}
                        onClick={() => salvarEdicaoHorario(h)}
                        style={getEstiloBotao3D(false)}
                        className="py-2.5 rounded-xl text-xs font-black border transition-all cursor-pointer active:scale-95"
                      >
                        {h}
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}

          {etapa === 'servico' && !estaDigitando && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              {servicos.map((s) => {
                const isSelected = servicoEscolhido?.id === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => selecionarServico(s)}
                    style={getEstiloBotao3D(isSelected)}
                    className="p-4 rounded-3xl border text-left flex flex-col justify-between transition-all cursor-pointer group hover:scale-[1.02] active:scale-98"
                  >
                    <div className="w-8 h-8 rounded-full bg-black/15 flex items-center justify-center mb-3">
                      <Scissors className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black tracking-tight">{s.nome}</p>
                      <p className="text-[10px] mt-0.5 opacity-80">{s.duracao_minutos || 30} min</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-black/15 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase opacity-75">Preço</span>
                      <span className="text-xs font-black">R$ {Number(s.preco).toFixed(2)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {etapa === 'barbeiro' && !estaDigitando && (
            <div className="space-y-2.5 pt-2">
              {barbeirosDisponiveis.length === 0 ? (
                <div
                  className="p-4 rounded-2xl border text-center space-y-2"
                  style={{ backgroundColor: tema.cor_card, borderColor: tema.cor_borda }}
                >
                  <p className="text-xs font-bold">Nenhum profissional disponível para este serviço no momento.</p>
                  <button
                    onClick={() => {
                      setServicoEscolhido(null);
                      setEtapa('servico');
                    }}
                    style={getEstiloBotao3D(false)}
                    className="px-4 py-2 rounded-full border text-xs font-black cursor-pointer"
                  >
                    Escolher outro serviço
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {barbeirosDisponiveis.map((b) => {
                    const isSelected = barbeiroEscolhido?.id === b.id;
                    const foto = b.foto || b.avatar || b.imagem;
                    return (
                      <button
                        key={b.id}
                        onClick={() => selecionarBarbeiro(b)}
                        style={getEstiloBotao3D(isSelected)}
                        className="p-3.5 rounded-3xl border text-left flex flex-col items-center text-center transition-all cursor-pointer group hover:scale-[1.02] active:scale-98"
                      >
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-white/60 mb-3 shadow-lg relative">
                          {foto ? (
                            <img src={foto} alt={b.nome} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-black text-lg bg-black/20">
                              {b.nome?.charAt(0)}
                            </div>
                          )}
                        </div>
                        <p className="text-xs font-black tracking-tight line-clamp-1">{b.nome}</p>
                        <span className="text-[9px] font-bold mt-0.5 px-2.5 py-0.5 rounded-full bg-black/15">
                          Profissional
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {etapa === 'horario' && !estaDigitando && (
            <div className="space-y-3 pt-2">
              {horariosDisponiveisAtuais.filter(h => !horariosOcupados.includes(h)).length === 0 ? (
                <div
                  className="p-5 rounded-3xl border backdrop-blur-xl space-y-4 shadow-xl"
                  style={{ backgroundColor: tema.cor_card, borderColor: tema.cor_borda, color: tema.cor_texto_geral }}
                >
                  <div className="flex items-center gap-3 pb-3 border-b border-rose-500/20">
                    <div className="w-9 h-9 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-rose-500 uppercase tracking-wider">Horários Indisponíveis</h4>
                      <p className="text-[11px] font-medium leading-tight mt-0.5" style={{ color: corSecundaria }}>
                        Nenhum horário livre nesta data (agenda cheia, folga ou limite de antecedência atingido).
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      onClick={() => {
                        setDataEscolhida('');
                        setEtapa('data');
                      }}
                      style={getEstiloBotao3D(false)}
                      className="w-full py-3.5 px-4 rounded-2xl border text-xs font-black transition-all cursor-pointer flex items-center justify-between active:scale-98"
                    >
                      <span className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        <span>Escolher outra data</span>
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setBarbeiroEscolhido(null);
                        setDataEscolhida('');
                        setEtapa('barbeiro');
                      }}
                      className="w-full py-3.5 px-4 rounded-2xl border text-xs font-black transition-all cursor-pointer flex items-center justify-between shadow-sm hover:scale-[1.01]"
                      style={{ backgroundColor: tema.cor_container, borderColor: tema.cor_borda, color: tema.cor_texto_geral }}
                    >
                      <span className="flex items-center gap-2">
                        <User className="w-4 h-4" style={{ color: corSecundaria }} />
                        <span>Escolher outro profissional</span>
                      </span>
                      <ArrowRight className="w-4 h-4" style={{ color: corSecundaria }} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {horariosDisponiveisAtuais
                    .filter(h => !horariosOcupados.includes(h))
                    .map((h) => {
                      const selecionado = horaEscolhida === h;
                      return (
                        <button
                          key={h}
                          disabled={loading}
                          onClick={() => selecionarHorario(h)}
                          style={getEstiloBotao3D(selecionado)}
                          className={`py-2.5 rounded-xl text-xs font-black border transition-all cursor-pointer active:scale-95 ${
                            selecionado ? 'scale-[1.03] translate-y-[1px]' : 'hover:brightness-105'
                          }`}
                        >
                          {h}
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {etapa === 'resumo' && !estaDigitando && (
            <div
              className="p-4 rounded-2xl border space-y-2.5 backdrop-blur-md mt-2"
              style={{ backgroundColor: tema.cor_card, borderColor: `${corTema}66`, color: tema.cor_texto_geral }}
            >
              <h4 className="text-xs font-black uppercase tracking-wider" style={{ color: corTema }}>Resumo do Agendamento</h4>
              <div className="space-y-1 text-xs">
                <p>✂️ <strong>Serviço:</strong> {servicoEscolhido?.nome} (R$ {Number(servicoEscolhido?.preco || 0).toFixed(2)})</p>
                <p>👤 <strong>Profissional:</strong> {barbeiroEscolhido?.nome}</p>
                <p>📅 <strong>Data:</strong> {dataEscolhida.split('T')[0].split('-').reverse().join('/')}</p>
                <p>⏰ <strong>Horário:</strong> {horaEscolhida}</p>
                <p>👤 <strong>Cliente:</strong> {nome} ({telefone})</p>
              </div>
              <button
                disabled={loading}
                onClick={confirmarAgendamentoFinal}
                style={getEstiloBotao3D(false)}
                className="w-full mt-3 py-3 rounded-full border font-black text-xs uppercase tracking-widest cursor-pointer transition-all active:scale-98"
              >
                {loading ? 'A confirmar...' : 'Confirmar Agendamento'}
              </button>
            </div>
          )}

          {etapa === 'sucesso' && !estaDigitando && (
            <div className="pt-2 text-center space-y-3">
              <div
                className="w-12 h-12 rounded-full border flex items-center justify-center mx-auto"
                style={getEstiloBotao3D(false)}
              >
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="grid grid-cols-1 gap-2 pt-2">
                {barbearia?.permite_agendamentos !== false && (
                  <button
                    onClick={() => {
                      setEtapa('servico');
                      setMensagens((prev) => [...prev, { remetente: 'bot', texto: 'Escolha o serviço para o novo agendamento:' }]);
                    }}
                    style={getEstiloBotao3D(false)}
                    className="w-full py-3 rounded-full border font-black text-xs transition-all cursor-pointer active:scale-98"
                  >
                    Fazer Novo Agendamento
                  </button>
                )}
                <button
                  onClick={() => {
                    carregarDadosCliente(clienteId);
                    setEtapa('gerenciar');
                  }}
                  className="w-full py-3 rounded-full font-bold text-xs transition-all cursor-pointer border"
                  style={{ backgroundColor: tema.cor_card, borderColor: tema.cor_borda, color: tema.cor_texto_geral }}
                >
                  {barbearia?.fidelidade_ativa !== false ? 'Ver Meus Agendamentos e Selos' : 'Ver Meus Agendamentos'}
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
          <form
            onSubmit={handleEnviarResposta}
            className="p-4 sm:p-5 pb-8 sm:pb-5 border-t backdrop-blur-xl flex items-center gap-2 shrink-0"
            style={{ backgroundColor: `${tema.cor_container}F2`, borderColor: tema.cor_borda }}
          >
            <input
              type={etapa === 'telefone' ? 'tel' : 'text'}
              placeholder={etapa === 'telefone' ? 'Digite seu celular...' : 'Digite seu nome completo...'}
              value={inputTexto}
              onChange={(e) => setInputTexto(e.target.value)}
              className="w-full rounded-2xl px-4 py-3.5 text-xs focus:outline-none shadow-inner border"
              style={{
                backgroundColor: tema.cor_card,
                borderColor: tema.cor_borda,
                color: tema.cor_texto_geral,
              }}
            />
            <button
              type="submit"
              style={getEstiloBotao3D(false)}
              className="w-12 h-12 rounded-full border flex items-center justify-center shrink-0 cursor-pointer transition-all active:scale-95"
            >
              <Send className="w-4 h-4 stroke-[2.2]" />
            </button>
          </form>
        )}

      </div>
    </div>
  );
}