import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // For Capacitor: App points to Railway server (not static export)
  // This allows dynamic routes and API routes to work properly
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  env: {
    CHECKOUT_SIGNATURE_SECRET: process.env.CHECKOUT_SIGNATURE_SECRET,
  },
  
  async redirects() {
    return [
      {
        source: '/affiliate/invite/:token',
        destination: '/affiliate/accept?token=:token',
        permanent: true,
      },
    ]
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
