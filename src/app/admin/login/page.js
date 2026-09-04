'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Scissors, Lock, Mail, Store, Phone } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

export default function AdminLogin() {
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nomeBarbearia, setNomeBarbearia] = useState('');
  const [telefone, setTelefone] = useState('');

  // Login
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

      router.push('/admin');
    } catch (err) {
      setErrorMessage(err.message || 'Erro ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  // Cadastro de nova barbearia
 const handleRegister = async (e) => {
  e.preventDefault();
  setLoading(true);
  setErrorMessage(null);

  // Gerar slug
  const slug = nomeBarbearia
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  try {
    const res = await fetch('/api/admin/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, nomeBarbearia, telefone, slug }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error);

    // Cadastro feito com sucesso! Faça login ou redirecione
    alert('Barbearia cadastrada com sucesso!');
  } catch (err) {
    setErrorMessage(err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-stone-200/80 max-w-md w-full space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-stone-900 text-white flex items-center justify-center mx-auto shadow-md">
            <Scissors className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-stone-900">
            {isRegistering ? 'Cadastrar Minha Barbearia' : 'Painel Gestor'}
          </h2>
          <p className="text-xs text-stone-400">
            {isRegistering ? 'Preencha os dados da sua empresa' : 'Entre com suas credenciais de acesso'}
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {errorMessage}
          </div>
        )}

        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
          {isRegistering && (
            <>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Nome da Barbearia</label>
                <div className="relative">
                  <Store className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Barbearia Navalha de Ouro"
                    value={nomeBarbearia}
                    onChange={(e) => setNomeBarbearia(e.target.value)}
                    className="w-full pl-9 pr-3 py-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Telefone / WhatsApp</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="(00) 00000-0000"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="w-full pl-9 pr-3 py-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-stone-900"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-stone-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">Senha</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-stone-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md disabled:opacity-50"
          >
            {loading ? 'Processando...' : isRegistering ? 'Criar Conta e Cadastrar' : 'Entrar no Painel'}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setErrorMessage(null);
            }}
            className="text-xs text-stone-500 hover:text-stone-900 font-medium underline"
          >
            {isRegistering ? 'Já tem uma conta? Faça login' : 'Quer cadastrar sua barbearia? Clique aqui'}
          </button>
        </div>

      </div>
    </div>
  );
}