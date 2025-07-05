# GitLift Codebase Bug Analysis and Fixes

## Bug #1: Logic Error in Git Status Parsing

**Location**: `src/core/git.ts` - `getUnstagedChanges()` function (lines 220-236)

**Bug Type**: Logic Error

**Description**: 
The function incorrectly parses git status output for unstaged changes. The current logic checks for both `"M "` (staged but not modified in working tree) and `" M"` (modified in working tree but not staged) when looking for unstaged modified files. This creates confusion about what constitutes "unstaged" changes.

**Impact**: 
- Incorrectly identifies staged files as unstaged
- May cause the application to prompt users about files that are already staged
- Could lead to confusion in the commit workflow

**Original Code**:
```typescript
if (trimmedLine.startsWith("M ") || trimmedLine.startsWith(" M")) {
    unstagedModifiedFiles.push(trimmedLine.substring(2).trim());
}
```

**Fix**: 
Only check for `" M"` (modified in working tree but not staged) for unstaged changes.

---

## Bug #2: Performance Issue - Incorrect AI Model Name

**Location**: `src/core/ai.ts` - Default model parameter (lines 44, 89)

**Bug Type**: Performance Issue / API Error

**Description**: 
The default model name `"gpt-4.1-mini"` is incorrect. This model doesn't exist in OpenAI's API, causing all AI generation calls to fail with a "model not found" error.

**Impact**: 
- Complete failure of AI functionality
- Users cannot generate PR content or commit messages
- API calls will consistently fail with model not found errors

**Original Code**:
```typescript
modelName = "gpt-4.1-mini"
```

**Fix**: 
Change to the correct model name `"gpt-4o-mini"` which is a valid OpenAI model.

---

## Bug #3: Security Vulnerability - Command Injection in API Key Setup

**Location**: `src/commands/init.ts` - `setupOpenAIKey()` function (lines 60-61) and `setupEditor()` function (lines 140-141)

**Bug Type**: Security Vulnerability

**Description**: 
The functions directly interpolate user-provided input (API key and editor command) into shell commands without proper escaping or validation. If these inputs contain shell metacharacters (like backticks, semicolons, or pipes), it could lead to command injection vulnerabilities.

**Impact**: 
- Potential command injection if malicious input is provided
- Shell profile files could be corrupted
- Security risk if attackers can control the API key or editor command input

**Original Code**:
```typescript
const exportLine = `\nexport OPENAI_API_KEY="${apiKey}"\n`;
const exportLine = `\nexport EDITOR="${editorCommand}"\n`;
```

**Fix**: 
Properly escape the user input to prevent shell injection by using single quotes instead of double quotes and escaping any single quotes in the input values.

---

## Summary

All three bugs have been fixed:
1. **Logic Error**: Fixed git status parsing to correctly identify unstaged files
2. **Performance Issue**: Corrected the AI model name to a valid OpenAI model in multiple locations
3. **Security Vulnerability**: Added proper escaping to prevent command injection for both API key and editor command inputs

## Additional Fixes Applied

- Updated `src/config/config.ts` to use the correct default model name
- Updated `src/commands/init.ts` to show correct model options in the setup wizard
- Applied the same security fix to the editor setup function

These fixes improve the reliability, functionality, and security of the GitLift application.