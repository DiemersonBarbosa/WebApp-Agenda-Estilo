/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true, // Garante que URLs terminadas com / funcionem sem redirecionamento
  images: {
    unoptimized: true,
  },
};

export default nextConfig;