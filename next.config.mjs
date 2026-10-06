/** @type {import('next').NextConfig} */
const nextConfig = {
  // Desativa a otimização nativa de imagens do Next se necessário
  images: {
    unoptimized: true,
  },

  // Desativa os ícones de desenvolvimento no ambiente de dev
  devIndicators: false,

  // Configuração experimental de Server Actions
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '10.0.2.2:3000'],
    },
  },
};

export default nextConfig;