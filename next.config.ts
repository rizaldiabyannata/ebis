import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  images: {
    domains: ["via.placeholder.com", "images.unsplash.com"],
  },
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
