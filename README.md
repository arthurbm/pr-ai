# GitMagic CLI 🧙✨

A command-line tool to automate GitHub Pull Request creation using AI.

This tool analyzes your local Git changes, uses AI (via OpenAI) to generate a relevant title and description, and creates a PR using the GitHub CLI (`gh`).

## Features

*   Analyzes committed changes between your current branch and a base branch (default: `main`).
*   Generates PR title and body using AI (powered by Vercel AI SDK and OpenAI).
*   Allows reviewing and editing the AI-generated content before creating the PR.
*   Supports multiple languages for PR content generation.
*   Checks for prerequisites (`git`, `gh` installed and authenticated, `OPENAI_API_KEY` set).
*   Prompts to push the current branch if it doesn't exist on the remote.
*   Optionally opens the created PR in your browser.
*   Uses spinners and colored output for a better user experience.

## Prerequisites

1.  **Git:** Must be installed. [git-scm.com](https://git-scm.com/)
2.  **GitHub CLI (`gh`):** Must be installed and authenticated. Run `gh auth login` after installation. [cli.github.com](https://cli.github.com/)
3.  **OpenAI API Key:** You need an API key from OpenAI. [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
4.  **Editor Configuration:** The CLI uses your default text editor for editing the PR body. Make sure the `EDITOR` environment variable is set (e.g., `export EDITOR=nano` or `export EDITOR=\"code --wait\"`).

## Installation

### Via npm (Recommended)

```bash
npm install -g gitmagic
```

### Via yarn

```bash
yarn global add gitmagic
```

### Via pnpm

```bash
pnpm add -g gitmagic
```

### Via bun

```bash
bun add -g gitmagic
```

### From Source

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/arthurbm/gitmagic.git
    cd gitmagic
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
    This makes the `gitmagic` command available in your terminal.

## Configuration

*   **OpenAI API Key:** Set the `OPENAI_API_KEY` environment variable:
    ```bash
    export OPENAI_API_KEY=\"your_openai_api_key_here\"
    ```
    (Add this to your `~/.zshrc`, `~/.bashrc`, or equivalent for persistence).
*   **Editor:** Ensure the `EDITOR` environment variable is set as mentioned in Prerequisites.

## Configuration File

You can configure default options by creating a configuration file in your project directory or any parent directory. The tool uses `cosmiconfig` and will automatically look for:

*   `.gitmagicrc` (YAML or JSON)
*   `.gitmagicrc.json`
*   `.gitmagicrc.yaml`
*   `.gitmagicrc.yml`
*   `.gitmagicrc.js` (ESM or CJS)
*   `.gitmagicrc.cjs`
*   `gitmagic.config.js` (ESM or CJS)
*   `gitmagic.config.cjs`
*   A `"gitmagic"` key in your `package.json`.

**Example `.gitmagicrc.json**:**

```json
{
  "baseBranch": "develop",
  "model": "gpt-4.1-mini",
  "skipConfirmations": false,
  "language": "portuguese"
}
```

**Example `.gitmagicrc.js**:**

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
    gitmagic generate pr
    ```
5.  You can specify different options with command line arguments:
    ```bash
    # Generate PR content in Portuguese
    gitmagic generate pr --language portuguese
    
    # Use a different model
    gitmagic generate pr --model gpt-4o
    
    # Change base branch
    gitmagic generate pr --base develop
    
    # Skip confirmations
    gitmagic generate pr --yes
    
    # Combine multiple options
    gitmagic generate pr --language spanish --model gpt-4o --base develop --yes
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
    gitmagic generate commit
    ```
4.  You can specify different options with command line arguments:
    ```bash
    # Automatically stage all modified/deleted files before generating commit message
    gitmagic generate commit -a

    # Use a different model for commit message generation
    gitmagic generate commit --model gpt-4o

    # Generate commit message in a specific language (e.g., for commit conventions in other languages)
    gitmagic generate commit --language portuguese

    # Skip confirmation prompts
    gitmagic generate commit --yes
    ```

The tool will guide you through the process:
    *   **For `generate commit`:**
        *   Checking for staged changes.
        *   If no staged changes, it may prompt to stage unstaged changes (unless `--yes` or `-a` is used).
        *   Generating a commit message with AI based on your staged changes.
        *   Allowing you to review, edit, or confirm the message.
        *   Committing the changes with the generated (or edited) message.

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
npm unlink -g gitmagic

# Using yarn
yarn global remove gitmagic

# Using pnpm
pnpm unlink -g gitmagic

# Using bun
bun unlink
```
