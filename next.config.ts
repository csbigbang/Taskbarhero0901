import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    cpus: 2,
    workerThreads: false,
  },
};

export default nextConfig;
