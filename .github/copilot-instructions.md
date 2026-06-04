# GitHub Copilot Commit Message Instructions

When generating commit messages, follow these rules strictly:

## Format Requirements
- **Language**: English only
- **Mood**: Use imperative mood (e.g., "Add", "Fix", "Update", "Remove", not "Added", "Fixed")
- **Subject line**: Keep under 50 characters
- **Structure**: Separate subject from body with a blank line
- **Body**: Wrap lines at 72 characters

## Commit Message Structure
```
<type>(<scope>): <subject>

<body>

<footer>
```

## Allowed Types
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, missing semicolons, etc.)
- `refactor` - Code refactoring (no functional/behavioral changes)
- `test` - Adding tests or fixing tests
- `chore` - Build/tooling changes (no source code changes)
- `perf` - Performance improvements
- `ci` - CI/CD configuration changes
- `revert` - Reverting a previous commit

## Rules
1. Always start with a type prefix (feat, fix, docs, etc.)
2. Use lowercase for type
3. Scope is optional but recommended when changes are localized
4. Subject must be concise and descriptive
5. Capitalize the first letter of subject
6. Do NOT end subject with a period
7. Focus on WHAT changed, not HOW
8. Keep body explanatory when needed, bullet points preferred

## Good Examples
```
feat(auth): add JWT token authentication
```

```
fix(api): resolve null pointer exception in user service

- Add null check before accessing user object
- Improve error handling in login flow
```

```
docs(readme): update installation instructions

- Add prerequisites section
- Include Docker installation guide
```

```
refactor(utils): simplify string processing logic

- Remove redundant helper functions
- Improve code readability
- Reduce cyclomatic complexity
```

## Bad Examples (DO NOT generate these)
- ❌ "fixed the thing" - Too vague, no type prefix, not imperative
- ❌ "I added a new feature" - Uses first person, not imperative
- ❌ "Bug fix for login page" - Missing type prefix
- ❌ "update dependencies and fix some bugs" - Mixes unrelated changes
- ❌ "feat: add new feature." - Subject ends with period
- ❌ "Feat: Add something" - Type must be lowercase
