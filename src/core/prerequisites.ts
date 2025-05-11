import { $ } from "bun";
import ora from "ora";
import { theme } from "../ui/theme";

/**
 * Checks if required tools (git, gh) are installed and authenticated.
 * Checks for the OPENAI_API_KEY environment variable.
 * Throws an error if any prerequisite is missing.
 */
export async function checkPrerequisites() {
	const spinner = ora("Checking prerequisites...").start();
	try {
		// Check Git
		spinner.text = "Checking Git installation...";
		if (!Bun.which("git")) {
			throw new Error(
				"Git is not installed. Please install git and try again.",
			);
		}
		spinner.succeed(theme.success("Git found."));

		// Check GitHub CLI
		spinner.start("Checking GitHub CLI installation...");
		if (!Bun.which("gh")) {
			throw new Error(
				"GitHub CLI (gh) is not installed. Please install it (e.g., 'brew install gh') and authenticate with 'gh auth login'.",
			);
		}
		spinner.succeed(theme.success("GitHub CLI found."));

		// Check GitHub CLI Auth Status
		spinner.start("Checking GitHub CLI authentication...");
		try {
			await $`gh auth status`.quiet();
			spinner.succeed(theme.success("GitHub CLI authenticated."));
		} catch (authError) {
			throw new Error(
				"GitHub CLI is not authenticated. Please run 'gh auth login'.",
			);
		}

		// Check OpenAI API Key
		spinner.start("Checking OpenAI API Key...");
		if (!process.env.OPENAI_API_KEY) {
			throw new Error(
				"OPENAI_API_KEY environment variable is not set. Please set it (e.g., 'export OPENAI_API_KEY=your_key') and try again.",
			);
		}
		spinner.succeed(theme.success("OPENAI_API_KEY found."));
	} catch (error: unknown) {
		spinner.fail(theme.error("Prerequisite check failed."));
		// Re-throw the original error preserving the message
		if (error instanceof Error) throw error;
		throw new Error("An unknown error occurred during prerequisite checks.");
	}
}
