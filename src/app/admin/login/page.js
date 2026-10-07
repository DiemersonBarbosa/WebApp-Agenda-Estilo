'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, Store, Phone, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');

  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

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
    <div className="min-h-screen bg-[#f4f4f6] flex flex-col justify-start sm:justify-center items-center p-4 sm:p-6 overflow-y-auto pb-56 font-sans select-none">
      
      {/* CARD PRINCIPAL DE AUTENTICAÇÃO */}
      <div className="w-full max-w-md bg-white rounded-[2.5rem] border border-stone-200/80 p-6 sm:p-10 shadow-2xl space-y-8 relative my-4 sm:my-auto">
        
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
            {isRegistering 
              ? 'Preencha os dados da sua empresa' 
              : 'Entre com suas credenciais de acesso'}
          </p>
        </div>

        {/* ALTERNADOR DE ABAS (ENTRAR / CRIAR CONTA) */}
        <div className="grid grid-cols-2 gap-1.5 bg-stone-100 p-1.5 rounded-2xl border border-stone-200/60">
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

        {/* MENSAGEM DE ERRO */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-xs font-semibold text-center">
            {errorMessage}
          </div>
        )}

        {/* FORMULÁRIO */}
        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
          
          {isRegistering && (
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
                    type="text"
                    required
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
            <span>{loading ? 'Aguarde...' : isRegistering ? 'Criar Conta e Cadastrar' : 'Entrar no Painel'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* BENEFÍCIOS EXTRAS NO CADASTRO */}
        {isRegistering && (
          <div className="pt-3 border-t border-stone-100 flex flex-col items-center justify-center space-y-2 text-[11px] text-stone-500 text-center">
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>7 dias de teste grátis sem compromisso</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Acesso instantâneo ao painel completo</span>
            </div>
          </div>
        )}

      </div>

      {/* RODAPÉ */}
      <div className="my-6 text-center text-xs text-stone-400 font-medium shrink-0">
        <p>© 2026 Todos os direitos reservados.</p>
      </div>

    </div>
  );
}

export default function AdminLogin() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-100 flex items-center justify-center text-xs text-stone-500">Carregando...</div>}>
      <AdminLoginForm />
    </Suspense>
  );
}