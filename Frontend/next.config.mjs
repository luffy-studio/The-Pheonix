/** @type {import('next').NextConfig} */
const isVercel = Boolean(process.env.VERCEL);
const isDocker = process.env.NEXT_OUTPUT_STANDALONE === "true" || process.env.DOCKER_BUILD === "true";

const nextConfig = {
  reactStrictMode: true,
  output: !isVercel && isDocker ? "standalone" : undefined,
  images: {
    domains: ["assets.co.dev", "images.unsplash.com", "api.dicebear.com"],
  },
  webpack: (config, context) => {
    config.optimization.minimize = process.env.NEXT_PUBLIC_CO_DEV_ENV !== "preview";
    return config;
  },
};

export default nextConfig;
