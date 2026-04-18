import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {},
  transpilePackages: ["ai", "@ai-sdk/react"],
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
