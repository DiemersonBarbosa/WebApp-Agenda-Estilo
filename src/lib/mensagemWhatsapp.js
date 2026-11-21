export const TEMPLATE_WHATSAPP_PADRAO = [
  'Olá, *{cliente}*! Seu horário está confirmado.',
  '',
  '• *Local:* {local}',
  '• *Serviço:* {servico}',
  '• *Profissional:* {profissional}',
  '• *Data:* {data}',
  '• *Horário:* {hora}',
  '• *Valor:* {valor}',
  '',
  'Agradecemos a sua confiança!',
].join('\n');

export const VARIAVEIS_WHATSAPP = [
  { chave: '{cliente}', label: 'Nome do Cliente' },
  { chave: '{local}', label: 'Nome do Local' },
  { chave: '{servico}', label: 'Serviço' },
  { chave: '{profissional}', label: 'Profissional' },
  { chave: '{data}', label: 'Data' },
  { chave: '{hora}', label: 'Horário' },
  { chave: '{valor}', label: 'Valor' },
];

export function renderizarMensagemConfirmacao(template, dados) {
  const textoBase = template && template.trim() ? template : TEMPLATE_WHATSAPP_PADRAO;

  return textoBase
    .replaceAll('{cliente}', dados.cliente || '')
    .replaceAll('{local}', dados.local || '')
    .replaceAll('{servico}', dados.servico || '')
    .replaceAll('{profissional}', dados.profissional || '')
    .replaceAll('{data}', dados.data || '')
    .replaceAll('{hora}', dados.hora || '')
    .replaceAll('{valor}', dados.valor || '');
}