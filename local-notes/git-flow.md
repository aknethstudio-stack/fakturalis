# Git Flow — szybka ściągawka (lokalne, ignorowane przez Git)

Ten dokument to lokalny cheatsheet do codziennej pracy z Git Flow w projekcie InvoiceForge. Dotyczy
modelu: `main` (produkcja) + `develop` (integracja), feature/release/hotfix.

Uwaga:

- Pracujesz solo — PR-y są opcjonalne. Git Flow nadal pomaga utrzymać porządek i jednoznaczne
  wydania.
- Produkcja (Vercel) deployuje z `main`. Preview (Vercel) działa dla branchy/PR.

---

## 0) Wymagania i konfiguracja

- Wersje:
  - Node: `v22` (patrz `.nvmrc`)
  - npm: `>= 10`
- Zainstaluj git-flow (jeśli nie masz):
  - macOS: `brew install git-flow-avh`
  - Debian/Ubuntu: `sudo apt-get install git-flow`
- Konwencja commitów: Conventional Commits (Commitlint już skonfigurowany)

---

## 1) Inicjalizacja (pierwszy raz w repo)

Interaktywnie (polecane):

```bash
# załóż, że masz już main
git checkout -b develop
git flow init
# w kreatorze:
# Production branch: main
# Development branch: develop
# Prefixy: feature/, release/, hotfix/, support/
```

Bez interakcji (ręcznie):

```bash
git checkout -b develop
git config gitflow.branch.master main
git config gitflow.branch.develop develop
git config gitflow.prefix.feature "feature/"
git config gitflow.prefix.release "release/"
git config gitflow.prefix.hotfix "hotfix/"
git config gitflow.prefix.support "support/"
git config gitflow.prefix.versiontag ""
```

---

## 2) Nazewnictwo gałęzi

- Funkcjonalności: `feature/INV-123-krótki-opis`
- Poprawki: `fix/INV-456-krótki-opis` (lub `feature/...` jeśli faktycznie nowa funkcja)
- Wydania: `release/x.y.z`
- Hotfix: `hotfix/x.y.z`

Przykłady:

```bash
git checkout -b feature/INV-123-export-to-pdf
git checkout -b fix/INV-456-currency-rounding
git checkout -b release/1.2.3
git checkout -b hotfix/1.2.4
```

---

## 3) Feature workflow

Start:

```bash
git flow feature start INV-123-export-to-pdf
# lub klasycznie:
# git checkout -b feature/INV-123-export-to-pdf develop
```

Praca:

```bash
# commituj w konwencji Conventional Commits
git add -A
git commit -m "feat(pdf): add export to PDF with custom margins"
```

Publikacja (jeśli chcesz zdalny branch):

```bash
git flow feature publish INV-123-export-to-pdf
# lub:
# git push -u origin feature/INV-123-export-to-pdf
```

Zakończenie:

```bash
git flow feature finish INV-123-export-to-pdf
# to zmerguje do develop i usunie gałąź
# potem:
git push origin develop
git push origin :feature/INV-123-export-to-pdf  # (jeśli był zdalny)
```

Ręcznie zamiast git-flow:

```bash
git checkout develop
git merge --no-ff feature/INV-123-export-to-pdf
git branch -d feature/INV-123-export-to-pdf
git push origin develop
git push origin :feature/INV-123-export-to-pdf
```

---

## 4) Release workflow (stabilne wydanie)

Start release (z develop):

```bash
git flow release start 1.2.3
# lub:
# git checkout -b release/1.2.3 develop
```

W release branch:

- Dokończ drobne poprawki, dokumentację.
- Uaktualnij wersję i CHANGELOG lokalnie narzędziem standard-version:

Opcja A: automatycznie (na bazie commitów):

```bash
npm run release -- --release-as minor  # lub patch/major/podaj samodzielnie
# to:
# - uaktualni package.json
# - wygeneruje/uzupełni CHANGELOG.md
# - zrobi commit "chore(release): vX.Y.Z"
# - wystawi tag "vX.Y.Z" (lokalnie)
```

Opcja B: ręczne zmiany (jeśli wolisz), a changelog później.

Zakończenie release:

```bash
git flow release finish 1.2.3
# to zmerguje do main i develop, doda tag
# na koniec:
git push origin main --follow-tags
git push origin develop
```

Uwaga: Vercel automatycznie wdroży zmiany z `main` na produkcję.

---

## 5) Hotfix workflow (pilna poprawka na produkcji)

Start hotfix (od main):

```bash
git flow hotfix start 1.2.4
# lub:
# git checkout -b hotfix/1.2.4 main
```

Praca + commit:

```bash
git add -A
git commit -m "fix(invoice): correct VAT rounding for edge cases"
```

Finalizacja:

```bash
# (opcjonalnie bump z standard-version, jeśli chcesz zaktualizować CHANGELOG)
# npm run release -- --release-as patch

git flow hotfix finish 1.2.4
git push origin main --follow-tags
git push origin develop
```

---

## 6) Prerelease (alpha/beta/rc) — ręcznie (opcjonalnie)

Start serii:

```bash
# przykład: start alphy od minor
npm run release -- --release-as minor --prerelease alpha
# tag: v1.3.0-alpha.0
```

Kolejne prereleasy w tej samej serii:

```bash
npm run release -- --prerelease alpha
# v1.3.0-alpha.1
```

Zmiana kanału:

```bash
npm run release -- --prerelease beta
# v1.3.0-beta.0
```

Promocja do stabilnego:

```bash
npm run release
# v1.3.0
```

Pamiętaj o wypchnięciu tagów:

```bash
git push --follow-tags
```

---

## 7) Dodatkowe przydatne komendy

Lista branchy git-flow:

```bash
git flow feature list
git flow release list
git flow hotfix list
```

Usuwanie branchy:

```bash
# lokalnie
git branch -d feature/INV-123-export-to-pdf
# zdalnie
git push origin :feature/INV-123-export-to-pdf
```

Aktualizacja develop przed startem nowej pracy:

```bash
git checkout develop
git pull --ff-only
```

Rebase funkcjonalności na świeży develop (gdy potrzeba):

```bash
git checkout feature/INV-123-export-to-pdf
git fetch origin
git rebase origin/develop
# rozwiąż konflikty, potem:
git rebase --continue
```

Anulowanie rebase/merge w razie problemów:

```bash
git rebase --abort
git merge --abort
```

Czyszczenie branchy:

```bash
git fetch --prune
git branch -vv
```

---

## 8) Konwencje commitów (Conventional Commits) — skrót

Format:

```
<type>(<opcjonalny scope>): <krótki opis>
```

Najczęstsze typy:

- feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
- breaking change: `feat!: ...` albo w treści `BREAKING CHANGE: ...`

Przykłady:

```bash
feat(invoice): add VAT presets
fix(pdf): correct page margins on export
chore(release): v1.2.3
```

---

## 9) Typical Flow (solo)

Feature:

```bash
git checkout -b feature/INV-123-opis develop
# kod, commit
git checkout develop
git merge --no-ff feature/INV-123-opis
git branch -d feature/INV-123-opis
git push origin develop
```

Release:

```bash
git checkout -b release/1.2.3 develop
npm run release -- --release-as minor   # lub patch/major
git checkout main
git merge --no-ff release/1.2.3
git checkout develop
git merge --no-ff release/1.2.3
git tag v1.2.3
git branch -d release/1.2.3
git push origin main develop --follow-tags
```

Hotfix:

```bash
git checkout -b hotfix/1.2.4 main
# fix, commit
git checkout main
git merge --no-ff hotfix/1.2.4
git checkout develop
git merge --no-ff hotfix/1.2.4
git tag v1.2.4
git branch -d hotfix/1.2.4
git push origin main develop --follow-tags
```

---

## 10) Najczęstsze pułapki

- Konflikt rootDir w TS: już poprawione (rootDir na `.`); trzymaj configi w root, kod w `src/`.
- Brak tagów po wydaniu: używaj `--follow-tags` przy push.
- Zmiany w release bez aktualizacji wersji/changelog: użyj `standard-version`.
- Brak konsekwencji w nazwach branchy: trzymaj konwencję (`feature/…`, `release/x.y.z`,
  `hotfix/x.y.z`).
- Zmiany na `main` poza release/hotfix: unikaj — trzymaj czystość historii.

---

## 11) Szybkie checklisty

Feature finish:

- [ ] Lint/format/test przechodzą
- [ ] Konwencja commitów trzymana
- [ ] Merge do `develop`
- [ ] Push

Release finish:

- [ ] Wersja i CHANGELOG uaktualnione (`standard-version`)
- [ ] Merge do `main` i `develop`
- [ ] Tag `vX.Y.Z`
- [ ] Push z tagami (`--follow-tags`)

Hotfix finish:

- [ ] Poprawka gotowa, testy
- [ ] Merge do `main` i `develop`
- [ ] Tag `vX.Y.Z`
- [ ] Push z tagami

---
