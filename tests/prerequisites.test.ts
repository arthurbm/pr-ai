import { describe, expect, mock, test } from "bun:test";

// Mock external dependencies/commands used by prerequisites
// This is a very basic example. Real tests would need more extensive mocking.
mock.module("bun", () => ({
	// Mock Bun.which to simulate git and gh being found
	which: (command: string) => command === "git" || command === "gh",
	// Mock Bun Shell (`$`) - specifically for the auth check
	$: async (strings: TemplateStringsArray, ...values: unknown[]) => {
		const cmd = strings.join(" ");
		if (cmd.includes("gh auth status")) {
			// Simulate successful auth status check
			return {
				exitCode: 0,
				stdout: Buffer.from("OK"),
				stderr: Buffer.from(""),
			};
		}
		// Default mock for other potential shell commands if needed
		return { exitCode: 0, stdout: Buffer.from(""), stderr: Buffer.from("") };
	},
}));

// Now we can import the function *after* mocking
import { checkPrerequisites } from "../src/prerequisites";

describe("Prerequisite Checks", () => {
	test("should pass if git, gh, and API key are present", async () => {
		// Mock environment variable before the test
		const originalApiKey = process.env.OPENAI_API_KEY;
		process.env.OPENAI_API_KEY = "test-key";

		// Expect checkPrerequisites not to throw an error
		await expect(checkPrerequisites()).resolves.toBeUndefined();

		// Clean up mock environment variable after the test
		process.env.OPENAI_API_KEY = originalApiKey;
	});

	test("should throw if OPENAI_API_KEY is missing", async () => {
		// Ensure the key is not set by storing and setting to undefined
		const originalApiKey = process.env.OPENAI_API_KEY;
		process.env.OPENAI_API_KEY = undefined;

		// Expect checkPrerequisites to throw an error containing the specific message
		await expect(checkPrerequisites()).rejects.toThrow(
			/OPENAI_API_KEY environment variable is not set/,
		);

		// Restore original value
		process.env.OPENAI_API_KEY = originalApiKey;
	});

	// TODO: Add more tests for missing git, missing gh, failed gh auth
	// These would involve changing the mock implementation for `Bun.which` and `$`
});

// TODO: Add test files for git.ts, ai.ts, github.ts, ui.ts with appropriate mocking
