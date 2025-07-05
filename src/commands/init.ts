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
	console.log(
		theme.dim("Your API key should start with 'sk-' followed by additional characters"),
	);

	const { apiKey } = await inquirer.prompt([
		{
			type: "password",
			name: "apiKey",
			message: "Enter your OpenAI API Key:",
			mask: "*",
			validate: (input) => {
				if (!input || input.length === 0) {
					return "API Key is required";
				}
				if (!input.startsWith("sk-")) {
					return "API Key should start with 'sk-'";
				}
				if (input.length < 20) {
					return "API Key appears to be too short";
				}
				return true;
			},
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

			// Properly escape the API key to prevent shell injection
			const escapedApiKey = apiKey.replace(/'/g, "'\"'\"'");
			const exportLine = `\nexport OPENAI_API_KEY='${escapedApiKey}'\n`;
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
				validate: (input) => {
					if (!input || input.length === 0) {
						return "Editor command is required";
					}
					// Basic validation - check if it looks like a valid command
					if (input.includes("&&") || input.includes("||") || input.includes(";")) {
						return "Editor command should not contain shell operators";
					}
					return true;
				},
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

			// Properly escape the editor command to prevent shell injection
			const escapedEditorCommand = editorCommand.replace(/'/g, "'\"'\"'");
			const exportLine = `\nexport EDITOR='${escapedEditorCommand}'\n`;
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
	const testResults = {
		openai: false,
		github: false,
		git: false,
	};

	try {
		// Test OpenAI API
		spinner.text = "Testing OpenAI API connection...";
		if (!process.env.OPENAI_API_KEY) {
			throw new Error("OpenAI API Key not found");
		}

		try {
			// Make a simple API call to test the key
			const { openai } = await import("@ai-sdk/openai");
			const { generateText } = await import("ai");
			
			await generateText({
				model: openai(config.model),
				prompt: "Hello",
				maxTokens: 5,
			});
			
			testResults.openai = true;
			spinner.text = theme.success("✓ OpenAI API connection successful");
		} catch (apiError) {
			console.log(theme.warning("\n⚠️ OpenAI API test failed"));
			console.log(theme.dim("This might be due to invalid API key or network issues"));
			console.log(theme.dim("You can continue, but AI features may not work"));
		}

		// Test GitHub CLI
		spinner.text = "Testing GitHub CLI authentication...";
		try {
			await $`gh auth status`.quiet();
			testResults.github = true;
			spinner.text = theme.success("✓ GitHub CLI authenticated");
		} catch (ghError) {
			console.log(theme.warning("\n⚠️ GitHub CLI test failed"));
			console.log(theme.dim("You may need to run 'gh auth login' later"));
		}

		// Test Git
		spinner.text = "Testing Git repository...";
		try {
			await $`git status`.quiet();
			testResults.git = true;
			spinner.text = theme.success("✓ Git repository detected");
		} catch (gitError) {
			console.log(theme.warning("\n⚠️ Git test failed"));
			console.log(theme.dim("Make sure you're in a Git repository"));
		}

		const successCount = Object.values(testResults).filter(Boolean).length;
		const totalTests = Object.keys(testResults).length;

		if (successCount === totalTests) {
			spinner.succeed(theme.success("✓ All configurations working correctly!"));
		} else {
			spinner.succeed(theme.warning(`✓ Setup completed (${successCount}/${totalTests} tests passed)`));
		}
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
	console.log(
		theme.dim(
			"You can exit at any time with Ctrl+C and run 'gitlift init' again.",
		),
	);

	const setupProgress = {
		prerequisites: false,
		openai: false,
		github: false,
		editor: false,
		config: false,
		test: false,
	};

	try {
		// Step 1: Check basic prerequisites
		console.log(theme.info("\n📋 Step 1: Checking prerequisites..."));
		console.log(theme.dim("Verifying Git and GitHub CLI are installed"));
		try {
			await checkPrerequisites();
			setupProgress.prerequisites = true;
		} catch (error) {
			console.log(
				theme.warning("⚠️ Some prerequisites are missing. Let's set them up!"),
			);
		}

		// Step 2: Setup OpenAI API Key
		console.log(theme.info("\n🔑 Step 2: OpenAI API Key setup..."));
		console.log(theme.dim("This is required for AI-powered content generation"));
		await setupOpenAIKey();
		setupProgress.openai = true;

		// Step 3: Setup GitHub Authentication
		console.log(theme.info("\n🐙 Step 3: GitHub CLI authentication..."));
		console.log(theme.dim("This is needed to create pull requests"));
		await setupGitHubAuth();
		setupProgress.github = true;

		// Step 4: Setup Editor
		console.log(theme.info("\n✏️ Step 4: Editor configuration..."));
		console.log(theme.dim("Choose your preferred editor for reviewing generated content"));
		await setupEditor();
		setupProgress.editor = true;

		// Step 5: Configuration wizard
		console.log(theme.info("\n⚙️ Step 5: GitLift configuration..."));
		console.log(theme.dim("Customize GitLift settings for your workflow"));

		const detectedBranch = await detectGitInfo();

		const config = await inquirer.prompt([
			{
				type: "input",
				name: "baseBranch",
				message: "Default base branch for PRs:",
				default: detectedBranch,
				validate: (input) => input.length > 0 || "Base branch is required",
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
					{ name: "Français", value: "french" },
					{ name: "Deutsch", value: "german" },
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

		setupProgress.config = true;

		// Step 6: Save configuration
		console.log(theme.info("\n💾 Step 6: Saving configuration..."));
		await createConfigFile(config as InitConfig, options.global);

		// Step 7: Test configuration
		console.log(theme.info("\n🧪 Step 7: Testing configuration..."));
		console.log(theme.dim("Verifying all components are working correctly"));
		await testConfiguration(config as InitConfig);
		setupProgress.test = true;

		// Success message
		console.log(theme.success("\n✨ GitLift setup completed successfully!"));
		
		// Setup summary
		const completedSteps = Object.values(setupProgress).filter(Boolean).length;
		const totalSteps = Object.keys(setupProgress).length;
		console.log(theme.info(`\n📊 Setup Summary: ${completedSteps}/${totalSteps} steps completed`));
		
		console.log(theme.info("\n🚀 Next steps:"));
		console.log(theme.dim("• Try: gitlift generate pr"));
		console.log(theme.dim("• Try: gitlift generate commit"));
		console.log(theme.dim("• Docs: https://github.com/arthurbm/gitlift"));
		
		console.log(theme.info("\n💡 Tips:"));
		console.log(theme.dim("• Use --help flag to see all available options"));
		console.log(theme.dim("• Config file location: " + (options.global ? "~/.gitliftrc.json" : "./.gitliftrc.json")));
		console.log(theme.dim("• Re-run 'gitlift init' anytime to update settings"));
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.error(theme.error(`\n❌ Setup failed: ${error.message}`));
		} else {
			console.error(
				theme.error("\n❌ An unexpected error occurred during setup:"),
				error,
			);
		}
		
		// Show troubleshooting tips
		console.log(theme.info("\n🔧 Troubleshooting tips:"));
		console.log(theme.dim("• Make sure you're in a Git repository"));
		console.log(theme.dim("• Check your internet connection"));
		console.log(theme.dim("• Verify your OpenAI API key is valid"));
		console.log(theme.dim("• Run 'gh auth login' if GitHub CLI auth fails"));
		console.log(theme.dim("• Try running 'gitlift init' again"));
		
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
