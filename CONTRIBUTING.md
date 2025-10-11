# Contributing to Fakturalis

Thanks for your interest in contributing to Fakturalis! This guide explains how to set up your
development environment, our branching model (Git Flow), commit conventions (Conventional Commits),
pull request (PR) process, and general coding standards.

If you’re unsure about anything, feel free to open a draft PR early or start a discussion in issues.

---

## Table of contents

- Project setup
- Branching model (Git Flow)
- Commit conventions (Conventional Commits)
- Pull request process
- Coding standards and tooling
- Testing
- Environment and secrets
- Releases and versioning
- Code ownership, license, and conduct

---

## Project setup

Prerequisites:

- Node.js v22 (see `.nvmrc`)
- npm >= 10
- Git (with Git Flow if you plan to run its helpers)
- A working modern editor (VS Code, Zed, WebStorm, etc.) with ESLint/Prettier integrations enabled

Clone and install:

    git clone https://github.com/aknethstudio-stack/fakturalis.git
    cd fakturalis
    nvm use           # if you use nvm; otherwise ensure Node v22
    npm ci            # install exact, locked dependencies
    npm run prepare   # sets up Husky hooks

Useful scripts:

- Start dev server:

      npm run dev

- Build:

      npm run build

- Lint (ESLint):

      npm run lint

- Stylelint:

      npm run stylelint
      npm run stylelint:fix

- Format code (Prettier):

      npm run format

- Tests:

      npm test
      npm run test:watch
      npm run test:coverage

- Check last commit message locally with Commitlint:

      npm run commitlint

---

## Branching model (Git Flow)

We use Git Flow semantics with `main` and `develop` branches:

- `main` — production-ready code (deploys to production on Vercel)
- `develop` — integration branch for features and upcoming releases

Branch naming:

- Features: `feature/short-description` (no ticket required)
- Fixes: `fix/short-description` (or `feat/...` if it’s a new feature)
- Releases: `release/x.y.z`
- Hotfixes: `hotfix/x.y.z`

**Branch naming** nie wymaga numerów ticketów ani formalnych zgłoszeń. Zgłaszanie issue na GitHub jest możliwe i mile widziane – możesz raportować błędy, pomysły i zadania według własnych potrzeb.

Przykłady:

git checkout -b feature/dashboard-analytics
git checkout -b fix/currency-rounding
git checkout -b release/1.2.3
git checkout -b hotfix/1.2.4

Typowy flow:

1. Branch z `develop` dla funkcji/poprawek.
2. PR do `develop` gdy gotowe.
3. Release: `release/x.y.z` z `develop`, QA, PR do `main` i `develop`.
4. Hotfix: `hotfix/x.y.z` z `main`, merge do `main` i z powrotem do `develop`.

Możesz używać git-flow lub zwykłych komend git — ważne, by zachować model branchowania.

---

## Commit conventions (Conventional Commits)

We enforce Conventional Commits via Commitlint (Husky `commit-msg` hook):

- Format: `<type>(<optional scope>): <short summary>`
- Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`,
  `revert`
- Use `!` for breaking changes: `feat!: ...`
- Provide details in the body if needed; reference issues like `Closes #123`.

Examples:

- `feat(invoice): add VAT rate presets`
- `fix(pdf): correct page margins on export`
- `docs(readme): add deployment info`
- `refactor(ui): simplify invoice form state`
- `chore(release): v1.2.3`

Check locally:

    npm run commitlint

---

## Pull request process

- Open PRs from your topic branch to `develop` (or to `main` for hotfixes).
- Keep PRs focused and reasonably small. Large changes should be split if possible.
- PR title should follow Conventional Commits (recommended).
- PR description:
  - Explain the “why” and “what”
  - Include screenshots/recordings if UI-related
  - List breaking changes and migration notes if any
- CI/Checks to pass before merge:
  - Lint (ESLint + Stylelint)
  - Prettier formatting
  - Tests (if applicable)
  - Build (locally or CI)
- Ensure code owners get notified/assigned (see `CODEOWNERS`).
- After review approvals and green checks, squash-merge or rebase-merge (prefer consistent strategy
  in the repo).

---

## Coding standards and tooling

Tech stack highlights:

- Next.js (App Router), React, TypeScript
- Tailwind CSS v4 with SCSS, PostCSS (Autoprefixer)
- ESLint (flat config), Prettier (with `prettier-plugin-tailwindcss`), Stylelint

Guidelines:

- TypeScript: strive for strong types; avoid `any` unless justified.
- Tailwind: class sorting and grouping is handled by Prettier’s Tailwind plugin.
- Global styles: Tailwind v4 via `@import "tailwindcss";` in `src/styles/global.scss`.
- Keep components small, composable, and accessible.
- Avoid committing generated artifacts and secrets (see `.gitignore`, `.prettierignore`).

Run locally before pushing:

    npm run lint
    npm run stylelint
    npm run format
    npm test

Husky hooks run lint-staged on commit to keep quality high.

---

## Testing

- Test environment: Jest (`jsdom`) with a project-level setup file (`jest.setup.ts`).
- Place tests near the code when practical, e.g. `Component.test.tsx`.
- Recommended libraries (optional): React Testing Library, MSW for API mocks.
- Keep tests deterministic; time-zone sensitive code should assume UTC in tests.

Commands:

    npm test
    npm run test:watch
    npm run test:coverage

---

## Environment and secrets

- Never commit real secrets. Use `.env.local` for local dev; see `.env.example` for variables.
- Distinguish environments (e.g. `NEXT_PUBLIC_APP_ENV` as `development`, `preview`, `production`).
- For Vercel:
  - Set Production and Preview env variables in the Vercel dashboard.
  - `main` → Production deploys; PR branches → Preview deploys.

---

## Releases and versioning

- Follow Semantic Versioning: `MAJOR.MINOR.PATCH`.
- Release branches: `release/x.y.z` from `develop`.
- In the release branch:
  - Update version in `package.json` if needed.
  - Finalize changes, changelog/notes (can be generated from Conventional Commits in the PR UI).
- Merge release PR to `main` (production) and back to `develop` (to keep them in sync).
- Tag the release on `main` as `vX.Y.Z` (if not automated by your flow).
- Hotfixes:
  - Branch `hotfix/x.y.z` from `main`, fix, merge to `main` and back to `develop`, tag.

---

## Code ownership, license, and conduct

- Code owners: see `CODEOWNERS` for default and path-specific ownership.
- License: AGPL-3.0-only (see `LICENSE`).
- Code of Conduct: see `CODE_OF_CONDUCT.md`. For conduct-related issues, open an issue or reach out
  to the maintainers referenced in the repository.

---

## Questions and support

- For bugs, open an issue with clear reproduction steps.
- For feature requests, start a discussion describing the problem and the proposed solution.
- For security concerns, avoid public disclosure; contact the maintainers privately if possible.

## Solo workflow

If you work solo, PRs are optional. You may finish feature/hotfix branches and merge directly
(feature → develop, hotfix → main) as long as lint/style/tests pass and commits follow Conventional
Commits. Git Flow still helps keep history tidy and releases consistent.

Thanks for contributing to Fakturalis!
