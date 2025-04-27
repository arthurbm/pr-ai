import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import ora from "ora";
import { z } from "zod";
import { parseAiApiError } from "./errors";
import { theme } from "./theme";

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
 * Generates PR title and body using OpenAI based on git diff and commit summaries.
 * @param {string} diff - The git diff string.
 * @param {string} [commits] - The commit summaries string.
 * @param {string} [modelName='gpt-4.1-mini'] - The OpenAI model name to use.
 * @returns {Promise<z.infer<typeof PrContentSchema>>} - The generated title and body.
 * @throws {Error} If API key is missing or AI generation fails.
 */
export async function generatePrContent(
	diff: string,
	commits?: string,
	modelName = "gpt-4.1-mini", // Add modelName parameter with default
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

		spinner.text = `🤖 Generating PR content using ${theme.info(modelName)}...`;
		const model = openai(modelName);

		// System prompt providing context and instructions to the AI
		const systemPrompt =
			"You are an expert programmer assisting with drafting a GitHub Pull Request. Based on the provided git diff (representing changes since the base branch) and commit summaries, generate a concise, informative title (max 70 chars) and a detailed body description for the PR. The title should summarize the main changes reflected in the commits and diff. The body should explain the purpose and context of the changes, referencing the commit summaries if helpful. Use markdown formatting for the body.";

		// User prompt providing the actual diff and commit data
		const userPrompt = `Git Diff:\n\`\`\`diff\n${diff}\n\`\`\`\n\nCommit Summaries:\n\`\`\`\n${commits || "No commit summaries available."}\n\`\`\`\n\nPlease generate the PR title and body.`;

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
