'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Percent,
  ClipboardPenLine,
  BadgePercent,
  MessageCircleCheck,
  ShoppingCart,
  ShoppingBag,
  Award,
  Mail,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Phone
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

import ConfiguracoesBarbearia from '@/components/ConfiguracoesBarbearia';
import PainelAgendaDia from '@/components/PainelAgendaDia';

import RelatoriosPage from './relatorios'; 
import PdvScreen from '@/components/PdvScreen'; 
import ProdutosScreen from '@/components/ProdutosScreen';
import NotificacoesBell from '@/components/NotificacoesBell'; 
import AdminModoAgendamento from '@/components/AdminModoAgendamento';
import FidelizacaoAdmin from '@/components/FidelizacaoAdmin';

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

/* COMPONENTE DE LOGIN E CADASTRO ATUALIZADO */
function AuthForm({ onAuthSuccess }) {
  const searchParams = useSearchParams();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nomeBarbearia, setNomeBarbearia] = useState('');
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (searchParams?.get('mode') === 'register') {
      setIsRegister(true);
    }
  }, [searchParams]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isRegister) {
        if (!nomeBarbearia.trim()) {
          throw new Error('Por favor, informe o nome do seu estabelecimento.');
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError) throw authError;

        if (authData.user) {
          const { error: barbError } = await supabase.from('barbearias').insert([
            {
              user_id: authData.user.id,
              nome: nomeBarbearia,
              telefone: telefone,
              status_assinatura: 'teste',
            },
          ]);

          if (barbError) throw barbError;
          if (onAuthSuccess) onAuthSuccess();
        }
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (loginError) throw loginError;
        if (onAuthSuccess) onAuthSuccess();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Ocorreu um erro ao processar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f4f6] flex flex-col justify-center items-center p-4 sm:p-6 font-sans select-none">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] border border-stone-200/80 p-6 sm:p-10 shadow-2xl space-y-8 relative overflow-hidden">
        
        {/* LOGOTIPO DA MARCA */}
        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <div className="bg-stone-50/80 p-4 rounded-3xl border border-stone-100 shadow-xs w-full flex items-center justify-center">
            <img 
              src="/images/logo.png" 
              alt="Logo AgendaEstilo" 
              className="h-14 sm:h-16 w-auto object-contain transition-transform hover:scale-105 duration-300"
            />
          </div>
          <p className="text-xs text-stone-500 font-medium">
            {isRegister 
              ? 'Preencha os dados da sua empresa' 
              : 'Entre com suas credenciais de acesso'}
          </p>
        </div>

        {/* ALTERNADOR DE ABAS (ENTRAR / CRIAR CONTA) */}
        <div className="grid grid-cols-2 gap-1.5 bg-stone-100 p-1.5 rounded-2xl border border-stone-200/60">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setErrorMsg(''); }}
            className={`py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
              !isRegister 
                ? 'bg-stone-900 text-white shadow-md' 
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setErrorMsg(''); }}
            className={`py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
              isRegister 
                ? 'bg-stone-900 text-white shadow-md' 
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Cadastrar
          </button>
        </div>

        {/* MENSAGEM DE ERRO */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-xs font-semibold text-center">
            {errorMsg}
          </div>
        )}

        {/* FORMULÁRIO */}
        <form onSubmit={handleAuth} className="space-y-4">
          {isRegister && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Nome da Barbearia</label>
                <div className="relative">
                  <Store className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Barbearia Navalha de Ouro"
                    value={nomeBarbearia}
                    onChange={(e) => setNomeBarbearia(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Telefone / WhatsApp</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 font-medium"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700">E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700">Senha</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#111111] hover:bg-stone-800 text-white text-xs font-extrabold rounded-2xl shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 mt-4 uppercase tracking-wider"
          >
            <span>{loading ? 'Aguarde...' : isRegister ? 'Criar Conta e Cadastrar' : 'Entrar no Painel'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {isRegister && (
          <div className="pt-3 border-t border-stone-100 space-y-2 text-[11px] text-stone-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>7 dias de teste grátis sem compromisso</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Acesso instantâneo ao painel completo</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 text-center text-xs text-stone-400 font-medium">
        <p>© 2026 Todos os direitos reservados.</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('agendamentos');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  const [produtos, setProdutos] = useState([]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [activeTab]);

  async function carregarProdutos(barbeariaId) {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('barbearia_id', barbeariaId);
    
    if (!error && data) {
      setProdutos(data);
    }
  }

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [barbearia, setBarbearia] = useState(null);

  const [diasRestantes, setDiasRestantes] = useState(7);
  const [assinaturaExpirada, setAssinaturaExpirada] = useState(false);
  const [modalAssinaturaOpen, setModalAssinaturaOpen] = useState(false);
  const [processandoPagamento, setProcessandoPagamento] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const [barbeiroParaEditar, setBarbeiroParaEditar] = useState(null);
  const [metodoPagamento, setMetodoPagamento] = useState('pix');

  const fecharMenuMobile = () => {
    const barraAntiga = document.querySelector('nav[aria-label="Navegação inferior mobile"]');
    if (barraAntiga) {
      barraAntiga.style.transition = 'none';
      barraAntiga.style.opacity = '1';
    }
    setMobileMenuOpen(false);
  };

  const [pixDataMP, setPixDataMP] = useState({
    qrCodeBase64: '',
    copiaECola: '',
    paymentId: null
  });

  const [dadosCartao, setDadosCartao] = useState({
    numero: '',
    nome: '',
    validade: '',
    cvv: '',
    parcelas: '1'
  });

  const valorAssinatura = 9.90;

  const [agendamentos, setAgendamentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [barbeiros, setBarbeiros] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [despesas, setDespesas] = useState([]);

  useEffect(() => {
    console.log("Agendamentos carregados:", agendamentos);
  }, [agendamentos]);

  const [searchTerm, setSearchTerm] = useState('');

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

  const [aberturaManual, setAberturaManual] = useState(false);

  const abrirModalAssinaturaManual = () => {
    setAberturaManual(true);
    setModalAssinaturaOpen(true);
    if (!pixDataMP?.paymentId) {
      gerarPixMercadoPago({
        transaction_amount: 9.90,
        description: 'Plano Mensal Gestor - Acesso Completo',
        payer_email: user?.email || 'diemersonlimabarbosa@gmail.com',
        payer_name: barbearia?.nome || 'Gestor'
      });
    }
  };

  const verificarStatusAssinatura = (dadosBarbearia) => {
    if (!dadosBarbearia) return;

    const status = dadosBarbearia?.status_assinatura?.trim().toLowerCase();

    if (status === 'ativo') {
      setModalAssinaturaOpen(false);
      setAssinaturaExpirada(false);
      return;
    }

    const dataCriacaoStr = dadosBarbearia?.created_at;
    if (dataCriacaoStr) {
      const dataCriacao = new Date(dataCriacaoStr);
      const hoje = new Date();
      
      dataCriacao.setHours(0, 0, 0, 0);
      hoje.setHours(0, 0, 0, 0);

      const diferencaEmMilissegundos = hoje - dataCriacao;
      const diasPassados = Math.floor(diferencaEmMilissegundos / (1000 * 60 * 60 * 24));
      const restante = Math.max(0, 7 - diasPassados);

      if (typeof setDiasRestantes === 'function') {
        setDiasRestantes(restante);
      }

      if (restante <= 0 && status !== 'ativo') {
        setModalAssinaturaOpen(true);
        setAssinaturaExpirada(true);
      } else {
        setModalAssinaturaOpen(false);
        setAssinaturaExpirada(false);
      }
    } else {
      setModalAssinaturaOpen(true);
      setAssinaturaExpirada(true);
    }
  };

  const loadDashboardData = useCallback(async (barbeariaId) => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const [resAgendamentos, resClientes, resBarbeiros, resServicos, resDespesas, resBarbearia] = await Promise.all([
        supabase.from('agendamentos').select('*, clientes(*), barbeiros(*), servicos(*)').eq('barbearia_id', barbeariaId).order('data_hora', { ascending: true }),
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

      if (dadosBarbearia) {
        verificarStatusAssinatura(dadosBarbearia);
      }

    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

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

  const checkAuthAndLoad = useCallback(async () => {
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      setUser(null);
      setLoading(false);
      return;
    }

    const { data: barbeiroCheck } = await supabase
      .from('barbeiros')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (barbeiroCheck) {
      router.push('/barbeiro');
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
  }, [router, loadDashboardData]);

  useEffect(() => {
    checkAuthAndLoad();
  }, [checkAuthAndLoad]);

  useEffect(() => {
    let intervalId;

    if (modalAssinaturaOpen && metodoPagamento === 'pix' && pixDataMP?.paymentId && !processandoPagamento) {
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
            handleProcessarPagamentoMercadoPago();
          }
        } catch (err) {
          console.error('Erro ao verificar status automático:', err);
        }
      }, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [modalAssinaturaOpen, metodoPagamento, pixDataMP?.paymentId, processandoPagamento]);

  useEffect(() => {
    if (aberturaManual) return;

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
          return;
        }
      }
    }

    if (modalAssinaturaOpen && metodoPagamento === 'pix' && !pixDataMP?.paymentId) {
      gerarPixMercadoPago({
        transaction_amount: 9.90,
        description: 'Plano Mensal Gestor - Acesso Completo',
        payer_email: user?.email || 'diemersonlimabarbosa@gmail.com',
        payer_name: barbearia?.nome || 'Gestor'
      });
    }
  }, [modalAssinaturaOpen, metodoPagamento, pixDataMP?.paymentId, gerarPixMercadoPago, user, barbearia, aberturaManual]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/admin/login');
  };

  const handleProcessarPagamentoMercadoPago = async (e) => {
    if (e) e.preventDefault();
    if (processandoPagamento) return;
    
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
          const dataInicio = new Date();
          const dataExpiracao = new Date();
          dataExpiracao.setMonth(dataExpiracao.getMonth() + 1);

          const novosDadosAssinatura = {
            status_assinatura: 'ativo',
            data_inicio_assinatura: dataInicio.toISOString().split('T')[0],
            data_vencimento: dataExpiracao.toISOString().split('T')[0]
          };

          const { data: updateData, error: updateError } = await supabase
            .from('barbearias')
            .update(novosDadosAssinatura)
            .eq('id', barbearia.id)
            .select();

          if (updateError) {
            throw new Error('Erro ao atualizar assinatura: ' + updateError.message);
          }

          if (!updateData || updateData.length === 0) {
            throw new Error('O Supabase não encontrou nenhuma barbearia com este ID para atualizar.');
          }

          setBarbearia(prev => ({ ...prev, ...novosDadosAssinatura }));
        }
        alert('Pagamento aprovado com sucesso! Acesso liberado.');
        setModalAssinaturaOpen(false);
        setAssinaturaExpirada(false);
        setProcessandoPagamento(false);
        
        loadDashboardData(barbearia.id);
      }
    } catch (err) {
      console.error('Erro ao processar pagamento:', err);
      alert(err.message);
      setProcessandoPagamento(false);
    }
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

  const copiarChavePix = () => {
    const codigoParaCopiar = pixDataMP?.copiaECola;

    if (!codigoParaCopiar) {
      alert('O código Pix ainda não está disponível.');
      return;
    }

    try {
      const textarea = document.createElement('textarea');
      textarea.value = codigoParaCopiar;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      
      textarea.focus();
      textarea.select();

      const sucesso = document.execCommand('copy');
      document.body.removeChild(textarea);

      if (sucesso) {
        setCopiado(true);
        setTimeout(() => setCopiado(false), 3000);
      } else {
        throw new Error('Falha');
      }
    } catch (err) {
      const inputElement = document.getElementById('input-copia-cola');
      if (inputElement) {
        inputElement.focus();
        inputElement.select();
      }
      alert('Não foi possível copiar automaticamente. Por favor, selecione e copie o código manualmente no campo.');
    }
  };

  const [modalServicoOpen, setModalServicoOpen] = useState(false);
  const [editingServico, setEditingServico] = useState(null);
  const [formServico, setFormServico] = useState({ nome: '', preco: '', duracao_minutos: 30 });

  const [modalBarbeiroOpen, setModalBarbeiroOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fotoUrl, setFotoUrl] = useState('');

  const [nome, setNome] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [taxaComissao, setTaxaComissao] = useState('');

  const handleUploadFoto = async (e) => {
    const arquivo = e.target.files[0];
    if (!arquivo) return;

    setUploading(true);
    try {
      const comprimidoBlob = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(arquivo);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target.result;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            const MAX_SIZE = 800;
            if (width > height) {
              if (width > MAX_SIZE) {
                height *= MAX_SIZE / width;
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width *= MAX_SIZE / height;
                height = MAX_SIZE;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
              (blob) => {
                resolve(blob);
              },
              'image/jpeg',
              0.8
            );
          };
          img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
      });

      const fileExt = 'jpg';
      const fileName = `barbeiro-${Math.random()}.${fileExt}`;
      const filePath = `barbeiros/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('barbearia-bucket')
        .upload(filePath, comprimidoBlob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: publicURLData } = supabase.storage
        .from('barbearia-bucket')
        .getPublicUrl(filePath);

      setFotoUrl(publicURLData.publicUrl);
    } catch (err) {
      console.error('Erro no upload:', err);
      alert('Erro ao enviar a imagem. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

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
      setBarbeiroParaEditar(barbeiro);
      setNome(barbeiro.nome || '');
      setEspecialidade(barbeiro.especialidade || '');
      setTaxaComissao(barbeiro.taxa_comissao || '');
      setFotoUrl(barbeiro.foto || '');
    } else {
      setBarbeiroParaEditar(null);
      setNome('');
      setEspecialidade('');
      setTaxaComissao('');
      setFotoUrl('');
    }
    setModalBarbeiroOpen(true);
  };

  const handleSaveBarbeiro = async (e) => {
    e.preventDefault();

    try {
      const dadosBarbeiro = {
        barbearia_id: barbearia?.id,
        nome,
        especialidade,
        taxa_comissao: Number(taxaComissao) || 0,
        foto: fotoUrl
      };

      if (barbeiroParaEditar?.id) {
        const { error } = await supabase
          .from('barbeiros')
          .update(dadosBarbeiro)
          .eq('id', barbeiroParaEditar.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('barbeiros')
          .insert([dadosBarbeiro]);
        if (error) throw error;
      }

      setModalBarbeiroOpen(false);
      loadDashboardData(barbearia.id);
      alert('Profissional salvo com sucesso!');
    } catch (err) {
      console.error('ERRO DETALHADO SUPABASE:', JSON.stringify(err, null, 2));
      alert('Erro ao salvar: ' + (err.message || JSON.stringify(err)));
    }
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

  /* RENDERIZAÇÃO DO FORMULÁRIO DE LOGIN/CADASTRO QUANDO NÃO HÁ USUÁRIO AUTENTICADO */
  if (!user) {
    return <AuthForm onAuthSuccess={checkAuthAndLoad} />;
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-800 flex flex-col font-sans relative select-none">
      <style dangerouslySetInnerHTML={{ __html: `
        .produtos-container *, .produtos-container div, .produtos-container button, .produtos-container section {
          box-shadow: none !important;
        }
      ` }} />

      {loading && (
        <div className="fixed inset-0 bg-stone-900 z-50 flex items-center justify-center text-white">
          <p>Carregando painel...</p>
        </div>
      )}

      <div className="sticky top-0 z-40 w-full">
        {!assinaturaExpirada && barbearia?.status_assinatura !== 'ativo' && (
          <div className="bg-sky-600 text-white px-4 py-2 text-center text-xs font-bold flex items-center justify-center gap-2 shadow-sm z-40">
            <AlertCircle className="w-4 h-4" />
            <span>Seu período de testes gratuitos termina em {diasRestantes} {diasRestantes === 1 ? 'dia' : 'dias'}.</span>
            <button
              onClick={abrirModalAssinaturaManual}
              className="underline ml-2 hover:text-stone-200 transition-colors cursor-pointer"
            >
              Assinar via Mercado Pago agora
            </button>
          </div>
        )}

        {/* HEADER MOBILE COM LOGOTIPO */}
        <header className="w-full sticky top-0 z-30 md:hidden">
          <div className="w-full bg-white/80 backdrop-blur-xl border-b border-white/80 px-5 py-2.5 flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3 min-w-0">
              <img 
                src="/images/logo.png" 
                alt="AgendaEstilo" 
                className="h-8 w-auto object-contain shrink-0"
              />
              <div className="min-w-0">
                <h1 className="font-black text-stone-900 text-xs tracking-tight truncate">
                  {barbearia?.nome || 'Minha Barbearia'}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <NotificacoesBell barbeariaId={barbearia?.id} supabase={supabase} />

              <button 
                onClick={() => setModalInfoAssinaturaOpen(true)} 
                className="w-9 h-9 rounded-full bg-white border border-stone-200/80 flex items-center justify-center text-stone-700 shadow-xs hover:bg-stone-50 transition-colors cursor-pointer"
                title="Ajustes"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>
      </div>

      <main className="...">
        {!mobileMenuOpen && (
          <nav 
            aria-label="Navegação inferior mobile" 
            style={{ display: mobileMenuOpen ? 'none' : undefined }}
            className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-stone-200 px-4 py-2 z-40 flex items-center justify-between shadow-lg"
          >
            <button 
              onClick={() => setActiveTab('financeiro')}
              className={`flex flex-col items-center space-y-1 transition-colors cursor-pointer ${activeTab === 'financeiro' ? 'text-stone-900 font-bold' : 'text-stone-400 font-medium'}`}
            >
              <TrendingUp className="w-5 h-5" />
              <span className="text-[10px]">Financeiro</span>
            </button>

            <button 
              onClick={() => setActiveTab('agendamentos')}
              className={`flex flex-col items-center space-y-1 transition-colors cursor-pointer ${activeTab === 'agendamentos' ? 'text-stone-900 font-bold' : 'text-stone-400 font-medium'}`}
            >
              <Calendar className="w-5 h-5" />
              <span className="text-[10px]">Agenda</span>
            </button>

            <div className="relative -top-3">
              <button 
                onClick={() => setMobileMenuOpen(true)}
                className="w-12 h-12 text-white rounded-full flex items-center justify-center active:scale-95 transition-transform border-4 border-white cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #102a43 0%, #0b1d2d 100%)',
                  boxShadow: '0 10px 20px rgba(16, 42, 67, 0.4), inset 0 2px 2px rgba(255, 255, 255, 0.3), inset 0 -3px 4px rgba(0, 0, 0, 0.5)'
                }}
                aria-label="Abrir Menu de Acesso Rápido"
              >
                <Menu className="w-5 h-5 text-white" />
              </button>
            </div>

            <button 
              onClick={() => setActiveTab('clientes')}
              className={`flex flex-col items-center space-y-1 transition-colors cursor-pointer ${activeTab === 'clientes' ? 'text-stone-900 font-bold' : 'text-stone-400 font-medium'}`}
            >
              <Users className="w-5 h-5" />
              <span className="text-[10px]">Clientes</span>
            </button>

            <button 
              onClick={() => setActiveTab('configuracoes')}
              className={`flex flex-col items-center space-y-1 transition-colors cursor-pointer ${activeTab === 'configuracoes' ? 'text-stone-900 font-bold' : 'text-stone-400 font-medium'}`}
            >
              <Settings className="w-5 h-5" />
              <span className="text-[10px]">Ajustes</span>
            </button>
          </nav>
        )}
      </main>

      {/* PAINEL DE GAVETA DE APPS NO MOBILE */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] flex md:hidden items-end justify-center">
          <div 
            onClick={fecharMenuMobile} 
            className="fixed inset-0 bg-transparent" 
          />

          <div className="relative w-full max-w-lg mx-4 mb-4 bg-stone-200/95 backdrop-blur-2xl rounded-[2.5rem] pt-3 px-6 pb-8 shadow-2xl border border-stone-300 z-10 flex flex-col text-stone-800">
            <div className="w-10 h-1 bg-stone-400 rounded-full mx-auto mb-5 cursor-pointer" onClick={fecharMenuMobile}></div>

            <div className="grid grid-cols-4 gap-y-6 gap-x-3 py-2">
              {[
                { id: 'financeiro', label: 'Financeiro', icon: TrendingUp, action: () => setActiveTab('financeiro') },
                { id: 'agendamentos', label: 'Agenda', icon: Calendar, action: () => setActiveTab('agendamentos') },
                { id: 'fidelidade', label: 'Fidelizacao', icon: Award, action: () => setActiveTab('fidelidade') },
                { id: 'configuracoes', label: 'Configurações', icon: Settings, action: () => setActiveTab('configuracoes') },
                { id: 'despesas', label: 'Despesas', icon: TrendingDown, action: () => setActiveTab('despesas') },
                { id: 'comissoes', label: 'Comissões', icon: Percent, action: () => setActiveTab('comissoes') },
                { id: 'servicos', label: 'Equipe', icon: Scissors, action: () => setActiveTab('servicos') },
                { id: 'assinatura', label: 'Assinatura', icon: ClipboardPenLine, action: () => setModalInfoAssinaturaOpen(true) },
                { id: 'pdv', label: 'PDV', icon: ShoppingCart, action: () => setActiveTab('pdv') },
                { id: 'produtos', label: 'Produtos', icon: ShoppingBag, action: () => setActiveTab('produtos') },
                { id: 'suporte', label: 'Suporte', icon: MessageCircleCheck, isLink: true, href: "https://wa.me/5542998040396?text=Olá,%20preciso%20de%20suporte%20com%20o%20sistema%20AgendaSoft." },
                { id: 'logout', label: 'Logout', icon: LogOut, action: handleLogout, isLogout: true },
              ].map((item) => {
                const IconComponent = item.icon;
                
                let buttonStyle = {};
                if (item.isLogout) {
                  buttonStyle = {
                    background: 'linear-gradient(135deg, #9b1c2e 0%, #70121f 100%)',
                    boxShadow: '0 10px 20px rgba(112, 18, 31, 0.35), inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -3px 5px rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.15)'
                  };
                } else {
                  buttonStyle = {
                    background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
                    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.45), inset 0 2px 3px rgba(255, 255, 255, 0.2), inset 0 -3px 5px rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)'
                  };
                }

                const buttonContent = (
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-200 active:scale-95"
                    style={buttonStyle}
                  >
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                );

                const labelContent = (
                  <span className={`text-[11px] font-medium tracking-tight mt-1.5 ${item.isLogout ? 'text-rose-600 font-bold' : 'text-stone-700'}`}>
                    {item.label}
                  </span>
                );

                if (item.isLink) {
                  return (
                    <a
                      key={item.id}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={fecharMenuMobile}
                      className="flex flex-col items-center justify-center group cursor-pointer"
                    >
                      {buttonContent}
                      {labelContent}
                    </a>
                  );
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => { item.action(); fecharMenuMobile(); }}
                    className="flex flex-col items-center justify-center group cursor-pointer"
                  >
                    {buttonContent}
                    {labelContent}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {assinaturaExpirada && !loading && modalAssinaturaOpen && (
        <div className="fixed inset-0 bg-stone-950/95 backdrop-blur-md z-50 overflow-y-auto pointer-events-auto">
          <div className="min-h-full flex items-center justify-center p-4 py-8">
            <div 
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-stone-200 flex flex-col items-center text-center space-y-3 my-auto relative z-10"
            >
              <div className="w-full flex flex-col items-center text-center space-y-2 pb-3 border-b border-stone-100">
                <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-inner mx-auto">
                  <Lock className="w-5 h-5" />
                </div>
                <div className="w-full space-y-0.5 text-center">
                  <h2 className="text-lg font-extrabold text-stone-900 w-full text-center">Período de Teste Finalizado</h2>
                  <p className="text-[11px] sm:text-xs text-stone-500 leading-relaxed w-full text-center px-2">
                    Seus 7 dias gratuitos expiraram. Para liberar o acesso completo ao painel, efetue o pagamento abaixo.
                  </p>
                </div>
              </div>

              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 w-full text-center space-y-1">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Plano Mensal Gestor</span>
                <div className="flex justify-between items-center px-1">
                  <span className="text-stone-700 text-xs font-medium">Acesso Completo</span>
                  <span className="text-sm sm:text-base font-extrabold text-stone-900">R$ {valorAssinatura?.toFixed(2)} / mês</span>
                </div>
              </div>

              <div className="w-full flex flex-col items-center space-y-3" onClick={(e) => e.stopPropagation()}>
                {pixDataMP ? (
                  <div className="flex flex-col items-center justify-center space-y-3 w-full max-w-sm mx-auto" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-white p-2 rounded-2xl border border-stone-200 shadow-inner inline-block" onClick={(e) => e.stopPropagation()}>
                      <img 
                        src={`data:image/png;base64,${pixDataMP.qrCodeBase64}`} 
                        alt="QR Code Pix" 
                        className="w-36 h-36 sm:w-40 sm:h-40 object-contain mx-auto block pointer-events-none" 
                      />
                    </div>

                    <div className="w-full pointer-events-none select-none">
                      <p className="text-[10px] sm:text-[11px] text-stone-500 text-center px-4">
                        Escaneie o QR Code acima ou copie o código Pix abaixo:
                      </p>
                    </div>

                    <div className="w-full">
                      <input
                        id="input-copia-cola"
                        type="text"
                        readOnly
                        value={pixDataMP?.copiaECola || ''}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.currentTarget.select();
                        }}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-600 focus:outline-none cursor-text"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        copiarChavePix();
                      }}
                      className="w-full bg-stone-900 hover:bg-stone-800 text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs mt-1"
                    >
                      {copiado ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      {copiado ? 'Código Pix Copiado com Sucesso!' : 'Copiar Código Pix'}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleProcessarPagamentoMercadoPago(e);
                      }}
                      disabled={processandoPagamento}
                      className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded-xl transition duration-200 text-xs shadow-md cursor-pointer disabled:opacity-50 mt-2 z-20 relative"
                    >
                      {processandoPagamento ? 'Verificando Pagamento...' : 'Já fiz o pagamento / Ativar Assinatura'}
                    </button>
                  </div>
                ) : (
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      gerarPixMercadoPago({
                        transaction_amount: 9.90,
                        description: 'Plano Mensal Gestor - Acesso Completo',
                        payer_email: user?.email || 'diemersonlimabarbosa@gmail.com',
                        payer_name: barbearia?.nome || 'Gestor'
                      });
                    }}
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

      <div className="flex flex-1">
        {/* BARRA LATERAL DESKTOP COM LOGOTIPO */}
        <aside 
          className="hidden md:flex flex-col w-72 p-5 select-none shrink-0 fixed left-0 top-0 h-screen overflow-y-auto justify-between border-r border-slate-200 z-40 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-slate-50 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full"
          style={{
            background: '#ffffff',
            boxShadow: '10px 0 40px rgba(0, 0, 0, 0.03), inset -1px 0 0 rgba(0, 0, 0, 0.05)'
          }}
        >
          <div className="space-y-5 w-full">
            {/* LOGOTIPO NO TOPO DA SIDEBAR */}
            <div className="flex items-center justify-center px-4 py-3.5 rounded-2xl border border-slate-200/80 shadow-xs bg-slate-50/50">
              <img 
                src="/images/logo.png" 
                alt="AgendaEstilo" 
                className="h-12 w-auto object-contain"
              />
            </div>

            <nav className="space-y-1.5 pt-1 w-full">
              {[
                { id: 'pdv', label: 'PDV', icon: ShoppingCart },
                { id: 'produtos', label: 'Produtos & Estoque', icon: ShoppingBag },
                { id: 'agendamentos', label: 'Agendamentos', icon: CalendarCheck },
                { id: 'clientes', label: 'Clientes Cadastrados', icon: Users },
                { id: 'fidelidade', label: 'Fidelização', icon: Award },
                { id: 'financeiro', label: 'Relatório Financeiro', icon: DollarSign },
                { id: 'despesas', label: 'Custos & Despesas', icon: TrendingDown },
                { id: 'servicos', label: 'Serviços & Equipe', icon: Scissors },
                { id: 'comissoes', label: 'Comissões', icon: Percent },
                { id: 'configuracoes', label: 'Configurações', icon: Store },
              ].map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
                      isActive 
                        ? 'text-white shadow-xl border-stone-800 scale-[1.02]' 
                        : 'text-slate-600 border-slate-200/60 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300'
                    }`}
                    style={isActive ? {
                      background: 'linear-gradient(135deg, #18181b 0%, #09090b 50%, #000000 100%)',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.15)',
                    } : {
                      background: '#f8fafc'
                    }}
                  >
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                      isActive 
                        ? 'bg-white/10 border-white/20 text-white shadow-inner' 
                        : 'bg-white border-slate-200 text-slate-500 shadow-sm'
                    }`}>
                      <IconComponent className="w-4 h-4 shrink-0" />
                    </div>
                    <span className="tracking-tight truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-200 mt-auto w-full">
            <button
              onClick={() => setModalInfoAssinaturaOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-extrabold text-white transition-all cursor-pointer border border-stone-800 shadow-md"
              style={{
                background: 'linear-gradient(135deg, #18181b 0%, #09090b 100%)',
                boxShadow: '0 6px 15px rgba(0, 0, 0, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
              }}
            >
              <CreditCard className="w-4 h-4 text-slate-300 shrink-0" /> 
              <span className="truncate">{barbearia?.status_assinatura === 'ativo' ? 'Assinatura Ativa' : 'Assinar / Renovar'}</span>
            </button>

            <button
              onClick={() => loadDashboardData(barbearia.id)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer shadow-sm bg-slate-50"
            >
              <RefreshCw className="w-4 h-4 shrink-0 text-slate-400" /> 
              <span className="truncate">Atualizar Dados</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-all cursor-pointer shadow-sm bg-rose-50/50"
            >
              <LogOut className="w-4 h-4 shrink-0 text-rose-500" /> 
              <span className="truncate">Sair do Sistema</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 md:ml-72 p-4 sm:p-6 md:p-10 pb-24 overflow-y-auto max-w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            {activeTab === 'configuracoes' && (
              <div className="flex items-center gap-2"></div>
            )}
          </div>

          {errorMessage && (
            <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500" /> {errorMessage}
            </div>
          )}

          {activeTab === 'pdv' && (
            <PdvScreen 
              servicosIniciais={servicos} 
              produtosIniciais={produtos} 
              barbeariaId={barbearia?.id}
              supabase={supabase}
              onVendaConcluida={() => {
                carregarProdutos(barbearia?.id);
              }}
            />
          )}

          {activeTab === 'produtos' && (
            <div className="produtos-container">
              <ProdutosScreen
                produtos={produtos}
                barbeariaId={barbearia?.id}
                supabase={supabase}
                onReload={() => carregarProdutos(barbearia?.id)}
              />
            </div>
          )}

          {activeTab === 'agendamentos' && (
            <div className="space-y-4 pb-24">
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

          {activeTab === 'fidelidade' && (
            <FidelizacaoAdmin
              barbeariaId={barbearia?.id}
              supabase={supabase}
            />
          )}

          {activeTab === 'financeiro' && (
            <RelatoriosPage 
              agendamentos={agendamentos} 
              despesas={despesas} 
              barbeiros={barbeiros} 
            />
          )}

          {activeTab === 'comissoes' && (
            <div 
              className="rounded-[2.5rem] border border-stone-200/85 shadow-[0_10px_30px_rgba(0,0,0,0.03)] p-5 sm:p-8 space-y-6 bg-white"
            >
              <div className="pb-4 border-b border-stone-200/60 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#111111] text-white flex items-center justify-center shadow-md">
                  <Percent className="w-5 h-5 text-stone-200" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">Comissões dos Barbeiros</h3>
                  <p className="text-xs text-stone-500 mt-0.5">Defina a porcentagem de comissão padrão para cada profissional da unidade.</p>
                </div>
              </div>

              {barbeiros.length === 0 ? (
                <div className="p-12 text-center text-stone-400 text-xs font-medium">
                  Nenhum barbeiro cadastrado no momento para esta unidade.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {barbeiros
                    .filter((barbeiro, index, self) => 
                      index === self.findIndex(b => (b.id && b.id === barbeiro.id) || (b.nome && b.nome.toLowerCase() === barbeiro.nome.toLowerCase()))
                    )
                    .map((barbeiro) => {
                      const valorAtual = barbeiro.comissao_padrao ?? 50;

                      return (
                        <div 
                          key={barbeiro.id} 
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-3xl border border-stone-200/70 bg-stone-50/80 hover:bg-stone-50 transition-all gap-4 shadow-xs"
                        >
                          <div className="space-y-0.5">
                            <h4 className="text-xs sm:text-sm font-extrabold text-stone-900">{barbeiro.nome}</h4>
                            <span className="text-xs text-stone-500 font-medium">
                              Comissão atual: <strong className="text-stone-900 font-bold">{valorAtual}%</strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5 self-end sm:self-auto">
                            <div className="relative flex items-center">
                              <input
                                type="number"
                                defaultValue={valorAtual}
                                id={`comissao-${barbeiro.id}`}
                                className="w-20 px-3.5 py-2 bg-white border border-stone-300/80 rounded-2xl text-xs font-bold text-stone-900 focus:outline-none focus:border-stone-900 shadow-xs text-center"
                              />
                              <span className="absolute right-3 text-xs font-bold text-stone-400 pointer-events-none">%</span>
                            </div>

                            <button
                              onClick={async () => {
                                const inputReal = document.getElementById(`comissao-${barbeiro.id}`);
                                const novaComissao = Number(inputReal.value);

                                if (isNaN(novaComissao) || novaComissao < 0 || novaComissao > 100) {
                                  alert('Insira um valor entre 0 e 100.');
                                  return;
                                }

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
                              className="px-5 py-2 bg-[#111111] hover:bg-stone-800 text-white text-xs font-bold rounded-2xl active:scale-95 transition-all shadow-md cursor-pointer"
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
                          <div className="flex items-center gap-3 overflow-hidden">
                            {b.foto ? (
                              <img 
                                src={b.foto} 
                                alt={b.nome} 
                                className="w-11 h-11 rounded-full object-cover border border-stone-200 shrink-0 shadow-sm" 
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-full bg-stone-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
                                {(b.nome || 'P').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="space-y-0.5 overflow-hidden">
                              <h4 className="font-bold text-stone-900 text-sm truncate">{b.nome}</h4>
                              <span className="text-xs text-stone-500 block truncate">{b.especialidade || 'Profissional'}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => handleOpenBarbeiroModal(b)} className="p-1.5 bg-white border border-stone-200 rounded-xl hover:bg-stone-100 cursor-pointer">
                              <Edit className="w-3.5 h-3.5 text-stone-700" />
                            </button>
                            <button onClick={() => handleDeleteBarbeiro(b.id)} className="p-1.5 bg-white border border-stone-200 rounded-xl hover:bg-red-50 text-red-500 cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

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
                            className="w-full py-1.5 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer"
                          >
                            Gerar Acesso
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {modalBarbeiroOpen && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 relative">
                      <button 
                        onClick={() => setModalBarbeiroOpen(false)}
                        className="absolute top-4 right-4 p-1.5 bg-stone-100 rounded-full hover:bg-stone-200 text-stone-600 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <h3 className="font-bold text-stone-900 text-base">
                        {barbeiroParaEditar ? 'Editar Profissional' : 'Novo Profissional'}
                      </h3>

                      <form onSubmit={handleSaveBarbeiro} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-stone-600 mb-1">Nome</label>
                          <input 
                            type="text" 
                            required
                            value={nome} 
                            onChange={(e) => setNome(e.target.value)} 
                            className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 focus:outline-none"
                            placeholder="Ex: Thais"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-600 mb-1">Especialidade</label>
                          <input 
                            type="text" 
                            value={especialidade} 
                            onChange={(e) => setEspecialidade(e.target.value)} 
                            className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 focus:outline-none"
                            placeholder="Ex: Designer de sobrancelhas"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-600 mb-1">Taxa de Comissão (%)</label>
                          <input 
                            type="number" 
                            value={taxaComissao} 
                            onChange={(e) => setTaxaComissao(e.target.value)} 
                            className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 focus:outline-none"
                            placeholder="Ex: 50"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-600 mb-1">Foto de Perfil</label>
                          <div className="flex items-center gap-3">
                            {fotoUrl ? (
                              <img 
                                src={fotoUrl} 
                                alt="Preview" 
                                className="w-12 h-12 rounded-full object-cover border border-stone-200 shrink-0 shadow-sm" 
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 text-[10px] shrink-0 font-bold">
                                Sem foto
                              </div>
                            )}

                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={handleUploadFoto}
                              disabled={uploading}
                              className="w-full text-xs text-stone-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-stone-900 file:text-white hover:file:bg-stone-800 cursor-pointer"
                            />
                          </div>
                          {uploading && <p className="text-[10px] text-amber-600 mt-1 font-medium">Enviando imagem...</p>}
                        </div>

                        <div className="pt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => setModalBarbeiroOpen(false)}
                            className="w-1/2 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-2xl text-xs font-semibold cursor-pointer transition-colors"
                          >
                            Cancelar
                          </button>
                          <button 
                            type="submit" 
                            disabled={uploading}
                            className="w-1/2 bg-stone-900 text-white font-semibold py-3 rounded-2xl text-xs uppercase tracking-wider shadow-md hover:bg-stone-800 cursor-pointer disabled:opacity-50 transition-all"
                          >
                            {uploading ? 'Aguarde...' : 'Salvar'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {!loading && modalInfoAssinaturaOpen && (
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

      {modalAssinaturaOpen && !loading && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-stone-200 space-y-6">
            <div className="flex justify-between items-center">
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
                  <div className="space-y-3 w-full" onClick={(e) => e.stopPropagation()}>
                    <div 
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                          if (navigator.clipboard && navigator.clipboard.writeText) {
                            await navigator.clipboard.writeText(pixDataMP.copiaECola);
                          } else {
                            const textarea = document.createElement('textarea');
                            textarea.value = pixDataMP.copiaECola;
                            document.body.appendChild(textarea);
                            textarea.select();
                            document.execCommand('copy');
                            document.body.removeChild(textarea);
                          }
                          setCopiado(true);
                          setTimeout(() => setCopiado(false), 3000);
                        } catch (err) {
                          alert('Erro ao copiar.');
                        }
                      }}
                      className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600 break-all text-center select-all font-mono cursor-pointer hover:bg-stone-100 transition-colors shadow-inner"
                      title="Clique para copiar"
                    >
                      {pixDataMP.copiaECola}
                    </div>

                    <div className="w-full space-y-3 mt-4 relative z-50">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          
                          const texto = pixDataMP?.copiaECola;
                          if (!texto) return;

                          try {
                            if (navigator.clipboard && navigator.clipboard.writeText) {
                              navigator.clipboard.writeText(texto);
                            } else {
                              const textarea = document.createElement('textarea');
                              textarea.value = texto;
                              document.body.appendChild(textarea);
                              textarea.select();
                              document.execCommand('copy');
                              document.body.removeChild(textarea);
                            }
                            setCopiado(true);
                            setTimeout(() => setCopiado(false), 3000);
                          } catch (err) {
                            executarFallbackManual(texto);
                          }
                        }}
                        className="w-full bg-stone-900 hover:bg-stone-800 text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg relative z-50"
                      >
                        {copiado ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        {copiado ? 'Código Pix Copiado com Sucesso!' : 'Copiar Código Pix'}
                      </button>

                      <div className="w-full h-2" />

                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleProcessarPagamentoMercadoPago(e);
                        }}
                        disabled={processandoPagamento}
                        className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded-xl transition duration-200 text-xs shadow-md cursor-pointer disabled:opacity-50 relative z-10"
                      >
                        {processandoPagamento ? 'Verificando Pagamento...' : 'Já fiz o pagamento / Ativar Assinatura'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {(metodoPagamento === 'credito' || metodoPagamento === 'debito') && (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (metodoPagamento === 'credito' || metodoPagamento === 'debito') {
                    handleProcessarPagamentoMercadoPago(e);
                  }
                }} 
                className="space-y-4"
              >
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