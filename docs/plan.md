# PR AI CLI - Improvement Tracking

List of suggestions to improve the `gitmagic` CLI, based on previous recommendations.

## 1. Argument Parsing and Configuration

- [x] **Argument Library:** Use `commander` or `yargs` to process arguments:
  - [x] `--base <branch>`: Specify base branch.
  - [x] `--model <model-name>`: Choose OpenAI model.
  - [x] `-y` or `--yes`: Skip confirmations.
  - [x] `--dry-run`: See title/body without creating PR.
- [x] **Configuration File:** Allow a file (`.gitmagic.json`?) to define defaults.

## 2. User Experience (UX) Improvements

- [x] **Content Review/Edit:** Show generated title/body and allow confirmation, editing (title/body), or cancellation before creating the PR.
- [x] **Activity Indicators:** Use spinners (`ora`) during long operations.
- [x] **Formatting and Colors:** Use colors (`chalk`) for success, warning, and error logs.

## 3. Robustness and Error Handling

- [x] **Base Branch Validation:** Verify if the base branch exists locally/remotely before calculating the diff.
- [x] **API Errors:** Improve handling of OpenAI API errors (rate limit, invalid key, etc.) - *Improved based on `AI_APICallError` structure.*
- [x] **`gh` and `git` Errors:** Better differentiate errors from `git` and `gh` - *Improved, added command context/prefixes.*

## 4. Code Quality and Maintenance

- [x] **Modularization:** Split `cli.ts` into modules (`theme.ts`, `prerequisites.ts`, `git.ts`, `ai.ts`, `ui.ts`, `github.ts`).
- [ ] **Tests:** Expand unit/integration tests with `bun test` and mocking.
  - [x] Basic test setup and example for `prerequisites.ts`.
- [x] **Documentation (JSDoc):** Add JSDoc to exported functions.
- [x] **README:** Create detailed `README.md`.

## 5. AI Prompt

- [ ] **Iteration:** Experiment and refine the system prompt for the AI.
- [ ] **Diff Limitation:** Handle very large diffs (truncate or warn about token limit).

## 6. npm Publishing

- [ ] **Prepare `package.json`:**
  - [ ] Review/add fields: `author`, `license`, `keywords`, `repository`, `homepage`, `bugs`.
  - [ ] Add `files` field to include `dist/`, `README.md`, etc.
- [ ] **Configure Build (TypeScript -> JavaScript):**
  - [ ] Ensure `tsc` (TypeScript compiler) is configured (via `tsconfig.json`, if needed).
  - [ ] Update `build` script in `package.json` to use `tsc` (outputting to `dist/`).
  - [ ] Adjust `main` and `bin` fields in `package.json` to point to files in `dist/`.
- [ ] **Authenticate with npm:** Run `npm login` (or `bunx npm login`).
- [ ] **Versioning:** Use `npm version patch|minor|major` to update version before publishing.
- [ ] **Publish:** Run `npm publish` (or `bunx npm publish`).
- [ ] **Test Installation:** Install globally (`npm install -g gitmagic`) and test.

## 7. Command Structure Refactoring

- [x] **Initial Subcommand Architecture:**
  - [x] Refactor current PR generation into `gitmagic generate pr`
  - [x] Create command factory infrastructure
  - [x] Update documentation to reflect new command structure

- [ ] **Future Command Extensions:**
  - [ ] `gitmagic generate commit` - AI-powered commit message generation
  - [ ] `gitmagic review <pr_url>` - AI-assisted PR review
  - [ ] Additional commands as needed

## 8. Configuration and Setup

- [ ] **Init Command:** Implement `npx gitmagic init` to:
  - [ ] Create default configuration file
  - [ ] Guide user through setting up API keys and preferences
  - [ ] Set up additional customizations
- [ ] **Custom Rules:** Support user-defined rules in configuration file
  - [ ] PR templates/rules
  - [ ] Commit message templates/rules
  - [ ] Review criteria/rules 