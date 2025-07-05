import { describe, it, expect } from "bun:test";
import { parseAiApiError } from "../../src/utils/errors";

describe("parseAiApiError", () => {
	it("should parse API call error with incorrect API key", () => {
		const error = new Error("AI_APICallError: incorrect api key provided");
		const result = parseAiApiError(error, "gpt-4");
		
		expect(result.message).toBe("Invalid OpenAI API Key provided. Please check your OPENAI_API_KEY environment variable.");
	});

	it("should parse API call error with rate limit", () => {
		const error = new Error("AI_APICallError: rate limit exceeded");
		const result = parseAiApiError(error, "gpt-4");
		
		expect(result.message).toBe("OpenAI API rate limit exceeded. Please try again later or check your usage.");
	});

	it("should parse API call error with model not found", () => {
		const error = new Error("AI_APICallError: model not found");
		const result = parseAiApiError(error, "gpt-4");
		
		expect(result.message).toBe("The specified AI model was not found: gpt-4. Please check the model name or your API access.");
	});

	it("should parse API call error with insufficient quota", () => {
		const error = new Error("AI_APICallError: insufficient quota");
		const result = parseAiApiError(error, "gpt-4");
		
		expect(result.message).toBe("OpenAI API quota exceeded. Please check your billing details on OpenAI.");
	});

	it("should parse generic API call error", () => {
		const error = new Error("AI_APICallError: some other error");
		const result = parseAiApiError(error, "gpt-4");
		
		expect(result.message).toBe("OpenAI API Error: some other error");
	});

	it("should parse regular error", () => {
		const error = new Error("Some regular error");
		const result = parseAiApiError(error, "gpt-4");
		
		expect(result.message).toBe("Some regular error");
	});

	it("should handle non-Error objects", () => {
		const error = "String error";
		const result = parseAiApiError(error, "gpt-4");
		
		expect(result.message).toBe("An unexpected non-Error object was thrown during AI generation.");
	});

	it("should handle null/undefined errors", () => {
		const error = null;
		const result = parseAiApiError(error, "gpt-4");
		
		expect(result.message).toBe("An unexpected non-Error object was thrown during AI generation.");
	});
});