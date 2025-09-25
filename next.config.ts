import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Zet persistente filesystem cache uit (OneDrive/junctions kunnen hier ruzie mee maken)
    // @ts-ignore
    config.cache = false;
    return config;
  },
};

export default nextConfig;
