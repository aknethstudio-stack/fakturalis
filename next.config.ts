import type { NextConfig } from 'next';

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "object-src 'none'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.hcaptcha.com https://hcaptcha.com",
  "style-src 'self' 'unsafe-inline' https://hcaptcha.com https://newassets.hcaptcha.com",
  "connect-src 'self' https: wss: ws: https://hcaptcha.com https://api.hcaptcha.com",
  "frame-src 'self' https://hcaptcha.com https://newassets.hcaptcha.com",
].join('; ');

const nextConfig: NextConfig = {
  reactStrictMode: false,
  poweredByHeader: false,

  // Image formats optimized on Vercel
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // Global security and caching headers suitable for an invoicing app
  async headers() {
    return [
      // Security headers for all routes
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
        ],
      },

      // Aggressive caching for Next's static assets
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },

      // Reasonable caching for on-the-fly optimized images
      {
        source: '/_next/image',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=60, s-maxage=86400, stale-while-revalidate=604800' }],
      },

      // Long-term caching for public assets (adjust paths to your structure)
      {
        source: '/fonts/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/assets/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },

      // Prevent caching of API responses (sensitive invoicing data)
      {
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
    ];
  },
};

export default nextConfig;
