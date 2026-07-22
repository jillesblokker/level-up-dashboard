import 'dotenv/config'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'uunfpqrauivviygysjzj.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
      },
      {
        protocol: 'https',
        hostname: 'lvlup.jillesblokker.com',
      },
    ],
    dangerouslyAllowSVG: true,
    unoptimized: true,
    formats: ['image/avif', 'image/webp'], // AVIF first — better compression
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days — static art assets don't change
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3005'],
    },
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
}

export default nextConfig 