import { describe, it, expect } from "bun:test";
import { theme } from "../../src/ui/theme";

describe("theme", () => {
	it("should have all required theme functions", () => {
		expect(theme).toHaveProperty("primary");
		expect(theme).toHaveProperty("success");
		expect(theme).toHaveProperty("warning");
		expect(theme).toHaveProperty("error");
		expect(theme).toHaveProperty("info");
		expect(theme).toHaveProperty("dim");
	});

	it("should have functions that return strings", () => {
		const testText = "test";
		
		expect(typeof theme.primary(testText)).toBe("string");
		expect(typeof theme.success(testText)).toBe("string");
		expect(typeof theme.warning(testText)).toBe("string");
		expect(typeof theme.error(testText)).toBe("string");
		expect(typeof theme.info(testText)).toBe("string");
		expect(typeof theme.dim(testText)).toBe("string");
	});

	it("should preserve text content when applying colors", () => {
		const testText = "Hello World";
		
		// All theme functions should preserve the original text
		// We can't test exact colors due to ANSI codes, but we can test that text is preserved
		expect(theme.primary(testText)).toContain("Hello World");
		expect(theme.success(testText)).toContain("Hello World");
		expect(theme.warning(testText)).toContain("Hello World");
		expect(theme.error(testText)).toContain("Hello World");
		expect(theme.info(testText)).toContain("Hello World");
		expect(theme.dim(testText)).toContain("Hello World");
	});

	it("should handle empty strings", () => {
		const emptyText = "";
		
		expect(theme.primary(emptyText)).toBe("");
		expect(theme.success(emptyText)).toBe("");
		expect(theme.warning(emptyText)).toBe("");
		expect(theme.error(emptyText)).toBe("");
		expect(theme.info(emptyText)).toBe("");
		expect(theme.dim(emptyText)).toBe("");
	});

	it("should handle special characters", () => {
		const specialText = "🚀 Test with émojis and àccents!";
		
		expect(theme.primary(specialText)).toContain("🚀 Test with émojis and àccents!");
		expect(theme.success(specialText)).toContain("🚀 Test with émojis and àccents!");
		expect(theme.warning(specialText)).toContain("🚀 Test with émojis and àccents!");
		expect(theme.error(specialText)).toContain("🚀 Test with émojis and àccents!");
		expect(theme.info(specialText)).toContain("🚀 Test with émojis and àccents!");
		expect(theme.dim(specialText)).toContain("🚀 Test with émojis and àccents!");
	});
});