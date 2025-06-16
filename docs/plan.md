# PR AI CLI - Improvement Tracking

List of suggestions to improve the `gitlift` CLI, based on previous recommendations.

## 1. Argument Parsing and Configuration

- [x] **Argument Library:** Use `commander` or `yargs` to process arguments:
  - [x] `--base <branch>`: Specify base branch.
  - [x] `--model <model-name>`: Choose OpenAI model.
  - [x] `-y` or `--yes`: Skip confirmations.
  - [x] `--dry-run`: See title/body without creating PR.
- [x] **Configuration File:** Allow a file (`.gitlift.json`?) to define defaults.

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
  - [ ] Basic test setup and example for `prerequisites.ts`.
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
- [ ] **Test Installation:** Install globally (`npm install -g gitlift`) and test.

## 7. Command Structure Refactoring

- [x] **Initial Subcommand Architecture:**
  - [x] Refactor current PR generation into `gitlift generate pr`
  - [x] Create command factory infrastructure
  - [x] Update documentation to reflect new command structure

- [ ] **Future Command Extensions:**
  - [ ] `gitlift generate commit` - AI-powered commit message generation
    - [x] Check for staged changes (`git diff --staged`)
    - [x] Handle case: No staged changes (inform user and exit)
    - [x] Handle case: Unstaged changes exist (prompt user to stage them, abort, or continue with only staged)
    - [x] Call AI service to generate commit message based on staged changes (now includes title and bullet-point body)
    - [x] Allow user to review and edit the generated commit message (title and body separately)
    - [x] Perform the commit (`git commit -m "message"`)
    - [x] Add relevant command-line options (e.g., `--all` or `-a` to stage all tracked, modified files before commit)
  - [ ] `gitlift review <pr_url>` - AI-assisted PR review
  - [ ] Additional commands as needed

## 8. Configuration and Setup

- [x] **Init Command:** Implement `npx gitlift init` to:
  - [x] Create default configuration file
  - [x] Guide user through setting up API keys and preferences
  - [x] Set up additional customizations
- [ ] **Custom Rules:** Support user-defined rules in configuration file
  - [ ] PR templates/rules
  - [ ] Commit message templates/rules
  - [ ] Review criteria/rules

## 9. Src Directory Refactoring

- [x] **Create new directory structure:**
  - [x] `src/core/`
  - [x] `src/config/`
  - [x] `src/ui/`
  - [x] `src/utils/`
- [x] **Move files to `src/core/`:**
  - [x] `src/ai.ts` -> `src/core/ai.ts`
  - [x] `src/git.ts` -> `src/core/git.ts`
  - [x] `src/github.ts` -> `src/core/github.ts`
  - [x] `src/prerequisites.ts` -> `src/core/prerequisites.ts`
- [x] **Move files to `src/config/`:**
  - [x] `src/config.ts` -> `src/config/index.ts`
- [x] **Move files to `src/ui/`:**
  - [x] `src/ui.ts` -> `src/ui/index.ts`
  - [x] `src/theme.ts` -> `src/ui/theme.ts`
- [x] **Move files to `src/utils/`:**
  - [x] `src/errors.ts` -> `src/utils/errors.ts`
- [x] **Update import paths in all affected files.**
- [x] **Verify all commands and functionalities after refactoring.**
- [x] **Run tests (if applicable) to ensure no regressions.**

## 10. Further Architectural Improvements

- [ ] **Expand Test Coverage (related to Section 4):**
  - [ ] Identify critical modules in `src/core/` for unit tests (e.g., `ai.ts`, `git.ts`, `github.ts`).
  - [ ] Write unit tests for `core/ai.ts`.
  - [ ] Write unit tests for `core/git.ts`.
  - [ ] Write unit tests for `core/github.ts`.
  - [ ] Create integration tests for the `generate pr` command, covering various scenarios and options.
  - [ ] Implement/enhance mocking for external dependencies (OpenAI API, GitHub API, `git` CLI, `gh` CLI) to ensure isolated unit tests.
- [ ] **Define Interfaces for Core Services:**
  - [ ] Create interface definitions (e.g., `src/core/ai.interface.ts`, `src/core/git.interface.ts`, `src/core/github.interface.ts`).
  - [ ] Refactor existing core service modules (`ai.ts`, `git.ts`, `github.ts`) to implement these interfaces.
  - [ ] Update command handlers and other dependent modules to use these interfaces (Dependency Inversion Principle) rather than concrete implementations.
  - [ ] Evaluate the need for a Dependency Injection (DI) container or a simpler factory pattern for providing service implementations. 