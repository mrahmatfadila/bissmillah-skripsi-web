import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse'],
  // Allow Turbopack to run without complaint
  turbopack: {},
};

export default nextConfig;
