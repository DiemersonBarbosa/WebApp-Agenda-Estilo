'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const HORARIOS_DISPONIVEIS = [
  '08:00', '09:00', '10:00', '11:00', 
  '13:00', '14:00', '15:00', '16:00', 
  '17:00', '18:00', '19:00'
];

export default function AgendamentoClassico({ barbeariaId }) {
  const [data, setData] = useState('');
  const [hora, setHora] = useState('');

  const [barbearia, setBarbearia] = useState(null);
  const [servicos, setServicos] = useState([]);
  const [barbeiros, setBarbeiros] = useState([]);
  const [horariosOcupados, setHorariosOcupados] = useState([]);

  const [selectedServico, setSelectedServico] = useState(null);
  const [selectedBarbeiro, setSelectedBarbeiro] = useState(null);
  const [nomeCliente, setNomeCliente] = useState('');
  const [telefoneCliente, setTelefoneCliente] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadBarbeariaData() {
      try {
        const { data: barb, error: barbErr } = await supabase
          .from('barbearias')
          .select('*')
          .eq('id', barbeariaId)
          .single();

        if (barbErr || !barb) throw new Error('Barbearia não encontrada.');

        setBarbearia(barb);

        const [resServicos, resBarbeiros] = await Promise.all([
          supabase.from('servicos').select('*').eq('barbearia_id', barb.id),
          supabase.from('barbeiros').select('*').eq('barbearia_id', barb.id)
        ]);

        setServicos(resServicos.data || []);
        setBarbeiros(resBarbeiros.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (barbeariaId) loadBarbeariaData();
  }, [barbeariaId]);

  useEffect(() => {
    async function buscarHorariosOcupados() {
      if (!selectedBarbeiro || !data) {
        setHorariosOcupados([]);
        return;
      }

      try {
        const inicioDia = `${data}T00:00:00`;
        const fimDia = `${data}T23:59:59`;

        const { data: agendamentos, error } = await supabase
          .from('agendamentos')
          .select('data_hora')
          .eq('barbeiro_id', selectedBarbeiro)
          .neq('status', 'cancelado')
          .gte('data_hora', new Date(inicioDia).toISOString())
          .lte('data_hora', new Date(fimDia).toISOString());

        if (error) throw error;

        const ocupados = (agendamentos || []).map((ag) => {
          const d = new Date(ag.data_hora);
          const horas = String(d.getHours()).padStart(2, '0');
          const minutos = String(d.getMinutes()).padStart(2, '0');
          return `${horas}:${minutos}`;
        });

        setHorariosOcupados(ocupados);
      } catch (err) {
        console.error('Erro ao buscar horários ocupados:', err);
      }
    }

    buscarHorariosOcupados();
  }, [selectedBarbeiro, data]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!selectedServico || !selectedBarbeiro) {
        throw new Error('Selecione um serviço e um profissional.');
      }

      if (!data || !hora) {
        throw new Error('Selecione a data e o horário do agendamento.');
      }

      const dataHoraIso = new Date(`${data}T${hora}:00`).toISOString();

      const { data: conflito } = await supabase
        .from('agendamentos')
        .select('id')
        .eq('barbeiro_id', selectedBarbeiro)
        .eq('data_hora', dataHoraIso)
        .neq('status', 'cancelado')
        .maybeSingle();

      if (conflito) {
        throw new Error('Este horário acabou de ser ocupado para este profissional. Por favor, escolha outro horário.');
      }

      let clienteId;
      const { data: existingClient } = await supabase
        .from('clientes')
        .select('id')
        .eq('barbearia_id', barbearia.id)
        .eq('telefone', telefoneCliente)
        .maybeSingle();

      if (existingClient) {
        clienteId = existingClient.id;
      } else {
        const { data: newClient, error: clientErr } = await supabase
          .from('clientes')
          .insert([{ barbearia_id: barbearia.id, nome: nomeCliente, telefone: telefoneCliente }])
          .select('id')
          .single();

        if (clientErr) throw clientErr;
        clienteId = newClient.id;
      }

      const { error: agendamentoErr } = await supabase.from('agendamentos').insert([
        {
          barbearia_id: barbearia.id,
          cliente_id: clienteId,
          barbeiro_id: selectedBarbeiro,
          servico_id: selectedServico.id,
          valor_total: selectedServico.preco,
          data_hora: dataHoraIso,
          status: 'agendado',
        },
      ]);

      if (agendamentoErr) throw agendamentoErr;

      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Erro ao agendar atendimento.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Carregando informações...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-gradient-to-br from-[#0c0d10] via-[#050507] to-[#000000] p-8 rounded-[2.5rem] border border-white/10 shadow-2xl text-center space-y-4 max-w-xl w-full mx-auto text-white backdrop-blur-2xl">
        <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
        <h2 className="text-xl font-black">Agendamento Concluído!</h2>
        <p className="text-xs text-slate-300">Seu horário na {barbearia?.nome} foi reservado com sucesso.</p>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 text-xs font-black uppercase tracking-wider py-3.5 rounded-2xl shadow-lg cursor-pointer hover:brightness-110 transition-all border border-emerald-400/30"
        >
          Fazer Novo Agendamento
        </button>
      </div>
    );
  }

  const corTema = barbearia?.cor_tema || '#10b981';

  return (
    <div className="w-full max-w-xl mx-auto rounded-[2.5rem] bg-gradient-to-br from-[#0c0d10] via-[#050507] to-[#000000] border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.9)] text-white overflow-hidden relative backdrop-blur-2xl">
      
      {/* Efeito de luz superior */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-[3px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent z-20"></div>

      {/* CAPA DA BARBEARIA */}
      <div className="relative h-40 w-full bg-stone-900 overflow-hidden">
        {barbearia?.capa_url ? (
          <img src={barbearia.capa_url} alt="Capa" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center">
            <span className="text-[10px] font-bold text-stone-500 tracking-wider uppercase">Capa da Unidade</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
      </div>

      {/* CONTEÚDO E FORMULÁRIO */}
      <div className="p-6 sm:p-8 pt-0 relative space-y-6">
        
        {/* LOGO / FOTO DE PERFIL FLUTUANTE */}
        <div className="flex flex-col items-center text-center -mt-16 mb-2 relative z-10">
          <div className="w-24 h-24 rounded-[2rem] bg-black/80 p-1.5 shadow-2xl border border-white/20 overflow-hidden flex items-center justify-center backdrop-blur-xl mb-3">
            {barbearia?.logo_url ? (
              <img src={barbearia.logo_url} alt={barbearia.nome} className="w-full h-full object-cover rounded-[1.5rem]" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-stone-800 to-black text-white rounded-[1.5rem] flex items-center justify-center font-black text-xl">
                {barbearia?.nome?.charAt(0) || 'B'}
              </div>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">{barbearia?.nome}</h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Escolha o serviço e o profissional de sua preferência.</p>
        </div>

        {error && <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 p-3 rounded-2xl">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Serviços */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Selecione o Serviço</label>
            <div className="space-y-2">
              {servicos.map((s) => {
                const isSelected = selectedServico?.id === s.id;
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => setSelectedServico(s)}
                    className={`w-full p-3.5 rounded-2xl border text-left flex justify-between items-center transition-all cursor-pointer backdrop-blur-md ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-lg'
                        : 'border-white/10 bg-black/40 text-slate-200 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold">{s.nome}</p>
                      <p className="text-[10px] text-slate-400">{s.duracao_minutos || 30} minutos</p>
                    </div>
                    <span className="text-xs font-black text-emerald-400">R$ {Number(s.preco).toFixed(2)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Profissionais */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Selecione o Profissional</label>
            <div className="grid grid-cols-1 gap-2">
              {barbeiros.map((b) => {
                const isSelected = String(selectedBarbeiro) === String(b.id);
                const fotoBarbeiro = b.foto || b.avatar || b.imagem || b.logo;

                return (
                  <button
                    type="button"
                    key={b.id}
                    onClick={() => setSelectedBarbeiro(b.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer backdrop-blur-md ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-lg'
                        : 'border-white/10 bg-black/40 text-slate-200 hover:border-white/20'
                    }`}
                  >
                    {fotoBarbeiro ? (
                      <img 
                        src={fotoBarbeiro} 
                        alt={b.nome} 
                        className="w-10 h-10 rounded-full object-cover border border-white/20 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white/10 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 border border-white/15">
                        {b.nome?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold truncate">{b.nome}</p>
                      <p className="text-[10px] text-slate-400 truncate">Profissional Disponível</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nome e Telefone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Seu Nome</label>
              <input
                type="text"
                required
                placeholder="Ex: João Silva"
                value={nomeCliente}
                onChange={(e) => setNomeCliente(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 backdrop-blur-md"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">WhatsApp</label>
              <input
                type="text"
                required
                placeholder="(00) 00000-0000"
                value={telefoneCliente}
                onChange={(e) => setTelefoneCliente(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 backdrop-blur-md"
              />
            </div>
          </div>

          {/* Seleção de Data */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Data do Agendamento</label>
            <input 
              type="date" 
              value={data} 
              onChange={(e) => setData(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-black/40 border border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 [color-scheme:dark] backdrop-blur-md"
              required
            />
          </div>

          {/* Seleção de Horário */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-emerald-400" /> Escolha o Horário</span>
              {!selectedBarbeiro && <span className="text-[10px] text-amber-400 font-medium">Selecione o profissional primeiro</span>}
            </label>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {HORARIOS_DISPONIVEIS.map((h) => {
                const isOcupado = horariosOcupados.includes(h);
                const isSelected = hora === h;

                return (
                  <button
                    type="button"
                    key={h}
                    disabled={isOcupado || !selectedBarbeiro}
                    onClick={() => setHora(h)}
                    className={`py-2.5 rounded-xl text-xs font-black border transition-all backdrop-blur-md ${
                      isOcupado
                        ? 'bg-black/20 text-slate-600 border-white/5 cursor-not-allowed line-through opacity-40'
                        : isSelected
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-105'
                        : 'bg-black/40 text-white border-white/10 hover:border-emerald-500 cursor-pointer'
                    }`}
                  >
                    {h}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 text-slate-950 font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_15px_35px_rgba(16,185,129,0.35)] cursor-pointer disabled:opacity-50 mt-2 border border-emerald-300/40"
          >
            {submitting ? 'A confirmar...' : 'Confirmar Agendamento'}
          </button>

        </form>
      </div>

    </div>
  );
}