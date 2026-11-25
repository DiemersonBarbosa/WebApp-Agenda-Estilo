/**
 * Formata qualquer valor numérico no padrão brasileiro (R$ 1.290,00)
 * Sempre exibe 2 casas decimais e separador de milhar.
 */
export function formatBRL(value) {
  let num = value;

  // Caso venha string formatada (ex: "1.290,50"), converte para número válido
  if (typeof value === 'string') {
    const cleaned = value
      .replace(/[^\d,-]/g, '')
      .replace(',', '.');
    num = Number(cleaned);
  } else {
    num = Number(value);
  }

  if (!Number.isFinite(num)) {
    return 'R$ 0,00';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}
