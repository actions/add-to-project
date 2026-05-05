# Releasing

This project uses [semantic-release](https://github.com/semantic-release/semantic-release) to automate versioning and publishing. Releases are triggered automatically when commits are pushed to the `main` branch (typically via merged pull requests).

## How it works

1. A pull request is merged into `main`
2. A maintainer triggers the [Release workflow](../../actions/workflows/release.yml) manually from the Actions tab
3. `semantic-release` analyzes commit messages since the last release to determine the version bump
4. If a release is warranted, it:
   - Rebuilds the `dist/` directory
   - Creates a new git tag (e.g., `v2.1.0`)
   - Publishes a GitHub Release with auto-generated release notes
   - Updates the major version tag (e.g., `v2`) to point to the new release

## Running a release

Navigate to **Actions → Release → Run workflow** in the GitHub UI.

### Dry-run (validate before releasing)

1. Select the `main` branch
2. Check **"Run in dry-run mode"** (enabled by default)
3. Click **Run workflow**

The workflow will report what version would be created and which commits would be included — without making any changes.

### Actual release

1. Select the `main` branch
2. **Uncheck** "Run in dry-run mode"
3. Click **Run workflow**

The workflow will create the tag, GitHub Release, and update the major version tag.

## Commit message format

This project follows [Conventional Commits](https://www.conventionalcommits.org/). The commit message format determines the type of version bump:

### Patch release (e.g., 2.0.0 → 2.0.1)

```
fix: correct label matching when using NOT operator
```

```
fix(api): handle pagination edge case for large projects
```

### Minor release (e.g., 2.0.0 → 2.1.0)

```
feat: add support for custom field values
```

```
feat(filter): support regex patterns in label matching
```

### Major release (e.g., 2.1.0 → 3.0.0)

```
feat: redesign configuration format

BREAKING CHANGE: The `project-url` input now requires the full API URL.
Users must update their workflow files.
```

### No release

Commits that don't match a release pattern (e.g., `chore:`, `docs:`, `ci:`, `test:`, `refactor:`) will **not** trigger a release.

```
docs: update usage examples in README
chore: update dev dependencies
ci: add Node.js 22 to test matrix
test: add coverage for label-operator input
refactor: simplify GraphQL query construction
```

## Commit message structure

```
<type>(<optional scope>): <description>

[optional body]

[optional footer(s)]
```

### Types reference

| Type | Description | Triggers release? |
|------|-------------|-------------------|
| `feat` | A new feature | ✅ Minor |
| `fix` | A bug fix | ✅ Patch |
| `perf` | Performance improvement | ✅ Patch |
| `docs` | Documentation only | ❌ |
| `chore` | Maintenance tasks | ❌ |
| `ci` | CI/CD changes | ❌ |
| `test` | Adding/updating tests | ❌ |
| `refactor` | Code refactoring | ❌ |
| `style` | Code style (formatting) | ❌ |
| `build` | Build system changes | ❌ |

### Breaking changes

To trigger a major version bump, include `BREAKING CHANGE:` in the commit footer:

```
feat: change default label-operator to AND

BREAKING CHANGE: The default value for label-operator has changed from OR to AND.
Workflows relying on the previous default must explicitly set `label-operator: OR`.
```

## Major version tag

The major version tag (e.g., `v2`) is automatically updated to point to the latest release. This allows users to pin to a major version in their workflows:

```yaml
- uses: actions/add-to-project@v2  # Always gets the latest v2.x.x
```

## Manual intervention

### Verifying the release configuration

To dry-run the release process locally (no changes will be published):

```shell
npx semantic-release --dry-run
```

## Troubleshooting

### Release didn't trigger

- Ensure the commit message follows the Conventional Commits format
- Only `feat:`, `fix:`, and `perf:` types trigger releases by default
- Check the [Actions tab](../../actions/workflows/release.yml) for workflow run logs
- Verify the commit was pushed to `main` (not a feature branch)

### Wrong version bump

- `feat:` always triggers a **minor** bump
- `fix:` and `perf:` always trigger a **patch** bump
- `BREAKING CHANGE` in the footer always triggers a **major** bump
- If multiple commits are in a single push, the highest-priority bump wins

### Major version tag not updated

- Check that the "Update major version tag" step ran in the workflow
- Ensure `GITHUB_TOKEN` has `contents: write` permission
- The step only runs when semantic-release creates a new tag
