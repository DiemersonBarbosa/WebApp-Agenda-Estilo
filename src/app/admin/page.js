'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarCheck,
  Users,
  DollarSign,
  Scissors,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  RefreshCw,
  Search,
  AlertCircle,
  Edit,
  Trash2,
  X,
  LogOut,
  Store,
  TrendingDown,
  Wallet,
  CreditCard,
  Lock,
  Copy,
  Check,
  Settings,
  Menu,
  Calendar,
  Percent
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

import ConfiguracoesBarbearia from '@/components/ConfiguracoesBarbearia';


import PainelAgendaDia from '@/components/PainelAgendaDia';


import { Transition } from '@headlessui/react';
import { Fragment } from 'react';

import { motion, AnimatePresence } from 'framer-motion';



 async function criarAcessoBarbeiro(barbeiroId, emailBarbeiro, senhaTemporaria) {
  try {
    const response = await fetch('/api/criar-acesso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        barbeiroId,
        email: emailBarbeiro,
        password: senhaTemporaria
      })
    });

    const resultado = await response.json();

    if (!response.ok) {
      throw new Error(resultado.error || 'Erro ao criar acesso');
    }

    alert('Acesso do barbeiro criado com sucesso!');
    window.location.reload();
  } catch (error) {
    alert('Erro: ' + error.message);
  }
}


export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('agendamentos');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);




 






  // NOVO: Estado para controlar a gaveta do menu no mobile
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // ... (o restante dos seus estados continuam iguais)

  // Sessão e Barbearia
  const [user, setUser] = useState(null);
  const [barbearia, setBarbearia] = useState(null);

  // Estados de Assinatura e Teste
  const [diasRestantes, setDiasRestantes] = useState(7);
  const [assinaturaExpirada, setAssinaturaExpirada] = useState(false);
  const [modalAssinaturaOpen, setModalAssinaturaOpen] = useState(false);
  const [processandoPagamento, setProcessandoPagamento] = useState(false);
  const [copiado, setCopiado] = useState(false);
  
  // Opção de pagamento selecionada no modal ('pix', 'credito', 'debito')
  const [metodoPagamento, setMetodoPagamento] = useState('pix');

  // Estados dinâmicos para o Pix do Mercado Pago
  const [pixDataMP, setPixDataMP] = useState({
    qrCodeBase64: '',
    copiaECola: '',
    paymentId: null
  });

  // Estados para o formulário de Cartão (Mercado Pago)
  const [dadosCartao, setDadosCartao] = useState({
    numero: '',
    nome: '',
    validade: '',
    cvv: '',
    parcelas: '1'
  });

  // Valor da assinatura mensal
  const valorAssinatura = 9.90;

  // Dados filtrados do Banco
  const [agendamentos, setAgendamentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [barbeiros, setBarbeiros] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [despesas, setDespesas] = useState([]);

  // Filtro de busca de cliente
  const [searchTerm, setSearchTerm] = useState('');

  // Funções Utilitárias de Formatação
  const formatarData = (item) => {
    const rawData = item.data_hora || item.created_at;
    if (!rawData) return '-';
    try {
      return new Date(rawData).toLocaleDateString('pt-BR');
    } catch {
      return '-';
    }
  };

  const formatarHora = (item) => {
    const rawData = item.data_hora || item.created_at;
    if (rawData && typeof rawData === 'string' && rawData.includes('T')) {
      return new Date(rawData).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    return '-';
  };

  // Cálculo do período de teste de 7 dias
  const verificarStatusAssinatura = (dadosBarbearia) => {
  console.log("DADOS VINDO DO BANCO:", dadosBarbearia);
  
  if (!dadosBarbearia) return;

  const status = dadosBarbearia?.status_assinatura;
  const dataCriacaoStr = dadosBarbearia?.created_at;

  // 1. Se estiver explicitamente ativo, libera tudo
  if (status === 'ativo') {
    setModalAssinaturaOpen(false);
    setAssinaturaExpirada(false);
    return;
  }

  // 2. Se estiver explicitamente vencido, bloqueia
  if (status === 'vencido') {
    setModalAssinaturaOpen(true);
    setAssinaturaExpirada(true);
    return;
  }

  // 3. Se estiver em 'teste' ou sem status definido, calcula os 7 dias pela data de criação
  if (dataCriacaoStr) {
    const dataCriacao = new Date(dataCriacaoStr);
    const hoje = new Date();
    
    dataCriacao.setHours(0, 0, 0, 0);
    hoje.setHours(0, 0, 0, 0);

    const diferencaEmMilissegundos = hoje - dataCriacao;
    const diasPassados = Math.floor(diferencaEmMilissegundos / (1000 * 60 * 60 * 24));
    const restante = 7 - diasPassados;

    console.log("Dias passados desde a criação:", diasPassados);
    console.log("Dias restantes de teste:", restante);

    if (restante <= 0) {
      // Passaram 7 dias -> Bloqueia
      setModalAssinaturaOpen(true);
      setAssinaturaExpirada(true);
    } else {
      // Ainda está dentro dos 7 dias de teste -> LIBERA O PAINEL FORÇADAMENTE
      setModalAssinaturaOpen(false);
      setAssinaturaExpirada(false);
    }
  } else {
    setModalAssinaturaOpen(true);
    setAssinaturaExpirada(true);
  }
};

  // Carregar Dados isolados por barbearia_id
  const loadDashboardData = useCallback(async (barbeariaId) => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const [resAgendamentos, resClientes, resBarbeiros, resServicos, resDespesas, resBarbearia] = await Promise.all([
        supabase
          .from('agendamentos')
          .select('*, clientes(*), barbeiros(*), servicos(*)')
          .eq('barbearia_id', barbeariaId)
          .order('data_hora', { ascending: true }),
        supabase.from('clientes').select('*').eq('barbearia_id', barbeariaId).order('created_at', { ascending: false }),
        supabase.from('barbeiros').select('*').eq('barbearia_id', barbeariaId).order('nome', { ascending: true }),
        supabase.from('servicos').select('*').eq('barbearia_id', barbeariaId).order('nome', { ascending: true }),
        supabase.from('despesas').select('*').eq('barbearia_id', barbeariaId).order('data', { ascending: false }),
        supabase.from('barbearias').select('*').eq('id', barbeariaId).single()
      ]);

      if (resAgendamentos.error) throw resAgendamentos.error;
      if (resClientes.error) throw resClientes.error;
      if (resBarbeiros.error) throw resBarbeiros.error;
      if (resServicos.error) throw resServicos.error;
      if (resDespesas.error) throw resDespesas.error;
      if (resBarbearia.error) throw resBarbearia.error;

      const dadosBarbearia = resBarbearia.data;
      setBarbearia(dadosBarbearia);
      setAgendamentos(resAgendamentos.data || []);
      setClientes(resClientes.data || []);
      setBarbeiros(resBarbeiros.data || []);
      setServicos(resServicos.data || []);
      setDespesas(resDespesas.data || []);


// ADICIONE ESTA LINHA AQUI PARA EXECUTAR A VALIDAÇÃO:
    if (dadosBarbearia) {
      verificarStatusAssinatura(dadosBarbearia);
    }


      const dataVencimentoStr = dadosBarbearia?.data_vencimento;
      const status = dadosBarbearia?.status_assinatura;
      
      const hoje = new Date();
      const dataExpiracao = dataVencimentoStr ? new Date(dataVencimentoStr) : null;
      const estaVencida = !dataExpiracao || dataExpiracao < hoje || status !== 'ativo';

      if (estaVencida) {
        setModalAssinaturaOpen(true);
      } else {
        setModalAssinaturaOpen(false);
      }

    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Gerar Pix dinâmico Oficial via API do Mercado Pago
  const gerarPixMercadoPago = useCallback(async (paymentData) => {
    try {
      const payload = {
        transaction_amount: Number(paymentData.transaction_amount) || 9.90,
        description: paymentData.description || 'Assinatura Mensal Gestor',
        payer_email: paymentData.payer_email || 'diemersonlimabarbosa@gmail.com',
        payer_name: paymentData.payer_name || 'Gestor'
      };

      const response = await fetch('/api/gerar-pix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Erro ao gerar PIX');
      }
      
      setPixDataMP({
        qrCodeBase64: data.qrCodeBase64 || '',
        copiaECola: data.copiaECola || '',
        paymentId: data.paymentId || null
      });

      return data; 
    } catch (error) {
      console.error('Falha ao gerar PIX:', error);
      alert(`Erro ao gerar Pix: ${error.message}`);
    }
  }, []);

  // Verificar Autenticação e Carregar dados da Barbearia
  useEffect(() => {
    const checkAuthAndLoad = async () => {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/admin/login');
        return;
      }



// --- ADICIONE ESTE BLOCO LOGO AQUI ---
      const { data: barbeiroCheck } = await supabase
        .from('barbeiros')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (barbeiroCheck) {
        router.push('/barbeiro');
        return;
      }
      // -------------------------------------



      setUser(session.user);

      const { data: barbData, error: barbError } = await supabase
        .from('barbearias')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (barbError || !barbData) {
        setErrorMessage('Barbearia não encontrada.');
        setLoading(false);
        return;
      }

      setBarbearia(barbData);
      verificarStatusAssinatura(barbData);
      await loadDashboardData(barbData.id);
    };

    checkAuthAndLoad();
  }, [router, loadDashboardData]);

  // Efeito para verificar o status do pagamento automaticamente a cada 5 segundos enquanto o Pix estiver na tela
  useEffect(() => {
    let intervalId;

    if (modalAssinaturaOpen && metodoPagamento === 'pix' && pixDataMP?.paymentId) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch('/api/verificar-pagamento', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId: pixDataMP.paymentId })
          });
          
          const data = await res.json();

          if (res.ok && data.status === 'approved') {
            clearInterval(intervalId);
            alert('Pagamento aprovado com sucesso! Redirecionando...');
            router.push('/admin');
          }
        } catch (err) {
          console.error('Erro ao verificar status automático:', err);
        }
      }, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [modalAssinaturaOpen, metodoPagamento, pixDataMP?.paymentId, router]);

 useEffect(() => {
  // Se ainda estiver no período de teste ou ativo, sai imediatamente sem fazer nada
  const dataCriacaoStr = barbearia?.created_at;
  const status = barbearia?.status_assinatura;

  if (status === 'ativo' || status === 'teste') {
    if (dataCriacaoStr) {
      const dataCriacao = new Date(dataCriacaoStr);
      const hoje = new Date();
      dataCriacao.setHours(0, 0, 0, 0);
      hoje.setHours(0, 0, 0, 0);
      const diasPassados = Math.floor((hoje - dataCriacao) / (1000 * 60 * 60 * 24));
      const restante = 7 - diasPassados;

      if (restante > 0) {
        setModalAssinaturaOpen(false);
        return; // Retorna antes de validar o modalOpen, impedindo qualquer "piscar"
      }
    }
  }

  // Só prossegue para gerar o Pix se realmente passou do prazo ou não está em teste
  if (modalAssinaturaOpen && metodoPagamento === 'pix' && !pixDataMP?.paymentId) {
    gerarPixMercadoPago({
      transaction_amount: 9.90,
      description: 'Plano Mensal Gestor - Acesso Completo',
      payer_email: user?.email || 'diemersonlimabarbosa@gmail.com',
      payer_name: barbearia?.nome || 'Gestor'
    });
  }
}, [modalAssinaturaOpen, metodoPagamento, pixDataMP?.paymentId, gerarPixMercadoPago, user, barbearia]);
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const handleProcessarPagamentoMercadoPago = async (e) => {
    if (e) e.preventDefault();
    setProcessandoPagamento(true);

    try {
      if (metodoPagamento === 'pix') {
        if (!pixDataMP.paymentId) {
          alert('Nenhum pagamento Pix gerado no momento. Aguarde o QR Code carregar.');
          setProcessandoPagamento(false);
          return;
        }

        const res = await fetch('/api/verificar-pagamento', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId: pixDataMP.paymentId })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Erro ao comunicar com o servidor de pagamento.');
        }

        if (data.status !== 'approved') {
          alert(`Pagamento ainda não aprovado. Status atual: ${data.status}. Por favor, conclua o pagamento via Pix.`);
          setProcessandoPagamento(false);
          return;
        }

        if (barbearia?.id) {
          const dataExpiracao = new Date();
          dataExpiracao.setMonth(dataExpiracao.getMonth() + 1);

          await supabase
            .from('barbearias')
            .update({ 
              status_assinatura: 'ativo', 
              assinatura_expira_em: dataExpiracao.toISOString(),
              ultimo_payment_id: pixDataMP.paymentId 
            })
            .eq('id', barbearia.id);
        }

        alert('Pagamento aprovado com sucesso! Acesso liberado.');
        setModalAssinaturaOpen(false);
        router.push('/admin');
      }
    } catch (err) {
      console.error('Erro ao processar pagamento:', err);
      alert(err.message);
    } finally {
      setProcessandoPagamento(false);
    }
  };

  const copiarChavePix = () => {
    if (!pixDataMP.copiaECola) return;
    navigator.clipboard.writeText(pixDataMP.copiaECola);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setAgendamentos((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );
    } catch (err) {
      alert('Erro ao atualizar status: ' + err.message);
    }
  };

  // --- AÇÕES DE SERVIÇOS, BARBEIROS E DESPESAS ---
  const [modalServicoOpen, setModalServicoOpen] = useState(false);
  const [editingServico, setEditingServico] = useState(null);
  const [formServico, setFormServico] = useState({ nome: '', preco: '', duracao_minutos: 30 });

  const [modalBarbeiroOpen, setModalBarbeiroOpen] = useState(false);
  const [editingBarbeiro, setEditingBarbeiro] = useState(null);
  const [formBarbeiro, setFormBarbeiro] = useState({ nome: '', especialidade: '' });

  const [modalDespesaOpen, setModalDespesaOpen] = useState(false);
  const [editingDespesa, setEditingDespesa] = useState(null);
  const [formDespesa, setFormDespesa] = useState({ descricao: '', valor: '', data: new Date().toISOString().split('T')[0] });

  const [modalInfoAssinaturaOpen, setModalInfoAssinaturaOpen] = useState(false);

  const handleOpenServicoModal = (servico = null) => {
    if (servico) {
      setEditingServico(servico);
      setFormServico({ nome: servico.nome || '', preco: servico.preco || '', duracao_minutos: servico.duracao_minutos || 30 });
    } else {
      setEditingServico(null);
      setFormServico({ nome: '', preco: '', duracao_minutos: 30 });
    }
    setModalServicoOpen(true);
  };

  const handleSaveServico = async (e) => {
    e.preventDefault();
    try {
      if (editingServico) {
        await supabase.from('servicos').update({ nome: formServico.nome, preco: Number(formServico.preco), duracao_minutos: Number(formServico.duracao_minutos) }).eq('id', editingServico.id);
      } else {
        await supabase.from('servicos').insert([{ barbearia_id: barbearia.id, nome: formServico.nome, preco: Number(formServico.preco), duracao_minutos: Number(formServico.duracao_minutos) }]);
      }
      setModalServicoOpen(false);
      loadDashboardData(barbearia.id);
    } catch (err) { alert('Erro ao salvar serviço: ' + err.message); }
  };

  const handleDeleteServico = async (id) => {
    if (!confirm('Deseja realmente excluir este serviço?')) return;
    await supabase.from('servicos').delete().eq('id', id);
    loadDashboardData(barbearia.id);
  };

  const handleOpenBarbeiroModal = (barbeiro = null) => {
    if (barbeiro) {
      setEditingBarbeiro(barbeiro);
      setFormBarbeiro({ nome: barbeiro.nome || '', especialidade: barbeiro.especialidade || '' });
    } else {
      setEditingBarbeiro(null);
      setFormBarbeiro({ nome: '', especialidade: '' });
    }
    setModalBarbeiroOpen(true);
  };

  const handleSaveBarbeiro = async (e) => {
    e.preventDefault();
    try {
      if (editingBarbeiro) {
        await supabase.from('barbeiros').update({ nome: formBarbeiro.nome, especialidade: formBarbeiro.especialidade }).eq('id', editingBarbeiro.id);
      } else {
        await supabase.from('barbeiros').insert([{ barbearia_id: barbearia.id, nome: formBarbeiro.nome, especialidade: formBarbeiro.especialidade }]);
      }
      setModalBarbeiroOpen(false);
      loadDashboardData(barbearia.id);
    } catch (err) { alert('Erro ao salvar barbeiro: ' + err.message); }
  };

  const handleDeleteBarbeiro = async (id) => {
    if (!confirm('Deseja realmente excluir este funcionário?')) return;
    await supabase.from('barbeiros').delete().eq('id', id);
    loadDashboardData(barbearia.id);
  };

  const handleOpenDespesaModal = (despesa = null) => {
    if (despesa) {
      setEditingDespesa(despesa);
      setFormDespesa({ descricao: despesa.descricao || '', valor: despesa.valor || '', data: despesa.data || new Date().toISOString().split('T')[0] });
    } else {
      setEditingDespesa(null);
      setFormDespesa({ descricao: '', valor: '', data: new Date().toISOString().split('T')[0] });
    }
    setModalDespesaOpen(true);
  };

  const handleSaveDespesa = async (e) => {
    e.preventDefault();
    try {
      if (editingDespesa) {
        await supabase.from('despesas').update({ descricao: formDespesa.descricao, valor: Number(formDespesa.valor), data: formDespesa.data }).eq('id', editingDespesa.id);
      } else {
        await supabase.from('despesas').insert([{ barbearia_id: barbearia.id, descricao: formDespesa.descricao, valor: Number(formDespesa.valor), data: formDespesa.data }]);
      }
      setModalDespesaOpen(false);
      loadDashboardData(barbearia.id);
    } catch (err) { alert('Erro ao salvar despesa: ' + err.message); }
  };

  const handleDeleteDespesa = async (id) => {
    if (!confirm('Deseja realmente excluir esta despesa?')) return;
    await supabase.from('despesas').delete().eq('id', id);
    loadDashboardData(barbearia.id);
  };

  // Cálculos Financeiros
  const totalFaturamento = agendamentos.filter((a) => a.status === 'concluido').reduce((acc, curr) => acc + (Number(curr.valor_total) || 0), 0);
  const totalDespesas = despesas.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
  const lucroLiquido = totalFaturamento - totalDespesas;
  const totalAtendimentosConcluidos = agendamentos.filter((a) => a.status === 'concluido').length;
  const ticketMedio = totalAtendimentosConcluidos > 0 ? (totalFaturamento / totalAtendimentosConcluidos).toFixed(2) : '0.00';
  const clientesFiltrados = clientes.filter((c) => c.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || c.telefone?.includes(searchTerm));

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center gap-3 text-stone-600 font-sans">
        <div className="w-9 h-9 border-2 border-stone-800 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold tracking-wider uppercase text-stone-500">Carregando Painel...</span>
      </div>
    );
  }

  return (
   <div className={`min-h-screen bg-stone-100 text-stone-800 flex flex-col font-sans relative ${assinaturaExpirada ? 'pointer-events-none select-none' : ''}`}>
    {/* TRAVA DE CARREGAMENTO PARA EVITAR O PISCAR DO MODAL */}
    {loading && (
      <div className="fixed inset-0 bg-stone-900 z-50 flex items-center justify-center text-white">
        <p>Carregando painel...</p>
      </div>
    )}




    



{/* =========================================================
       NOVO CABEÇALHO MOBILE CLEAN COM BOTÃO HAMBURGUER
       ========================================================= */}
   <header className="w-full bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-30">
  <div className="max-w-7xl mx-auto flex items-center justify-between">
    
    {/* Apenas Logo/Avatar + Nome da Barbearia */}
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-9 h-9 bg-gray-900 text-white rounded-xl flex items-center justify-center font-bold text-base shadow-sm flex-shrink-0">
        B
      </div>
      <h1 className="font-bold text-gray-900 text-base truncate">
        Barbearia Barbosa
      </h1>
    </div>

  </div>
</header>



    {/* =========================================================
   ABA: VISÃO GERAL & DASHBOARD COMPLETO (MOBILE & DESKTOP)
   ========================================================= */}
{activeTab === 'visao-geral' && (
  <div className="space-y-4 pb-24">
    
    {/* Cabeçalho da Seção */}
    <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col gap-3">
      <div>
        <h1 className="text-base font-extrabold text-stone-900">Visão Geral — {barbearia?.nome || 'Barbearia'}</h1>
        <p className="text-[11px] text-stone-500 mt-0.5">Acompanhe o desempenho, faturamento e fluxo de clientes no mês.</p>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-stone-100">
        <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          ● Mês Atual Ativo
        </span>
        {/* Link do Cliente opcional */}
        <a 
          href="/cliente" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[11px] font-bold text-stone-900 hover:underline flex items-center gap-1"
        >
          Link do Cliente ↗
        </a>
      </div>
    </div>

    {/* 4 CARDS DE INDICADORES PRINCIPAIS (KPIs) */}
    <div className="grid grid-cols-2 gap-3">
      
      {/* 1. Faturamento */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-stone-400 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider">Faturamento</span>
          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <DollarSign className="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <p className="text-lg font-extrabold text-stone-900">R$ {totalFaturamento ? totalFaturamento.toFixed(2) : '0,00'}</p>
          <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 inline-block">Serviços finalizados</span>
        </div>
      </div>

      {/* 2. Clientes Atendidos */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-stone-400 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider">Atendimentos</span>
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <Users className="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <p className="text-lg font-extrabold text-stone-900">{clientes?.length || 0}</p>
          <span className="text-[10px] text-blue-600 font-semibold mt-0.5 inline-block">Total no mês</span>
        </div>
      </div>

      {/* 3. Lucro Líquido */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-stone-400 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider">Lucro Líquido</span>
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Wallet className="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <p className="text-lg font-extrabold text-stone-900">R$ {lucroLiquido ? lucroLiquido.toFixed(2) : '0,00'}</p>
          <span className="text-[10px] text-indigo-600 font-semibold mt-0.5 inline-block">Receita - Despesas</span>
        </div>
      </div>

      {/* 4. Ticket Médio */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-stone-400 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider">Ticket Médio</span>
          <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <p className="text-lg font-extrabold text-stone-900">R$ {ticketMedio || '0,00'}</p>
          <span className="text-[10px] text-amber-600 font-semibold mt-0.5 inline-block">Média por cliente</span>
        </div>
      </div>

    </div>

    {/* RESUMO FINANCEIRO E ATALHOS */}
    <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
      <h2 className="text-xs font-bold text-stone-900">Balanço de Entradas e Saídas</h2>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
          <span className="text-xs font-medium text-stone-600">Total de Entradas</span>
          <span className="text-xs font-extrabold text-emerald-600">R$ {totalFaturamento ? totalFaturamento.toFixed(2) : '0,00'}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
          <span className="text-xs font-medium text-stone-600">Total de Despesas</span>
          <span className="text-xs font-extrabold text-rose-600">R$ {totalDespesas ? totalDespesas.toFixed(2) : '0,00'}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2">
        <button 
          onClick={() => setActiveTab('agendamentos')}
          className="p-3 bg-stone-900 text-white rounded-xl text-center text-xs font-bold active:scale-95 transition-transform"
        >
          Ver Agenda
        </button>
        <button 
          onClick={() => setActiveTab('clientes')}
          className="p-3 bg-stone-100 text-stone-800 rounded-xl text-center text-xs font-bold active:scale-95 transition-transform"
        >
          Ver Clientes
        </button>
      </div>
    </div>

  </div>
)}







    
   

    {/* ÁREA PRINCIPAL DA PÁGINA */}
    <main className="...">

{/* BARRA DE NAVEGAÇÃO INFERIOR FIXA COM BOTÃO CENTRAL DE MENU RÁPIDO */}
<nav aria-label="Navegação inferior mobile" className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-stone-200 px-4 py-2 z-40 flex items-center justify-between shadow-lg">
  
  {/* 1. Início / Visão Geral */}
  <button 
    onClick={() => setActiveTab('visao-geral')}
    className={`flex flex-col items-center space-y-1 transition-colors ${activeTab === 'visao-geral' ? 'text-stone-900 font-bold' : 'text-stone-400 font-medium'}`}
  >
    <TrendingUp className="w-5 h-5" />
    <span className="text-[10px]">Início</span>
  </button>

  {/* 2. Agenda */}
  <button 
    onClick={() => setActiveTab('agendamentos')}
    className={`flex flex-col items-center space-y-1 transition-colors ${activeTab === 'agendamentos' ? 'text-stone-900 font-bold' : 'text-stone-400 font-medium'}`}
  >
    <Calendar className="w-5 h-5" />
    <span className="text-[10px]">Agenda</span>
  </button>

  {/* 3. BOTÃO CENTRAL DESTAQUE (Abre o Menu / Substitui o Drawer do topo) */}
  <div className="relative -top-3">
    <button 
      onClick={() => setMobileMenuOpen(true)}
      className="w-12 h-12 bg-stone-900 text-white rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform border-4 border-white cursor-pointer"
      aria-label="Abrir Menu de Acesso Rápido"
    >
      <Menu className="w-5 h-5" />
    </button>
  </div>

  {/* 4. Clientes */}
  <button 
    onClick={() => setActiveTab('clientes')}
    className={`flex flex-col items-center space-y-1 transition-colors ${activeTab === 'clientes' ? 'text-stone-900 font-bold' : 'text-stone-400 font-medium'}`}
  >
    <Users className="w-5 h-5" />
    <span className="text-[10px]">Clientes</span>
  </button>

  {/* 5. Ajustes / Configurações */}
  <button 
    onClick={() => setActiveTab('configuracoes')}
    className={`flex flex-col items-center space-y-1 transition-colors ${activeTab === 'configuracoes' ? 'text-stone-900 font-bold' : 'text-stone-400 font-medium'}`}
  >
    <Settings className="w-5 h-5" />
    <span className="text-[10px]">Ajustes</span>
  </button>

</nav>

    </main>


{/* =========================================================
    MODAL BALÃO COMPLETO COM BICO LARGO E BORDA INTEGRADA
    ========================================================= */}
<AnimatePresence>
  {mobileMenuOpen && (
    <div className="fixed inset-0 z-50 flex md:hidden items-end justify-center pb-24 px-4">
      
      {/* Backdrop com fade-in */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => setMobileMenuOpen(false)}
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs"
      />

      {/* Conteúdo do Modal (Balão) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.5, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.5, y: 30 }}
        transition={{ type: "spring", damping: 22, stiffness: 320 }}
        style={{ transformOrigin: '50% 100%' }}
        className="relative w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl z-10 border border-stone-200"
      >
        
        {/* Cabeçalho compacto */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h3 className="text-xs font-extrabold text-stone-900">Menu de Acesso Rápido</h3>
            <p className="text-[10px] text-stone-500">Selecione uma opção</p>
          </div>
          <button 
            onClick={() => { setMobileMenuOpen(false); }}
            className="w-7 h-7 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center font-bold text-xs hover:bg-stone-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Grade de Botões com Scroll interno */}
        <div className="max-h-[60vh] overflow-y-auto space-y-4 pt-3 pr-1">
          <div className="grid grid-cols-2 gap-2.5">
            
            {/* 1. Visão Geral */}
            <button 
              onClick={() => { setActiveTab('visao-geral'); setMobileMenuOpen(false); }}
              className={`flex items-center space-x-2 p-3 rounded-xl border transition-all group active:scale-95 ${
                activeTab === 'visao-geral'
                  ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                  : 'bg-stone-50 hover:bg-stone-900 hover:text-white text-stone-800 border-stone-200/80'
              }`}
            >
              <div className={`p-2 rounded-lg shadow-xs transition-colors shrink-0 ${
                activeTab === 'visao-geral' ? 'bg-stone-800 text-white' : 'bg-white group-hover:bg-stone-800 text-stone-900 group-hover:text-white'
              }`}>
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-left leading-tight truncate">Visão Geral</span>
            </button>

            {/* 2. Agendamentos */}
            <button 
              onClick={() => { setActiveTab('agendamentos'); setMobileMenuOpen(false); }}
              className={`flex items-center space-x-2 p-3 rounded-xl border transition-all group active:scale-95 ${
                activeTab === 'agendamentos'
                  ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                  : 'bg-stone-50 hover:bg-stone-900 hover:text-white text-stone-800 border-stone-200/80'
              }`}
            >
              <div className={`p-2 rounded-lg shadow-xs transition-colors shrink-0 ${
                activeTab === 'agendamentos' ? 'bg-stone-800 text-white' : 'bg-white group-hover:bg-stone-800 text-stone-900 group-hover:text-white'
              }`}>
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-left leading-tight truncate">Agendamentos</span>
            </button>

            {/* 3. Clientes */}
            <button 
              onClick={() => { setActiveTab('clientes'); setMobileMenuOpen(false); }}
              className={`flex items-center space-x-2 p-3 rounded-xl border transition-all group active:scale-95 ${
                activeTab === 'clientes'
                  ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                  : 'bg-stone-50 hover:bg-stone-900 hover:text-white text-stone-800 border-stone-200/80'
              }`}
            >
              <div className={`p-2 rounded-lg shadow-xs transition-colors shrink-0 ${
                activeTab === 'clientes' ? 'bg-stone-800 text-white' : 'bg-white group-hover:bg-stone-800 text-stone-900 group-hover:text-white'
              }`}>
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-left leading-tight truncate">Clientes</span>
            </button>

            {/* 4. Financeiro */}
            <button 
              onClick={() => { setActiveTab('financeiro'); setMobileMenuOpen(false); }}
              className={`flex items-center space-x-2 p-3 rounded-xl border transition-all group active:scale-95 ${
                activeTab === 'financeiro'
                  ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                  : 'bg-stone-50 hover:bg-stone-900 hover:text-white text-stone-800 border-stone-200/80'
              }`}
            >
              <div className={`p-2 rounded-lg shadow-xs transition-colors shrink-0 ${
                activeTab === 'financeiro' ? 'bg-stone-800 text-white' : 'bg-white group-hover:bg-stone-800 text-stone-900 group-hover:text-white'
              }`}>
                <DollarSign className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-left leading-tight truncate">Financeiro</span>
            </button>

            {/* 5. Serviços e Equipe */}
            <button 
              onClick={() => { setActiveTab('servicos'); setMobileMenuOpen(false); }}
              className={`flex items-center space-x-2 p-3 rounded-xl border transition-all group active:scale-95 ${
                activeTab === 'servicos'
                  ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                  : 'bg-stone-50 hover:bg-stone-900 hover:text-white text-stone-800 border-stone-200/80'
              }`}
            >
              <div className={`p-2 rounded-lg shadow-xs transition-colors shrink-0 ${
                activeTab === 'servicos' ? 'bg-stone-800 text-white' : 'bg-white group-hover:bg-stone-800 text-stone-900 group-hover:text-white'
              }`}>
                <Scissors className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-left leading-tight truncate">Equipe & Serviços</span>
            </button>

            {/* 6. Comissões */}
            <button 
              onClick={() => { setActiveTab('comissoes'); setMobileMenuOpen(false); }}
              className={`flex items-center space-x-2 p-3 rounded-xl border transition-all group active:scale-95 ${
                activeTab === 'comissoes'
                  ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                  : 'bg-stone-50 hover:bg-stone-900 hover:text-white text-stone-800 border-stone-200/80'
              }`}
            >
              <div className={`p-2 rounded-lg shadow-xs transition-colors shrink-0 ${
                activeTab === 'comissoes' ? 'bg-stone-800 text-white' : 'bg-white group-hover:bg-stone-800 text-stone-900 group-hover:text-white'
              }`}>
                <Percent className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-left leading-tight truncate">Comissões</span>
            </button>

            {/* 7. Configurações (Ajustado para ocupar apenas 1 coluna igual aos outros) */}
            <button 
              onClick={() => { setActiveTab('configuracoes'); setMobileMenuOpen(false); }}
              className={`flex items-center space-x-2 p-3 rounded-xl border transition-all group active:scale-95 col-span-1 ${
                activeTab === 'configuracoes'
                  ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                  : 'bg-stone-50 hover:bg-stone-900 hover:text-white text-stone-800 border-stone-200/80'
              }`}
            >
              <div className={`p-2 rounded-lg shadow-xs transition-colors shrink-0 ${
                activeTab === 'configuracoes' ? 'bg-stone-800 text-white' : 'bg-white group-hover:bg-stone-800 text-stone-900 group-hover:text-white'
              }`}>
                <Settings className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-left leading-tight truncate">Configurações</span>
            </button>

          </div>
        </div>

        {/* =========================================================
            BICO LARGO COM BORDA ENVOLVENTE INTEGRADA (SVG)
            ========================================================= */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-36 h-7 z-20 pointer-events-none">
          <svg viewBox="0 0 100 24" className="w-full h-full drop-shadow-md fill-white stroke-stone-200" strokeWidth="2" preserveAspectRatio="none">
            <path d="M 5,0 C 35,0 42,22 50,24 C 58,22 65,0 95,0" />
          </svg>
        </div>

      </motion.div>

    </div>
  )}
</AnimatePresence>
{/* TELA DE BLOQUEIO / PAYWALL CASO O TESTE TENHA EXPIRADO */}
{assinaturaExpirada && !loading && modalAssinaturaOpen && (
  <div className="fixed inset-0 bg-stone-950/95 backdrop-blur-md z-50 overflow-y-auto pointer-events-auto">
    <div className="min-h-full flex items-center justify-center p-4 py-8">
      
      <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-stone-200 flex flex-col items-center text-center space-y-3 my-auto">
        
        {/* CABEÇALHO COM O CADEADO */}
        <div className="w-full flex flex-col items-center text-center space-y-2 pb-3 border-b border-stone-100">
          <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-inner mx-auto">
            <Lock className="w-5 h-5" />
          </div>
          <div className="w-full space-y-0.5 text-center">
            <h2 className="text-lg  font-extrabold text-stone-900 w-full text-center">Período de Teste Finalizado</h2>
            <p className="text-[11px] sm:text-xs text-stone-500 leading-relaxed w-full text-center px-2">
              Seus 7 dias gratuitos expiraram. Para liberar o acesso completo ao painel, efetue o pagamento abaixo.
            </p>
          </div>
        </div>

        {/* CARD DO PLANO */}
        <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 w-full text-center space-y-1">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Plano Mensal Gestor</span>
          <div className="flex justify-between items-center px-1">
            <span className="text-stone-700 text-xs font-medium">Acesso Completo</span>
            <span className="text-sm sm:text-base font-extrabold text-stone-900">R$ {valorAssinatura?.toFixed(2)} / mês</span>
          </div>
        </div>

        {/* ÁREA DOS BOTÕES E QR CODE */}
        <div className="w-full space-y-2.5 text-center">
          {pixDataMP ? (
            <div className="flex flex-col items-center justify-center space-y-1.5 w-full">
              <img src={`data:image/png;base64,${pixDataMP.qrCodeBase64}`} alt="QR Code Pix" className="w-32 h-32 sm:w-36 sm:h-36 border rounded-xl shadow-sm mx-auto" />
              <p className="text-[10px] sm:text-[11px] text-emerald-600 font-bold w-full text-center">Escaneie o QR Code para liberar o sistema instantaneamente!</p>
            </div>
          ) : (
            <button 
              onClick={() => gerarPixMercadoPago({
                transaction_amount: 9.90,
                description: 'Plano Mensal Gestor - Acesso Completo',
                payer_email: user?.email || 'diemersonlimabarbosa@gmail.com',
                payer_name: barbearia?.nome || 'Gestor'
              })}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              Gerar Pix de Pagamento
            </button>
          )}
        </div>

      </div>

    </div>
  </div>
)}
      {/* NOTIFICAÇÃO NO TOPO (TESTE OU ALERTA) */}
      {!assinaturaExpirada && barbearia?.status_assinatura !== 'ativo' && (
        <div className="bg-sky-600 text-white px-4 py-2 text-center text-xs font-bold flex items-center justify-center gap-2 shadow-sm z-40">
          <AlertCircle className="w-4 h-4" />
          <span>Seu período de testes gratuitos termina em {diasRestantes} {diasRestantes === 1 ? 'dia' : 'dias'}.</span>
          <button
            onClick={() => setModalAssinaturaOpen(true)}
            className="underline ml-2 hover:text-stone-200 transition-colors cursor-pointer"
          >
            Assinar via Mercado Pago agora
          </button>
        </div>
      )}

      <div className="flex flex-1">
        {/* BARRA LATERAL */}
        <aside className="w-64 bg-white border-r border-stone-200/80 p-6 flex flex-col justify-between hidden md:flex">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-stone-900 text-white flex items-center justify-center shadow-md">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-stone-900 text-base leading-none truncate max-w-[130px]" title={barbearia?.nome}>
                  {barbearia?.nome || 'Minha Barbearia'}
                </h1>
                <span className="text-xs text-stone-400 font-medium">Painel Gestor</span>
              </div>
            </div>

            <nav className="space-y-1.5">
              <button
                onClick={() => setActiveTab('agendamentos')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'agendamentos' ? 'bg-stone-900 text-white shadow-sm' : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <CalendarCheck className="w-4 h-4" /> Agendamentos
              </button>

              <button
                onClick={() => setActiveTab('clientes')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'clientes' ? 'bg-stone-900 text-white shadow-sm' : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Users className="w-4 h-4" /> Clientes Cadastrados
              </button>

              <button
                onClick={() => setActiveTab('financeiro')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'financeiro' ? 'bg-stone-900 text-white shadow-sm' : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <DollarSign className="w-4 h-4" /> Relatório Financeiro
              </button>

              <button
                onClick={() => setActiveTab('despesas')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'despesas' ? 'bg-stone-900 text-white shadow-sm' : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <TrendingDown className="w-4 h-4" /> Custos & Despesas
              </button>

              <button
                onClick={() => setActiveTab('servicos')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'servicos' ? 'bg-stone-900 text-white shadow-sm' : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Scissors className="w-4 h-4" /> Serviços & Equipe
              </button>


<button
  onClick={() => { setActiveTab('comissoes'); setMobileMenuOpen(false); }}
  className={`flex items-center space-x-3 w-full p-3 rounded-2xl transition-all ${
    activeTab === 'comissoes'
      ? 'bg-stone-900 text-white shadow-sm'
      : 'bg-stone-50 hover:bg-stone-100 text-stone-700'
  }`}
>
  <div className={`p-2 rounded-lg shadow-xs transition-colors ${
    activeTab === 'comissoes' ? 'bg-stone-800 text-white' : 'bg-white text-stone-700'
  }`}>
    <Percent className="w-4 h-4" />
  </div>
  <span className="text-xs font-bold text-left leading-tight">Comissões</span>
</button>


<button
  onClick={() => setActiveTab('configuracoes')}
  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
    activeTab === 'configuracoes' ? 'bg-stone-900 text-white shadow-sm' : 'text-stone-600 hover:bg-stone-100'
  }`}
>
  <Store className="w-4 h-4" /> Configurações
</button>


            </nav>
          </div>

          <div className="space-y-2 pt-4 border-t border-stone-100">
            <button
              onClick={() => setModalInfoAssinaturaOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-50 border border-sky-200 text-xs font-bold text-sky-800 hover:bg-sky-100 transition-all cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" /> {barbearia?.status_assinatura === 'ativo' ? 'Assinatura Ativa' : 'Assinar / Renovar'}
            </button>

            <button
              onClick={() => loadDashboardData(barbearia.id)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-medium text-stone-600 hover:bg-stone-50 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Atualizar Dados
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Sair do Sistema
            </button>
          </div>
        </aside>

        {/* CONTEÚDO PRINCIPAL */}
        <main className="flex-1 p-4 sm:p-6 md:p-10 pb-24 overflow-y-auto max-w-full">
          
          

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            
{activeTab === 'configuracoes' && (
            <div className="flex items-center gap-2">
              <a
                href={`/agendar/${barbearia?.slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium bg-white hover:bg-stone-50 text-stone-700 px-4 py-2.5 rounded-xl border border-stone-200 shadow-sm transition-all"
              >
                Link do Cliente ↗
              </a>
            </div>)}
          </div>

          {errorMessage && (
            <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500" /> {errorMessage}
            </div>
          )}

          {/* CARDS DE INDICADORES */}
          {activeTab === 'relatorio financeiro' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm">
              <div className="flex items-center justify-between text-stone-400 mb-3">
                <span className="text-xs font-medium uppercase tracking-wider">Faturamento</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-extrabold text-stone-900">R$ {totalFaturamento.toFixed(2)}</p>
              <span className="text-[11px] text-emerald-600 font-medium">Serviços finalizados</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm">
              <div className="flex items-center justify-between text-stone-400 mb-3">
                <span className="text-xs font-medium uppercase tracking-wider">Despesas</span>
                <TrendingDown className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-2xl font-extrabold text-stone-900">R$ {totalDespesas.toFixed(2)}</p>
              <span className="text-[11px] text-rose-600 font-medium">Custos cadastrados</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm">
              <div className="flex items-center justify-between text-stone-400 mb-3">
                <span className="text-xs font-medium uppercase tracking-wider">Lucro Líquido</span>
                <Wallet className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-2xl font-extrabold text-stone-900">R$ {lucroLiquido.toFixed(2)}</p>
              <span className="text-[11px] text-indigo-600 font-medium">Receita - Despesas</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm">
              <div className="flex items-center justify-between text-stone-400 mb-3">
                <span className="text-xs font-medium uppercase tracking-wider">Ticket Médio</span>
                <TrendingUp className="w-4 h-4 text-stone-600" />
              </div>
              <p className="text-2xl font-extrabold text-stone-900">R$ {ticketMedio}</p>
              <span className="text-[11px] text-stone-400 font-medium">Média por atendimento</span>
            </div>
          </div>

          )}

          {/* CONTEÚDO DAS ABAS */}
{/* CONTEÚDO DAS ABAS */}
{activeTab === 'agendamentos' && (
  <div className="space-y-4 pb-24">
    {/* =========================================================
        PAINEL DE CARDS DO DIA (Automático para Desktop e Mobile)
        ========================================================= */}
    <PainelAgendaDia 
      profissionalId={agendamentos[0]?.barbeiro_id || agendamentos[0]?.profissional_id} 
      taxaComissao={50}
      handleUpdateStatus={handleUpdateStatus}
    />
  </div>
)}
{activeTab === 'configuracoes' && (
  <ConfiguracoesBarbearia 
    barbearia={barbearia} 
    onUpdate={() => loadDashboardData(barbearia.id)} 
  />
)}







          {activeTab === 'clientes' && (
            <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm overflow-hidden p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100 mb-6">
                <div>
                  <h3 className="text-base font-bold text-stone-900">Clientes Cadastrados</h3>
                  <p className="text-xs text-stone-400">Histórico de pessoas que já agendaram na barbearia.</p>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou tel..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900 w-full sm:w-64"
                  />
                </div>
              </div>

              {clientesFiltrados.length === 0 ? (
                <div className="p-8 text-center text-stone-400 text-xs">Nenhum cliente encontrado.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clientesFiltrados.map((cli) => (
                    <div key={cli.id} className="bg-stone-50/70 p-4 rounded-2xl border border-stone-200/70 space-y-2">
                      <div className="font-bold text-stone-900 text-sm">{cli.nome}</div>
                      <div className="text-xs text-stone-500 flex items-center gap-1.5">
                        <span className="font-semibold text-stone-700">Tel:</span> {cli.telefone || 'Não informado'}
                      </div>
                      <div className="text-[11px] text-stone-400">Cadastrado em: {formatarData(cli)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'financeiro' && (
            <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm overflow-hidden p-6 space-y-6">
              <div className="pb-4 border-b border-stone-100">
                <h3 className="text-base font-bold text-stone-900">Relatório Financeiro Detalhado</h3>
                <p className="text-xs text-stone-400">Entradas provenientes de atendimentos concluídos.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                  <span className="text-xs text-emerald-700 font-semibold uppercase block mb-1">Total Entradas</span>
                  <span className="text-xl font-extrabold text-emerald-900">R$ {totalFaturamento.toFixed(2)}</span>
                </div>
                <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
                  <span className="text-xs text-rose-700 font-semibold uppercase block mb-1">Total Despesas</span>
                  <span className="text-xl font-extrabold text-rose-900">R$ {totalDespesas.toFixed(2)}</span>
                </div>
                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                  <span className="text-xs text-indigo-700 font-semibold uppercase block mb-1">Balanço Líquido</span>
                  <span className="text-xl font-extrabold text-indigo-900">R$ {lucroLiquido.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}


{activeTab === 'comissoes' && (
  <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm p-6 space-y-6">
    <div className="pb-4 border-b border-stone-100">
      <h3 className="text-base font-bold text-stone-900">Comissões dos Barbeiros</h3>
      <p className="text-xs text-stone-400">Defina a porcentagem de comissão padrão para cada profissional da unidade.</p>
    </div>

    {barbeiros.length === 0 ? (
      <div className="p-8 text-center text-stone-400 text-xs">
        Nenhum barbeiro cadastrado no momento para esta unidade.
      </div>
    ) : (
      <div className="space-y-3">
        {barbeiros
          .filter((barbeiro, index, self) => 
            index === self.findIndex(b => (b.id && b.id === barbeiro.id) || (b.nome && b.nome.toLowerCase() === barbeiro.nome.toLowerCase()))
          )
          .map((barbeiro) => {
            const valorAtual = barbeiro.comissao_padrao ?? 50;

            return (
              <div 
                key={barbeiro.id} 
                className="flex items-center justify-between p-4 rounded-2xl border border-stone-100 bg-stone-50/50"
              >
                <div>
                  <h4 className="text-xs font-bold text-stone-900">{barbeiro.nome}</h4>
                  <span className="text-[11px] text-stone-400">
                    Comissão atual: <strong className="text-emerald-600">{valorAtual}%</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    defaultValue={valorAtual}
                    id={`comissao-${barbeiro.id}`}
                    className="w-20 px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:outline-none"
                  />
             <button
  onClick={async () => {
    const inputReal = document.getElementById(`comissao-${barbeiro.id}`);
    const novaComissao = Number(inputReal.value);

    if (isNaN(novaComissao) || novaComissao < 0 || novaComissao > 100) {
      alert('Insira um valor entre 0 e 100.');
      return;
    }

    // Tenta atualizar diretamente pelo ID ou telefone/user_id sem travar na sessão
    const { data, error } = await supabase
      .from('barbeiros')
      .update({ 
        taxa_comissao: novaComissao, 
        comissao_padrao: novaComissao 
      })
      .eq('id', barbeiro.id)
      .select();

    if (error) {
      console.error('Erro detalhado do Supabase:', error);
      alert('Erro do Banco: ' + error.message);
    } else if (!data || data.length === 0) {
      // Fallback: se o id falhou, tenta atualizar usando o user_id ou slug
      const { data: data2, error: err2 } = await supabase
        .from('barbeiros')
        .update({ 
          taxa_comissao: novaComissao, 
          comissao_padrao: novaComissao 
        })
        .eq('user_id', barbeiro.user_id || '')
        .select();

      if (err2 || !data2 || data2.length === 0) {
        alert('Erro: O banco recusou a atualização. Verifique as políticas de RLS (Row Level Security) da tabela barbeiros no Supabase.');
      } else {
        alert('Comissão atualizada com sucesso!');
        setBarbeiros(prev => prev.map(b => b.user_id === barbeiro.user_id ? { ...b, taxa_comissao: novaComissao, comissao_padrao: novaComissao } : b));
      }
    } else {
      alert('Comissão atualizada com sucesso!');
      setBarbeiros(prev => prev.map(b => b.id === barbeiro.id ? { ...b, taxa_comissao: novaComissao, comissao_padrao: novaComissao } : b));
    }
  }}
  className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-bold rounded-xl active:scale-95 transition-transform"
>
  Salvar
</button>
                </div>
              </div>
            );
          })}
      </div>
    )}
  </div>
)}



          {activeTab === 'despesas' && (
            <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm overflow-hidden p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                <div>
                  <h3 className="text-base font-bold text-stone-900">Controle de Custos e Despesas</h3>
                  <p className="text-xs text-stone-400">Adicione os gastos operacionais da barbearia.</p>
                </div>
                <button
                  onClick={() => handleOpenDespesaModal()}
                  className="bg-stone-900 hover:bg-stone-800 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Nova Despesa
                </button>
              </div>

              {despesas.length === 0 ? (
                <div className="p-8 text-center text-stone-400 text-xs">Nenhuma despesa cadastrada.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse border-separate border-spacing-y-3">
                    <thead>
                      <tr className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                        <th className="p-3 pl-4">Descrição</th>
                        <th className="p-3">Data</th>
                        <th className="p-3">Valor</th>
                        <th className="p-3 pr-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs text-stone-700">
                      {despesas.map((d) => (
                        <tr key={d.id} className="bg-stone-50/70 hover:bg-stone-50 border border-stone-200/60 rounded-2xl overflow-hidden">
                          <td className="p-4 pl-5 font-medium text-stone-900 rounded-l-2xl">{d.descricao}</td>
                          <td className="p-4 text-stone-600">{formatarData(d)}</td>
                          <td className="p-4 font-bold text-rose-600">R$ {Number(d.valor).toFixed(2)}</td>
                          <td className="p-4 pr-5 text-right rounded-r-2xl">
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => handleOpenDespesaModal(d)} className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg cursor-pointer">
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDeleteDespesa(d.id)} className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'servicos' && (
            <div className="space-y-8">
              {/* Seção de Serviços */}
              <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm overflow-hidden p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                  <div>
                    <h3 className="text-base font-bold text-stone-900">Serviços Oferecidos</h3>
                    <p className="text-xs text-stone-400">Configure cortes, barbas e valores.</p>
                  </div>
                  <button
                    onClick={() => handleOpenServicoModal()}
                    className="bg-stone-900 hover:bg-stone-800 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Novo Serviço
                  </button>
                </div>

                {servicos.length === 0 ? (
                  <div className="p-8 text-center text-stone-400 text-xs">Nenhum serviço cadastrado.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {servicos.map((s) => (
                      <div key={s.id} className="bg-stone-50/70 p-4 rounded-2xl border border-stone-200/70 flex justify-between items-start">
                        <div className="space-y-1">
                          <h4 className="font-bold text-stone-900 text-sm">{s.nome}</h4>
                          <span className="text-xs text-stone-500 block font-medium">R$ {Number(s.preco).toFixed(2)}</span>
                          <span className="text-[11px] text-stone-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {s.duracao_minutos} min
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleOpenServicoModal(s)} className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg cursor-pointer">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteServico(s.id)} className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Seção de Barbeiros / Equipe */}
              <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm overflow-hidden p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                  <div>
                    <h3 className="text-base font-bold text-stone-900">Equipe de Barbeiros</h3>
                    <p className="text-xs text-stone-400">Profissionais disponíveis para agendamento.</p>
                  </div>
                  <button
                    onClick={() => handleOpenBarbeiroModal()}
                    className="bg-stone-900 hover:bg-stone-800 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Novo Barbeiro
                  </button>
                </div>

                {barbeiros.length === 0 ? (
                  <div className="p-8 text-center text-stone-400 text-xs">Nenhum barbeiro cadastrado.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {barbeiros.map((b) => (
                      <div key={b.id} className="bg-stone-50/70 p-4 rounded-2xl border border-stone-200/80 space-y-3">
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <h4 className="font-bold text-stone-900 text-sm">{b.nome}</h4>
        <span className="text-xs text-stone-500 block">{b.especialidade || 'Especialidade não definida'}</span>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => handleOpenBarbeiroModal(b)} className="p-1.5 bg-white border border-stone-200 rounded-xl hover:bg-stone-100">
          <Edit className="w-3.5 h-3.5 text-stone-700" />
        </button>
        <button onClick={() => handleDeleteBarbeiro(b.id)} className="p-1.5 bg-white border border-stone-200 rounded-xl hover:bg-red-50 text-red-500">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    {/* Campos de Acesso */}
    <div className="pt-3 border-t border-stone-200/60 space-y-2">
      <p className="text-[11px] font-bold text-stone-700">Acesso ao Painel</p>
      <input 
        type="email" 
        placeholder="E-mail de acesso" 
        id={`email-${b.id}`}
        className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none"
      />
      <input 
        type="password" 
        placeholder="Senha temporária" 
        id={`senha-${b.id}`}
        className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none"
      />
      <button
        onClick={() => {
          const emailInput = document.getElementById(`email-${b.id}`).value;
          const senhaInput = document.getElementById(`senha-${b.id}`).value;

          if (!emailInput || !senhaInput) {
            alert('Preencha o e-mail e a senha.');
            return;
          }

          criarAcessoBarbeiro(b.id, emailInput, senhaInput);
        }}
        className="w-full py-1.5 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition-colors"
      >
        Gerar Acesso
      </button>
    </div>
  </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Modal de Detalhes da Assinatura */}
      {!loading &&modalInfoAssinaturaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 relative space-y-6">
            
            <button 
              onClick={() => setModalInfoAssinaturaOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              ✕
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center text-2xl font-bold">
                ✓
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Minha Assinatura</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 mt-1">
                  • {barbearia?.status_assinatura ? barbearia.status_assinatura.toUpperCase() : 'ATIVO'}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3 border border-slate-100 dark:border-slate-800 text-sm">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400">Plano Atual:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">Plano Mensal Gestor</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400">Valor:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">R$ 9,90 / mês</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400">Data de Início:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {barbearia?.data_inicio_assinatura 
                    ? new Date(barbearia.data_inicio_assinatura).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) 
                    : 'N/A'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Próximo Vencimento:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {barbearia?.data_vencimento 
                    ? new Date(barbearia.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) 
                    : 'N/A'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setModalInfoAssinaturaOpen(false)}
                className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-semibold py-2.5 rounded-xl shadow transition duration-200"
              >
                Entendido
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL DE CHECKOUT DO MERCADO PAGO */}
      {assinaturaExpirada && !loading && (
        <div className="fixed inset-0 bg-white backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-stone-200 space-y-6">
            <div className="flex justify-between items-center">
              {/* TOPO DO MODAL COM O AVISO DE TESTE EXPIRADO */}
<div className="text-center space-y-2 border-b border-stone-100 pb-4">
  <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner mb-2">
    <Lock className="w-6 h-6" />
  </div>
  <h2 className="text-xl font-extrabold text-stone-900">Período de Teste Finalizado</h2>
  <p className="text-xs text-stone-500 leading-relaxed max-w-sm mx-auto">
    Seus 7 dias gratuitos expiraram. Para liberar o acesso completo ao painel e continuar utilizando os serviços, efetue o pagamento abaixo.
  </p>
</div>
            </div>
            
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex justify-between items-center">
              <div>
                <span className="text-[11px] font-semibold text-stone-400 uppercase block">Plano Mensal Gestor</span>
                <span className="text-base font-bold text-stone-900">Acesso Completo</span>
              </div>
              <span className="text-xl font-extrabold text-stone-900">R$ {valorAssinatura?.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-stone-100 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setMetodoPagamento('pix')}
                className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${metodoPagamento === 'pix' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
              >
                Pix Instantâneo
              </button>
              <button
                type="button"
                onClick={() => setMetodoPagamento('credito')}
                className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${metodoPagamento === 'credito' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
              >
                Cartão Crédito
              </button>
              <button
                type="button"
                onClick={() => setMetodoPagamento('debito')}
                className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${metodoPagamento === 'debito' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
              >
                Cartão Débito
              </button>
            </div>

            {metodoPagamento === 'pix' && (
              <div className="space-y-4 text-center py-2">
                {pixDataMP.qrCodeBase64 ? (
                  <div className="space-y-3">
                    <div className="bg-white p-3 inline-block rounded-2xl border border-stone-200 shadow-inner">
                      <img
                        src={`data:image/png;base64,${pixDataMP.qrCodeBase64}`}
                        alt="QR Code Pix Mercado Pago"
                        className="w-48 h-48 mx-auto object-contain"
                      />
                    </div>
                    <p className="text-xs text-stone-500">Escaneie o QR Code acima com o aplicativo do seu banco</p>
                  </div>
                ) : (
                  <div className="py-8 flex flex-col items-center justify-center gap-2 text-stone-400">
                    <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs">Gerando Pix seguro via Mercado Pago...</span>
                  </div>
                )}

                {pixDataMP.copiaECola && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={pixDataMP.copiaECola}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-600 focus:outline-none"
                      />
                      <button
                        onClick={copiarChavePix}
                        className="bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
                      >
                        {copiado ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        {copiado ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleProcessarPagamentoMercadoPago}
                  disabled={processandoPagamento}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded-xl transition duration-200 text-xs shadow-md cursor-pointer disabled:opacity-50"
                >
                  {processandoPagamento ? 'Verificando Pagamento...' : 'Já fiz o pagamento / Ativar Assinatura'}
                </button>
              </div>
            )}

            {(metodoPagamento === 'credito' || metodoPagamento === 'debito') && (
              <form onSubmit={handleProcessarPagamentoMercadoPago} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-600">Número do Cartão</label>
                  <input
                    type="text"
                    placeholder="0000 0000 0000 0000"
                    value={dadosCartao.numero}
                    onChange={(e) => setDadosCartao({ ...dadosCartao, numero: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-600">Nome impresso no Cartão</label>
                  <input
                    type="text"
                    placeholder="NOME COMO NO CARTÃO"
                    value={dadosCartao.nome}
                    onChange={(e) => setDadosCartao({ ...dadosCartao, nome: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-600">Validade</label>
                    <input
                      type="text"
                      placeholder="MM/AA"
                      value={dadosCartao.validade}
                      onChange={(e) => setDadosCartao({ ...dadosCartao, validade: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-600">CVV</label>
                    <input
                      type="password"
                      placeholder="123"
                      maxLength={4}
                      value={dadosCartao.cvv}
                      onChange={(e) => setDadosCartao({ ...dadosCartao, cvv: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={processandoPagamento}
                  className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3 rounded-xl transition duration-200 text-xs shadow-md cursor-pointer disabled:opacity-50 mt-2"
                >
                  {processandoPagamento ? 'Processando Pagamento...' : `Pagar R$ ${valorAssinatura.toFixed(2)}`}
                </button>
              </form>
            )}

          </div>
        </div>
      )}

      {/* MODAL DE SERVIÇOS */}
      {modalServicoOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-stone-200 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-stone-900 text-lg">{editingServico ? 'Editar Serviço' : 'Novo Serviço'}</h3>
              <button onClick={() => setModalServicoOpen(false)} className="p-1 text-stone-400 hover:text-stone-600 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveServico} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-600">Nome do Serviço</label>
                <input
                  type="text"
                  placeholder="Ex: Corte Degradê"
                  value={formServico.nome}
                  onChange={(e) => setFormServico({ ...formServico, nome: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-600">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="35.00"
                    value={formServico.preco}
                    onChange={(e) => setFormServico({ ...formServico, preco: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-600">Duração (minutos)</label>
                  <input
                    type="number"
                    placeholder="30"
                    value={formServico.duracao_minutos}
                    onChange={(e) => setFormServico({ ...formServico, duracao_minutos: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900"
                    required
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3 rounded-xl transition duration-200 text-xs shadow-md cursor-pointer mt-2">
                Salvar Serviço
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE BARBEIROS */}
      {modalBarbeiroOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-stone-200 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-stone-900 text-lg">{editingBarbeiro ? 'Editar Barbeiro' : 'Novo Barbeiro'}</h3>
              <button onClick={() => setModalBarbeiroOpen(false)} className="p-1 text-stone-400 hover:text-stone-600 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveBarbeiro} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-600">Nome do Profissional</label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Silva"
                  value={formBarbeiro.nome}
                  onChange={(e) => setFormBarbeiro({ ...formBarbeiro, nome: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-600">Especialidade</label>
                <input
                  type="text"
                  placeholder="Ex: Barba e Corte Clássico"
                  value={formBarbeiro.especialidade}
                  onChange={(e) => setFormBarbeiro({ ...formBarbeiro, especialidade: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>
              <button type="submit" className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3 rounded-xl transition duration-200 text-xs shadow-md cursor-pointer mt-2">
                Salvar Barbeiro
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE DESPESAS */}
      {modalDespesaOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-stone-200 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-stone-900 text-lg">{editingDespesa ? 'Editar Despesa' : 'Nova Despesa'}</h3>
              <button onClick={() => setModalDespesaOpen(false)} className="p-1 text-stone-400 hover:text-stone-600 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveDespesa} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-600">Descrição do Gasto</label>
                <input
                  type="text"
                  placeholder="Ex: Compra de Lâminas / Energia"
                  value={formDespesa.descricao}
                  onChange={(e) => setFormDespesa({ ...formDespesa, descricao: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-600">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="150.00"
                    value={formDespesa.valor}
                    onChange={(e) => setFormDespesa({ ...formDespesa, valor: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-600">Data</label>
                  <input
                    type="date"
                    value={formDespesa.data}
                    onChange={(e) => setFormDespesa({ ...formDespesa, data: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900"
                    required
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3 rounded-xl transition duration-200 text-xs shadow-md cursor-pointer mt-2">
                Salvar Despesa
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}