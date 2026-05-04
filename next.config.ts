import type { NextConfig } from "next";
import { SITE_ICON_SEARCH } from "./src/lib/siteIconVersion";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined

const nextConfig: NextConfig = {
  // I browser chiedono /favicon.ico senza query: redirect a /icon.png?v=… (vedi src/lib/siteIconVersion.ts).
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: `/icon.png?${SITE_ICON_SEARCH}`,
        permanent: false,
      },
    ]
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
    proxyClientMaxBodySize: '25mb',
  },
  images: {
    remotePatterns: supabaseHostname
      ? [{ protocol: 'https', hostname: supabaseHostname }]
      : [],
  },
};

export default nextConfig;
