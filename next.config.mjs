/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: 'loose'
  },
  webpack: (config) => {
    config.externals.push({
      canvas: 'commonjs canvas',
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil'
    })
    return config
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'liveblocks.io',
        port: ''
      }
    ]
  },
  typescript: {
    ignoreBuildErrors: true
  }
};

export default nextConfig;

