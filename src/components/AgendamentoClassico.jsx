'use client';

import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Scissors, User, CheckCircle2, AlertCircle, ArrowRight, XCircle, Edit3 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const HORARIOS_DISPONIVEIS = [
  '08:00', '09:00', '10:00', '11:00', 
  '13:00', '14:00', '15:00', '16:00', 
  '17:00', '18:00', '19:00'
];

export default function AgendamentoClassico({ barbeariaId }) {
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

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  const corTema = barbearia?.cor_tema || '#10b981';

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
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
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

  const handleVerificarTelefone = async (e) => {
    e.preventDefault();
    if (telefone.length < 8) {
      setErro('Por favor, informe um número de telemóvel válido.');
      return;
    }
    setErro(null);
    setLoading(true);

    try {
      const { data: cliExistente } = await supabase
        .from('clientes')
        .select('id, nome')
        .eq('barbearia_id', barbeariaId)
        .eq('telefone', telefone)
        .maybeSingle();

      if (cliExistente) {
        setClienteId(cliExistente.id);
        setNome(cliExistente.nome);

        const agsAtivos = await atualizarAgendamentosAtivos(cliExistente.id);

        if (agsAtivos.length > 0) {
          setEtapa('menu_inicial');
        } else {
          setEtapa('servico');
        }
      } else {
        setEtapa('nome');
      }
    } catch (err) {
      setErro('Erro ao verificar cliente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCadastrarNome = async (e) => {
    e.preventDefault();
    if (nome.length < 2) {
      setErro('Por favor, informe um nome válido.');
      return;
    }
    setErro(null);
    setLoading(true);

    try {
      const { data: novoCli, error: errCli } = await supabase
        .from('clientes')
        .insert([{ barbearia_id: barbeariaId, nome, telefone }])
        .select('id')
        .single();

      if (errCli) throw errCli;
      setClienteId(novoCli.id);
      setEtapa('servico');
    } catch (err) {
      setErro('Erro ao registar cliente.');
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
      await atualizarAgendamentosAtivos(clienteId);
    } catch (err) {
      setErro('Erro ao cancelar agendamento.');
    }
  };

  const confirmarEdicaoHorario = async (hora) => {
    setLoading(true);
    try {
      const dataHoraIso = new Date(`${dataEscolhida}T${hora}:00`).toISOString();
      const { error } = await supabase
        .from('agendamentos')
        .update({ data_hora: dataHoraIso })
        .eq('id', agendamentoEmEdicao.id);

      if (error) throw error;
      await atualizarAgendamentosAtivos(clienteId);
      setEtapa('sucesso');
    } catch (err) {
      setErro('Erro ao atualizar agendamento.');
    } finally {
      setLoading(false);
    }
  };

  const confirmarAgendamentoFinal = async () => {
    setLoading(true);
    try {
      const dataHoraIso = new Date(`${dataEscolhida}T${horaEscolhida}:00`).toISOString();
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
      await atualizarAgendamentosAtivos(clienteId);
      setEtapa('sucesso');
    } catch (err) {
      setErro('Erro ao concluir agendamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto rounded-[2.5rem] bg-gradient-to-br from-[#0c0d10] via-[#050507] to-[#000000] border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.9)] text-white overflow-hidden relative backdrop-blur-2xl">
      
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-[3px] z-30" style={{ background: `linear-gradient(to right, transparent, ${corTema}, transparent)` }}></div>

      <div className="relative h-32 w-full bg-stone-900 overflow-hidden">
        {barbearia?.capa_url ? (
          <img src={barbearia.capa_url} alt="Capa" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center">
            <span className="text-[10px] font-bold text-stone-500 tracking-wider uppercase">Capa da Unidade</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
      </div>

      <div className="px-6 pb-4 pt-0 relative flex flex-col items-center text-center -mt-10 mb-2 z-10">
        <div className="w-20 h-20 rounded-[1.8rem] bg-black/80 p-1 shadow-2xl border border-white/20 overflow-hidden flex items-center justify-center backdrop-blur-xl mb-2">
          {barbearia?.logo_url ? (
            <img src={barbearia.logo_url} alt={barbearia.nome} className="w-full h-full object-cover rounded-[1.4rem]" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-stone-800 to-black text-white rounded-[1.4rem] flex items-center justify-center font-black text-lg">
              {barbearia?.nome?.charAt(0) || 'B'}
            </div>
          )}
        </div>
        <h2 className="text-base font-black text-white tracking-tight">{barbearia?.nome}</h2>
        <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: corTema }}>Agendamento Online Clássico</p>
      </div>

      <div className="p-6 sm:p-8 pt-0 space-y-5">

        {etapa === 'telefone' && (
          <form onSubmit={handleVerificarTelefone} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Informe o seu telemóvel / WhatsApp</label>
              <input
                type="tel"
                required
                placeholder="(00) 00000-0000"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-3.5 text-xs font-bold text-white focus:outline-none shadow-inner backdrop-blur-md"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl text-slate-950 font-black text-xs uppercase tracking-widest cursor-pointer shadow-lg flex items-center justify-center gap-2 transition-all hover:brightness-110"
              style={{ backgroundColor: corTema }}
            >
              <span>Continuar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {etapa === 'nome' && (
          <form onSubmit={handleCadastrarNome} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Primeira vez por aqui? Digite seu nome completo:</label>
              <input
                type="text"
                required
                placeholder="Seu Nome Completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-3.5 text-xs font-bold text-white focus:outline-none shadow-inner backdrop-blur-md"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl text-slate-950 font-black text-xs uppercase tracking-widest cursor-pointer shadow-lg flex items-center justify-center gap-2 transition-all hover:brightness-110"
              style={{ backgroundColor: corTema }}
            >
              <span>Avançar para Serviços</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {etapa === 'menu_inicial' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-md text-center">
              <p className="text-xs font-bold text-white">Olá, {nome}! Detetamos agendamentos ativos na sua conta.</p>
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              <button
                onClick={() => setEtapa('servico')}
                className="p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer backdrop-blur-md font-bold text-xs text-white"
                style={{ backgroundColor: `${corTema}15`, borderColor: `${corTema}40` }}
              >
                <span>Fazer novo agendamento</span>
                <ArrowRight className="w-4 h-4" style={{ color: corTema }} />
              </button>
              <button
                onClick={() => { atualizarAgendamentosAtivos(clienteId); setEtapa('gerenciar'); }}
                className="p-3.5 rounded-2xl bg-black/50 border border-white/10 hover:border-white/20 text-left flex items-center justify-between transition-all cursor-pointer backdrop-blur-md font-bold text-xs text-white"
              >
                <span>Ver / Gerenciar meus agendamentos</span>
                <CalendarIcon className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        )}

        {etapa === 'gerenciar' && (
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Seus Agendamentos Ativos</h3>
            {agendamentosCliente.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-2">Nenhum agendamento ativo.</p>
            ) : (
              agendamentosCliente.map((ag) => (
                <div key={ag.id} className="p-4 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-between gap-3 backdrop-blur-md">
                  <div>
                    <p className="text-xs font-bold text-white">{ag.servicos?.nome}</p>
                    <p className="text-[10px] font-medium" style={{ color: corTema }}>{ag.barbeiros?.nome}</p>
                    <p className="text-[10px] text-slate-300 mt-0.5">📅 {new Date(ag.data_hora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => { setAgendamentoEmEdicao(ag); setEtapa('editar_data'); }}
                      className="px-3 py-2 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-400 text-[10px] font-bold cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => cancelarAgendamento(ag.id)}
                      className="px-3 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] font-bold cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ))
            )}
            <button
              onClick={() => setEtapa('servico')}
              className="w-full py-3 rounded-2xl border text-xs font-bold cursor-pointer mt-2"
              style={{ backgroundColor: `${corTema}20`, color: corTema, borderColor: `${corTema}40` }}
            >
              Fazer novo agendamento
            </button>
          </div>
        )}

        {etapa === 'servico' && (
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">1. Escolha o Serviço</h3>
            <div className="grid grid-cols-1 gap-2.5 max-h-[300px] overflow-y-auto">
              {servicos.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setServicoEscolhido(s); setEtapa('barbeiro'); }}
                  className="p-3.5 rounded-2xl bg-black/50 border border-white/10 hover:border-white/30 text-left flex justify-between items-center transition-all cursor-pointer backdrop-blur-md"
                >
                  <div>
                    <p className="text-xs font-bold text-white">{s.nome}</p>
                    <p className="text-[10px] text-slate-400">{s.duracao_minutos || 30} minutos</p>
                  </div>
                  <span className="text-xs font-black" style={{ color: corTema }}>R$ {Number(s.preco).toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {etapa === 'barbeiro' && (
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">2. Escolha o Profissional</h3>
            <div className="grid grid-cols-1 gap-2.5">
              {barbeiros.map((b) => (
                <button
                  key={b.id}
                  onClick={() => { setBarbeiroEscolhido(b); setEtapa('data'); }}
                  className="p-3.5 rounded-2xl bg-black/50 border border-white/10 hover:border-white/30 text-left flex items-center gap-3 transition-all cursor-pointer backdrop-blur-md"
                >
                  {b.foto ? (
                    <img src={b.foto} alt={b.nome} className="w-9 h-9 rounded-full object-cover border border-white/20" />
                  ) : (
                    <div className="w-9 h-9 rounded-full text-white flex items-center justify-center font-bold text-xs" style={{ backgroundColor: corTema }}>
                      {b.nome?.charAt(0)}
                    </div>
                  )}
                  <p className="text-xs font-bold text-white">{b.nome}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {etapa === 'data' && (
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">3. Escolha a Data</h3>
            <input 
              type="date"
              required
              value={dataEscolhida}
              onChange={(e) => setDataEscolhida(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none [color-scheme:dark] backdrop-blur-md"
            />
            <button
              disabled={!dataEscolhida}
              onClick={() => setEtapa('horario')}
              className="w-full py-3.5 rounded-2xl text-slate-950 font-black text-xs uppercase tracking-widest cursor-pointer shadow-lg disabled:opacity-50"
              style={{ backgroundColor: corTema }}
            >
              Avançar para Horários
            </button>
          </div>
        )}

        {etapa === 'horario' && (
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">4. Escolha o Horário</h3>
            <div className="grid grid-cols-3 gap-2 max-h-[250px] overflow-y-auto">
              {HORARIOS_DISPONIVEIS.map((h) => {
                const ocupado = horariosOcupados.includes(h);
                return (
                  <button
                    key={h}
                    disabled={ocupado}
                    onClick={() => { setHoraEscolhida(h); setEtapa('resumo'); }}
                    className={`py-2.5 rounded-xl text-xs font-black border transition-all ${
                      ocupado 
                        ? 'bg-black/20 text-slate-600 border-white/5 line-through opacity-40 cursor-not-allowed' 
                        : 'bg-black/50 text-white border-white/10 cursor-pointer hover:border-white/30'
                    }`}
                  >
                    {h}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {etapa === 'editar_data' && (
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Nova Data</h3>
            <input 
              type="date"
              required
              value={dataEscolhida}
              onChange={(e) => setDataEscolhida(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-black/50 border border-white/10 text-xs text-white [color-scheme:dark]"
            />
            <button
              disabled={!dataEscolhida}
              onClick={() => setEtapa('editar_horario')}
              className="w-full py-3.5 rounded-2xl text-slate-950 font-black text-xs uppercase"
              style={{ backgroundColor: corTema }}
            >
              Escolher Horário
            </button>
          </div>
        )}

        {etapa === 'editar_horario' && (
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Novo Horário</h3>
            <div className="grid grid-cols-3 gap-2">
              {HORARIOS_DISPONIVEIS.map((h) => (
                <button
                  key={h}
                  disabled={horariosOcupados.includes(h) || loading}
                  onClick={() => confirmarEdicaoHorario(h)}
                  className="py-2.5 rounded-xl text-xs font-black bg-black/50 text-white border border-white/10 cursor-pointer"
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        )}

        {etapa === 'resumo' && (
          <div className="p-4 rounded-2xl bg-black/60 border space-y-3 backdrop-blur-md" style={{ borderColor: `${corTema}66` }}>
            <h4 className="text-xs font-black uppercase tracking-wider" style={{ color: corTema }}>Resumo do Agendamento</h4>
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
              className="w-full mt-2 py-3.5 rounded-xl text-slate-950 font-black text-xs uppercase tracking-widest cursor-pointer shadow-lg hover:brightness-110"
              style={{ backgroundColor: corTema }}
            >
              {loading ? 'A confirmar...' : 'Confirmar Agendamento'}
            </button>
          </div>
        )}

        {etapa === 'sucesso' && (
          <div className="py-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl text-slate-950 flex items-center justify-center mx-auto shadow-lg" style={{ backgroundColor: corTema }}>
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-white">Agendamento Concluído!</h3>
            <p className="text-xs text-slate-400">O seu horário foi registado com sucesso. Aguardamos a sua visita!</p>
            
            <div className="grid grid-cols-1 gap-2 pt-2">
              <button
                onClick={() => setEtapa('servico')}
                className="w-full py-3 rounded-2xl text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-md"
                style={{ backgroundColor: corTema }}
              >
                Fazer Novo Agendamento
              </button>
              <button
                onClick={() => { atualizarAgendamentosAtivos(clienteId); setEtapa('gerenciar'); }}
                className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all cursor-pointer border border-white/10"
              >
                Ver Meus Agendamentos
              </button>
            </div>
          </div>
        )}

      </div>

      {erro && (
        <div className="mx-6 mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

    </div>
  );
}