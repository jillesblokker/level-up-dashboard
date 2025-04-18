/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost'
      },
      {
        protocol: 'http',
        hostname: '192.168.1.60'
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com'
      }
    ],
    dangerouslyAllowSVG: true,
    unoptimized: false,
  },
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  output: 'standalone',
}

export default nextConfig
