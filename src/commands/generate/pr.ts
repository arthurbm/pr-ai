import type { Command } from "commander";
import type { AppConfig } from "../../config/config"; // Using AppConfig and Required
import { generatePrContent } from "../../core/ai";
import { ensureBranchIsPushed, getGitInfo } from "../../core/git";
import { askAndOpenPr, createGitHubPr } from "../../core/github";
import { checkPrerequisites } from "../../core/prerequisites";
import { reviewAndConfirmPr } from "../../ui/pr-ui";
import { theme } from "../../ui/theme";

// Define the expected shape of options for this command
interface GeneratePrOptions {
	base: string;
	model: string;
	language: string;
	yes: boolean;
	dryRun: boolean;
}

async function handleGeneratePr(options: GeneratePrOptions) {
	console.log(theme.primary("🚀 Starting GitLift PR Generation..."));

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
			options.language,
		);

		let finalPrContent: { title: string; body: string } | null = {
			title: initialTitle,
			body: initialBody,
		};

		if (!options.yes) {
			finalPrContent = await reviewAndConfirmPr(initialTitle, initialBody);
		}

		if (!finalPrContent) {
			console.log(theme.warning("PR generation cancelled."));
			process.exit(0);
		}

		const { title, body } = finalPrContent;

		if (options.dryRun) {
			console.log(`\\n${theme.primary("Dry Run Results:")}`);
			console.log(`${theme.info("Title:")} ${title}`);
			console.log(`${theme.info("Body:\\n")}${theme.dim(body)}`);
			console.log(
				theme.warning("\\nExiting due to --dry-run flag. No PR created."),
			);
			process.exit(0);
		}

		const prUrl = await createGitHubPr(title, body);
		await askAndOpenPr(prUrl, options.yes);

		console.log(theme.success("\\n✨ PR AI process finished successfully!"));
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.error(
				theme.error(`\\n❌ Error in PR Generation: ${error.message}`),
			);
		} else {
			console.error(
				theme.error("\\n❌ An unexpected error occurred during PR Generation:"),
				error,
			);
		}
		process.exit(1);
	}
}

export function registerPrCommand(
	generateCommand: Command,
	config: Required<AppConfig>,
) {
	generateCommand
		.command("pr")
		.description("Generate a Pull Request description and title using AI.")
		.option(
			"-b, --base <branch>",
			"Specify the base branch for comparison",
			config.baseBranch,
		)
		.option(
			"-m, --model <model-name>",
			"Specify the OpenAI model to use",
			config.model,
		)
		.option(
			"-l, --language <language>",
			"Specify the language for PR content (e.g., english, portuguese, spanish)",
			config.language,
		)
		.option(
			"-y, --yes",
			"Skip all confirmation prompts",
			config.skipConfirmations,
		)
		.option("--dry-run", "Generate title/body but do not create PR", false)
		.action(async (cmdOptions: GeneratePrOptions) => {
			await handleGeneratePr(cmdOptions);
		});
}
