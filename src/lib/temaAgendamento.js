export const FONTES_DISPONIVEIS = [
  { label: 'Inter (Moderna)', value: 'Inter, sans-serif' },
  { label: 'Poppins (Geométrica)', value: 'Poppins, sans-serif' },
  { label: 'Playfair Display (Elegante)', value: '"Playfair Display", Georgia, serif' },
  { label: 'Montserrat (Executiva)', value: 'Montserrat, sans-serif' },
  { label: 'Space Grotesk (Tech)', value: '"Space Grotesk", sans-serif' },
];

function normalizarHex(hex, fallback = '#3b82f6') {
  if (!hex || typeof hex !== 'string') return fallback;
  const limpo = hex.trim().replace('#', '');
  if (limpo.length === 3) {
    return (
      '#' +
      limpo
        .split('')
        .map((c) => c + c)
        .join('')
    );
  }
  if (/^[0-9a-fA-F]{6}$/.test(limpo)) {
    return '#' + limpo;
  }
  return fallback;
}

function ajustarLuminosidadeHex(hex, percentual) {
  const base = normalizarHex(hex);
  const num = parseInt(base.slice(1), 16);
  const fator = percentual / 100;

  const r = Math.min(255, Math.max(0, Math.round(((num >> 16) & 255) + 255 * fator)));
  const g = Math.min(255, Math.max(0, Math.round(((num >> 8) & 255) + 255 * fator)));
  const b = Math.min(255, Math.max(0, Math.round((num & 255) + 255 * fator)));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function hexParaRgb(hex) {
  const base = normalizarHex(hex);
  const num = parseInt(base.slice(1), 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function calcularCorContrasteTexto(hex) {
  const { r, g, b } = hexParaRgb(hex);
  const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminancia > 0.62 ? '#0f172a' : '#ffffff';
}

export function gerarAcabamentoMetalico3D(corBase) {
  const base = normalizarHex(corBase);
  const destaqueClaro = ajustarLuminosidadeHex(base, 26);
  const brilhoSuave = ajustarLuminosidadeHex(base, 12);
  const sombraProfunda = ajustarLuminosidadeHex(base, -24);
  const sombraExtrema = ajustarLuminosidadeHex(base, -36);
  const { r, g, b } = hexParaRgb(base);

  return {
    corBase: base,
    destaqueClaro,
    brilhoSuave,
    sombraProfunda,
    sombraExtrema,
    textoContraste: calcularCorContrasteTexto(base),
    gradienteBotao: `linear-gradient(145deg, ${destaqueClaro} 0%, ${brilhoSuave} 42%, ${base} 72%, ${sombraProfunda} 100%)`,
    gradienteBotaoAtivo: `linear-gradient(145deg, ${sombraProfunda} 0%, ${base} 48%, ${brilhoSuave} 100%)`,
    sombraBotao3D: `0 8px 20px rgba(${r}, ${g}, ${b}, 0.34), 0 3px 6px rgba(0, 0, 0, 0.28), inset 0 2px 3px rgba(255, 255, 255, 0.52), inset 0 -3px 6px rgba(0, 0, 0, 0.32)`,
    sombraBotao3DAtivo: `inset 0 3px 8px rgba(0, 0, 0, 0.42), inset 0 -1px 2px rgba(255, 255, 255, 0.35), 0 2px 6px rgba(${r}, ${g}, ${b}, 0.2)`,
    bordaMetalica: `rgba(${r}, ${g}, ${b}, 0.55)`,
    bordaBrilhoSuperior: 'rgba(255, 255, 255, 0.45)',
  };
}

export const PRESETS_TEMA = [
  // ================= GRUPO 1: MASCULINOS, ESCUROS & CLÁSSICOS =================
  {
    id: 'black-gold-vip',
    nome: 'Black & Gold VIP',
    grupo: 'masculino',
    tema: {
      modo_base: 'dark',
      estilo_visual: 'gold_vip',
      decoracao: 'coroa',
      fundo_estilo: 'radial-gradient(circle at 80% 15%, rgba(234, 179, 8, 0.18), transparent 48%), linear-gradient(160deg, #09090b 0%, #14120c 100%)',
      cor_primaria: '#eab308',
      cor_fundo: '#09090b',
      cor_container: '#111114',
      cor_card: '#18181b',
      cor_balao_bot: '#27272a',
      cor_texto_bot: '#f4f4f5',
      cor_balao_usuario: '#ca8a04',
      cor_texto_usuario: '#09090b',
      cor_texto_geral: '#fafafa',
      cor_texto_secundario: '#eab308',
      cor_borda: '#3f3f46',
      fonte: 'Montserrat, sans-serif',
      raio_borda: '24px',
    },
  },
  {
    id: 'navy-barber-clean',
    nome: 'Navy Barber Clean',
    grupo: 'masculino',
    tema: {
      modo_base: 'clean',
      estilo_visual: 'navy_clean',
      decoracao: 'barber_pole',
      fundo_estilo: 'radial-gradient(circle at 90% 20%, rgba(30, 58, 138, 0.12), transparent 50%), linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)',
      cor_primaria: '#1e3a8a',
      cor_fundo: '#f8fafc',
      cor_container: '#ffffff',
      cor_card: '#f1f5f9',
      cor_balao_bot: '#e2e8f0',
      cor_texto_bot: '#0f172a',
      cor_balao_usuario: '#1e3a8a',
      cor_texto_usuario: '#ffffff',
      cor_texto_geral: '#0f172a',
      cor_texto_secundario: '#1d4ed8',
      cor_borda: '#cbd5e1',
      fonte: 'Inter, sans-serif',
      raio_borda: '24px',
    },
  },
  {
    id: 'dark-red-barber',
    nome: 'Dark Red Barber',
    grupo: 'masculino',
    tema: {
      modo_base: 'dark',
      estilo_visual: 'red_barber',
      decoracao: 'tesoura_vermelha',
      fundo_estilo: 'radial-gradient(circle at 85% 20%, rgba(220, 38, 38, 0.20), transparent 48%), repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 2px, transparent 2px, transparent 14px), linear-gradient(160deg, #09090b 0%, #160c0e 100%)',
      cor_primaria: '#ef4444',
      cor_fundo: '#09090b',
      cor_container: '#121215',
      cor_card: '#1c1917',
      cor_balao_bot: '#27272a',
      cor_texto_bot: '#f4f4f5',
      cor_balao_usuario: '#b91c1c',
      cor_texto_usuario: '#ffffff',
      cor_texto_geral: '#ffffff',
      cor_texto_secundario: '#f87171',
      cor_borda: '#3f3f46',
      fonte: 'Montserrat, sans-serif',
      raio_borda: '24px',
    },
  },
  {
    id: 'royal-glass-dark',
    nome: 'Royal Glass Dark',
    grupo: 'masculino',
    tema: {
      modo_base: 'dark',
      estilo_visual: 'royal_glass',
      decoracao: 'brilho_azul',
      fundo_estilo: 'radial-gradient(circle at 75% 20%, rgba(59, 130, 246, 0.26), transparent 52%), linear-gradient(165deg, #0b1120 0%, #111827 55%, #090d16 100%)',
      cor_primaria: '#3b82f6',
      cor_fundo: '#090d16',
      cor_container: '#111827',
      cor_card: '#1e293b',
      cor_balao_bot: 'rgba(30, 41, 59, 0.88)',
      cor_texto_bot: '#f8fafc',
      cor_balao_usuario: '#2563eb',
      cor_texto_usuario: '#ffffff',
      cor_texto_geral: '#f8fafc',
      cor_texto_secundario: '#60a5fa',
      cor_borda: '#334155',
      fonte: 'Inter, sans-serif',
      raio_borda: '24px',
    },
  },

  // ================= GRUPO 2: FEMININOS & TONS ROSAS =================
  {
    id: 'rosa-suave-clean',
    nome: 'Rosa Suave Clean',
    grupo: 'feminino',
    tema: {
      modo_base: 'clean',
      estilo_visual: 'rosa_suave',
      decoracao: 'coracao',
      fundo_estilo: 'radial-gradient(circle at 85% 15%, rgba(244, 114, 182, 0.24), transparent 50%), linear-gradient(160deg, #fff5f9 0%, #fce7f3 100%)',
      cor_primaria: '#db2777',
      cor_fundo: '#fdf2f8',
      cor_container: '#ffffff',
      cor_card: '#fdf2f8',
      cor_balao_bot: '#fce7f3',
      cor_texto_bot: '#500724',
      cor_balao_usuario: '#db2777',
      cor_texto_usuario: '#ffffff',
      cor_texto_geral: '#3b0764',
      cor_texto_secundario: '#be185d',
      cor_borda: '#f9a8d4',
      fonte: 'Poppins, sans-serif',
      raio_borda: '24px',
    },
  },
  {
    id: 'pink-barber-pop',
    nome: 'Pink Barber Pop',
    grupo: 'feminino',
    tema: {
      modo_base: 'clean',
      estilo_visual: 'pink_pop',
      decoracao: 'tesoura',
      fundo_estilo: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 55%, #fbcfe8 100%)',
      cor_primaria: '#e11d48',
      cor_fundo: '#fff1f2',
      cor_container: '#ffffff',
      cor_card: '#ffe4e6',
      cor_balao_bot: '#fce7f3',
      cor_texto_bot: '#4c0519',
      cor_balao_usuario: '#be185d',
      cor_texto_usuario: '#ffffff',
      cor_texto_geral: '#3b0764',
      cor_texto_secundario: '#db2777',
      cor_borda: '#fda4af',
      fonte: 'Poppins, sans-serif',
      raio_borda: '24px',
    },
  },
  {
    id: 'rose-gold-botanico',
    nome: 'Rose Gold Botânico',
    grupo: 'feminino',
    tema: {
      modo_base: 'clean',
      estilo_visual: 'rose_botanico',
      decoracao: 'folhas',
      fundo_estilo: 'radial-gradient(circle at 12% 12%, rgba(244, 114, 182, 0.18), transparent 45%), linear-gradient(180deg, #fffafc 0%, #fdf2f8 100%)',
      cor_primaria: '#db2777',
      cor_fundo: '#fff5f7',
      cor_container: '#ffffff',
      cor_card: '#fdf2f8',
      cor_balao_bot: '#fce7f3',
      cor_texto_bot: '#4a044e',
      cor_balao_usuario: '#be185d',
      cor_texto_usuario: '#ffffff',
      cor_texto_geral: '#270722',
      cor_texto_secundario: '#c026d3',
      cor_borda: '#f5d0fe',
      fonte: '"Playfair Display", Georgia, serif',
      raio_borda: '24px',
    },
  },
  {
    id: 'glossy-glam',
    nome: 'Glossy Glam',
    grupo: 'feminino',
    tema: {
      modo_base: 'clean',
      estilo_visual: 'glossy_glam',
      decoracao: 'coracao_3d',
      fundo_estilo: 'radial-gradient(circle at 90% 25%, rgba(236, 72, 153, 0.22), transparent 48%), linear-gradient(150deg, #fdf4ff 0%, #fae8ff 50%, #fce7f3 100%)',
      cor_primaria: '#db2777',
      cor_fundo: '#fdf4ff',
      cor_container: '#ffffff',
      cor_card: '#fae8ff',
      cor_balao_bot: 'linear-gradient(180deg, #ffffff 0%, #fce7f3 100%)',
      cor_texto_bot: '#3b0764',
      cor_balao_usuario: '#be185d',
      cor_texto_usuario: '#ffffff',
      cor_texto_geral: '#2e1065',
      cor_texto_secundario: '#db2777',
      cor_borda: '#f0abfc',
      fonte: 'Poppins, sans-serif',
      raio_borda: '24px',
    },
  },
];

export const TEMA_PADRAO_DARK = PRESETS_TEMA.find((p) => p.id === 'black-gold-vip').tema;

export const TEMA_PADRAO_CLEAN = PRESETS_TEMA.find((p) => p.id === 'navy-barber-clean').tema;

export function resolverTemaBarbearia(barbearia) {
  const legadoClean =
    (barbearia?.cor_tema || '').toString().trim().toLowerCase() === 'clean';

  const basePadrao = legadoClean ? TEMA_PADRAO_CLEAN : TEMA_PADRAO_DARK;
  const custom =
    barbearia?.tema_personalizado && typeof barbearia.tema_personalizado === 'object'
      ? barbearia.tema_personalizado
      : {};

  const corPrimaria = custom.cor_primaria || basePadrao.cor_primaria;
  const metalico3D = gerarAcabamentoMetalico3D(corPrimaria);

  return {
    ...basePadrao,
    ...custom,
    modo_base: custom.modo_base || basePadrao.modo_base,
    estilo_visual: custom.estilo_visual || basePadrao.estilo_visual,
    decoracao: custom.decoracao || basePadrao.decoracao,
    fundo_estilo: custom.fundo_estilo || basePadrao.fundo_estilo,
    cor_primaria: corPrimaria,
    cor_fundo: custom.cor_fundo || basePadrao.cor_fundo,
    cor_container: custom.cor_container || basePadrao.cor_container,
    cor_card: custom.cor_card || basePadrao.cor_card,
    cor_balao_bot: custom.cor_balao_bot || basePadrao.cor_balao_bot,
    cor_texto_bot: custom.cor_texto_bot || basePadrao.cor_texto_bot,
    cor_balao_usuario: custom.cor_balao_usuario || corPrimaria,
    cor_texto_usuario: custom.cor_texto_usuario || metalico3D.textoContraste,
    cor_texto_geral: custom.cor_texto_geral || basePadrao.cor_texto_geral,
    cor_texto_secundario: custom.cor_texto_secundario || basePadrao.cor_texto_secundario,
    cor_borda: custom.cor_borda || basePadrao.cor_borda,
    fonte: custom.fonte || basePadrao.fonte,
    raio_borda: custom.raio_borda || basePadrao.raio_borda,
    botao_estilo: metalico3D.gradienteBotao,
    botao_ativo_estilo: metalico3D.gradienteBotaoAtivo,
    sombra_botao: metalico3D.sombraBotao3D,
    sombra_botao_ativa: metalico3D.sombraBotao3DAtivo,
    borda_metalica: metalico3D.bordaMetalica,
    borda_brilho_superior: metalico3D.bordaBrilhoSuperior,
    metalico3D,
  };
}