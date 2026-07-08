import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  reloadOnOnline: true,
  disable: false, // Enabled in dev to allow testing offline mode
});

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['better-sqlite3'],
  turbopack: {},
};

export default withSerwist(nextConfig);
