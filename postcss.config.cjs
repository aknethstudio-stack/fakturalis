/**
 * PostCSS config for Next.js + Tailwind CSS v4
 *
 * - Tailwind v4 no longer uses the PostCSS plugin.
 *   Import it in your CSS instead:
 *     @import "tailwindcss";
 *
 * - Keep this file only for additional PostCSS plugins (e.g. autoprefixer).
 * - CommonJS format avoids ESM interop issues in various toolchains.
 */

module.exports = {
  plugins: {
    // IMPORTANT: Do NOT add 'tailwindcss' here in v4
    autoprefixer: {},
  },
};
