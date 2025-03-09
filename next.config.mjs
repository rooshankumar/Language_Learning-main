
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['lh3.googleusercontent.com', 'res.cloudinary.com'],
  },
  webpack: (config) => {
    config.experiments = { ...config.experiments, topLevelAwait: true };
    return config;
  },
  // Optimize chunk size and improve loading
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
  // Fix for mobile devices
  poweredByHeader: false,
};

export default nextConfig;
