import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // allow opening the dev server from phones on the same Wi-Fi (http://<laptop-ip>:3000)
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
