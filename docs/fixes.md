<!--
SPDX-FileCopyrightText: 2017 TODO Group
SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>

SPDX-License-Identifier: Apache-2.0
-->

# Fixes

Below is a complete list of fixes that Repolinter can run, along with their configuration options.

## Contents

- [Contents](#contents)
- [Reference](#reference)
  - [`file-create`](#file-create)
  - [`file-modify`](#file-modify)
  - [`file-remove`](#file-remove)
  - [`github-issue-create`](#github-issue-create)

## Reference

### file-create

Creates a file. Optionally removes or replaces files that failed.

| Input     | Required | Type                                                | Default | Description                                                                                                            |
| --------- | -------- | --------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| `file`    | **Yes**  | `string`                                            |         | The file to create. Path can be relative to the repository or absolute.                                                |
| `text`    | **Yes**  | `string` \| `{ url: string }` \| `{ file: string }` |         | The text to create the file with. Specify an object with the `url` or `file` property to pull text from a URL or file. |
| `replace` | No       | `boolean`                                           | `false` | Set to `true` to remove all failing files, as indicated by the rule.                                                   |

### file-modify

Modify a file that failed a rule.

| Input                 | Required | Type                                                             | Default                             | Description                                                                                                                                                                 |
| --------------------- | -------- | ---------------------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `text`                | **Yes**  | `string` \| `{ url: string }` \| `{ file: string }`              |                                     | The text to create the file with. Specify an object with the `url` or `file` property to pull text from a URL or file.                                                      |
| `files`               | No       | `string[]`                                                       | Failing files specified by the rule | A list of globs to modify files with. If this value is omitted, file-modify will instead target files that failed the rule.                                                 |
| `skip-paths-matching` | No       | `{ extensions?: string[], patterns?: string[], flags?: string }` | `{}`                                | Use this option to exclude paths from `files`, either by file extension or by regular expression.                                                                           |
| `write_mode`          | No       | `"prepend"` \| `"append"`                                        | `"append"`                          | How file-modify should edit the file.                                                                                                                                       |
| `newlines`            | No       | `{ begin?: number, end?: number }`                               | `{ begin: 0, end: 0 }`              | How many newlines should be added to the start or end of `text`. This property allows formatters to print `text` without these newlines, creating a better user experience. |

### file-remove

Removes a file or files.

| Input      | Required | Type       | Default                             | Description                                                                                                                  |
| ---------- | -------- | ---------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `globsAll` | No       | `string[]` | Failing files specified by the rule | The list of globs to remove files for. If this value is omitted, file-remove will instead target files that failed the rule. |
| `nocase`   | No       | `boolean`  | `false`                             | Set to `true` to perform an case insensitive search with `globsAll`.                                                         |

### github-issue-create

Opens a Github issue tracking the failed rule. Issues carry a `Unique rule set ID: <uniqueRuleId>`
marker in the body, so reruns find the existing issue instead of opening duplicates: an open match is
left alone, a closed match is re-opened with a comment, and issues carrying the bypass label are skipped.
Requires the `TARGET_REPO` (`owner/repo`) and `GITHUB_TOKEN` environment variables. A dry run reports
the intended issue without calling the API.

| Input          | Required | Type       | Default      | Description                                                                           |
| -------------- | -------- | ---------- | ------------ | ------------------------------------------------------------------------------------- |
| `issueLabels`  | **Yes**  | `string[]` |              | Labels identifying repolinter issues; each is created on the repository when missing. |
| `bypassLabel`  | No       | `string`   | `CC: Bypass` | Issues carrying this label are left alone.                                            |
| `issueTitle`   | **Yes**  | `string`   |              | Title of the created issue.                                                           |
| `issueBody`    | **Yes**  | `string`   |              | Body of the created issue.                                                            |
| `commentBody`  | No       | `string`   |              | Comment posted when re-opening a regressed issue; no comment is posted when omitted.  |
| `uniqueRuleId` | No       | `string`   | `issueTitle` | Marker written into the issue body to match issues back to the rule.                  |
| `issueStatus`  | No       | `string`   |              | Accepted for compatibility with older rulesets; ignored.                              |
