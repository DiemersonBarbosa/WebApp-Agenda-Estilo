'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  FiRefreshCw, 
  FiCheckCircle, 
  FiEdit2, 
  FiTrash2, 
  FiSearch, 
  FiCalendar, 
  FiDollarSign, 
  FiUsers, 
  FiActivity,
  FiClock
} from 'react-icons/fi';

export default function PainelAgendaDia({ barbeariaId, profissionalId, taxaComissao = 50, onEditarAgendamento }) {
  const [agendamentos, setAgendamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroFatal, setErroFatal] = useState(null);
  const [termoBusca, setTermoBusca] = useState('');

  const carregarAgenda = async () => {
    try {
      setCarregando(true);
      setErroFatal(null);

      let query = supabase.from('agendamentos').select('*');

      if (barbeariaId) {
        query = query.eq('barbearia_id', barbeariaId);
      } else if (profissionalId) {
        query = query.eq('barbeiro_id', profissionalId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro Supabase:', error);
        setErroFatal(error.message);
        setAgendamentos([]);
      } else if (data) {
        console.log('Dados brutos vindos do Supabase:', data);
        setAgendamentos(data);
      }
    } catch (err) {
      console.error('Erro inesperado:', err);
      setErroFatal(err.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarAgenda();
  }, [profissionalId, barbeariaId]);

  const alterarStatus = async (id, novoStatus) => {
    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ status: novoStatus })
        .eq('id', id);

      if (error) {
        alert('Erro ao atualizar status: ' + error.message);
      } else {
        carregarAgenda();
      }
    } catch (err) {
      console.error('Erro:', err);
    }
  };

  const excluirAgendamento = async (id) => {
    if (!window.confirm('Deseja realmente excluir este agendamento?')) return;
    try {
      const { error } = await supabase
        .from('agendamentos')
        .delete()
        .eq('id', id);

      if (error) {
        alert('Erro ao excluir: ' + error.message);
      } else {
        carregarAgenda();
      }
    } catch (err) {
      console.error('Erro:', err);
    }
  };

  const agendamentosFiltrados = agendamentos.filter(item => {
    if (!termoBusca) return true;
    const termo = termoBusca.toLowerCase();
    const nomeCliente = String(item.cliente_nome || item.nome_cliente || item.cliente || item.nome || '').toLowerCase();
    const servicoNome = String(item.servico_nome || item.servico || '').toLowerCase();
    return nomeCliente.includes(termo) || servicoNome.includes(termo);
  });

  const totalAtendimentos = agendamentos.length;
  const concluidos = agendamentos.filter(a => {
    const s = String(a.status || '').toLowerCase();
    return s.includes('concluido') || s.includes('concluído');
  }).length;
  
  const faturamentoPrevisto = agendamentos.reduce((acc, item) => {
    const val = item.valor_total || item.valor || item.preco || item.price || 0;
    return acc + Number(val);
  }, 0);
  
  const comissaoEstimada = faturamentoPrevisto * ((taxaComissao || 0) / 100);

  const formatarDataHora = (item) => {
    const dataStr = item.data_hora || item.horario || item.data || item.created_at || '';
    if (!dataStr) return 'Horário não informado';
    try {
      const dataObj = new Date(dataStr);
      if (!isNaN(dataObj.getTime())) {
        return dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' às ' + dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      }
    } catch (e) {}
    return String(dataStr);
  };

  return (
    <div style={{ padding: '16px', fontFamily: 'sans-serif', backgroundColor: '#f9fafb', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
      
      {/* CABEÇALHO DO PAINEL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiCalendar color="#059669" /> Painel Geral de Agendamentos
        </h2>
        <button 
          onClick={carregarAgenda}
          style={{ backgroundColor: '#fff', border: '1px solid #d1d5db', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <FiRefreshCw /> {carregando ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      {erroFatal && (
        <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', padding: '12px', borderRadius: '8px', color: '#991b1b', marginBottom: '16px', fontSize: '14px' }}>
          <strong>Erro ao conectar com o Supabase:</strong> {erroFatal}
        </div>
      )}

      {/* MÉTRICAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#fff', padding: '14px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', margin: '0 0 4px 0', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FiUsers size={13} /> Atendimentos
          </p>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0', color: '#111827' }}>{concluidos} / {totalAtendimentos}</h3>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '14px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', margin: '0 0 4px 0', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FiDollarSign size={13} /> Faturamento
          </p>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0', color: '#111827' }}>R$ {faturamentoPrevisto.toFixed(2)}</h3>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '14px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', margin: '0 0 4px 0', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FiDollarSign size={13} /> Comissão ({taxaComissao}%)
          </p>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#059669', margin: '0' }}>R$ {comissaoEstimada.toFixed(2)}</h3>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '14px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', margin: '0 0 4px 0', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FiActivity size={13} /> Status
          </p>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0', color: totalAtendimentos > 0 ? '#059669' : '#6b7280' }}>
            {carregando ? 'Carregando...' : (totalAtendimentos > 0 ? 'Ativo' : 'Livre')}
          </h3>
        </div>
      </div>

      {/* BARRA DE PESQUISA */}
      <div style={{ marginBottom: '16px', position: 'relative', display: 'flex', alignItems: 'center' }}>
        <FiSearch style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
        <input 
          type="text"
          placeholder="Pesquisar por nome do cliente ou serviço..."
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '10px 14px 10px 36px', 
            borderRadius: '8px', 
            border: '1px solid #cbd5e1', 
            fontSize: '13px', 
            outline: 'none', 
            boxSizing: 'border-box',
            backgroundColor: '#fff'
          }}
        />
      </div>

      {/* LISTA DE AGENDAMENTOS */}
      <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', color: '#374151', marginBottom: '12px', letterSpacing: '0.5px' }}>
          Lista de Registros ({agendamentosFiltrados.length})
        </h4>

        {agendamentosFiltrados.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
            <p style={{ fontWeight: '500', color: '#4b5563', margin: '0 0 4px 0' }}>Nenhum agendamento encontrado no banco de dados.</p>
            <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0' }}>
              Verifique se os IDs (barbeariaId / profissionalId) estão sendo passados corretamente para este componente.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {agendamentosFiltrados.map((item) => {
              const statusLower = String(item.status || '').toLowerCase();
              const isConcluido = statusLower.includes('concluido') || statusLower.includes('concluído');
              const isCancelado = statusLower.includes('cancelado');

              return (
                <div key={item.id} style={{ padding: '14px', backgroundColor: '#fdfdfd', borderRadius: '10px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  
                  {/* Info principal */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <strong style={{ fontSize: '14px', color: '#111827', display: 'block', marginBottom: '2px' }}>
                        {item.cliente_nome || item.nome_cliente || item.cliente || item.nome || 'Cliente sem nome'}
                      </strong>
                      <div style={{ fontSize: '12px', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>{item.servico_nome || item.servico || 'Serviço'}</span> • 
                        <span style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <FiClock size={11} /> {formatarDataHora(item)}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#059669', display: 'block' }}>
                        R$ {Number(item.valor_total || item.valor || item.preco || 0).toFixed(2)}
                      </span>
                      <span style={{ 
                        fontSize: '9px', 
                        padding: '2px 6px', 
                        borderRadius: '4px', 
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        backgroundColor: isConcluido ? '#d1fae5' : isCancelado ? '#fee2e2' : '#fef3c7',
                        color: isConcluido ? '#065f46' : isCancelado ? '#991b1b' : '#92400e',
                        display: 'inline-block',
                        marginTop: '4px'
                      }}>
                        {item.status || 'AGENDADO'}
                      </span>
                    </div>
                  </div>

                  {/* BARRA DE AÇÕES (CONCLUIR, EDITAR, EXCLUIR) */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #f3f4f6', paddingTop: '8px' }}>
                    {!isConcluido && (
                      <button 
                        onClick={() => alterarStatus(item.id, 'Concluído')}
                        style={{ backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <FiCheckCircle /> Concluir
                      </button>
                    )}
                    
                    <button 
                      onClick={() => onEditarAgendamento ? onEditarAgendamento(item) : alert('Função de editar acionada')}
                      style={{ backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <FiEdit2 /> Editar
                    </button>

                    <button 
                      onClick={() => excluirAgendamento(item.id)}
                      style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <FiTrash2 /> Excluir
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
