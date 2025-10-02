# GitHub Branch Protection Configuration

Branch protection rules for `master` and `develop` branches to enforce code quality and security
standards.

## Required Protection Rules

### Master Branch

- Pull request reviews: 1 required
- Status checks: `test` job from CI workflow
- Up-to-date branches required
- Administrator enforcement enabled
- Force pushes disabled
- Branch deletion disabled

### Develop Branch (Optional)

- Pull request reviews: 1 required
- Status checks: `test` job from CI workflow
- Administrator enforcement disabled

## Configuration Methods

### GitHub Web Interface

1. Navigate to repository Settings → Branches
2. Click "Add rule"
3. Set branch name pattern (`master` or `develop`)
4. Configure protection settings as specified above
5. Save protection rule
6. After first PR execution, return to add required status checks

### GitHub CLI

```bash
gh api repos/aknethstudio-stack/invoiceforge/branches/master/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["test"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  --field restrictions=null
```

### Terraform

```hcl
resource "github_branch_protection" "master" {
  repository_id = "invoiceforge"
  pattern       = "master"

  required_status_checks {
    strict   = true
    contexts = ["test"]
  }

  required_pull_request_reviews {
    required_approving_review_count = 1
    dismiss_stale_reviews          = true
  }

  enforce_admins      = true
  allows_deletions    = false
  allows_force_pushes = false
}
```

## Status Checks Integration

CI workflow jobs required for branch protection:

- `test` - runs `npm run test:ci`, type checking, linting
- Coverage upload to Codacy and Codecov

## Workflow Integration

Current CI workflow supports branch protection with `test` job that includes:

- Unit tests via Jest
- TypeScript type checking
- ESLint code analysis
- Stylelint CSS analysis
- Coverage reporting to Codacy/Codecov

## CODEOWNERS

Optional automatic reviewer assignment:

```text
* @aknethstudio-stack
/src/components/ @aknethstudio-stack
/src/app/api/ @aknethstudio-stack
*.json @aknethstudio-stack
.github/ @aknethstudio-stack
```

## Emergency Override

Temporary disable protection:

```bash
gh api repos/aknethstudio-stack/invoiceforge/branches/master/protection --method DELETE
```

Re-enable using configuration methods above.

## References

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches)
- [Codacy Security Requirements](https://docs.codacy.com/getting-started/supported-languages-and-tools/#security-analysis)
