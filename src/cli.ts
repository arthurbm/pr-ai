#!/usr/bin/env bun

import { generatePrContent } from "./ai";
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
	try {
		await checkPrerequisites();
		const { currentBranch, diff, commits } = await getGitInfo(); // TODO: Add option for base branch
		await ensureBranchIsPushed(currentBranch);
		const { title: initialTitle, body: initialBody } = await generatePrContent(
			diff,
			commits,
		);

		const finalPrContent = await reviewAndConfirmPr(initialTitle, initialBody);

		if (!finalPrContent) {
			process.exit(0); // User cancelled
		}

		const { title, body } = finalPrContent;
		const prUrl = await createGitHubPr(title, body);
		await askAndOpenPr(prUrl);

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
