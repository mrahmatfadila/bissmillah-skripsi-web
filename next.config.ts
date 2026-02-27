import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Webpack from bundling node-specific dynamic requires inside pdf-parse-new
  serverExternalPackages: ['pdf-parse-new']
};

export default nextConfig;
