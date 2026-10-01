import AgendamentoClientPage from './AgendamentoClientPage';

// DEVOLVE PELO MENOS UM SLUG PADRÃO PARA CUMPRIR A EXIGÊNCIA DO "output: 'export'"
export async function generateStaticParams() {
  return [{ slug: 'default' }];
}

export default async function Page({ params }) {
  const resolvedParams = await params;
  return <AgendamentoClientPage slug={resolvedParams?.slug} />;
}