# Repository Guidelines

## Project Structure & Module Organization
MeeseOS is a Rush-managed pnpm monorepo. Application packages live under `apps/`, with front-end themes and widgets in `frontend/`, service code in `backend/`, shared utilities in `common/`, and developer tooling scripts in `development/`. The `website/` package hosts the public marketing site and drives deployment artifacts. Each leaf folder contains its own `package.json`; run package-level scripts from that directory.

## Build, Test, and Development Commands
- `bash ./scripts/setup.sh` bootstraps pnpm, installs Rush, and syncs shared config.
- `rush build` performs an incremental build across every package; run after dependency changes.
- `rush test` fans out to project-level `npm run test`, chaining ESLint and Jest where defined.
- `rush eslint --fix` auto-formats JavaScript/TypeScript sources using the shared config.
- `pnpm run deploy` inside `website/` assembles the production bundle once the repo is built.

## Coding Style & Naming Conventions
The root `.editorconfig` enforces tab indentation (size 2) for code, with 2-space indentation for JSON, YAML, Markdown, and shell scripts. Respect existing directory casing (`kebab-case` for packages, `PascalCase` reserved for React components). Shared lint rules live in `development/eslint`; all packages extend `@meese-os/eslint-config`. Package names follow the `@meese-os/<package>` scope, and modules export ES modules unless legacy CommonJS already exists.

## Testing Guidelines
Jest is the canonical test framework (`__tests__/` folders mirror source layout). Prefer describing suites with component or module names and include regression references in `it()` descriptions when applicable. Maintain coverage thresholds defined per package; `npm run coverage` is available where enforced (e.g., `backend/server`). Always run `rush test` before opening a PR so dependent packages execute their check suites.

## Commit & Pull Request Guidelines
Follow the conventional commit prefixes visible in `git log` (`feat:`, `fix:`, `chore:`) and append issue references like `(#189)` when closing tickets. Craft PRs with a crisp summary, linked issues, and screenshots or terminal output for UI-affecting changes. Ensure environment templates (e.g., `*.env.template`) remain untouched; document required secrets but never commit credentials.

## Security & Configuration Tips
Keep local `.env` files derived from templates under their original directories (`apps/old-site`, `apps/terminal/scripts`, `website/src`). Run `pm2 monit` only after verifying builds, and avoid exposing the development server without HTTPS or authentication. Use Node.js 20.x as pinned in `rush.json` and `.nvmrc`, and prefer `pnpm` 10.x when working outside Rush.
