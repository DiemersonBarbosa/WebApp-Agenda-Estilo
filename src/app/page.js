'use client';

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  User, 
  Scissors, 
  CheckCircle2, 
  Calendar as CalendarIcon, 
  Sparkles, 
  ChevronRight, 
  ArrowLeft,
  AlertTriangle,
  Phone,
  UserCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const TIMES = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:30', '18:00'];

export default function BookingFlow() {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  const [selectedService, setSelectedService] = useState(null);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setErrorMessage(null);

      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!url || !key) {
        setErrorMessage(
          'Variáveis de ambiente do Supabase não configuradas. Verifique o arquivo .env.local.'
        );
        setLoading(false);
        return;
      }

      try {
        const { data: servicosData, error: errorServicos } = await supabase.from('servicos').select('*');
        const { data: barbeirosData, error: errorBarbeiros } = await supabase.from('barbeiros').select('*');

        if (errorServicos || errorBarbeiros) {
          throw new Error('Falha ao conectar com as tabelas do Supabase.');
        }

        if (servicosData) setServices(servicosData);
        if (barbeirosData) setBarbers(barbeirosData);
      } catch (err) {
        setErrorMessage(err.message || 'Erro ao carregar dados.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleFinish = async () => {
    if (!clientName || !clientPhone) {
      alert('Por favor, informe seu nome e número de telefone.');
      return;
    }

    setSaving(true);

    try {
      const { data: cliente, error: clientError } = await supabase
        .from('clientes')
        .insert([{ nome: clientName, telefone: clientPhone }])
        .select()
        .single();

      if (clientError) throw new Error(clientError.message);

      const { error: bookingError } = await supabase.from('agendamentos').insert([
        {
          cliente_id: cliente.id,
          barbeiro_id: selectedBarber.id,
          servico_id: selectedService.id,
          data_hora: new Date().toISOString(),
          valor_total: selectedService.preco,
          status: 'agendado'
        }
      ]);

      if (bookingError) throw new Error(bookingError.message);

      setIsSuccess(true);
    } catch (err) {
      alert('Erro ao confirmar agendamento: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setIsSuccess(false);
    setStep(1);
    setSelectedService(null);
    setSelectedBarber(null);
    setSelectedTime(null);
    setClientName('');
    setClientPhone('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 text-stone-700 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs tracking-widest text-stone-400 font-medium uppercase">Carregando experiência...</span>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-stone-100 text-stone-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 text-center shadow-xl border border-stone-200/80">
          <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <AlertTriangle className="w-7 h-7 text-rose-500" />
          </div>
          <h2 className="text-xl font-semibold text-stone-900 mb-2">Conexão Indisponível</h2>
          <p className="text-xs text-stone-500 mb-6 leading-relaxed bg-stone-50 p-4 rounded-2xl border border-stone-200/60 text-left">
            {errorMessage}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium py-3.5 rounded-2xl transition-all shadow-md"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-800 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Luzes de fundo sutis em tons quentes e neutros */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-stone-300/30 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl bg-white/90 backdrop-blur-xl rounded-3xl border border-stone-200/80 shadow-xl relative z-10 overflow-hidden">
        
        {/* Cabeçalho */}
        <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-stone-900 text-stone-50 flex items-center justify-center shadow-md">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-stone-900 flex items-center gap-1.5">
                Barbearia Premium <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              </h1>
              <p className="text-xs text-stone-400">Agendamento Online</p>
            </div>
          </div>

          {!isSuccess && (
            <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200/60">
              Etapa {step} de 3
            </div>
          )}
        </div>

        {/* Barra de Progresso */}
        {!isSuccess && (
          <div className="w-full bg-stone-100 h-1">
            <div 
              className="bg-stone-900 h-full transition-all duration-500 ease-out rounded-r-full"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        )}

        <div className="p-8">
          {/* Tela de Sucesso */}
          {isSuccess ? (
            <div className="text-center py-4 space-y-6 animate-fadeIn">
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-3xl flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-stone-900">Agendamento Confirmado!</h2>
                <p className="text-xs text-stone-500 mt-1">Seu horário foi reservado com sucesso.</p>
              </div>

              <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200/60 text-left space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-stone-400 font-medium">Serviço:</span>
                  <span className="font-semibold text-stone-800">{selectedService?.nome}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400 font-medium">Barbeiro:</span>
                  <span className="font-semibold text-stone-800">{selectedBarber?.nome}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400 font-medium">Horário:</span>
                  <span className="font-semibold text-stone-900 bg-amber-100/70 text-amber-900 px-2.5 py-0.5 rounded-md border border-amber-200/50">{selectedTime}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-stone-200/60">
                  <span className="text-stone-400 font-medium">Valor Total:</span>
                  <span className="font-bold text-sm text-stone-900">R$ {selectedService?.preco}</span>
                </div>
              </div>

              <button
                onClick={resetForm}
                className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs tracking-wider uppercase py-4 rounded-2xl transition-all shadow-md"
              >
                Novo Agendamento
              </button>
            </div>
          ) : (
            <>
              {/* Passo 1: Serviços */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xs font-bold tracking-wider uppercase text-amber-600">Passo 1</h2>
                    <p className="text-xl font-extrabold text-stone-900">Selecione o Serviço</p>
                  </div>

                  <div className="space-y-3">
                    {services.map((s) => {
                      const isSelected = selectedService?.id === s.id;
                      return (
                        <div
                          key={s.id}
                          onClick={() => setSelectedService(s)}
                          className={`group p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex justify-between items-center ${
                            isSelected
                              ? 'bg-stone-900 text-white border-stone-900 shadow-md scale-[1.01]'
                              : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/80 text-stone-800'
                          }`}
                        >
                          <div className="space-y-1">
                            <h3 className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-stone-900'}`}>
                              {s.nome}
                            </h3>
                            <div className="flex items-center gap-3 text-xs">
                              <span className={`flex items-center gap-1 ${isSelected ? 'text-stone-300' : 'text-stone-400'}`}>
                                <Clock className="w-3.5 h-3.5" /> {s.duracao_minutos} min
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className={`text-sm font-bold block ${isSelected ? 'text-amber-300' : 'text-stone-900'}`}>
                              R$ {s.preco}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    disabled={!selectedService}
                    onClick={() => setStep(2)}
                    className="w-full mt-6 bg-stone-900 hover:bg-stone-800 disabled:opacity-30 text-white font-semibold text-xs tracking-wider uppercase py-4 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
                  >
                    Continuar <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Passo 2: Barbeiro */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xs font-bold tracking-wider uppercase text-amber-600">Passo 2</h2>
                    <p className="text-xl font-extrabold text-stone-900">Escolha o Profissional</p>
                  </div>

                  <div className="space-y-3">
                    {barbers.map((b) => {
                      const isSelected = selectedBarber?.id === b.id;
                      return (
                        <div
                          key={b.id}
                          onClick={() => setSelectedBarber(b)}
                          className={`group p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center gap-4 ${
                            isSelected
                              ? 'bg-stone-900 text-white border-stone-900 shadow-md scale-[1.01]'
                              : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/80 text-stone-800'
                          }`}
                        >
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-stone-800 text-amber-300' : 'bg-stone-100 text-stone-500'
                          }`}>
                            <User className="w-5 h-5" />
                          </div>

                          <div>
                            <h3 className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-stone-900'}`}>
                              {b.nome}
                            </h3>
                            <p className={`text-xs ${isSelected ? 'text-stone-300' : 'text-stone-400'}`}>
                              {b.especialidade}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setStep(1)}
                      className="w-1/3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs tracking-wider uppercase py-4 rounded-2xl transition-all flex items-center justify-center gap-1.5 border border-stone-200/60"
                    >
                      <ArrowLeft className="w-4 h-4" /> Voltar
                    </button>
                    <button
                      disabled={!selectedBarber}
                      onClick={() => setStep(3)}
                      className="w-2/3 bg-stone-900 hover:bg-stone-800 disabled:opacity-30 text-white font-semibold text-xs tracking-wider uppercase py-4 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
                    >
                      Continuar <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Passo 3: Horário e Confirmação */}
              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xs font-bold tracking-wider uppercase text-amber-600">Passo 3</h2>
                    <p className="text-xl font-extrabold text-stone-900">Horário e Seus Dados</p>
                  </div>

                  <div className="space-y-3">
                    <div className="relative">
                      <UserCheck className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Seu Nome Completo"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 text-sm focus:outline-none focus:border-stone-900 focus:bg-white transition-all"
                      />
                    </div>

                    <div className="relative">
                      <Phone className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Telefone / WhatsApp"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 text-sm focus:outline-none focus:border-stone-900 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2.5 flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5 text-stone-400" /> Horários Disponíveis Hoje
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {TIMES.map((time) => {
                        const isSelected = selectedTime === time;
                        return (
                          <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={`py-3 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                              isSelected
                                ? 'bg-stone-900 text-white border-stone-900 font-bold shadow-sm'
                                : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-stone-300 hover:bg-stone-100'
                            }`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setStep(2)}
                      className="w-1/3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs tracking-wider uppercase py-4 rounded-2xl transition-all flex items-center justify-center gap-1.5 border border-stone-200/60"
                    >
                      <ArrowLeft className="w-4 h-4" /> Voltar
                    </button>
                    <button
                      disabled={!selectedTime || saving}
                      onClick={handleFinish}
                      className="w-2/3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white font-semibold text-xs tracking-wider uppercase py-4 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-emerald-600/10"
                    >
                      {saving ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>Finalizar Agendamento</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}