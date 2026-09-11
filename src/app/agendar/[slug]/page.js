'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Scissors, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

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

  // Sempre que mudar o barbeiro ou a data, busca os horários já ocupados daquele barbeiro
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
        throw new Error('Selecione um serviço e um barbeiro.');
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

  if (barbearia && barbearia.status_aberto === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-stone-100">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md border border-stone-200 space-y-4">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
            🔒
          </div>
          <h1 className="text-xl font-bold text-stone-900">Estamos Fechados!</h1>
          <p className="text-stone-500 text-xs">
            No momento, a barbearia não está aceitando novos agendamentos.
          </p>
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
          <p className="text-xs text-stone-500">Seu horário na {barbearia.nome} foi reservado com sucesso.</p>
          <button
            onClick={() => window.location.reload()}
            style={{ backgroundColor: barbearia.cor_tema || '#1c1917' }}
            className="w-full text-white text-xs font-semibold py-3 rounded-2xl shadow-md cursor-pointer"
          >
            Fazer Novo Agendamento
          </button>
        </div>
      </div>
    );
  }

  const corTema = barbearia.cor_tema || '#1c1917';

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-2 sm:p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-xl border border-stone-200/80 max-w-md w-full overflow-hidden">
        
        {/* Capa da Barbearia */}
        <div className="h-36 w-full bg-stone-200 relative">
          {barbearia.capa_url ? (
            <img 
              src={barbearia.capa_url} 
              alt="Capa da Barbearia" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div 
              className="w-full h-full opacity-80"
              style={{ backgroundColor: corTema }}
            />
          )}
        </div>

        {/* Foto de Perfil / Logo sobreposta e Informações */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex justify-center -mt-12 mb-3">
            {barbearia.logo_url ? (
              <img 
                src={barbearia.logo_url} 
                alt={barbearia.nome} 
                className="w-20 h-20 rounded-2xl object-cover shadow-md border-4 border-white bg-white"
              />
            ) : (
              <div 
                style={{ backgroundColor: corTema }}
                className="w-20 h-20 rounded-2xl text-white flex items-center justify-center shadow-md border-4 border-white font-bold text-2xl"
              >
                {barbearia.nome?.charAt(0)}
              </div>
            )}
          </div>

          <div className="text-center space-y-1 mb-6">
            <h1 className="text-xl font-bold text-stone-900">{barbearia.nome}</h1>
            <p className="text-xs text-stone-400">Escolha o serviço e o profissional de sua preferência.</p>
          </div>

          {error && <p className="text-xs text-rose-500 bg-rose-50 p-3 rounded-xl border border-rose-200 mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Servicos */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Selecione o Serviço</label>
              <div className="space-y-2">
                {servicos.map((s) => {
                  const isSelected = selectedServico?.id === s.id;
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => setSelectedServico(s)}
                      style={isSelected ? { backgroundColor: corTema, borderColor: corTema } : {}}
                      className={`w-full p-3 rounded-2xl border text-left flex justify-between items-center transition-all cursor-pointer ${
                        isSelected
                          ? 'text-white shadow-md'
                          : 'border-stone-200 bg-stone-50 text-stone-800 hover:border-stone-300'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold">{s.nome}</p>
                        <p className="text-[10px] opacity-75">{s.duracao_minutos} minutos</p>
                      </div>
                      <span className="text-xs font-extrabold">R$ {s.preco}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Barbeiros com Fotos (Cards Selecionáveis) */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Selecione o Profissional</label>
              <div className="grid grid-cols-1 gap-2">
                {barbeiros.map((b) => {
                  const isSelected = String(selectedBarbeiro) === String(b.id);
                  const fotoBarbeiro = b.foto || b.avatar || b.imagem || b.logo;

                  return (
                    <button
                      type="button"
                      key={b.id}
                      onClick={() => setSelectedBarbeiro(b.id)}
                      style={isSelected ? { backgroundColor: corTema, borderColor: corTema } : {}}
                      className={`w-full p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                        isSelected
                          ? 'text-white shadow-md'
                          : 'border-stone-200 bg-stone-50 text-stone-800 hover:border-stone-300'
                      }`}
                    >
                      {fotoBarbeiro ? (
                        <img 
                          src={fotoBarbeiro} 
                          alt={b.nome} 
                          className="w-10 h-10 rounded-full object-cover border border-stone-200 shrink-0"
                        />
                      ) : (
                        <div 
                          style={isSelected ? { backgroundColor: '#ffffff', color: corTema } : { backgroundColor: corTema }}
                          className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm"
                        >
                          {b.nome?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold truncate">{b.nome}</p>
                        <p className={`text-[10px] truncate ${isSelected ? 'text-white/80' : 'text-stone-400'}`}>
                          Profissional Disponível
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
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

            {/* Seleção de Horário com bloqueio automático se ocupado */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Escolha o Horário</span>
                {!selectedBarbeiro && <span className="text-[10px] text-amber-600 font-normal">Selecione o profissional primeiro</span>}
              </label>

              <div className="grid grid-cols-4 gap-2">
                {HORARIOS_DISPONIVEIS.map((h) => {
                  const isOcupado = horariosOcupados.includes(h);
                  const isSelected = hora === h;

                  return (
                    <button
                      type="button"
                      key={h}
                      disabled={isOcupado || !selectedBarbeiro}
                      onClick={() => setHora(h)}
                      style={isSelected ? { backgroundColor: corTema, borderColor: corTema } : {}}
                      className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                        isOcupado
                          ? 'bg-stone-200 text-stone-400 border-stone-200 cursor-not-allowed line-through opacity-60'
                          : isSelected
                          ? 'text-white shadow-sm cursor-pointer'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-400 cursor-pointer'
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
              style={{ backgroundColor: corTema }}
              className="w-full hover:opacity-90 text-white font-semibold py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md disabled:opacity-50 mt-2 cursor-pointer"
            >
              {submitting ? 'Confirmando...' : 'Confirmar Agendamento'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}