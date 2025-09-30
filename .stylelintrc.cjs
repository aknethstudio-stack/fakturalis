/** @type {import('stylelint').Config} */
module.exports = {
  // Use the SCSS-focused standard config
  extends: ['stylelint-config-standard-scss'],

  // Parse SCSS (and regular CSS) correctly
  customSyntax: 'postcss-scss',

  // Files/folders to ignore
  ignoreFiles: [
    '**/node_modules/**',
    '**/.next/**',
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/.turbo/**',
    '**/.swc/**',
  ],

  rules: {
    // Allow empty aggregator files (e.g., globals with only @imports)
    'no-empty-source': null,

    // Let the SCSS plugin handle at-rule validation
    'at-rule-no-unknown': null,

    // Tailwind v4 introduces @theme (and may still see @layer in code),
    // plus legacy directives if used in older snippets. Ignore these.
    'scss/at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'tailwind', // legacy (v2/v3)
          'apply', // legacy (v2/v3)
          'variants', // legacy (v2/v3)
          'responsive', // legacy (v2/v3)
          'screen', // legacy (v2/v3)
          'layer', // CSS Layers (used by Tailwind)
          'theme', // Tailwind v4 @theme directive
        ],
      },
    ],

    // Support modern color functions used by Tailwind theme tokens
    'function-no-unknown': [
      true,
      {
        ignoreFunctions: ['oklch', 'oklab'],
      },
    ],

    // Common, developer-friendly tweaks
    'selector-pseudo-element-no-unknown': [
      true,
      { ignorePseudoElements: ['v-deep'] }, // for rare cases (e.g., Vue deep selectors)
    ],
    'declaration-block-no-duplicate-properties': [
      true,
      {
        ignore: ['consecutive-duplicates-with-different-values'],
      },
    ],

    // Allow BEM notation for CSS class names (header__logo, footer__link, etc.)
    'selector-class-pattern': null,
  },
};
