import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  fallbacks: {
    document: "/offline",
  },
  runtimeCaching: [
    {
      urlPattern: ({ request }) => request.destination === "document",
      handler: "NetworkFirst",
      options: {
        cacheName: "pages",
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: ({ request }) =>
        ["style", "script", "worker", "image", "font"].includes(
          request.destination
        ),
      handler: "CacheFirst",
      options: {
        cacheName: "assets",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        },
      },
    },
  ],
})(nextConfig);
