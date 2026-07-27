import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@parksewa/api-client-react"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  turbopack: {
    root: "/Users/nirajbam/Documents/parksewa",
  },
  allowedDevOrigins: ["192.168.1.21", "192.168.1.68"],
};

export default nextConfig;