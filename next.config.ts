import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a cloudflared quick tunnel load dev assets when testing on a phone.
  allowedDevOrigins: ["*.trycloudflare.com"],
};

export default nextConfig;
