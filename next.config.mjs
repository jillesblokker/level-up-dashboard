/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'uunfpqrauivviygysjzj.supabase.co',
      'img.clerk.com',
      'images.clerk.dev'
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3005'],
    },
  },
}

export default nextConfig 