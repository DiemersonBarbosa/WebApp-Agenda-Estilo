'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, CheckCircle2, AlertCircle, Clock, ArrowRight, Calendar, XCircle, Edit3 } from 'lucide-react';
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

  // Estados do fluxo do Chatbot
  const [etapa, setEtapa] = useState('telefone'); // telefone, nome, menu_inicial, gerenciar, editar_data, editar_horario, servico, barbeiro, data, horario, resumo, sucesso
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
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [mensagens]);

  useEffect(() => {
    async function carregarDados() {
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

        setMensagens([
          {
            remetente: 'bot',
            texto: 'Olá! Seja muito bem-vindo. Para começarmos, por favor, informe o seu telemóvel/WhatsApp:'
          }
        ]);
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
        setErro('Por favor, informe um número de telemóvel válido.');
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

          const { data: agsAtivos } = await supabase
            .from('agendamentos')
            .select('*, servicos(nome), barbeiros(nome)')
            .eq('cliente_id', cliExistente.id)
            .neq('status', 'cancelado')
            .gte('data_hora', new Date().toISOString());

          setAgendamentosCliente(agsAtivos || []);

          if (agsAtivos && agsAtivos.length > 0) {
            setEtapa('menu_inicial');
            setMensagens((prev) => [
              ...prev,
              { remetente: 'bot', texto: `Que bom vê-lo novamente, ${cliExistente.nome}! Detetamos que já tem agendamentos ativos. O que deseja fazer?` }
            ]);
          } else {
            setEtapa('servico');
            setMensagens((prev) => [
              ...prev,
              { remetente: 'bot', texto: `Que bom vê-lo novamente, ${cliExistente.nome}! Qual serviço deseja realizar hoje?` }
            ]);
          }
        } else {
          setEtapa('nome');
          setMensagens((prev) => [
            ...prev,
            { remetente: 'bot', texto: 'Não encontramos o seu registo. Como podemos chamá-lo? Por favor, informe o seu nome completo:' }
          ]);
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

        setEtapa('servico');
        setMensagens((prev) => [
          ...prev,
          { remetente: 'bot', texto: `Prazer em conhecê-lo, ${valorInput}! Agora, escolha um dos nossos serviços abaixo:` }
        ]);
      } catch (err) {
        setErro('Erro ao registar cliente.');
      }
    }
  };

  const escolherOpcaoMenu = (opcao) => {
    if (opcao === 'novo') {
      setMensagens((prev) => [
        ...prev,
        { remetente: 'usuario', texto: 'Fazer novo agendamento' },
        { remetente: 'bot', texto: 'Perfeito! Escolha o serviço que deseja realizar:' }
      ]);
      setEtapa('servico');
    } else if (opcao === 'gerenciar') {
      setMensagens((prev) => [
        ...prev,
        { remetente: 'usuario', texto: 'Gerenciar meus agendamentos' },
        { remetente: 'bot', texto: 'Aqui estão os seus agendamentos ativos:' }
      ]);
      setEtapa('gerenciar');
    }
  };

  const cancelarAgendamento = async (agId) => {
    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ status: 'cancelado' })
        .eq('id', agId);

      if (error) throw error;

      setAgendamentosCliente((prev) => prev.filter((ag) => ag.id !== agId));
      setMensagens((prev) => [
        ...prev,
        { remetente: 'bot', texto: 'O agendamento foi cancelado com sucesso. Deseja marcar um novo horário ou gerenciar outros?' }
      ]);
      setEtapa('menu_inicial');
    } catch (err) {
      setErro('Erro ao cancelar agendamento.');
    }
  };

  const iniciarEdicao = (ag) => {
    setAgendamentoEmEdicao(ag);
    setEtapa('editar_data');
    setMensagens((prev) => [
      ...prev,
      { remetente: 'usuario', texto: `Editar agendamento de ${ag.servicos?.nome || 'Serviço'}` },
      { remetente: 'bot', texto: 'Selecione a nova data para o seu atendimento:' }
    ]);
  };

  const confirmarNovaDataEdicao = (e) => {
    e.preventDefault();
    if (!dataEscolhida) return;

    setEtapa('editar_horario');
    setMensagens((prev) => [
      ...prev,
      { remetente: 'usuario', texto: dataEscolhida.split('-').reverse().join('/') },
      { remetente: 'bot', texto: 'Agora, selecione o novo horário disponível:' }
    ]);
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

      setEtapa('sucesso');
      setMensagens((prev) => [
        ...prev,
        { remetente: 'usuario', texto: hora },
        { remetente: 'bot', texto: `Agendamento atualizado com sucesso para ${dataEscolhida.split('-').reverse().join('/')} às ${hora}!` }
      ]);
    } catch (err) {
      setErro('Erro ao atualizar agendamento.');
    } finally {
      setLoading(false);
    }
  };

  const selecionarServico = (servico) => {
    setServicoEscolhido(servico);
    setMensagens((prev) => [
      ...prev,
      { remetente: 'usuario', texto: `${servico.nome} - R$ ${Number(servico.preco).toFixed(2)}` },
      { remetente: 'bot', texto: `Perfeito! Escolheu ${servico.nome}. Agora, selecione o profissional de sua preferência:` }
    ]);
    setEtapa('barbeiro');
  };

  const selecionarBarbeiro = (barbeiro) => {
    setBarbeiroEscolhido(barbeiro);
    setMensagens((prev) => [
      ...prev,
      { remetente: 'usuario', texto: barbeiro.nome },
      { remetente: 'bot', texto: `Ótima escolha! O atendimento será com ${barbeiro.nome}. Para qual data deseja agendar?` }
    ]);
    setEtapa('data');
  };

  const confirmarData = (e) => {
    e.preventDefault();
    if (!dataEscolhida) return;

    setMensagens((prev) => [
      ...prev,
      { remetente: 'usuario', texto: dataEscolhida.split('-').reverse().join('/') },
      { remetente: 'bot', texto: `Data definida. Escolha um horário disponível:` }
    ]);
    setEtapa('horario');
  };

  const selecionarHorario = (hora) => {
    setHoraEscolhida(hora);
    setEtapa('resumo');
    setMensagens((prev) => [
      ...prev,
      { remetente: 'usuario', texto: hora },
      { remetente: 'bot', texto: 'Por favor, confira o resumo do seu agendamento abaixo antes de confirmar:' }
    ]);
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

      setEtapa('sucesso');
      setMensagens((prev) => [
        ...prev,
        { remetente: 'usuario', texto: 'Confirmar Agendamento' },
        { remetente: 'bot', texto: `Tudo pronto! O seu agendamento foi confirmado com sucesso para ${dataEscolhida.split('-').reverse().join('/')} às ${horaEscolhida}. Aguardamos a sua visita!` }
      ]);
    } catch (err) {
      setErro('Erro ao concluir agendamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto rounded-[2.5rem] bg-gradient-to-br from-[#0c0d10] via-[#050507] to-[#000000] border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.9)] text-white overflow-hidden relative backdrop-blur-2xl flex flex-col h-[650px]">
      
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-[3px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent z-30"></div>

      {/* ================= HEADER FIXO (CAPA E LOGO) ================= */}
      <div className="shrink-0 z-20 bg-[#050507]/90 backdrop-blur-xl border-b border-white/10">
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
            <h2 className="text-sm font-black text-white tracking-tight">{barbearia?.nome}</h2>
            <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Assistente Virtual Inteligente
            </p>
          </div>
        </div>
      </div>

      {/* ================= ÁREA DE CONVERSA COM SCROLL ================= */}
      <div ref={chatContainerRef} className="flex-1 p-6 space-y-4 overflow-y-auto">
        {mensagens.map((msg, index) => (
          <div 
            key={index} 
            className={`flex items-start gap-2.5 ${msg.remetente === 'usuario' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {msg.remetente === 'bot' && (
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-sm mt-1">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}
            <div 
              className={`p-3.5 rounded-3xl text-xs leading-relaxed max-w-[80%] backdrop-blur-md ${
                msg.remetente === 'usuario' 
                  ? 'bg-emerald-500 text-slate-950 font-bold rounded-tr-sm shadow-[0_5px_20px_rgba(16,185,129,0.3)]' 
                  : 'bg-black/60 border border-white/10 text-slate-200 rounded-tl-sm shadow-inner'
              }`}
            >
              {msg.texto}
            </div>
          </div>
        ))}

        {/* MENU INICIAL */}
        {etapa === 'menu_inicial' && (
          <div className="grid grid-cols-1 gap-2 pt-2">
            <button
              onClick={() => escolherOpcaoMenu('novo')}
              className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 hover:bg-emerald-500/20 text-left flex items-center justify-between transition-all cursor-pointer backdrop-blur-md"
            >
              <span className="text-xs font-bold text-white">Fazer novo agendamento</span>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
            </button>
            <button
              onClick={() => escolherOpcaoMenu('gerenciar')}
              className="p-3.5 rounded-2xl bg-black/50 border border-white/10 hover:border-white/20 text-left flex items-center justify-between transition-all cursor-pointer backdrop-blur-md"
            >
              <span className="text-xs font-bold text-white">Gerenciar / Cancelar meus agendamentos</span>
              <Calendar className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        )}

        {/* LISTA DE AGENDAMENTOS */}
        {etapa === 'gerenciar' && (
          <div className="space-y-3 pt-2">
            {agendamentosCliente.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-2">Não tem agendamentos ativos no momento.</p>
            ) : (
              agendamentosCliente.map((ag) => {
                const dataFormatada = new Date(ag.data_hora).toLocaleString('pt-BR', {
                  dateStyle: 'short',
                  timeStyle: 'short'
                });
                return (
                  <div key={ag.id} className="p-4 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-between gap-3 backdrop-blur-md">
                    <div>
                      <p className="text-xs font-bold text-white">{ag.servicos?.nome || 'Serviço'}</p>
                      <p className="text-[10px] text-emerald-400 font-medium">Profissional: {ag.barbeiros?.nome || 'Barbeiro'}</p>
                      <p className="text-[10px] text-slate-300 mt-0.5">📅 {dataFormatada}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => iniciarEdicao(ag)}
                        className="px-3 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-400 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => cancelarAgendamento(ag.id)}
                        className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-400 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
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
              className="w-full py-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/30 transition-all cursor-pointer mt-2"
            >
              Fazer novo agendamento
            </button>
          </div>
        )}

        {/* EDITAR DATA */}
        {etapa === 'editar_data' && (
          <form onSubmit={confirmarNovaDataEdicao} className="pt-2 space-y-3">
            <input 
              type="date"
              required
              value={dataEscolhida}
              onChange={(e) => setDataEscolhida(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500 [color-scheme:dark] backdrop-blur-md"
            />
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 font-black text-xs uppercase tracking-widest cursor-pointer shadow-lg flex items-center justify-center gap-2"
            >
              <span>Avançar para Horários</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* EDITAR HORÁRIO */}
        {etapa === 'editar_horario' && (
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
                      ? 'bg-black/20 text-slate-600 border-white/5 line-through opacity-40 cursor-not-allowed'
                      : 'bg-black/50 text-white border-white/10 hover:border-emerald-500 cursor-pointer'
                  }`}
                >
                  {h}
                </button>
              );
            })}
          </div>
        )}

        {/* SERVIÇO */}
        {etapa === 'servico' && (
          <div className="grid grid-cols-1 gap-2 pt-2">
            {servicos.map((s) => (
              <button
                key={s.id}
                onClick={() => selecionarServico(s)}
                className="p-3.5 rounded-2xl bg-black/50 border border-white/10 hover:border-emerald-500 text-left flex justify-between items-center transition-all cursor-pointer backdrop-blur-md group"
              >
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">{s.nome}</p>
                  <p className="text-[10px] text-slate-400">{s.duracao_minutos || 30} minutos</p>
                </div>
                <span className="text-xs font-black text-emerald-400">R$ {Number(s.preco).toFixed(2)}</span>
              </button>
            ))}
          </div>
        )}

        {/* BARBEIRO */}
        {etapa === 'barbeiro' && (
          <div className="grid grid-cols-1 gap-2 pt-2">
            {barbeiros.map((b) => {
              const foto = b.foto || b.avatar || b.imagem;
              return (
                <button
                  key={b.id}
                  onClick={() => selecionarBarbeiro(b)}
                  className="p-3.5 rounded-2xl bg-black/50 border border-white/10 hover:border-emerald-500 text-left flex items-center gap-3 transition-all cursor-pointer backdrop-blur-md group"
                >
                  {foto ? (
                    <img src={foto} alt={b.nome} className="w-9 h-9 rounded-full object-cover border border-white/20" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-white/10 text-emerald-400 flex items-center justify-center font-bold text-xs border border-white/15">
                      {b.nome?.charAt(0)}
                    </div>
                  )}
                  <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">{b.nome}</p>
                </button>
              );
            })}
          </div>
        )}

        {/* DATA */}
        {etapa === 'data' && (
          <form onSubmit={confirmarData} className="pt-2 space-y-3">
            <input 
              type="date"
              required
              value={dataEscolhida}
              onChange={(e) => setDataEscolhida(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500 [color-scheme:dark] backdrop-blur-md"
            />
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 font-black text-xs uppercase tracking-widest cursor-pointer shadow-lg flex items-center justify-center gap-2"
            >
              <span>Avançar para Horários</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* HORÁRIO */}
        {etapa === 'horario' && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
            {HORARIOS_DISPONIVEIS.map((h) => {
              const ocupado = horariosOcupados.includes(h);
              return (
                <button
                  key={h}
                  disabled={ocupado || loading}
                  onClick={() => selecionarHorario(h)}
                  className={`py-2.5 rounded-xl text-xs font-black border transition-all backdrop-blur-md ${
                    ocupado
                      ? 'bg-black/20 text-slate-600 border-white/5 line-through opacity-40 cursor-not-allowed'
                      : 'bg-black/50 text-white border-white/10 hover:border-emerald-500 cursor-pointer'
                  }`}
                >
                  {h}
                </button>
              );
            })}
          </div>
        )}

        {/* RESUMO ANTES DE CONFIRMAR */}
        {etapa === 'resumo' && (
          <div className="p-4 rounded-2xl bg-black/60 border border-emerald-500/40 space-y-2.5 backdrop-blur-md mt-2">
            <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider">Resumo do Agendamento</h4>
            <div className="space-y-1 text-xs text-slate-200">
              <p>✂️ <strong className="text-white">Serviço:</strong> {servicoEscolhido?.nome} (R$ {Number(servicoEscolhido?.preco || 0).toFixed(2)})</p>
              <p>👤 <strong className="text-white">Profissional:</strong> {barbeiroEscolhido?.nome}</p>
              <p>📅 <strong className="text-white">Data:</strong> {dataEscolhida.split('-').reverse().join('/')}</p>
              <p>⏰ <strong className="text-white">Horário:</strong> {horaEscolhida}</p>
              <p>👤 <strong className="text-white">Cliente:</strong> {nome} ({telefone})</p>
            </div>
            <button
              disabled={loading}
              onClick={confirmarAgendamentoFinal}
              className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 font-black text-xs uppercase tracking-widest cursor-pointer shadow-lg hover:brightness-110 transition-all"
            >
              {loading ? 'A confirmar...' : 'Confirmar Agendamento'}
            </button>
          </div>
        )}

        {etapa === 'sucesso' && (
          <div className="pt-2 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all cursor-pointer border border-white/10"
            >
              Fazer Novo Agendamento
            </button>
          </div>
        )}
      </div>

      {/* ERROS */}
      {erro && (
        <div className="mx-6 mb-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 backdrop-blur-md shrink-0">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {/* INPUT DE TEXTO */}
      {(etapa === 'telefone' || etapa === 'nome') && (
        <form onSubmit={handleEnviarResposta} className="p-4 sm:p-5 border-t border-white/10 bg-black/60 backdrop-blur-xl flex items-center gap-2 shrink-0">
          <input
            type={etapa === 'telefone' ? 'tel' : 'text'}
            placeholder={etapa === 'telefone' ? 'Digite seu telemóvel...' : 'Digite seu nome completo...'}
            value={inputTexto}
            onChange={(e) => setInputTexto(e.target.value)}
            className="w-full bg-black/80 border border-white/10 rounded-2xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 shadow-inner"
          />
          <button
            type="submit"
            className="w-12 h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 flex items-center justify-center shadow-lg shrink-0 cursor-pointer hover:scale-105 transition-transform"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}

    </div>
  );
}