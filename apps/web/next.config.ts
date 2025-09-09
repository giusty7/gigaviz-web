/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    transpilePackages: ['@gv/config', '@gv/http'],
  },
};

export default nextConfig;