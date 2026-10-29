'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Calendar, CheckCircle2, DollarSign, History, X, Clock, Trash2, 
  Check, User, Scissors, Plus, UserPlus, ChevronRight
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function PainelAgendaDia({ profissionalId, barbeariaId, barbeariaProp, taxaComissao = 50 }) {
  const [todosAgendamentos, setTodosAgendamentos] = useState([]);
  const [barbeiros, setBarbeiros] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [barbeariaObj, setBarbeariaObj] = useState(barbeariaProp || null);
  const [barbeariaAtivaId, setBarbeariaAtivaId] = useState(barbeariaId || null);
  const [barbeiroSelecionado, setBarbeiroSelecionado] = useState('todos');
  const [carregando, setCarregando] = useState(true);
  const [erroFatal, setErroFatal] = useState(null);
  const [processandoId, setProcessandoId] = useState(null);

  const [horaAtualRelogio, setHoraAtualRelogio] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setHoraAtualRelogio(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const obterDataLocalIso = (d = new Date()) => {
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  const [dataSelecionada, setDataSelecionada] = useState(obterDataLocalIso());
  const [modalHistoricoOpen, setModalHistoricoOpen] = useState(false);
  const [filtroDataHistorico, setFiltroDataHistorico] = useState('');
  const [filtroStatusHistorico, setFiltroStatusHistorico] = useState('todos');

  // ESTADOS DO MODAL DE AGENDAMENTO MANUAL
  const [modalAgendamentoOpen, setModalAgendamentoOpen] = useState(false);
  const [horarioSelecionadoSlot, setHorarioSelecionadoSlot] = useState('');
  const [novoClienteNome, setNovoClienteNome] = useState('');
  const [novoClienteTelefone, setNovoClienteTelefone] = useState('');
  const [servicoIdManual, setServicoIdManual] = useState('');
  const [barbeiroIdManual, setBarbeiroIdManual] = useState('');
  const [salvandoAgendamento, setSalvandoAgendamento] = useState(false);

  // ESTADOS DOS SUBMODAIS DE SELEÇÃO
  const [modalServicosOpen, setModalServicosOpen] = useState(false);
  const [modalProfissionaisOpen, setModalProfissionaisOpen] = useState(false);

  const extrairDataIso = (item) => {
    const dataStr = item.data_hora || item.data || item.created_at || '';
    if (!dataStr) return '';
    try {
      const d = new Date(dataStr);
      return obterDataLocalIso(d);
    } catch {
      return String(dataStr).substring(0, 10);
    }
  };

  const formatarDataHora = (dataHoraStr) => {
    if (!dataHoraStr) return '';
    try {
      const data = new Date(dataHoraStr);
      return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dataHoraStr;
    }
  };

  const extrairHoraMinuto = (dataHoraStr) => {
    if (!dataHoraStr) return '--:--';
    try {
      if (dataHoraStr.includes('T')) {
        const horaPart = dataHoraStr.split('T')[1];
        if (horaPart) {
          return horaPart.substring(0, 5);
        }
      }
      const data = new Date(dataHoraStr);
      return data.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC'
      });
    } catch {
      return '';
    }
  };

  const isHorarioEmAndamento = (dataHoraStr) => {
    const hojeIso = obterDataLocalIso();
    if (dataSelecionada !== hojeIso) return false;

    const horaItemStr = extrairHoraMinuto(dataHoraStr);
    if (!horaItemStr || !horaItemStr.includes(':')) return false;

    const hItem = parseInt(horaItemStr.split(':')[0], 10);
    const hAtual = horaAtualRelogio.getHours();

    return hItem === hAtual;
  };

  const carregarAgenda = async () => {
    try {
      setErroFatal(null);
      let barbeariaAtiva = barbeariaId;

      if (!barbeariaAtiva) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: barbeariaData } = await supabase
            .from('barbearias')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (barbeariaData) {
            barbeariaAtiva = barbeariaData.id;
            setBarbeariaObj(barbeariaData);
          }
        }
      } else if (!barbeariaObj) {
        const { data: barbeariaData } = await supabase
          .from('barbearias')
          .select('*')
          .eq('id', barbeariaAtiva)
          .single();

        if (barbeariaData) setBarbeariaObj(barbeariaData);
      }

      if (!barbeariaAtiva) {
        const { data: barbGeral } = await supabase.from('barbearias').select('*').limit(1).single();
        if (barbGeral) {
          barbeariaAtiva = barbGeral.id;
          setBarbeariaObj(barbGeral);
        }
      }

      if (barbeariaAtiva) {
        setBarbeariaAtivaId(barbeariaAtiva);

        const { data: barbeirosData } = await supabase
          .from('barbeiros')
          .select('*')
          .eq('barbearia_id', barbeariaAtiva)
          .order('nome', { ascending: true });

        if (barbeirosData) setBarbeiros(barbeirosData);

        const { data: clientesData } = await supabase
          .from('clientes')
          .select('id, nome, telefone, barbearia_id')
          .eq('barbearia_id', barbeariaAtiva);

        if (clientesData) setClientes(clientesData);

        const { data: servicosData, error: errServ } = await supabase
          .from('servicos')
          .select('*')
          .eq('barbearia_id', barbeariaAtiva)
          .order('nome', { ascending: true });

        if (errServ) {
          console.error('Erro ao carregar serviços:', errServ);
        } else if (servicosData) {
          setServicos(servicosData);
        }
      }

      let query = supabase
        .from('agendamentos')
        .select(`
          id,
          cliente_id,
          barbeiro_id,
          servico_id,
          data_hora,
          status,
          valor_total,
          barbearia_id,
          clientes:cliente_id (nome),
          servicos:servico_id (nome, preco),
          barbeiros:barbeiro_id (id, nome, foto, barbearia_id)
        `)
        .order('data_hora', { ascending: true });

      if (barbeariaAtiva) {
        query = query.eq('barbearia_id', barbeariaAtiva);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (data) setTodosAgendamentos(data);
    } catch (err) {
      setErroFatal(err.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarAgenda();
    const channel = supabase
      .channel('realtime-agendamentos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agendamentos' }, () => {
        carregarAgenda();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [barbeariaId, profissionalId]);

  const concluirAgendamento = async (id) => {
    try {
      setProcessandoId(id);
      const { error } = await supabase.from('agendamentos').update({ status: 'concluido' }).eq('id', id);
      if (error) throw error;
    } catch (err) {
      alert('Erro ao concluir agendamento: ' + err.message);
    } finally {
      setProcessandoId(null);
    }
  };

  const cancelarAgendamento = async (id) => {
    try {
      setProcessandoId(id);
      const { error } = await supabase.from('agendamentos').update({ status: 'cancelado' }).eq('id', id);
      if (error) throw error;
    } catch (err) {
      alert('Erro ao cancelar agendamento: ' + err.message);
    } finally {
      setProcessandoId(null);
    }
  };

  const excluirAgendamento = async (id) => {
    if (!window.confirm('Deseja realmente excluir este agendamento?')) return;
    try {
      setProcessandoId(id);
      const { error } = await supabase.from('agendamentos').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      alert('Erro ao excluir agendamento: ' + err.message);
    } finally {
      setProcessandoId(null);
    }
  };

  const criarAgendamentoManual = async (e) => {
    e.preventDefault();
    if (!novoClienteNome || !servicoIdManual || !barbeiroIdManual) {
      alert('Preencha o nome do cliente, selecione o serviço e o profissional.');
      return;
    }

    try {
      setSalvandoAgendamento(true);
      let barbeariaAtiva = barbeariaAtivaId || barbeariaId;

      if (!barbeariaAtiva && barbeiros.length > 0) {
        barbeariaAtiva = barbeiros[0].barbearia_id;
      }

      let clienteIdFinal = null;
      const clienteExistente = clientes.find(c => c.nome.toLowerCase() === novoClienteNome.toLowerCase());
      
      if (clienteExistente) {
        clienteIdFinal = clienteExistente.id;
      } else {
        const { data: novoCli, error: errCli } = await supabase
          .from('clientes')
          .insert([{ nome: novoClienteNome, telefone: novoClienteTelefone || '', barbearia_id: barbeariaAtiva }])
          .select('id')
          .single();

        if (errCli) throw errCli;
        clienteIdFinal = novoCli.id;
      }

      const servicoObj = servicos.find(s => String(s.id) === String(servicoIdManual));
      const valorServico = servicoObj ? (servicoObj.preco || 0) : 0;
      const dataHoraCompleta = `${dataSelecionada}T${horarioSelecionadoSlot}:00`;

      const { error: errAgend } = await supabase
        .from('agendamentos')
        .insert([{
          barbearia_id: barbeariaAtiva,
          cliente_id: clienteIdFinal,
          barbeiro_id: barbeiroIdManual,
          servico_id: servicoIdManual,
          data_hora: dataHoraCompleta,
          status: 'agendado',
          valor_total: valorServico
        }]);

      if (errAgend) throw errAgend;

      alert('Agendamento criado com sucesso!');
      setModalAgendamentoOpen(false);
      setNovoClienteNome('');
      setNovoClienteTelefone('');
      setServicoIdManual('');
      setBarbeiroIdManual('');
      carregarAgenda();
    } catch (err) {
      alert('Erro ao criar agendamento: ' + err.message);
    } finally {
      setSalvandoAgendamento(false);
    }
  };

  const agendamentosDoDiaSelecionado = todosAgendamentos
    .filter(item => extrairDataIso(item) === dataSelecionada)
    .filter(item => barbeiroSelecionado === 'todos' || String(item.barbeiro_id) === String(barbeiroSelecionado));

  const agendamentosPendentesDia = agendamentosDoDiaSelecionado.filter(item => {
    const status = (item.status || 'agendado').toLowerCase();
    return status !== 'concluido' && status !== 'cancelado' && status !== 'finalizado' && status !== 'cancelada';
  });

  const totalAtendimentosDia = agendamentosDoDiaSelecionado.length;
  const concluidosDia = agendamentosDoDiaSelecionado.filter(i => (i.status || '').toLowerCase() === 'concluido').length;
  const valorTotalDia = agendamentosDoDiaSelecionado
    .filter(i => (i.status || '').toLowerCase() !== 'cancelado')
    .reduce((acc, item) => acc + Number(item.valor_total || item.servicos?.preco || 0), 0);

  // GERAÇÃO DINÂMICA UNIFICADA COM O CONFIGURADOR DE HORÁRIOS DO BARBEIRO
  const obterItensExibicao = () => {
    if (barbeiroSelecionado === 'todos') {
      return agendamentosPendentesDia.sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora)).map(item => ({
        tipo: 'ocupado',
        dados: item
      }));
    }

    const slots = [];
    const dataObj = new Date(dataSelecionada + 'T00:00:00');
    const diaSemanaIndex = dataObj.getDay(); 
    
    const diasSemanaMap = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const nomeDiaAtual = diasSemanaMap[diaSemanaIndex];

    const barbeiroObjAtual = barbeiros.find(b => String(b.id) === String(barbeiroSelecionado));

    let configDiaBarbeiro = barbeiroObjAtual?.horarios_trabalho?.[nomeDiaAtual];

    if (!configDiaBarbeiro || configDiaBarbeiro.ativo === false) {
      configDiaBarbeiro = barbeariaObj?.horarios?.[nomeDiaAtual];
    }

    if (configDiaBarbeiro && configDiaBarbeiro.ativo === false) {
      return []; 
    }

    let aberturaStr = configDiaBarbeiro?.abertura || configDiaBarbeiro?.inicio || '08:00';
    let fechamentoStr = configDiaBarbeiro?.fechamento || configDiaBarbeiro?.fim || '18:00';
    let pausaInStr = configDiaBarbeiro?.pausaInicio || configDiaBarbeiro?.almoco_inicio || null;
    let pausaFimStr = configDiaBarbeiro?.pausaFim || configDiaBarbeiro?.almoco_fim || null;

    const paraMinutos = (hStr) => {
      if (!hStr) return null;
      const [h, m] = hStr.split(':').map(Number);
      return h * 60 + m;
    };

    const minAbertura = paraMinutos(aberturaStr) ?? 8 * 60;
    const minFechamento = paraMinutos(fechamentoStr) ?? 18 * 60;
    const minPausaIn = paraMinutos(pausaInStr);
    const minPausaFim = paraMinutos(pausaFimStr);

    const hojeIso = obterDataLocalIso();
    const isHoje = dataSelecionada === hojeIso;
    const agora = new Date();
    const horaAtual = agora.getHours();

    for (let min = minAbertura; min < minFechamento; min += 60) {
      const h = Math.floor(min / 60);

      if (minPausaIn !== null && minPausaFim !== null && min >= minPausaIn && min < minPausaFim) {
        continue;
      }

      const horaStr = `${String(h).padStart(2, '0')}:00`;
      if (isHoje && h < horaAtual) continue;

      const agendamentosNoHorario = agendamentosPendentesDia.filter(item => {
        const hItem = extrairHoraMinuto(item.data_hora);
        return hItem.startsWith(horaStr.substring(0, 2));
      });

      if (agendamentosNoHorario.length > 0) {
        agendamentosNoHorario.forEach(agendamento => {
          slots.push({ tipo: 'ocupado', dados: agendamento });
        });
      } else {
        slots.push({ tipo: 'livre', horario: horaStr });
      }
    }

    return slots;
  };

  const itensExibicao = obterItensExibicao();

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

  const servicoSelecionadoObj = servicos.find(s => String(s.id) === String(servicoIdManual));
  const barbeiroSelecionadoObj = barbeiros.find(b => String(b.id) === String(barbeiroIdManual));

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-0 space-y-4 pb-24">
      
      {erroFatal && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-2xl shadow-sm">
          <div className="text-red-700 text-xs font-medium">Erro ao carregar agenda: {erroFatal}</div>
        </div>
      )}

      {/* CARDS DO TOPO */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div 
          className="relative rounded-3xl p-4 sm:p-5 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
            boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.8)'
          }}
        >
          <div className="flex flex-col justify-center min-w-0 pr-2">
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider truncate block">Agendamentos</span>
            <h3 className="text-lg sm:text-xl font-black text-white mt-0.5 truncate">{totalAtendimentosDia}</h3>
          </div>
          <div 
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)',
              boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 1), inset 0 -4px 6px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.9)'
            }}
          >
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
          </div>
        </div>

        <div 
          className="relative rounded-3xl p-4 sm:p-5 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
            boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.8)'
          }}
        >
          <div className="flex flex-col justify-center min-w-0 pr-2">
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider truncate block">Concluídos</span>
            <h3 className="text-lg sm:text-xl font-black text-white mt-0.5 truncate">{concluidosDia}/{totalAtendimentosDia}</h3>
          </div>
          <div 
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)',
              boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 1), inset 0 -4px 6px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.9)'
            }}
          >
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
          </div>
        </div>

        <div 
          className="relative rounded-3xl p-4 sm:p-5 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
            boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.8)'
          }}
        >
          <div className="flex flex-col justify-center min-w-0 pr-2">
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider truncate block">Projeção</span>
            <h3 className="text-lg sm:text-xl font-black text-white mt-0.5 truncate">R$ {valorTotalDia.toFixed(0)}</h3>
          </div>
          <div 
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)',
              boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 1), inset 0 -4px 6px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.9)'
            }}
          >
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
          </div>
        </div>

        <button
          onClick={() => setModalHistoricoOpen(true)}
          className="relative rounded-3xl p-4 sm:p-5 flex items-center justify-between border border-stone-200/80 bg-white transition-all cursor-pointer group min-w-0 overflow-hidden shadow-xs hover:shadow-sm"
        >
          <div className="flex flex-col justify-center min-w-0 pr-2 text-left">
            <span className="text-[9px] font-extrabold text-stone-400 uppercase tracking-wider truncate block">Registros</span>
            <span className="text-xs sm:text-sm font-black text-stone-900 mt-0.5 truncate">Ver Histórico</span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#222222] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <History className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </button>
      </div>

      {/* SELETOR DE DIAS */}
      <div className="bg-white rounded-3xl p-3.5 border border-stone-200/90 shadow-xs space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">Selecionar Dia</span>
          <span className="text-[11px] font-bold text-stone-900 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200 truncate">
            {new Date(dataSelecionada + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 pt-1">
          {proximaSemanaDias.map((dia) => {
            const selecionado = dataSelecionada === dia.iso;
            const qtdNoDia = todosAgendamentos.filter(item => {
              const dataItem = extrairDataIso(item);
              const status = (item.status || 'agendado').toLowerCase();
              return dataItem === dia.iso && status !== 'concluido' && status !== 'cancelado';
            }).length;

            return (
              <button
                key={dia.iso}
                onClick={() => setDataSelecionada(dia.iso)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all cursor-pointer relative ${
                  selecionado 
                    ? 'bg-stone-900 text-white shadow-xs scale-105 border border-stone-900' 
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200/70'
                }`}
              >
                <span className={`text-[8px] uppercase font-bold tracking-wider ${selecionado ? 'text-stone-300' : 'text-stone-400'}`}>
                  {dia.nomeDia}
                </span>
                <span className="text-xs sm:text-sm font-black my-0.5">{dia.numeroDia}</span>
                <span className={`text-[8px] uppercase font-semibold ${selecionado ? 'text-stone-400' : 'text-stone-500'}`}>
                  {dia.nomeMes}
                </span>

                {qtdNoDia > 0 && (
                  <span className={`absolute -top-1.5 -right-1 w-3.5 h-3.5 rounded-full text-[8px] font-black flex items-center justify-center shadow-2xs z-10 ${
                    selecionado ? 'bg-emerald-400 text-stone-950' : 'bg-stone-900 text-white'
                  }`}>
                    {qtdNoDia}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* FILTRO DE PROFISSIONAIS */}
      <div className="bg-white rounded-3xl p-3 border border-stone-200/90 shadow-xs space-y-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 px-1 block">
          Filtrar Por Profissional
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setBarbeiroSelecionado('todos')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 border ${
              barbeiroSelecionado === 'todos'
                ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Todos ({todosAgendamentos.filter(i => extrairDataIso(i) === dataSelecionada && (i.status || 'agendado').toLowerCase() !== 'concluido' && (i.status || '').toLowerCase() !== 'cancelado').length})</span>
          </button>

          {barbeiros.map((b) => {
            const isSelected = String(barbeiroSelecionado) === String(b.id);
            const qtdBarbeiro = todosAgendamentos.filter(
              i => extrairDataIso(i) === dataSelecionada && 
                   String(i.barbeiro_id) === String(b.id) && 
                   (i.status || 'agendado').toLowerCase() !== 'concluido' && 
                   (i.status || '').toLowerCase() !== 'cancelado'
            ).length;

            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setBarbeiroSelecionado(b.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                {b.foto ? (
                  <img src={b.foto} alt={b.nome} className="w-5 h-5 rounded-full object-cover border border-stone-300" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-stone-200 text-stone-800 font-extrabold flex items-center justify-center text-[9px]">
                    {b.nome[0]}
                  </div>
                )}
                <span>{b.nome}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
                  isSelected ? 'bg-stone-800 text-emerald-400' : 'bg-stone-200 text-stone-600'
                }`}>
                  {qtdBarbeiro}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SEÇÃO PRINCIPAL: TIMELINE COMPACTA E DINÂMICA */}
      <div 
        className="relative rounded-3xl p-4 sm:p-6 border border-white/80 overflow-hidden shadow-xs"
        style={{
          background: 'linear-gradient(135deg, #f7f9f8 0%, #edf1f0 50%, #e2e8e6 100%)',
          boxShadow: '0 15px 30px rgba(0, 0, 0, 0.05), inset 0 2px 4px rgba(255, 255, 255, 0.9), inset 0 -3px 6px rgba(0, 0, 0, 0.03)'
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-stone-300/50 gap-2">
          <h2 className="text-sm sm:text-base font-extrabold text-stone-900 flex items-center gap-2 tracking-tight truncate">
            <span className="w-2 h-2 bg-[#111111] rounded-full shrink-0 shadow-[0_0_6px_rgba(17,17,17,0.4)]"></span>
            <span className="truncate">
              {barbeiroSelecionado === 'todos' ? 'Visão Geral dos Agendamentos' : `Agenda de ${barbeiros.find(b => String(b.id) === String(barbeiroSelecionado))?.nome || 'Profissional'}`}
            </span>
            <span className="text-[11px] font-bold text-stone-700 bg-white px-2 py-0.5 rounded-full border border-stone-200 shadow-2xs shrink-0">
              {barbeiroSelecionado === 'todos' ? agendamentosPendentesDia.length : itensExibicao.filter(i => i.tipo === 'ocupado').length}
            </span>
          </h2>
          
          <div className="inline-flex items-center px-3 py-1 rounded-xl text-[11px] font-bold text-stone-700 self-start sm:self-auto bg-white border border-stone-200 shadow-2xs">
            {new Date(dataSelecionada + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
          </div>
        </div>

        {carregando ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-stone-900"></div>
          </div>
        ) : itensExibicao.length === 0 ? (
          <div className="text-center py-12 text-stone-500 text-[11px] font-bold uppercase tracking-wider">
            Nenhum registro encontrado para esta seleção.
          </div>
        ) : (
          <div className="mt-4 relative pl-3 sm:pl-5 space-y-3.5">
            {/* LINHA GUIA VERTICAL */}
            <div className="absolute left-[18px] sm:left-[28px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-stone-300 via-stone-400 to-stone-200/40 rounded-full z-0" />

            {itensExibicao.map((slot, index) => {
              if (slot.tipo === 'ocupado') {
                const item = slot.dados;
                const fotoBarb = item.barbeiros?.foto;
                const preco = Number(item.valor_total || item.servicos?.preco || 0).toFixed(2);
                const emAndamento = isHorarioEmAndamento(item.data_hora);

                return (
                  <div key={`ocupado-${item.id}-${index}`} className="relative z-10 flex items-start gap-2.5 sm:gap-4">
                    <div className="flex flex-col items-center shrink-0 pt-1">
                      <div className={`w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] rounded-full flex items-center justify-center border-2 transition-all ${
                        emAndamento 
                          ? 'bg-stone-900 border-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' 
                          : 'bg-stone-900 border-white shadow-xs'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full bg-emerald-400 ${emAndamento ? 'animate-ping' : ''}`} />
                      </div>
                    </div>

                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="bg-white rounded-2xl border border-stone-200/90 p-3 sm:p-4 shadow-2xs hover:shadow-xs transition-all space-y-2.5 relative overflow-hidden">
                        
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-stone-900 text-white text-[11px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-2xs shrink-0">
                              <Clock className="w-3 h-3 text-emerald-400" />
                              {extrairHoraMinuto(item.data_hora)}
                            </span>

                            {emAndamento && (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md animate-pulse">
                                Em andamento
                              </span>
                            )}
                          </div>

                          <span className="text-stone-900 font-black text-xs sm:text-sm bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200/70 shrink-0">
                            R$ {preco}
                          </span>
                        </div>

                        <div className="bg-stone-100/80 text-stone-700 border border-stone-200/60 px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 w-fit">
                          <Scissors className="w-3 h-3 text-stone-500 shrink-0" />
                          <span>{item.servicos?.nome || 'Serviço'}</span>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          <div className="min-w-0 pr-1">
                            <h3 className="font-extrabold text-stone-900 text-xs sm:text-sm tracking-tight truncate">
                              {item.clientes?.nome || 'Cliente não identificado'}
                            </h3>
                            <p className="text-[11px] text-stone-500 font-medium truncate">
                              Profissional: <span className="text-stone-800 font-bold">{item.barbeiros?.nome || 'Não atribuído'}</span>
                            </p>
                          </div>

                          {fotoBarb ? (
                            <img src={fotoBarb} alt="Barbeiro" className="w-8 h-8 rounded-xl object-cover border border-stone-200 shrink-0 shadow-2xs" />
                          ) : (
                            <div className="w-8 h-8 rounded-xl bg-stone-100 border border-stone-200 text-stone-700 font-black flex items-center justify-center text-[10px] shrink-0">
                              {item.barbeiros?.nome ? item.barbeiros.nome[0] : 'P'}
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-stone-100 grid grid-cols-3 gap-1.5">
                          <button 
                            onClick={() => concluirAgendamento(item.id)}
                            disabled={processandoId === item.id}
                            className="py-1.5 px-1 bg-stone-900 hover:bg-black text-white rounded-xl text-[10px] sm:text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
                          >
                            <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>Concluir</span>
                          </button>

                          <button 
                            onClick={() => cancelarAgendamento(item.id)}
                            disabled={processandoId === item.id}
                            className="py-1.5 px-1 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200/80 rounded-xl text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                          >
                            <X className="w-3 h-3 text-stone-500 shrink-0" />
                            <span>Cancelar</span>
                          </button>

                          <button 
                            onClick={() => excluirAgendamento(item.id)}
                            disabled={processandoId === item.id}
                            className="py-1.5 px-1 bg-stone-50 hover:bg-rose-50 text-rose-600 border border-stone-200/80 hover:border-rose-200 rounded-xl text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3 text-rose-500 shrink-0" />
                            <span>Excluir</span>
                          </button>
                        </div>

                      </div>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={`livre-${slot.horario}-${index}`} className="relative z-10 flex items-start gap-2.5 sm:gap-4">
                    <div className="flex flex-col items-center shrink-0 pt-1">
                      <div className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] rounded-full flex items-center justify-center border-2 bg-white border-stone-300 shadow-2xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-stone-300" />
                      </div>
                    </div>

                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="bg-white/80 hover:bg-white rounded-xl border border-stone-200/80 p-2.5 sm:p-3 flex items-center justify-between transition-all shadow-2xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black text-stone-700 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                            {slot.horario}
                          </span>
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Livre</span>
                        </div>

                        <button
                          onClick={() => {
                            setHorarioSelecionadoSlot(slot.horario);
                            setBarbeiroIdManual(barbeiroSelecionado);
                            setModalAgendamentoOpen(true);
                          }}
                          className="px-3 py-1.5 bg-stone-900 hover:bg-black text-white rounded-xl text-[11px] font-extrabold flex items-center gap-1 transition-all shadow-2xs cursor-pointer active:scale-95"
                        >
                          <span>Disponível</span>
                          <Plus className="w-3 h-3 text-emerald-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        )}
      </div>

      {/* MODAL PRINCIPAL DE AGENDAMENTO MANUAL */}
      {modalAgendamentoOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div 
            onClick={() => setModalAgendamentoOpen(false)}
            className="fixed inset-0 bg-stone-950/50 backdrop-blur-sm transition-opacity"
          />

          <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-white/90 z-10 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-stone-900 text-white flex items-center justify-center shadow-md">
                  <UserPlus className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-stone-900 tracking-tight">Novo Agendamento</h3>
                  <p className="text-xs text-stone-500">Horário: <strong className="text-stone-900">{horarioSelecionadoSlot}</strong> em {new Date(dataSelecionada + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              <button 
                onClick={() => setModalAgendamentoOpen(false)}
                className="w-9 h-9 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={criarAgendamentoManual} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-stone-500">Nome do Cliente:</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: João da Silva"
                  value={novoClienteNome}
                  onChange={(e) => setNovoClienteNome(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 text-xs font-medium text-stone-900 focus:outline-none focus:border-stone-900 shadow-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-stone-500">Telefone / WhatsApp (Opcional):</label>
                <input 
                  type="text" 
                  placeholder="(00) 00000-0000"
                  value={novoClienteTelefone}
                  onChange={(e) => setNovoClienteTelefone(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 text-xs font-medium text-stone-900 focus:outline-none focus:border-stone-900 shadow-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-stone-500">Serviço:</label>
                <button
                  type="button"
                  onClick={() => setModalServicosOpen(true)}
                  className="w-full bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-2xl px-4 py-3 text-left flex items-center justify-between transition-all cursor-pointer shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-white border border-stone-200 text-stone-700 flex items-center justify-center shrink-0">
                      <Scissors className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-stone-900 truncate">
                        {servicoSelecionadoObj ? servicoSelecionadoObj.nome : 'Selecione o serviço...'}
                      </p>
                      {servicoSelecionadoObj && (
                        <p className="text-[10px] font-medium text-emerald-600">
                          R$ {Number(servicoSelecionadoObj.preco || 0).toFixed(2)} • {servicoSelecionadoObj.duracao_minutos || 30} min
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400 shrink-0" />
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-stone-500">Profissional Responsável:</label>
                <button
                  type="button"
                  onClick={() => setModalProfissionaisOpen(true)}
                  className="w-full bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-2xl px-4 py-3 text-left flex items-center justify-between transition-all cursor-pointer shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {barbeiroSelecionadoObj?.foto ? (
                      <img 
                        src={barbeiroSelecionadoObj.foto} 
                        alt="Profissional" 
                        className="w-8 h-8 rounded-xl object-cover border border-stone-200 shrink-0" 
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-white border border-stone-200 text-stone-800 font-black flex items-center justify-center text-xs shrink-0">
                        {barbeiroSelecionadoObj ? barbeiroSelecionadoObj.nome[0] : <User className="w-4 h-4 text-stone-500" />}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-black text-stone-900 truncate">
                        {barbeiroSelecionadoObj ? barbeiroSelecionadoObj.nome : 'Selecione o profissional...'}
                      </p>
                      <p className="text-[10px] font-medium text-stone-500">Profissional</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400 shrink-0" />
                </button>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalAgendamentoOpen(false)}
                  className="px-5 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoAgendamento}
                  className="px-6 py-3 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {salvandoAgendamento ? 'Salvando...' : 'Confirmar Agendamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBMODAL DE SELEÇÃO DE SERVIÇOS */}
      {modalServicosOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div onClick={() => setModalServicosOpen(false)} className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-white rounded-[2.5rem] p-6 shadow-2xl border border-white/90 z-10 space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-sm font-black text-stone-900 uppercase tracking-wider">Selecionar Serviço</h3>
              <button onClick={() => setModalServicosOpen(false)} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {servicos.map(serv => (
                <div
                  key={serv.id}
                  onClick={() => {
                    setServicoIdManual(serv.id);
                    setModalServicosOpen(false);
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    String(servicoIdManual) === String(serv.id)
                      ? 'bg-stone-900 text-white border-stone-900 shadow-md'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Scissors className="w-4 h-4 shrink-0" />
                    <div>
                      <p className="text-xs font-black">{serv.nome}</p>
                      <p className={`text-[10px] ${String(servicoIdManual) === String(serv.id) ? 'text-stone-300' : 'text-stone-500'}`}>
                        {serv.duracao_minutos || 30} minutos
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-black">R$ {Number(serv.preco || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBMODAL DE SELEÇÃO DE PROFISSIONAIS */}
      {modalProfissionaisOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div onClick={() => setModalProfissionaisOpen(false)} className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-white rounded-[2.5rem] p-6 shadow-2xl border border-white/90 z-10 space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-sm font-black text-stone-900 uppercase tracking-wider">Selecionar Profissional</h3>
              <button onClick={() => setModalProfissionaisOpen(false)} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {barbeiros.map(barb => {
                const isSelected = String(barbeiroIdManual) === String(barb.id);
                return (
                  <div
                    key={barb.id}
                    onClick={() => {
                      setBarbeiroIdManual(barb.id);
                      setModalProfissionaisOpen(false);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-stone-900 text-white border-stone-900 shadow-md'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {barb.foto ? (
                        <img src={barb.foto} alt={barb.nome} className="w-9 h-9 rounded-xl object-cover border border-stone-200" />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-white border border-stone-200 text-stone-800 font-black flex items-center justify-center text-xs">
                          {barb.nome[0]}
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-black">{barb.nome}</p>
                        <p className={`text-[10px] ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>Profissional</p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE HISTÓRICO */}
      {modalHistoricoOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div 
            onClick={() => setModalHistoricoOpen(false)}
            className="fixed inset-0 bg-stone-950/50 backdrop-blur-sm transition-opacity"
          />

          <div className="relative w-full max-w-3xl max-h-[85vh] bg-stone-100 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-white/80 z-10 flex flex-col overflow-hidden">
            
            <div className="flex items-center justify-between pb-5 border-b border-stone-300/60">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#222222] text-white flex items-center justify-center shadow-md">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-stone-900 tracking-tight">Histórico de Agendamentos</h3>
                  <p className="text-xs text-stone-500">Consulte e filtre todos os registros do sistema.</p>
                </div>
              </div>
              <button 
                onClick={() => setModalHistoricoOpen(false)}
                className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer shadow-xs"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4 border-b border-stone-300/40">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Filtrar por Data:</label>
                <div className="relative flex items-center">
                  <input 
                    type="date" 
                    value={filtroDataHistorico || ''} 
                    onChange={(e) => setFiltroDataHistorico(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-2.5 text-xs font-medium text-stone-800 focus:outline-none focus:border-stone-900 shadow-xs"
                  />
                  {filtroDataHistorico && (
                    <button 
                      onClick={() => setFiltroDataHistorico('')} 
                      className="absolute right-3 text-xs text-stone-500 hover:text-stone-900 font-bold"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Filtrar por Status:</label>
                <select 
                  value={filtroStatusHistorico}
                  onChange={(e) => setFiltroStatusHistorico(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-2.5 text-xs font-medium text-stone-800 focus:outline-none focus:border-stone-900 shadow-xs"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="agendado">Agendados</option>
                  <option value="concluido">Concluídos</option>
                  <option value="cancelado">Cancelados</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
              {todosAgendamentos.length === 0 ? (
                <div className="text-center py-16 text-stone-400 text-sm">
                  Nenhum registro encontrado no histórico.
                </div>
              ) : (
                todosAgendamentos
                  .filter(item => !filtroDataHistorico || extrairDataIso(item) === filtroDataHistorico)
                  .filter(item => filtroStatusHistorico === 'todos' || (item.status || 'agendado') === filtroStatusHistorico)
                  .map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white hover:bg-stone-50 rounded-2xl border border-stone-200/80 transition-all gap-4 shadow-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-stone-900 text-sm sm:text-base">
                            {item.clientes?.nome || 'Cliente'}
                          </span>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                            item.status === 'concluido' ? 'bg-[#222222] text-white' :
                            item.status === 'cancelado' ? 'bg-red-100 text-red-800' : 'bg-stone-200 text-stone-800'
                          }`}>
                            {item.status || 'agendado'}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 flex flex-wrap gap-x-3 gap-y-1 items-center">
                          <span className="text-stone-700 font-medium">{item.servicos?.nome || 'Serviço'}</span>
                          <span>•</span>
                          <span>{item.barbeiros?.nome || 'Barbeiro'}</span>
                          <span>•</span>
                          <span className="font-semibold text-stone-700">{formatarDataHora(item.data_hora)}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                        <span className="text-sm sm:text-base font-extrabold text-stone-900">
                          R$ {Number(item.valor_total || item.servicos?.preco || 0).toFixed(2)}
                        </span>
                        <button 
                          onClick={() => excluirAgendamento(item.id)}
                          disabled={processandoId === item.id}
                          className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="pt-4 border-t border-stone-300/60 flex justify-end">
              <button
                onClick={() => setModalHistoricoOpen(false)}
                className="px-6 py-2.5 bg-[#222222] text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer shadow-md"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}