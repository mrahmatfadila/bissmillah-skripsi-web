import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse'],
  webpack: (config, { isServer }) => {
    // Only modify client-side & edge environments
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      child_process: false,
      readline: false,
      crypto: false,
      stream: false,
      zlib: false,
      path: false,
    };
    
    // Explicitly add pdf-parse to webpack externals so Next.js doesn't try to parse it
    if (isServer) {
      config.externals = [...(config.externals || []), 'pdf-parse'];
    }

    return config;
  },
};

export default nextConfig;
