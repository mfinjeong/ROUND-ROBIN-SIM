import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev dan audit produksi tidak saling menimpa manifest/chunk.
  distDir: process.env.NODE_ENV === "production" ? ".next-production" : ".next",
};

export default nextConfig;
