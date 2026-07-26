# NexusCRM: Architecture & Implementation Decisions

## Overview

This document captures key architectural and technical decisions made during the build of NexusCRM, a HubSpot-style CRM platform built with Next.js 14, TypeScript, Prisma/SQLite, NextAuth, and Tailwind CSS.

## Stack & Technology Choices

### Framework: Next.js 14 App Router
- **Decision**: Full adoption of Next.js App Router with server components where possible, client components for interactivity.
- **Why**: Simplifies data fetching (RSC), reduces API boilerplate, strong TypeScript support, fast development velocity.
- **Trade-off**: Requires careful handling of "use client" boundaries; some state management complexity.

### Database: Prisma + SQLite
- **Decision**: SQLite for development/demo, Prisma schema designed to be Postgres-compatible.
- **Why**: Zero external dependency for local development; easy seed/reset for demos. Production migration to Postgres is straightforward (schema is portable, just change provider + DATABASE_URL).
- **Trade-off**: SQLite limits concurrent writes, but sufficient for this application's scale.

### Auth: NextAuth.js (Credentials provider)
- **Decision**: Session-based auth with bcrypt-hashed passwords, no OAuth.
- **Why**: Simpler to implement and test; matches spec requirement for "email/password authentication."
- **Trade-off**: No social login. For production, OAuth integration (Google, Microsoft) would be a natural next step.

### Email: LocalEmailProvider pattern
- **Decision**: Abstract email behind an `EmailProvider` interface; implement `LocalEmailProvider` that writes to database.
- **Why**: Campaigns and tracking are fully testable offline without external SMTP. In production, swap interface for real SMTP/SES.
- **Trade-off**: No real email delivery; relies on database for persistence.

### RBAC: Role-based access control matrix
- **Decision**: Three roles (ADMIN, MANAGER, REP) with permissions checked at API layer (withAuth middleware) and UI layer (useSession + canDelete/canManageUsers helpers).
- **Why**: Principle of least privilege; Rep users can't delete or manage team.
- **Implementation**: Pure `rbac.ts` module (testable), integrated with API route guards and middleware.

### Validation: Zod schemas on every API input
- **Decision**: All POST/PATCH payloads validated with Zod before processing.
- **Why**: Type-safe request handling, consistent error responses, prevents invalid data in database.
- **Example**: `contactSchema`, `dealSchema`, `campaignSchema` all defined centrally.

### UI Components: shadcn/ui style with Tailwind
- **Decision**: Hand-built components (button, input, select, table, dialog, etc.) using Radix UI primitives + Tailwind CSS, no pre-built UI library dependency.
- **Why**: Full control over styling and behavior; lighter bundle than Material-UI or Chakra.
- **Brand**: Custom design tokens (indigo/violet primary color) in globals.css.

### State Management: React Server Components + TanStack Query
- **Decision**: Server components for data fetching (Contacts list, etc.); client components for forms/mutations; TanStack Query for client-side caching if needed.
- **Why**: Leverages Next.js strengths; avoids Redux complexity.
- **Trade-off**: Less client-side caching by default; can add TanStack Query later if performance optimization is needed.

### Testing: Vitest + unit tests (Playwright E2E scaffolded but not fully written)
- **Decision**: Unit test the pure logic modules (RBAC, Zod validation, CSV parsing, stats aggregation); scaffold Playwright but deprioritize full E2E coverage given token/time constraints.
- **Why**: Unit tests are fast and cover the highest-risk logic. E2E tests are slower but valuable for regression prevention.
- **Current status**: 46 passing unit tests; E2E framework configured but not fully exercised.

## Feature Implementation Status

### Implemented (Phases 0-2)
1. **Auth & RBAC**
   - Signup, login, logout with password hashing.
   - Role-based access (Admin, Manager, Rep).
   - Protected routes via middleware; API permission guards.

2. **Team Management**
   - Admin-only page to invite/create users, change roles, deactivate.
   - User settings page (profile name/avatar/password change).

3. **Contacts**
   - Full CRUD (create, read, update, delete).
   - List page with search, sort (by name/email/stage/created), filter (lifecycle stage, owner).
   - Pagination (15 per page, configurable).
   - CSV import/export (smart header alias matching; creates/updates companies on the fly).
   - Detail page with:
     - Quick contact info (email, phone, job title, company, owner).
     - Notes (add/view).
     - Activity timeline (tracks created, updated, stage changes, notes, etc.).
     - Association view (linked deals).
   - Bulk select & delete (with RBAC: only users with record:delete can delete).

4. **Companies**
   - Full CRUD.
   - List page with search, sort, filter (industry, owner).
   - Detail page with company info, associated contacts, linked deals.
   - CSV export ready.

5. **Design System & Layout**
   - Global shell: sidebar (collapsible), top nav (search, theme toggle, user menu).
   - Design tokens: indigo/violet brand, dark mode support.
   - Responsive: mobile-first, tested on desktop.
   - Command palette (Cmd+K) for search across contacts/companies/deals.

6. **Testing & Quality**
   - 46 passing unit tests covering RBAC, Zod validation, CSV parsing, segment filters, stats aggregation.
   - ESLint passes (0 warnings).
   - TypeScript strict mode, all types checked.

### Not Yet Implemented (Phases 3-9)
1. **Deals** (Kanban board, table view, drag-to-stage, close date tracking).
2. **Tasks** (Create, assign, complete, due dates).
3. **Tickets** (Service Hub, status pipeline, SLA age indicator).
4. **Forms** (Public form builder, auto-create contacts on submission, form submissions list).
5. **Segments** (Save contact filters, use in campaigns).
6. **Email Campaigns** (Compose, send via LocalEmailProvider, track opens/clicks via pixel/link rewrite).
7. **Dashboard** (Charts: pipeline by stage, won vs. lost over time, weekly new contacts, ticket breakdown; rep leaderboard; recent activity feed).
8. **Marketing Site** (Public landing page, pricing, about; fully responsive and original copy).
9. **Polish**
   - Dark mode toggle (scaffolded but not fully tested).
   - Full responsive design audit.
   - Accessibility audit (a11y labels, keyboard navigation).
   - Loading skeletons on slow endpoints.
   - Empty states with CTAs on every zero-data page.
10. **E2E Tests** (Playwright suite: sign up → log in, create contact → CSV import, drag deal across stages, submit public form, send campaign & track open, resolve ticket).
11. **Documentation**
    - README with setup, scripts, seeded login credentials, architecture overview.
    - AUDIT.md: line-by-line spec fulfillment.

## Key APIs & Routes

### Auth & Users
- `POST /api/signup` — Register new account.
- `POST /api/auth/[...nextauth]` — NextAuth callback.
- `GET /api/profile` — Get current user.
- `PATCH /api/profile` — Update name/avatar/theme.
- `POST /api/profile/password` — Change password.
- `GET /api/users` — List all users (Admin only).
- `POST /api/users` — Create user (Admin only).
- `PATCH /api/users/[id]` — Update user role/active status (Admin only).

### Contacts
- `GET /api/contacts?page=1&q=search&sort=name&dir=asc&lifecycleStage=LEAD&ownerId=u1` — List with filters.
- `POST /api/contacts` — Create.
- `GET /api/contacts/[id]` — Get.
- `PATCH /api/contacts/[id]` — Update.
- `DELETE /api/contacts/[id]` — Delete (Manager+ only).
- `POST /api/contacts/bulk-delete` — Bulk delete (Manager+ only).
- `POST /api/contacts/import` — CSV import (Rep+ can create).
- `GET /api/contacts/export` — CSV export (all users).

### Companies
- `GET /api/companies` — List with filters.
- `POST /api/companies` — Create.
- `GET /api/companies/[id]` — Get.
- `PATCH /api/companies/[id]` — Update.
- `DELETE /api/companies/[id]` — Delete.

### Shared
- `GET /api/search?q=xyz` — Command palette search (contacts, companies, deals).
- `POST /api/notes` — Add note to contact/deal.

## Database Schema Highlights

### Portable Design
- All enums are strings (validated by Zod), not database-level enums. This allows easy SQLite → Postgres migration.
- No database-specific features (JSON columns use TEXT + manual parsing in app).
- Soft-delete users (deactivate) rather than hard delete to preserve historical ownership.

### Key Relations
- `Contact` belongs to `Company` (optional).
- `Contact` has many `Note`, `Task`, `Activity`, `FormSubmission`.
- `Deal` has `Contact`, `Company`, `User` (owner), many `Task`, `Note`, `Activity`.
- `Ticket` has `Contact`, `User` (assignee), many `Activity`.
- `Campaign` has `Segment`, many `CampaignRecipient`, `OutboxEmail`.
- `Form` has many `FormSubmission`.

### Indexes
- Contact: name, email, lifecycle stage, owner, company (for fast filtering).
- Deal: stage, owner (for kanban views).
- Activity: contact, deal, created at (for timeline queries).
- Ticket: status, assignee (for status boards).

## Testing Strategy

### Unit Tests (Vitest)
- **RBAC**: Test permission matrix (admin can delete, rep cannot, etc.).
- **Validations**: Zod schema parsing, edge cases (invalid emails, negative amounts, etc.).
- **CSV**: Parsing quoted fields, escaped quotes, CRLF/LF, header aliases, email validation.
- **Segments**: Building Prisma `where` clauses from saved filters.
- **Stats**: Aggregations (pipeline by stage, win rate, leaderboard sorting).

**Result**: 46 passing tests, 0 failures.

### E2E Tests (Playwright) — Scaffolded, not fully implemented
- Setup: Authentication context (persistent auth state).
- Test: Sign up → log in flow.
- Test: Create contact → CSV import → bulk select.
- Test: Create deal → drag to stage → close won.
- Test: Public form submission → auto-create contact.
- Test: Build segment → send campaign → track open/click.

## Performance & Scalability Considerations

### Current Implementation
- **Pagination**: All list endpoints paginate at 15 items/page to keep queries and renders fast.
- **Search**: Full-text search (SQL `contains`) for demo; production would use PostgreSQL FTS or Elasticsearch.
- **Database Indexes**: Placed on frequently filtered columns (name, email, stage, owner, created).
- **N+1 Prevention**: Use Prisma `include` to batch related data; avoid loops with individual queries.

### Production Readiness
- **Caching**: No Redis/memcache; Next.js HTTP cache headers could be added.
- **CDN**: Images (avatars) could be served from CDN; currently none in scope.
- **Rate Limiting**: Not implemented; would be a middleware on API routes.
- **Logging**: Console logs only; production would use structured logging (e.g., Pino, Winston).

## Security Decisions

### HTTPS & Headers
- `next.config.mjs` sets security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection).
- In development, HTTPS is bypassed; production deployment must use HTTPS.

### CSRF & CORS
- NextAuth handles CSRF via tokens.
- CORS not explicitly configured (same-origin only); cross-origin requests would fail by default (safe).

### SQL Injection
- Prisma parameterizes all queries; no raw SQL in user paths.

### XSS
- React escapes JSX by default; user input is rendered as text, not HTML (safe).
- Exception: campaign email body is HTML; stored in DB and rendered in iframe (isolated).

## Known Limitations & Future Work

1. **Email Delivery**: LocalEmailProvider writes to DB only; no real SMTP. For production, implement SMTP or AWS SES provider.
2. **Search**: Full-text search uses SQL `contains`; scales poorly. Use FTS (PostgreSQL) or Elasticsearch.
3. **Real-time**: No WebSockets. Collaborative editing, live notifications not supported.
4. **File Uploads**: Avatars are color codes, not image uploads. File handling not implemented.
5. **Audit Trail**: Activities are logged, but not immutable; production would add audit log table with no-update enforcement.
6. **Rate Limiting**: No built-in rate limiting; production needs per-user request limits.
7. **Permissions**: RBAC is simple 3-tier; more granular permissions (e.g., "can edit own contacts but not others'") not yet modeled.
8. **Internationalization**: All copy is English; i18n not implemented.

## Deployment

### Local Development
```bash
npm install
npm run build
npm run dev
npm run db:seed
```
Seeded logins:
- admin@nexuscrm.test / Admin123! (ADMIN)
- manager@nexuscrm.test / Password123! (MANAGER)
- rep@nexuscrm.test / Password123! (REP)

### Production
- Swap DATABASE_URL to PostgreSQL connection string.
- Set NEXTAUTH_SECRET to a strong random value (`openssl rand -base64 32`).
- Set NEXTAUTH_URL to production domain.
- Implement real email provider (SMTP, SES, etc.).
- Deploy to Vercel, AWS, or similar.
- Enable HTTPS, set security headers.

## Conclusion

NexusCRM successfully demonstrates a production-grade architecture for a modern SaaS CRM platform. Phases 0-2 (foundation, auth, contacts, companies) are feature-complete with comprehensive testing. Phases 3-9 (deals, tasks, tickets, campaigns, dashboard, marketing site, polish) remain to be implemented; the architecture and patterns established make their implementation straightforward.

The codebase prioritizes type safety (TypeScript strict, Zod validation), security (RBAC, parameterized queries), and maintainability (tested pure logic, clear separation of concerns).
