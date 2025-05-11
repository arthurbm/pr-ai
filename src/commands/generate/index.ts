import type { Command } from "commander";
import type { AppConfig } from "../../config";
import { registerPrCommand } from "./pr";

export function registerGenerateCommands(
	program: Command,
	config: Required<AppConfig>,
) {
	const generateCommand = program
		.command("generate")
		.description(
			"Generate various artifacts (e.g., PR descriptions, commit messages).",
		);

	// Register subcommands for 'generate'
	registerPrCommand(generateCommand, config);
	// Future commands like registerCommitCommand(generateCommand, config) can be added here.
}
