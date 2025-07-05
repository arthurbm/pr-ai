import { test, expect } from "bun:test";
import { parseAiApiError } from "../../src/utils/errors";

// Helper to silence console.error during tests
function withSilencedConsole(fn: () => void) {
	const original = console.error;
	console.error = () => {};
	try {
		fn();
	} finally {
		console.error = original;
	}
}

test("returns same message for generic Error", () => {
	withSilencedConsole(() => {
		const err = new Error("Something went wrong");
		const parsed = parseAiApiError(err, "gpt-4o");
		expect(parsed).toBeInstanceOf(Error);
		expect(parsed.message).toBe("Something went wrong");
	});
});

test("maps incorrect API key message", () => {
	withSilencedConsole(() => {
		const err = new Error("AI_APICallError: incorrect api key provided");
		const parsed = parseAiApiError(err, "gpt-4o");
		expect(parsed.message).toBe(
			"Invalid OpenAI API Key provided. Please check your OPENAI_API_KEY environment variable.",
		);
	});
});

test("maps rate limit message", () => {
	withSilencedConsole(() => {
		const err = new Error("AI_APICallError: Rate limit reached for requests");
		const parsed = parseAiApiError(err, "gpt-4o");
		expect(parsed.message).toBe(
			"OpenAI API rate limit exceeded. Please try again later or check your usage.",
		);
	});
});