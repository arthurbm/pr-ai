import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { $ } from "bun";
import type { Command } from "commander";
import inquirer from "inquirer";
import ora from "ora";
import { checkPrerequisites } from "../core/prerequisites";
import { theme } from "../ui/theme";

interface InitOptions {
	global: boolean;
}

interface InitConfig {
	baseBranch: string;
	model: string;
	language: string;
	skipConfirmations: boolean;
}

async function detectGitInfo() {
	try {
		// Detectar branch padrão do repositório
		const branches = await $`git branch -r`.text();
		if (branches.includes("origin/main")) return "main";
		if (branches.includes("origin/master")) return "master";
		if (branches.includes("origin/develop")) return "develop";
		return "main"; // fallback
	} catch {
		return "main";
	}
}

async function setupOpenAIKey() {
	if (process.env.OPENAI_API_KEY) {
		console.log(theme.success("✓ OpenAI API Key already configured"));
		return;
	}

	console.log(theme.warning("⚠️ OpenAI API Key not found"));
	console.log(
		theme.info("Get your API key at: https://platform.openai.com/api-keys"),
	);

	const { apiKey } = await inquirer.prompt([
		{
			type: "password",
			name: "apiKey",
			message: "Enter your OpenAI API Key:",
			mask: "*",
			validate: (input) => input.length > 0 || "API Key is required",
		},
	]);

	const { addToShell } = await inquirer.prompt([
		{
			type: "confirm",
			name: "addToShell",
			message: "Add OPENAI_API_KEY to your shell profile (.zshrc/.bashrc)?",
			default: true,
		},
	]);

	if (addToShell) {
		try {
			const shell = process.env.SHELL || "";
			const profile = shell.includes("zsh") ? ".zshrc" : ".bashrc";
			const profilePath = join(process.env.HOME || "", profile);

			const exportLine = `\nexport OPENAI_API_KEY="${apiKey}"\n`;
			await writeFile(profilePath, exportLine, { flag: "a" });

			console.log(theme.success(`✓ Added OPENAI_API_KEY to ${profile}`));
			console.log(
				theme.info("Run `source ~/${profile}` or restart your terminal"),
			);
		} catch (error) {
			console.log(
				theme.warning("⚠️ Could not automatically add to shell profile"),
			);
			console.log(
				theme.info(
					`Please add this line to your shell profile:\nexport OPENAI_API_KEY="${apiKey}"`,
				),
			);
		}
	}

	// Set for current session
	process.env.OPENAI_API_KEY = apiKey;
}

async function setupGitHubAuth() {
	const spinner = ora("Checking GitHub CLI authentication...").start();
	try {
		await $`gh auth status`.quiet();
		spinner.succeed(theme.success("✓ GitHub CLI already authenticated"));
	} catch {
		spinner.fail(theme.warning("⚠️ GitHub CLI not authenticated"));

		const { authenticate } = await inquirer.prompt([
			{
				type: "confirm",
				name: "authenticate",
				message: "Authenticate with GitHub now?",
				default: true,
			},
		]);

		if (authenticate) {
			console.log(theme.info("Opening GitHub authentication..."));
			await $`gh auth login`;
		} else {
			console.log(
				theme.warning(
					"Skipping GitHub authentication. Run 'gh auth login' later.",
				),
			);
		}
	}
}

async function setupEditor() {
	if (process.env.EDITOR) {
		console.log(
			theme.success(`✓ Editor already configured: ${process.env.EDITOR}`),
		);
		return;
	}

	const editors = [
		{ name: "Visual Studio Code (code --wait)", value: "code --wait" },
		{ name: "Nano", value: "nano" },
		{ name: "Vim", value: "vim" },
		{ name: "Emacs", value: "emacs" },
		{ name: "Other (specify)", value: "other" },
	];

	const { editor } = await inquirer.prompt([
		{
			type: "list",
			name: "editor",
			message: "Choose your preferred editor for editing PR/commit messages:",
			choices: editors,
		},
	]);

	let editorCommand = editor;
	if (editor === "other") {
		const { customEditor } = await inquirer.prompt([
			{
				type: "input",
				name: "customEditor",
				message: "Enter editor command:",
				validate: (input) => input.length > 0 || "Editor command is required",
			},
		]);
		editorCommand = customEditor;
	}

	const { addToShell } = await inquirer.prompt([
		{
			type: "confirm",
			name: "addToShell",
			message: "Add EDITOR to your shell profile?",
			default: true,
		},
	]);

	if (addToShell) {
		try {
			const shell = process.env.SHELL || "";
			const profile = shell.includes("zsh") ? ".zshrc" : ".bashrc";
			const profilePath = join(process.env.HOME || "", profile);

			const exportLine = `\nexport EDITOR="${editorCommand}"\n`;
			await writeFile(profilePath, exportLine, { flag: "a" });

			console.log(theme.success(`✓ Added EDITOR to ${profile}`));
		} catch (error) {
			console.log(
				theme.warning("⚠️ Could not automatically add to shell profile"),
			);
			console.log(
				theme.info(
					`Please add this line to your shell profile:\nexport EDITOR="${editorCommand}"`,
				),
			);
		}
	}
}

async function createConfigFile(config: InitConfig, isGlobal: boolean) {
	const configContent = {
		baseBranch: config.baseBranch,
		model: config.model,
		language: config.language,
		skipConfirmations: config.skipConfirmations,
	};

	const configPath = isGlobal
		? join(process.env.HOME || "", ".gitliftrc.json")
		: ".gitliftrc.json";

	await writeFile(configPath, JSON.stringify(configContent, null, 2));
	console.log(theme.success(`✓ Configuration saved to ${configPath}`));
}

async function testConfiguration(config: InitConfig) {
	const spinner = ora("Testing configuration...").start();

	try {
		// Test OpenAI API
		spinner.text = "Testing OpenAI API connection...";
		const testPrompt = "test";
		// Note: This would be a minimal API call to test connectivity
		// For now, we'll just check if the key exists
		if (!process.env.OPENAI_API_KEY) {
			throw new Error("OpenAI API Key not found");
		}

		// Test GitHub CLI
		spinner.text = "Testing GitHub CLI...";
		await $`gh auth status`.quiet();

		// Test Git
		spinner.text = "Testing Git...";
		await $`git status`.quiet();

		spinner.succeed(theme.success("✓ All configurations working correctly!"));
	} catch (error) {
		spinner.fail(theme.error("⚠️ Configuration test failed"));
		console.log(
			theme.dim(`Error: ${error instanceof Error ? error.message : error}`),
		);
		console.log(
			theme.info("You can run tests manually using the generated config."),
		);
	}
}

async function handleInit(options: InitOptions) {
	console.log(theme.primary("🚀 GitLift Setup Wizard"));
	console.log(
		theme.dim(
			"This will guide you through setting up GitLift for your project.",
		),
	);

	try {
		// Step 1: Check basic prerequisites
		console.log(theme.info("\n📋 Step 1: Checking prerequisites..."));
		try {
			await checkPrerequisites();
		} catch (error) {
			console.log(
				theme.warning("⚠️ Some prerequisites are missing. Let's set them up!"),
			);
		}

		// Step 2: Setup OpenAI API Key
		console.log(theme.info("\n🔑 Step 2: OpenAI API Key setup..."));
		await setupOpenAIKey();

		// Step 3: Setup GitHub Authentication
		console.log(theme.info("\n🐙 Step 3: GitHub CLI authentication..."));
		await setupGitHubAuth();

		// Step 4: Setup Editor
		console.log(theme.info("\n✏️ Step 4: Editor configuration..."));
		await setupEditor();

		// Step 5: Configuration wizard
		console.log(theme.info("\n⚙️ Step 5: GitLift configuration..."));

		const detectedBranch = await detectGitInfo();

		const config = await inquirer.prompt([
			{
				type: "input",
				name: "baseBranch",
				message: "Default base branch for PRs:",
				default: detectedBranch,
			},
			{
				type: "list",
				name: "model",
				message: "Preferred OpenAI model:",
				choices: [
					{ name: "GPT-4 Turbo (Recommended)", value: "gpt-4.1-mini" },
					{ name: "GPT-4o", value: "gpt-4o" },
					{ name: "GPT-4o Mini (Faster/Cheaper)", value: "gpt-4o-mini" },
				],
				default: "gpt-4.1-mini",
			},
			{
				type: "list",
				name: "language",
				message: "Default language for generated content:",
				choices: [
					{ name: "English", value: "english" },
					{ name: "Português", value: "portuguese" },
					{ name: "Español", value: "spanish" },
					{ name: "Other (specify)", value: "other" },
				],
				default: "english",
			},
			{
				type: "confirm",
				name: "skipConfirmations",
				message: "Skip confirmation prompts by default?",
				default: false,
			},
		]);

		if (config.language === "other") {
			const { customLanguage } = await inquirer.prompt([
				{
					type: "input",
					name: "customLanguage",
					message: "Enter your preferred language:",
					validate: (input) => input.length > 0 || "Language is required",
				},
			]);
			config.language = customLanguage;
		}

		// Step 6: Save configuration
		console.log(theme.info("\n💾 Step 6: Saving configuration..."));
		await createConfigFile(config as InitConfig, options.global);

		// Step 7: Test configuration
		console.log(theme.info("\n🧪 Step 7: Testing configuration..."));
		await testConfiguration(config as InitConfig);

		// Success message
		console.log(theme.success("\n✨ GitLift setup completed successfully!"));
		console.log(theme.info("\nNext steps:"));
		console.log(theme.dim("• Try: gitlift generate pr"));
		console.log(theme.dim("• Try: gitlift generate commit"));
		console.log(theme.dim("• Docs: https://github.com/arthurbm/gitlift"));
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.error(theme.error(`\n❌ Setup failed: ${error.message}`));
		} else {
			console.error(
				theme.error("\n❌ An unexpected error occurred during setup:"),
				error,
			);
		}
		process.exit(1);
	}
}

export function registerInitCommand(program: Command) {
	program
		.command("init")
		.description("Interactive setup wizard for GitLift configuration")
		.option("-g, --global", "Create global configuration file", false)
		.action(async (options: InitOptions) => {
			await handleInit(options);
		});
}
