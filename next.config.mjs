/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out', // Garante que a build vai exatamente para a pasta 'out'
  images: {
    unoptimized: true,
  },
};

export default nextConfig;