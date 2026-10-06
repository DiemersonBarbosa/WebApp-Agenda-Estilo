/** @type {import('next').NextConfig} */
const nextConfig = {
  skipTrailingSlashRedirect: true, // Impede o redirecionamento 308 automático em rotas de API
  images: {
    unoptimized: true,
  },
};

export default nextConfig;