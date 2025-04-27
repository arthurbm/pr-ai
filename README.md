# PR AI CLI 🤖

A command-line tool to automate GitHub Pull Request creation using AI.

This tool analyzes your local Git changes, uses AI (via OpenAI) to generate a relevant title and description, and creates a PR using the GitHub CLI (`gh`).

## Features

*   Analyzes committed changes between your current branch and a base branch (default: `main`).
*   Generates PR title and body using AI (powered by Vercel AI SDK and OpenAI).
*   Allows reviewing and editing the AI-generated content before creating the PR.
*   Checks for prerequisites (`git`, `gh` installed and authenticated, `OPENAI_API_KEY` set).
*   Prompts to push the current branch if it doesn't exist on the remote.
*   Optionally opens the created PR in your browser.
*   Uses spinners and colored output for a better user experience.

## Prerequisites

1.  **Bun:** Developed using Bun. Install from [bun.sh](https://bun.sh/).
2.  **Git:** Must be installed. [git-scm.com](https://git-scm.com/)
3.  **GitHub CLI (`gh`):** Must be installed and authenticated. Run `gh auth login` after installation. [cli.github.com](https://cli.github.com/)
4.  **OpenAI API Key:** You need an API key from OpenAI. [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
5.  **Editor Configuration:** The CLI uses your default text editor for editing the PR body. Make sure the `EDITOR` environment variable is set (e.g., `export EDITOR=nano` or `export EDITOR=\"code --wait\"`).

## Installation

### Via npm (Recommended)

```bash
npm install -g pr-ai
```

### From Source

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd pr-ai
    ```
2.  **Install dependencies:**
    ```bash
    bun install
    ```
3.  **Link the CLI for local use:**
    ```bash
    bun link
    ```
    This makes the `pr-ai` command available in your terminal.

## Configuration

*   **OpenAI API Key:** Set the `OPENAI_API_KEY` environment variable:
    ```bash
    export OPENAI_API_KEY=\"your_openai_api_key_here\"
    ```
    (Add this to your `~/.zshrc`, `~/.bashrc`, or equivalent for persistence).
*   **Editor:** Ensure the `EDITOR` environment variable is set as mentioned in Prerequisites.

## Configuration File

You can configure default options by creating a configuration file in your project directory or any parent directory. The tool uses `cosmiconfig` and will automatically look for:

*   `.prairc` (YAML or JSON)
*   `.prairc.json`
*   `.prairc.yaml`
*   `.prairc.yml`
*   `.prairc.js` (ESM or CJS)
*   `.prairc.cjs`
*   `pr-ai.config.js` (ESM or CJS)
*   `pr-ai.config.cjs`
*   A `"pr-ai"` key in your `package.json`.

**Example `.prairc.json**:**

```json
{
  "baseBranch": "develop",
  "model": "gpt-4.1-mini",
  "skipConfirmations": false
}
```

**Example `.prairc.js**:**

```javascript
module.exports = {
  baseBranch: 'develop',
  model: 'gpt-4.1-mini',
};
```

Command-line arguments (e.g., `--base main`) will always override settings from the configuration file.

## Usage

1.  Navigate to a Git repository directory.
2.  Make sure you are on the feature branch you want to create a PR from.
3.  Ensure your desired changes are **committed** to the branch.
4.  Run the command:
    ```bash
    pr-ai
    ```

 The tool will guide you through the process:
    *   Checking prerequisites.
    *   Analyzing commits against the base branch (`main` by default).
    *   Pushing the branch if needed (with confirmation).
    *   Generating PR content with AI.
    *   Allowing you to review, edit, or confirm the content.
    *   Creating the PR on GitHub.
    *   Asking if you want to open the PR in the browser.

## Development

*   **Linting/Formatting:** Uses BiomeJS.
    ```bash
    bunx @biomejs/biome check --apply .
    bunx @biomejs/biome format --write .
    ```
*   **Testing:** (Basic setup exists)
    ```bash
    bun test
    ```

## Unlinking

To remove the globally linked command:

```bash
bun unlink
```
