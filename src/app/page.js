'use client';

import { useRouter } from 'next/navigation';

export default function LandingPageCleanPro() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white text-stone-900 selection:bg-stone-900 selection:text-white relative">
      
      {/* HEADER / NAVEGAÇÃO TOPO */}
      <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-stone-100 z-40">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-stone-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              B
            </div>
            <span className="font-extrabold text-base tracking-tight">BarberGestor</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-stone-600">
            <a href="#recursos" className="hover:text-stone-900 transition-colors">Recursos</a>
            <a href="#precos" className="hover:text-stone-900 transition-colors">Planos & Preços</a>
          </nav>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/admin/login')}
              className="text-xs font-semibold text-stone-700 hover:text-stone-900 px-4 py-2.5 cursor-pointer"
            >
              Entrar
            </button>
            <button 
              onClick={() => router.push('/admin/login?mode=register')}
              className="text-xs font-bold bg-stone-900 text-white px-5 py-3 rounded-full hover:bg-stone-800 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              Testar por 7 dias grátis
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="pt-36 pb-20 md:pt-44 md:pb-28 px-6 text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-100 border border-stone-200/60 text-[11px] font-semibold text-stone-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Sistema completo para gestão de barbearias modernas
        </div>
        
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-stone-900 leading-[1.1]">
          A inteligência que faltava na gestão da sua barbearia.
        </h1>
        
        <p className="text-sm sm:text-base text-stone-500 max-w-2xl mx-auto leading-relaxed">
          Centralize agendamentos, fluxo de caixa, comissões de equipe e ofereça uma experiência de atendimento exclusiva aos seus clientes.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button 
            onClick={() => router.push('/admin/login?mode=register')}
            className="w-full sm:w-auto px-8 py-4 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Teste gratuitamente por 7 dias ↗
          </button>
          <a href="#precos" className="w-full sm:w-auto px-8 py-4 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-bold rounded-2xl border border-stone-200/80 transition-all text-center">
            Ver Planos e Valores
          </a>
        </div>
      </section>

      {/* SEÇÃO DE RECURSOS */}
      <section id="recursos" className="py-20 bg-stone-50/50 border-t border-stone-100 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">Tudo o que seu negócio precisa</h2>
            <p className="text-xs sm:text-sm text-stone-500">Ferramentas robustas com interface limpa e intuitiva para o dia a dia.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white p-8 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
              <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center text-xs font-extrabold">
                01
              </div>
              <h3 className="font-bold text-stone-900 text-sm">Agenda Inteligente</h3>
              <p className="text-xs text-stone-500 leading-relaxed">Controle total dos horários de atendimento da equipe, evitando conflitos de agenda e otimizando a rotina.</p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
              <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center text-xs font-extrabold">
                02
              </div>
              <h3 className="font-bold text-stone-900 text-sm">Controle Financeiro</h3>
              <p className="text-xs text-stone-500 leading-relaxed">Acompanhe entradas, despesas, lucro líquido real e ticket médio calculados de forma automatizada.</p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
              <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center text-xs font-extrabold">
                03
              </div>
              <h3 className="font-bold text-stone-900 text-sm">Link de Agendamento</h3>
              <p className="text-xs text-stone-500 leading-relaxed">Disponibilize uma página exclusiva com a sua marca para seus clientes marcarem horários direto pelo celular.</p>
            </div>

          </div>
        </div>
      </section>

      {/* SEÇÃO DE PLANOS E PREÇOS */}
      <section id="precos" className="py-24 px-6 border-t border-stone-100">
        <div className="max-w-4xl mx-auto space-y-12">
          
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">Investimento simples e transparente</h2>
            <p className="text-xs sm:text-sm text-stone-500">Sem taxas escondidas. Comece a usar agora mesmo e comprove o retorno.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            
            {/* PLANO TESTE */}
            <div className="bg-stone-50 p-8 rounded-3xl border border-stone-200/80 space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Avaliação Inicial</span>
                <h3 className="text-xl font-extrabold text-stone-900">Período de Teste</h3>
              </div>
              
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-stone-950">R$ 0</span>
                <span className="text-xs text-stone-500 font-medium">/ primeiros 7 dias</span>
              </div>

              <ul className="space-y-3 text-xs text-stone-600">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-stone-900"></span> Acesso completo a todas as funções</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-stone-900"></span> Sem necessidade de cartão de crédito</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-stone-900"></span> Suporte dedicado</li>
              </ul>

              <button 
                onClick={() => router.push('/admin/login?mode=register')}
                className="w-full text-center py-3.5 bg-stone-200 hover:bg-stone-300 text-stone-900 text-xs font-bold rounded-2xl transition-all cursor-pointer"
              >
                Iniciar Teste Gratuito
              </button>
            </div>

            {/* PLANO MENSAL GESTOR */}
            <div className="bg-stone-900 text-white p-8 rounded-3xl shadow-xl space-y-6 relative border border-stone-800">
              <div className="absolute -top-3 right-6 bg-emerald-500 text-stone-950 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                Mais Popular
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Plano Mensal Gestor</span>
                <h3 className="text-xl font-extrabold text-white">Acesso Total</h3>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">R$ 9,90</span>
                <span className="text-xs text-stone-400 font-medium">/ mês</span>
              </div>

              <ul className="space-y-3 text-xs text-stone-300">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Gestão ilimitada de agendamentos</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Relatórios financeiros e de comissões</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Múltiplos barbeiros e profissionais</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Link personalizado de agendamento</li>
              </ul>

              <button 
                onClick={() => router.push('/admin/login?mode=register')}
                className="w-full text-center py-3.5 bg-white hover:bg-stone-100 text-stone-900 text-xs font-bold rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Assinar e Liberar Sistema ↗
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* FOOTER CLEAN */}
      <footer className="py-12 border-t border-stone-100 px-6 text-center text-xs text-stone-400">
        <p>© 2026 BarberGestor. Todos os direitos reservados.</p>
      </footer>

    </div>
  );
}