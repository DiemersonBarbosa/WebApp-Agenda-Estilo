/** @type {import('next').Next.js Configuration} */
const nextConfig = {
  typescript: {
    // Ignora erros de typescript no build da Vercel
    ignoreBuildErrors: true,
  },
};

export default nextConfig;