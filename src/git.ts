import { $ } from "bun";
import inquirer from "inquirer";
import ora from "ora";
import { theme } from "./theme";

/**
 * Fetches Git information including current branch, diff, and commits against a base branch.
 * Prompts for confirmation if operating on main/master unless skipConfirm is true.
 * @param {string} [baseBranch='main'] - The base branch to compare against.
 * @param {boolean} [skipConfirm=false] - If true, skips confirmation prompts.
 * @returns {Promise<{currentBranch: string, diff: string, commits: string}>} - Git information.
 * @throws {Error} If no commits are found ahead of the base branch.
 */
export async function getGitInfo(baseBranch = "main", skipConfirm = false) {
	const spinner = ora(
		`Getting Git info against base branch '${baseBranch}'...`,
	).start();
	try {
		const currentBranch = (
			await $`git rev-parse --abbrev-ref HEAD`.text()
		).trim();
		spinner.text = `Current branch: ${theme.info(currentBranch)}`;

		if (
			!skipConfirm &&
			(currentBranch === baseBranch || currentBranch === "master")
		) {
			spinner.stop();
			const { proceed } = await inquirer.prompt([
				{
					type: "confirm",
					name: "proceed",
					message: theme.warning(
						`🚨 You are on the '${currentBranch}' branch. Create PR anyway?`,
					),
					default: false,
				},
			]);
			if (!proceed) {
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
		if (error instanceof Error) throw error;
		throw new Error("An unknown error occurred while fetching Git info.");
	}
}

/**
 * Checks if the current branch needs to be pushed to the remote (origin).
 * Prompts the user to push if needed, unless skipConfirm is true.
 * @param {string} branchName - The name of the branch to check.
 * @param {boolean} [skipConfirm=false] - If true, skips confirmation prompts.
 * @throws {Error} If the push fails or checking status fails.
 */
export async function ensureBranchIsPushed(
	branchName: string,
	skipConfirm = false,
) {
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
			let confirmPush = true; // Assume yes if skipping confirm
			if (!skipConfirm) {
				spinner.stop();
				const answers = await inquirer.prompt([
					{
						type: "confirm",
						name: "confirmPush",
						message: `Branch '${branchName}' needs to be pushed to the remote. Push now?`,
						default: true,
					},
				]);
				confirmPush = answers.confirmPush;
				if (confirmPush) spinner.start(); // Restart spinner only if confirmed
			}

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
			} else if (!skipConfirm) {
				// Only log cancellation if prompt was shown
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
