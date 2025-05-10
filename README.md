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
    gitmagic
    ```
5.  You can specify different options with command line arguments:
    ```bash
    # Generate PR content in Portuguese
    gitmagic --language portuguese
    
    # Use a different model
    gitmagic --model gpt-4o
    
    # Change base branch
    gitmagic --base develop
    
    # Skip confirmations
    gitmagic --yes
    
    # Combine multiple options
    gitmagic --language spanish --model gpt-4o --base develop --yes
    ```

 The tool will guide you through the process:
    *   Checking prerequisites.
    *   Analyzing commits against the base branch (`main` by default).
    *   Pushing the branch if needed (with confirmation).
    *   Generating PR content with AI in your specified language (English by default).
    *   Allowing you to review, edit, or confirm the content.
    *   Creating the PR on GitHub.
    *   Asking if you want to open the PR in the browser.

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
