/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Disable serverless functions for better performance
  // experimental: {
  //   serverless: false
  // },
  // Optimize build output
  webpack: (config, { dev, isServer }) => {
    // Optimize only in production
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        minimize: true
      };
    }
    return config;
  }
};

module.exports = nextConfig; 