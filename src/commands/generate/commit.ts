import type { Command } from "commander";
import inquirer from "inquirer";
import type { AppConfig } from "../../config/config";
import { generateCommitMessageContent } from "../../core/ai";
import {
	getStagedDiff,
	getUnstagedChanges,
	gitCommit,
	stageAllTrackedAndUntrackedChanges,
} from "../../core/git";
import { reviewAndConfirmCommitMessage } from "../../ui/commit-ui";
import { theme } from "../../ui/theme";

interface GenerateCommitOptions {
	all: boolean;
	model?: string;
	language?: string;
	yes: boolean;
}

async function handleGenerateCommit(
	options: GenerateCommitOptions,
	config: Required<AppConfig>,
) {
	console.log(theme.primary("🚀 Starting GitMagic Commit Generation..."));

	try {
		if (options.all) {
			console.log(
				theme.info("Attempting to stage all modified and new files (--all)..."),
			);
			await stageAllTrackedAndUntrackedChanges();
		}

		let stagedDiff = await getStagedDiff();

		if (!stagedDiff) {
			const { unstagedModifiedFiles, untrackedFiles } =
				await getUnstagedChanges();
			if (unstagedModifiedFiles.length > 0 || untrackedFiles.length > 0) {
				console.log(
					theme.warning(
						"No staged changes found. However, there are unstaged changes:",
					),
				);
				if (unstagedModifiedFiles.length > 0) {
					console.log(
						theme.dim(`  Modified: ${unstagedModifiedFiles.join(", ")}`),
					);
				}
				if (untrackedFiles.length > 0) {
					console.log(theme.dim(`  Untracked: ${untrackedFiles.join(", ")}`));
				}

				if (!options.yes) {
					const { confirmStage } = await inquirer.prompt([
						{
							type: "confirm",
							name: "confirmStage",
							message: "Do you want to stage all these changes and proceed?",
							default: false,
						},
					]);
					if (confirmStage) {
						await stageAllTrackedAndUntrackedChanges();
						stagedDiff = await getStagedDiff(); // Re-check staged diff
						if (!stagedDiff) {
							console.log(
								theme.error(
									"Failed to stage changes or no changes to stage after attempting. Aborting.",
								),
							);
							process.exit(1);
						}
					} else {
						console.log(
							theme.warning(
								"Aborting commit generation as no changes are staged and user chose not to stage.",
							),
						);
						process.exit(0);
					}
				} else {
					console.log(
						theme.warning(
							"Aborting: No staged changes, and --yes flag is set, so cannot prompt to stage unstaged changes.",
						),
					);
					process.exit(0);
				}
			} else {
				console.log(
					theme.warning(
						"No staged changes found and no unstaged changes detected. Nothing to commit.",
					),
				);
				process.exit(0);
			}
		}

		const commitModel = options.model || config.model;
		const commitLanguage = options.language || config.language;

		const { title: initialTitle, body: initialBody } =
			await generateCommitMessageContent(
				stagedDiff,
				commitModel,
				commitLanguage,
			);

		let finalCommitParts: { title: string; body: string } | null = {
			title: initialTitle,
			body: initialBody,
		};

		if (!options.yes) {
			finalCommitParts = await reviewAndConfirmCommitMessage(
				initialTitle,
				initialBody,
			);
		}

		if (!finalCommitParts) {
			console.log(theme.warning("Commit generation cancelled."));
			process.exit(0);
		}

		// Construct the final commit message string
		// Title is the first line, then a blank line, then the body.
		// If body is empty or only whitespace, only use the title.
		let finalCommitString = finalCommitParts.title;
		if (finalCommitParts.body?.trim()) {
			finalCommitString += `\n\n${finalCommitParts.body.trim()}`;
		}

		await gitCommit(finalCommitString);

		console.log(
			theme.success("\n✨ Commit generated and applied successfully!"),
		);
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.error(
				theme.error(`\n❌ Error in Commit Generation: ${error.message}`),
			);
		} else {
			console.error(
				theme.error(
					"\n❌ An unexpected error occurred during Commit Generation:",
				),
				error,
			);
		}
		process.exit(1);
	}
}

export function registerCommitCommand(
	generateCommand: Command,
	config: Required<AppConfig>,
) {
	generateCommand
		.command("commit")
		.description("Generate a commit message using AI based on staged changes.")
		.option(
			"-a, --all",
			"Automatically stage files that have been modified and deleted, then do a normal commit",
			false,
		)
		.option(
			"-m, --model <model-name>",
			"Specify the OpenAI model for commit messages (overrides config)",
		)
		.option(
			"-l, --language <language>",
			"Specify the language for the commit message (overrides config)",
		)
		.option("-y, --yes", "Skip confirmation prompts", config.skipConfirmations)
		.action(
			async (
				cmdOptions: Omit<GenerateCommitOptions, "model" | "language"> & {
					model?: string;
					language?: string;
				},
			) => {
				// Ensure options passed to handler have correct typing, including potentially undefined model/language
				const options: GenerateCommitOptions = {
					all: cmdOptions.all,
					yes: cmdOptions.yes,
					model: cmdOptions.model, // Will be undefined if not provided, handled in handleGenerateCommit
					language: cmdOptions.language, // Will be undefined if not provided
				};
				await handleGenerateCommit(options, config);
			},
		);
}
