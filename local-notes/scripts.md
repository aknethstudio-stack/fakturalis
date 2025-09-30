# Scripts & Tooling Cheatsheet (local)

This is a quick reference for the most common commands you’ll use in this project.

Project assumptions:

- Node v22 (use `nvm use`)
- npm >= 10
- Next.js 15 / React 19
- Tailwind CSS v4 with SCSS
- ESLint (flat config), Prettier (+ Tailwind plugin), Stylelint
- Local releases and changelog via standard-version

---

## 1) Setup & Environment

- Select Node version:

  ```
  nvm use
  ```

- Install dependencies (clean install using lockfile):

  ```
  npm ci
  ```

- Create local env file:
  ```
  cp .env.example .env.local
  ```

---

## 2) App lifecycle

- Dev server:

  ```
  npm run dev
  ```

- Dev server (Turbopack):

  ```
  npm run dev:turbo
  ```

- Production build:

  ```
  npm run build
  ```

- Start production server (after build):

  ```
  npm run start
  ```

- Clean Next.js cache (useful for odd build issues):
  ```
  rm -rf .next
  ```

---

## 3) Linting & Formatting

- ESLint (flat config):

  ```
  npm run lint
  ```

- Stylelint (SCSS/CSS/SASS):

  ```
  npm run stylelint
  npm run stylelint:fix
  ```

- Prettier (project-wide):

  ```
  npm run format
  # or:
  npx prettier . --check
  npx prettier . --write
  ```

- Run staged linters (what pre-commit does):
  ```
  npx lint-staged
  ```

Notes:

- Pre-commit (Husky) runs lint-staged with:
  - JS/TS: ESLint --fix + Prettier
  - CSS/SCSS/SASS: Stylelint --fix + Prettier
  - Others (json/md/yml/html/svg/etc.): Prettier

Troubleshooting:

- If Prettier complains about missing tailwind plugin, ensure deps are installed:
  ```
  npm i
  ```
- Restart your editor’s TS/ESLint/Prettier servers after config changes.

---

## 4) Tests

- Run tests:

  ```
  npm test
  ```

- Watch mode:

  ```
  npm run test:watch
  ```

- Coverage:
  ```
  npm run test:coverage
  ```

---

## 5) Commit conventions (Conventional Commits)

- Quick local check of last commit:
  ```
  npm run commitlint
  # or:
  npx commitlint --from=HEAD~1
  ```

Examples:

- `feat(invoice): add VAT presets`
- `fix(pdf): correct margins on export`
- `chore(release): v1.2.3`
- Use `!` or `BREAKING CHANGE:` for breaking changes.

---

## 6) Releases & Changelog (local, no CI)

We use `standard-version` to:

- bump version in package.json
- generate/append CHANGELOG.md
- commit release (chore) and create a tag

Basic:

```
npm run release          # auto based on commits (recommended)
npm run release:patch
npm run release:minor
npm run release:major
```

Preview (no changes written):

```
npm run changelog
```

Push with tags after a release:

```
git push --follow-tags origin <branch>
```

Prereleases (manual control):

```
# start alpha from a specific level:
npm run release -- --release-as minor --prerelease alpha  # vX.Y.Z-alpha.0

# next alpha from same line:
npm run release -- --prerelease alpha                      # vX.Y.Z-alpha.1

# change channel (e.g., beta):
npm run release -- --prerelease beta                       # vX.Y.Z-beta.0

# promote to stable:
npm run release                                            # vX.Y.Z
```

Undo last release (use with care):

```
# delete the tag
git tag -d vX.Y.Z
# reset the release commit
git reset --hard HEAD~1
```

---

## 7) Tailwind v4 + SCSS

- Global SCSS entry (imports Tailwind v4):

  ```
  src/styles/global.scss
  ```

  Must include:

  ```
  @import "tailwindcss";
  ```

- Customize theme via CSS @theme (v4):

  ```
  @theme {
    --color-brand: oklch(69% 0.15 248);
    --breakpoint-3xl: 120rem;
  }
  ```

- Do NOT add Tailwind as a PostCSS plugin in v4. Keep PostCSS for `autoprefixer` only.

---

## 8) TypeScript tips

- Type-check only (no emit):
  ```
  npx tsc --noEmit
  ```
- Root dir is project root (configs can live in root, app code in `src/`).
- Jest types included; test env is `jsdom`.

---

## 9) Vercel deploy

- Production: merge/push to `main`.
- Preview: any non-main branch / PR.
- Set environment variables in Vercel dashboard (Production vs Preview).
- Security headers are configured in `next.config.ts`.

---

## 10) Useful one-liners

- Show current Node/npm versions:

  ```
  node -v && npm -v
  ```

- Update all deps according to package.json ranges (careful):

  ```
  npm update
  ```

- Search TODO/FIXME:

  ```
  grep -R --line-number --color=always -E "TODO|FIXME" src
  ```

- Clear node_modules and reinstall (nuclear option):
  ```
  rm -rf node_modules package-lock.json
  npm ci
  ```

---

## 11) Quick checklist (before release)

- [ ] `npm run lint` and `npm run stylelint`
- [ ] `npm run format`
- [ ] `npm test`
- [ ] `npm run release` (or `--release-as <level>` / prerelease flags)
- [ ] `git push --follow-tags`
