/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Évite que les alertes de linting ne bloquent le build en production
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
