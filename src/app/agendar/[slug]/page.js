import { supabase } from '@/lib/supabase';
import AgendamentoChat from '@/components/AgendamentoChat';
import AgendamentoClassico from '@/components/AgendamentoClassico';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PaginaAgendamentoCliente({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;

  if (!slug) {
    return (
      <div className="min-h-screen bg-[#050507] flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-[2.5rem] bg-gradient-to-br from-[#0c0d10] via-[#050507] to-[#000000] border border-white/10 shadow-2xl text-center space-y-3 backdrop-blur-2xl text-white">
          <h2 className="text-lg font-black text-white">Link de Agendamento Inválido</h2>
          <p className="text-xs text-slate-400">Por favor, aceda através do link personalizado fornecido pela barbearia.</p>
        </div>
      </div>
    );
  }

  const { data: barbearia, error } = await supabase
    .from('barbearias')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !barbearia) {
    return (
      <div className="min-h-screen bg-[#050507] flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-[2.5rem] bg-gradient-to-br from-[#0c0d10] via-[#050507] to-[#000000] border border-white/10 shadow-2xl text-center space-y-3 backdrop-blur-2xl text-white">
          <h2 className="text-lg font-black text-white">Barbearia não encontrada</h2>
          <p className="text-xs text-slate-400">Verifique o link digitado ou tente novamente mais tarde.</p>
        </div>
      </div>
    );
  }

  const tipoAtendimento = (barbearia.tipo_atendimento || '').trim().toLowerCase();
  const modoAgendamento = (barbearia.modo_agendamento || '').trim().toLowerCase();
  
  const modoClassico = tipoAtendimento === 'classico' || modoAgendamento === 'classico' || modoAgendamento === 'class';

  // Verifica se o tema da barbearia é o clean
  const isClean = barbearia.cor_tema === 'clean';

  // Define dinamicamente o fundo da página inteira
  const estiloFundoPagina = isClean 
    ? 'bg-[#f8fafc] text-slate-800' 
    : 'bg-[#050507] text-white';

  const estiloTextoRodape = isClean ? 'text-slate-400' : 'text-slate-600';
  const corLuzFundo = isClean ? 'bg-emerald-600/5' : 'bg-emerald-500/10';

  return (
    <main className={`min-h-screen ${estiloFundoPagina} py-8 px-4 relative overflow-x-hidden flex flex-col items-center justify-between`}>
      
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-72 ${corLuzFundo} blur-[120px] pointer-events-none`}></div>

      {/* Componente principal de agendamento centralizado */}
      <div className="w-full relative z-10 flex justify-center my-auto">
        {modoClassico ? (
          <AgendamentoClassico barbeariaId={barbearia.id} />
        ) : (
          <AgendamentoChat barbeariaId={barbearia.id} />
        )}
      </div>

      

    </main>
  );
}