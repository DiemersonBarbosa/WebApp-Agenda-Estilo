'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function PainelBarbeiro() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [comissaoPercentual, setComissaoPercentual] = useState(50);
  const [nomeBarbeiro, setNomeBarbeiro] = useState('');
  const [barbeiroId, setBarbeiroId] = useState(null);
  const [fotoBarbeiro, setFotoBarbeiro] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingFoto, setUploadingFoto] = useState(false);

  
  
  // Estado para o filtro de mês (formato "YYYY-MM")
  const [mesSelecionado, setMesSelecionado] = useState('2026-09');

  async function carregarPainelDoBarbeiro() {
    setLoading(true);
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
      return dataB - dataA;
    });

    setAgendamentos(resultadosTotais);
    setLoading(false);
  }

  useEffect(() => {
    let subscription = null;

    carregarPainelDoBarbeiro();

    async function setupRealtime() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: perfilBarbeiro } = await supabase.from('barbeiros').select('id').eq('user_id', user.id).single();
      if (!perfilBarbeiro) return;

      const nomeCanalUnico = `barbeiro-comissao-${perfilBarbeiro.id}-${Date.now()}`;
      subscription = supabase
        .channel(nomeCanalUnico)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'barbeiros',
            filter: `id=eq.${perfilBarbeiro.id}`
          },
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

  // Função para upload de foto direto do dispositivo do barbeiro via Supabase Storage
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

      // Atualiza a coluna 'foto' na tabela barbeiros
      const { error: updateError } = await supabase
        .from('barbeiros')
        .update({ foto: novaFotoUrl })
        .eq('id', barbeiroId);

      if (updateError) throw updateError;

      setFotoBarbeiro(novaFotoUrl);
      alert('Foto de perfil atualizada com sucesso!');
    } catch (err) {
      console.error('Erro ao enviar foto:', err);
      alert('Erro ao enviar a imagem. Verifique se o bucket "barbearia-bucket" existe no Supabase e está configurado como público.');
    } finally {
      setUploadingFoto(false);
    }
  };

  // Filtra os agendamentos com base no mês selecionado
  const agendamentosFiltrados = agendamentos.filter(item => {
    const rawData = item.data_hora || item.data || item.created_at;
    if (!rawData) return false;
    const anoMes = String(rawData).substring(0, 7);
    return anoMes === mesSelecionado;
  });

  const totalFaturado = agendamentosFiltrados
    .filter(item => {
      const s = item.status?.toLowerCase() || '';
      return s.includes('concluido') || s.includes('concluído') || s.includes('realizado');
    })
    .reduce((acc, item) => {
      const preco = Number(item.valor_total || item.preco || item.servicos?.preco || item.servico?.preco || 0);
      return acc + preco;
    }, 0);

  const valorComissaoReceber = totalFaturado * (comissaoPercentual / 100);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 text-stone-400 text-xs font-medium">
        Carregando painel restrito...
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto h-screen flex flex-col p-4 sm:p-6 bg-stone-50 font-sans overflow-hidden gap-4">
      
      {/* HEADER DO PAINEL COM FOTO CLICÁVEL PARA UPLOAD */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200/60 shadow-sm space-y-4 shrink-0">
        <div className="flex justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            
            {/* Input invisível acionado ao clicar na foto */}
            <label className="relative cursor-pointer group shrink-0" title="Clique para alterar sua foto de perfil">
              {fotoBarbeiro ? (
                <img 
                  src={fotoBarbeiro} 
                  alt={nomeBarbeiro} 
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-stone-200 shadow-sm group-hover:opacity-75 transition-opacity"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-stone-900 text-white font-bold flex items-center justify-center text-base shadow-sm group-hover:opacity-75 transition-opacity">
                  {(nomeBarbeiro || 'P').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 bg-black/30 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold">
                Editar
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
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Área do Profissional</span>
              <h2 className="text-lg font-bold text-stone-900 leading-tight">Olá, {nomeBarbeiro || 'Profissional'}</h2>
              {uploadingFoto && <span className="text-[10px] text-amber-600 font-medium">Enviando nova foto...</span>}
            </div>
          </div>

          <span className="bg-stone-100 text-stone-700 text-[11px] font-semibold px-3 py-1 rounded-full shrink-0">
            {comissaoPercentual}% comissão
          </span>
        </div>

        {/* Seletor de Mês e Botão de Atualizar */}
        <div className="flex items-center justify-between bg-stone-50 px-4 py-2 rounded-2xl border border-stone-100 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-stone-600">Mês:</span>
            <input 
              type="month" 
              value={mesSelecionado}
              onChange={(e) => setMesSelecionado(e.target.value)}
              className="bg-white border border-stone-200 text-stone-800 text-xs font-semibold px-2.5 py-1.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-400 cursor-pointer"
            />
          </div>

          <button
            onClick={carregarPainelDoBarbeiro}
            className="px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors active:scale-95 cursor-pointer shadow-sm"
            title="Atualizar dados"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Atualizar
          </button>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-100/80 p-3.5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-800/80 font-medium block">Comissão do Mês</span>
            <span className="text-[10px] text-emerald-600/70">Baseada nos serviços concluídos</span>
          </div>
          <span className="text-xl font-black text-emerald-600">
            R$ {valorComissaoReceber.toFixed(2)}
          </span>
        </div>
      </div>

      {/* CONTAINER DOS ATENDIMENTOS */}
      <div className="bg-white rounded-3xl border border-stone-200/60 shadow-sm p-5 flex-1 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center pb-3 shrink-0">
          <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide">Atendimentos do Mês</h3>
          <span className="text-xs text-stone-400 font-medium">{agendamentosFiltrados.length} encontrados</span>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          {agendamentosFiltrados.length === 0 ? (
            <div className="py-12 text-center text-stone-400 text-xs">
              Nenhum agendamento encontrado para este mês.
            </div>
          ) : (
            <div className="space-y-2.5">
              {agendamentosFiltrados.map((item) => {
                const cliente = item.cliente_nome || item.cliente?.nome || item.clientes?.nome || item.nome_cliente || item.cliente || 'Cliente sem nome';
                const servico = item.servico_nome || item.servico?.nome || item.servicos?.nome || item.nome_servico || item.servico || 'Serviço';
                const valor = Number(item.valor_total || item.preco || item.servicos?.preco || item.servico?.preco || 0);
                const status = (item.status || 'AGENDADO').toUpperCase();
                
                let dataFormatada = '';
                const rawData = item.data_hora || item.data || item.created_at;
                if (rawData) {
                  try {
                    const dataObj = new Date(rawData);
                    dataFormatada = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' às ' + dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  } catch (e) {
                    dataFormatada = rawData;
                  }
                }

                const isConcluido = status.includes('CONCLU') || status.includes('REALIZADO');

                return (
                  <div key={item.id} className="p-3.5 rounded-2xl border border-stone-100 bg-stone-50/50 hover:bg-stone-50 transition-colors flex justify-between items-center text-xs gap-3">
                    <div className="space-y-1 overflow-hidden">
                      <span className="font-bold text-stone-900 block truncate">{cliente}</span>
                      <span className="text-stone-600 font-medium block truncate">{servico}</span>
                      {dataFormatada && <span className="text-[10px] text-stone-400 block">{dataFormatada}</span>}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-stone-900 block">R$ {valor.toFixed(2)}</span>
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md inline-block mt-1 tracking-wide ${
                        isConcluido 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-amber-100 text-amber-800'
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

    </div>
  );
}