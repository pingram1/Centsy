import type { NextConfig } from "next";
import os from "node:os";
import path from "node:path";

/** Hostnames allowed to hit Next.js dev assets (HMR, /_next/*) from a phone on LAN. */
function lanDevOrigins(): string[] {
  const origins = new Set<string>(["127.0.0.1", "localhost"]);

  for (const raw of [
    process.env.EXPO_PUBLIC_API_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ]) {
    if (!raw) continue;
    try {
      origins.add(new URL(raw).hostname);
    } catch {
      /* ignore invalid URLs */
    }
  }

  // Auto-allow this machine's private IPv4 addresses (Expo / Plaid Link on device).
  for (const nets of Object.values(os.networkInterfaces())) {
    for (const net of nets ?? []) {
      if (net.family !== "IPv4" || net.internal) continue;
      origins.add(net.address);
    }
  }

  return [...origins];
}

const nextConfig: NextConfig = {
  allowedDevOrigins: lanDevOrigins(),
  // Avoid webpack/Turbopack walking Expo, agent skills, and simulation scripts.
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        "**/.git/**",
        "**/node_modules/**",
        "**/.next/**",
        "**/mobile/**",
        "**/.cursor/**",
        "**/.agents/**",
        "**/scripts/**",
      ],
    };
    return config;
  },
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
