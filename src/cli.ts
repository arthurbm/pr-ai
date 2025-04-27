#!/usr/bin/env bun

import { program } from "commander"; // Import commander
import { version } from "../package.json"; // Import version for CLI
import { generatePrContent } from "./ai";
import { loadConfig } from "./config"; // Import config loader
import { ensureBranchIsPushed, getGitInfo } from "./git";
import { askAndOpenPr, createGitHubPr } from "./github";
import { checkPrerequisites } from "./prerequisites";
import { theme } from "./theme";
import { reviewAndConfirmPr } from "./ui";

/**
 * Main function for the PR AI CLI.
 * Orchestrates the process of checking prerequisites, getting git info,
 * generating AI content, reviewing, creating the PR, and opening it.
 */
async function main() {
	console.log(theme.primary("🚀 Starting PR AI CLI..."));

	// Load configuration from file first
	const config = await loadConfig();

	// --- Argument Parsing (using loaded config as defaults) ---
	program
		.version(version)
		.description("Automate GitHub Pull Request creation using AI.")
		.option(
			"-b, --base <branch>",
			"Specify the base branch for comparison",
			config.baseBranch,
		) // Use config value as default
		.option(
			"-m, --model <model-name>",
			"Specify the OpenAI model to use",
			config.model,
		) // Use config value as default
		.option(
			"-y, --yes",
			"Skip all confirmation prompts",
			config.skipConfirmations,
		) // Use config value as default
		.option("--dry-run", "Generate title/body but do not create PR", false)
		.parse(process.argv);

	// Get the final options (CLI args override config/defaults)
	const options = {
		...config,
		...program.opts<{
			base?: string;
			model?: string;
			yes?: boolean;
			dryRun?: boolean;
		}>(),
	};
	// Ensure boolean flags from commander don't override config `false` with `undefined` if not passed
	options.yes = program.opts().yes ?? config.skipConfirmations ?? false;
	options.dryRun = program.opts().dryRun ?? false;

	if (options.dryRun) {
		console.log(
			theme.warning("Running in dry-run mode. No PR will be created."),
		);
	}

	try {
		await checkPrerequisites();
		const { currentBranch, diff, commits } = await getGitInfo(
			options.base,
			options.yes,
		);
		await ensureBranchIsPushed(currentBranch, options.yes);
		const { title: initialTitle, body: initialBody } = await generatePrContent(
			diff,
			commits,
			options.model,
		);

		let finalPrContent: { title: string; body: string } | null = {
			title: initialTitle,
			body: initialBody,
		};

		if (!options.yes) {
			// Skip review if --yes is passed
			finalPrContent = await reviewAndConfirmPr(initialTitle, initialBody);
		}

		if (!finalPrContent) {
			process.exit(0); // User cancelled during review
		}

		const { title, body } = finalPrContent;

		if (options.dryRun) {
			console.log(`\n${theme.primary("Dry Run Results:")}`);
			console.log(`${theme.info("Title:")} ${title}`);
			console.log(`${theme.info("Body:\n")}${theme.dim(body)}`);
			console.log(
				theme.warning("\nExiting due to --dry-run flag. No PR created."),
			);
			process.exit(0);
		}

		const prUrl = await createGitHubPr(title, body);
		await askAndOpenPr(prUrl, options.yes);

		console.log(theme.success("\n✨ PR AI process finished successfully!"));
	} catch (error: unknown) {
		// Specific errors should be handled and logged within modules
		// This logs the final error message before exiting
		if (error instanceof Error) {
			console.error(theme.error(`\n❌ Error: ${error.message}`));
		} else {
			console.error(theme.error("\n❌ An unexpected error occurred:"), error);
		}
		process.exit(1);
	}
}

main();
