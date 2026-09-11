import Link from 'next/link';
import { Calendar, Scissors, DollarSign, ArrowRight, CheckCircle2, Users } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 font-sans selection:bg-stone-900 selection:text-white">
      {/* HEADER / NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-stone-900 flex items-center justify-center text-white shadow-md">
              <Scissors className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-stone-900">AgendaEstilo</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-stone-600">
            <a href="#recursos" className="hover:text-stone-900 transition-colors">Recursos</a>
            <a href="#beneficios" className="hover:text-stone-900 transition-colors">Vantagens</a>
            <a href="#planos" className="hover:text-stone-900 transition-colors">Planos</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link 
              href="/admin" 
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors"
            >
              Entrar
            </Link>
            <Link 
              href="/admin" 
              className="px-5 py-2.5 rounded-xl bg-stone-900 text-white hover:bg-stone-800 text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Testar Grátis
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="pt-36 pb-20 md:pt-44 md:pb-32 px-6 relative overflow-hidden bg-stone-100">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-stone-200/60 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-stone-200 text-[11px] font-semibold text-stone-700 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            Sistema completo para barbearias de alto padrão
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-stone-900 leading-[1.1]">
            O novo padrão de gestão para a sua <span className="text-stone-500">Barbearia</span>
          </h1>

          <p className="text-stone-600 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Elimine as mensagens no WhatsApp para agendar, automatize o cálculo de comissões da sua equipe e tenha o controle financeiro total na palma da sua mão.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link 
              href="/admin" 
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-stone-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-stone-800 transition-all shadow-xl flex items-center justify-center gap-2 group cursor-pointer"
            >
              Começar Gratuitamente
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a 
              href="#recursos" 
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs border border-stone-200 transition-colors cursor-pointer text-center shadow-sm"
            >
              Conhecer Recursos
            </a>
          </div>

          {/* PREVIEW CARD / MOCKUP */}
          <div className="pt-8">
            <div className="rounded-3xl p-3 bg-white border border-stone-200 shadow-xl max-w-4xl mx-auto">
              <div className="rounded-2xl bg-stone-900 overflow-hidden p-6 text-left grid grid-cols-1 md:grid-cols-3 gap-6 text-white">
                <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700/50 space-y-2">
                  <div className="text-stone-400 text-[11px] font-semibold">Faturamento Hoje</div>
                  <div className="text-2xl font-bold text-white">R$ 1.450,00</div>
                  <div className="text-emerald-400 text-[10px] font-medium">+18% que ontem</div>
                </div>
                <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700/50 space-y-2">
                  <div className="text-stone-400 text-[11px] font-semibold">Agendamentos</div>
                  <div className="text-2xl font-bold text-white">28 Horários</div>
                  <div className="text-stone-300 text-[10px] font-medium">Agenda 94% lotada</div>
                </div>
                <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700/50 space-y-2">
                  <div className="text-stone-400 text-[11px] font-semibold">Comissões da Equipe</div>
                  <div className="text-2xl font-bold text-white">R$ 725,00</div>
                  <div className="text-stone-300 text-[10px] font-medium">Cálculo automatizado</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RECURSOS / PILARES */}
      <section id="recursos" className="py-24 px-6 border-t border-stone-200 bg-white">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500">Tecnologia de ponta</h2>
            <p className="text-2xl md:text-3xl font-bold text-stone-900">Tudo o que sua barbearia precisa em um só lugar</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-3xl bg-stone-50 border border-stone-200 space-y-4 hover:border-stone-300 transition-colors shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-stone-900 flex items-center justify-center text-white">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-stone-900">Agenda Inteligente 24h</h3>
              <p className="text-stone-600 text-xs leading-relaxed">
                Seus clientes agendam pelo celular de forma autônoma a qualquer hora, reduzindo faltas e o tempo perdido no WhatsApp.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-stone-50 border border-stone-200 space-y-4 hover:border-stone-300 transition-colors shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-stone-900 flex items-center justify-center text-white">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-stone-900">Gestão de Equipe & Comissões</h3>
              <p className="text-stone-600 text-xs leading-relaxed">
                Configure taxas de comissão individuais por profissional e acompanhe o desempenho financeiro de cada barbeiro em tempo real.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-stone-50 border border-stone-200 space-y-4 hover:border-stone-300 transition-colors shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-stone-900 flex items-center justify-center text-white">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-stone-900">Controle Financeiro Completo</h3>
              <p className="text-stone-600 text-xs leading-relaxed">
                Monitore entradas, saídas, faturamento diário e relatórios detalhados para manter o caixa da sua barbearia sempre saudável.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PLANOS / PRICING */}
      <section id="planos" className="py-24 px-6 border-t border-stone-200 bg-stone-100">
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500">Investimento</h2>
            <p className="text-2xl md:text-3xl font-bold text-stone-900">Simples, transparente e sem surpresas</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="p-8 rounded-3xl bg-white border border-stone-200 space-y-6 shadow-sm">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider">Plano Mensal</h3>
                <div className="text-3xl font-black text-stone-900">R$ 97 <span className="text-xs font-normal text-stone-500">/mês</span></div>
              </div>
              <ul className="space-y-3 text-xs text-stone-700">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Agendamentos ilimitados</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Gestão de comissões</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Painel para barbeiros</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Suporte via WhatsApp</li>
              </ul>
              <Link 
                href="/admin" 
                className="w-full block py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold text-xs text-center transition-colors cursor-pointer"
              >
                Assinar Mensal
              </Link>
            </div>

            <div className="p-8 rounded-3xl bg-stone-900 border-2 border-stone-900 space-y-6 relative shadow-xl text-white">
              <div className="absolute -top-3 right-6 px-3 py-1 bg-white text-stone-950 font-extrabold text-[10px] rounded-full uppercase tracking-widest shadow-md">
                Mais Popular
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-wider">Plano Anual</h3>
                <div className="text-4xl font-black text-white">R$ 77 <span className="text-xs font-normal text-stone-400">/mês</span></div>
                <div className="text-[10px] text-emerald-400 font-semibold">Economize R$ 240 por ano</div>
              </div>
              <ul className="space-y-3 text-xs text-stone-200">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Todos os recursos do mensal</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Domínio personalizado</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Prioridade máxima no suporte</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Atualizações antecipadas</li>
              </ul>
              <Link 
                href="/admin" 
                className="w-full block py-3.5 rounded-xl bg-white hover:bg-stone-200 text-stone-950 font-extrabold text-xs uppercase tracking-wider text-center transition-all shadow-lg cursor-pointer"
              >
                Garantir Desconto Anual
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-6 border-t border-stone-200 bg-white text-stone-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-stone-900 flex items-center justify-center text-white">
              <Scissors className="w-4 h-4" />
            </div>
            <span className="font-bold text-stone-900">AgendaEstilo</span>
          </div>
          <div>
            © 2026 AgendaEstilo. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}