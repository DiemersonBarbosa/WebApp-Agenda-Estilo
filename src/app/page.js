import Link from 'next/link';
import { Calendar, Scissors, DollarSign, ArrowRight, CheckCircle2, Users, ShieldCheck, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-stone-800 selection:text-white">
      {/* HEADER / NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-stone-950/90 backdrop-blur-md border-b border-stone-900">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-stone-900 to-stone-800 border border-stone-800 flex items-center justify-center text-white shadow-lg">
              <Scissors className="w-5 h-5 text-stone-200" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-white">AgendaEstilo</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-stone-400">
            <a href="#recursos" className="hover:text-white transition-colors">Recursos</a>
            <a href="#beneficios" className="hover:text-white transition-colors">Vantagens</a>
            <a href="#planos" className="hover:text-white transition-colors">Planos</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link 
              href="/admin" 
              className="px-4 py-2 text-xs font-medium text-stone-400 hover:text-white transition-colors"
            >
              Entrar
            </Link>
            <Link 
              href="/admin" 
              className="px-5 py-2.5 rounded-xl bg-white text-stone-950 hover:bg-stone-200 text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Testar 7 Dias Grátis
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="pt-36 pb-24 md:pt-44 md:pb-32 px-6 relative overflow-hidden bg-stone-950">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-gradient-to-tr from-stone-900/60 to-stone-800/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-900/90 border border-stone-800 text-[11px] font-medium text-stone-300 shadow-inner">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Comece agora: <strong className="text-white">7 dias grátis</strong> sem compromisso.</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.08]">
            O sistema definitivo para barbearias que buscam <span className="text-stone-400">alta performance</span>
          </h1>

          <p className="text-stone-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Centralize seus agendamentos, automatize o cálculo de comissões da equipe e modernize o atendimento da sua barbearia com elegância e precisão.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link 
              href="/admin" 
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-stone-950 font-bold text-xs uppercase tracking-wider hover:bg-stone-200 transition-all shadow-2xl flex items-center justify-center gap-2 group cursor-pointer"
            >
              Criar Conta Grátis (7 Dias)
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a 
              href="#recursos" 
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-stone-900 hover:bg-stone-800 text-stone-300 font-bold text-xs border border-stone-800 transition-colors cursor-pointer text-center"
            >
              Explorar Recursos
            </a>
          </div>

          {/* DASHBOARD PREVIEW CLEAN */}
          <div className="pt-10">
            <div className="rounded-3xl p-3 bg-stone-900/50 border border-stone-800 shadow-2xl backdrop-blur-md max-w-3xl mx-auto">
              <div className="rounded-2xl bg-stone-950 overflow-hidden border border-stone-800/80 p-6 text-left grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <div className="text-stone-500 text-[10px] font-semibold uppercase tracking-wider">Status da Agenda</div>
                  <div className="text-xl font-bold text-white">96% Ocupada</div>
                  <div className="text-emerald-400 text-[10px]">Agenda automatizada 24h</div>
                </div>
                <div className="space-y-1">
                  <div className="text-stone-500 text-[10px] font-semibold uppercase tracking-wider">Faturamento Diário</div>
                  <div className="text-xl font-bold text-white">R$ 1.620,00</div>
                  <div className="text-stone-400 text-[10px]">Atualizado em tempo real</div>
                </div>
                <div className="space-y-1">
                  <div className="text-stone-500 text-[10px] font-semibold uppercase tracking-wider">Comissões Calculadas</div>
                  <div className="text-xl font-bold text-white">R$ 810,00</div>
                  <div className="text-stone-400 text-[10px]">Sem planilhas manuais</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RECURSOS */}
      <section id="recursos" className="py-24 px-6 border-t border-stone-900/80 bg-stone-950">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500">Arquitetura do Sistema</h2>
            <p className="text-2xl md:text-3xl font-bold text-white">Projetado para otimizar cada segundo da sua operação</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-3xl bg-stone-900/30 border border-stone-900 space-y-4 hover:border-stone-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center text-white">
                <Calendar className="w-5 h-5 text-stone-300" />
              </div>
              <h3 className="text-sm font-bold text-white">Agendamento via Link Direto</h3>
              <p className="text-stone-400 text-xs leading-relaxed">
                Seus clientes escolhem o serviço e o profissional favorito pelo celular com poucos cliques, sem ocupar o seu WhatsApp.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-stone-900/30 border border-stone-900 space-y-4 hover:border-stone-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center text-white">
                <Users className="w-5 h-5 text-stone-300" />
              </div>
              <h3 className="text-sm font-bold text-white">Gestão Individual de Equipe</h3>
              <p className="text-stone-400 text-xs leading-relaxed">
                Cada barbeiro possui seu próprio painel de controle e o sistema calcula as taxas de comissão de forma totalmente automatizada.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-stone-900/30 border border-stone-900 space-y-4 hover:border-stone-800 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center text-white">
                <DollarSign className="w-5 h-5 text-stone-300" />
              </div>
              <h3 className="text-sm font-bold text-white">Controle Financeiro Confiável</h3>
              <p className="text-stone-400 text-xs leading-relaxed">
                Tenha total clareza sobre o fluxo de caixa, relatórios de serviços mais lucrativos e desempenho do negócio em um só lugar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PLANOS COM 7 DIAS GRÁTIS DESTACADOS */}
      <section id="planos" className="py-24 px-6 border-t border-stone-900/80 bg-stone-950">
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500">Planos e Assinatura</h2>
            <p className="text-2xl md:text-3xl font-bold text-white">Comece com 7 dias grátis e escolha o melhor formato</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="p-8 rounded-3xl bg-stone-900/20 border border-stone-800/80 space-y-6">
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Plano Mensal</h3>
                <div className="text-3xl font-black text-white">R$ 97 <span className="text-xs font-normal text-stone-500">/mês</span></div>
                <p className="text-[11px] text-emerald-400 font-medium">Inclui 7 dias de teste gratuito</p>
              </div>
              <ul className="space-y-3 text-xs text-stone-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-stone-400 shrink-0" /> Agendamentos ilimitados</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-stone-400 shrink-0" /> Gestão de comissões</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-stone-400 shrink-0" /> Painel exclusivo para equipe</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-stone-400 shrink-0" /> Suporte dedicado</li>
              </ul>
              <Link 
                href="/admin" 
                className="w-full block py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs text-center transition-colors cursor-pointer"
              >
                Testar Mensal Grátis
              </Link>
            </div>

            <div className="p-8 rounded-3xl bg-stone-900 border border-stone-700 space-y-6 relative shadow-2xl">
              <div className="absolute -top-3 right-6 px-3 py-1 bg-white text-stone-950 font-extrabold text-[10px] rounded-full uppercase tracking-widest shadow-md">
                Mais Escolhido
              </div>
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Plano Anual</h3>
                <div className="text-4xl font-black text-white">R$ 77 <span className="text-xs font-normal text-stone-500">/mês</span></div>
                <div className="text-[11px] text-emerald-400 font-semibold">7 dias grátis + economia de R$ 240/ano</div>
              </div>
              <ul className="space-y-3 text-xs text-stone-200">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Todos os recursos avançados</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Domínio personalizado</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Prioridade máxima no suporte</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Acesso antecipado a novidades</li>
              </ul>
              <Link 
                href="/admin" 
                className="w-full block py-3.5 rounded-xl bg-white hover:bg-stone-200 text-stone-950 font-extrabold text-xs uppercase tracking-wider text-center transition-all shadow-lg cursor-pointer"
              >
                Garantir Anual com Desconto
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-6 border-t border-stone-900 bg-stone-950 text-stone-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center text-white">
              <Scissors className="w-4 h-4 text-stone-400" />
            </div>
            <span className="font-bold text-stone-300">AgendaEstilo</span>
          </div>
          <div>
            © 2026 AgendaEstilo. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}