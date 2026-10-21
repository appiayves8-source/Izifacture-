/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Évite que les alertes de linting ne bloquent le build en production
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Évite que les alertes de types bloquent le build sur Vercel
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
