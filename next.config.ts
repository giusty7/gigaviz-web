import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/data-deletion", destination: "/policies/privacy-policy", permanent: true },
      { source: "/privacy", destination: "/policies/privacy-policy", permanent: true },
      { source: "/terms", destination: "/policies/terms-of-service", permanent: true },
      { source: "/wa-platform", destination: "/products/meta-hub", permanent: true },
      { source: "/products/graph", destination: "/products/studio#graph", permanent: true },
      { source: "/products/tracks", destination: "/products/studio#tracks", permanent: true },
    ];
  },
};

export default nextConfig;
