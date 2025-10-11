/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/**", // ✅ allow all paths
      },
      {
        protocol: "https",
        hostname: "kottayammedicalcollege.org",
        pathname: "/**", // ✅ allow all paths from this domain
      },
      {
        protocol: "https",
        hostname: "baberahma.com",
        pathname: "/**", // ✅ allow all paths from this domain
      },
    ],
  },
};

export default nextConfig;
