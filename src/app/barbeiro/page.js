'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Calendar, CheckCircle2, Clock, XCircle, RefreshCw, Wallet, TrendingUp, LogOut, Filter, X } from 'lucide-react';

export default function PainelBarbeiro() {
  const router = useRouter();
  const [agendamentos, setAgendamentos] = useState([]);
  const [comissaoPercentual, setComissaoPercentual] = useState(50);
  const [nomeBarbeiro, setNomeBarbeiro] = useState('');
  const [barbeiroId, setBarbeiroId] = useState(null);
  const [fotoBarbeiro, setFotoBarbeiro] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [processandoId, setProcessandoId] = useState(null);

  const [abaAtiva, setAbaAtiva] = useState('dia');
  const [modalLogoutOpen, setModalLogoutOpen] = useState(false);

  const obterDataLocalIso = (d = new Date()) => {
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  const [dataSelecionada, setDataSelecionada] = useState(obterDataLocalIso());
  
  const [mesSelecionado, setMesSelecionado] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  });

  const [dataEspecificaHistorico, setDataEspecificaHistorico] = useState('');

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

  async function carregarPainelDoBarbeiro() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: perfilBarbeiro } = await supabase
        .from('barbeiros')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!perfilBarbeiro) {
        setLoading(false);
        return;
      }

      setBarbeiroId(perfilBarbeiro.id);
      setNomeBarbeiro(perfilBarbeiro.nome);
      setFotoBarbeiro(perfilBarbeiro.foto || perfilBarbeiro.avatar || perfilBarbeiro.imagem || '');
      setComissaoPercentual(perfilBarbeiro.comissao ?? perfilBarbeiro.comissao_padrao ?? 50);

      let resultadosTotais = [];

      const { data: porId } = await supabase
        .from('agendamentos')
        .select(`
          *,
          clientes (nome),
          servicos (nome, preco),
          cliente:clientes(nome),
          servico:servicos(nome)
        `)
        .eq('barbeiro_id', perfilBarbeiro.id);

      if (porId) resultadosTotais = [...porId];

      if (perfilBarbeiro.nome) {
        const { data: porNome } = await supabase
          .from('agendamentos')
          .select(`
            *,
            clientes (nome),
            servicos (nome, preco),
            cliente:clientes(nome),
            servico:servicos(nome)
          `)
          .eq('barbeiro', perfilBarbeiro.nome);

        if (porNome) {
          const mapaIds = new Map();
          [...resultadosTotais, ...porNome].forEach(item => {
            if (item && item.id) mapaIds.set(item.id, item);
          });
          resultadosTotais = Array.from(mapaIds.values());
        }
      }

      resultadosTotais.sort((a, b) => {
        const dataA = new Date(a.data_hora || a.data || a.created_at || 0);
        const dataB = new Date(b.data_hora || b.data || b.created_at || 0);
        return dataA - dataB;
      });

      setAgendamentos(resultadosTotais);
    } catch (err) {
      console.error('Erro ao carregar painel:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let subscription = null;
    carregarPainelDoBarbeiro();

    async function setupRealtime() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: perfilBarbeiro } = await supabase.from('barbeiros').select('id').eq('user_id', user.id).single();
      if (!perfilBarbeiro) return;

      const nomeCanalUnico = `barbeiro-painel-${perfilBarbeiro.id}-${Date.now()}`;
      subscription = supabase
        .channel(nomeCanalUnico)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'agendamentos' },
          () => {
            carregarPainelDoBarbeiro();
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'barbeiros', filter: `id=eq.${perfilBarbeiro.id}` },
          (payload) => {
            if (payload.new) {
              const novaComissao = payload.new.comissao ?? payload.new.comissao_padrao ?? 50;
              setComissaoPercentual(novaComissao);
              if (payload.new.foto) setFotoBarbeiro(payload.new.foto);
            }
          }
        )
        .subscribe();
    }

    setupRealtime();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, []);

  const handleAlterarFoto = async (e) => {
    const arquivo = e.target.files[0];
    if (!arquivo || !barbeiroId) return;

    setUploadingFoto(true);
    try {
      const fileExt = arquivo.name.split('.').pop();
      const fileName = `barbeiro-${barbeiroId}-${Math.random()}.${fileExt}`;
      const filePath = `barbeiros/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('barbearia-bucket')
        .upload(filePath, arquivo);

      if (uploadError) throw uploadError;

      const { data: publicURLData } = supabase.storage
        .from('barbearia-bucket')
        .getPublicUrl(filePath);

      const novaFotoUrl = publicURLData.publicUrl;

      const { error: updateError } = await supabase
        .from('barbeiros')
        .update({ foto: novaFotoUrl })
        .eq('id', barbeiroId);

      if (updateError) throw updateError;

      setFotoBarbeiro(novaFotoUrl);
      alert('Foto de perfil atualizada!');
    } catch (err) {
      console.error('Erro no upload:', err);
      alert('Erro ao carregar foto.');
    } finally {
      setUploadingFoto(false);
    }
  };

  const alterarStatusAgendamento = async (id, novoStatus) => {
    setProcessandoId(id);
    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ status: novoStatus })
        .eq('id', id);

      if (error) throw error;
      await carregarPainelDoBarbeiro();
    } catch (err) {
      alert('Erro ao atualizar agendamento: ' + err.message);
    } finally {
      setProcessandoId(null);
    }
  };

  // REDIRECIONAMENTO AJUSTADO PARA A ROTA CORRETA DO LOGIN ADMIN
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/admin/login';
    } catch (err) {
      console.error('Erro ao sair:', err);
      window.location.href = '/admin/login';
    }
  };

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

  const agendamentosDoDiaPendentes = agendamentos.filter(item => {
    const dataMatch = extrairDataIso(item) === dataSelecionada;
    const status = (item.status || 'AGENDADO').toLowerCase();
    const isPendente = status !== 'concluido' && status !== 'concluído' && status !== 'cancelado' && status !== 'finalizado';
    return dataMatch && isPendente;
  });

  const totalFaturadoDia = agendamentos
    .filter(item => {
      const dataMatch = extrairDataIso(item) === dataSelecionada;
      const status = (item.status || '').toLowerCase();
      const isConcluido = status.includes('concluid') || status.includes('realizado');
      return dataMatch && isConcluido;
    })
    .reduce((acc, item) => {
      const preco = Number(item.valor_total || item.preco || item.servicos?.preco || item.servico?.preco || 0);
      return acc + preco;
    }, 0);

  const comissaoDia = totalFaturadoDia * (comissaoPercentual / 100);

  const agendamentosFiltradosHistorico = agendamentos.filter(item => {
    const isoItem = extrairDataIso(item);
    if (!isoItem) return false;

    if (dataEspecificaHistorico) {
      return isoItem === dataEspecificaHistorico;
    }

    return isoItem.substring(0, 7) === mesSelecionado;
  });

  const totalFaturadoHistorico = agendamentosFiltradosHistorico
    .filter(item => {
      const s = (item.status || '').toLowerCase();
      return s.includes('concluid') || s.includes('realizado');
    })
    .reduce((acc, item) => {
      const preco = Number(item.valor_total || item.preco || item.servicos?.preco || item.servico?.preco || 0);
      return acc + preco;
    }, 0);

  const comissaoHistorico = totalFaturadoHistorico * (comissaoPercentual / 100);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 text-stone-400 text-xs font-medium gap-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
        <span>Carregando painel do barbeiro...</span>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto min-h-screen flex flex-col p-3.5 sm:p-5 bg-stone-50 font-sans pb-24 gap-3.5 relative">
      
      {/* 1. CABEÇALHO DO PERFIL */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-4 shrink-0">
        <div className="flex justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <label className="relative cursor-pointer group shrink-0" title="Clique para alterar foto">
              {fotoBarbeiro ? (
                <img 
                  src={fotoBarbeiro} 
                  alt={nomeBarbeiro} 
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-stone-200 shadow-xs group-hover:opacity-75 transition-opacity"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-stone-900 text-white font-black flex items-center justify-center text-lg shadow-xs group-hover:opacity-75 transition-opacity">
                  {(nomeBarbeiro || 'P').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[9px] font-bold uppercase tracking-wider">
                Foto
              </div>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleAlterarFoto} 
                disabled={uploadingFoto}
                className="hidden" 
              />
            </label>

            <div>
              <span className="text-[9px] font-black text-stone-400 uppercase tracking-wider block">Painel do Profissional</span>
              <h2 className="text-base sm:text-lg font-black text-stone-900 leading-tight">Olá, {nomeBarbeiro || 'Barbeiro'}</h2>
              {uploadingFoto && <span className="text-[10px] text-amber-600 font-bold block">Enviando foto...</span>}
            </div>
          </div>

          <span className="bg-stone-100 text-stone-800 text-[10px] font-black px-3 py-1.5 rounded-2xl border border-stone-200/80 shrink-0">
            {comissaoPercentual}% Comissão
          </span>
        </div>

        {/* CARDS DE GANHOS DO DIA E DO MÊS/PERÍODO */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className={`p-3.5 rounded-2xl border transition-all ${abaAtiva === 'dia' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-stone-50 border-stone-200/60'}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <Wallet className={`w-3.5 h-3.5 ${abaAtiva === 'dia' ? 'text-emerald-700' : 'text-stone-500'}`} />
              <span className={`text-[10px] font-black uppercase tracking-wider ${abaAtiva === 'dia' ? 'text-emerald-800' : 'text-stone-500'}`}>
                Comissão Hoje
              </span>
            </div>
            <span className={`text-base sm:text-lg font-black block ${abaAtiva === 'dia' ? 'text-emerald-700' : 'text-stone-800'}`}>
              R$ {comissaoDia.toFixed(2)}
            </span>
            <span className="text-[9px] text-stone-400 font-bold">Total: R$ {totalFaturadoDia.toFixed(2)}</span>
          </div>

          <div className={`p-3.5 rounded-2xl border transition-all ${abaAtiva === 'mes' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-stone-50 border-stone-200/60'}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className={`w-3.5 h-3.5 ${abaAtiva === 'mes' ? 'text-emerald-700' : 'text-stone-500'}`} />
              <span className={`text-[10px] font-black uppercase tracking-wider ${abaAtiva === 'mes' ? 'text-emerald-800' : 'text-stone-500'}`}>
                {dataEspecificaHistorico ? 'Comissão Data' : 'Comissão Mês'}
              </span>
            </div>
            <span className={`text-base sm:text-lg font-black block ${abaAtiva === 'mes' ? 'text-emerald-700' : 'text-stone-800'}`}>
              R$ {comissaoHistorico.toFixed(2)}
            </span>
            <span className="text-[9px] text-stone-400 font-bold">Total: R$ {totalFaturadoHistorico.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* 2. CONTEÚDO DA ABA 1: AGENDA DO DIA */}
      {abaAtiva === 'dia' && (
        <div className="space-y-3.5">
          
          {/* MINI CALENDÁRIO DIÁRIO */}
          <div className="bg-white rounded-3xl p-3.5 pt-4 border border-stone-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">Próximos Dias</span>
              <span className="text-[11px] font-extrabold text-stone-900 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200">
                {new Date(dataSelecionada + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1 pt-1 pb-1">
              {proximaSemanaDias.map((dia) => {
                const selecionado = dataSelecionada === dia.iso;
                
                const qtdPendentesNoDia = agendamentos.filter(item => {
                  const dataItem = extrairDataIso(item);
                  const status = (item.status || 'AGENDADO').toLowerCase();
                  const pendente = status !== 'concluido' && status !== 'concluído' && status !== 'cancelado' && status !== 'finalizado';
                  return dataItem === dia.iso && pendente;
                }).length;

                return (
                  <button
                    key={dia.iso}
                    onClick={() => setDataSelecionada(dia.iso)}
                    className={`flex flex-col items-center justify-center py-2 px-0.5 rounded-2xl transition-all cursor-pointer relative ${
                      selecionado 
                        ? 'bg-stone-900 text-white shadow-md scale-105 border border-stone-900' 
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200/70'
                    }`}
                  >
                    <span className={`text-[8px] uppercase font-bold tracking-wider ${selecionado ? 'text-stone-300' : 'text-stone-400'}`}>
                      {dia.nomeDia}
                    </span>
                    <span className="text-xs sm:text-sm font-black my-0.5">
                      {dia.numeroDia}
                    </span>
                    <span className={`text-[8px] uppercase font-semibold ${selecionado ? 'text-stone-400' : 'text-stone-500'}`}>
                      {dia.nomeMes}
                    </span>

                    {qtdPendentesNoDia > 0 && (
                      <span className={`absolute -top-1.5 -right-1 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center shadow-xs ${
                        selecionado ? 'bg-emerald-400 text-stone-950' : 'bg-stone-900 text-white'
                      }`}>
                        {qtdPendentesNoDia}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* LISTA DE PENDENTES DO DIA SELECIONADO */}
          <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs p-4 sm:p-5 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <h3 className="text-xs font-black text-stone-900 uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span>Pendentes • {new Date(dataSelecionada + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
              </h3>
              <span className="text-[10px] font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
                {agendamentosDoDiaPendentes.length} na fila
              </span>
            </div>

            {agendamentosDoDiaPendentes.length === 0 ? (
              <div className="py-12 text-center text-stone-400 text-xs font-medium">
                🎉 Nenhum agendamento pendente para esta data!
              </div>
            ) : (
              <div className="space-y-3">
                {agendamentosDoDiaPendentes.map((item) => {
                  const cliente = item.cliente_nome || item.cliente?.nome || item.clientes?.nome || item.nome_cliente || item.cliente || 'Cliente';
                  const servico = item.servico_nome || item.servico?.nome || item.servicos?.nome || item.nome_servico || item.servico || 'Serviço';
                  const valor = Number(item.valor_total || item.preco || item.servicos?.preco || item.servico?.preco || 0);

                  let horaFormatada = '--:--';
                  const rawData = item.data_hora || item.data || item.created_at;
                  if (rawData) {
                    try {
                      const dataObj = new Date(rawData);
                      horaFormatada = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    } catch {
                      horaFormatada = '';
                    }
                  }

                  return (
                    <div 
                      key={item.id} 
                      className="p-4 rounded-2xl border border-stone-200/90 bg-white shadow-xs space-y-3"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-0.5">
                          <span className="text-xs font-black text-stone-900 block">{cliente}</span>
                          <span className="text-xs font-bold text-stone-600 block">{servico}</span>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-stone-900 block">R$ {valor.toFixed(2)}</span>
                          <span className="text-[11px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-lg border border-stone-200 inline-block mt-0.5">
                            ⏰ {horaFormatada}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                        <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider bg-amber-100 text-amber-800">
                          {item.status || 'AGENDADO'}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => alterarStatusAgendamento(item.id, 'concluido')}
                            disabled={processandoId === item.id}
                            className="py-1.5 px-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Concluir</span>
                          </button>

                          <button
                            onClick={() => alterarStatusAgendamento(item.id, 'cancelado')}
                            disabled={processandoId === item.id}
                            className="py-1.5 px-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer border border-stone-200 active:scale-95 disabled:opacity-50"
                          >
                            <XCircle className="w-3 h-3 text-stone-400" />
                            <span>Cancelar</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* 3. CONTEÚDO DA ABA 2: HISTÓRICO */}
      {abaAtiva === 'mes' && (
        <div className="space-y-3.5">
          
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-stone-500" />
                <span className="text-xs font-black text-stone-900 uppercase tracking-wider">Filtros do Histórico</span>
              </div>

              <button
                onClick={carregarPainelDoBarbeiro}
                className="p-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 rounded-xl transition-colors active:scale-95 cursor-pointer shadow-xs"
                title="Atualizar dados"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-stone-400 block">Mês Completo</label>
                <input 
                  type="month" 
                  value={mesSelecionado}
                  onChange={(e) => {
                    setMesSelecionado(e.target.value);
                    setDataEspecificaHistorico('');
                  }}
                  className="w-full bg-stone-50 border border-stone-200 text-stone-900 text-xs font-bold px-3 py-2 rounded-2xl focus:outline-none cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-extrabold uppercase text-stone-400 block">Dia Específico</label>
                  {dataEspecificaHistorico && (
                    <button 
                      onClick={() => setDataEspecificaHistorico('')}
                      className="text-[9px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" /> Limpar dia
                    </button>
                  )}
                </div>
                <input 
                  type="date" 
                  value={dataEspecificaHistorico}
                  onChange={(e) => setDataEspecificaHistorico(e.target.value)}
                  className={`w-full border text-xs font-bold px-3 py-2 rounded-2xl focus:outline-none cursor-pointer transition-colors ${
                    dataEspecificaHistorico 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                      : 'bg-stone-50 border-stone-200 text-stone-900'
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs p-4 sm:p-5 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <h3 className="text-xs font-black text-stone-900 uppercase tracking-wide">
                {dataEspecificaHistorico 
                  ? `Registros do dia ${dataEspecificaHistorico.split('-').reverse().join('/')}` 
                  : 'Todos os Registros do Mês'}
              </h3>
              <span className="text-xs text-stone-400 font-bold">{agendamentosFiltradosHistorico.length} encontrados</span>
            </div>

            {agendamentosFiltradosHistorico.length === 0 ? (
              <div className="py-12 text-center text-stone-400 text-xs font-medium">
                Nenhum agendamento encontrado para este filtro.
              </div>
            ) : (
              <div className="space-y-2.5">
                {agendamentosFiltradosHistorico.map((item) => {
                  const cliente = item.cliente_nome || item.cliente?.nome || item.clientes?.nome || item.nome_cliente || item.cliente || 'Cliente';
                  const servico = item.servico_nome || item.servico?.nome || item.servicos?.nome || item.nome_servico || item.servico || 'Serviço';
                  const valor = Number(item.valor_total || item.preco || item.servicos?.preco || item.servico?.preco || 0);
                  const status = (item.status || 'AGENDADO').toUpperCase();
                  
                  let dataFmt = '';
                  const rawData = item.data_hora || item.data || item.created_at;
                  if (rawData) {
                    try {
                      const dataObj = new Date(rawData);
                      dataFmt = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' às ' + dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    } catch {
                      dataFmt = rawData;
                    }
                  }

                  const isConcluido = status.includes('CONCLU') || status.includes('REALIZADO');

                  return (
                    <div key={item.id} className="p-3.5 rounded-2xl border border-stone-100 bg-stone-50/50 flex justify-between items-center text-xs gap-3">
                      <div className="space-y-0.5 overflow-hidden">
                        <span className="font-bold text-stone-900 block truncate">{cliente}</span>
                        <span className="text-stone-600 font-medium block truncate">{servico}</span>
                        {dataFmt && <span className="text-[10px] text-stone-400 block">{dataFmt}</span>}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-bold text-stone-900 block">R$ {valor.toFixed(2)}</span>
                        <span className={`px-2 py-0.5 text-[9px] font-black rounded-md inline-block mt-1 tracking-wider ${
                          isConcluido ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* 4. RODAPÉ FIXO DE NAVEGAÇÃO DO BARBEIRO */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-4 py-2 flex items-center justify-around max-w-xl mx-auto shadow-lg">
        <button
          type="button"
          onClick={() => setAbaAtiva('dia')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
            abaAtiva === 'dia'
              ? 'text-stone-900 font-black scale-105'
              : 'text-stone-400 hover:text-stone-600 font-semibold'
          }`}
        >
          <div
            className={`p-2 rounded-xl transition-all ${
              abaAtiva === 'dia' ? 'bg-stone-900 text-white shadow-sm' : 'bg-transparent'
            }`}
          >
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Agenda</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva('mes')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
            abaAtiva === 'mes'
              ? 'text-stone-900 font-black scale-105'
              : 'text-stone-400 hover:text-stone-600 font-semibold'
          }`}
        >
          <div
            className={`p-2 rounded-xl transition-all ${
              abaAtiva === 'mes' ? 'bg-stone-900 text-white shadow-sm' : 'bg-transparent'
            }`}
          >
            <Calendar className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Histórico</span>
        </button>

        <button
          type="button"
          onClick={() => setModalLogoutOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-2xl text-rose-600 hover:text-rose-700 font-semibold transition-all cursor-pointer"
          title="Sair / Trocar de Conta"
        >
          <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/80 shadow-2xs">
            <LogOut className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-black">Sair</span>
        </button>
      </footer>

      {/* 5. MODAL CUSTOMIZADO DE CONFIRMAÇÃO DE SAÍDA */}
      {modalLogoutOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-5 text-center relative text-slate-900">
            
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto shadow-sm">
              <LogOut className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-slate-900">Deseja realmente sair?</h3>
              <p className="text-xs font-medium text-slate-500">
                Você precisará fazer login novamente para acessar o seu painel de agendamentos.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setModalLogoutOpen(false)}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all cursor-pointer border border-slate-200 active:scale-95"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => {
                  setModalLogoutOpen(false);
                  handleLogout();
                }}
                className="py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-md active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>Sair da conta</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}