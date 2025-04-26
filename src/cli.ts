#!/usr/bin/env bun

import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { $ } from "bun";
import chalk from "chalk";
import inquirer from "inquirer";
import ora from "ora";
import { z } from "zod";

// --- Chalk Theming ---
const theme = {
	primary: chalk.blue,
	success: chalk.green,
	warning: chalk.yellow,
	error: chalk.red,
	info: chalk.cyan,
	dim: chalk.dim,
};

console.log(theme.primary("🚀 Starting PR AI CLI..."));

async function checkPrerequisites() {
	const spinner = ora("Checking prerequisites...").start();
	try {
		if (!Bun.which("git")) {
			throw new Error(
				"Git is not installed. Please install git and try again.",
			);
		}
		spinner.succeed(theme.success("Git found."));
		spinner.start("Checking GitHub CLI...");

		if (!Bun.which("gh")) {
			throw new Error(
				"GitHub CLI (gh) is not installed. Please install gh and authenticate with `gh auth login`.",
			);
		}
		spinner.succeed(theme.success("GitHub CLI found."));
		spinner.start("Checking GitHub CLI authentication...");

		await $`gh auth status`.quiet();
		spinner.succeed(theme.success("GitHub CLI authenticated."));
		spinner.start("Checking OpenAI API Key...");

		if (!process.env.OPENAI_API_KEY) {
			throw new Error(
				"OPENAI_API_KEY environment variable is not set. Please set it and try again.",
			);
		}
		spinner.succeed(theme.success("OPENAI_API_KEY found."));
	} catch (error: unknown) {
		spinner.fail(theme.error("Prerequisite check failed."));
		throw error;
	}
}

async function getGitInfo(baseBranch = "main") {
	const spinner = ora(
		`Getting Git info against base branch '${baseBranch}'...`,
	).start();
	try {
		const currentBranch = (
			await $`git rev-parse --abbrev-ref HEAD`.text()
		).trim();
		spinner.text = `Current branch: ${theme.info(currentBranch)}`;

		if (currentBranch === baseBranch || currentBranch === "master") {
			spinner.stop();
			const confirm = await inquirer.prompt([
				{
					type: "confirm",
					name: "proceed",
					message: theme.warning(
						`🚨 You are on the '${currentBranch}' branch. Create PR anyway?`,
					),
					default: false,
				},
			]);
			if (!confirm.proceed) {
				console.log(theme.warning("Operation cancelled by user."));
				process.exit(0);
			}
			spinner.start();
		}

		spinner.text = `Checking commits ahead of '${baseBranch}'...`;
		const commitCountOutput =
			await $`git rev-list --count ${baseBranch}..HEAD`.text();
		const commitCount = Number.parseInt(commitCountOutput.trim(), 10);

		if (commitCount === 0) {
			throw new Error(
				`No commits found on branch '${currentBranch}' ahead of '${baseBranch}'. Nothing to create a PR for.`,
			);
		}
		spinner.succeed(
			theme.success(`Found ${commitCount} commit(s) ahead of '${baseBranch}'.`),
		);
		spinner.start("Fetching diff and commit logs...");

		const diffOutput = await $`git diff ${baseBranch}..HEAD`.text();
		if (!diffOutput.trim() && commitCount > 0) {
			spinner.warn(
				theme.warning(
					"Warning: Commits found, but the diff appears empty. Proceeding anyway.",
				),
			);
		}

		const commitLogOutput =
			await $`git log ${baseBranch}..HEAD --oneline --pretty=format:"%h %s"`.text();
		const commits = commitLogOutput.trim();

		spinner.succeed(theme.success("Fetched diff and commit logs."));
		return { currentBranch, diff: diffOutput, commits };
	} catch (error: unknown) {
		spinner.fail(theme.error("Failed to get Git information."));
		throw error;
	}
}

async function ensureBranchIsPushed(branchName: string) {
	const spinner = ora(
		`Checking remote status for branch '${branchName}'...`,
	).start();
	let needsPush = false;
	let setUpstream = false;

	try {
		const statusOutput = await $`git status --porcelain=v2 --branch`.text();
		const lines = statusOutput.trim().split("\n");
		let upstream = "";
		let ahead = 0;

		for (const line of lines) {
			if (line.startsWith("# branch.upstream ")) {
				upstream = line.substring("# branch.upstream ".length);
			} else if (line.startsWith("# branch.ab ")) {
				const ab = line.substring("# branch.ab ".length).split(" ");
				ahead = Number.parseInt(ab[0]?.replace("+", "") ?? "0", 10);
			}
		}

		if (!upstream) {
			spinner.text = theme.warning(
				`Branch '${branchName}' has no upstream branch set.`,
			);
			needsPush = true;
			setUpstream = true;
		} else if (ahead > 0) {
			spinner.text = theme.warning(
				`Branch '${branchName}' is ${ahead} commit(s) ahead of '${upstream}'.`,
			);
			needsPush = true;
		} else {
			spinner.succeed(
				theme.success(`Branch '${branchName}' is up to date with remote.`),
			);
		}

		if (needsPush) {
			spinner.stop();
			const { confirmPush } = await inquirer.prompt([
				{
					type: "confirm",
					name: "confirmPush",
					message: `Branch '${branchName}' needs to be pushed to the remote. Push now?`,
					default: true,
				},
			]);

			if (confirmPush) {
				spinner.start(theme.info(`Pushing branch '${branchName}'...`));
				const pushCommand = setUpstream
					? $`git push --set-upstream origin ${branchName}`
					: $`git push`;
				const pushResult = await pushCommand.nothrow();

				if (pushResult.exitCode !== 0) {
					spinner.fail(theme.error("Git push failed."));
					console.error(theme.dim(pushResult.stderr.toString()));
					throw new Error("Failed to push branch to remote.");
				}
				spinner.succeed(theme.success("Branch pushed successfully."));
			} else {
				console.log(
					theme.warning("Push cancelled by user. Aborting PR creation."),
				);
				process.exit(0);
			}
		}
	} catch (error: unknown) {
		spinner.fail(theme.error("Failed to check git status or push branch."));
		type ShellError = { stderr?: { toString: () => string }; message?: string };
		let message = "Unknown error checking git status/push.";
		if (typeof error === "object" && error !== null) {
			const stderr = (error as ShellError).stderr?.toString();
			const msg = (error as ShellError).message;
			message = stderr ?? msg ?? message;
		}
		console.error(theme.error("Error details:"), theme.dim(message));
		throw new Error("Error interacting with git for branch status/push.");
	}
}

const PrContentSchema = z.object({
	title: z
		.string()
		.describe(
			"A concise and informative title for the pull request (max 70 chars).",
		),
	body: z
		.string()
		.describe(
			"A detailed description of the changes in the pull request, explaining the 'what' and 'why'. Use markdown formatting. Include bullet points for clarity if applicable.",
		),
});

async function generatePrContent(
	diff: string,
	commits?: string,
): Promise<z.infer<typeof PrContentSchema>> {
	const spinner = ora(
		theme.info("🤖 Generating PR content with AI..."),
	).start();
	try {
		if (!process.env.OPENAI_API_KEY) {
			throw new Error("OpenAI API key is missing.");
		}

		const model = openai("gpt-4o-mini");

		const systemPrompt =
			"You are an expert programmer assisting with drafting a GitHub Pull Request. Based on the provided git diff (representing changes since the base branch) and commit summaries, generate a concise, informative title (max 70 chars) and a detailed body description for the PR. The title should summarize the main changes reflected in the commits and diff. The body should explain the purpose and context of the changes, referencing the commit summaries if helpful. Use markdown formatting for the body.";

		const userPrompt = `Git Diff:\n\`\`\`diff\n${diff}\n\`\`\`\n\nCommit Summaries:\n\`\`\`\n${commits || "No commit summaries available."}\n\`\`\`\n\nPlease generate the PR title and body.`;

		const { object } = await generateObject({
			model,
			schema: PrContentSchema,
			prompt: userPrompt,
			system: systemPrompt,
		});
		spinner.succeed(theme.success("PR content generated."));
		return object;
	} catch (error) {
		spinner.fail(theme.error("AI generation failed."));
		console.error(theme.error("Error details:"), error);
		throw new Error("Failed to generate PR content using AI.");
	}
}

async function reviewAndConfirmPr(
	initialTitle: string,
	initialBody: string,
): Promise<{ title: string; body: string } | null> {
	let currentTitle = initialTitle;
	let currentBody = initialBody;

	while (true) {
		console.log(`\n${theme.primary("🤖 Generated PR Content (Preview):")}`);
		console.log(`${theme.info("Title:")} ${currentTitle}`);
		console.log(`${theme.info("Body:")}\n${theme.dim(currentBody)}`);

		const { action } = await inquirer.prompt([
			{
				type: "list",
				name: "action",
				message: "Review the generated content:",
				choices: [
					{ name: "✅ Confirm and Create PR", value: "confirm" },
					{ name: "✏️ Edit Title", value: "edit_title" },
					{ name: "📝 Edit Body (in $EDITOR)", value: "edit_body" },
					{ name: "❌ Cancel", value: "cancel" },
				],
			},
		]);

		switch (action) {
			case "confirm":
				return { title: currentTitle, body: currentBody };
			case "edit_title": {
				const { newTitle } = await inquirer.prompt([
					{
						type: "input",
						name: "newTitle",
						message: "Enter the new PR title:",
						default: currentTitle,
					},
				]);
				currentTitle = newTitle;
				break;
			}
			case "edit_body": {
				const answers = await inquirer.prompt({
					type: "editor",
					name: "newBody",
					message: "Edit the PR body (save and close editor to confirm):",
					default: currentBody,
					waitForUseInput: true,
				});
				currentBody = answers.newBody;
				break;
			}
			case "cancel":
				console.log(theme.warning("PR creation cancelled by user."));
				return null;
		}
	}
}

async function createGitHubPr(title: string, body: string): Promise<string> {
	const spinner = ora(theme.info("Creating GitHub PR...")).start();
	try {
		const prCommand = $`gh pr create --title ${title} --body ${body}`;
		const prResult = await prCommand;
		const prUrl = prResult.stdout.toString().trim();

		if (!prUrl || !prUrl.startsWith("http")) {
			spinner.fail(theme.error("Failed to parse PR URL from gh output."));
			console.error(theme.dim("gh stdout:"), prUrl);
			console.error(theme.dim("gh stderr:"), prResult.stderr.toString());
			throw new Error("Failed to parse PR URL.");
		}

		spinner.succeed(
			theme.success(`PR created successfully: ${theme.info(prUrl)}`),
		);
		return prUrl;
	} catch (error: unknown) {
		spinner.fail(theme.error("Failed to create GitHub PR."));
		type ShellError = { stderr?: { toString: () => string }; message?: string };
		let message = "Unknown error creating GitHub PR.";
		if (typeof error === "object" && error !== null) {
			const stderr = (error as ShellError).stderr?.toString();
			const msg = (error as ShellError).message;
			message = stderr ?? msg ?? message;
		}
		console.error(theme.error("Error details:"), theme.dim(message));
		console.error(
			theme.dim(
				"Ensure your branch exists on the remote repository ('origin').",
			),
		);
		throw new Error("GitHub PR creation failed.");
	}
}

async function main() {
	try {
		await checkPrerequisites();
		const { currentBranch, diff, commits } = await getGitInfo();
		await ensureBranchIsPushed(currentBranch);
		const { title: initialTitle, body: initialBody } = await generatePrContent(
			diff,
			commits,
		);

		// Review and confirm/edit the generated content
		const finalPrContent = await reviewAndConfirmPr(initialTitle, initialBody);

		if (!finalPrContent) {
			// User cancelled during review
			process.exit(0);
		}

		const { title, body } = finalPrContent;

		// Create the PR
		const prUrl = await createGitHubPr(title, body);

		// Ask to open PR
		const { openPr } = await inquirer.prompt([
			{
				type: "confirm",
				name: "openPr",
				message: `Open PR ${theme.info(prUrl)} in browser?`,
				default: true,
			},
		]);

		if (openPr) {
			const spinner = ora("Opening PR in browser...").start();
			const prNumber = prUrl.split("/").pop();
			if (prNumber && /^\\d+$/.test(prNumber)) {
				await $`gh browse ${prNumber}`.quiet();
				spinner.succeed("PR opened in browser.");
			} else {
				spinner.warn(
					"Could not extract PR number from URL. Please open manually.",
				);
			}
		}

		console.log(theme.success("\n✨ PR AI process finished successfully!"));
	} catch (error: unknown) {
		console.error(
			theme.error("\n❌ An unexpected error occurred:"),
			error instanceof Error ? error.message : error,
		);
		process.exit(1);
	}
}

main();
