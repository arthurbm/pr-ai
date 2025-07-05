import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import ora from "ora";
import { z } from "zod";
import { theme } from "../ui/theme";
import { parseAiApiError } from "../utils/errors";

/**
 * Schema for the expected AI response (PR title and body).
 */
export const PrContentSchema = z.object({
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

/**
 * Schema for the expected AI response (commit title and body).
 */
export const CommitMessageSchema = z.object({
	title: z
		.string()
		.describe(
			"A concise and informative commit title following conventional commit standards (e.g., 'feat: add new feature', 'fix: resolve issue'). Max 72 chars.",
		),
	body: z
		.string()
		.describe(
			"A detailed description of the changes in bullet points, explaining the 'what' and 'why'. Each bullet point should start with '- '. If no detailed body is needed, this can be an empty string.",
		),
});

/**
 * Generates PR title and body using OpenAI based on git diff and commit summaries.
 * @param {string} diff - The git diff string.
 * @param {string} [commits] - The commit summaries string.
 * @param {string} [modelName='gpt-4.1-mini'] - The OpenAI model name to use.
 * @param {string} [language='english'] - The language to generate the PR content in.
 * @returns {Promise<z.infer<typeof PrContentSchema>>} - The generated title and body.
 * @throws {Error} If API key is missing or AI generation fails.
 */
export async function generatePrContent(
	diff: string,
	commits?: string,
	modelName = "gpt-4.1-mini",
	language = "english",
): Promise<z.infer<typeof PrContentSchema>> {
	const spinner = ora(
		theme.info("🤖 Generating PR content with AI..."),
	).start();
	try {
		if (!process.env.OPENAI_API_KEY) {
			throw new Error(
				"OpenAI API key is missing. Set the OPENAI_API_KEY environment variable.",
			);
		}

		spinner.text = `🤖 Generating PR content using ${theme.info(modelName)} in ${theme.info(language)}...`;
		const model = openai(modelName);

		// System prompt providing context and instructions to the AI
		const systemPrompt = `You are an expert programmer assisting with drafting a GitHub Pull Request in ${language}. Based on the provided git diff (representing changes since the base branch) and commit summaries, generate a concise, informative title (max 70 chars) and a detailed body description for the PR. The title should summarize the main changes reflected in the commits and diff. The body should explain the purpose and context of the changes, referencing the commit summaries if helpful. Use markdown formatting for the body.`;

		// User prompt providing the actual diff and commit data
		const userPrompt = `Git Diff:\n\`\`\`diff\n${diff}\n\`\`\`\n\nCommit Summaries:\n\`\`\`\n${commits || "No commit summaries available."}\n\`\`\`\n\nPlease generate the PR title and body in ${language}.`;

		const { object } = await generateObject({
			model,
			schema: PrContentSchema,
			prompt: userPrompt,
			system: systemPrompt,
		});
		spinner.succeed(theme.success("PR content generated."));
		return object;
	} catch (error: unknown) {
		spinner.fail(theme.error("AI generation failed."));
		throw parseAiApiError(error, modelName);
	}
}

/**
 * Generates a commit message using OpenAI based on staged git diff.
 * @param {string} stagedDiff - The git diff of staged changes.
 * @param {string} [modelName='gpt-4.1-mini'] - The OpenAI model name to use.
 * @param {string} [language='english'] - The language to generate the commit message in (influences tone and keyword choice if applicable).
 * @returns {Promise<z.infer<typeof CommitMessageSchema>>} - The generated commit message.
 * @throws {Error} If API key is missing or AI generation fails.
 */
export async function generateCommitMessageContent(
	stagedDiff: string,
	modelName = "gpt-4.1-mini",
	language = "english",
): Promise<z.infer<typeof CommitMessageSchema>> {
	const spinner = ora(
		theme.info("🤖 Generating commit message with AI..."),
	).start();
	try {
		if (!process.env.OPENAI_API_KEY) {
			throw new Error(
				"OpenAI API key is missing. Set the OPENAI_API_KEY environment variable.",
			);
		}

		spinner.text = `🤖 Generating commit message using ${theme.info(modelName)}...`;
		const model = openai(modelName);

		// System prompt providing context and instructions to the AI for commit messages
		const systemPrompt = `You are an expert programmer assisting with writing a Git commit message in ${language}. Based on the provided staged git diff, generate a commit message with two parts:
1. A 'title': A concise and informative summary following conventional commit standards (e.g., 'feat: add new user authentication', 'fix: resolve issue with login button'). The title should be a single line, ideally under 72 characters and not ending with a period.
2. A 'body': A detailed description of the changes, presented as bullet points. Each bullet point should start with '- '. Explain the 'what' and 'why' of the changes. If the changes are simple enough that the title suffices, the body can be empty.

The title should summarize the main purpose of the changes shown in the diff. The body should elaborate on these changes. Ensure the body consists of bullet points if it's not empty.`;

		// User prompt providing the actual diff data
		const userPrompt = `Staged Git Diff:\n\`\`\`diff\n${stagedDiff}\n\`\`\`\n\nPlease generate the commit title and body in ${language}.`;

		const { object } = await generateObject({
			model,
			schema: CommitMessageSchema,
			prompt: userPrompt,
			system: systemPrompt,
		});
		spinner.succeed(theme.success("Commit message generated."));
		return object;
	} catch (error: unknown) {
		spinner.fail(theme.error("AI generation for commit message failed."));
		throw parseAiApiError(error, modelName);
	}
}
