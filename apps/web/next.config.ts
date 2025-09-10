import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@gv/config","@gv/http","@gv/ai","@gv/db"],
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"]
  }
};

export default nextConfig;
