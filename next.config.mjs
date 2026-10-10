/** @type {import('next').NextConfig} */
const nextConfig = { output: "standalone", transpilePackages: ["ably"], images: { remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }] } };
export default nextConfig;
