/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/palisair_contents/**",
      },
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
    ],
    unoptimized: true,
  },
};

export default nextConfig;
