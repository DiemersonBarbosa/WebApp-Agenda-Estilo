export const TEMPLATE_WHATSAPP_PADRAO = [
  'Olá, *{cliente}*! Seu horário está confirmado.',
  '',
  '• *Local:* {local}',
  '• *Serviço:* {servico}',
  '• *Data:* {data}',
  '• *Horário:* {hora}',
  '',
  'Agradecemos a sua confiança!',
].join('\n');

export const VARIAVEIS_WHATSAPP = [
  { chave: '{cliente}', label: 'Nome do Cliente' },
  { chave: '{local}', label: 'Nome do Local' },
  { chave: '{servico}', label: 'Serviço' },
  { chave: '{data}', label: 'Data' },
  { chave: '{hora}', label: 'Horário' },
];

export function renderizarMensagemConfirmacao(template, dados) {
  const textoBase = template && template.trim() ? template : TEMPLATE_WHATSAPP_PADRAO;

  return textoBase
    .replaceAll('{cliente}', dados.cliente || '')
    .replaceAll('{local}', dados.local || '')
    .replaceAll('{servico}', dados.servico || '')
    .replaceAll('{data}', dados.data || '')
    .replaceAll('{hora}', dados.hora || '');
}