import AgendamentoClientPage from './AgendamentoClientPage';

export async function generateStaticParams() {
  return [{ slug: 'default' }];
}

export default async function Page({ params }) {
  const resolvedParams = await params;
  return <AgendamentoClientPage slug={resolvedParams?.slug} />;
}