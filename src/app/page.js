'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Scissors, 
  CalendarCheck, 
  DollarSign, 
  Store, 
  ShieldCheck, 
  Smartphone, 
  ArrowRight, 
  CheckCircle, 
  Sparkles, 
  TrendingUp,
  Clock,
  UserCheck
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-stone-900 selection:text-white">
      
      {/* 1. HEADER / NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200/80">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-stone-900 text-white flex items-center justify-center shadow-md">
              <Scissors className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-stone-900">BarberManager</span>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href="/login" 
              className="text-xs font-semibold text-stone-600 hover:text-stone-900 px-4 py-2.5 rounded-xl transition"
            >
              Entrar
            </Link>
            <Link 
              href="/login" 
              className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold px-5 py-3 rounded-2xl shadow-md transition flex items-center gap-2"
            >
              Criar Conta Grátis <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-20 pb-24 px-6 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          
          <div className="inline-flex items-center gap-2 bg-stone-200/70 border border-stone-300/60 px-4 py-1.5 rounded-full text-xs font-semibold text-stone-700 shadow-sm animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" /> A plataforma definitiva para barbearias modernas
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-stone-900 tracking-tight leading-tight">
            Modernize a gestão da sua <span className="underline decoration-stone-400">Barbearia</span>
          </h1>

          <p className="text-stone-500 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Elimine o WhatsApp lotado e planilhas confusas. Ofereça um link de agendamento profissional para seus clientes e controle financeiro completo na palma da sua mão.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link 
              href="/login" 
              className="w-full sm:w-auto bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold uppercase tracking-wider px-8 py-4 rounded-2xl shadow-lg transition flex items-center justify-center gap-2"
            >
              Começar Agora Gratuitamente <ArrowRight className="w-4 h-4" />
            </Link>
            <a 
              href="#planos" 
              className="w-full sm:w-auto bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 text-xs font-bold uppercase tracking-wider px-8 py-4 rounded-2xl transition text-center"
            >
              Ver Planos e Preços
            </a>
          </div>

          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-stone-500 font-medium">
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-600" /> Sem cartão de crédito</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-600" /> Configuração em 2 minutos</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-600" /> Suporte dedicado</span>
          </div>

        </div>
      </section>

      {/* 3. FUNCIONALIDADES (GRID) */}
      <section className="py-20 bg-white border-t border-stone-200/80 px-6">
        <div className="max-w-6xl mx-auto space-y-16">
          
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Tudo o que sua barbearia precisa</h2>
            <p className="text-xs sm:text-sm text-stone-500">Recursos poderosos e fáceis de usar desenvolvidos especificamente para o mercado da barbearia.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div className="bg-stone-50 p-8 rounded-3xl border border-stone-200/80 space-y-4 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-stone-900 text-white flex items-center justify-center shadow-md">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-stone-900">Agendamento Online 24/7</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Seus clientes agendam horários sozinhos pelo celular a qualquer hora, com bloqueio automático para evitar conflitos na agenda do barbeiro.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-stone-50 p-8 rounded-3xl border border-stone-200/80 space-y-4 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-stone-900 text-white flex items-center justify-center shadow-md">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-stone-900">Página Personalizada</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Tenha sua própria página com sua logo, imagem de capa personalizada e cores do seu tema para transmitir total profissionalismo.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-stone-50 p-8 rounded-3xl border border-stone-200/80 space-y-4 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-stone-900 text-white flex items-center justify-center shadow-md">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-stone-900">Controle Financeiro</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Acompanhe o faturamento em tempo real, gerencie custos e despesas, e visualize o lucro líquido do seu negócio com relatórios claros.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 4. PLANOS E PREÇOS */}
      <section id="planos" className="py-20 bg-stone-100/70 border-t border-stone-200/80 px-6">
        <div className="max-w-5xl mx-auto space-y-16">
          
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Planos simples e transparentes</h2>
            <p className="text-xs sm:text-sm text-stone-500">Escolha o plano ideal para o tamanho da sua operação e comece a escalar hoje mesmo.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            
            {/* Plano Mensal */}
            <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 bg-stone-100 px-3 py-1 rounded-full">Mensal</span>
                <h3 className="text-xl font-bold text-stone-900">Profissional Flexível</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-stone-900">R$ 49,90</span>
                  <span className="text-xs text-stone-400">/mês</span>
                </div>
                <p className="text-xs text-stone-500">Perfeito para barbearias que buscam autonomia e controle total sem compromisso de longo prazo.</p>
                
                <div className="space-y-2 pt-2 border-t border-stone-100 text-xs text-stone-600">
                  <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600" /> Agendamentos ilimitados</p>
                  <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600" /> Página personalizada com logo e capa</p>
                  <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600" /> Gestão de equipe e barbeiros</p>
                  <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600" /> Relatórios financeiros</p>
                </div>
              </div>

              <Link 
                href="/login" 
                className="w-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold py-3.5 rounded-2xl shadow transition text-center block"
              >
                Assinar Mensal
              </Link>
            </div>

            {/* Plano Anual / Destaque */}
            <div className="bg-stone-900 text-white p-8 rounded-3xl border border-stone-900 shadow-xl space-y-6 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-amber-400 text-stone-900 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full">
                Mais Popular
              </div>

              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-300 bg-stone-800 px-3 py-1 rounded-full">Anual (Economize 20%)</span>
                <h3 className="text-xl font-bold text-white">Parceiro VIP</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">R$ 39,90</span>
                  <span className="text-xs text-stone-400">/mês</span>
                </div>
                <p className="text-xs text-stone-300">Para donos de barbearia visionários que desejam maximizar a economia ao longo do ano.</p>
                
                <div className="space-y-2 pt-2 border-t border-stone-800 text-xs text-stone-300">
                  <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-amber-400" /> Todos os recursos do plano mensal</p>
                  <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-amber-400" /> Suporte prioritário via WhatsApp</p>
                  <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-amber-400" /> Acesso antecipado a novos recursos</p>
                  <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-amber-400" /> Domínio customizado (em breve)</p>
                </div>
              </div>

              <Link 
                href="/login" 
                className="w-full bg-white hover:bg-stone-100 text-stone-900 text-xs font-bold py-3.5 rounded-2xl shadow transition text-center block"
              >
                Garantir Desconto Anual
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="bg-white border-t border-stone-200/80 py-12 px-6 text-center text-xs text-stone-400 space-y-4">
        <div className="flex items-center justify-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-stone-900 text-white flex items-center justify-center">
            <Scissors className="w-3 h-3" />
          </div>
          <span className="font-bold text-stone-800">BarberManager</span>
        </div>
        <p>© {new Date().getFullYear()} BarberManager. Todos os direitos reservados.</p>
      </footer>

    </div>
  );
}