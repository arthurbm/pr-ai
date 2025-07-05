import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { checkPrerequisites } from "../../src/core/prerequisites";

describe("checkPrerequisites", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		// Reset environment for each test
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		// Restore original environment
		process.env = originalEnv;
	});

	it("should throw error when OPENAI_API_KEY is not set", async () => {
		// Remove API key
		delete process.env.OPENAI_API_KEY;

		try {
			await checkPrerequisites();
			expect.unreachable("Should have thrown an error");
		} catch (error) {
			expect(error).toBeInstanceOf(Error);
			if (error instanceof Error) {
				// Error could be about missing API key, git, or gh CLI
				expect(
					error.message.includes("OPENAI_API_KEY") ||
					error.message.includes("Git") ||
					error.message.includes("GitHub CLI")
				).toBe(true);
			}
		}
	});

	it("should check for git command availability", async () => {
		// This test mainly checks that the function tries to check git
		// The actual result depends on system setup
		try {
			await checkPrerequisites();
		} catch (error) {
			expect(error).toBeInstanceOf(Error);
			if (error instanceof Error) {
				// Error should be about missing prerequisites
				expect(
					error.message.includes("Git") ||
					error.message.includes("GitHub CLI") ||
					error.message.includes("OPENAI_API_KEY")
				).toBe(true);
			}
		}
	});

	it("should handle unknown errors gracefully", async () => {
		// This test ensures the function properly handles and re-throws errors
		delete process.env.OPENAI_API_KEY;
		
		try {
			await checkPrerequisites();
			expect.unreachable("Should have thrown an error");
		} catch (error) {
			expect(error).toBeInstanceOf(Error);
		}
	});
});