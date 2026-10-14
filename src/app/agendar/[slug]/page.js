import AgendamentoClientPage from './AgendamentoClientPage';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export async function generateStaticParams() {
  return [{ slug: 'default' }];
}

export default async function Page({ params }) {
  const resolvedParams = await params;
  return <AgendamentoClientPage slug={resolvedParams?.slug} />;
}