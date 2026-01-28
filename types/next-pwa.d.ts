declare module "next-pwa" {
  import type { NextConfig } from "next";

  const withPWA: <T extends NextConfig>(
    pwaConfig: Record<string, unknown>
  ) => (nextConfig: T) => T;

  export default withPWA;
}
