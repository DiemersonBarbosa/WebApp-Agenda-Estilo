import AgendamentoClientPage from './AgendamentoClientPage';
import { supabase } from '@/lib/supabase';

export async function generateStaticParams() {
  try {
    const { data: barbearias, error } = await supabase
      .from('barbearias')
      .select('slug');

    if (error || !barbearias) {
      return [{ slug: 'default' }];
    }

    return barbearias
      .filter((b) => b.slug)
      .map((b) => ({
        slug: b.slug,
      }));
  } catch (err) {
    console.error('Erro ao gerar slugs estáticos:', err);
    return [{ slug: 'default' }];
  }
}

export default async function Page({ params }) {
  const resolvedParams = await params;
  return <AgendamentoClientPage slug={resolvedParams?.slug} />;
}