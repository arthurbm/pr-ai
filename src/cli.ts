#!/usr/bin/env bun

import { program } from "commander"; // Import commander
import { version } from "../package.json"; // Import version for CLI
import { registerGenerateCommands } from "./commands/generate";
import { loadConfig } from "./config/config"; // Import config loader
import { theme } from "./ui/theme";

/**
 * Main function for the PR AI CLI.
 * Orchestrates the process of checking prerequisites, getting git info,
 * generating AI content, reviewing, creating the PR, and opening it.
 */
async function mainCli() {
	console.log(theme.primary("🚀 Starting PR AI CLI..."));

	try {
		const config = await loadConfig();

		program.version(version).description("GitLift: AI-powered Git utilities.");

		registerGenerateCommands(program, config);

		await program.parseAsync(process.argv);
	} catch (error: unknown) {
		// Specific errors should be handled and logged within modules
		// This logs the final error message before exiting
		if (error instanceof Error) {
			console.error(theme.error(`\n❌ CLI Error: ${error.message}`));
		} else {
			console.error(
				theme.error("\n❌ An unexpected CLI error occurred:"),
				error,
			);
		}
		process.exit(1);
	}
}

mainCli();
