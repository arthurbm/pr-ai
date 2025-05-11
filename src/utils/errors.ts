import { theme } from "../ui/theme";

/**
 * Parses a potential AI API error and returns a more user-friendly Error object.
 * Logs the original error for debugging purposes.
 *
 * @param error The error object caught (type unknown).
 * @param modelName The name of the AI model being used (for context in messages).
 * @returns A standard Error object with a potentially refined message.
 */
export function parseAiApiError(error: unknown, modelName: string): Error {
	let detailedMessage = "Failed to generate PR content using AI.";
	let isApiError = false;

	if (error instanceof Error) {
		detailedMessage = error.message; // Default to the error message

		// Check if it looks like a specific AI SDK API Call Error
		if (error.message.startsWith("AI_APICallError:")) {
			isApiError = true;
			const apiErrorMessage = error.message
				.substring("AI_APICallError:".length)
				.trim();
			detailedMessage = `OpenAI API Error: ${apiErrorMessage}`;

			// Refine messages based on common API error content
			if (apiErrorMessage.toLowerCase().includes("incorrect api key")) {
				detailedMessage =
					"Invalid OpenAI API Key provided. Please check your OPENAI_API_KEY environment variable.";
			} else if (apiErrorMessage.toLowerCase().includes("rate limit")) {
				detailedMessage =
					"OpenAI API rate limit exceeded. Please try again later or check your usage.";
			} else if (apiErrorMessage.toLowerCase().includes("model not found")) {
				detailedMessage = `The specified AI model was not found: ${modelName}. Please check the model name or your API access.`;
			} else if (apiErrorMessage.toLowerCase().includes("insufficient quota")) {
				detailedMessage =
					"OpenAI API quota exceeded. Please check your billing details on OpenAI.";
			}
			// Add more specific checks here if needed
		}

		// Log the original error details for debugging
		if (!isApiError) {
			console.error(
				theme.error("Original AI Error Stack:"),
				theme.dim(error.stack || error.message),
			);
		} else {
			// For identified API errors, log only the original short message (the refined one will be thrown)
			console.error(
				theme.error("Original AI Error Message:"),
				theme.dim(error.message),
			);
		}
	} else {
		// Log non-Error objects
		console.error(theme.error("Raw AI Error (Non-Error object):"), error);
		detailedMessage =
			"An unexpected non-Error object was thrown during AI generation.";
	}

	// Return a standard Error object with the refined message
	return new Error(detailedMessage);
}

// Future Enhancement: Consider adding custom error classes like APIError, GitError, etc.
// export class APIError extends Error { constructor(message: string) { super(message); this.name = 'APIError'; } }
// export class GitError extends Error { constructor(message: string) { super(message); this.name = 'GitError'; } }
// export class GitHubCLIError extends Error { constructor(message: string) { super(message); this.name = 'GitHubCLIError'; } }
// etc.
