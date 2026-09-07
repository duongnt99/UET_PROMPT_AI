import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), display-capture=(self)" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

// React needs eval() in development to reconstruct server error stacks.
// Production CSP stays without 'unsafe-eval' — React never uses eval there.
const contentSecurityPolicy = [
  "default-src 'self'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' https: blob:",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "connect-src 'self' ws: wss:",
  "frame-src https:",
  "frame-ancestors 'self'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/overlay/:path*",
        headers: [
          ...securityHeaders,
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
      {
        source: "/((?!overlay/).*)",
        headers: [
          ...securityHeaders,
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
