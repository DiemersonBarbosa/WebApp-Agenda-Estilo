'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function PainelAgendaDia({ profissionalId, taxaComissao = 50, handleUpdateStatus }) {
  const [agendamentosHoje, setAgendamentosHoje] = useState([]);
  const [todosAgendamentos, setTodosAgendamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [debugDadosBrutos, setDebugDadosBrutos] = useState([]);
  const [erroFatal, setErroFatal] = useState(null);
  
  const [mostrarOutrosDias, setMostrarOutrosDias] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('TODOS');

  const HOJE_ISO = new Date().toISOString().split('T')[0];

  const extrairDataIso = (item) => {
    if (!item) return '';
    const valores = Object.values(item);
    for (const val of valores) {
      if (val && typeof val === 'string') {
        const str = val.trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
          return str.substring(0, 10);
        }
        if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) {
          const [dia, mes, ano] = str.split('T')[0].split(' ')[0].split('/');
          return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
        }
      }
    }
    return '';
  };

  const carregarAgenda = async () => {
    try {
      setCarregando(true);
      setErroFatal(null);

      const { data, error } = await supabase
        .from('agendamentos')
        .select('*');

      if (error) {
        console.error('Erro Supabase:', error);
        setErroFatal(error.message);
        setAgendamentosHoje([]);
        setTodosAgendamentos([]);
      } else if (data) {
        setDebugDadosBrutos(data);

        const filtradosPorProfissional = data.filter(item => {
          if (!profissionalId) return true;
          const profStr = String(profissionalId).toLowerCase();
          return (
            String(item.barbeiro_id || '').toLowerCase() === profStr || 
            String(item.profissional_id || '').toLowerCase() === profStr ||
            String(item.barbeiro || '').toLowerCase().includes(profStr) ||
            String(item.profissional_nome || '').toLowerCase().includes(profStr)
          );
        });

        const listaGeral = filtradosPorProfissional.length > 0 ? filtradosPorProfissional : data;
        setTodosAgendamentos(listaGeral);

        const doDia = listaGeral.filter(item => extrairDataIso(item) === HOJE_ISO);
        setAgendamentosHoje(doDia);
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
  }, [profissionalId]);

  const totalAtendimentos = agendamentosHoje.length;
  const concluidos = agendamentosHoje.filter(a => {
    const s = String(a.status || '').toLowerCase();
    return s.includes('concluido') || s.includes('concluído');
  }).length;
  
  const faturamentoPrevisto = agendamentosHoje.reduce((acc, item) => {
    const val = item.valor_total || item.valor || item.preco || item.price || 0;
    return acc + Number(val);
  }, 0);
  
  const comissaoEstimada = faturamentoPrevisto * ((taxaComissao || 0) / 100);

  const formatarDataHora = (item) => {
    const dataStr = item.data_hora || item.horario || item.data || item.created_at || '';
    if (!dataStr) return '';
    try {
      const dataObj = new Date(dataStr);
      if (!isNaN(dataObj.getTime())) {
        return dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' às ' + dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      }
    } catch (e) {
      // fallback
    }
    return String(dataStr);
  };

  const agendamentosOutrosDias = todosAgendamentos.filter(item => {
    return extrairDataIso(item) !== HOJE_ISO;
  }).filter(item => {
    if (filtroStatus === 'TODOS') return true;
    const statusItem = (item.status || 'PENDENTE').toUpperCase();
    if (filtroStatus === 'CONCLUIDO') return statusItem.includes('CONCLU');
    if (filtroStatus === 'PENDENTE') return statusItem.includes('PENDENTE') || statusItem.includes('AGENDADO');
    if (filtroStatus === 'CANCELADO') return statusItem.includes('CANCELADO');
    return true;
  });

  return (
    <div style={{ padding: '16px', fontFamily: 'sans-serif', backgroundColor: '#f9fafb', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0', color: '#111827' }}>
          Painel da Agenda de Hoje
        </h2>
        <button 
          onClick={carregarAgenda}
          style={{ backgroundColor: '#fff', border: '1px solid #d1d5db', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', color: '#374151' }}
        >
          {carregando ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      {erroFatal && (
        <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', padding: '12px', borderRadius: '8px', color: '#991b1b', marginBottom: '16px', fontSize: '14px' }}>
          <strong>Erro ao conectar com o Supabase:</strong> {erroFatal}
        </div>
      )}

      {/* MÉTRICAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', margin: '0 0 4px 0', fontWeight: 'bold' }}>Atendimentos</p>
          <h3 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0', color: '#111827' }}>{concluidos} / {totalAtendimentos}</h3>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', margin: '0 0 4px 0', fontWeight: 'bold' }}>Faturamento</p>
          <h3 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0', color: '#111827' }}>R$ {faturamentoPrevisto.toFixed(2)}</h3>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', margin: '0 0 4px 0', fontWeight: 'bold' }}>Comissão ({taxaComissao}%)</p>
          <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: '#059669', margin: '0' }}>R$ {comissaoEstimada.toFixed(2)}</h3>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', margin: '0 0 4px 0', fontWeight: 'bold' }}>Status</p>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0', color: totalAtendimentos > 0 ? '#059669' : '#6b7280' }}>
            {carregando ? 'Carregando...' : (totalAtendimentos > 0 ? 'Ativo' : 'Livre')}
          </h3>
        </div>
      </div>

      {/* LISTA DO DIA */}
      <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', color: '#374151', marginBottom: '12px', letterSpacing: '0.5px' }}>
          Atendimentos de Hoje ({HOJE_ISO.split('-').reverse().join('/')})
        </h4>

        {agendamentosHoje.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
            <p style={{ fontWeight: '500', color: '#4b5563', margin: '0 0 4px 0' }}>Nenhum atendimento agendado para hoje.</p>
            <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0' }}>
              Total de registros na base: {debugDadosBrutos.length}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {agendamentosHoje.map((item) => {
              const statusLower = String(item.status || '').toLowerCase();
              const isConcluido = statusLower.includes('concluido');
              const isCancelado = statusLower.includes('cancelado');

              return (
                <div key={item.id} style={{ padding: '14px', backgroundColor: '#fdfdfd', borderRadius: '10px', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '14px', color: '#111827', display: 'block', marginBottom: '2px' }}>
                      {item.cliente_nome || item.nome_cliente || item.cliente || item.nome || 'Cliente'}
                    </strong>
                    <div style={{ fontSize: '12px', color: '#4b5563' }}>
                      {item.servico_nome || item.servico || 'Serviço'} • <span style={{ color: '#6b7280' }}>{formatarDataHora(item)}</span>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#059669' }}>
                      R$ {Number(item.valor_total || item.valor || item.preco || 0).toFixed(2)}
                    </span>
                    <span style={{ 
                      fontSize: '10px', 
                      padding: '3px 8px', 
                      borderRadius: '6px', 
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      backgroundColor: isConcluido ? '#d1fae5' : isCancelado ? '#fee2e2' : '#fef3c7',
                      color: isConcluido ? '#065f46' : isCancelado ? '#991b1b' : '#92400e'
                    }}>
                      {item.status || 'AGENDADO'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* BOTÃO PARA MOSTRAR OUTROS DIAS */}
      <button
        onClick={() => setMostrarOutrosDias(!mostrarOutrosDias)}
        style={{ width: '100%', padding: '12px', backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', color: '#374151', fontSize: '13px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
      >
        {mostrarOutrosDias ? 'Ocultar Histórico / Outros Dias' : `Ver Histórico / Outros Dias (${todosAgendamentos.length - agendamentosHoje.length})`}
      </button>

      {mostrarOutrosDias && (
        <div style={{ marginTop: '16px', backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: '#111827' }}>Outros Registros</h4>
          
          {agendamentosOutrosDias.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center', padding: '16px 0' }}>Nenhum outro registro encontrado.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {agendamentosOutrosDias.map((item) => (
                <div key={item.id} style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: '#111827', display: 'block' }}>{item.cliente_nome || item.cliente || 'Cliente'}</strong>
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>{formatarDataHora(item)}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 'bold', color: '#059669', display: 'block', fontSize: '14px' }}>
                      R$ {Number(item.valor_total || item.valor || 0).toFixed(2)}
                    </span>
                    <span style={{ fontSize: '10px', color: '#4b5563', textTransform: 'uppercase' }}>
                      {item.status || 'AGENDADO'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
