/** @type {import('next').NextConfig} */
const isVercel = Boolean(process.env.VERCEL);
const isDocker = process.env.NEXT_OUTPUT_STANDALONE === "true" || process.env.DOCKER_BUILD === "true";

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  output: !isVercel && isDocker ? "standalone" : undefined,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
    domains: ["assets.co.dev", "images.unsplash.com", "api.dicebear.com"],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  headers: async () => [
    {
      source: "/_next/static/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
    {
      source: "/favicon.ico",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=86400, stale-while-revalidate=604800",
        },
      ],
    },
  ],
  webpack: (config) => {
    config.optimization.minimize = process.env.NEXT_PUBLIC_CO_DEV_ENV !== "preview";
    return config;
  },
};

export default nextConfig;
