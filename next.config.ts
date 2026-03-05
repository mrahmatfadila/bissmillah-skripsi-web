import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse', 'pdf-parse-new'],
  turbopack: {},
};

export default nextConfig;
