'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, CheckCircle2, AlertCircle, Clock, ArrowRight, Calendar as CalendarIcon, XCircle, Edit3, Scissors, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const HORARIOS_DISPONIVEIS = [
  '08:00', '09:00', '10:00', '11:00', 
  '13:00', '14:00', '15:00', '16:00', 
  '17:00', '18:00', '19:00'
];

export default function AgendamentoChat({ barbeariaId }) {
  const [barbearia, setBarbearia] = useState(null);
  const [servicos, setServicos] = useState([]);
  const [barbeiros, setBarbeiros] = useState([]);
  const [horariosOcupados, setHorariosOcupados] = useState([]);

  const [etapa, setEtapa] = useState('telefone');
  const [telefone, setTelefone] = useState('');
  const [nome, setNome] = useState('');
  const [clienteId, setClienteId] = useState(null);
  const [agendamentosCliente, setAgendamentosCliente] = useState([]);
  
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

  const chatContainerRef = useRef(null);
  const inicializadoRef = useRef(false);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [mensagens, estaDigitando]);

  const isClean = barbearia?.cor_tema === 'clean';
  const corTema = isClean ? '#0ea5e9' : '#10b981';
  const estiloFundoContainer = isClean 
    ? 'bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] border-slate-300 text-slate-900 shadow-[0_30px_90px_rgba(0,0,0,0.15)]' 
    : 'bg-gradient-to-br from-[#0c0d10] via-[#050507] to-[#000000] border-white/10 text-white shadow-[0_30px_90px_rgba(0,0,0,0.9)]';

  const estiloHeader = isClean ? 'bg-white/90 border-slate-200 text-slate-900' : 'bg-[#050507]/90 border-white/10 text-white';
  const estiloBotMsg = isClean ? 'bg-white border border-slate-200 text-slate-800 shadow-sm' : 'bg-black/60 border border-white/10 text-slate-200 shadow-inner';
  const estiloInput = isClean ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-black/80 border-white/10 text-white placeholder-slate-500';

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
        const { data: barb } = await supabase
          .from('barbearias')
          .select('*')
          .eq('id', barbeariaId)
          .single();

        if (barb) setBarbearia(barb);

        const [resServicos, resBarbeiros] = await Promise.all([
          supabase.from('servicos').select('*').eq('barbearia_id', barbeariaId),
          supabase.from('barbeiros').select('*').eq('barbearia_id', barbeariaId)
        ]);

        setServicos(resServicos.data || []);
        setBarbeiros(resBarbeiros.data || []);

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

  const atualizarAgendamentosAtivos = async (cliId) => {
    const { data: agsAtivos } = await supabase
      .from('agendamentos')
      .select('*, servicos(nome), barbeiros(nome)')
      .eq('cliente_id', cliId)
      .neq('status', 'cancelado')
      .gte('data_hora', new Date().toISOString());

    setAgendamentosCliente(agsAtivos || []);
    return agsAtivos || [];
  };

  const handleEnviarResposta = async (e) => {
    e.preventDefault();
    if (!inputTexto.trim() && !['servico', 'barbeiro', 'horario', 'menu_inicial', 'gerenciar', 'resumo'].includes(etapa)) return;

    const valorInput = inputTexto.trim();
    setInputTexto('');
    setErro(null);

    if (valorInput) {
      setMensagens((prev) => [...prev, { remetente: 'usuario', texto: valorInput }]);
    }

    if (etapa === 'telefone') {
      if (valorInput.length < 8) {
        setErro('Por favor, informe um número de celular válido.');
        return;
      }
      setTelefone(valorInput);

      try {
        const { data: cliExistente } = await supabase
          .from('clientes')
          .select('id, nome')
          .eq('barbearia_id', barbeariaId)
          .eq('telefone', valorInput)
          .maybeSingle();

        if (cliExistente) {
          setClienteId(cliExistente.id);
          setNome(cliExistente.nome);

          const agsAtivos = await atualizarAgendamentosAtivos(cliExistente.id);

          if (agsAtivos.length > 0) {
            adicionarMensagemBotComDelay(`Que bom vê-lo novamente, ${cliExistente.nome}! Notamos que você já tem agendamentos ativos. O que deseja fazer?`, 'menu_inicial');
          } else {
            adicionarMensagemBotComDelay(`Que bom vê-lo novamente, ${cliExistente.nome}! Qual serviço deseja realizar hoje?`, 'servico');
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
        const { data: novoCli, error: errCli } = await supabase
          .from('clientes')
          .insert([{ barbearia_id: barbeariaId, nome: valorInput, telefone }])
          .select('id')
          .single();

        if (errCli) throw errCli;
        setClienteId(novoCli.id);

        adicionarMensagemBotComDelay(`Prazer em conhecê-lo, ${valorInput}! Agora, escolha um dos nossos serviços abaixo:`, 'servico');
      } catch (err) {
        setErro('Erro ao cadastrar cliente.');
      }
    }
  };

  const escolherOpcaoMenu = (opcao) => {
    if (opcao === 'novo') {
      setMensagens((prev) => [...prev, { remetente: 'usuario', texto: 'Fazer novo agendamento' }]);
      adicionarMensagemBotComDelay('Perfeito! Escolha o serviço que deseja realizar:', 'servico');
    } else if (opcao === 'gerenciar') {
      setMensagens((prev) => [...prev, { remetente: 'usuario', texto: 'Ver meus agendamentos' }]);
      atualizarAgendamentosAtivos(clienteId);
      adicionarMensagemBotComDelay('Aqui estão os seus agendamentos ativos:', 'gerenciar');
    }
  };

  const cancelarAgendamento = async (agId) => {
    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ status: 'cancelado' })
        .eq('id', agId);

      if (error) throw error;

      await atualizarAgendamentosAtivos(clienteId);
      adicionarMensagemBotComDelay('O agendamento foi cancelado com sucesso. Deseja marcar um novo horário ou gerenciar outros?', 'menu_inicial');
    } catch (err) {
      setErro('Erro ao cancelar agendamento.');
    }
  };

  const iniciarEdicao = (ag) => {
    setAgendamentoEmEdicao(ag);
    setMensagens((prev) => [...prev, { remetente: 'usuario', texto: `Editar agendamento de ${ag.servicos?.nome || 'Serviço'}` }]);
    adicionarMensagemBotComDelay('Selecione a nova data para o seu atendimento:', 'editar_data');
  };

  const confirmarDataEdicao = (dataSelecionada) => {
    setDataEscolhida(dataSelecionada);
    setMensagens((prev) => [...prev, { remetente: 'usuario', texto: dataSelecionada.split('-').reverse().join('/') }]);
    adicionarMensagemBotComDelay('Agora, selecione o novo horário disponível:', 'editar_horario');
  };

  const salvarEdicaoHorario = async (hora) => {
    setLoading(true);
    try {
      const dataHoraIso = new Date(`${dataEscolhida}T${hora}:00`).toISOString();

      const { error } = await supabase
        .from('agendamentos')
        .update({ data_hora: dataHoraIso })
        .eq('id', agendamentoEmEdicao.id);

      if (error) throw error;

      await atualizarAgendamentosAtivos(clienteId);
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

  const confirmarData = (dataSelecionada) => {
    setDataEscolhida(dataSelecionada);
    setMensagens((prev) => [...prev, { remetente: 'usuario', texto: dataSelecionada.split('-').reverse().join('/') }]);
    adicionarMensagemBotComDelay('Data definida. Escolha um horário disponível:', 'horario');
  };

  const selecionarHorario = (hora) => {
    setHoraEscolhida(hora);
    setMensagens((prev) => [...prev, { remetente: 'usuario', texto: hora }]);
    adicionarMensagemBotComDelay('Por favor, confira o resumo do seu agendamento abaixo antes de confirmar:', 'resumo');
  };

  const confirmarAgendamentoFinal = async () => {
    setLoading(true);
    try {
      const dataHoraIso = new Date(`${dataEscolhida}T${horaEscolhida}:00`).toISOString();

      const { error: errAg } = await supabase.from('agendamentos').insert([{
        barbearia_id: barbeariaId,
        cliente_id: clienteId,
        barbeiro_id: barbeiroEscolhido.id,
        servico_id: servicoEscolhido.id,
        valor_total: servicoEscolhido.preco,
        data_hora: dataHoraIso,
        status: 'agendado',
        lido: false
      }]);

      if (errAg) throw errAg;

      await atualizarAgendamentosAtivos(clienteId);
      setMensagens((prev) => [...prev, { remetente: 'usuario', texto: 'Confirmar Agendamento' }]);
      adicionarMensagemBotComDelay(`Tudo pronto! O seu agendamento foi confirmado com sucesso para ${dataEscolhida.split('-').reverse().join('/')} às ${horaEscolhida}. Aguardamos a sua visita!`, 'sucesso');
    } catch (err) {
      setErro('Erro ao concluir agendamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full max-w-xl mx-auto rounded-[2.5rem] border overflow-hidden relative backdrop-blur-2xl flex flex-col h-[680px] ${estiloFundoContainer}`}>
      
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-[3px] z-30" style={{ background: `linear-gradient(to right, transparent, ${corTema}, transparent)` }}></div>

      {/* HEADER FIXO */}
      <div className={`shrink-0 z-20 backdrop-blur-xl border-b ${estiloHeader}`}>
        <div className="relative h-28 w-full bg-stone-900 overflow-hidden">
          {barbearia?.capa_url ? (
            <img src={barbearia.capa_url} alt="Capa" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center">
              <span className="text-[10px] font-bold text-stone-500 tracking-wider uppercase">Capa da Unidade</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
        </div>

        <div className="px-6 pb-3 pt-0 relative flex items-center gap-3.5 -mt-8">
          <div className="w-14 h-14 rounded-2xl bg-black p-1 shadow-2xl border border-white/20 overflow-hidden flex items-center justify-center shrink-0 backdrop-blur-xl">
            {barbearia?.logo_url ? (
              <img src={barbearia.logo_url} alt={barbearia.nome} className="w-full h-full object-cover rounded-xl" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-stone-800 to-black text-white rounded-xl flex items-center justify-center font-black text-sm">
                {barbearia?.nome?.charAt(0) || 'B'}
              </div>
            )}
          </div>
          <div>
            <h2 className={`text-sm font-black tracking-tight ${isClean ? 'text-slate-900' : 'text-white'}`}>{barbearia?.nome}</h2>
            <p className="text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 mt-0.5" style={{ color: corTema }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: corTema }}></span>
              Assistente Virtual Inteligente
            </p>
          </div>
        </div>
      </div>

      {/* ÁREA DE CONVERSA */}
      <div ref={chatContainerRef} className="flex-1 p-6 space-y-4 overflow-y-auto">
        {mensagens.map((msg, index) => (
          <div 
            key={index} 
            className={`flex items-start gap-2.5 ${msg.remetente === 'usuario' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {msg.remetente === 'bot' && (
              <div className="w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 shadow-sm mt-1" style={{ backgroundColor: `${corTema}20`, borderColor: `${corTema}50`, color: corTema }}>
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}
            <div 
              className={`p-3.5 rounded-3xl text-xs leading-relaxed max-w-[80%] backdrop-blur-md ${
                msg.remetente === 'usuario' 
                  ? 'text-slate-950 font-bold rounded-tr-sm shadow-lg' 
                  : estiloBotMsg
              }`}
              style={msg.remetente === 'usuario' ? { backgroundColor: corTema, boxShadow: `0 5px 20px ${corTema}40` } : {}}
            >
              {msg.texto}
            </div>
          </div>
        ))}

        {estaDigitando && (
          <div className="flex items-start gap-2.5 flex-row animate-fade-in">
            <div className="w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 shadow-sm mt-1" style={{ backgroundColor: `${corTema}20`, borderColor: `${corTema}50`, color: corTema }}>
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className={`p-4 rounded-3xl rounded-tl-sm border flex items-center gap-1.5 backdrop-blur-md shadow-inner ${isClean ? 'bg-white border-slate-200' : 'bg-black/60 border-white/10'}`}>
              <div className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s]" style={{ backgroundColor: corTema }}></div>
              <div className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s]" style={{ backgroundColor: corTema }}></div>
              <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: corTema }}></div>
            </div>
          </div>
        )}

        {etapa === 'menu_inicial' && !estaDigitando && (
          <div className="grid grid-cols-1 gap-2 pt-2">
            <button
              onClick={() => escolherOpcaoMenu('novo')}
              className="p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer backdrop-blur-md font-bold text-xs"
              style={{ backgroundColor: `${corTema}15`, borderColor: `${corTema}40`, color: isClean ? '#0f172a' : '#ffffff' }}
            >
              <span>Fazer novo agendamento</span>
              <ArrowRight className="w-4 h-4" style={{ color: corTema }} />
            </button>
            <button
              onClick={() => escolherOpcaoMenu('gerenciar')}
              className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer backdrop-blur-md font-bold text-xs ${isClean ? 'bg-white border-slate-200 text-slate-800' : 'bg-black/50 border-white/10 text-white'}`}
            >
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
                const dataFormatada = new Date(ag.data_hora).toLocaleString('pt-BR', {
                  dateStyle: 'short',
                  timeStyle: 'short'
                });
                return (
                  <div key={ag.id} className={`p-4 rounded-2xl border flex items-center justify-between gap-3 backdrop-blur-md ${isClean ? 'bg-white border-slate-200' : 'bg-black/60 border-white/10'}`}>
                    <div>
                      <p className={`text-xs font-bold ${isClean ? 'text-slate-900' : 'text-white'}`}>{ag.servicos?.nome || 'Serviço'}</p>
                      <p className="text-[10px] font-medium" style={{ color: corTema }}>Profissional: {ag.barbeiros?.nome || 'Barbeiro'}</p>
                      <p className={`text-[10px] mt-0.5 ${isClean ? 'text-slate-600' : 'text-slate-300'}`}>📅 {dataFormatada}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => iniciarEdicao(ag)}
                        className="px-3 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-500 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => cancelarAgendamento(ag.id)}
                        className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-500 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancelar</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
            <button
              onClick={() => {
                setEtapa('servico');
                setMensagens((prev) => [...prev, { remetente: 'bot', texto: 'Perfeito, vamos prosseguir com o novo agendamento. Escolha o serviço:' }]);
              }}
              className="w-full py-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer mt-2"
              style={{ backgroundColor: `${corTema}20`, color: corTema, borderColor: `${corTema}40` }}
            >
              Fazer novo agendamento
            </button>
          </div>
        )}

        {/* CALENDÁRIO PROFISSIONAL INTEGRADO (EDIÇÃO) */}
        {etapa === 'editar_data' && !estaDigitando && (
          <div className={`p-4 rounded-3xl border backdrop-blur-xl space-y-3 ${isClean ? 'bg-white border-slate-200' : 'bg-black/60 border-white/10'}`}>
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <CalendarIcon className="w-4 h-4" style={{ color: corTema }} />
              <span className="text-xs font-black uppercase tracking-wider">Selecione a Nova Data</span>
            </div>
            <input 
              type="date"
              required
              min={new Date().toISOString().split('T')[0]}
              value={dataEscolhida}
              onChange={(e) => confirmarDataEdicao(e.target.value)}
              className={`w-full p-3.5 rounded-2xl border text-xs font-bold focus:outline-none backdrop-blur-md cursor-pointer ${isClean ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-black/80 border-white/15 text-white [color-scheme:dark]'}`}
            />
          </div>
        )}

        {etapa === 'editar_horario' && !estaDigitando && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
            {HORARIOS_DISPONIVEIS.map((h) => {
              const ocupado = horariosOcupados.includes(h);
              return (
                <button
                  key={h}
                  disabled={ocupado || loading}
                  onClick={() => salvarEdicaoHorario(h)}
                  className={`py-2.5 rounded-xl text-xs font-black border transition-all backdrop-blur-md ${
                    ocupado
                      ? 'bg-slate-500/10 text-slate-400 border-slate-200 line-through opacity-40 cursor-not-allowed'
                      : isClean ? 'bg-white text-slate-800 border-slate-300 cursor-pointer hover:border-sky-500' : 'bg-black/50 text-white border-white/10 cursor-pointer hover:border-white/30'
                  }`}
                >
                  {h}
                </button>
              );
            })}
          </div>
        )}

        {/* ESCOLHA DE SERVIÇO EM GRID (LADO A LADO) COM VIDRO E DEGRADÊ */}
        {etapa === 'servico' && !estaDigitando && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            {servicos.map((s) => (
              <button
                key={s.id}
                onClick={() => selecionarServico(s)}
                className={`p-4 rounded-3xl border text-left flex flex-col justify-between transition-all cursor-pointer backdrop-blur-xl group hover:scale-[1.02] shadow-lg ${
                  isClean ? 'bg-white/80 border-slate-200 hover:border-sky-500' : 'bg-gradient-to-br from-black/80 via-black/50 to-stone-900/60 border-white/10 hover:border-white/30'
                }`}
                style={{
                  boxShadow: isClean ? '0 10px 30px rgba(0,0,0,0.05)' : '0 10px 30px rgba(0,0,0,0.5)'
                }}
              >
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

        {/* ESCOLHA DE PROFISSIONAL EM GRID (LADO A LADO) COM FOTOS QUADRADAS E BORDAS */}
        {etapa === 'barbeiro' && !estaDigitando && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            {barbeiros.map((b) => {
              const foto = b.foto || b.avatar || b.imagem;
              return (
                <button
                  key={b.id}
                  onClick={() => selecionarBarbeiro(b)}
                  className={`p-3.5 rounded-3xl border text-left flex flex-col items-center text-center transition-all cursor-pointer backdrop-blur-xl group hover:scale-[1.02] shadow-lg ${
                    isClean ? 'bg-white/80 border-slate-200 hover:border-sky-500' : 'bg-gradient-to-br from-black/80 via-black/50 to-stone-900/60 border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 mb-3 shadow-2xl relative" style={{ borderColor: `${corTema}66` }}>
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

        {/* CALENDÁRIO PROFISSIONAL INTEGRADO */}
        {etapa === 'data' && !estaDigitando && (
          <div className={`p-5 rounded-3xl border backdrop-blur-xl space-y-4 shadow-xl ${isClean ? 'bg-white/90 border-slate-200' : 'bg-gradient-to-br from-black/80 via-black/60 to-stone-900 border-white/15'}`}>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center shadow" style={{ backgroundColor: `${corTema}20`, color: corTema }}>
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider">Escolha a Data do Atendimento</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <input 
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={dataEscolhida}
                onChange={(e) => setDataEscolhida(e.target.value)}
                className={`w-full p-4 rounded-2xl border text-xs font-bold focus:outline-none backdrop-blur-md cursor-pointer shadow-inner ${
                  isClean ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-black/90 border-white/20 text-white [color-scheme:dark]'
                }`}
                style={{ borderColor: dataEscolhida ? corTema : undefined }}
              />

              <button
                disabled={!dataEscolhida}
                onClick={() => confirmarData(dataEscolhida)}
                className="w-full py-3.5 rounded-2xl text-white font-black text-xs uppercase tracking-widest cursor-pointer shadow-lg disabled:opacity-40 transition-all hover:brightness-110 flex items-center justify-center gap-2"
                style={{ backgroundColor: corTema }}
              >
                <span>Avançar para Horários</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {etapa === 'horario' && !estaDigitando && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
            {HORARIOS_DISPONIVEIS.map((h) => {
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
                      : isClean ? 'bg-white text-slate-800 border-slate-300 cursor-pointer hover:border-sky-500' : 'bg-black/50 text-white border-white/10 cursor-pointer hover:border-white/30'
                  }`}
                  style={selecionado ? { backgroundColor: corTema, borderColor: corTema } : {}}
                >
                  {h}
                </button>
              );
            })}
          </div>
        )}

        {etapa === 'resumo' && !estaDigitando && (
          <div className={`p-4 rounded-2xl border space-y-2.5 backdrop-blur-md mt-2 ${isClean ? 'bg-white border-sky-500/40 text-slate-800' : 'bg-black/60 border-emerald-500/40 text-slate-200'}`} style={{ borderColor: `${corTema}66` }}>
            <h4 className="text-xs font-black uppercase tracking-wider" style={{ color: corTema }}>Resumo do Agendamento</h4>
            <div className="space-y-1 text-xs">
              <p>✂️ <strong className={isClean ? 'text-slate-950' : 'text-white'}>Serviço:</strong> {servicoEscolhido?.nome} (R$ {Number(servicoEscolhido?.preco || 0).toFixed(2)})</p>
              <p>👤 <strong className={isClean ? 'text-slate-950' : 'text-white'}>Profissional:</strong> {barbeiroEscolhido?.nome}</p>
              <p>📅 <strong className={isClean ? 'text-slate-950' : 'text-white'}>Data:</strong> {dataEscolhida.split('-').reverse().join('/')}</p>
              <p>⏰ <strong className={isClean ? 'text-slate-950' : 'text-white'}>Horário:</strong> {horaEscolhida}</p>
              <p>👤 <strong className={isClean ? 'text-slate-950' : 'text-white'}>Cliente:</strong> {nome} ({telefone})</p>
            </div>
            <button
              disabled={loading}
              onClick={confirmarAgendamentoFinal}
              className="w-full mt-3 py-3 rounded-xl text-white font-black text-xs uppercase tracking-widest cursor-pointer shadow-lg hover:brightness-110 transition-all"
              style={{ backgroundColor: corTema }}
            >
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
              <button
                onClick={() => {
                  setEtapa('servico');
                  setMensagens((prev) => [...prev, { remetente: 'bot', texto: 'Vamos lá! Escolha o serviço para o novo agendamento:' }]);
                }}
                className="w-full py-3 rounded-2xl text-white font-bold text-xs transition-all cursor-pointer shadow-md"
                style={{ backgroundColor: corTema }}
              >
                Fazer Novo Agendamento
              </button>
              <button
                onClick={() => {
                  atualizarAgendamentosAtivos(clienteId);
                  setEtapa('gerenciar');
                  setMensagens((prev) => [...prev, { remetente: 'bot', texto: 'Aqui estão os seus agendamentos ativos:' }]);
                }}
                className={`w-full py-3 rounded-2xl font-bold text-xs transition-all cursor-pointer border ${isClean ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-white/10 hover:bg-white/20 text-white border-white/10'}`}
              >
                Ver Meus Agendamentos
              </button>
            </div>
          </div>
        )}
      </div>

      {erro && (
        <div className="mx-6 mb-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2 backdrop-blur-md shrink-0">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {(etapa === 'telefone' || etapa === 'nome') && !estaDigitando && (
        <form onSubmit={handleEnviarResposta} className={`p-4 sm:p-5 border-t backdrop-blur-xl flex items-center gap-2 shrink-0 ${isClean ? 'bg-white/80 border-slate-200' : 'bg-black/60 border-white/10'}`}>
          <input
            type={etapa === 'telefone' ? 'tel' : 'text'}
            placeholder={etapa === 'telefone' ? 'Digite seu celular...' : 'Digite seu nome completo...'}
            value={inputTexto}
            onChange={(e) => setInputTexto(e.target.value)}
            className={`w-full rounded-2xl px-4 py-3.5 text-xs focus:outline-none shadow-inner ${estiloInput}`}
          />
          <button
            type="submit"
            className="w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-lg shrink-0 cursor-pointer hover:scale-105 transition-transform"
            style={{ backgroundColor: corTema }}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}

    </div>
  );
}