#!/usr/bin/env bun

import { $ } from "bun";

console.log("Starting PR AI CLI...");

async function main() {
  // TODO: Implement CLI logic
  console.log("Checking prerequisites...");
  
  // TODO: Check for git
  // TODO: Check for gh
  // TODO: Check for OPENAI_API_KEY

  console.log("Getting git information...");
  // TODO: Get current branch
  // TODO: Check if main/master and confirm
  // TODO: Get git diff --staged

  console.log("Generating PR content with AI...");
  // TODO: Setup AI client
  // TODO: Create prompt
  // TODO: Call AI

  console.log("Creating GitHub PR...");
  // TODO: Run gh pr create

  console.log("PR creation process finished.");
  // TODO: Ask to open PR
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
}); 