'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Scissors, ArrowRight, Calendar, TrendingUp, Clock, 
  ShieldCheck, Sparkles, Check, ChevronDown, Zap, Users, BarChart3, Star 
} from 'lucide-react';

export default function ModernLandingPage() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 font-sans selection:bg-white selection:text-stone-900">
      
      {/* HEADER FLUTUANTE DARK */}
      <header className="sticky top-0 z-50 bg-stone-900/80 backdrop-blur-md border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            
            <div>
              <span className="text-sm font-black tracking-tight text-white block leading-none">BarberFlow</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-400">Elite System</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-stone-300">
            <a href="#vantagens" className="hover:text-white transition">Vantagens</a>
            <a href="#como-funciona" className="hover:text-white transition">Como Funciona</a>
            <a href="#precos" className="hover:text-white transition">Investimento</a>
            <a href="#duvidas" className="hover:text-white transition">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link 
              href="/admin/login" 
              className="text-xs font-semibold text-stone-300 hover:text-white px-4 py-2.5 transition"
            >
              Entrar
            </Link>
            <Link 
              href="/admin/login?mode=register" 
              className="bg-white hover:bg-stone-200 text-stone-900 text-xs font-bold px-5 py-3 rounded-2xl shadow-md transition flex items-center gap-2 group"
            >
              Testar 7 Dias Grátis 
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

        </div>
      </header>

      {/* HERO SECTION DARK COM CARD DE PRÉ-VISUALIZAÇÃO */}
      <section className="relative pt-20 pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Lado Esquerdo: Chamadas */}
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-800 border border-stone-700 text-stone-300 text-xs font-bold shadow-inner">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> 
              Teste completo por 7 dias totalmente grátis.
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.08]">
              A infraestrutura definitiva para barbearias de <span className="underline decoration-stone-600 text-amber-400">alto padrão</span>.
            </h1>

            <p className="text-base text-stone-300 max-w-xl leading-relaxed font-normal">
              Substitua o caos do WhatsApp e cadernos de papel por um ecossistema inteligente de agendamento online, comissões e controle financeiro.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link 
                href="/admin/login?mode=register" 
                className="bg-white hover:bg-stone-200 text-stone-900 text-xs font-bold uppercase tracking-wider px-8 py-4 rounded-2xl shadow-xl transition flex items-center justify-center gap-2 group"
              >
                Começar Teste de 7 Dias Grátis 
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link 
                href="/admin/login" 
                className="bg-stone-800 hover:bg-stone-700 border border-stone-700 text-white text-xs font-bold uppercase tracking-wider px-6 py-4 rounded-2xl transition text-center"
              >
                Acessar Painel
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs text-stone-400 pt-2">
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400 font-bold" /> Sem cartão de crédito</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400 font-bold" /> Ativação instantânea</span>
            </div>
          </div>

          {/* Lado Direito: Card Flutuante Estilizado */}
          <div className="lg:col-span-5">
            <div className="p-8 rounded-3xl bg-stone-800/80 border border-stone-700 shadow-2xl space-y-6 backdrop-blur-xl relative">
              <div className="absolute -top-3 -right-3 bg-amber-500 text-stone-950 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
                7 Dias Grátis
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400">Visão Geral do Sistema</span>
                <h3 className="text-xl font-bold text-white">Tudo sob controle</h3>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3 text-xs text-stone-300">
                  <div className="w-6 h-6 rounded-lg bg-stone-900 flex items-center justify-center text-amber-400 shrink-0 font-bold">✓</div>
                  <div>
                    <strong className="text-white block">Link Próprio de Agendamento</strong>
                    <span className="text-stone-400">Seus clientes marcam sozinhos 24h por dia.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs text-stone-300">
                  <div className="w-6 h-6 rounded-lg bg-stone-900 flex items-center justify-center text-amber-400 shrink-0 font-bold">✓</div>
                  <div>
                    <strong className="text-white block">Cálculo de Comissões</strong>
                    <span className="text-stone-400">Repasses calculados automaticamente para cada barbeiro.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs text-stone-300">
                  <div className="w-6 h-6 rounded-lg bg-stone-900 flex items-center justify-center text-amber-400 shrink-0 font-bold">✓</div>
                  <div>
                    <strong className="text-white block">Painel do Gestor Leve e Rápido</strong>
                    <span className="text-stone-400">Acesse de qualquer celular ou computador.</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-700">
                <Link 
                  href="/admin/login?mode=register" 
                  className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg"
                >
                  Criar Minha Barbearia <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SEÇÃO DE VANTAGENS EM GRID MODERNO */}
      <section id="vantagens" className="py-24 px-6 bg-stone-950 border-t border-stone-800">
        <div className="max-w-7xl mx-auto space-y-16">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold tracking-widest uppercase text-stone-500">Engenharia de Alta Performance</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">Projetado para eliminar gargalos</h2>
            <p className="text-sm text-stone-400">Cada ferramenta foi desenvolvida para poupar horas do seu dia e aumentar o faturamento.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="p-8 rounded-3xl bg-stone-900 border border-stone-800 space-y-4 hover:border-stone-700 transition">
              <div className="w-12 h-12 rounded-2xl bg-stone-800 border border-stone-700 flex items-center justify-center text-amber-400">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Agenda Inteligente</h3>
              <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
                Controle horários individuais de cada profissional, intervalos de almoço e serviços com duração personalizada sem risco de choque de marcações.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-stone-900 border border-stone-800 space-y-4 hover:border-stone-700 transition">
              <div className="w-12 h-12 rounded-2xl bg-stone-800 border border-stone-700 flex items-center justify-center text-amber-400">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Caixa & Repasses</h3>
              <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
                Tenha relatórios claros de faturamento diário, semanal e mensal. Saiba com precisão cirúrgica quanto cada barbeiro tem a receber.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-stone-900 border border-stone-800 space-y-4 hover:border-stone-700 transition">
              <div className="w-12 h-12 rounded-2xl bg-stone-800 border border-stone-700 flex items-center justify-center text-amber-400">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">CRM de Clientes</h3>
              <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
                Histórico completo de atendimentos, preferências de corte e dados de contato para fidelizar e trazer seus clientes de volta com frequência.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* SEÇÃO COMO FUNCIONA */}
      <section id="como-funciona" className="py-24 px-6 bg-stone-900 border-t border-stone-800">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <span className="text-xs font-bold tracking-widest uppercase text-stone-500">Simples e Rápido</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-white">Comece a usar em 3 passos</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-stone-800/50 border border-stone-700/80 space-y-4">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-stone-950 font-black text-xs flex items-center justify-center">1</div>
              <h4 className="font-bold text-white text-base">Cadastre sua barbearia</h4>
              <p className="text-xs text-stone-400 leading-relaxed">Insira o nome e crie seu acesso administrativo em segundos.</p>
            </div>
            <div className="p-8 rounded-3xl bg-stone-800/50 border border-stone-700/80 space-y-4">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-stone-950 font-black text-xs flex items-center justify-center">2</div>
              <h4 className="font-bold text-white text-base">Configure sua equipe</h4>
              <p className="text-xs text-stone-400 leading-relaxed">Adicione seus barbeiros, serviços prestados e horários de atendimento.</p>
            </div>
            <div className="p-8 rounded-3xl bg-stone-800/50 border border-stone-700/80 space-y-4">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-stone-950 font-black text-xs flex items-center justify-center">3</div>
              <h4 className="font-bold text-white text-base">Divulgue o link</h4>
              <p className="text-xs text-stone-400 leading-relaxed">Coloque o link no Instagram e deixe os clientes marcarem sozinhos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PLANOS E PREÇOS */}
      <section id="precos" className="py-24 px-6 bg-stone-950 border-t border-stone-800">
        <div className="max-w-5xl mx-auto space-y-16">
          
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <span className="text-xs font-bold tracking-widest uppercase text-stone-500">Planos Transparentes</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-white">Escolha o seu plano com 7 dias grátis</h2>
            <p className="text-xs sm:text-sm text-stone-400">Teste todas as funcionalidades sem compromisso. Cancele quando quiser.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* Plano Mensal */}
            <div className="p-8 sm:p-10 rounded-3xl bg-stone-900 border border-stone-800 flex flex-col justify-between space-y-8">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Plano Profissional</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">R$ 67</span>
                  <span className="text-xs text-stone-400">/ mês após o teste</span>
                </div>
                <p className="text-xs text-stone-400">Perfeito para barbearias focadas em organização e crescimento.</p>
                <div className="pt-4 border-t border-stone-800 space-y-3 text-xs text-stone-300">
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400 font-bold" /> <strong>7 Dias Grátis</strong> para testar</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-white" /> Agendamentos online ilimitados</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-white" /> Gestão de comissões e caixa</div>
                </div>
              </div>
              <Link 
                href="/admin/login?mode=register" 
                className="w-full bg-stone-800 hover:bg-stone-700 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition text-center border border-stone-700"
              >
                Iniciar 7 Dias Grátis
              </Link>
            </div>

            {/* Plano Anual Destaque */}
            <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-stone-800 to-stone-900 border border-amber-500/40 flex flex-col justify-between space-y-8 relative shadow-2xl">
              <div className="absolute -top-3 right-6 bg-amber-500 text-stone-950 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
                Mais Vantajoso
              </div>

              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Plano Anual</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">R$ 47</span>
                  <span className="text-xs text-stone-400">/ mês (cobrado anualmente)</span>
                </div>
                <p className="text-xs text-stone-300">Máxima economia para gestores que pensam a longo prazo.</p>
                <div className="pt-4 border-t border-stone-700 space-y-3 text-xs text-stone-200">
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400 font-bold" /> <strong>7 Dias Grátis</strong> inclusos</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-white" /> Todos os recursos avançados</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-white" /> Suporte prioritário dedicado</div>
                </div>
              </div>
              <Link 
                href="/admin/login?mode=register" 
                className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-black py-3.5 rounded-xl text-xs uppercase tracking-wider transition text-center shadow-lg"
              >
                Garantir Desconto Anual
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* FAQ */}
      <section id="duvidas" className="py-24 px-6 bg-stone-900 border-t border-stone-800">
        <div className="max-w-4xl mx-auto space-y-12">
          
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <span className="text-xs font-bold tracking-widest uppercase text-stone-500">Dúvidas Frequentes</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-white">Tudo o que você precisa saber</h2>
          </div>

          <div className="space-y-4">
            <div className="bg-stone-800/60 border border-stone-700/80 rounded-2xl overflow-hidden">
              <button 
                onClick={() => toggleFaq(1)}
                className="w-full p-6 text-left flex items-center justify-between font-bold text-white text-sm"
              >
                <span>Como funcionam os 7 dias grátis?</span>
                <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${openFaq === 1 ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === 1 && (
                <div className="px-6 pb-6 text-xs text-stone-300 leading-relaxed border-t border-stone-700 pt-4">
                  Você cria sua conta e ganha acesso imediato a todas as ferramentas do sistema. Não é cobrado nada durante os primeiros 7 dias.
                </div>
              )}
            </div>

            <div className="bg-stone-800/60 border border-stone-700/80 rounded-2xl overflow-hidden">
              <button 
                onClick={() => toggleFaq(2)}
                className="w-full p-6 text-left flex items-center justify-between font-bold text-white text-sm"
              >
                <span>Preciso cadastrar cartão para testar?</span>
                <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${openFaq === 2 ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === 2 && (
                <div className="px-6 pb-6 text-xs text-stone-300 leading-relaxed border-t border-stone-700 pt-4">
                  Não! O cadastro é totalmente livre de cartão de crédito. Você testa sem nenhum compromisso financeiro.
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-stone-800 py-16 px-6 bg-stone-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-stone-500">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-stone-800 text-white flex items-center justify-center font-bold">
              <Scissors className="w-4 h-4" />
            </div>
            <span>© 2026 BarberFlow Elite. Todos os direitos reservados.</span>
          </div>
          <div className="flex items-center gap-6 font-medium text-stone-400">
            <Link href="/admin/login" className="hover:text-white transition">Painel Administrativo</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}