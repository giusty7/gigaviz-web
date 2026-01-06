import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/about", destination: "/", permanent: true },
      { source: "/blog", destination: "/roadmap", permanent: true },
      { source: "/data-deletion", destination: "/policies/privacy-policy", permanent: true },
      { source: "/privacy", destination: "/policies/privacy-policy", permanent: true },
      { source: "/terms", destination: "/policies/terms-of-service", permanent: true },
      { source: "/wa-platform", destination: "/products/meta-hub", permanent: true },
    ];
  },
};

export default nextConfig;
