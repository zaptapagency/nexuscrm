# NexusCRM — Enterprise-Grade CRM Platform

> A production-ready HubSpot alternative built with Next.js 14, Prisma, TailwindCSS, and PostgreSQL.

[![Next.js](https://img.shields.io/badge/Next.js-14.2.15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-336791?logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](#license)

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Development](#development)
- [Production Build](#production-build)
- [Railway Deployment](#railway-deployment)
- [Authentication](#authentication)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)

## Features

### Core CRM Modules
- **Contacts Management** – Create, update, delete, import/export contacts with lifecycle tracking
- **Companies** – Organize contacts by company with industry/size classification
- **Deals** – Pipeline management with Kanban board, drag-drop stage moves, closed-won/lost tracking
- **Tasks** – Task assignment, due dates, priority levels, completion tracking
- **Tickets** – Support ticket system with status workflow and priority levels

### Marketing Automation
- **Campaigns** – Email campaign composer targeting specific segments
- **Segments** – Dynamic contact filter builder with live preview
- **Forms** – Drag-drop form builder with public submission endpoints
- **Outbox** – View delivered campaign emails with full message preview

### Analytics & Intelligence
- **Dashboard** – Real-time stats (pipeline value, win rate, contact growth)
- **Charts** – Pipeline by stage (bar), won vs lost (line), contacts (bar), tickets (pie)
- **Activity Log** – Audit trail of all CRM events
- **Rep Leaderboard** – Top sellers by closed-won value

### Enterprise Features
- **RBAC** – Role-based access control (ADMIN, MANAGER, REP)
- **Email Tracking** – Open pixel + click redirect for campaign analytics
- **Contact Upsert** – Form submissions auto-create/update contacts
- **Optimistic UI** – Instant feedback with rollback on error
- **Multi-language Ready** – i18n infrastructure in place

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript 5.6 |
| **Database** | PostgreSQL + Prisma ORM |
| **Authentication** | NextAuth.js 4.24 |
| **Frontend** | React 18 + Tailwind CSS |
| **UI Components** | shadcn/ui (Radix UI) |
| **Charts** | Recharts |
| **Validation** | Zod |
| **Testing** | Vitest + Playwright |
| **Deployment** | Railway.app |

## Prerequisites

- **Node.js** – v18.17+ (recommended: v20 LTS)
- **npm** – v10+ or yarn/pnpm
- **PostgreSQL** – v12+ (for production; SQLite works for local dev)
- **Git** – for version control

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/nexuscrm.git
cd nexuscrm
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
# Database (local SQLite for dev, PostgreSQL for production)
DATABASE_URL="file:./dev.db"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# Node Environment
NODE_ENV="development"
```

### 4. Initialize Database

```bash
npm run db:push    # Apply schema
npm run db:seed    # Load demo data
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Credentials

```
Email:    admin@nexuscrm.test
Password: Admin123!
Role:     ADMIN

Email:    manager@nexuscrm.test
Password: Password123!
Role:     MANAGER

Email:    rep@nexuscrm.test
Password: Password123!
Role:     REP
```

## Project Structure

```
nexuscrm/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (app)/              # Authenticated app routes
│   │   │   ├── dashboard/      # Main dashboard + charts
│   │   │   ├── contacts/       # Contact management
│   │   │   ├── companies/      # Company management
│   │   │   ├── deals/          # Deal pipeline (Kanban)
│   │   │   ├── tasks/          # Task management
│   │   │   ├── tickets/        # Support tickets (Kanban)
│   │   │   ├── campaigns/      # Email campaigns
│   │   │   ├── segments/       # Segment builder
│   │   │   ├── forms/          # Form builder
│   │   │   ├── outbox/         # Sent emails
│   │   │   ├── team/           # Team management (admin)
│   │   │   └── settings/       # User settings
│   │   ├── (auth)/             # Auth routes (public)
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (marketing)/        # Marketing site (future)
│   │   ├── api/                # API routes
│   │   │   ├── auth/           # NextAuth endpoints
│   │   │   ├── contacts/
│   │   │   ├── companies/
│   │   │   ├── deals/
│   │   │   ├── tasks/
│   │   │   ├── tickets/
│   │   │   ├── campaigns/
│   │   │   ├── segments/
│   │   │   ├── forms/
│   │   │   ├── track/          # Campaign tracking (opens/clicks)
│   │   │   └── ...other APIs
│   │   ├── f/                  # Public form pages
│   │   └── layout.tsx          # Root layout
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── app-shell/          # Navigation, sidebar
│   │   ├── empty-state.tsx
│   │   ├── page-header.tsx
│   │   └── ...others
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utilities & helpers
│   │   ├── api.ts              # API wrappers, auth helpers
│   │   ├── auth.ts             # NextAuth config
│   │   ├── constants.ts        # App constants (enums, labels)
│   │   ├── email.ts            # Email provider (LocalEmail)
│   │   ├── prisma.ts           # Prisma client
│   │   ├── rbac.ts             # Role-based access control
│   │   ├── validations.ts      # Zod schemas
│   │   ├── queries.ts          # Reusable DB queries
│   │   ├── segments.ts         # Contact filter DSL
│   │   ├── stats.ts            # Dashboard stat functions
│   │   └── utils.ts            # General utilities
│   └── globals.css             # Global styles
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Demo data seed
├── public/                     # Static assets
├── .env.example                # Environment template
├── .eslintrc.json              # ESLint configuration
├── .gitignore                  # Git ignore rules
├── tsconfig.json               # TypeScript config
├── tailwind.config.ts          # Tailwind CSS config
├── next.config.js              # Next.js config
├── railway.json                # Railway deployment config
├── package.json                # Dependencies
└── README.md                   # This file
```

## Environment Variables

### Required (All Environments)

```env
# Database URL
# Local dev: file:./dev.db (SQLite)
# Production: postgresql://user:password@host:port/dbname
DATABASE_URL="file:./dev.db"

# NextAuth Authentication
NEXTAUTH_SECRET="your-secret-key-here"  # Generate: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"    # http://localhost:3000 (dev), https://yourdomain.com (prod)

# Node Environment
NODE_ENV="development"                  # development or production
```

### Optional

```env
# Email Configuration (if using external SMTP)
# Currently uses LocalEmailProvider (writes to database)
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASSWORD=""
```

### Railway-Specific

When deploying on Railway, set these in the Railway dashboard:

```env
DATABASE_URL         # Automatically provided by Railway PostgreSQL plugin
NEXTAUTH_URL         # Set to your Railway public domain
NEXTAUTH_SECRET      # Generate and set securely
NODE_ENV             # Set to "production"
```

## Database

### Local Development (SQLite)

```bash
# Push schema to SQLite
npm run db:push

# Seed with demo data
npm run db:seed

# Reset database
npm run db:reset

# Generate Prisma client
npm run db:generate
```

### Production (PostgreSQL)

```bash
# Apply all migrations
npm run db:migrate

# Push schema (non-destructive)
npm run db:push

# Seed production database
npm run db:seed
```

### Database Schema Overview

**Core Models:**
- `User` – Team members with roles (ADMIN, MANAGER, REP)
- `Contact` – Individual leads/customers
- `Company` – Organizations
- `Deal` – Sales opportunities (pipeline)
- `Task` – Action items
- `Ticket` – Support requests

**Marketing Models:**
- `Campaign` – Email campaigns
- `CampaignRecipient` – Campaign delivery & tracking
- `Segment` – Contact filters
- `Form` – Lead capture forms
- `FormSubmission` – Form responses
- `OutboxEmail` – Sent email archive

**Activity & Metadata:**
- `Activity` – Audit log
- `Note` – Contact notes

## Development

### Available Scripts

```bash
# Development server (with hot reload)
npm run dev

# TypeScript type checking
npm run typecheck

# ESLint code linting
npm run lint

# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run end-to-end tests
npm run test:e2e

# Database commands
npm run db:generate  # Generate Prisma client
npm run db:push      # Apply schema
npm run db:migrate   # Interactive migration
npm run db:seed      # Seed demo data
npm run db:reset     # Full reset + seed
```

### Code Quality

This project enforces:
- **TypeScript** strict mode
- **ESLint** for code style
- **Prettier** for formatting (run automatically on save in most IDEs)
- **Zod** schemas for runtime validation
- **Vitest** for unit tests (46 tests included)

### Workflow

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and test: `npm run typecheck && npm test`
3. Format code: `npx prettier --write .`
4. Commit with clear message: `git commit -am "feat: your feature"`
5. Push and create a pull request

## Production Build

### Build for Production

```bash
npm run build
```

This will:
1. Generate Prisma client
2. Run TypeScript type checking
3. Build Next.js application
4. Optimize for production

### Start Production Server

```bash
npm run start
```

The server will start on `http://localhost:3000` (or the PORT environment variable).

### Performance Optimizations

- ✅ Next.js automatic code splitting
- ✅ Image optimization
- ✅ Database query optimization with Prisma
- ✅ Client-side caching with React Query
- ✅ Tailwind CSS purging
- ✅ Compression middleware
- ✅ Security headers

## Railway Deployment

### Prerequisites

- Railway.app account (free tier available)
- GitHub repository
- PostgreSQL database

### Automatic Deployment (Recommended)

1. **Push code to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect Railway to GitHub**
   - Go to [Railway Dashboard](https://railway.app/dashboard)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your `nexuscrm` repository
   - Authorize Railway to access GitHub

3. **Configure Environment**
   - Railway automatically detects `railway.json`
   - PostgreSQL plugin is auto-configured
   - Set these variables in Railway dashboard:
     ```
     NEXTAUTH_SECRET=<generate-with-openssl>
     NODE_ENV=production
     ```

4. **Database Initialization**
   - After first deploy, run migrations:
     ```bash
     railway run npm run db:push
     railway run npm run db:seed
     ```

5. **Access Your App**
   - Find public URL in Railway dashboard
   - Update `NEXTAUTH_URL` to your Railway domain
   - Visit your app and log in with demo credentials

### Manual Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway init

# Set environment variables
railway variables set DATABASE_URL=<your-postgres-url>
railway variables set NEXTAUTH_SECRET=<generated-secret>
railway variables set NEXTAUTH_URL=<your-domain>

# Deploy
railway up
```

### Troubleshooting Railway Deployment

**Build fails:**
- Check `railway logs` for errors
- Ensure all environment variables are set
- Verify `package.json` build script

**Database connection errors:**
- Confirm PostgreSQL plugin is active
- Check `DATABASE_URL` format
- Run `railway run npm run db:push` to initialize

**Page shows "Application Error":**
- Check logs: `railway logs`
- Restart deployment: `railway redeploy`
- Verify `NEXTAUTH_SECRET` is set

## Authentication

### NextAuth.js Configuration

NexusCRM uses **NextAuth.js** with credentials provider for authentication.

**Features:**
- Email + password login
- JWT-based sessions
- RBAC (Admin, Manager, Rep roles)
- Session timeout: 30 days
- Secure password hashing (bcryptjs)

**Protected Routes:**
- `/dashboard` and all sub-routes are authenticated
- `/api/*` endpoints require valid session (except public forms)
- Login redirects to `/dashboard`

**Demo Users:** See [Quick Start](#quick-start) section

### Extend Authentication

To add OAuth (Google, GitHub, etc.):

1. Edit `src/lib/auth.ts`
2. Add provider configuration
3. Set environment variables
4. Update `NEXTAUTH_URL` callback

## Testing

### Unit Tests

Run all tests:
```bash
npm test
```

Coverage:
- RBAC logic (9 tests)
- Validation schemas (13 tests)
- Segment filtering (7 tests)
- Stats calculations (8 tests)
- CSV import/export (9 tests)

**Total: 46 tests, all passing ✅**

### Run Specific Test

```bash
npm test src/lib/rbac.test.ts
```

### Watch Mode

```bash
npm run test:watch
```

### E2E Tests

```bash
npm run test:e2e
```

(Playwright tests in `e2e/` directory)

## API Documentation

### Authentication

All API endpoints (except public forms) require a valid NextAuth session.

**Headers:**
```
Cookie: next-auth.session-token=<token>
```

### Core Endpoints

#### Contacts

```
GET    /api/contacts?page=1&q=search        # List contacts
POST   /api/contacts                        # Create contact
GET    /api/contacts/[id]                   # Get contact
PATCH  /api/contacts/[id]                   # Update contact
DELETE /api/contacts/[id]                   # Delete contact
POST   /api/contacts/import                 # Bulk import
GET    /api/contacts/export                 # Bulk export
POST   /api/contacts/bulk-delete            # Bulk delete
```

#### Companies

```
GET    /api/companies                       # List companies
POST   /api/companies                       # Create company
GET    /api/companies/[id]                  # Get company
PATCH  /api/companies/[id]                  # Update company
DELETE /api/companies/[id]                  # Delete company
```

#### Deals

```
GET    /api/deals                           # List deals
POST   /api/deals                           # Create deal
GET    /api/deals/[id]                      # Get deal
PATCH  /api/deals/[id]                      # Update deal
DELETE /api/deals/[id]                      # Delete deal
POST   /api/deals/[id]/stage                # Move to stage
```

#### Campaigns

```
GET    /api/campaigns                       # List campaigns
POST   /api/campaigns                       # Create campaign
GET    /api/campaigns/[id]                  # Get campaign
PATCH  /api/campaigns/[id]                  # Update campaign
DELETE /api/campaigns/[id]                  # Delete campaign
POST   /api/campaigns/[id]/send             # Send campaign
```

#### Forms (Public)

```
GET    /api/forms/public/[slug]             # Get form definition (public)
POST   /api/forms/public/[slug]/submit      # Submit form (public)
```

### Response Format

**Success:**
```json
{
  "id": "cuid",
  "name": "Example",
  ...fields
}
```

**Error:**
```json
{
  "error": "Human-readable error message",
  "issues": {
    "fieldName": ["validation error"]
  }
}
```

**Status Codes:**
- `200` – OK
- `201` – Created
- `400` – Bad request
- `401` – Unauthorized
- `403` – Forbidden
- `404` – Not found
- `409` – Conflict (unique constraint)
- `422` – Validation failed
- `500` – Server error

## Troubleshooting

### "Module not found" errors

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma client
npm run db:generate
```

### Database connection refused

```bash
# Check DATABASE_URL
echo $DATABASE_URL

# For local dev, ensure SQLite file path is correct
# For PostgreSQL, verify credentials and host
```

### TypeScript errors

```bash
# Run type check
npm run typecheck

# Fix issues and rebuild
npm run build
```

### "NEXTAUTH_SECRET is not set"

```bash
# Generate secret
openssl rand -base64 32

# Add to .env
NEXTAUTH_SECRET="<generated-value>"
```

### Form submissions not showing up

1. Check Outbox page for emails
2. Verify form is published (`published: true`)
3. Check browser console for submission errors
4. Inspect `/api/forms/public/[slug]/submit` API response

### Campaign emails not tracked

1. Ensure `NEXTAUTH_URL` matches deployment URL
2. Check OutboxEmail table has records
3. Verify pixel/click URLs are accessible publicly
4. Check recipient table for `opened` and `clicked` flags

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make changes and test
4. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) file for details.

## Support

For issues, questions, or suggestions:
- Open a GitHub issue
- Check existing [FAQs](FAQS.md)
- Review [troubleshooting](#troubleshooting) section

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Charts from [Recharts](https://recharts.org/)
- Database with [Prisma](https://www.prisma.io/)
- Deployed on [Railway](https://railway.app/)

---

**NexusCRM** — Your open-source CRM alternative. 🚀
