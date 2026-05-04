import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined

const nextConfig: NextConfig = {
  // /favicon.ico è servito da public/favicon.ico (stesso asset di icon.png); header per ridurre cache stale in edge.
  async headers() {
    return [
      {
        source: "/favicon.ico",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, must-revalidate" }],
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
