# 📝 CONVENTIONAL COMMITS GUIDE

## Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

---

## Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(comments): add comment creation` |
| `fix` | Bug fix | `fix(post): fix slug generation` |
| `docs` | Documentation | `docs: update README` |
| `style` | Code style (no logic changes) | `style(profile): format component` |
| `refactor` | Code refactoring | `refactor(auth): simplify auth logic` |
| `test` | Add tests | `test(comments): add comment tests` |
| `chore` | Build, deps, etc | `chore: update dependencies` |
| `perf` | Performance improvement | `perf(db): add index on posts` |
| `ci` | CI/CD changes | `ci: setup GitHub Actions` |

---

## Scopes

Scopes should be relevant to the change:

```
Common Scopes:
- auth          (Authentication)
- posts         (Post CRUD)
- comments      (Comment system)
- categories    (Category system)
- profile       (User profile)
- ui            (UI components)
- db            (Database)
- api           (Server actions)
- types         (TypeScript types)
- validation    (Input validation)
- rls           (Row Level Security)
- middleware    (Express/Next middleware)
- config        (Configuration files)
```

---

## Examples

### Feature Commits

```bash
git commit -m "feat(comments): add comment system with RLS policies"

git commit -m "feat(categories): implement category filtering on homepage"

git commit -m "feat(ui): integrate shadcn/ui components"

git commit -m "feat(auth): add email verification"
```

### Fix Commits

```bash
git commit -m "fix(posts): prevent duplicate slug creation"

git commit -m "fix(comments): fix RLS policy for deleted users"

git commit -m "fix(ui): correct responsive layout on mobile"
```

### Docs Commits

```bash
git commit -m "docs: add implementation guide for comment system"

git commit -m "docs(rls): document security model"

git commit -m "docs(api): add server actions documentation"
```

### Chore Commits

```bash
git commit -m "chore: install zod and validation libraries"

git commit -m "chore: setup database migrations structure"

git commit -m "chore: upgrade Next.js to latest"
```

### Refactor Commits

```bash
git commit -m "refactor(types): extract database types to separate file"

git commit -m "refactor(validation): consolidate schema definitions"

git commit -m "refactor(components): extract comment form logic"
```

---

## Commit Message Template

```
feat(scope): short summary under 50 characters

More detailed explanation of what changed and why.
Wrap at 72 characters for readability.

Multiple paragraphs are supported. Explain:
- What was changed
- Why it was changed
- Any side effects or breaking changes

Related issues/PRs:
- Closes #123
- Related to #456
```

---

## Breaking Changes

If your commit contains a breaking change, add:

```bash
git commit -m "feat!: breaking change description

BREAKING CHANGE: description of what broke and migration path"
```

Example:
```
feat(auth)!: change authentication API

BREAKING CHANGE: Auth context now requires Provider wrapper.
Migrate by wrapping your app with <AuthProvider>.
```

---

## Multi-line Commit Example

```bash
git commit -m "feat(comments): implement full comment CRUD system

- Add comment creation with RLS policies
- Implement comment deletion for own comments only
- Add comment pagination (10 per page)
- Create comment UI components with validation
- Add comment section to post detail page

The comment system now allows authenticated users to:
1. Create comments on published posts
2. Edit their own comments
3. Delete their own comments
4. View all comments on public posts

Commits in this feature:
- Database: 003_comments.sql migration
- Backend: createComment, updateComment, deleteComment actions
- Frontend: CommentsSection, CommentForm components

Related issues:
- Closes #42 (Comment system)
- Related to #38 (Post detail page)"
```

---

## Tips for Good Commits

✅ **DO**:
- Keep commits atomic (one logical change per commit)
- Write clear, descriptive messages
- Use imperative mood: "add feature" not "added feature"
- Explain WHY, not just WHAT
- Reference issues when relevant
- Keep subject line under 50 characters
- Use scopes consistently

❌ **DON'T**:
- Mix multiple features in one commit
- Write vague messages like "fix stuff" or "update"
- Use all caps
- End subject line with period
- Commit commented-out code
- Commit without testing first

---

## Git Workflow Example

### Feature Branch

```bash
# Start new feature
git checkout -b feat/comment-system

# Make changes, commit regularly
git commit -m "feat(comments): create comment table and RLS policies"
git commit -m "feat(comments): add comment server actions"
git commit -m "feat(comments): create comment UI components"

# Push and create PR
git push origin feat/comment-system
```

### PR Workflow

```bash
# PR Title (following conventional commits)
feat(comments): implement comment system

# PR Description
## Changes
- Added comment CRUD operations
- Implemented RLS policies
- Created comment components
- Added comment section to post detail

## Related Issues
Closes #42

## Testing
- [x] Comment creation works
- [x] RLS policies verified
- [x] Comment deletion works
- [x] Mobile responsive
```

---

## Automated Commit Helpers

### Using husky + commitlint

```bash
# Install
npm install husky commitlint -D
npx husky install
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'

# Now your commits will be validated automatically!
```

### Configure commitlint

**commitlint.config.js**:
```js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'perf', 'ci']
    ],
    'subject-case': [2, 'never', ['start-case', 'pascal-case', 'upper-case']],
    'subject-full-stop': [2, 'never', '.'],
    'subject-empty': [2, 'never'],
    'type-case': [2, 'always', 'lowercase'],
    'type-empty': [2, 'never'],
  },
}
```

---

## Status Updates During Development

As you implement features, use commit messages to document progress:

```bash
# Start of implementation phase
git commit -m "feat(comments): setup database schema and migrations"

# During development
git commit -m "feat(comments): create server actions for CRUD"
git commit -m "feat(comments): build React components"
git commit -m "test(comments): add validation tests"

# Bug fixes during implementation
git commit -m "fix(comments): handle edge case in deletion"

# Documentation
git commit -m "docs(comments): add implementation guide"

# Final refinements
git commit -m "perf(comments): add database index for faster queries"
git commit -m "style(comments): format code and improve accessibility"
```

---

## PR/Commit History for This Project

Expected commits for implementation:

```
Week 1:
├─ feat(db): create initial schema migrations
├─ feat(categories): add categories table and associations
├─ feat(comments): add comments table with RLS
├─ feat(types): expand database types and add validation schemas
└─ test(db): verify RLS policies

Week 2:
├─ feat(comments): implement comment server actions
├─ feat(comments): create comment UI components
├─ feat(categories): implement category system
├─ feat(ui): integrate shadcn/ui components
└─ refactor(forms): use react-hook-form for validation

Week 3:
├─ feat(error-handling): add error boundaries and logging
├─ feat(ui): add loading skeletons and empty states
├─ feat(ui): implement toast notifications
├─ test(e2e): add integration tests
└─ perf(db): add query optimization indexes

Week 4:
├─ feat(seo): add meta tags and structured data
├─ feat(search): implement full-text search
├─ feat(docker): add Dockerfile and docker-compose
├─ ci: setup GitHub Actions pipeline
└─ docs: update documentation and README
```

---

**Remember**: Good commits make your codebase history readable and maintainable! 🎯
