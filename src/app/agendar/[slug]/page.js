'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Scissors, Calendar, User, Phone, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

// Horários padrão de atendimento
const HORARIOS_DISPONIVEIS = [
  '08:00', '09:00', '10:00', '11:00', 
  '13:00', '14:00', '15:00', '16:00', 
  '17:00', '18:00', '19:00'
];

export default function AgendamentoPublico() {
  const { slug } = useParams();

  const [data, setData] = useState('');
  const [hora, setHora] = useState('');

  const [barbearia, setBarbearia] = useState(null);
  const [servicos, setServicos] = useState([]);
  const [barbeiros, setBarbeiros] = useState([]);

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
          .eq('slug', slug)
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

    if (slug) loadBarbeariaData();
  }, [slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!selectedServico || !selectedBarbeiro) {
        throw new Error('Selecione um serviço e um barbeiro.');
      }

      if (!data || !hora) {
        throw new Error('Selecione a data e o horário do agendamento.');
      }

      // 1. Criar ou buscar cliente
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

      // 2. Formatar data e hora em timestamp ISO
      const dataHoraIso = new Date(`${data}T${hora}:00`).toISOString();

      // 3. Registrar Agendamento
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
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <p className="text-xs text-stone-500 font-semibold uppercase tracking-wider">Carregando barbearia...</p>
      </div>
    );
  }

  if (error && !barbearia) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-3xl shadow-md text-center space-y-2 max-w-sm">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h2 className="font-bold text-stone-900">Barbearia não encontrada</h2>
          <p className="text-xs text-stone-500">Verifique o link digitado e tente novamente.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center space-y-4 max-w-sm w-full">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
          <h2 className="text-xl font-bold text-stone-900">Agendamento Concluído!</h2>
          <p className="text-xs text-stone-500">Seu agendamento na {barbearia.nome} foi realizado com sucesso.</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-stone-900 text-white text-xs font-semibold py-3 rounded-2xl"
          >
            Fazer Novo Agendamento
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-stone-200/80 max-w-md w-full space-y-6">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-stone-900 text-white flex items-center justify-center mx-auto shadow-md mb-2">
            <Scissors className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-stone-900">{barbearia.nome}</h1>
          <p className="text-xs text-stone-400">Escolha o serviço e o profissional de sua preferência.</p>
        </div>

        {error && <p className="text-xs text-rose-500 bg-rose-50 p-3 rounded-xl border border-rose-200">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Servicos */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">Selecione o Serviço</label>
            <div className="space-y-2">
              {servicos.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => setSelectedServico(s)}
                  className={`w-full p-3 rounded-2xl border text-left flex justify-between items-center transition-all ${
                    selectedServico?.id === s.id
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 bg-stone-50 text-stone-800'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold">{s.nome}</p>
                    <p className="text-[10px] opacity-70">{s.duracao_minutos} minutos</p>
                  </div>
                  <span className="text-xs font-extrabold">R$ {s.preco}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Barbeiros */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">Selecione o Barbeiro</label>
            <select
              required
              value={selectedBarbeiro || ''}
              onChange={(e) => setSelectedBarbeiro(e.target.value)}
              className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-stone-900"
            >
              <option value="">Escolha um barbeiro...</option>
              {barbeiros.map((b) => (
                <option key={b.id} value={b.id}>{b.nome}</option>
              ))}
            </select>
          </div>

          {/* Nome e Telefone */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Seu Nome</label>
              <input
                type="text"
                required
                placeholder="Ex: João"
                value={nomeCliente}
                onChange={(e) => setNomeCliente(e.target.value)}
                className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-stone-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">WhatsApp</label>
              <input
                type="text"
                required
                placeholder="(00) 00000-0000"
                value={telefoneCliente}
                onChange={(e) => setTelefoneCliente(e.target.value)}
                className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-stone-900"
              />
            </div>
          </div>

          {/* Seleção de Data */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">Data do Agendamento</label>
            <input 
              type="date" 
              value={data} 
              onChange={(e) => setData(e.target.value)}
              className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-stone-900"
              required
            />
          </div>

          {/* Seleção de Horário via Botões (Pills) */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-2 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Escolha o Horário
            </label>
            <div className="grid grid-cols-4 gap-2">
              {HORARIOS_DISPONIVEIS.map((h) => (
                <button
                  type="button"
                  key={h}
                  onClick={() => setHora (h)}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                    hora === h
                      ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-400'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md disabled:opacity-50 mt-2"
          >
            {submitting ? 'Confirmando...' : 'Confirmar Agendamento'}
          </button>
        </form>
      </div>
    </div>
  );
}