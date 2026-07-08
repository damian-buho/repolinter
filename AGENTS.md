<!--
SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>

SPDX-License-Identifier: Apache-2.0
-->

# Agents — repolinter

## Project overview

Fork of the TODO Group's repolinter. Lints open source repositories against
configurable rulesets and optionally auto-fixes violations.

- Language: TypeScript → compiled ESM (`"type": "module"`, Node 16 module resolution)
- Runtime: Node.js ≥ 22.13.0
- Entry points: `dist/index.js` (library API), `dist/cli.js` (executable)

## Commands

```
just build         # tsc + copy JSON configs/rulesets to dist/
just lint          # ESLint (typescript-eslint, unicorn, import-x, promise, n, tsdoc)
just format        # Prettier write
just format-check  # Prettier check (CI)
just test          # node --test 'tests/**/*.js'
just pipeline      # format → lint → build → test  (full CI gate)
```

`just build` runs `prebuild` (rm -rf dist) first — always a clean compile.

## TypeScript strictness

tsconfig enables: `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`,
`noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch`,
`isolatedModules`.

- MUST use `import type` for type-only imports
- MUST NOT use `any` (ESLint warns; avoid unless unavoidable)
- MUST prefer inline type narrowing (`typeof x === 'string'`) over `as T` casts
- Use `as T` only when TypeScript cannot follow the control flow but correctness
  is provable by the surrounding logic

## Architecture

```
src/
├── index.ts          # Public API: lint(), runRuleset(), filterRuleTargets(), determineTargets()
├── cli.ts            # yargs CLI; calls lint(), selects formatter, exits with code
├── lib/
│   ├── config.ts     # Config loading/parsing/validation (RulesetConfig exported)
│   ├── file-system.ts# Glob wrapper; all rules operate via FileSystem, not raw fs
│   ├── result.ts     # Result + ResultTarget — returned by rules, fixes, axioms
│   ├── ruleinfo.ts   # RuleInfo — parsed rule metadata from config
│   └── formatresult.ts # FormatResult — wraps RuleInfo+Result with status for formatters
├── rules/            # One file per rule
├── fixes/            # One file per fix
├── axioms/           # One file per axiom
└── formatters/       # symbol-formatter, json-formatter, markdown-formatter
rules/                # JSON Schema per rule options  (copied to dist/rules/)
fixes/                # JSON Schema per fix options   (copied to dist/fixes/)
rulesets/             # Bundled ruleset configs + schema.json (copied to dist/rulesets/)
tests/                # Mirrors src/ layout; plain .js files using node:test + node:assert
```

## Data flow

```
Config (file / URL / base64)
  → config.loadConfig / decodeConfig  → RulesetConfig
  → config.validateConfig             → pass/fail with AJV
  → config.parseConfig                → RuleInfo[]
  → determineTargets (axioms)         → Record<axiomId, Result>  (used in `where` clauses)
  → runRuleset                        → FormatResult[]
  → Formatter.formatOutput            → string (stdout)
```

## Adding a rule

1. `src/rules/{name}.ts` — export a default function:
   ```ts
   interface MyOptions { /* ... */ }
   async function myRule(fs: FileSystem, options: MyOptions): Promise<Result> { ... }
   export default myRule
   ```
2. `rules/{name}-config.json` — JSON Schema for the options object
3. Register in `src/rules/rules.ts` under the kebab-case key

## Adding a fix

Same pattern as a rule, but signature is:
```ts
async function myFix(
  fs: FileSystem,
  options: MyOptions,
  targets: string[],
  dryRun: boolean
): Promise<Result>
```
Register in `src/fixes/fixes.ts`.

## Adding an axiom

Signature: `(fileSystem: FileSystem) => Promise<Result>`. Register in
`src/axioms/axioms.ts`. Axiom IDs appear as keys in `repolinter.json`'s
`axioms` block and in `where` clauses as `{axiomName}={value}`.

## Result conventions

- `passed: true` with `targets` containing `{ passed: true, path, message }` → rule satisfied
- `passed: false` with `targets` containing `{ passed: false, pattern/path }` → rule violated
- `message` on the `Result` itself is a human-readable summary; `message` on each
  `ResultTarget` describes that specific file/pattern

## Config format (v2)

```json
{
  "version": 2,
  "axioms": { "linguist": "language", "licensee": "license" },
  "rules": {
    "my-rule": {
      "level": "error",
      "where": ["language=javascript"],
      "rule": { "type": "file-existence", "options": { "globsAny": ["index.js"] } },
      "fix":  { "type": "file-create",   "options": { "file": "index.js", "text": "" } }
    }
  },
  "formatOptions": {}
}
```

- `level`: `"error"` | `"warning"` | `"off"`
- `where`: axiom conditions; rule is skipped if any condition is not met
- `fix` is optional; runs only when the rule fails

## Testing

Tests use the native Node.js test runner (`node:test` + `node:assert`). No mocha
or jest. Each test file in `tests/` targets the corresponding compiled output
in `dist/` (run `just build` before `just test`, or use `just pipeline`).

`pretest` in package.json runs ESLint — `just test` alone will lint first.

## ESLint plugins active

- `typescript-eslint` — strict TS checks
- `eslint-plugin-unicorn` — enforces many modern JS patterns (flat/recommended)
- `eslint-plugin-import-x` — import order/resolution
- `eslint-plugin-n` — Node.js best practices
- `eslint-plugin-promise` — promise anti-patterns
- `eslint-plugin-tsdoc` — TSDoc comment syntax (warn only)
- `eslint-config-prettier` — disables formatting rules that conflict with Prettier
