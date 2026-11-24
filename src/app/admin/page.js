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
  Phone,
  KeyRound,
  ChevronDown,
  UserCheck,
  Eye,
  EyeOff,
  HelpCircle,
  History,
  CheckCheck
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { Keyboard } from '@capacitor/keyboard';

import ConfiguracoesBarbearia from '@/components/ConfiguracoesBarbearia';
import PainelAgendaDia from '@/components/PainelAgendaDia';

import RelatoriosPage from './relatorios'; 
import PdvScreen from '@/components/PdvScreen'; 
import ProdutosScreen from '@/components/ProdutosScreen';
import NotificacoesBell from '@/components/NotificacoesBell'; 
import AdminModoAgendamento from '@/components/AdminModoAgendamento';
import FidelizacaoAdmin from '@/components/FidelizacaoAdmin';

// URL base fixa para chamadas de API no app nativo Capacitor/Android
const API_BASE_URL = 'https://agendaestilo.com.br';

/* HOOK PARA NOTIFICAÇÕES NATIVAS DO ANDROID (SUPABASE REALTIME) */
function usePushNotifications(barbeariaId) {
  useEffect(() => {
    if (!barbeariaId) return;

    async function registrarPush() {
      if (!Capacitor.isNativePlatform()) {
        console.log('Push Notifications nativas ignoradas no ambiente Web.');
        return;
      }

      try {
        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive !== 'granted') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive === 'granted') {
          await PushNotifications.register();
        }
      } catch (err) {
        console.error('Erro ao registrar Push:', err);
      }
    }

    registrarPush();

    let listener;
    if (Capacitor.isNativePlatform()) {
      listener = PushNotifications.addListener('registration', async (token) => {
        console.log('FCM Token Gerado:', token.value);

        await supabase
          .from('barbearias')
          .update({ fcm_token: token.value })
          .eq('id', barbeariaId);
      });
    }

    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, [barbeariaId]);
}

/* COMPONENTE DE LOGIN E CADASTRO COM TRANSIÇÃO SUAVE */
function AuthForm({ onAuthSuccess }) {
  const searchParams = useSearchParams();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
          const slug = nomeBarbearia
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-');

          const { error: barbError } = await supabase.from('barbearias').insert([
            {
              user_id: authData.user.id,
              nome: nomeBarbearia,
              slug: slug,
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
      <div className="w-full max-w-md bg-white rounded-[2.5rem] border border-stone-200/80 p-6 sm:p-10 shadow-2xl space-y-6 relative overflow-hidden transition-all duration-300">
        
        <div className="flex flex-col items-center text-center space-y-3 pt-1">
          <div className="p-4 rounded-3xl w-full flex items-center justify-center">
            <img 
              src="/images/logo.png" 
              alt="Logo AgendaEstilo" 
              className="h-14 sm:h-16 w-auto object-contain transition-transform hover:scale-105 duration-300"
            />
          </div>
          <p className="text-xs text-stone-500 font-medium transition-opacity duration-300">
            {isRegister 
              ? 'Preencha os dados da sua empresa' 
              : 'Entre com suas credenciais de acesso'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1.5 bg-stone-100 p-1.5 rounded-2xl border border-stone-200/60 relative">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setErrorMsg(''); }}
            className={`py-2.5 text-xs font-extrabold rounded-xl transition-all duration-300 cursor-pointer relative z-10 ${
              !isRegister 
                ? 'text-white shadow-md' 
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setErrorMsg(''); }}
            className={`py-2.5 text-xs font-extrabold rounded-xl transition-all duration-300 cursor-pointer relative z-10 ${
              isRegister 
                ? 'text-white shadow-md' 
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Cadastrar
          </button>

          <div 
            className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-stone-900 rounded-xl transition-transform duration-300 ease-in-out ${
              isRegister ? 'translate-x-[calc(100%+4px)]' : 'translate-x-0'
            }`}
          />
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-xs font-semibold text-center animate-in fade-in duration-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-4 transition-all duration-300 ease-in-out">
            <div className={`space-y-4 overflow-hidden transition-all duration-300 ease-in-out ${isRegister ? 'max-h-[250px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Nome da Barbearia</label>
                <div className="relative">
                  <Store className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required={isRegister}
                    placeholder="Ex: Barbearia Navalha de Ouro"
                    value={nomeBarbearia}
                    onChange={(e) => setNomeBarbearia(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 font-medium transition-all"
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
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 font-medium transition-all"
                  />
                </div>
              </div>
            </div>

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
                  className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 font-medium transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 font-medium transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#111111] hover:bg-stone-800 text-white text-xs font-extrabold rounded-2xl shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 mt-4 uppercase tracking-wider"
          >
            <span>{loading ? 'Aguarde...' : isRegister ? 'Criar Conta' : 'Entrar no Painel'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className={`transition-all duration-300 overflow-hidden ${isRegister ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
          <div className="pt-2 border-t border-stone-100 flex flex-col items-center justify-center space-y-1.5 text-[11px] text-stone-500 text-center">
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>7 dias de teste grátis sem compromisso</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Acesso instantâneo ao painel completo</span>
            </div>
          </div>
        </div>

        <div className={`transition-all duration-300 overflow-hidden ${!isRegister ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
          <div className="pt-2 border-t border-stone-100 text-center">
            <a
              href="https://wa.me/5542998040396?text=Olá,%20preciso%20de%20suporte%20com%20o%20sistema%20AgendaEstilo."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 text-xs font-bold text-stone-600 hover:text-stone-900 transition-colors py-1 cursor-pointer"
            >
              <MessageCircleCheck className="w-4 h-4 text-emerald-600" />
              <span>Suporte WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-stone-400 font-medium">
        <p>© 2026 Todos os direitos reservados.</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('agendamentos');
  const [subTabEquipe, setSubTabEquipe] = useState('servicos');
  const [openAcessoId, setOpenAcessoId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  const [produtos, setProdutos] = useState([]);
  const scrollRef = React.useRef(null);

  // Controlo automático do menu mobile no Capacitor (e fallback web) ao abrir/fechar teclado
  const [tecladoMenuVisivel, setTecladoMenuVisivel] = useState(false);
  const menuAlturaBaseRef = React.useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let showListener;
    let hideListener;
    let ativo = true;

    const registrarEventosCapacitor = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          showListener = await Keyboard.addListener('keyboardWillShow', () => {
            if (ativo) setTecladoMenuVisivel(true);
          });

          hideListener = await Keyboard.addListener('keyboardWillHide', () => {
            if (ativo) setTecladoMenuVisivel(false);
          });
        }
      } catch (err) {
        console.error('Erro ao registar eventos do teclado Capacitor:', err);
      }
    };

    registrarEventosCapacitor();

    const vp = window.visualViewport;
    const obterAltura = () => (vp ? vp.height : window.innerHeight);

    const atualizarBase = () => {
      const atual = obterAltura();
      if (!menuAlturaBaseRef.current || atual > menuAlturaBaseRef.current) {
        menuAlturaBaseRef.current = atual;
      }
    };

    atualizarBase();

    const avaliarViewport = () => {
      if (Capacitor.isNativePlatform()) return;
      const atual = obterAltura();
      const base = menuAlturaBaseRef.current || atual;
      if (atual > base) menuAlturaBaseRef.current = atual;

      const reducao = menuAlturaBaseRef.current - atual;
      setTecladoMenuVisivel(reducao > 120);
    };

    vp?.addEventListener('resize', avaliarViewport);
    window.addEventListener('resize', avaliarViewport);

    return () => {
      ativo = false;
      showListener?.remove();
      hideListener?.remove();
      vp?.removeEventListener('resize', avaliarViewport);
      window.removeEventListener('resize', avaliarViewport);
    };
  }, []);

  const esconderMenuMobilePorTeclado = tecladoMenuVisivel;

  useEffect(() => {
    if (esconderMenuMobilePorTeclado) {
      setMobileMenuOpen(false);
    }
  }, [esconderMenuMobilePorTeclado]);

  useEffect(() => {
    if (activeTab === 'despesas' && scrollRef.current) {
      const elementoAtivo = scrollRef.current.querySelector('[data-selecionado="true"]');
      if (elementoAtivo) {
        elementoAtivo.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
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

  usePushNotifications(barbearia?.id);

  const [diasRestantes, setDiasRestantes] = useState(7);
  const [assinaturaExpirada, setAssinaturaExpirada] = useState(false);
  const [modalAssinaturaOpen, setModalAssinaturaOpen] = useState(false);
  const [processandoPagamento, setProcessandoPagamento] = useState(false);
  const [gerandoPix, setGerandoPix] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [pagamentoAprovadoBanner, setPagamentoAprovadoBanner] = useState(false);
  const pagamentoConfirmadoRef = React.useRef(false);

  const [barbeiroParaEditar, setBarbeiroParaEditar] = useState(null);
  const [metodoPagamento, setMetodoPagamento] = useState('pix');

  const fecharMenuMobile = () => {
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

  // VALOR DE TESTE: R$ 0,01 (Voltar para 9.90 após finalizar os testes)
  const valorAssinatura = 0.01;

  const [agendamentos, setAgendamentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [barbeiros, setBarbeiros] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [despesas, setDespesas] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');

  const [filtroMesDespesas, setFiltroMesDespesas] = useState(() => {
    return new Date().toISOString().split('T')[0].substring(0, 7);
  });

  // ESTADOS DA ABA DE COMISSÕES E HISTÓRICO
  const [fechamentosComissoes, setFechamentosComissoes] = useState([]);
  const [modalExtratoBarbeiro, setModalExtratoBarbeiro] = useState(null);
  const [modalHistoricoFechamentos, setModalHistoricoFechamentos] = useState(false);

  const [modalConfirmacao, setModalConfirmacao] = useState({
    isOpen: false,
    titulo: '',
    descricao: '',
    onConfirm: null,
  });

  const [modalFeedback, setModalFeedback] = useState({
    isOpen: false,
    tipo: 'sucesso',
    titulo: '',
    mensagem: '',
  });

  const formatarData = (item) => {
    const rawData = item.data_hora || item.created_at || item.data;
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

  // Só ativa se houver comprovação real de status_assinatura === 'ativo' (vindo do webhook/backend)
  const concluirAtivacaoAssinatura = useCallback((dadosConfirmados) => {
    if (!dadosConfirmados || dadosConfirmados?.status_assinatura?.trim().toLowerCase() !== 'ativo') {
      return;
    }

    // Trava absoluta: impede múltiplas mensagens ou execuções duplicadas
    if (pagamentoConfirmadoRef.current) return;
    pagamentoConfirmadoRef.current = true;

    setBarbearia((prev) => ({ ...prev, ...dadosConfirmados }));
    setAssinaturaExpirada(false);
    setProcessandoPagamento(false);
    setPagamentoAprovadoBanner(true);

    setTimeout(() => {
      setModalAssinaturaOpen(false);
      setPagamentoAprovadoBanner(false);
      setPixDataMP({ qrCodeBase64: '', copiaECola: '', paymentId: null });
    }, 1800);
  }, []);

  // Consulta status real do pagamento antes de liberar o sistema
  const verificarPagamentoRealAprovado = useCallback(async () => {
    if (!barbearia?.id) return null;

    try {
      // 1. Checa se o webhook do Mercado Pago já marcou a barbearia como 'ativo' e vigente no banco
      const { data: barbData } = await supabase
        .from('barbearias')
        .select('status_assinatura, data_inicio_assinatura, data_vencimento')
        .eq('id', barbearia.id)
        .single();

      if (barbData?.status_assinatura?.trim().toLowerCase() === 'ativo') {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        if (barbData.data_vencimento) {
          const partes = barbData.data_vencimento.split('T')[0].split('-');
          const dataVenc = new Date(partes[0], partes[1] - 1, partes[2]);
          dataVenc.setHours(0, 0, 0, 0);

          if (dataVenc >= hoje) {
            return barbData;
          }
        } else {
          return barbData;
        }
      }

      // 2. Se houver um paymentId gerado nesta sessão, consulta diretamente o backend
      if (pixDataMP?.paymentId) {
        const baseUrl =
          typeof window !== 'undefined' &&
          (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1'))
            ? window.location.origin
            : API_BASE_URL;

        const resp = await fetch(
          `${baseUrl}/api/verificar-pagamento?paymentId=${encodeURIComponent(pixDataMP.paymentId)}&barbeariaId=${encodeURIComponent(barbearia.id)}`,
          { cache: 'no-store' }
        );

        if (resp.ok) {
          const json = await resp.json();
          const statusMP = (json?.status || json?.payment_status || '').trim().toLowerCase();

          if (statusMP === 'approved') {
            if (json?.barbearia?.status_assinatura?.trim().toLowerCase() === 'ativo') {
              return json.barbearia;
            }

            const { data: barbAtualizada } = await supabase
              .from('barbearias')
              .select('status_assinatura, data_inicio_assinatura, data_vencimento')
              .eq('id', barbearia.id)
              .single();

            if (barbAtualizada?.status_assinatura?.trim().toLowerCase() === 'ativo') {
              return barbAtualizada;
            }
          }
        }
      }

      return null;
    } catch (err) {
      console.error('Erro ao verificar status real do pagamento:', err);
      return null;
    }
  }, [barbearia?.id, pixDataMP?.paymentId]);

  const gerarPixMercadoPago = useCallback(async (paymentData) => {
    if (gerandoPix) return;
    setGerandoPix(true);

    try {
      const valorInformado = Number(paymentData?.transaction_amount);
      const valorFinal = !Number.isNaN(valorInformado) && valorInformado > 0 ? valorInformado : valorAssinatura;

      const payload = {
        transaction_amount: valorFinal,
        description: paymentData?.description || 'Assinatura Mensal Gestor',
        payer_email: paymentData?.payer_email || user?.email || 'diemersonlimabarbosa@gmail.com',
        payer_name: paymentData?.payer_name || barbearia?.nome || 'Gestor',
        barbeariaId: paymentData?.barbeariaId || barbearia?.id
      };

      const baseUrl =
        typeof window !== 'undefined' &&
        (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1'))
          ? window.location.origin
          : API_BASE_URL;

      const endpoint = `${baseUrl}/api/gerar-pix`;
      let data;

      if (typeof window !== 'undefined') {
        const { Capacitor, CapacitorHttp } = await import('@capacitor/core');

        if (Capacitor.isNativePlatform()) {
          const response = await CapacitorHttp.post({
            url: endpoint,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            data: payload,
          });

          let responseData = response.data;
          if (typeof responseData === 'string') {
            responseData = JSON.parse(responseData);
          }

          if (response.status !== 200 && response.status !== 201) {
            throw new Error(responseData?.error?.message || responseData?.message || `Erro no servidor (${response.status})`);
          }

          data = responseData;
        } else {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(payload),
          });
          const textResponse = await response.text();
          try {
            data = JSON.parse(textResponse);
          } catch (e) {
            throw new Error(`O servidor retornou HTML em vez de JSON: ${textResponse.substring(0, 100)}`);
          }

          if (!response.ok) {
            throw new Error(data.error?.message || data.message || 'Falha ao processar no servidor.');
          }
        }
      }

      const qrBase64 = data?.qrCodeBase64 || data?.qr_code_base64 || '';
      const copiaCola = data?.copiaECola || data?.qr_code || '';
      const idPagamento = data?.paymentId || data?.id || null;

      if (!qrBase64 && !copiaCola) {
        throw new Error('QR Code não retornado pela API.');
      }

      setPixDataMP({
        qrCodeBase64: qrBase64,
        copiaECola: copiaCola,
        paymentId: idPagamento
      });

      return data;
    } catch (error) {
      console.error('Falha ao gerar PIX:', error);
    } finally {
      setGerandoPix(false);
    }
  }, [barbearia?.id, barbearia?.nome, gerandoPix, user?.email, valorAssinatura]);

  useEffect(() => {
    const modalVisivel =
      !loading &&
      modalAssinaturaOpen &&
      metodoPagamento === 'pix' &&
      !pagamentoAprovadoBanner;

    if (modalVisivel && !pixDataMP?.qrCodeBase64 && !pixDataMP?.copiaECola && !gerandoPix) {
      gerarPixMercadoPago({
        transaction_amount: valorAssinatura,
        description: 'Plano Mensal Gestor - Acesso Completo',
        payer_email: user?.email || 'diemersonlimabarbosa@gmail.com',
        payer_name: barbearia?.nome || 'Gestor',
        barbeariaId: barbearia?.id
      });
    }
  }, [
    loading,
    modalAssinaturaOpen,
    metodoPagamento,
    pagamentoAprovadoBanner,
    pixDataMP?.qrCodeBase64,
    pixDataMP?.copiaECola,
    gerandoPix,
    gerarPixMercadoPago,
    valorAssinatura,
    user?.email,
    barbearia?.nome,
    barbearia?.id
  ]);

  // Escuta automática em tempo real + polling seguro enquanto o modal estiver aberto
  useEffect(() => {
    if (!barbearia?.id || !modalAssinaturaOpen || pagamentoConfirmadoRef.current) return;

    const channelAssinatura = supabase
      .channel(`assinatura-barbearia-${barbearia.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'barbearias',
          filter: `id=eq.${barbearia.id}`,
        },
        (payload) => {
          const registro = payload.new;
          if (registro?.status_assinatura?.trim().toLowerCase() === 'ativo') {
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);

            if (registro.data_vencimento) {
              const partes = registro.data_vencimento.split('T')[0].split('-');
              const dataVenc = new Date(partes[0], partes[1] - 1, partes[2]);
              dataVenc.setHours(0, 0, 0, 0);
              if (dataVenc >= hoje) {
                concluirAtivacaoAssinatura(registro);
              }
            } else {
              concluirAtivacaoAssinatura(registro);
            }
          }
        }
      )
      .subscribe();

    const intervaloVerificacao = setInterval(async () => {
      if (pagamentoConfirmadoRef.current) return;
      const dadosAprovados = await verificarPagamentoRealAprovado();
      if (dadosAprovados) {
        concluirAtivacaoAssinatura(dadosAprovados);
      }
    }, 5000);

    return () => {
      supabase.removeChannel(channelAssinatura);
      clearInterval(intervaloVerificacao);
    };
  }, [barbearia?.id, modalAssinaturaOpen, concluirAtivacaoAssinatura, verificarPagamentoRealAprovado]);

  const abrirModalAssinaturaManual = () => {
    pagamentoConfirmadoRef.current = false;
    setPagamentoAprovadoBanner(false);
    setAberturaManual(true);
    setModalAssinaturaOpen(true);
    if (!pixDataMP?.paymentId && !pixDataMP?.qrCodeBase64) {
      gerarPixMercadoPago({
        transaction_amount: valorAssinatura,
        description: 'Plano Mensal Gestor - Acesso Completo',
        payer_email: user?.email || 'diemersonlimabarbosa@gmail.com',
        payer_name: barbearia?.nome || 'Gestor',
        barbeariaId: barbearia?.id
      });
    }
  };

  const verificarStatusAssinatura = (dadosBarbearia) => {
    if (!dadosBarbearia) return;

    const status = dadosBarbearia?.status_assinatura?.trim().toLowerCase();
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (status === 'ativo') {
      const dataVencStr = dadosBarbearia?.data_vencimento;
      
      if (dataVencStr) {
        const partes = dataVencStr.split('T')[0].split('-');
        const dataVencimento = new Date(partes[0], partes[1] - 1, partes[2]);
        dataVencimento.setHours(0, 0, 0, 0);

        if (dataVencimento < hoje) {
          pagamentoConfirmadoRef.current = false;
          setModalAssinaturaOpen(true);
          setAssinaturaExpirada(true);
          return;
        }
      }

      if (!pagamentoConfirmadoRef.current) {
        setModalAssinaturaOpen(false);
      }
      setAssinaturaExpirada(false);
      return;
    }

    const dataCriacaoStr = dadosBarbearia?.created_at;
    if (dataCriacaoStr) {
      const dataCriacao = new Date(dataCriacaoStr);
      dataCriacao.setHours(0, 0, 0, 0);

      const diferencaEmMilissegundos = hoje - dataCriacao;
      const diasPassados = Math.floor(diferencaEmMilissegundos / (1000 * 60 * 60 * 24));
      const restante = Math.max(0, 7 - diasPassados);

      if (typeof setDiasRestantes === 'function') {
        setDiasRestantes(restante);
      }

      if (restante <= 0) {
        pagamentoConfirmadoRef.current = false;
        setModalAssinaturaOpen(true);
        setAssinaturaExpirada(true);
      } else {
        setModalAssinaturaOpen(false);
        setAssinaturaExpirada(false);
      }
    } else {
      pagamentoConfirmadoRef.current = false;
      setModalAssinaturaOpen(true);
      setAssinaturaExpirada(true);
    }
  };

  const loadDashboardData = useCallback(async (barbeariaId) => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const [resAgendamentos, resClientes, resBarbeiros, resServicos, resDespesas, resBarbearia, resFechamentos] = await Promise.all([
        supabase.from('agendamentos').select('*, clientes(*), barbeiros(*), servicos(*)').eq('barbearia_id', barbeariaId).order('data_hora', { ascending: true }),
        supabase.from('clientes').select('*').eq('barbearia_id', barbeariaId).order('created_at', { ascending: false }),
        supabase.from('barbeiros').select('*').eq('barbearia_id', barbeariaId).order('nome', { ascending: true }),
        supabase.from('servicos').select('*').eq('barbearia_id', barbeariaId).order('nome', { ascending: true }),
        supabase.from('despesas').select('*').eq('barbearia_id', barbeariaId).order('data', { ascending: false }),
        supabase.from('barbearias').select('*').eq('id', barbeariaId).single(),
        supabase.from('fechamentos_comissoes').select('*, barbeiros(nome, foto)').eq('barbearia_id', barbeariaId).order('created_at', { ascending: false })
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
      
      if (!resFechamentos.error && resFechamentos.data) {
        setFechamentosComissoes(resFechamentos.data);
      }

      if (dadosBarbearia) {
        verificarStatusAssinatura(dadosBarbearia);
      }

    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const criarAcessoBarbeiro = async (barbeiroId, emailBarbeiro, senhaTemporaria) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const gestorSession = sessionData?.session;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailBarbeiro,
        password: senhaTemporaria,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Não foi possível criar o usuário de acesso.');
      }

      const { error: updateError } = await supabase
        .from('barbeiros')
        .update({ user_id: authData.user.id })
        .eq('id', barbeiroId);

      if (updateError) {
        throw new Error('Erro ao vincular o usuário ao barbeiro: ' + updateError.message);
      }

      if (gestorSession) {
        await supabase.auth.setSession({
          access_token: gestorSession.access_token,
          refresh_token: gestorSession.refresh_token,
        });
      }

      alert('Acesso do barbeiro criado com sucesso!');
      setOpenAcessoId(null);
      loadDashboardData(barbearia.id);
    } catch (error) {
      alert('Erro: ' + error.message);
    }
  };

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
    if (!barbearia?.id) return;

    const channel = supabase
      .channel('realtime-agendamentos-comissoes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agendamentos',
          filter: `barbearia_id=eq.${barbearia.id}`
        },
        (payload) => {
          loadDashboardData(barbearia.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [barbearia?.id, loadDashboardData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/admin');
  };

  // Processa pagamento apenas mediante comprovação real da API/Webhook (nunca libera sem status aprovado)
  const handleProcessarPagamentoMercadoPago = async (e) => {
    if (e) e.preventDefault();
    if (processandoPagamento || pagamentoConfirmadoRef.current) return;
    
    setProcessandoPagamento(true);

    try {
      const dadosAprovados = await verificarPagamentoRealAprovado();

      if (dadosAprovados) {
        concluirAtivacaoAssinatura(dadosAprovados);
      } else {
        setProcessandoPagamento(false);
        setModalFeedback({
          isOpen: true,
          tipo: 'erro',
          titulo: 'Pagamento Pendente',
          mensagem: 'Ainda não identificamos a aprovação do pagamento. Assim que o pagamento for compensado, o acesso será liberado automaticamente.'
        });
      }
    } catch (err) {
      console.error('Erro ao verificar pagamento:', err);
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

  const clientesFiltrados = clientes.filter((c) => c.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || c.telefone?.includes(searchTerm));

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center gap-3 text-stone-600 font-sans">
        <div className="w-9 h-9 border-2 border-stone-800 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold tracking-wider uppercase text-stone-500">Carregando Painel...</span>
      </div>
    );
  }

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
          <p>Carregando Painel...</p>
        </div>
      )}

      <div className="sticky top-0 z-40 w-full">
        {!assinaturaExpirada && barbearia?.status_assinatura !== 'ativo' && (
          <div className="bg-sky-600 text-white px-4 py-2 text-center text-xs font-bold flex items-center justify-center gap-2 shadow-sm z-40">
            <AlertCircle className="w-4 h-4" />
            <span>O seu período de testes gratuitos termina em {diasRestantes} {diasRestantes === 1 ? 'dia' : 'dias'}.</span>
            <button
              onClick={abrirModalAssinaturaManual}
              className="underline ml-2 hover:text-stone-200 transition-colors cursor-pointer"
            >
              Assinar via Mercado Pago agora
            </button>
          </div>
        )}

        <header className="w-full sticky top-0 z-30 md:hidden">
          <div className="w-full bg-white/90 backdrop-blur-xl border-b border-stone-200/80 px-4 py-3 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                {barbearia?.logo_url || barbearia?.foto ? (
                  <img 
                    src={barbearia?.logo_url || barbearia?.foto} 
                    alt={barbearia?.nome || 'Barbearia'} 
                    className="w-10 h-10 rounded-2xl object-cover border border-stone-200/90 shadow-xs"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-stone-900 text-white font-extrabold flex items-center justify-center text-xs shadow-xs border border-stone-800">
                    {(barbearia?.nome || 'B').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
              </div>

              <div className="flex flex-col min-w-0">
                <h1 className="font-black text-stone-900 text-sm tracking-tight truncate leading-snug">
                  {barbearia?.nome || 'Minha Barbearia'}
                </h1>
                <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                  Painel do Gestor
                </span>
              </div>
            </div>

           <div className="flex items-center gap-2 shrink-0">
              <NotificacoesBell barbeariaId={barbearia?.id} supabase={supabase} />
              <button 
                onClick={() => window.location.reload()} 
                className="w-9 h-9 rounded-full bg-white border border-stone-200/80 flex items-center justify-center text-stone-700 shadow-xs hover:bg-stone-50 transition-colors cursor-pointer"
                title="Atualizar Página"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>
      </div>

      {!esconderMenuMobilePorTeclado && (
        <nav id="menu-mobile-bottom" className="fixed bottom-0 left-0 right-0 z-40 md:hidden pb-safe transition-opacity duration-150">
          <div className="bg-white border-t border-slate-200/80 shadow-[0_-8px_25px_rgba(0,0,0,0.08)] rounded-t-[1.75rem] px-3 pt-2 pb-3 relative">
            <div className="grid grid-cols-5 items-center justify-items-center max-w-md mx-auto">

              <button
                type="button"
                onClick={() => setActiveTab('financeiro')}
                className={`flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'financeiro' ? 'text-slate-900 font-extrabold' : 'text-slate-500 font-medium hover:text-slate-800'
                }`}
              >
                <TrendingUp className={`w-5 h-5 ${activeTab === 'financeiro' ? 'text-slate-900 stroke-[2.5]' : 'text-slate-500'}`} />
                <span className="text-[10px] tracking-tight">Financeiro</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('agendamentos')}
                className={`flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'agendamentos' ? 'text-slate-900 font-extrabold' : 'text-slate-500 font-medium hover:text-slate-800'
                }`}
              >
                <Calendar className={`w-5 h-5 ${activeTab === 'agendamentos' ? 'text-slate-900 stroke-[2.5]' : 'text-slate-500'}`} />
                <span className="text-[10px] tracking-tight">Agenda</span>
              </button>

              <div className="relative -top-5 flex flex-col items-center justify-center">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className={`w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg transition-all active:scale-90 cursor-pointer border-[3.5px] border-white ring-2 ${
                    mobileMenuOpen ? 'ring-slate-900 bg-black scale-105' : 'ring-slate-200 hover:bg-black'
                  }`}
                  aria-label="Abrir Menu de Apps"
                >
                  <Menu className={`w-6 h-6 text-white transition-transform duration-200 ${mobileMenuOpen ? 'rotate-90' : ''}`} />
                </button>
                <span className="text-[10px] pt-2 font-extrabold text-slate-800 tracking-tight">
                  Menu
                </span>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('fidelidade')}
                className={`flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'fidelidade' ? 'text-slate-900 font-extrabold' : 'text-slate-500 font-medium hover:text-slate-800'
                }`}
              >
                <Users className={`w-5 h-5 ${activeTab === 'fidelidade' ? 'text-slate-900 stroke-[2.5]' : 'text-slate-500'}`} />
                <span className="text-[10px] tracking-tight">Clientes</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('configuracoes')}
                className={`flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'configuracoes' ? 'text-slate-900 font-extrabold' : 'text-slate-500 font-medium hover:text-slate-800'
                }`}
              >
                <Settings className={`w-5 h-5 ${activeTab === 'configuracoes' ? 'text-slate-900 stroke-[2.5]' : 'text-slate-500'}`} />
                <span className="text-[10px] tracking-tight">Ajustes</span>
              </button>

            </div>
          </div>
        </nav>
      )}

      {mobileMenuOpen && !esconderMenuMobilePorTeclado && (
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
                { id: 'fidelidade', label: 'Clientes', icon: Users, action: () => setActiveTab('fidelidade') },
                { id: 'configuracoes', label: 'Configurações', icon: Settings, action: () => setActiveTab('configuracoes') },
                { id: 'despesas', label: 'Despesas', icon: TrendingDown, action: () => setActiveTab('despesas') },
                { id: 'comissoes', label: 'Comissões', icon: Percent, action: () => setActiveTab('comissoes') },
                { id: 'servicos', label: 'Equipe', icon: Scissors, action: () => setActiveTab('servicos') },
                { id: 'assinatura', label: 'Assinatura', icon: ClipboardPenLine, action: () => setModalInfoAssinaturaOpen(true) },
                { id: 'pdv', label: 'PDV', icon: ShoppingCart, action: () => setActiveTab('pdv') },
                { id: 'produtos', label: 'Produtos', icon: ShoppingBag, action: () => setActiveTab('produtos') },
                { id: 'suporte', label: 'Suporte', icon: MessageCircleCheck, isLink: true, href: "https://wa.me/5542998040396?text=Olá,%20preciso%20de%20suporte%20com%20o%20sistema%20AgendaSoft." },
                { id: 'logout', label: 'Sair', icon: LogOut, action: handleLogout, isLogout: true },
              ].map((item) => {
                const IconComponent = item.icon;
                const isCurrentActive = activeTab === item.id;
                
                let buttonStyle = {};
                if (item.isLogout) {
                  buttonStyle = {
                    background: 'linear-gradient(135deg, #9b1c2e 0%, #70121f 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.15)'
                  };
                } else if (isCurrentActive) {
                  buttonStyle = {
                    background: 'linear-gradient(135deg, #18181b 0%, #09090b 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  };
                } else {
                  buttonStyle = {
                    background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
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
              {pagamentoAprovadoBanner ? (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-3 animate-in fade-in zoom-in-95 duration-200">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-black text-stone-900">Pagamento Confirmado!</h3>
                  <p className="text-xs text-stone-500 max-w-xs">
                    Sua assinatura foi renovada com sucesso. Liberando acesso ao painel...
                  </p>
                </div>
              ) : (
                <>
                  <div className="w-full flex flex-col items-center text-center space-y-2 pb-3 border-b border-stone-100">
                    <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-inner mx-auto">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div className="w-full space-y-0.5 text-center">
                      <h2 className="text-lg font-extrabold text-stone-900 w-full text-center">Período de Teste Finalizado</h2>
                      <p className="text-[11px] sm:text-xs text-stone-500 leading-relaxed w-full text-center px-2">
                        Os seus 7 dias gratuitos expiraram. Para liberar o acesso completo ao painel, efetue o pagamento abaixo.
                      </p>
                    </div>
                  </div>

                  <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 w-full text-center space-y-1">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Plano Mensal Gestor</span>
                    <div className="flex justify-between items-center px-1">
                      <span className="text-stone-700 text-xs font-medium">Acesso Completo</span>
                      <span className="text-sm sm:text-base font-extrabold text-stone-900">R$ {valorAssinatura?.toFixed(2).replace('.', ',')} / mês</span>
                    </div>
                  </div>

                  <div className="w-full flex flex-col items-center space-y-3" onClick={(e) => e.stopPropagation()}>
                    {pixDataMP?.qrCodeBase64 ? (
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

                        <div className="w-full py-2.5 px-3 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center justify-center gap-2 text-sky-800 text-[11px] font-semibold mt-1">
                          <div className="w-3.5 h-3.5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin shrink-0" />
                          <span>Aguardando confirmação automática do pagamento...</span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 flex flex-col items-center justify-center gap-2 text-stone-400">
                        <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs">
                          {gerandoPix ? 'A gerar Pix seguro via Mercado Pago...' : 'Preparando QR Code Pix...'}
                        </span>
                        {!gerandoPix && (
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              gerarPixMercadoPago({
                                transaction_amount: valorAssinatura,
                                description: 'Plano Mensal Gestor - Acesso Completo',
                                payer_email: user?.email || 'diemersonlimabarbosa@gmail.com',
                                payer_name: barbearia?.nome || 'Gestor',
                                barbeariaId: barbearia?.id
                              });
                            }}
                            className="mt-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                          >
                            Gerar Pix de Pagamento
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1">
        <aside 
          className="hidden md:flex flex-col w-72 p-5 select-none shrink-0 fixed left-0 top-0 h-screen overflow-y-auto justify-between border-r border-slate-200 z-40 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-slate-50 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full"
          style={{
            background: '#ffffff',
            boxShadow: '10px 0 40px rgba(0, 0, 0, 0.03), inset -1px 0 0 rgba(0, 0, 0, 0.05)'
          }}
        >
          <div className="space-y-5 w-full">
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
                { id: 'produtos', label: 'Produtos & Stock', icon: ShoppingBag },
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

        <main className="flex-1 md:ml-72 max-w-7xl mx-auto px-2 sm:px-0 pt-3 sm:pt-4 md:p-10 pb-24 w-full min-w-0">
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
                    placeholder="Pesquisar por nome ou tel..."
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

          {activeTab === 'comissoes' && (() => {
            const listaAgendamentos = Array.isArray(agendamentos) ? agendamentos : [];
            const agendamentosValidosComissao = listaAgendamentos.filter(item => {
              const status = (item.status || '').toLowerCase();
              const ehConcluido = status === 'concluido' || status === 'concluida' || status === 'realizado' || status === 'finalizado';
              return ehConcluido;
            }).sort((a, b) => {
              const dataA = new Date(a.data_hora || a.created_at || 0);
              const dataB = new Date(b.data_hora || b.created_at || 0);
              return dataA - dataB;
            });

            const dadosComissaoProfissionais = barbeiros.map((b) => {
              const atendimentosBarb = agendamentosValidosComissao.filter((ag) => {
                const idMatch = String(ag.barbeiro_id || ag.profissional_id) === String(b.id);
                const nomeAg = (ag.barbeiro_nome || ag.profissional_nome || ag.barbeiros?.nome || '').trim().toLowerCase();
                const nomeBarb = (b.nome || '').trim().toLowerCase();
                const nomeMatch = nomeAg && nomeBarb && nomeAg === nomeBarb;
                return idMatch || nomeMatch;
              });

              const fechamentosAnteriores = fechamentosComissoes.filter(
                (f) => String(f.barbeiro_id) === String(b.id) && f.status === 'pago'
              );

              const idsQuitados = new Set();
              fechamentosAnteriores.forEach(f => {
                if (Array.isArray(f.atendimentos_ids)) {
                  f.atendimentos_ids.forEach(id => idsQuitados.add(String(id)));
                }
              });

              const atendimentosPendentes = atendimentosBarb.filter(ag => !idsQuitados.has(String(ag.id)));
              const totalAtendQuitado = fechamentosAnteriores.reduce((acc, f) => acc + Number(f.qtd_atendimentos || 0), 0);
              const listaFinalPendentes = atendimentosPendentes.length > 0 || idsQuitados.size > 0
                ? atendimentosPendentes 
                : atendimentosBarb.slice(totalAtendQuitado);

              const faturamentoBruto = listaFinalPendentes.reduce(
                (acc, ag) => {
                  const val = ag.valor_total || ag.servicos?.preco || ag.valor || ag.preco || ag.total || 0;
                  return acc + Number(val);
                },
                0
              );

              const qtdAtendimentos = listaFinalPendentes.length;
              const taxaCrua = b.taxa_comissao ?? b.comissao_padrao ?? b.comissao ?? 50;
              const porcentagem = Number(taxaCrua) <= 1 ? Number(taxaCrua) * 100 : Number(taxaCrua);
              
              const valorComissao = (faturamentoBruto * porcentagem) / 100;
              const jaQuitado = qtdAtendimentos === 0;

              return {
                ...b,
                atendimentosLista: listaFinalPendentes,
                qtdAtendimentos,
                faturamentoBruto,
                porcentagem,
                valorComissao,
                valorComissaoCalculado: valorComissao,
                jaQuitado
              };
            });

            const totalGeralFat = dadosComissaoProfissionais.reduce((acc, b) => acc + b.faturamentoBruto, 0);
            const totalPendente = dadosComissaoProfissionais.filter(b => !b.jaQuitado).reduce((acc, b) => acc + b.valorComissao, 0);
            
            const mesAtualStr = new Date().toISOString().split('T')[0].substring(0, 7);
            const totalComissoesPagas = fechamentosComissoes
              .filter(f => {
                const dataRef = f.created_at || f.data || '';
                return dataRef.startsWith(mesAtualStr) && f.status === 'pago';
              })
              .reduce((acc, f) => acc + Number(f.valor_comissao || 0), 0);

            return (
              <div className="max-w-7xl mx-auto px-2 sm:px-0 space-y-4 pb-24 font-sans select-none animate-in fade-in duration-200">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                  <div 
                    className="relative rounded-3xl p-4 sm:p-5 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
                      boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.8)'
                    }}
                  >
                    <div className="flex flex-col justify-center min-w-0 pr-2">
                      <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider truncate block">Comissão Pendente</span>
                      <h1 className="text-lg sm:text-xl font-black text-white mt-0.5 truncate">R$ {totalPendente.toFixed(0)}</h1>
                    </div>
                    <div 
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)',
                        boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 1), inset 0 -4px 6px rgba(0, 0, 0, 0.25)',
                        border: '1px solid rgba(255, 255, 255, 0.9)'
                      }}
                    >
                      <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
                    </div>
                  </div>

                  <div 
                    className="relative rounded-3xl p-4 sm:p-5 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
                      boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.8)'
                    }}
                  >
                    <div className="flex flex-col justify-center min-w-0 pr-2">
                      <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider truncate block">Fat. Pendente Equipe</span>
                      <h3 className="text-lg sm:text-xl font-black text-white mt-0.5 truncate">R$ {totalGeralFat.toFixed(0)}</h3>
                    </div>
                    <div 
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)',
                        boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 1), inset 0 -4px 6px rgba(0, 0, 0, 0.25)',
                        border: '1px solid rgba(255, 255, 255, 0.9)'
                      }}
                    >
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
                    </div>
                  </div>

                  <div 
                    className="relative rounded-3xl p-4 sm:p-5 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
                      boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.8)'
                    }}
                  >
                    <div className="flex flex-col justify-center min-w-0 pr-2">
                      <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider truncate block">Comissões Pagas</span>
                      <h3 className="text-lg sm:text-xl font-black text-emerald-400 mt-0.5 truncate">R$ {totalComissoesPagas.toFixed(0)}</h3>
                    </div>
                    <div 
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)',
                        boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 1), inset 0 -4px 6px rgba(0, 0, 0, 0.25)',
                        border: '1px solid rgba(255, 255, 255, 0.9)'
                      }}
                    >
                      <CheckCheck className="w-4 h-4 sm:w-5 sm:h-5 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
                    </div>
                  </div>

                  <button
                    type='button'
                    onClick={() => setModalHistoricoFechamentos(true)}
                    className="relative rounded-3xl p-4 sm:p-5 flex items-center justify-between border border-stone-200/80 bg-white transition-all cursor-pointer group min-w-0 overflow-hidden shadow-xs hover:shadow-sm text-left"
                  >
                    <div className="flex flex-col justify-center min-w-0 pr-2">
                      <span className="text-[9px] font-extrabold text-stone-400 uppercase tracking-wider truncate block">Registros</span>
                      <span className="text-lg sm:text-xl font-black text-stone-900 mt-0.5 truncate block">Ver Histórico</span>
                    </div>
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#222222] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <History className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </button>
                </div>

                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <div className="relative w-full">
                      <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Filtrar por nome do barbeiro..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs text-stone-900 focus:outline-none font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-stone-100 rounded-3xl p-4 sm:p-6 border border-stone-300 shadow-inner space-y-3.5">
                  {dadosComissaoProfissionais.length === 0 ? (
                    <div className="text-center py-10 text-stone-500 text-xs font-bold">Nenhum profissional encontrado.</div>
                  ) : (
                    dadosComissaoProfissionais
                      .filter((b) => b.nome.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((barbeiro) => (
                        <div key={barbeiro.id} className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-xs space-y-3">
                          <div className="flex items-center justify-between gap-3 pb-3 border-b border-stone-100">
                            <div className="flex items-center gap-3">
                              {barbeiro.foto ? (
                                <img src={barbeiro.foto} alt={barbeiro.nome} className="w-10 h-10 rounded-xl object-cover border" />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-stone-900 text-white font-black flex items-center justify-center text-xs">
                                  {barbeiro.nome.charAt(0)}
                                </div>
                              )}
                              <div>
                                <h4 className="text-xs sm:text-sm font-black text-stone-900">{barbeiro.nome}</h4>
                                <span className="text-[10px] text-stone-500">{barbeiro.especialidade || 'Profissional'}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <div className="relative flex items-center">
                                <input
                                  type="number"
                                  defaultValue={barbeiro.porcentagem}
                                  id={`comissao-input-${barbeiro.id}`}
                                  className="w-14 px-2 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-black text-center"
                                />
                                <span className="absolute right-2 text-[10px] font-bold text-stone-400 pointer-events-none">%</span>
                              </div>

                              <button
                                onClick={async () => {
                                  const val = Number(document.getElementById(`comissao-input-${barbeiro.id}`).value);
                                  const { error } = await supabase
                                    .from('barbeiros')
                                    .update({ taxa_comissao: val, comissao_padrao: val })
                                    .eq('id', barbeiro.id);

                                  if (!error) {
                                    alert('Comissão atualizada com sucesso!');
                                    loadDashboardData(barbearia.id);
                                  } else {
                                    alert('Erro ao atualizar: ' + error.message);
                                  }
                                }}
                                className="px-3 py-1.5 bg-stone-900 text-white text-[10px] font-black uppercase rounded-xl cursor-pointer"
                              >
                                Salvar
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs">
                            <div>
                              <span className="text-[9px] font-black text-stone-400 uppercase block">Atendimentos</span>
                              <span className="font-black text-stone-900">{barbeiro.qtdAtendimentos} serviços</span>
                            </div>
                            <div>
                              <span className="text-[9px] font-black text-stone-400 uppercase block">Fat. Bruto Pendente</span>
                              <span className="font-black text-stone-900">R$ {barbeiro.faturamentoBruto.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-[9px] font-black text-stone-400 uppercase block">Comissão ({barbeiro.porcentagem}%)</span>
                              <span className="font-black text-emerald-600">R$ {barbeiro.valorComissao.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-[9px] font-black text-stone-400 uppercase block">Status</span>
                              {barbeiro.jaQuitado ? (
                                <span className="text-emerald-700 font-bold text-[10px]">Pagamento Efetuado</span>
                              ) : (
                                <span className="text-amber-600 font-bold text-[10px]">Pagamento Pendente</span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                              onClick={() => setModalExtratoBarbeiro(barbeiro)}
                              className="py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold rounded-xl cursor-pointer"
                            >
                              Ver Extrato
                            </button>
                            <button
                              onClick={() => {
                                const valorParaQuitar = (barbeiro.faturamentoBruto * barbeiro.porcentagem) / 100;
                                if (valorParaQuitar <= 0) {
                                  setModalFeedback({
                                    isOpen: true,
                                    tipo: 'erro',
                                    titulo: 'Atenção',
                                    mensagem: 'Não há comissões pendentes para este profissional no momento.'
                                  });
                                  return;
                                }

                                setModalConfirmacao({
                                  isOpen: true,
                                  titulo: 'Confirmar Pagamento de Comissão',
                                  descricao: `Deseja prosseguir com o pagamento de R$ ${valorParaQuitar.toFixed(2)} referente a ${barbeiro.qtdAtendimentos} atendimento(s) concluído(s) para ${barbeiro.nome}?`,
                                  onConfirm: async () => {
                                    const periodoAtualStr = new Date().toISOString().split('T')[0].substring(0, 7);
                                    const idsAtendimentosAtuais = (barbeiro.atendimentosLista || []).map(ag => ag.id);

                                    const novoFechamento = {
                                      barbearia_id: barbearia.id,
                                      barbeiro_id: barbeiro.id,
                                      periodo_referencia: periodoAtualStr,
                                      valor_bruto: barbeiro.faturamentoBruto,
                                      porcentagem_aplicada: barbeiro.porcentagem,
                                      valor_comissao: valorParaQuitar,
                                      qtd_atendimentos: barbeiro.qtdAtendimentos,
                                      atendimentos_ids: idsAtendimentosAtuais,
                                      status: 'pago'
                                    };

                                    const { data, error } = await supabase.from('fechamentos_comissoes').insert([novoFechamento]).select();

                                    if (error) {
                                      setModalFeedback({
                                        isOpen: true,
                                        tipo: 'erro',
                                        titulo: 'Erro na Operação',
                                        mensagem: 'Não foi possível registrar o acerto: ' + error.message
                                      });
                                    } else {
                                      setFechamentosComissoes(prev => [
                                        { ...novoFechamento, id: data?.[0]?.id || Date.now(), created_at: new Date().toISOString(), barbeiros: { nome: barbeiro.nome, foto: barbeiro.foto } },
                                        ...prev
                                      ]);
                                      
                                      setModalFeedback({
                                        isOpen: true,
                                        tipo: 'sucesso',
                                        titulo: 'Pagamento Concluído',
                                        mensagem: 'O pagamento de comissão foi registrado e salvo no histórico com êxito.'
                                      });
                                      
                                      loadDashboardData(barbearia.id);
                                    }
                                  }
                                });
                              }}
                              disabled={barbeiro.faturamentoBruto <= 0 || barbeiro.jaQuitado}
                              className="py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-40"
                            >
                              {barbeiro.jaQuitado ? 'Quitado' : 'Pagar'}
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            );
          })()}

          {activeTab === 'despesas' && (() => {
            const despesasFiltradas = despesas.filter(d => {
              if (!filtroMesDespesas) return true;
              const dataDespesa = d.data || d.created_at || '';
              return dataDespesa.startsWith(filtroMesDespesas);
            });

            const totalDespesasFiltradas = despesasFiltradas.reduce((acc, d) => acc + Number(d.valor || 0), 0);

            const listaMeses = [
              { id: '', label: 'Todos' },
              { id: '2026-01', label: 'Jan' },
              { id: '2026-02', label: 'Fev' },
              { id: '2026-03', label: 'Mar' },
              { id: '2026-04', label: 'Abr' },
              { id: '2026-05', label: 'Mai' },
              { id: '2026-06', label: 'Jun' },
              { id: '2026-07', label: 'Jul' },
              { id: '2026-08', label: 'Ago' },
              { id: '2026-09', label: 'Set' },
              { id: '2026-10', label: 'Out' },
              { id: '2026-11', label: 'Nov' },
              { id: '2026-12', label: 'Dez' },
            ];

            return (
              <div className="max-w-7xl mx-auto px-2 sm:px-0 space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div 
                    className="relative rounded-3xl p-4 sm:p-5 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
                      boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.8)'
                    }}
                  >
                    <div className="flex flex-col justify-center min-w-0 pr-2">
                      <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider truncate block">Total em Despesas</span>
                      <h3 className="text-lg sm:text-xl font-black text-white mt-0.5 truncate">
                        R$ {totalDespesasFiltradas.toFixed(0)}
                      </h3>
                    </div>
                    <div 
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)',
                        boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 1), inset 0 -4px 6px rgba(0, 0, 0, 0.25)',
                        border: '1px solid rgba(255, 255, 255, 0.9)'
                      }}
                    >
                      <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
                    </div>
                  </div>

                  <div 
                    className="relative rounded-3xl p-4 sm:p-5 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
                      boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.8)'
                    }}
                  >
                    <div className="flex flex-col justify-center min-w-0 pr-2">
                      <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider truncate block">Registros</span>
                      <h3 className="text-lg sm:text-xl font-black text-white mt-0.5 truncate">{despesasFiltradas.length}</h3>
                    </div>
                    <div 
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)',
                        boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 1), inset 0 -4px 6px rgba(0, 0, 0, 0.25)',
                        border: '1px solid rgba(255, 255, 255, 0.9)'
                      }}
                    >
                      <History className="w-4 h-4 sm:w-5 sm:h-5 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
                    </div>
                  </div>
                </div>

                <div 
                  className="relative rounded-3xl p-4 sm:p-5 border border-white/80 overflow-hidden shadow-xs flex items-center justify-between gap-4"
                  style={{
                    background: 'linear-gradient(135deg, #f7f9f8 0%, #edf1f0 50%, #e2e8e6 100%)',
                    boxShadow: '0 15px 30px rgba(0, 0, 0, 0.05), inset 0 2px 4px rgba(255, 255, 255, 0.9), inset 0 -3px 6px rgba(0, 0, 0, 0.03)'
                  }}
                >
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-stone-900">Controle Operacional</h3>
                    <p className="text-[10px] sm:text-xs text-stone-500 font-medium">Filtre por mês ou adicione novos gastos.</p>
                  </div>
                  <button
                    onClick={() => handleOpenDespesaModal()}
                    className="px-5 py-3 bg-stone-900 hover:bg-black text-white font-black text-xs rounded-2xl shadow-xs transition-all cursor-pointer flex items-center gap-2 active:scale-95 shrink-0"
                  >
                    <Plus className="w-4 h-4 text-amber-400" />
                    <span>Nova Despesa</span>
                  </button>
                </div>

                <div ref={scrollRef} className="bg-white rounded-3xl p-3 border border-stone-200/90 shadow-xs">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {listaMeses.map((m) => {
                      const selecionado = filtroMesDespesas === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          data-selecionado={selecionado}
                          onClick={() => setFiltroMesDespesas(m.id)}
                          className={`px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                            selecionado
                              ? 'bg-stone-900 text-white shadow-md scale-105'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                          }`}
                        >
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-4 sm:p-6 border border-stone-200/90 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100 px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-stone-900" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-stone-900">Histórico de Gastos</h3>
                    </div>
                    <span className="text-[11px] font-bold text-stone-700 bg-stone-50 px-2.5 py-1 rounded-xl border border-stone-200 shadow-2xs">
                      {despesasFiltradas.length} {despesasFiltradas.length === 1 ? 'item' : 'itens'}
                    </span>
                  </div>

                  {despesasFiltradas.length === 0 ? (
                    <div className="text-center py-10 text-stone-400 text-[11px] font-bold uppercase tracking-wider">
                      Nenhuma despesa encontrada para este período.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {despesasFiltradas.map((d) => (
                        <div 
                          key={d.id} 
                          className="p-3.5 bg-stone-50/80 hover:bg-stone-50 rounded-2xl border border-stone-200/70 flex items-center justify-between gap-3 transition-all"
                        >
                          <div className="min-w-0 space-y-0.5">
                            <h4 className="text-xs sm:text-sm font-black text-stone-900 truncate">{d.descricao}</h4>
                            <span className="text-[10px] text-stone-500 font-semibold block">{formatarData(d)}</span>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs sm:text-sm font-black text-rose-600">
                              - R$ {Number(d.valor).toFixed(2)}
                            </span>
                            
                            <div className="flex items-center gap-1 border-l border-stone-200 pl-2.5">
                              <button 
                                onClick={() => handleOpenDespesaModal(d)} 
                                className="w-7 h-7 rounded-lg bg-white hover:bg-stone-100 text-stone-700 flex items-center justify-center border border-stone-200 transition-all cursor-pointer shadow-2xs"
                                title="Editar"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteDespesa(d.id)} 
                                className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center border border-rose-200 transition-all cursor-pointer shadow-2xs"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {activeTab === 'servicos' && (
            <div className="max-w-7xl mx-auto px-2 sm:px-0 space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div 
                  className="relative rounded-3xl p-4 sm:p-5 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
                    boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.8)'
                  }}
                >
                  <div className="flex flex-col justify-center min-w-0 pr-2">
                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider truncate block">Total Serviços</span>
                    <h3 className="text-lg sm:text-xl font-black text-white mt-0.5 truncate">{servicos.length}</h3>
                  </div>
                  <div 
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)',
                      boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 1), inset 0 -4px 6px rgba(0, 0, 0, 0.25)',
                      border: '1px solid rgba(255, 255, 255, 0.9)'
                    }}
                  >
                    <Scissors className="w-4 h-4 sm:w-5 sm:h-5 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
                  </div>
                </div>

                <div 
                  className="relative rounded-3xl p-4 sm:p-5 flex items-center justify-between border border-stone-700/50 min-w-0 overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #222222 0%, #111111 50%, #050505 100%)',
                    boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.8)'
                  }}
                >
                  <div className="flex flex-col justify-center min-w-0 pr-2">
                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider truncate block">Total Equipe</span>
                    <h3 className="text-lg sm:text-xl font-black text-white mt-0.5 truncate">{barbeiros.length}</h3>
                  </div>
                  <div 
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8e2ec 60%, #9fb3c8 100%)',
                      boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 1), inset 0 -4px 6px rgba(0, 0, 0, 0.25)',
                      border: '1px solid rgba(255, 255, 255, 0.9)'
                    }}
                  >
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-2 border border-stone-200/90 shadow-xs flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSubTabEquipe('servicos')}
                  className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    subTabEquipe === 'servicos'
                      ? 'bg-stone-900 text-white shadow-md scale-[1.01]'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                  }`}
                >
                  <Scissors className="w-4 h-4" />
                  <span>Serviços </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSubTabEquipe('barbeiros')}
                  className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    subTabEquipe === 'barbeiros'
                      ? 'bg-stone-900 text-white shadow-md scale-[1.01]'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Equipe</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Pesquisar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200/90 rounded-2xl text-xs text-stone-900 focus:outline-none font-medium shadow-2xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (subTabEquipe === 'servicos') {
                      handleOpenServicoModal();
                    } else {
                      handleOpenBarbeiroModal();
                    }
                  }}
                  className="px-5 py-3 bg-stone-900 hover:bg-black text-white font-black text-xs rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 border border-stone-800 shrink-0"
                >
                  <Plus className="w-4 h-4 text-stone-300" />
                  <span>{subTabEquipe === 'servicos' ? 'Adicionar' : 'Adicionar'}</span>
                </button>
              </div>

              {subTabEquipe === 'servicos' && (
                <div className="space-y-3">
                  {servicos.length === 0 ? (
                    <div className="bg-white rounded-3xl p-10 text-center text-stone-400 border border-stone-200 text-xs font-bold uppercase tracking-wider">
                      Nenhum serviço cadastrado.
                    </div>
                  ) : (
                    servicos.map((s) => (
                      <div 
                        key={s.id} 
                        className="bg-white rounded-3xl p-5 border border-stone-200/90 shadow-xs hover:shadow-sm transition-all flex flex-col space-y-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-12 h-12 rounded-full bg-stone-50 border border-stone-200 text-stone-800 flex items-center justify-center shrink-0 shadow-2xs">
                              <Scissors className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 space-y-0.5">
                              <h4 className="text-xs sm:text-sm font-black text-stone-900 truncate tracking-tight">{s.nome}</h4>
                              <div className="flex items-center gap-1.5 text-[11px] text-stone-500 font-medium">
                                <Clock className="w-3.5 h-3.5 text-stone-400" />
                                <span>{s.duracao_minutos || 60} minutos</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button 
                              type="button"
                              onClick={() => handleOpenServicoModal(s)} 
                              className="w-8 h-8 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-700 flex items-center justify-center border border-stone-200/80 transition-all cursor-pointer shadow-2xs"
                              title="Editar"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              type="button"
                              onClick={() => handleDeleteServico(s.id)} 
                              className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center border border-rose-200/80 transition-all cursor-pointer shadow-2xs"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="pt-3.5 border-t border-stone-100 flex items-center justify-between">
                          <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Valor do Atendimento</span>
                          <span className="text-sm sm:text-base font-black text-stone-900 tracking-tight">
                            R$ {Number(s.preco).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {subTabEquipe === 'barbeiros' && (
                <div className="space-y-3">
                  {barbeiros.length === 0 ? (
                    <div className="bg-white rounded-3xl p-10 text-center text-stone-400 border border-stone-200 text-xs font-bold uppercase tracking-wider">
                      Nenhum profissional cadastrado.
                    </div>
                  ) : (
                    barbeiros.map((b) => {
                      const isMenuAcessoAberto = openAcessoId === b.id;

                      return (
                        <div 
                          key={b.id} 
                          className="bg-white rounded-3xl p-5 border border-stone-200/90 shadow-xs hover:shadow-sm transition-all space-y-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="relative shrink-0">
                                {b.foto ? (
                                  <img 
                                    src={b.foto} 
                                    alt={b.nome} 
                                    className="w-12 h-12 rounded-full object-cover border border-stone-200 shadow-2xs" 
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-stone-900 text-white font-black flex items-center justify-center text-xs shadow-2xs">
                                    {(b.nome || 'P').charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                              </div>

                              <div className="min-w-0 space-y-0.5">
                                <h4 className="font-black text-stone-900 text-xs sm:text-sm tracking-tight truncate">{b.nome}</h4>
                                <span className="text-[11px] text-stone-500 font-semibold block truncate">{b.especialidade || 'Profissional'}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button 
                                type="button"
                                onClick={() => handleOpenBarbeiroModal(b)} 
                                className="w-8 h-8 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-700 flex items-center justify-center border border-stone-200/85 transition-all cursor-pointer shadow-2xs"
                                title="Editar"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleDeleteBarbeiro(b.id)} 
                                className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center border border-rose-200/85 transition-all cursor-pointer shadow-2xs"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                            <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Taxa de Comissão</span>
                            <span className="text-xs sm:text-sm font-black text-stone-900">
                              {b.taxa_comissao || 50}%
                            </span>
                          </div>

                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => setOpenAcessoId(isMenuAcessoAberto ? null : b.id)}
                              className="w-full px-3.5 py-2.5 bg-stone-50 hover:bg-stone-100 rounded-2xl flex items-center justify-between text-xs font-bold text-stone-700 cursor-pointer transition-colors"
                            >
                              <span className="flex items-center gap-2">
                                <KeyRound className="w-3.5 h-3.5 text-stone-500" />
                                <span>Gerar Acesso ao Painel</span>
                              </span>
                              <ChevronDown className={`w-4 h-4 transition-transform ${isMenuAcessoAberto ? 'rotate-180' : ''}`} />
                            </button>

                            {isMenuAcessoAberto && (
                              <div className="p-3.5 mt-2 space-y-2.5 bg-stone-50/85 rounded-2xl border border-stone-200/80">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-stone-500">E-mail do Barbeiro</label>
                                  <input 
                                    type="email" 
                                    placeholder="barbeiro@exemplo.com" 
                                    id={`email-${b.id}`}
                                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none font-medium"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-stone-500">Senha Temporária</label>
                                  <input 
                                    type="password" 
                                    placeholder="••••••••" 
                                    id={`senha-${b.id}`}
                                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none font-medium"
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const emailInput = document.getElementById(`email-${b.id}`).value;
                                    const senhaInput = document.getElementById(`senha-${b.id}`).value;

                                    if (!emailInput || !senhaInput) {
                                      alert('Preencha o e-mail e a senha.');
                                      return;
                                    }

                                    criarAcessoBarbeiro(b.id, emailInput, senhaInput);
                                  }}
                                  className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs mt-1"
                                >
                                  Criar Credenciais
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
          
        </main>
      </div>

      {modalHistoricoFechamentos && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full border border-stone-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 shrink-0">
              <div>
                <h3 className="text-sm font-black text-stone-900">Histórico de Comissões Pagas</h3>
                <p className="text-[11px] text-stone-500">Registros de fechamentos realizados</p>
              </div>
              <button
                type="button"
                onClick={() => setModalHistoricoFechamentos(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
              {(!Array.isArray(fechamentosComissoes) || fechamentosComissoes.length === 0) ? (
                <div className="text-center py-10 text-stone-400 text-xs font-bold">
                  Nenhum pagamento de comissão registrado ainda.
                </div>
              ) : (
                fechamentosComissoes.map((item, idx) => {
                  const barbRel = Array.isArray(item.barbeiros) ? item.barbeiros[0] : item.barbeiros;
                  const barbLista = Array.isArray(barbeiros)
                    ? barbeiros.find((b) => String(b.id) === String(item.barbeiro_id))
                    : null;

                  const nomeProf = barbRel?.nome || barbLista?.nome || item.barbeiro_nome || 'Profissional';
                  const fotoProf = barbRel?.foto || barbLista?.foto || null;
                  const valorPago = Number(item.valor_comissao || 0).toFixed(2);
                  const valorBruto = Number(item.valor_bruto || 0).toFixed(2);
                  const qtd = Number(item.qtd_atendimentos || 0);
                  const pct = Number(item.porcentagem_aplicada || 0);

                  let dataFormatada = item.periodo_referencia || '';
                  const rawDate = item.created_at || item.data;
                  if (rawDate) {
                    const d = new Date(rawDate);
                    if (!Number.isNaN(d.getTime())) {
                      dataFormatada = d.toLocaleDateString('pt-BR');
                    }
                  }

                  return (
                    <div
                      key={item.id || idx}
                      className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {fotoProf ? (
                          <img src={fotoProf} alt={nomeProf} className="w-9 h-9 rounded-xl object-cover border shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-stone-900 text-white font-black flex items-center justify-center text-xs shrink-0">
                            {nomeProf.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-black text-stone-900 truncate">{nomeProf}</p>
                          <p className="text-[10px] text-stone-500">
                            {dataFormatada ? `${dataFormatada} • ` : ''}
                            {qtd} atendimento(s) ({pct}%)
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-emerald-600 block">R$ {valorPago}</span>
                        <span className="text-[9px] text-stone-400">Bruto: R$ {valorBruto}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button
              type="button"
              onClick={() => setModalHistoricoFechamentos(false)}
              className="w-full py-2.5 rounded-2xl bg-stone-900 text-white text-xs font-black cursor-pointer shrink-0"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {modalConfirmacao.isOpen && (
        <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
          <div className="bg-white rounded-[2rem] max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-5 text-center">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <AlertCircle className="w-6 h-6" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-base font-black text-stone-900">{modalConfirmacao.titulo}</h3>
              <p className="text-xs text-stone-500 leading-relaxed px-2">
                {modalConfirmacao.descricao}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setModalConfirmacao({ isOpen: false, titulo: '', descricao: '', onConfirm: null })}
                className="py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const acao = modalConfirmacao.onConfirm;
                  setModalConfirmacao({ isOpen: false, titulo: '', descricao: '', onConfirm: null });
                  if (acao) acao();
                }}
                className="py-3 bg-stone-900 hover:bg-black text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-md"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalFeedback.isOpen && (
        <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
          <div className="bg-white rounded-[2rem] max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-5 text-center">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto shadow-inner ${
              modalFeedback.tipo === 'sucesso' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              {modalFeedback.tipo === 'sucesso' ? <CheckCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-base font-black text-stone-900">{modalFeedback.titulo}</h3>
              <p className="text-xs text-stone-500 leading-relaxed px-2">
                {modalFeedback.mensagem}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setModalFeedback({ isOpen: false, tipo: 'sucesso', titulo: '', mensagem: '' })}
              className="w-full py-3 bg-stone-900 hover:bg-black text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-md"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {modalExtratoBarbeiro && (() => {
        const atendimentosPendentes = modalExtratoBarbeiro.atendimentosLista || [];
        const fatBrutoPendente = atendimentosPendentes.reduce((acc, ag) => acc + Number(ag.valor_total || ag.servicos?.preco || ag.valor || 0), 0);

        return (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-stone-200 space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-3 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  {modalExtratoBarbeiro.foto ? (
                    <img src={modalExtratoBarbeiro.foto} alt={modalExtratoBarbeiro.nome} className="w-10 h-10 rounded-xl object-cover border" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-stone-900 text-white font-black flex items-center justify-center text-xs">
                      {modalExtratoBarbeiro.nome.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-extrabold text-stone-900 text-base">Extrato a Pagar</h3>
                    <p className="text-[11px] text-stone-500">{modalExtratoBarbeiro.nome} • Ciclo Pendente Atual</p>
                  </div>
                </div>
                <button 
                  onClick={() => setModalExtratoBarbeiro(null)} 
                  className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-full cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {atendimentosPendentes.length === 0 ? (
                <div className="text-center py-10 text-stone-400 text-xs font-medium space-y-1">
                  <p className="font-bold text-stone-700">Nenhum atendimento em aberto.</p>
                  <p className="text-[11px]">Todos os serviços recentes já foram quitados.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-stone-400 uppercase block">Atendimentos Pendentes</span>
                      <span className="font-black text-stone-900">{atendimentosPendentes.length} serviços</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-stone-400 uppercase block">Faturamento Bruto</span>
                      <span className="font-black text-stone-900">R$ {fatBrutoPendente.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    {atendimentosPendentes.map((ag) => {
                      const valServico = Number(ag.valor_total || ag.servicos?.preco || ag.valor || 0);
                      const nomeServico = ag.servicos?.nome || ag.servico_nome || 'Serviço';
                      const nomeCliente = ag.clientes?.nome || ag.cliente_nome || 'Cliente';

                      return (
                        <div key={ag.id} className="bg-white border border-stone-200/80 rounded-2xl p-3.5 flex items-center justify-between shadow-2xs">
                          <div className="space-y-0.5">
                            <span className="text-xs font-black text-stone-900 block">{nomeServico}</span>
                            <span className="text-[11px] text-stone-500 block">Cliente: <strong className="text-stone-700">{nomeCliente}</strong></span>
                            <span className="text-[10px] text-stone-400 block">{formatarData(ag)} às {formatarHora(ag)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-emerald-600 block">R$ {valServico.toFixed(2)}</span>
                            <span className="text-[9px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full inline-block mt-1">
                              Em aberto
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={() => setModalExtratoBarbeiro(null)}
                className="w-full py-3 bg-stone-900 hover:bg-black text-white text-xs font-extrabold rounded-2xl cursor-pointer transition-all shadow-md mt-2"
              >
                Fechar Extrato
              </button>
            </div>
          </div>
        );
      })()}

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
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">A Minha Assinatura</h3>
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
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  R$ {valorAssinatura.toFixed(2).replace('.', ',')} / mês
                </span>
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
            {pagamentoAprovadoBanner ? (
              <div className="py-10 flex flex-col items-center justify-center text-center space-y-3 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                  <CheckCircle className="w-9 h-9" />
                </div>
                <h3 className="text-lg font-black text-stone-900">Pagamento Confirmado!</h3>
                <p className="text-xs text-stone-500 max-w-xs leading-relaxed">
                  Sua assinatura foi ativada com sucesso. Liberando acesso ao painel...
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <div className="text-center space-y-2 border-b border-stone-100 pb-4 w-full relative">
                    {!assinaturaExpirada && (
                      <button
                        type="button"
                        onClick={() => setModalAssinaturaOpen(false)}
                        className="absolute right-0 top-0 p-1.5 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
                        title="Fechar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner mb-2">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-extrabold text-stone-900">
                      {assinaturaExpirada ? 'Período de Teste Finalizado' : 'Assinar Plano Mensal'}
                    </h2>
                    <p className="text-xs text-stone-500 leading-relaxed max-w-sm mx-auto">
                      {assinaturaExpirada
                        ? 'Os seus 7 dias gratuitos expiraram. Para liberar o acesso completo ao painel e continuar utilizando os serviços, efetue o pagamento abaixo.'
                        : 'Garanta acesso ilimitado ao painel do gestor e todos os recursos do sistema.'}
                    </p>
                  </div>
                </div>
                
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex justify-between items-center">
                  <div>
                    <span className="text-[11px] font-semibold text-stone-400 uppercase block">Plano Mensal Gestor</span>
                    <span className="text-base font-bold text-stone-900">Acesso Completo</span>
                  </div>
                  <span className="text-xl font-extrabold text-stone-900">R$ {valorAssinatura?.toFixed(2).replace('.', ',')}</span>
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
                        <span className="text-xs">
                          {gerandoPix ? 'A gerar Pix seguro via Mercado Pago...' : 'Preparando QR Code Pix...'}
                        </span>
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
                                alert('Copie manualmente o código selecionado.');
                              }
                            }}
                            className="w-full bg-stone-900 hover:bg-stone-800 text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg relative z-50"
                          >
                            {copiado ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copiado ? 'Código Pix Copiado com Sucesso!' : 'Copiar Código Pix'}
                          </button>

                          <div className="w-full py-3 px-4 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center gap-2 text-sky-800 text-xs font-semibold">
                            <div className="w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin shrink-0" />
                            <span>Aguardando confirmação automática do pagamento...</span>
                          </div>
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
                      {processandoPagamento ? 'A processar Pagamento...' : `Pagar R$ ${valorAssinatura.toFixed(2).replace('.', ',')}`}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {modalBarbeiroOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-stone-200 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-stone-900 text-lg">{barbeiroParaEditar ? 'Editar Profissional' : 'Novo Barbeiro'}</h3>
              <button onClick={() => setModalBarbeiroOpen(false)} className="p-1 text-stone-400 hover:text-stone-600 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveBarbeiro} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-600">Nome do Profissional</label>
                <input
                  type="text"
                  placeholder="Ex: Rafael Silva"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-600">Especialidade</label>
                <input
                  type="text"
                  placeholder="Ex: Degradê, Barba, Tesoura"
                  value={especialidade}
                  onChange={(e) => setEspecialidade(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-600">Taxa de Comissão (%)</label>
                  <input
                    type="number"
                    placeholder="50"
                    value={taxaComissao}
                    onChange={(e) => setTaxaComissao(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-600">Foto (Opcional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadFoto}
                    className="w-full text-xs text-stone-500 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200 cursor-pointer"
                  />
                </div>
              </div>

              {uploading && (
                <div className="text-xs text-stone-500 text-center font-medium">Enviando foto...</div>
              )}

              {fotoUrl && !uploading && (
                <div className="flex items-center gap-3 bg-stone-50 p-2 rounded-xl border border-stone-200">
                  <img src={fotoUrl} alt="Preview" className="w-10 h-10 rounded-lg object-cover" />
                  <span className="text-[11px] text-emerald-600 font-bold">Foto carregada com sucesso!</span>
                </div>
              )}

              <button type="submit" className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3 rounded-xl transition duration-200 text-xs shadow-md cursor-pointer mt-2">
                Salvar Profissional
              </button>
            </form>
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
