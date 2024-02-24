if (
  process.env.LD_LIBRARY_PATH == null ||
  !process.env.LD_LIBRARY_PATH.includes(
    `${process.env.PWD}/node_modules/canvas/build/Release:`,
  )
) {
  process.env.LD_LIBRARY_PATH = `${
    process.env.PWD
  }/node_modules/canvas/build/Release:${process.env.LD_LIBRARY_PATH || ''}`;
}

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

