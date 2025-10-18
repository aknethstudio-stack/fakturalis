# Gemini Project Context: Fakturalis

This document provides context for the Fakturalis project, a SaaS invoicing application tailored for the Polish market.

## Project Overview

Fakturalis is a modern, full-stack web application built with Next.js and TypeScript. It leverages Supabase for its backend, including database (PostgreSQL), authentication, and real-time capabilities. The frontend is built with React 19 and styled using Tailwind CSS. The application is designed to be a competitive alternative to existing invoicing solutions in Poland, with a strong focus on user experience, modern technology, and compliance with Polish legal requirements (like KSeF - the National e-Invoicing System).

### Key Technologies

- **Framework**: Next.js 15
- **Language**: TypeScript 5.9
- **UI Library**: React 19
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Styling**: Tailwind CSS
- **Testing**: Jest & React Testing Library
- **Linting/Formatting**: ESLint, Prettier, Stylelint
- **DevOps**: Husky, Conventional Commits, Git Flow, Vercel

## Building and Running

The project uses `npm` as the package manager. Key scripts are defined in `package.json`.

### Initial Setup

To set up the development environment and install dependencies, run:

```bash
npm run setup
```

You will also need to create a `.env.local` file from the `.env.example` template for environment variables.

### Development

To run the development server:

```bash
npm run dev
```

For a potentially faster development experience using Turbopack:

```bash
npm run dev:turbo
```

### Production

To build the application for production:

```bash
npm run build
```

To start the production server after building:

```bash
npm run start
```

### Testing

To run the test suite:

```bash
npm test
```

To run tests in a CI environment (includes coverage):

```bash
npm run test:ci
```

## Development Conventions

- **Version Control**: The project uses Git Flow, with `main` for production and `develop` for integration. Feature branches should be created from `develop`.
- **Commits**: Commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. This is enforced by `commitlint`.
- **Code Quality**: A pre-commit hook (managed by Husky) runs `npm run check`, which includes type-checking, linting, stylelint, and running tests. All checks must pass before committing.
- **Coding Style**:
  - TypeScript is used with `strict` mode enabled.
  - Code should be self-documenting. Inline comments are discouraged.
  - The UI and all user-facing text are in Polish.
  - Database interactions must respect Row Level Security (RLS) policies, typically using an `owner_id` column to scope data.
- **Dependencies**: Use `npm` to manage dependencies. After adding a new dependency, ensure it doesn't introduce security vulnerabilities.
