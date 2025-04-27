import { $ } from "bun";
import inquirer from "inquirer";
import ora from "ora";
import { theme } from "./theme";

/**
 * Creates a GitHub Pull Request using the gh CLI.
 * @param {string} title - The title of the pull request.
 * @param {string} body - The body content of the pull request.
 * @returns {Promise<string>} - The URL of the created pull request.
 * @throws {Error} If the gh command fails or the URL cannot be parsed.
 */
export async function createGitHubPr(
	title: string,
	body: string,
): Promise<string> {
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
		throw new Error("GitHub CLI Error: gh pr create command failed.");
	}
}

/**
 * Asks the user if they want to open the created PR and opens it in the browser.
 * Skips the prompt if skipConfirm is true.
 * @param {string} prUrl - The URL of the pull request.
 * @param {boolean} [skipConfirm=false] - If true, skips the confirmation prompt.
 */
export async function askAndOpenPr(prUrl: string, skipConfirm = false) {
	let openPr = true; // Assume yes if skipping confirm
	if (!skipConfirm) {
		const answers = await inquirer.prompt([
			{
				type: "confirm",
				name: "openPr",
				message: `Open PR ${theme.info(prUrl)} in browser?`,
				default: true,
			},
		]);
		openPr = answers.openPr;
	}

	if (openPr) {
		const spinner = ora(theme.info("Opening PR in browser...")).start();
		const prNumber = prUrl.split("/").pop();
		if (prNumber && /^\d+$/.test(prNumber)) {
			try {
				await $`gh browse ${prNumber}`.quiet();
				spinner.succeed(theme.success("PR opened in browser."));
			} catch (browseError: unknown) {
				spinner.fail(
					theme.error("GitHub CLI Error: Failed to open PR via gh browse."),
				);
				console.error(theme.error("Error details:"), browseError);
				console.warn(theme.warning(`Please open the URL manually: ${prUrl}`));
			}
		} else {
			spinner.warn(
				theme.warning(
					"Could not extract PR number from URL. Please open manually.",
				),
			);
		}
	}
}
