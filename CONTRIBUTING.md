# Contributing to NexusCRM

Thank you for your interest in contributing to NexusCRM! This document provides guidelines and instructions for contributing.

## Code of Conduct

We are committed to providing a welcoming and inspiring community. Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

### Fork & Clone

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/your-username/nexuscrm.git
cd nexuscrm

# Add upstream remote
git remote add upstream https://github.com/original-owner/nexuscrm.git
```

### Setup Development Environment

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Initialize database
npm run db:push
npm run db:seed

# Start development server
npm run dev
```

### Verify Setup

```bash
# Run tests
npm test

# Run linter
npm run lint

# Run type check
npm run typecheck
```

All should pass before contributing.

## Development Workflow

### Create a Feature Branch

```bash
# Update main branch
git fetch upstream
git rebase upstream/main

# Create feature branch
git checkout -b feature/your-feature-name
```

### Branch Naming Conventions

- `feature/` – New feature
- `fix/` – Bug fix
- `docs/` – Documentation
- `refactor/` – Code refactoring
- `test/` – Test additions
- `perf/` – Performance improvement

Examples:
- `feature/campaign-analytics`
- `fix/contact-import-encoding`
- `docs/api-endpoints`

### Make Changes

1. Create or edit files
2. Follow code style (see below)
3. Add/update tests
4. Update documentation

### Code Style

#### TypeScript

```typescript
// ✅ Good
export async function getContactById(id: string): Promise<Contact | null> {
  const contact = await prisma.contact.findUnique({
    where: { id },
  });
  return contact;
}

// ❌ Avoid
async function getContactById(id) {
  return await prisma.contact.findUnique({ where: { id } });
}
```

#### Components

```typescript
// ✅ Good
export function ContactCard({ contact }: { contact: Contact }) {
  return (
    <div className="space-y-2">
      <h3 className="font-medium">{contact.firstName}</h3>
      <p className="text-sm text-muted-foreground">{contact.email}</p>
    </div>
  );
}

// ❌ Avoid
const ContactCard = (props) => (
  <div>
    <h3>{props.contact.firstName}</h3>
    <p>{props.contact.email}</p>
  </div>
);
```

#### Naming Conventions

- Components: `PascalCase` (e.g., `ContactForm`)
- Files: kebab-case (e.g., `contact-form.tsx`)
- Functions/variables: camelCase (e.g., `getContactById`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_PAGE_SIZE`)
- Types: PascalCase (e.g., `ContactInput`)

### Testing

#### Write Tests

```typescript
// src/lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency } from './utils';

describe('formatCurrency', () => {
  it('formats number as USD currency', () => {
    expect(formatCurrency(1000)).toBe('$1,000');
    expect(formatCurrency(1000.5)).toBe('$1,001');
  });

  it('handles zero and negative numbers', () => {
    expect(formatCurrency(0)).toBe('$0');
    expect(formatCurrency(-500)).toBe('-$500');
  });
});
```

#### Run Tests

```bash
# Run all tests
npm test

# Run specific test
npm test src/lib/utils.test.ts

# Watch mode
npm run test:watch

# Generate coverage
npm test -- --coverage
```

**Test Coverage Target:** 80%+

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat` – New feature
- `fix` – Bug fix
- `docs` – Documentation
- `style` – Code style (no functional change)
- `refactor` – Code refactoring
- `perf` – Performance improvement
- `test` – Test additions/updates
- `chore` – Tooling, dependencies

**Examples:**

```
feat(campaigns): add email scheduling

Allow campaigns to be scheduled for future delivery.
Users can select date/time when creating campaigns.

Fixes #123
```

```
fix(contacts): resolve import encoding issue

Handle UTF-8 encoding correctly when importing CSV files.
Previously broke on non-ASCII characters.
```

### Push & Create Pull Request

```bash
# Commit changes
git add .
git commit -m "feat(feature): description"

# Push to your fork
git push origin feature/your-feature-name
```

Create a Pull Request on GitHub:

1. Go to https://github.com/original-owner/nexuscrm/pulls
2. Click "New Pull Request"
3. Select your branch
4. Fill in PR template
5. Submit!

### PR Template

```markdown
## Description
Brief description of changes

## Related Issues
Fixes #123

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- List specific changes
- With bullet points

## Testing
- [ ] Added tests
- [ ] All tests pass
- [ ] No new warnings

## Screenshots
(if applicable)

## Checklist
- [ ] Code follows style guide
- [ ] Self-review completed
- [ ] Comments added
- [ ] Documentation updated
- [ ] No console errors
```

## Code Review Process

### What to Expect

1. **Automated Checks**
   - TypeScript type check
   - ESLint linting
   - Test suite
   - Build verification

2. **Manual Review**
   - Code quality
   - Performance impact
   - Documentation clarity
   - Testing coverage

3. **Merge**
   - Maintainer approves
   - All checks pass
   - Squash and merge

### Review Feedback

- Be open to feedback
- Respond to comments
- Make requested changes
- Push new commits (don't force-push)
- Request re-review

### Becoming a Reviewer

After contributing successfully:
1. Demonstrate knowledge of codebase
2. Show consistent code quality
3. Actively review others' PRs
4. Get added to reviewers by maintainers

## Architecture & Design

### Project Structure

```
src/
├── app/           # Next.js pages & API routes
├── components/    # React components
├── hooks/         # Custom hooks
└── lib/          # Utilities & business logic

Organizational principle:
- Pages: UI structure and routing
- Components: Reusable UI elements
- Lib: Pure functions, validation, business logic
```

### Adding Features

**Example: New CRM Module (e.g., Accounts)**

1. **Database Schema** (`prisma/schema.prisma`)
   ```prisma
   model Account {
     id String @id @default(cuid())
     name String
     // fields...
   }
   ```

2. **API Routes** (`src/app/api/accounts/`)
   ```typescript
   // route.ts: GET list, POST create
   // [id]/route.ts: GET detail, PATCH update, DELETE
   ```

3. **Validation** (`src/lib/validations.ts`)
   ```typescript
   export const accountSchema = z.object({
     name: z.string().min(1),
     // fields...
   });
   ```

4. **Components** (`src/app/(app)/accounts/`)
   ```typescript
   // account-dialog.tsx: Form
   // accounts-client.tsx: List with actions
   // page.tsx: Page layout
   ```

5. **Tests** (`src/app/api/accounts/`)
   ```typescript
   // account.test.ts: API tests
   ```

### Performance Considerations

- Use React.memo for expensive components
- Implement pagination for large lists
- Add database indexes for frequently queried fields
- Cache API responses with React Query
- Lazy-load heavy components

### Security Best Practices

- Validate input on client AND server
- Use Zod for runtime validation
- Never expose secrets in logs
- Sanitize user input
- Use CSRF protection (NextAuth provides this)
- Rate limit API endpoints
- Use HTTPS in production

## Documentation

### Update Documentation

- Update README.md for user-facing changes
- Add comments for complex logic
- Document new environment variables
- Update API docs for endpoint changes

### Document Structure

```markdown
# Title

## Overview
Brief explanation

## Usage
Code examples

## API
Parameters, returns, errors

## Related
Links to related docs
```

### API Documentation

```typescript
/**
 * Fetches a contact by ID
 * @param id - Contact ID (CUID)
 * @returns Contact object or null if not found
 * @throws Error if database query fails
 * @example
 * const contact = await getContact('cuid123');
 */
export async function getContact(id: string): Promise<Contact | null> {
  // implementation
}
```

## Reporting Bugs

### Create a Bug Report

1. Go to [GitHub Issues](https://github.com/original-owner/nexuscrm/issues)
2. Click "New Issue"
3. Select "Bug Report"
4. Fill in template

### Bug Report Template

```markdown
## Describe the bug
Clear description of what the bug is

## To Reproduce
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

## Expected behavior
What should happen

## Actual behavior
What actually happened

## Environment
- OS: [Windows/Mac/Linux]
- Browser: [Chrome/Firefox/Safari]
- Version: [1.0.0]

## Logs
Any error messages or logs

## Screenshots
If applicable
```

## Feature Requests

### Create a Feature Request

1. Go to [GitHub Issues](https://github.com/original-owner/nexuscrm/issues)
2. Click "New Issue"
3. Select "Feature Request"
4. Fill in template

### Feature Request Template

```markdown
## Description
What you want to build

## Problem it solves
Why this feature is needed

## Proposed solution
How you'd implement it

## Alternatives considered
Other approaches

## Additional context
Any other relevant info
```

## Community

- **Discussions**: GitHub Discussions
- **Issues**: Bug reports and feature requests
- **Slack**: (if available)
- **Email**: contact@nexuscrm.com

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

- Check existing issues/discussions
- Review documentation
- Ask in GitHub Discussions
- Open an issue with "question" label

---

Thank you for contributing! 🎉
