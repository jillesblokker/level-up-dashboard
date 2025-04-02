/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', '192.168.1.60'],
    unoptimized: true,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
  },
  remotePatterns: [
    {
      protocol: 'http',
      hostname: 'localhost',
    },
    {
      protocol: 'http',
      hostname: '192.168.1.60',
    },
  ],
  webpack: (config) => {
    config.externals.push({
      canvas: 'canvas',
    });
    return config;
  },
  allowedDevOrigins: [
    'http://192.168.1.60:3000',
    'http://localhost:3000',
    'http://0.0.0.0:3000',
  ],
};

module.exports = nextConfig; 