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

  const HOJE_ISO = '2026-09-07';

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

  const executarAcaoStatus = async (id, novoStatus) => {
    if (handleUpdateStatus) {
      await handleUpdateStatus(id, novoStatus);
      carregarAgenda(); 
    }
  };

  return (
    <div style={{ padding: '16px', fontFamily: 'sans-serif', backgroundColor: '#f9fafb', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#111827' }}>
        Painel da Agenda (Diagnóstico Ativo)
      </h2>

      {erroFatal && (
        <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', padding: '12px', borderRadius: '8px', color: '#991b1b', marginBottom: '16px', fontSize: '14px' }}>
          <strong>Erro ao conectar com o Supabase:</strong> {erroFatal}
        </div>
      )}

      {/* MÉTRICAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Atendimentos Hoje</p>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0' }}>{concluidos} / {totalAtendimentos}</h3>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Faturamento Previsto</p>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0' }}>R$ {faturamentoPrevisto.toFixed(2)}</h3>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Comissão ({taxaComissao}%)</p>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669', margin: '0' }}>R$ {comissaoEstimada.toFixed(2)}</h3>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Status</p>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0' }}>{carregando ? 'Carregando...' : (totalAtendimentos > 0 ? 'Ativo' : 'Livre')}</h3>
        </div>
      </div>

      {/* LISTA DE HOJE */}
      <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '16px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', color: '#374151', marginBottom: '12px' }}>
          Atendimentos de Hoje (07/09/2026) — Total na lista: {agendamentosHoje.length} | Total bruto no banco: {debugDadosBrutos.length}
        </h4>

        {agendamentosHoje.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
            <p>Nenhum agendamento encontrado para hoje (07/09/2026).</p>
            <p style={{ fontSize: '12px', marginTop: '8px', color: '#9ca3af' }}>
              Total de registros trazidos da tabela agendamentos: {debugDadosBrutos.length}. Se for 0, verifique o nome da tabela no Supabase.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {agendamentosHoje.map((item) => (
              <div key={item.id} style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '14px', color: '#111827' }}>{item.cliente_nome || item.nome_cliente || item.cliente || item.nome || 'Cliente'}</strong>
                  <div style={{ fontSize: '12px', color: '#4b5563' }}>
                    {item.servico_nome || item.servico || 'Serviço'} • {formatarDataHora(item)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#059669', display: 'block' }}>
                    R$ {Number(item.valor_total || item.valor || item.preco || 0).toFixed(2)}
                  </span>
                  <span style={{ fontSize: '10px', padding: '2px 6px', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '4px', fontWeight: 'bold' }}>
                    {item.status || 'AGENDADO'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BOTÃO PARA MOSTRAR OUTROS DIAS */}
      <button
        onClick={() => setMostrarOutrosDias(!mostrarOutrosDias)}
        style={{ width: '100%', padding: '12px', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', color: '#374151' }}
      >
        {mostrarOutrosDias ? 'Ocultar Outros Dias' : `Ver Todos os Outros Registros do Banco (${todosAgendamentos.length - agendamentosHoje.length})`}
      </button>

      {mostrarOutrosDias && (
        <div style={{ marginTop: '16px', backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>Outros Registros</h4>
          {agendamentosOutrosDias.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center' }}>Nenhum outro registro encontrado.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {agendamentosOutrosDias.map((item) => (
                <div key={item.id} style={{ padding: '10px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '13px' }}>
                  <strong>{item.cliente_nome || item.cliente || 'Cliente'}</strong> — {formatarDataHora(item)} — R$ {Number(item.valor_total || item.valor || 0).toFixed(2)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
