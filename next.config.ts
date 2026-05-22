import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://3.35.190.115:8080";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
