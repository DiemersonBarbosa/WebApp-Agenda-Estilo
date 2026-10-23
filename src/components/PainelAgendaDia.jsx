'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Calendar, CheckCircle2, DollarSign, History, X, Clock, Trash2, 
  Check, User, Scissors
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function PainelAgendaDia({ profissionalId, barbeariaId, taxaComissao = 50 }) {
  const [todosAgendamentos, setTodosAgendamentos] = useState([]);
  const [barbeiros, setBarbeiros] = useState([]);
  const [barbeiroSelecionado, setBarbeiroSelecionado] = useState('todos');
  const [carregando, setCarregando] = useState(true);
  const [erroFatal, setErroFatal] = useState(null);
  const [processandoId, setProcessandoId] = useState(null);

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
      const data = new Date(dataHoraStr);
      return data.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
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
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (barbeariaData) {
            barbeariaAtiva = barbeariaData.id;
          }
        }
      }

      if (barbeariaAtiva) {
        const { data: barbeirosData } = await supabase
          .from('barbeiros')
          .select('id, nome, foto')
          .eq('barbearia_id', barbeariaAtiva)
          .order('nome', { ascending: true });

        if (barbeirosData) setBarbeiros(barbeirosData);
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

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-0 space-y-5 pb-24">
      
      {erroFatal && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-2xl shadow-sm">
          <div className="text-red-700 text-sm font-medium">Erro ao carregar agenda: {erroFatal}</div>
        </div>
      )}

      {/* 4 CARDS DO TOPO (PADRÃO ORIGINAL) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 md:gap-5">
        <div 
          className="relative rounded-3xl md:rounded-[2.5rem] p-5 sm:p-6 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
            boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.8)'
          }}
        >
          <div className="flex flex-col justify-center min-w-0 pr-2">
            <span className="text-[9px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-wider truncate block">Agendamentos</span>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-1 truncate">{totalAtendimentosDia}</h3>
          </div>
          <div 
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)',
              boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 1), inset 0 -4px 6px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.9)'
            }}
          >
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
          </div>
        </div>

        <div 
          className="relative rounded-3xl md:rounded-[2.5rem] p-5 sm:p-6 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
            boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.8)'
          }}
        >
          <div className="flex flex-col justify-center min-w-0 pr-2">
            <span className="text-[9px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-wider truncate block">Concluídos</span>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-1 truncate">{concluidosDia}/{totalAtendimentosDia}</h3>
          </div>
          <div 
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)',
              boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 1), inset 0 -4px 6px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.9)'
            }}
          >
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
          </div>
        </div>

        <div 
          className="relative rounded-3xl md:rounded-[2.5rem] p-5 sm:p-6 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
            boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.8)'
          }}
        >
          <div className="flex flex-col justify-center min-w-0 pr-2">
            <span className="text-[9px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-wider truncate block">Projeção</span>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-1 truncate">R$ {valorTotalDia.toFixed(0)}</h3>
          </div>
          <div 
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)',
              boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 1), inset 0 -4px 6px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.9)'
            }}
          >
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
          </div>
        </div>

        <button
          onClick={() => setModalHistoricoOpen(true)}
          className="relative rounded-3xl md:rounded-[2.5rem] p-5 sm:p-6 flex items-center justify-between border border-stone-200/80 bg-white transition-all cursor-pointer group min-w-0 overflow-hidden shadow-sm hover:shadow-md"
        >
          <div className="flex flex-col justify-center min-w-0 pr-2 text-left">
            <span className="text-[9px] sm:text-[10px] font-extrabold text-stone-400 uppercase tracking-wider truncate block">Registros</span>
            <span className="text-sm sm:text-lg font-black text-stone-900 mt-1 truncate">Ver Histórico</span>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#222222] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <History className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </button>
      </div>

      {/* SELETOR DE DIAS */}
      <div className="bg-white rounded-[2rem] p-4 pt-5 border border-stone-200/90 shadow-sm space-y-2.5 overflow-visible">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">Selecionar Dia</span>
          <span className="text-[11px] font-bold text-stone-900 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200 truncate max-w-[200px]">
            {new Date(dataSelecionada + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 overflow-visible pt-1 pb-1">
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
                className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl transition-all cursor-pointer relative ${
                  selecionado 
                    ? 'bg-stone-900 text-white shadow-md scale-105 border border-stone-900' 
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200/70'
                }`}
              >
                <span className={`text-[8px] sm:text-[9px] uppercase font-bold tracking-wider ${selecionado ? 'text-stone-300' : 'text-stone-400'}`}>
                  {dia.nomeDia}
                </span>
                <span className="text-sm sm:text-base font-black my-0.5">{dia.numeroDia}</span>
                <span className={`text-[8px] uppercase font-semibold ${selecionado ? 'text-stone-400' : 'text-stone-500'}`}>
                  {dia.nomeMes}
                </span>

                {qtdNoDia > 0 && (
                  <span className={`absolute -top-2 -right-1 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center shadow-xs z-10 ${
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
      <div className="bg-white rounded-3xl p-3 sm:p-4 border border-stone-200/90 shadow-sm space-y-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 px-1 block">
          Filtrar Por Profissional
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setBarbeiroSelecionado('todos')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 border ${
              barbeiroSelecionado === 'todos'
                ? 'bg-stone-900 text-white border-stone-900 shadow-md'
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
                className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-stone-900 text-white border-stone-900 shadow-md'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                {b.foto ? (
                  <img src={b.foto} alt={b.nome} className="w-6 h-6 rounded-full object-cover border border-stone-300" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-stone-200 text-stone-800 font-extrabold flex items-center justify-center text-[10px]">
                    {b.nome[0]}
                  </div>
                )}
                <span>{b.nome}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                  isSelected ? 'bg-stone-800 text-emerald-400' : 'bg-stone-200 text-stone-600'
                }`}>
                  {qtdBarbeiro}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* LISTA DE PENDENTES */}
      <div 
        className="relative rounded-[2.5rem] p-5 sm:p-8 border border-white/80 overflow-hidden shadow-sm"
        style={{
          background: 'linear-gradient(135deg, #f7f9f8 0%, #edf1f0 50%, #e2e8e6 100%)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08), inset 0 2px 4px rgba(255, 255, 255, 0.9), inset 0 -3px 6px rgba(0, 0, 0, 0.05)'
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-stone-300/60 gap-3">
          <h2 className="text-base sm:text-lg font-extrabold text-stone-900 flex items-center gap-2.5 tracking-tight truncate">
            <span className="w-2.5 h-2.5 bg-[#111111] rounded-full shrink-0 shadow-[0_0_8px_rgba(17,17,17,0.4)]"></span>
            <span className="truncate">Pendentes • {new Date(dataSelecionada + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
            <span className="text-xs font-bold text-stone-700 bg-white px-2.5 py-0.5 rounded-full border border-stone-200 shadow-xs shrink-0">
              {agendamentosPendentesDia.length}
            </span>
          </h2>
          
          <div className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-bold text-stone-700 self-start sm:self-auto bg-white border border-stone-200 shadow-xs">
            {new Date(dataSelecionada + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
          </div>
        </div>

        {carregando ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
          </div>
        ) : agendamentosPendentesDia.length === 0 ? (
          <div className="text-center py-16 text-stone-400 text-sm font-medium">
            Nenhum atendimento pendente para esta data.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {agendamentosPendentesDia.map((item) => (
              <div 
                key={item.id} 
                className="bg-white rounded-[2rem] border border-stone-200/90 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all space-y-3.5 relative overflow-hidden border-l-4 border-l-stone-900"
              >
                {/* Cabeçalho do Card (Sem a palavra VALOR, perfeitamente alinhado) */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-stone-900 text-white text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs">
                      <Clock className="w-3.5 h-3.5 text-stone-300" />
                      {extrairHoraMinuto(item.data_hora)}
                    </span>
                    <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-stone-100 text-stone-700 border border-stone-200">
                      {item.status || 'agendado'}
                    </span>
                  </div>

                  <span className="text-stone-900 font-black text-sm sm:text-base bg-stone-100 px-3.5 py-1.5 rounded-2xl border border-stone-200/60 shrink-0">
                    R$ {Number(item.valor_total || item.servicos?.preco || 0).toFixed(2)}
                  </span>
                </div>

                {/* Nome do Cliente */}
                <div>
                  <h3 className="font-extrabold text-stone-900 text-base sm:text-lg tracking-tight truncate">
                    {item.clientes?.nome || 'Cliente não identificado'}
                  </h3>
                </div>

                {/* Detalhes do Serviço */}
                <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-stone-900">
                    <Scissors className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                    <span>{item.servicos?.nome || 'Serviço'}</span>
                  </div>
                  <div className="text-stone-500 font-medium">
                    Profissional: <span className="text-stone-800 font-bold">{item.barbeiros?.nome || 'Não atribuído'}</span>
                  </div>
                </div>

                {/* BOTÕES DE AÇÃO SEM CORTAR TEXTO (TEXTO AJUSTADO E FLEXÍVEL) */}
                <div className="pt-2 border-t border-stone-100 grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => concluirAgendamento(item.id)}
                    disabled={processandoId === item.id}
                    className="py-2.5 px-1 bg-stone-900 hover:bg-black text-white rounded-xl text-[11px] sm:text-xs font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Concluir</span>
                  </button>

                  <button 
                    onClick={() => cancelarAgendamento(item.id)}
                    disabled={processandoId === item.id}
                    className="py-2.5 px-1 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                    <span>Cancelar</span>
                  </button>

                  <button 
                    onClick={() => excluirAgendamento(item.id)}
                    disabled={processandoId === item.id}
                    className="py-2.5 px-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Excluir</span>
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

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