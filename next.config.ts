import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "placeholder.pics",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
