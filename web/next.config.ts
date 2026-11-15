import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/**
 * Content-Security-Policy: tells the browser which sites the page may load code
 * and data from. What we allow, and why:
 *  - Supabase (https + wss): the database and sign-in.
 *  - cdn.jsdelivr.net: the Python runtime (Pyodide) that runs student code.
 *  - Google Translate hosts: the language picker (only loads if someone picks a language).
 *  - 'unsafe-inline': Next.js inserts small inline scripts and styles. 'unsafe-eval' and
 *    'wasm-unsafe-eval': Python-in-the-browser needs them. This still blocks code from any
 *    site not listed, framing by other sites, and form posts to other sites.
 * Production only: `next dev` needs looser rules for hot reload.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://cdn.jsdelivr.net https://translate.google.com https://translate.googleapis.com https://www.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://www.gstatic.com https://translate.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://cdn.jsdelivr.net https://translate.googleapis.com https://translate-pa.googleapis.com",
  "worker-src 'self' blob:",
  "frame-src https://translate.google.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  // Nobody else's site may put ours in a frame (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Browsers only use https for this site (ignored on http://localhost).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  // Switch off browser features the site never uses.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  // Report-Only until it has been tried on the live site: it logs anything it would block in
  // the browser console but blocks nothing. Rename to "Content-Security-Policy" to enforce it.
  ...(isProd ? [{ key: "Content-Security-Policy-Report-Only", value: csp }] : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
