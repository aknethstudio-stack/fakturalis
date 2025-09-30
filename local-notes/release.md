# Local Release & Versioning Cheatsheet

This is a step-by-step guide for creating releases locally (no CI) with semantic versioning and a
generated changelog. It is tailored for this project’s setup (standard-version + Conventional
Commits + Git Flow).

— Solo-friendly — Local-only (no GitHub Actions needed) — Works with Git Flow branches
(develop/main + release/hotfix)

---

## Requirements

- Node v22 (see `.nvmrc`): `nvm use`
- Dependencies installed: `npm ci`
- Conventional Commits enforced by Commitlint (e.g., `feat:`, `fix:`, …)

Tools in use:

- Versioning & changelog: `standard-version`
- Branching model: Git Flow semantics (optional helpers)

---

## Semantic Versioning (SemVer)

- MAJOR: breaking, incompatible changes (X.y.z)
- MINOR: new features, backward-compatible (x.Y.z)
- PATCH: fixes, backward-compatible (x.y.Z)

Mapping from Conventional Commits (Angular preset) as used by standard-version:

- BREAKING CHANGE: or `type!:` → MAJOR bump
- feat: → MINOR bump
- fix:, perf:, revert: → PATCH bump
- Other types (docs, style, refactor, chore, test, build, ci) do not bump unless marked as breaking

Note: standard-version infers the bump from commits since the last tag when you run
`npm run release` without `--release-as`. You can always override explicitly with `--release-as`.

---

## Pre-flight Checklist (before any release)

1. Ensure a clean working tree:
   - `git status` → no uncommitted changes (or commit/stash them first).

2. Update and verify:
   - `git fetch --all --prune`
   - On your working branch: `git pull --ff-only`

3. Quality gates:
   - `npm run lint`
   - `npm run stylelint`
   - `npm run format`
   - `npm test`

4. Decide the version bump:
   - patch / minor / major
   - or prerelease (alpha, beta, rc)

---

## Standard (Stable) Release — Step-by-step

Scenario A: using a release branch (recommended with Git Flow)

1. Create a release branch from develop:
   - `git checkout -b release/X.Y.Z develop`
2. Generate version + changelog:
   - Automatic bump (based on commits): `npm run release`
   - OR explicit bump: `npm run release:patch` (or `:minor`, `:major`)
3. Review changes:
   - `package.json`: version updated
   - `CHANGELOG.md`: entries added
   - A release commit and tag `vX.Y.Z` were created locally
4. Merge and push:
   - Merge release → main, then release → develop
     - With git-flow: `git flow release finish X.Y.Z`
     - Manually:
       - `git checkout main && git merge --no-ff release/X.Y.Z`
       - `git checkout develop && git merge --no-ff release/X.Y.Z`
       - `git branch -d release/X.Y.Z`
   - Push with tags:
     - `git push origin main develop --follow-tags`
5. Deployment:
   - Vercel deploys `main` to Production automatically

Scenario B: quick release directly (small projects)

1. Work off develop (or a dedicated release branch if you prefer)
2. Run release:
   - `npm run release` (auto) or `npm run release:patch|minor|major`
3. Push with tags (if releasing from develop, merge to main after):
   - `git push --follow-tags`
   - Merge to main and push to trigger Production deploy

---

## Hotfix Release (from main) — Step-by-step

1. Branch from main:
   - `git checkout -b hotfix/X.Y.Z main`
2. Implement and commit fix (Conventional Commits, typically `fix:`)
3. Bump + changelog (usually patch):
   - `npm run release:patch`
4. Finish hotfix:
   - With git-flow: `git flow hotfix finish X.Y.Z`
   - Manually:
     - `git checkout main && git merge --no-ff hotfix/X.Y.Z`
     - `git checkout develop && git merge --no-ff hotfix/X.Y.Z`
     - `git branch -d hotfix/X.Y.Z`
5. Push with tags:
   - `git push origin main develop --follow-tags`
6. Vercel deploys Production from `main`

---

## Prereleases (alpha, beta, rc) — Manual Control

Start a prerelease line (example: alpha from a minor bump):

- `npm run release -- --release-as minor --prerelease alpha` → creates `vX.Y.Z-alpha.0`

Create the next prerelease in the same line:

- `npm run release -- --prerelease alpha` → `vX.Y.Z-alpha.1`, etc.

Change channel (e.g., to beta):

- `npm run release -- --prerelease beta` → `vX.Y.Z-beta.0`

Promote to stable:

- `npm run release` → `vX.Y.Z`

Always push with tags:

- `git push --follow-tags`

Tip: You can do prereleases on a release branch, then finish (merge to main/develop) when ready.

---

## Preview Changelog Without Changing Files

- `npm run changelog`
  - Runs standard-version in dry-run mode to preview the upcoming changelog

---

## Undo the Last Release (Use with Care)

If you need to undo the most recent `standard-version` run:

1. Delete the tag:
   - `git tag -d vX.Y.Z`
2. Reset the release commit:
   - `git reset --hard HEAD~1`

Note: Do not rewrite public history if you’ve already pushed. If tags/commits were pushed, prefer a
new corrective release.

---

## Typical Flows (Short Recipes)

Feature → Release:

1. `git checkout -b feature/KEY-desc develop`
2. work, `git commit -m "feat(scope): ..."`
3. `git checkout -b release/X.Y.Z develop`
4. `npm run release -- --release-as minor`
5. Merge release → main & develop; push with tags

Hotfix:

1. `git checkout -b hotfix/X.Y.Z main`
2. work, `git commit -m "fix(scope): ..."`
3. `npm run release:patch`
4. Merge hotfix → main & develop; push with tags

Prerelease (alpha):

1. On release branch: `npm run release -- --release-as minor --prerelease alpha`
2. Iterate: `npm run release -- --prerelease alpha`
3. Promote: `npm run release`
4. Finish release; push with tags

---

## Dos & Don’ts

Do:

- Keep commits in Conventional Commits
- Run lint/tests before releasing
- Review CHANGELOG additions
- Push with `--follow-tags`

Don’t:

- Commit directly to `main` (except via hotfix flow)
- Publish secrets or generated artifacts
- Force-push release tags after they’re published

---

## Quick Commands Reference

- Stable release (auto):  
  `npm run release`
- Stable release (explicit):
  - Patch: `npm run release:patch`
  - Minor: `npm run release:minor`
  - Major: `npm run release:major`
- Prerelease:
  - Start: `npm run release -- --release-as minor --prerelease alpha`
  - Next: `npm run release -- --prerelease alpha`
  - Promote to stable: `npm run release`
- Preview only:  
  `npm run changelog`
- Push with tags:  
  `git push --follow-tags`

---

## Notes

- This project tags releases with a `v` prefix (e.g., `v1.2.3`).
- The release commit message template is `chore(release): v{{currentTag}}`.
- If you need to adjust the changelog wording, you can edit `CHANGELOG.md` after generation (before
  pushing).
- Vercel automatically deploys `main` to Production; Preview deployments are created for non-main
  branches/PRs.
