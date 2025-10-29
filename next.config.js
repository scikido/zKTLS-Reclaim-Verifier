/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack: (config, { isServer }) => {
    // Exclude native binary files from webpack processing
    config.externals = config.externals || [];
    
    // Add external for koffi native binaries
    config.externals.push({
      'koffi': 'commonjs koffi'
    });
    
    // Ignore .node files during webpack bundling
    config.module.rules.push({
      test: /\.node$/,
      loader: 'ignore-loader'
    });
    
    // Handle other native modules that might cause issues
    if (isServer) {
      config.externals.push('@reclaimprotocol/zk-fetch');
    }
    
    return config;
  },
  // Disable webpack cache to prevent cache issues with binary files
  experimental: {
    webpackBuildWorker: false,
  }
};

module.exports = nextConfig;
