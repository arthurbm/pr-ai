import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { loadConfig, defaultConfig, type AppConfig } from "../../src/config/config";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";

describe("loadConfig", () => {
	const testConfigPath = join(process.cwd(), ".gitliftrc.json");

	afterEach(async () => {
		// Clean up test config file
		try {
			await unlink(testConfigPath);
		} catch (error) {
			// File might not exist, that's ok
		}
	});

	it("should return default config when no config file exists", async () => {
		const config = await loadConfig();
		
		expect(config).toEqual({
			baseBranch: "main",
			model: "gpt-4.1-mini",
			skipConfirmations: false,
			language: "english"
		});
	});

	it("should load and merge custom config with defaults", async () => {
		const customConfig = {
			baseBranch: "develop",
			model: "gpt-4"
		};

		await writeFile(testConfigPath, JSON.stringify(customConfig, null, 2));

		const config = await loadConfig();
		
		expect(config).toEqual({
			baseBranch: "develop",
			model: "gpt-4",
			skipConfirmations: false,
			language: "english"
		});
	});

	it("should override all default values when custom config is provided", async () => {
		const customConfig = {
			baseBranch: "feature",
			model: "gpt-3.5-turbo",
			skipConfirmations: true,
			language: "portuguese"
		};

		await writeFile(testConfigPath, JSON.stringify(customConfig, null, 2));

		const config = await loadConfig();
		
		expect(config).toEqual(customConfig);
	});

	it("should handle invalid JSON gracefully", async () => {
		await writeFile(testConfigPath, "invalid json content");

		const config = await loadConfig();
		
		// Should fall back to defaults
		expect(config).toEqual({
			baseBranch: "main",
			model: "gpt-4.1-mini",
			skipConfirmations: false,
			language: "english"
		});
	});

	it("should validate config schema and reject unknown properties", async () => {
		const invalidConfig = {
			baseBranch: "main",
			model: "gpt-4",
			unknownProperty: "should be rejected"
		};

		await writeFile(testConfigPath, JSON.stringify(invalidConfig, null, 2));

		const config = await loadConfig();
		
		// Should fall back to defaults due to schema validation failure
		expect(config).toEqual({
			baseBranch: "main",
			model: "gpt-4.1-mini",
			skipConfirmations: false,
			language: "english"
		});
	});

	it("should validate config types", async () => {
		const invalidConfig = {
			baseBranch: 123, // Should be string
			model: "gpt-4",
			skipConfirmations: "true" // Should be boolean
		};

		await writeFile(testConfigPath, JSON.stringify(invalidConfig, null, 2));

		const config = await loadConfig();
		
		// Should fall back to defaults due to type validation failure
		expect(config).toEqual({
			baseBranch: "main",
			model: "gpt-4.1-mini",
			skipConfirmations: false,
			language: "english"
		});
	});
});

describe("defaultConfig", () => {
	it("should have expected default values", () => {
		expect(defaultConfig).toEqual({
			baseBranch: "main",
			model: "gpt-4.1-mini",
			skipConfirmations: false,
			language: "english"
		});
	});
});