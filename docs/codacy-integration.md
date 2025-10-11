# 📊 Codacy Integration Guide

## Overview

Fakturalis używa **Codacy** jako głównego narzędzia do monitorowania jakości kodu i coverage.
Codacy oferuje lepsze wsparcie dla TypeScript/React projektów niż tradycyjne narzędzia.

## 🎯 Korzyści Codacy vs Alternatives

### Codacy vs Codecov

- ✅ **Lepsze UI** - bardziej przejrzysty dashboard
- ✅ **Comprehensive analysis** - jakość kodu + coverage w jednym miejscu
- ✅ **Better TypeScript support** - native support dla TS projektów
- ✅ **PR integration** - lepsze komentarze w Pull Requestach
- ✅ **Security scanning** - wykrywanie vulnerabilities

### Codacy vs SonarCloud

- ✅ **Prostszy setup** - mniej konfiguracji
- ✅ **Lepsze badges** - ładniejsze i bardziej informacyjne
- ✅ **Free tier** - wystarczający dla projektów open source
- ✅ **GitHub integration** - native integration z GitHub

## 🛠️ Configuration

### 1. Repository Setup

Repository jest już skonfigurowany w Codacy:

- **URL**: <https://app.codacy.com/gh/aknethstudio-stack/fakturalis/dashboard>
- **Project ID**: `6386ac73fb494afa81495a0ecbf6f0fb` # (zmień w Codacy jeśli to nowy projekt)

### 2. Coverage Configuration

#### GitHub Actions (Automated)

```yaml
- name: Upload coverage to Codacy
  uses: codacy/codacy-coverage-reporter-action@v1
  if: success()
  with:
    project-token: ${{ secrets.CODACY_PROJECT_TOKEN }}
    coverage-reports: ./coverage/lcov.info
```

#### Manual Upload (Development)

```bash
# Generate coverage
npm run test:ci

# Upload to Codacy (requires CODACY_PROJECT_TOKEN)
npm run coverage:codacy
```

### 3. Quality Gates

Konfiguracja w `.codacy.yml`:

```yaml
coverage:
  range:
    - 50..60 # Orange (needs improvement)
    - 60..80 # Yellow (good)
    - 80..100 # Green (excellent)
```

**Current thresholds:**

- 🟢 **Excellent**: 80%+ coverage
- 🟡 **Good**: 60-80% coverage
- 🟠 **Needs improvement**: 50-60% coverage
- 🔴 **Poor**: <50% coverage

## 📈 Metrics Tracked

### Code Quality

- **Issues count** - ESLint violations, code smells
- **Duplication** - repeated code blocks
- **Complexity** - cyclomatic complexity
- **Security** - potential vulnerabilities

### Coverage Metrics

- **Line coverage** - % of lines executed
- **Branch coverage** - % of branches tested
- **Function coverage** - % of functions called
- **Statement coverage** - % of statements executed

## 🚀 Usage

### Development Workflow

1. **Write tests** for new features
2. **Run tests locally**: \`npm run test:ci\`
3. **Check coverage**: Open \`coverage/lcov-report/index.html\`
4. **Push to GitHub** - automatic Codacy analysis
5. **Review PR comments** - Codacy provides feedback

### Monitoring

#### Badges (README.md)

- ![Grade Badge](https://app.codacy.com/project/badge/Grade/6386ac73fb494afa81495a0ecbf6f0fb)
- ![Coverage Badge](https://app.codacy.com/project/badge/Coverage/6386ac73fb494afa81495a0ecbf6f0fb)

#### Dashboard Links

- **Main Dashboard**: <https://app.codacy.com/gh/aknethstudio-stack/fakturalis/dashboard>
- **Coverage Details**:
  <https://app.codacy.com/gh/aknethstudio-stack/fakturalis/coverage/dashboard>
- **Issues Overview**: <https://app.codacy.com/gh/aknethstudio-stack/fakturalis/issues>

## 🎯 Goals

### Short-term (Q4 2025)

- [ ] **70%+ coverage** dla core funkcjonalności
- [ ] **Grade A/B** w Codacy
- [ ] **Zero critical issues** w security scan

### Long-term (2026)

- [ ] **85%+ coverage** dla całego projektu
- [ ] **Grade A** consistently
- [ ] **Automated quality gates** w CI/CD

## 🔧 Troubleshooting

### Coverage Not Uploading

```bash
# Check if coverage file exists
ls -la coverage/lcov.info

# Verify token is set (GitHub Actions)
echo $CODACY_PROJECT_TOKEN

# Manual upload for debugging
npm run coverage:upload
```

### Low Coverage Warnings

```bash
# Find uncovered files
npm run test:coverage -- --verbose

# Generate detailed HTML report
npm run test:ci
open coverage/lcov-report/index.html
```

### Quality Issues

```bash
# Fix linting issues
npm run lint:fix

# Fix styling issues
npm run stylelint:fix

# Run full quality check
npm run check
```

## � Security & Branch Protection

Codacy monitoruje również bezpieczeństwo repozytorium. Aby uzyskać najwyższą ocenę:

### Required Security Settings

1. **Branch Protection Rules** - zobacz
   [GitHub Branch Protection Setup](./github-branch-protection.md)
2. **Required Status Checks** - CI musi przejść przed merge
3. **Code Review Requirements** - minimum 1 reviewer dla master

### Quick Setup

```bash
# Navigate to repository settings
# https://github.com/aknethstudio-stack/fakturalis/settings/branches

# Add protection rule for 'master' branch with:
# - Require pull request reviews (1 approver)
# - Require status checks (test job)
# - Include administrators
```

⚠️ **Warning**: Bez branch protection Codacy będzie pokazywać security alerts!

## �📚 Resources

- [Codacy Documentation](https://docs.codacy.com/)
- [Coverage Reporter](https://github.com/codacy/codacy-coverage-reporter)
- [Quality Settings](https://app.codacy.com/gh/aknethstudio-stack/fakturalis/settings)
- [Fakturalis Dashboard](https://app.codacy.com/gh/aknethstudio-stack/fakturalis/dashboard)

---

**💡 Pro Tip**: Używaj Codacy dashboard do identyfikowania problemów przed code review. To oszczędza
czas i poprawia jakość kodu!
