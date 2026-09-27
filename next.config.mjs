/** @type {import('next').NextConfig} */
const nextConfig = {
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
