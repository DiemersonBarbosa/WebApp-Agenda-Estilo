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
  Check
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('agendamentos');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

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
  const verificarStatusAssinatura = (barbData) => {
    if (!barbData.created_at) return;

    const dataCriacao = new Date(barbData.created_at);
    const hoje = new Date();
    const diferencaEmMilissegundos = hoje - dataCriacao;
    const diasPassados = Math.floor(diferencaEmMilissegundos / (1000 * 60 * 60 * 24));
    const restante = 7 - diasPassados;

    if (barbData.status_assinatura === 'ativo') {
      setAssinaturaExpirada(false);
      setDiasRestantes(999);
    } else if (restante <= 0 || barbData.status_assinatura === 'vencido') {
      setDiasRestantes(0);
      setAssinaturaExpirada(true);
    } else {
      setDiasRestantes(restante);
      setAssinaturaExpirada(false);
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
      // Adicionado para buscar o status da assinatura da barbearia:
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

    // --- VERIFICAÇÃO COM OS NOMES EXATOS DAS COLUNAS DO SUPABASE ---
    const dataVencimentoStr = dadosBarbearia?.data_vencimento;
    const status = dadosBarbearia?.status_assinatura;
    
    const hoje = new Date();
    const dataExpiracao = dataVencimentoStr ? new Date(dataVencimentoStr) : null;

    // Se não houver data, se a data já passou, ou se o status não for 'ativo', abre o modal
    const estaVencida = !dataExpiracao || dataExpiracao < hoje || status !== 'ativo';

    if (estaVencida) {
      setModalAssinaturaOpen(true);
    } else {
      setModalAssinaturaOpen(false); // Mantém fechado porque a data e o status estão corretos!
    }

    // ... restante do seu código para definir os estados (setAgendamentos, setClientes, etc.) ...

  } catch (err) {
    setErrorMessage(err.message);
  } finally {
    setLoading(false);
  }
}, [supabase]);

  // Gerar Pix dinâmico Oficial via API do Mercado Pago
  const gerarPixMercadoPago = useCallback(async (paymentData) => {
    try {
      // Garante que o valor seja enviado no formato correto (ex: 9.90)
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
        console.error('Detalhes do erro da API:', data);
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

          // Se o pagamento for aprovado pelo Mercado Pago
          if (res.ok && data.status === 'approved') {
            clearInterval(intervalId);
            
            // Aqui você pode atualizar o Supabase para liberar o acesso se ainda não foi feito,
            // ou redirecionar direto para o painel
            alert('Pagamento aprovado com sucesso! Redirecionando...');
            router.push('/admin'); // Altere para a rota correta do seu painel
          }
        } catch (err) {
          console.error('Erro ao verificar status automático:', err);
        }
      }, 5000); // Roda a cada 5 segundos
    }

    // Limpa o temporizador quando o modal fecha ou o componente desmonta
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [modalAssinaturaOpen, metodoPagamento, pixDataMP?.paymentId, router]);

  // Sempre que abrir o modal ou alternar para o Pix, gera a cobrança apenas se já não houver um Pix ativo
  useEffect(() => {
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

        // --- PAGAMENTO APROVADO: Atualiza o Supabase e libera o acesso ---
        if (barbearia?.id) {
          const dataExpiracao = new Date();
          dataExpiracao.setMonth(dataExpiracao.getMonth() + 1); // Adiciona 1 mês de acesso

          await supabase
            .from('barbearias') // Ajuste para o nome da sua tabela de barbearias/assinaturas se necessário
            .update({ 
              status_assinatura: 'ativo', 
              assinatura_expira_em: dataExpiracao.toISOString(),
              ultimo_payment_id: pixDataMP.paymentId 
            })
            .eq('id', barbearia.id);
        }

        alert('Pagamento aprovado com sucesso! Acesso liberado.');
        setModalAssinaturaOpen(false);
        router.push('/admin'); // Ou recarrega os dados do painel
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
    <div className="min-h-screen bg-stone-100 text-stone-800 flex flex-col font-sans relative">

      {/* TELA DE BLOQUEIO / PAYWALL CASO O TESTE TENHA EXPIRADO */}
      {assinaturaExpirada && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-stone-200 text-center space-y-6">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-stone-900">Período de Teste Finalizado</h2>
              <p className="text-xs text-stone-500 leading-relaxed">
                Seus 7 dias gratuitos de testes expiraram. Para continuar aproveitando todas as ferramentas de agendamento e controle financeiro, regularize sua assinatura mensal via Mercado Pago.
              </p>
            </div>

            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-left space-y-2">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Plano Mensal Gestor (Mercado Pago)</span>
              <div className="flex justify-between items-center">
                <span className="text-stone-700 text-xs font-medium">Acesso Completo ao Sistema</span>
                <span className="text-lg font-extrabold text-stone-900">R$ {valorAssinatura.toFixed(2)} / mês</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => setModalAssinaturaOpen(true)}
                className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" /> Pagar com Mercado Pago
              </button>
              <button
                onClick={handleLogout}
                className="w-full py-2.5 bg-transparent hover:bg-stone-100 text-stone-500 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Sair do Sistema
              </button>
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
            </nav>
          </div>

          <div className="space-y-2 pt-4 border-t border-stone-100">
            <button
              onClick={() => {
  // Se a assinatura estiver ativa, em vez de abrir o Pix, você pode mostrar um alerta ou um modal de "Gerenciar Plano"
  alert(`Sua assinatura está ativa até: ${new Date(barbearia?.data_vencimento).toLocaleDateString('pt-BR')}`);
}}
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
        <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto max-w-full">
          
          {/* NAVEGAÇÃO MOBILE */}
          <div className="flex md:hidden overflow-x-auto gap-2 pb-3 mb-6 no-scrollbar border-b border-stone-200">
            <button onClick={() => setActiveTab('agendamentos')} className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap ${activeTab === 'agendamentos' ? 'bg-stone-900 text-white' : 'bg-white text-stone-600 border border-stone-200'}`}>Agendamentos</button>
            <button onClick={() => setActiveTab('clientes')} className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap ${activeTab === 'clientes' ? 'bg-stone-900 text-white' : 'bg-white text-stone-600 border border-stone-200'}`}>Clientes</button>
            <button onClick={() => setActiveTab('financeiro')} className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap ${activeTab === 'financeiro' ? 'bg-stone-900 text-white' : 'bg-white text-stone-600 border border-stone-200'}`}>Financeiro</button>
            <button onClick={() => setActiveTab('despesas')} className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap ${activeTab === 'despesas' ? 'bg-stone-900 text-white' : 'bg-white text-stone-600 border border-stone-200'}`}>Despesas</button>
            <button onClick={() => setActiveTab('servicos')} className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap ${activeTab === 'servicos' ? 'bg-stone-900 text-white' : 'bg-white text-stone-600 border border-stone-200'}`}>Serviços & Equipe</button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900">Visão Geral - {barbearia?.nome}</h2>
              <p className="text-xs text-stone-500 mt-0.5">Gerencie atendimentos, clientes e faturamento da sua unidade.</p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`/agendar/${barbearia?.slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium bg-white hover:bg-stone-50 text-stone-700 px-4 py-2.5 rounded-xl border border-stone-200 shadow-sm transition-all"
              >
                Link do Cliente ↗
              </a>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500" /> {errorMessage}
            </div>
          )}

          {/* CARDS DE INDICADORES */}
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

          {/* CONTEÚDO DAS ABAS */}
          {activeTab === 'agendamentos' && (
            <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm overflow-hidden p-6">
              <div className="pb-4 border-b border-stone-100 mb-6">
                <h3 className="text-base font-bold text-stone-900">Lista de Agendamentos</h3>
                <p className="text-xs text-stone-400">Gerencie e altere os status das consultas marcadas.</p>
              </div>

              {agendamentos.length === 0 ? (
                <div className="p-8 text-center text-stone-400 text-xs">
                  Nenhum agendamento encontrado para esta barbearia.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse border-separate border-spacing-y-3">
                    <thead>
                      <tr className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                        <th className="p-3 pl-4">Cliente</th>
                        <th className="p-3">Serviço</th>
                        <th className="p-3">Barbeiro</th>
                        <th className="p-3">Data/Hora</th>
                        <th className="p-3">Valor</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 pr-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs text-stone-700">
                      {agendamentos.map((item) => (
                        <tr key={item.id} className="bg-stone-50/70 hover:bg-stone-50 border border-stone-200/60 shadow-xs transition-colors rounded-2xl overflow-hidden">
                          <td className="p-4 pl-5 font-medium text-stone-900 rounded-l-2xl">
                            <div>{item.clientes?.nome || 'Cliente Não Informado'}</div>
                            <div className="text-[11px] text-stone-400">{item.clientes?.telefone || '-'}</div>
                          </td>
                          <td className="p-4 font-semibold text-stone-800">{item.servicos?.nome || 'Serviço'}</td>
                          <td className="p-4 text-stone-600">{item.barbeiros?.nome || 'Profissional'}</td>
                          <td className="p-4 text-stone-700 font-medium">
                            <div>{formatarData(item)}</div>
                            <div className="text-[11px] text-stone-400">{formatarHora(item)}</div>
                          </td>
                          <td className="p-4 font-bold text-stone-900">R$ {item.valor_total}</td>
                          <td className="p-4">
                            {item.status === 'agendado' && <span className="bg-amber-50 text-amber-700 border border-amber-200/60 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase">Agendado</span>}
                            {item.status === 'concluido' && <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase">Concluído</span>}
                            {item.status === 'cancelado' && <span className="bg-rose-50 text-rose-700 border border-rose-200/60 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase">Cancelado</span>}
                          </td>
                          <td className="p-4 pr-5 text-right rounded-r-2xl">
                            <div className="flex items-center justify-end gap-1.5">
                              {item.status === 'agendado' && (
                                <>
                                  <button onClick={() => handleUpdateStatus(item.id, 'concluido')} title="Marcar como Concluído" className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors border border-emerald-200/60 cursor-pointer">
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleUpdateStatus(item.id, 'cancelado')} title="Cancelar Agendamento" className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors border border-rose-200/60 cursor-pointer">
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
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
                      <div key={b.id} className="bg-stone-50/70 p-4 rounded-2xl border border-stone-200/70 flex justify-between items-start">
                        <div className="space-y-1">
                          <h4 className="font-bold text-stone-900 text-sm">{b.nome}</h4>
                          <span className="text-xs text-stone-500 block">{b.especialidade || 'Especialista em cortes'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleOpenBarbeiroModal(b)} className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg cursor-pointer">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteBarbeiro(b.id)} className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* MODAL DE CHECKOUT DO MERCADO PAGO */}
      {modalAssinaturaOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-stone-200 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-stone-900 text-lg flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-sky-500 inline-block"></span> Mercado Pago Checkout
                </h3>
                <p className="text-xs text-stone-400">Escolha a forma de pagamento para regularizar sua assinatura.</p>
              </div>
              <button onClick={() => setModalAssinaturaOpen(false)} className="p-1 text-stone-400 hover:text-stone-600 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex justify-between items-center">
              <div>
                <span className="text-[11px] font-semibold text-stone-400 uppercase block">Plano Mensal Gestor</span>
                <span className="text-base font-bold text-stone-900">Acesso Completo</span>
              </div>
              <span className="text-xl font-extrabold text-stone-900">R$ {valorAssinatura?.toFixed(2)}</span>
            </div>

            {/* Abas de Método de Pagamento */}
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

            {/* Conteúdo do Método Pix */}
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

            {/* Conteúdo do Cartão (Crédito / Débito) */}
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