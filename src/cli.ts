#!/usr/bin/env bun

import { $ } from "bun";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

console.log("Starting PR AI CLI...");

async function checkPrerequisites() {
  console.log("Checking prerequisites...");

  if (!Bun.which("git")) {
    throw new Error("Git is not installed. Please install git and try again.");
  }
  console.log("✅ Git found.");

  if (!Bun.which("gh")) {
    throw new Error(
      "GitHub CLI (gh) is not installed. Please install gh and authenticate with `gh auth login`.",
    );
  }
  console.log("✅ GitHub CLI found.");

  // Verify gh auth status
  try {
    await $`gh auth status`.quiet();
    console.log("✅ GitHub CLI authenticated.");
  } catch (error) {
    throw new Error(
      "GitHub CLI is not authenticated. Please run `gh auth login`.",
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY environment variable is not set. Please set it and try again.",
    );
  }
  console.log("✅ OPENAI_API_KEY found.");
}

async function getGitInfo() {
  console.log("Getting git information...");

  const currentBranch = (await $`git rev-parse --abbrev-ref HEAD`.text()).trim();
  console.log(`Current branch: ${currentBranch}`);

  if (currentBranch === "main" || currentBranch === "master") {
    const confirm = prompt(
      `🚨 You are on the '${currentBranch}' branch. Are you sure you want to create a PR from this branch? (yes/no): `,
    );
    if (confirm?.toLowerCase() !== "yes") {
      console.log("Operation cancelled by user.");
      process.exit(0);
    }
  }

  // Check for staged changes
  const diffOutput = await $`git diff --staged`.text();
  if (!diffOutput.trim()) {
    throw new Error(
      "No staged changes found. Please stage your changes using `git add` before creating a PR.",
    );
  }
  console.log("✅ Staged changes found.");

  return { currentBranch, diff: diffOutput };
}

async function ensureBranchIsPushed(branchName: string) {
    console.log(`Checking remote status for branch '${branchName}'...`);
    let needsPush = false;
    let setUpstream = false;

    try {
        const statusOutput = await $`git status --porcelain=v2 --branch`.text();
        const lines = statusOutput.trim().split('\\n');
        let upstream = '';
        let ahead = 0;

        for (const line of lines) {
            if (line.startsWith('# branch.upstream ')) {
                upstream = line.substring('# branch.upstream '.length);
            } else if (line.startsWith('# branch.ab ')) {
                const ab = line.substring('# branch.ab '.length).split(' ');
                ahead = parseInt(ab[0]?.replace('+', '') ?? '0', 10);
            }
        }

        if (!upstream) {
            console.log(`Branch '${branchName}' has no upstream branch set.`);
            needsPush = true;
            setUpstream = true;
        } else if (ahead > 0) {
            console.log(`Branch '${branchName}' is ${ahead} commit(s) ahead of '${upstream}'.`);
            needsPush = true;
        } else {
            console.log(`✅ Branch '${branchName}' is up to date with remote.`);
        }

        if (needsPush) {
            const confirmPush = await prompt(
                `Branch '${branchName}' needs to be pushed to the remote. Push now? (yes/no): `
            );
            if (confirmPush?.toLowerCase() === 'yes') {
                console.log(`Pushing branch '${branchName}'...`);
                const pushCommand = setUpstream
                    ? $`git push --set-upstream origin ${branchName}`
                    : $`git push`;

                const pushResult = await pushCommand.nothrow(); // Use nothrow for cleaner error handling if push fails

                if (pushResult.exitCode !== 0) {
                    console.error("Git push failed. Stderr:");
                    console.error(pushResult.stderr.toString());
                    throw new Error("Failed to push branch to remote.");
                }
                console.log("✅ Branch pushed successfully.");

            } else {
                console.log("Push cancelled by user. Aborting PR creation.");
                process.exit(0);
            }
        }
    } catch (error: any) {
        console.error("Failed to check git status or push branch:", error.stderr?.toString() ?? error.message);
        throw new Error("Error interacting with git for branch status/push.");
    }
}

const PrContentSchema = z.object({
  title: z.string().describe("A concise and informative title for the pull request."),
  body: z.string().describe("A detailed description of the changes in the pull request, explaining the 'what' and 'why'. Include bullet points for clarity if applicable."),
});

async function generatePrContent(diff: string): Promise<z.infer<typeof PrContentSchema>> {
  console.log("Generating PR content with AI...");

  // Ensure API key is available (already checked, but good practice)
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is missing.");
  }

  const model = openai("gpt-4o-mini"); // Or your preferred model

  const systemPrompt = `You are an expert programmer assisting with drafting a GitHub Pull Request. Based on the provided git diff, generate a concise, informative title and a detailed body description for the PR. The title should summarize the main changes. The body should explain the purpose and context of the changes. Use markdown formatting for the body.`;

  const userPrompt = `Here is the git diff:\\n\\n\`\`\`diff\\n${diff}\\n\`\`\`\\n\\nPlease generate the PR title and body.`;

  try {
    const { object } = await generateObject({
      model,
      schema: PrContentSchema,
      prompt: userPrompt,
      system: systemPrompt,
    });
    console.log("✅ PR content generated.");
    return object;
  } catch (error) {
    console.error("AI generation failed:", error);
    throw new Error("Failed to generate PR content using AI.");
  }
}

async function main() {
  await checkPrerequisites();

  const { currentBranch, diff } = await getGitInfo();

  // Ensure the branch is pushed before proceeding
  await ensureBranchIsPushed(currentBranch);

  const { title, body } = await generatePrContent(diff);

  console.log("\n🤖 Generated PR Content:");
  console.log("Title:", title);
  console.log("Body:\n", body);

  // Use Bun Shell to create the PR and capture the URL
  console.log("\nCreating GitHub PR...");
  try {
    // Pass title and body as escaped arguments directly in the template literal
    // Capture stdout to get the PR URL
    const prCommand = $`gh pr create --title ${title} --body ${body}`;
    const prResult = await prCommand; // Let it throw on non-zero exit code
    const prUrl = prResult.stdout.toString().trim();

    // Basic check if URL looks like a URL (gh pr create stdout is just the URL)
    if (!prUrl || !prUrl.startsWith('http')) {
       console.error("gh pr create output (stdout):", prUrl);
       console.error("gh pr create output (stderr):", prResult.stderr.toString());
       throw new Error("Failed to parse PR URL from gh command output.");
    }

    console.log(`✅ PR created successfully: ${prUrl}`);

    // Ask user if they want to open the PR
    const openPr = await prompt("Open the new PR in your browser? (yes/no): ");
    if (openPr?.toLowerCase() === "yes") {
      console.log(`Opening ${prUrl} in browser...`);
      // Use gh browse. Use $.quiet() to suppress the command output unless there's an error
      await $`gh browse ${prUrl}`.quiet();
    }
  } catch (error: any) { // Type the error
    const stderr = error?.stderr?.toString() ?? error?.message ?? "Unknown error";
    console.error("Failed to create GitHub PR:", stderr);
    // Add context about pushing manually just in case the check failed somehow
    console.error("Ensure your branch exists on the remote repository ('origin'). You might need to run 'git push --set-upstream origin <branch-name>' manually.");
    throw new Error(`GitHub PR creation failed: ${stderr}`);
  }

  console.log("\n✨ PR AI process finished successfully!");
}

main().catch((error) => {
  console.error(`❌ Error: ${error.message}`);
  // Cause is already handled if it's an AI error, avoid duplicating
  // if (error.cause) {
  //   console.error("Cause:", error.cause);
  // }
  process.exit(1);
}); 