# Repolinter — GitHub Action

Lint open source repositories for common issues — directly from a GitHub Actions workflow.

This action is a thin composite wrapper around the
[`ghcr.io/damian-buho/repolinter`](https://github.com/damian-buho/repolinter/pkgs/container/repolinter)
image. It runs Repolinter against the checked-out workspace (or a remote Git URL),
renders the markdown report into the run summary, optionally posts it as a sticky
PR comment, and gates the job on a configurable severity threshold.

## Quick start

```yaml
name: Repolinter
on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents:      read
  pull-requests: write  # only needed when `comment: true`

jobs:
  repolinter:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: damian-buho/repolinter@v1
        with:
          config_file: .github/repolinter.yaml
          comment:     ${{ github.event_name == 'pull_request' }}
```

## Version pinning

| Tag           | Selects                                        | Recommended for             |
| ------------- | ---------------------------------------------- | --------------------------- |
| `@v1`         | Latest 1.x release (floating major)            | Most consumers              |
| `@v1.2`       | Latest 1.2.x release (floating minor)          | When 1.x has breaking work  |
| `@1.2.3`      | Exact release                                  | Reproducible / locked repos |
| `@main`       | Bleeding edge from the default branch          | Not recommended             |

Floating major/minor tags are moved automatically by the release pipeline and
will never include a breaking change within the same major.

## Inputs

| Name           | Default        | Description                                                                                          |
| -------------- | -------------- | ---------------------------------------------------------------------------------------------------- |
| `directory`    | `.`            | Target directory to lint, relative to `$GITHUB_WORKSPACE`. With `git: true`, treat as a Git URL.     |
| `git`          | `false`        | Clone `directory` as a Git URL before linting (lints a remote repo, not the checked-out one).        |
| `config_file`  | *(empty)*      | Path or URL to a Repolinter ruleset (json/yaml). Empty enables auto-discovery.                       |
| `dry_run`      | `true`         | Skip auto-fixes. CI defaults to `true` to keep the workspace read-only.                              |
| `allow_paths`  | *(empty)*      | Newline-separated list of paths to restrict linting to.                                              |
| `fail_on`      | `error`        | Severity threshold that fails the job: `none`, `warn`, or `error`.                                   |
| `comment`      | `false`        | Post the markdown report as a sticky comment on the triggering pull request.                         |
| `version`      | `latest`       | Image tag to pull (e.g. `latest`, `1`, `1.2`, `1.2.3`). Ignored when `image` is set.                 |
| `image`        | *(empty)*      | Full image reference override (e.g. for testing a locally-built image). Takes precedence.            |
| `github_token` | `github.token` | Token used to post PR comments. The default uses the workflow token.                                 |

## Outputs

| Name          | Description                                          |
| ------------- | ---------------------------------------------------- |
| `result`      | `pass` or `fail` after applying the `fail_on` rule.  |
| `passed`      | Count of passed rules.                               |
| `warnings`    | Count of warnings.                                   |
| `errors`      | Count of errors.                                     |
| `report_path` | Path on the runner to the generated markdown report. |

## Common recipes

### Auto-discover ruleset, fail only on errors

```yaml
- uses: damian-buho/repolinter@v1
```

### Lint a remote repository (no checkout)

```yaml
- uses: damian-buho/repolinter@v1
  with:
    git:         true
    directory:   https://github.com/owner/repo.git
    config_file: https://raw.githubusercontent.com/owner/repo/main/repolinter.json
```

### Sticky PR comment on every pull request

```yaml
- uses: damian-buho/repolinter@v1
  with:
    config_file: .github/repolinter.yaml
    comment:     ${{ github.event_name == 'pull_request' }}
```

`pull-requests: write` permission is required on the job for the comment to post.
On PRs from forks the workflow token is read-only and the comment step no-ops —
the report still renders to the Actions run summary.

### Warn-only (advisory mode)

```yaml
- uses: damian-buho/repolinter@v1
  with:
    fail_on: none  # or `warn` to fail only on warnings + errors
```

### Pin a specific image, e.g. for an air-gapped runner

```yaml
- uses: damian-buho/repolinter@v1
  with:
    image: my-registry.internal/repolinter:1.2.3
```

## Permissions

| Permission          | Required when                          |
| ------------------- | -------------------------------------- |
| `contents: read`    | Always (for `actions/checkout`).       |
| `pull-requests: write` | `comment: true` on a `pull_request`. |

## Reporting

The action always writes:

- A markdown report to `$RUNNER_TEMP/repolinter-report.md` (exposed as `report_path`).
- A rendered copy in the Actions run summary page.
- A JSON report (used internally for the `fail_on` gate; not exposed as output).

## Source and support

- Source: [github.com/damian-buho/repolinter](https://github.com/damian-buho/repolinter)
- Image:  [ghcr.io/damian-buho/repolinter](https://github.com/damian-buho/repolinter/pkgs/container/repolinter)
- Issues: [github.com/damian-buho/repolinter/issues](https://github.com/damian-buho/repolinter/issues)

This is a community fork of the archived [todogroup/repolinter](https://github.com/todogroup/repolinter),
maintained by [Damián Búho](https://github.com/damian-buho).
