import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@parksewa/api-client-react"],
  turbopack: {
    root: "/Users/nirajbam/Documents/parksewa",
  },
};

export default nextConfig;