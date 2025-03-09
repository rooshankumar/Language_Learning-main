
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // serverExternalPackages removed as it's not valid in Next.js 15+
  },
  images: {
    domains: ['res.cloudinary.com'],
  },
  reactStrictMode: true,
};

export default nextConfig;
