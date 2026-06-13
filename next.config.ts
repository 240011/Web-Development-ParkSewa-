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
};

export default nextConfig;