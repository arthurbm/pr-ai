import { cosmiconfig } from "cosmiconfig";
import { z } from "zod";
import { theme } from "../ui/theme";

// Define the schema for the configuration file
// Optional fields allow users to only specify what they want to override
const ConfigFileSchema = z
	.object({
		baseBranch: z.string().optional(),
		model: z.string().optional(),
		skipConfirmations: z.boolean().optional(), // Map to --yes flag
		language: z.string().optional(), // Add language option
	})
	.strict(); // Use strict to prevent unknown properties

export type AppConfig = z.infer<typeof ConfigFileSchema>;

// Define default configuration values (make this partial, required applied later)
export const defaultConfig: Partial<AppConfig> = {
	baseBranch: "main",
	model: "gpt-4.1-mini",
	skipConfirmations: false,
	language: "english", // Default language is English
};

/**
 * Loads configuration from a configuration file using cosmiconfig.
 * Searches for files like .prairc, .prairc.json, etc.
 * Merges found config with defaults.
 * @returns {Promise<Required<AppConfig>>} The loaded and merged configuration (ensuring all fields are present).
 */
export async function loadConfig(): Promise<Required<AppConfig>> {
	const explorer = cosmiconfig("gitlift"); // Module name for searching
	let loadedConfig: AppConfig = {};

	try {
		const result = await explorer.search(); // Search starting from cwd

		if (result && !result.isEmpty) {
			console.log(theme.dim(`Loaded configuration from: ${result.filepath}`));
			// Validate the loaded config against the schema
			loadedConfig = ConfigFileSchema.parse(result.config);
		} else {
			// No config file found or it's empty
			console.log(theme.dim("No configuration file found, using defaults."));
		}
	} catch (error: unknown) {
		console.error(theme.error("Error loading or parsing configuration file."));
		if (error instanceof z.ZodError) {
			console.error(theme.error("Invalid configuration format:"), error.errors);
		} else if (error instanceof Error) {
			console.error(theme.error(error.message));
		}
		console.warn(
			theme.warning(
				"Falling back to default configuration values for potentially invalid fields.",
			),
		);
		// Keep whatever partial config was loaded, defaults will fill the rest
	}

	// Merge defaults with loaded config (loaded values override defaults)
	// Ensure all required fields are present after merge
	return { ...defaultConfig, ...loadedConfig } as Required<AppConfig>;
}
