# GitLift CLI 🧙✨

A command-line tool to enhance your Git workflow with AI-powered features, including automated Pull Request and commit message generation.

This tool analyzes your local Git changes, uses AI (via OpenAI) to generate relevant content, and integrates with Git and GitHub commands.

## Features

*   **Pull Request Generation (`generate pr`):**
    *   Analyzes committed changes between your current branch and a base branch (default: `main`).
    *   Generates PR title and body using AI.
    *   Prompts to push the current branch if it doesn't exist on the remote.
    *   Optionally opens the created PR in your browser.
*   **Commit Message Generation (`generate commit`):**
    *   Analyzes staged changes to generate a conventional commit message (title and body with bullet points).
    *   Handles unstaged changes with user prompts or automatic staging via an option.
*   **General:**
    *   Allows reviewing and editing all AI-generated content before finalizing.
    *   Supports multiple languages for content generation.
*   Checks for prerequisites (`git`, `gh` installed and authenticated, `OPENAI_API_KEY` set).
*   Uses spinners and colored output for a better user experience.

## Prerequisites

1.  **Git:** Must be installed. [git-scm.com](https://git-scm.com/)
2.  **GitHub CLI (`gh`):** Must be installed and authenticated. Run `gh auth login` after installation. [cli.github.com](https://cli.github.com/)
3.  **OpenAI API Key:** You need an API key from OpenAI. [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
4.  **Editor Configuration:** The CLI uses your default text editor for editing the PR body. Make sure the `EDITOR` environment variable is set (e.g., `export EDITOR=nano` or `export EDITOR=\"code --wait\"`).

## Installation

### Via npm (Recommended)

```bash
npm install -g gitlift
```

### Via yarn

```bash
yarn global add gitlift
```

### Via pnpm

```bash
pnpm add -g gitlift
```

### Via bun

```bash
bun add -g gitlift
```

### From Source

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/arthurbm/gitlift.git
    cd gitlift
    ```
2.  **Install dependencies and build:**
    ```bash
    # Using npm
    npm install
    npm run build
    
    # Using yarn
    yarn
    yarn build
    
    # Using pnpm
    pnpm install
    pnpm build
    
    # Using bun
    bun install
    bun run build
    ```
3.  **Link the CLI for local use:**
    ```bash
    # Using npm
    npm link
    
    # Using yarn
    yarn link
    
    # Using pnpm
    pnpm link -g
    
    # Using bun
    bun link
    ```
    This makes the `gitlift` command available in your terminal.

## Configuration

*   **OpenAI API Key:** Set the `OPENAI_API_KEY` environment variable:
    ```bash
    export OPENAI_API_KEY=\"your_openai_api_key_here\"
    ```
    (Add this to your `~/.zshrc`, `~/.bashrc`, or equivalent for persistence).
*   **Editor:** Ensure the `EDITOR` environment variable is set as mentioned in Prerequisites.

## Configuration File

You can configure default options by creating a configuration file in your project directory or any parent directory. The tool uses `cosmiconfig` and will automatically look for:

*   `.gitliftrc` (YAML or JSON)
*   `.gitliftrc.json`
*   `.gitliftrc.yaml`
*   `.gitliftrc.yml`
*   `.gitliftrc.js` (ESM or CJS)
*   `.gitliftrc.cjs`
*   `gitlift.config.js` (ESM or CJS)
*   `gitlift.config.cjs`
*   A `"gitlift"` key in your `package.json`.

**Example `.gitliftrc.json**:**

```json
{
  "baseBranch": "develop",
  "model": "gpt-4.1-mini",
  "skipConfirmations": false,
  "language": "portuguese"
}
```

**Example `.gitliftrc.js**:**

```javascript
module.exports = {
  baseBranch: 'develop',
  model: 'gpt-4.1-mini',
  language: 'spanish',
};
```

Command-line arguments (e.g., `--base main`) will always override settings from the configuration file.

## Usage

1.  Navigate to a Git repository directory.
2.  Make sure you are on the feature branch you want to create a PR from.
3.  Ensure your desired changes are **committed** to the branch.
4.  Run the command:
    ```bash
    gitlift generate pr
    ```
5.  You can specify different options with command line arguments:
    ```bash
    # Generate PR content in Portuguese
    gitlift generate pr --language portuguese
    
    # Use a different model
    gitlift generate pr --model gpt-4o
    
    # Change base branch
    gitlift generate pr --base develop
    
    # Skip confirmations
    gitlift generate pr --yes
    
    # Combine multiple options
    gitlift generate pr --language spanish --model gpt-4o --base develop --yes
    ```

 The tool will guide you through the process:
    *   **For `generate pr`:**
        *   Checking prerequisites.
        *   Analyzing commits against the base branch (`main` by default).
        *   Pushing the branch if needed (with confirmation).
        *   Generating PR content with AI in your specified language (English by default).
        *   Allowing you to review, edit, or confirm the content.
        *   Creating the PR on GitHub.
        *   Asking if you want to open the PR in the browser.

### Generating a Commit Message

1.  Navigate to a Git repository directory.
2.  Stage the changes you want to include in the commit (`git add <file>...` or `git add .`).
3.  Run the command:
    ```bash
    gitlift generate commit
    ```
4.  You can specify different options with command line arguments:
    ```bash
    # Automatically stage all modified/deleted files before generating commit message
    gitlift generate commit -a

    # Use a different model for commit message generation
    gitlift generate commit --model gpt-4o

    # Generate commit message in a specific language (e.g., for commit conventions in other languages)
    gitlift generate commit --language portuguese

    # Skip confirmation prompts
    gitlift generate commit --yes
    ```

The tool will guide you through the process:
    *   **For `generate commit`:**
        *   Checking for staged changes.
        *   If no staged changes, it may prompt to stage unstaged changes (unless `--yes` or `-a` is used).
        *   Generating a commit message with AI, including a concise **title** and a detailed **body in bullet points**, based on your staged changes.
        *   Allowing you to review and edit the title and body separately.
        *   Committing the changes with the generated (or edited) message, formatted with the title on the first line, followed by a blank line and then the body.

## Development

*   **Linting/Formatting:** Uses BiomeJS.
    ```bash
    npx @biomejs/biome check --apply .
    npx @biomejs/biome format --write .
    
    # Using bun
    bunx @biomejs/biome check --apply .
    bunx @biomejs/biome format --write .
    ```
*   **Building:**
    ```bash
    npm run build
    
    # Using bun
    bun run build
    ```
*   **Testing:** (Basic setup exists)
    ```bash
    npm test
    
    # Using bun
    bun test
    ```

## Unlinking

To remove the globally linked command:

```bash
# Using npm
npm unlink -g gitlift

# Using yarn
yarn global remove gitlift

# Using pnpm
pnpm unlink -g gitlift

# Using bun
bun unlink
```
