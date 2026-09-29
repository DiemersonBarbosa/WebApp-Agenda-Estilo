'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Users, 
  Smartphone, 
  ArrowRight, 
  BarChart3,
  Monitor,
  Gift,
  ShoppingBag,
  Scissors
} from 'lucide-react';

export default function LandingPageCleanModern() {
  const router = useRouter();
  
  // Controle de alternância de telas e dispositivos
  const [dispositivoAtivo, setDispositivoAtivo] = useState('desktop');
  const [telaAtiva, setTelaAtiva] = useState('financeiro');

  // Mapeamento dos prints mantendo .png no financeiro
  const previews = {
    financeiro: {
      titulo: 'Painel Financeiro & Lucro em Tempo Real',
      descricao: 'Visão automatizada de faturamento bruto, ticket médio, despesas registradas e comissões.',
      desktop: '/prints/financeiro-desktop.png',
      mobile: '/prints/financeiro-mobile.png',
    },
    agenda: {
      titulo: 'Gestão Inteligente de Agendamentos',
      descricao: 'Controle completo da fila diária, status de atendimento e projeção de receita esperada.',
      desktop: '/prints/agenda-desktop.png',
      mobile: '/prints/agenda-mobile.png',
    },
    fidelidade: {
      titulo: 'Cartão de Fidelidade Virtual',
      descricao: 'Fidelize seus clientes com pontuação automática por selos e alerta de prêmios disponíveis.',
      desktop: '/prints/fidelidade-desktop.png',
      mobile: '/prints/fidelidade-mobile.png',
    },
    pdv: {
      titulo: 'Frente de Caixa (PDV) & Produtos',
      descricao: 'Agilidade para lançar vendas no balcão, controlar produtos em estoque e comandas de clientes.',
      desktop: '/prints/pdv-desktop.png',
      mobile: '/prints/pdv-mobile.png',
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-stone-900 font-sans selection:bg-stone-900 selection:text-white relative">
      
      {/* 1. NAVEGAÇÃO TOPO MODERNA COM LOGO AMPLIO */}
      <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-stone-200/60 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 sm:h-24 flex items-center justify-between gap-2">
          
          {/* LOGO AMPLIADO */}
          <div className="flex items-center shrink-0">
            <img 
              src="/images/logo.png" 
              alt="AgendaEstilo" 
              className="h-10 sm:h-14 md:h-16 w-auto object-contain transition-all"
            />
          </div>
          
          {/* NAVEGAÇÃO DESKTOP */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-stone-600">
            <a href="#telas" className="hover:text-stone-900 transition-colors">Sistema por Dentro</a>
            <a href="#diferenciais" className="hover:text-stone-900 transition-colors">Recursos</a>
            <a href="#planos" className="hover:text-stone-900 transition-colors">Planos</a>
          </nav>

          {/* BOTÕES DE AÇÃO */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button 
              onClick={() => router.push('/admin/login')}
              className="text-xs font-bold text-stone-700 hover:text-stone-900 px-2.5 sm:px-4 py-2 transition-colors cursor-pointer"
            >
              Entrar
            </button>
            <button 
              onClick={() => router.push('/admin/login?mode=register')}
              className="text-[11px] sm:text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <span className="hidden sm:inline">Testar 7 dias grátis</span>
              <span className="sm:hidden">Testar Grátis</span>
            </button>
          </div>

        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="pt-40 pb-12 md:pt-52 md:pb-20 px-6 text-center max-w-4xl mx-auto space-y-6">
        
        {/* BADGE PREMIUM DA BARBEARIA */}
        <div className="inline-flex items-center gap-2.5 pl-1.5 pr-4 py-1 rounded-full bg-white border border-stone-200/80 shadow-xs transition-all hover:shadow-sm">
          <div className="bg-emerald-800 text-white p-1.5 rounded-full flex items-center justify-center shadow-inner">
            <Scissors className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-extrabold text-stone-800 uppercase tracking-wider">
            Gestão Inteligente para Barbearias
          </span>
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-stone-900 leading-[1.12]">
          Acelere sua barbearia com gestão{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-950 via-emerald-800 to-emerald-950">
            simples e automatizada.
          </span>
        </h1>
        
        <p className="text-sm sm:text-base text-stone-600 max-w-2xl mx-auto leading-relaxed font-medium">
          Esqueça o papel e a desorganização. Controle comissões, faturamento, comandas de balcão e agendamentos pelo celular ou pelo computador.
        </p>

        <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button 
            onClick={() => router.push('/admin/login?mode=register')}
            className="w-full sm:w-auto px-8 py-4 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Experimente Gratuitamente</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <a 
            href="#telas" 
            className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-stone-100 text-stone-700 text-xs font-bold rounded-2xl border border-stone-200/80 transition-all text-center shadow-2xs"
          >
            Ver Telas do Sistema
          </a>
        </div>
      </section>

      {/* 3. GALERIA DOS PRINTS REAIS */}
      <section id="telas" className="py-12 px-4 sm:px-6 max-w-6xl mx-auto space-y-8">
        
        <div className="text-center space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-emerald-800">
            Conheça o Sistema
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-900">
            Interface limpa, intuitiva e sem complicações
          </h2>
        </div>

        {/* SELECTOR COMPUTADOR / CELULAR */}
        <div className="flex justify-center items-center gap-2">
          <div className="bg-stone-200/60 p-1 rounded-2xl border border-stone-200 inline-flex gap-1">
            <button
              onClick={() => setDispositivoAtivo('desktop')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                dispositivoAtivo === 'desktop'
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>Visão Computador</span>
            </button>

            <button
              onClick={() => setDispositivoAtivo('mobile')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                dispositivoAtivo === 'mobile'
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Visão Celular</span>
            </button>
          </div>
        </div>

        {/* SELETOR DE MÓDULOS */}
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { id: 'financeiro', label: 'Relatório Financeiro', icon: DollarSign },
            { id: 'agenda', label: 'Agenda & Atendimentos', icon: Calendar },
            { id: 'fidelidade', label: 'Programa de Fidelidade', icon: Gift },
            { id: 'pdv', label: 'Frente de Caixa (PDV)', icon: ShoppingBag },
          ].map((aba) => {
            const Icone = aba.icon;
            const ativa = telaAtiva === aba.id;
            return (
              <button
                key={aba.id}
                onClick={() => setTelaAtiva(aba.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                  ativa
                    ? 'bg-emerald-900/10 border-emerald-800 text-emerald-950 shadow-2xs'
                    : 'bg-white border-stone-200/80 text-stone-600 hover:border-stone-300'
                }`}
              >
                <Icone className="w-4 h-4 text-emerald-800" />
                <span>{aba.label}</span>
              </button>
            );
          })}
        </div>

        {/* DISPLAY DO PRINT REQUISITADO */}
        <div className="bg-white border border-stone-200/80 rounded-[2.5rem] p-6 sm:p-10 space-y-6 shadow-sm">
          
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h3 className="text-lg font-black text-stone-900">{previews[telaAtiva].titulo}</h3>
            <p className="text-xs text-stone-500 font-medium">{previews[telaAtiva].descricao}</p>
          </div>

          <div className="flex justify-center items-center pt-2">
            {dispositivoAtivo === 'desktop' ? (
              <img 
                src={previews[telaAtiva].desktop} 
                alt={previews[telaAtiva].titulo} 
                className="w-full max-w-4xl h-auto drop-shadow-md transition-all duration-300 hover:scale-[1.01]"
              />
            ) : (
              <img 
                src={previews[telaAtiva].mobile} 
                alt={previews[telaAtiva].titulo} 
                className="w-full max-w-[310px] h-auto drop-shadow-md transition-all duration-300 hover:scale-[1.01]"
              />
            )}
          </div>

        </div>

      </section>

      {/* 4. SEÇÃO DE RECURSOS EM DESTAQUE */}
      <section id="diferenciais" className="py-20 bg-white border-t border-stone-200/60 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-800">Diferenciais</span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-900">Desenvolvido sob medida para a sua rotina</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-stone-50/60 p-8 rounded-3xl border border-stone-200/70 space-y-4 hover:border-stone-300 transition-all">
              <div className="w-10 h-10 rounded-2xl bg-stone-900 text-white flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="font-bold text-stone-900 text-base">Lucro Líquido Real</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Calcula automaticamente o faturamento bruto, subtrai as despesas lançadas e exibe seu lucro líquido real e ticket médio.
              </p>
            </div>

            <div className="bg-stone-50/60 p-8 rounded-3xl border border-stone-200/70 space-y-4 hover:border-stone-300 transition-all">
              <div className="w-10 h-10 rounded-2xl bg-stone-900 text-white flex items-center justify-center">
                <Gift className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="font-bold text-stone-900 text-base">Fidelidade sem Papel</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Cartão virtual de acúmulo de selos para motivar o retorno do cliente e gerenciar resgates de prêmios de forma simples.
              </p>
            </div>

            <div className="bg-stone-50/60 p-8 rounded-3xl border border-stone-200/70 space-y-4 hover:border-stone-300 transition-all">
              <div className="w-10 h-10 rounded-2xl bg-stone-900 text-white flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="font-bold text-stone-900 text-base">Painel para Barbeiros</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Acesso exclusivo para os profissionais da barbearia visualizarem sua própria agenda, fila do dia e taxa de comissão.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 5. SEÇÃO DE PREÇOS */}
      <section id="planos" className="py-24 px-6 border-t border-stone-200/60">
        <div className="max-w-4xl mx-auto space-y-12">
          
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-800">Investimento</span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-900">Preço transparente e sem surpresas</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            
            {/* PLANO AVALIAÇÃO */}
            <div className="bg-white p-8 rounded-3xl border border-stone-200/80 space-y-6 flex flex-col justify-between shadow-2xs">
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Período de Teste</span>
                  <h3 className="text-xl font-extrabold text-stone-900">7 Dias Gratuitos</h3>
                </div>
                
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-stone-950">R$ 0</span>
                  <span className="text-xs text-stone-500 font-medium">/ primeiros 7 dias</span>
                </div>

                <ul className="space-y-3 text-xs text-stone-600 font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-800" />
                    <span>Acesso total a todas as funcionalidades</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-800" />
                    <span>Sem necessidade de informar cartão de crédito</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-800" />
                    <span>Suporte para tirar dúvidas no WhatsApp</span>
                  </li>
                </ul>
              </div>

              <button 
                onClick={() => router.push('/admin/login?mode=register')}
                className="w-full text-center py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs font-bold rounded-2xl transition-all cursor-pointer"
              >
                Testar sem Compromisso
              </button>
            </div>

            {/* PLANO MENSAL */}
            <div className="bg-stone-900 text-white p-8 rounded-3xl shadow-xl space-y-6 relative border border-stone-800 flex flex-col justify-between">
              <div className="absolute -top-3 right-6 bg-emerald-800 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-700">
                Mais Escolhido
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Acesso Total</span>
                  <h3 className="text-xl font-extrabold text-white">Plano Gestor Pro</h3>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">R$ 19,90</span>
                  <span className="text-xs text-stone-400 font-medium">/ mês</span>
                </div>

                <ul className="space-y-3 text-xs text-stone-300 font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Agendamentos e clientes ilimitados</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Relatórios de comissões, caixa e PDV</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Acesso individual para barbeiros da equipe</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Cartão de Selos e Fidelização completo</span>
                  </li>
                </ul>
              </div>

              <button 
                onClick={() => router.push('/admin/login?mode=register')}
                className="w-full text-center py-3.5 bg-white hover:bg-stone-100 text-stone-900 text-xs font-bold rounded-2xl transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                Assinar e Liberar Sistema ↗
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* 6. RODAPÉ */}
      <footer className="py-12 border-t border-stone-200/60 px-6 flex flex-col items-center text-center text-xs text-stone-400 space-y-3 bg-white">
        <img 
          src="/images/logo.png" 
          alt="AgendaEstilo" 
          className="h-8 w-auto object-contain"
        />
        <p>© 2026 AgendaEstilo. Todos os direitos reservados.</p>
      </footer>

    </div>
  );
}