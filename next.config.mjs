/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ativa a exportação estática de arquivos para o Capacitor ler na pasta 'out'
  output: 'export',

  // Desativa a otimização nativa de imagens do servidor do Next (necessário para o export estático)
  images: {
    unoptimized: true,
  },

  // Desativa completamente o ícone de desenvolvimento nas versões mais novas
  devIndicators: false,

  // Isso impede que o Next adicione "http://localhost:3000" nos caminhos do Tailwind CSS no ambiente de desenvolvimento
  assetPrefix: process.env.NODE_ENV === 'development' ? '' : undefined,
  
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '10.0.2.2:3000'],
    },
  },
};

export default nextConfig;