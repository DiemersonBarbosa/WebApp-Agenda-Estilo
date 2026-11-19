export const TEMA_PADRAO_DARK = {
  modo_base: 'dark',
  cor_primaria: '#10b981',
  cor_fundo: '#050507',
  cor_container: '#0b0c10',
  cor_card: '#1c1917',
  cor_balao_bot: '#1c1917',
  cor_texto_bot: '#e2e8f0',
  cor_balao_usuario: '#10b981',
  cor_texto_usuario: '#ffffff',
  cor_texto_geral: '#ffffff',
  cor_texto_secundario: '#94a3b8',
  cor_borda: 'rgba(255,255,255,0.12)',
  fonte: 'Inter, sans-serif',
  raio_borda: '24px',
};

export const TEMA_PADRAO_CLEAN = {
  modo_base: 'clean',
  cor_primaria: '#064e3b',
  cor_fundo: '#f8fafc',
  cor_container: '#ffffff',
  cor_card: '#f1f5f9',
  cor_balao_bot: '#f1f5f9',
  cor_texto_bot: '#1e293b',
  cor_balao_usuario: '#064e3b',
  cor_texto_usuario: '#ffffff',
  cor_texto_geral: '#0f172a',
  cor_texto_secundario: '#64748b',
  cor_borda: '#e2e8f0',
  fonte: 'Inter, sans-serif',
  raio_borda: '24px',
};

export const PRESETS_TEMA = [
  {
    id: 'emerald-dark',
    nome: 'Emerald Dark',
    tema: { ...TEMA_PADRAO_DARK },
  },
  {
    id: 'clean-minimal',
    nome: 'Clean Minimal',
    tema: { ...TEMA_PADRAO_CLEAN },
  },
  {
    id: 'gold-luxury',
    nome: 'Gold Luxury',
    tema: {
      modo_base: 'dark',
      cor_primaria: '#eab308',
      cor_fundo: '#090806',
      cor_container: '#14110c',
      cor_card: '#1f1a12',
      cor_balao_bot: '#1f1a12',
      cor_texto_bot: '#f5f5f4',
      cor_balao_usuario: '#ca8a04',
      cor_texto_usuario: '#ffffff',
      cor_texto_geral: '#fafaf9',
      cor_texto_secundario: '#a8a29e',
      cor_borda: 'rgba(234,179,8,0.22)',
      fonte: 'Poppins, sans-serif',
      raio_borda: '24px',
    },
  },
  {
    id: 'royal-clean',
    nome: 'Royal Clean',
    tema: {
      modo_base: 'clean',
      cor_primaria: '#2563eb',
      cor_fundo: '#eff6ff',
      cor_container: '#ffffff',
      cor_card: '#f8fafc',
      cor_balao_bot: '#f1f5f9',
      cor_texto_bot: '#0f172a',
      cor_balao_usuario: '#2563eb',
      cor_texto_usuario: '#ffffff',
      cor_texto_geral: '#0f172a',
      cor_texto_secundario: '#475569',
      cor_borda: '#cbd5e1',
      fonte: 'Inter, sans-serif',
      raio_borda: '24px',
    },
  },
];

export const FONTES_DISPONIVEIS = [
  { label: 'Inter (Moderna)', value: 'Inter, sans-serif' },
  { label: 'Poppins (Geométrica)', value: 'Poppins, sans-serif' },
  { label: 'Montserrat (Elegante)', value: 'Montserrat, sans-serif' },
  { label: 'Roboto (Clássica)', value: 'Roboto, sans-serif' },
];

export function resolverTemaBarbearia(barbearia, overrideTema = null) {
  const legadoClean = barbearia?.cor_tema === 'clean' || barbearia?.cor_tema === '#10b981';
  const basePadrao = legadoClean ? TEMA_PADRAO_CLEAN : TEMA_PADRAO_DARK;

  let salvo = {};
  if (barbearia?.tema_personalizado) {
    if (typeof barbearia.tema_personalizado === 'string') {
      try {
        salvo = JSON.parse(barbearia.tema_personalizado);
      } catch {
        salvo = {};
      }
    } else if (typeof barbearia.tema_personalizado === 'object') {
      salvo = barbearia.tema_personalizado;
    }
  }

  return {
    ...basePadrao,
    ...salvo,
    ...(overrideTema || {}),
  };
}