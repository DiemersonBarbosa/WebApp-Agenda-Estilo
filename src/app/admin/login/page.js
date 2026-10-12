'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, Store, Phone, ArrowRight, ShieldCheck, Sparkles, Eye, EyeOff, HelpCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';




function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');

  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nomeBarbearia, setNomeBarbearia] = useState('');
  const [telefone, setTelefone] = useState('');

  useEffect(() => {
    if (mode === 'register') {
      setIsRegistering(true);
    }
  }, [mode]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      window.location.href = '/admin';
    } catch (err) {
      setErrorMessage(err.message || 'Erro ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      alert('Por favor, informe seu e-mail no campo acima primeiro.');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://www.agendaestilo.com.br/admin/login',
      });
      if (error) throw error;
      alert('E-mail de recuperação enviado com sucesso! Verifique sua caixa de entrada.');
    } catch (err) {
      alert('Erro ao enviar e-mail de recuperação: ' + err.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const slugLimpo = nomeBarbearia
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const slug = slugLimpo || `barbearia-${Date.now()}`;

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Não foi possível criar a conta do usuário.');
      }

      const { error: dbError } = await supabase
        .from('barbearias')
        .insert([
          {
            user_id: authData.user.id,
            nome: nomeBarbearia,
            slug: slug,
            telefone: telefone,
            status_assinatura: 'teste',
            created_at: new Date().toISOString(),
          },
        ]);

      if (dbError) throw dbError;

      alert('🎉 Barbearia cadastrada com sucesso!');
      window.location.href = '/admin';

    } catch (err) {
      setErrorMessage(err.message || 'Erro ao realizar o cadastro.');
    } finally {
      setLoading(false);
    }
  };

  return (


    
    <div className="min-h-screen h-screen bg-[#f4f4f6] flex flex-col justify-center items-center p-4 sm:p-6 overflow-hidden font-sans select-none">
      


      <div className="w-full max-w-md bg-white rounded-[2.5rem] border border-stone-200/90 p-6 sm:p-8 shadow-2xl flex flex-col justify-between relative min-h-[680px] max-h-[94vh] my-auto">
        
        <div className="space-y-4 shrink-0">
          <div className="flex flex-col items-center text-center space-y-1.5 pt-1">
            <img 
              src="/images/logo.png" 
              alt="Logo AgendaEstilo" 
              className="h-14 sm:h-16 w-auto object-contain"
            />
            <p className="text-xs text-stone-400 font-medium tracking-tight">
              {isRegistering 
                ? 'Preencha os dados da sua empresa' 
                : 'Entre com suas credenciais de acesso'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-1.5 bg-stone-100 p-1.5 rounded-2xl border border-stone-200/60 shadow-inner">
            <button
              type="button"
              onClick={() => { setIsRegistering(false); setErrorMessage(null); }}
              className={`py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                !isRegistering 
                  ? 'bg-stone-900 text-white shadow-md' 
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => { setIsRegistering(true); setErrorMessage(null); }}
              className={`py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                isRegistering 
                  ? 'bg-stone-900 text-white shadow-md' 
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Cadastrar
            </button>
          </div>

          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-2xl text-xs font-semibold text-center">
              {errorMessage}
            </div>
          )}
        </div>

        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-3.5 my-auto shrink-0 w-full">
          
          <div className={`space-y-3.5 transition-all ${isRegistering ? 'opacity-100 block' : 'opacity-0 invisible h-0 overflow-hidden'}`}>
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 tracking-tight">Nome da Barbearia</label>
              <div className="relative">
                <Store className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={isRegistering ? "text" : "button"}
                  required={isRegistering}
                  placeholder="Ex: Barbearia Navalha de Ouro"
                  value={nomeBarbearia}
                  onChange={(e) => setNomeBarbearia(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-stone-50/80 border border-stone-200/90 rounded-2xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 font-medium shadow-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 tracking-tight">Telefone / WhatsApp</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={isRegistering ? "text" : "button"}
                  required={isRegistering}
                  placeholder="(00) 00000-0000"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-stone-50/80 border border-stone-200/90 rounded-2xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 font-medium shadow-xs"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700 tracking-tight">E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-stone-50/80 border border-stone-200/90 rounded-2xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 font-medium shadow-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700 tracking-tight">Senha</label>
              {!isRegistering && (
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="text-[11px] font-semibold text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
                >
                  Esqueci minha senha
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-stone-50/80 border border-stone-200/90 rounded-2xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 font-medium shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#111111] hover:bg-stone-800 text-white text-xs font-extrabold rounded-2xl shadow-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 mt-4 uppercase tracking-wider"
          >
            <span>{loading ? 'Aguarde...' : isRegistering ? 'Criar Conta e Cadastrar' : 'Entrar no Painel'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="shrink-0 pt-2 border-t border-stone-100 flex flex-col items-center justify-center space-y-2">
          {isRegistering ? (
            <div className="flex flex-col items-center justify-center space-y-1 text-[11px] text-stone-500 text-center animate-in fade-in duration-200 w-full">
              <div className="flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>7 dias de teste grátis sem compromisso</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Acesso instantâneo ao painel completo</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full px-1 text-xs text-stone-500">
              <span className="text-[11px] font-medium">Precisa de Ajuda?</span>
              <a
                href="https://wa.me/5542998040396?text=Olá,%20preciso%20de%20suporte%20com%20o%20sistema%20AgendaEstilo."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-stone-900 font-extrabold hover:underline"
              >
                <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Suporte WhatsApp</span>
              </a>
            </div>
          )}
        </div>

      </div>

      <div className="mt-3 text-center text-xs text-stone-400 font-medium shrink-0">
        <p>© 2026 Todos os direitos reservados.</p>
      </div>

    </div>
  );
}

export default function AdminLogin() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-stone-100 flex items-center justify-center text-xs text-stone-500">A carregar...</div>}>
      <AdminLoginForm />
    </React.Suspense>
  );
}