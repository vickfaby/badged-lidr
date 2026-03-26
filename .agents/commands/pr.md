---
description: Commit changes and create pull requests following project conventions
allowed-tools: Read, Grep, Glob, Bash(git:*, gh:*, npm:*, curl:*), AskUserQuestion
argument-hint: --commit | --check | --create | --status
---

# PR & Commit Workflow

Unified workflow: format commits → validate → create PR.

## Commit Conventions

**Format** (enforced by commitlint via husky hook):

```
<type>(<scope>): <subject>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

**Common scopes:** `auth`, `dashboard`, `assessment`, `analytics`, `i18n`, `db`, `api`, `components`, `testing`

**Subject rules:**
- Imperative mood ("add" not "added")
- Under 72 characters, no trailing period
- Specific: "add department filter" > "add filter"

**Body** (for non-trivial changes): explain WHY with bullet points.

**Footer:** `BREAKING CHANGE: description`, `Closes #123`, `Co-Authored-By: ...`

## Steps

### Mode: `/pr --commit`

1. Run `git status` and `git diff --staged` to review changes
2. Draft a commit message following conventions above
3. Ask user to confirm or adjust the message
4. Create the commit

### Mode: `/pr --check`

Validate PR readiness before creating:

1. Verify branch is not main/master
2. Check for uncommitted changes
3. Verify branch is pushed to remote
4. Validate commit messages follow conventional format
5. Check for merge conflicts with base branch
6. Report pass/fail for each check

### Mode: `/pr --create`

1. Run all `--check` validations first
2. Analyze commits since branch diverged from base (`git log origin/main..HEAD`)
3. Generate PR description:
   - **Summary**: from commit messages
   - **Changes**: bullet list from commit bodies
   - **Type**: detected from commit types (feat/fix/refactor/etc.)
   - **Breaking Changes**: auto-detected from `BREAKING CHANGE:` or `!` suffix
4. Create PR with `gh pr create`
5. Display PR URL

### Mode: `/pr --status`

1. Run `gh pr view` for current branch
2. Show: review status, CI checks, merge conflicts
3. Suggest next actions

## PR Description Template

```markdown
## Summary
[Auto-generated from commits]

## Changes
- [Extracted from commit bodies]

## Testing
- [ ] Tests passing locally
- [ ] Tested with different user roles

## Breaking Changes
[Auto-detected or "No breaking changes"]

## Checklist
- [ ] Commits follow conventional format
- [ ] Documentation updated if needed
- [ ] Ready for review
```

## Quick Reference

| Command | When to Use |
|---------|-------------|
| `/pr --commit` | Ready to commit changes |
| `/pr --check` | Before creating PR |
| `/pr --create` | All checks pass, ready for PR |
| `/pr --status` | Check PR review/CI status |

**Requires:** GitHub CLI (`gh`) installed and authenticated.
