---
description: Create a new release with changelog generation
allowed-tools: Read, Bash(npm:*, git:*, grep:*, test:*, jq:*, npx:*), AskUserQuestion, Skill(changelog-generator)
model: sonnet
---

# Release

Create a new versioned release: validate state, preview changelog, bump version, and push.

## Steps

### 1. Pre-flight checks

Run these checks **in order** before proceeding:

**a) Git state**

- Verify you are on the `main` branch
- Verify working directory is clean (no uncommitted changes)
- Show the last 10 commit subjects since the last git tag (or all if no tags exist)

If any git check fails, stop and inform the user.

**b) Release tooling detection**

Check whether the automated release stack is configured:

1. Check if `package.json` exists at the project root:
   - Run `test -f package.json && echo "EXISTS" || echo "MISSING"`
2. Check if `release-it` is installed:
   - Run `npx release-it --version 2>/dev/null && echo "INSTALLED" || echo "MISSING"`
3. Check if the required npm scripts exist in `package.json`:
   - Run `grep -c "release" package.json 2>/dev/null || echo "0"`

**If tooling is NOT configured** (any check above fails), do NOT proceed with the automated flow.
Instead, present the user with two options using AskUserQuestion:

---

**Release tooling not detected.**

The automated release flow requires `release-it` and npm scripts configured at the project root.

Choose how to proceed:

**A) Set up automated releases now (recommended)**
I'll configure `release-it` in the project root with conventional changelog support.
This is a one-time setup — future releases will be fully automated.

**B) Generate changelog manually with AI (no setup required)**
I'll use the `changelog-generator` skill to analyze your git commits and produce
a human-friendly changelog. You manage versioning and tagging manually.

## **C) Cancel**

- If user chooses **A**: Run the setup block below, then restart from Step 1.
- If user chooses **B**: Switch to the **Manual Fallback Flow** at the bottom of this file.
- If user chooses **C**: Stop and inform the user.

**Setup block (Option A):**

1. Create `package.json` at project root if missing:

```json
{
  "name": "lti-release",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "release": "release-it",
    "release:dry": "release-it --dry-run",
    "release:patch": "release-it patch",
    "release:minor": "release-it minor",
    "release:major": "release-it major"
  }
}
```

2. Install dependencies:

```bash
npm install --save-dev release-it @release-it/conventional-changelog
```

3. Create `.release-it.json` at project root:

```json
{
  "git": {
    "commitMessage": "chore: release v${version}",
    "tagName": "v${version}"
  },
  "github": { "release": false },
  "plugins": {
    "@release-it/conventional-changelog": {
      "preset": "conventionalcommits",
      "infile": "CHANGELOG.md"
    }
  }
}
```

4. Inform the user setup is complete and restart from Step 1.

---

### 2. Dry run

Run `npm run release:dry` and show the output to the user. This previews:

- The next version number (auto-detected from commit types)
- The changelog entries that will be generated

### 3. Confirm with user

Ask the user to confirm using AskUserQuestion:

- Show the proposed version bump
- Offer options: "Auto (recommended)", "Force patch", "Force minor", "Force major", "Cancel"

### 4. Execute release

Based on user choice, run the appropriate command:

- Auto: `npm run release`
- Patch: `npm run release:patch`
- Minor: `npm run release:minor`
- Major: `npm run release:major`
- Cancel: Stop and inform the user

### 5. Push

Ask the user if they want to push now:

- Yes: Run `git push --follow-tags origin main`
- No: Remind them to run `git push --follow-tags origin main` later

### 6. Summary

Show a summary:

- Previous version -> New version
- Number of changelog entries added
- Git tag created
- Push status

---

## Manual Fallback Flow (changelog-generator)

> Used when the user chooses Option B or when automated tooling is not available.

### F1. Collect context

- Show current version (from any `package.json` found, or ask the user)
- Show all commits since the last git tag: `git log $(git describe --tags --abbrev=0 2>/dev/null)..HEAD --oneline 2>/dev/null || git log --oneline`

### F2. Generate changelog with AI

Use the `changelog-generator` skill to:

1. Analyze the commits shown in F1
2. Categorize them (features, improvements, fixes, breaking changes)
3. Write user-friendly changelog entries in Markdown

### F3. Ask version bump

Ask the user using AskUserQuestion:

- Show the AI-generated changelog entries
- Ask: "What version should this release be?" (suggest based on commit types: feat → minor, fix → patch, breaking → major)

### F4. Manual versioning

1. Update `version` in the relevant `package.json` (backend or frontend, as applicable)
2. Append the changelog block to `CHANGELOG.md` (create it if missing)
3. Create a git commit: `chore: release v{version}`
4. Create a git tag: `git tag v{version}`

### F5. Push

Ask the user if they want to push now:

- Yes: Run `git push --follow-tags origin main`
- No: Remind them to run `git push --follow-tags origin main` later

### F6. Summary

Show a summary:

- Version tagged
- Changelog entries added
- Files modified
- Push status
