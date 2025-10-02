# Git Workflow

Git Flow workflow for InvoiceForge development.

## Branch Structure

- `master` - Production (Vercel deployment)
- `develop` - Integration branch
- `feature/INV-123-description` - Feature branches
- `release/x.y.z` - Release preparation
- `hotfix/x.y.z` - Production fixes

## Feature Development

```bash
# Start feature
git checkout -b feature/INV-123-pdf-export develop

# Work and commit
git commit -m "feat(pdf): add export functionality"

# Finish feature
git checkout develop
git merge --no-ff feature/INV-123-pdf-export
git branch -d feature/INV-123-pdf-export
git push origin develop
```

## Release Process

```bash
# Start release
git checkout -b release/1.2.3 develop

# Update version and changelog
npm run release -- --release-as minor

# Finish release
git checkout master
git merge --no-ff release/1.2.3
git tag v1.2.3
git checkout develop
git merge --no-ff release/1.2.3
git push origin master develop --follow-tags
```

## Hotfix Process

```bash
# Start hotfix
git checkout -b hotfix/1.2.4 master

# Fix and commit
git commit -m "fix(vat): correct rounding calculation"

# Finish hotfix
git checkout master
git merge --no-ff hotfix/1.2.4
git tag v1.2.4
git checkout develop
git merge --no-ff hotfix/1.2.4
git push origin master develop --follow-tags
```

## Commit Convention

Use Conventional Commits format:

- `feat(scope): add new feature`
- `fix(scope): fix bug`
- `docs: update documentation`
- `chore: update dependencies`
