# NexusCRM - Detailed Issue List with Line Numbers

## CRITICAL ISSUES (Must Fix Before Production)

### ISSUE #1: Database Provider Mismatch - BLOCKER

**Severity**: CRITICAL
**Category**: Build/Deployment
**Files Affected**:
- `prisma/schema.prisma` (line 12)
- `.env` (line 1)
- `railway.json` (line 23)

**The Problem**:
```
prisma/schema.prisma:12
  datasource db {
    provider = "postgresql"  ← Configured for PostgreSQL
    url      = env("DATABASE_URL")
  }

.env:1
  DATABASE_URL="file:./dev.db"  ← SQLite format

railway.json:23-26
  "config": {
    "id": "postgresql"  ← Production expects Postgres
  }
```

**Why This Breaks**:
1. Prisma schema says "use PostgreSQL client"
2. DATABASE_URL provides SQLite file path
3. PostgreSQL client rejects SQLite URL format
4. Build fails during static page pre-rendering: "URL must start with postgresql:// or postgres://"
5. 192 error messages in build output

**Build Output Evidence**:
```
PrismaClientInitializationError:
Invalid `prisma.segment.findMany()` invocation:

error: Error validating datasource `db`: the URL must start with
the protocol `postgresql://` or `postgres://`.
```

**Impact on Production**:
- Deployment will fail to start
- Railway deployment times out
- Docker container crashes immediately
- All API routes fail with database connection error

**Recommended Fix**:
Choose ONE approach:

**Option A - Use PostgreSQL (Recommended for production)**:
1. Set up PostgreSQL server (local or cloud)
2. Update .env: `DATABASE_URL="postgresql://user:password@localhost:5432/nexuscrm"`
3. Run migrations: `npm run db:push`
4. Keep schema.prisma as is

**Option B - Use SQLite**:
1. Change schema.prisma line 12: `provider = "sqlite"`
2. Keep .env as is: `DATABASE_URL="file:./dev.db"`
3. But: SQLite not recommended for production (single-user, no concurrency)

---

### ISSUE #2: Seed Wipes All Production Data - BLOCKER

**Severity**: CRITICAL
**Category**: Database
**File**: `prisma/seed.ts`
**Lines**: 87-102

**The Problem**:
```typescript
// prisma/seed.ts:86-102
async function main() {
  console.log("Resetting data...");
  // Order matters for FK integrity.
  await prisma.formSubmission.deleteMany();  // Line 89
  await prisma.form.deleteMany();            // Line 90
  await prisma.campaignRecipient.deleteMany();  // Line 91
  await prisma.outboxEmail.deleteMany();     // Line 92
  await prisma.campaign.deleteMany();        // Line 93
  await prisma.segment.deleteMany();         // Line 94
  await prisma.activity.deleteMany();        // Line 95
  await prisma.note.deleteMany();            // Line 96
  await prisma.task.deleteMany();            // Line 97
  await prisma.ticket.deleteMany();          // Line 98
  await prisma.deal.deleteMany();            // Line 99
  await prisma.contact.deleteMany();         // Line 100
  await prisma.company.deleteMany();         // Line 101
  await prisma.user.deleteMany();            // Line 102
  // ... then creates new demo data
}
```

**Why This Is Critical**:

The Railway deployment process runs:
```json
// railway.json:6
"startCommand": "npm run db:push && npm run db:seed && npm run start"
```

This means:
1. Production deployment runs migrations
2. **Production deployment runs seed** ← Deletes ALL data
3. Production deployment starts server
4. All customer data gone

**When This Happens**:
- Every time you deploy to production
- Even if you just change a line of frontend code
- First deployment: Works (creates demo data)
- Second deployment: All customer records deleted
- Third deployment: All real data deleted

**Business Impact**:
- All customer relationships lost
- All deals and contacts erased
- All email campaign history gone
- Customer data completely destroyed

**Recommended Fix**:

Add conditional check to only seed if database is empty:

```typescript
// prisma/seed.ts:86-90
async function main() {
  // Check if database already has data
  const userCount = await prisma.user.count();

  if (userCount > 0) {
    console.log("Database already seeded. Skipping seed...");
    return;
  }

  console.log("Resetting data...");
  // ... rest of seed code
}
```

**Or create separate commands**:

```json
// package.json
{
  "scripts": {
    "db:seed": "tsx prisma/seed.ts",
    "db:reset": "prisma db push --force-reset && tsx prisma/seed.ts"
  }
}
```

Update railway.json:
```json
{
  "startCommand": "npm run db:push && npm run start"
}
```

---

### ISSUE #3: Hardcoded Test Secret in Version Control - SECURITY

**Severity**: CRITICAL
**Category**: Security
**File**: `.env`
**Line**: 2

**The Problem**:
```
.env:2
NEXTAUTH_SECRET="nexuscrm-dev-secret-please-change-in-production-0xA1B2C3D4E5F6"
```

**Security Issues**:
1. Secret is hardcoded in .env
2. .env file is typically committed to git
3. Anyone with repository access has the secret
4. Secret visible in git history forever
5. If repo is leaked, all sessions can be forged
6. Test secret used in production (weak entropy)

**How It's Exploited**:
1. Attacker clones repository (or finds it)
2. Reads .env file
3. Gets NEXTAUTH_SECRET value
4. Uses secret to forge JWT tokens
5. Creates fake sessions for any user (admin included)
6. Gains full access to system

**Current Status**:
- Secret is in version control
- Everyone with repo access has it
- Visible in git history
- Insufficient entropy (predictable)

**Recommended Fix**:

1. **Remove from .env immediately**:
   - Delete the .env file or generate new one without secret
   - Never commit .env file

2. **Add to .gitignore** (if not already):
   ```
   .env
   .env.local
   ```

3. **Generate proper secret**:
   ```bash
   openssl rand -base64 32
   # Output: something like: a7Xk9jQ2mP8vL3nR6sT4wY1zB5cD9fG2hJ7kM0eQ8rT5uV3
   ```

4. **Set in Railway only** (never in version control):
   - Go to Railway project settings
   - Environment variables
   - Add: `NEXTAUTH_SECRET` = (the generated value)

5. **Document in .env.example** (without actual secret):
   ```
   # Generate with: openssl rand -base64 32
   NEXTAUTH_SECRET="<generate-a-strong-secret-with-openssl>"
   ```

**Why Current Code Shows It**:
```typescript
// src/lib/auth.ts:66
export const authOptions: NextAuthOptions = {
  // ...
  secret: process.env.NEXTAUTH_SECRET,  // Reads from .env
};
```

This is correct pattern, but .env shouldn't be committed.

---

### ISSUE #4: Missing Environment Variable Validation

**Severity**: CRITICAL
**Category**: Runtime Safety
**Files**:
- `src/lib/auth.ts`
- `src/lib/prisma.ts`

**The Problem**:

If required environment variables are missing:
```
NEXTAUTH_SECRET = undefined
DATABASE_URL = undefined
NEXTAUTH_URL = undefined
```

The app doesn't fail on startup. It fails cryptically on first use:
- First request: "Cannot read property of undefined"
- Logs don't clearly say which env var is missing
- Production debugging is difficult

**Example Failure**:
1. Production deployment without NEXTAUTH_SECRET set
2. Server starts successfully
3. User clicks "Login"
4. Cryptic error: "500 Internal Server Error"
5. Logs show: "Cannot read property 'length' of undefined"
6. 30 minutes to figure out it's a missing env var

**Recommended Fix**:

Create `src/lib/env.ts`:
```typescript
export function validateEnvironment() {
  const required = ['NEXTAUTH_SECRET', 'DATABASE_URL', 'NEXTAUTH_URL'];

  for (const varName of required) {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
  }

  // Validate DATABASE_URL format
  const dbUrl = process.env.DATABASE_URL!;
  const isValid =
    dbUrl.includes('postgresql://') ||
    dbUrl.includes('postgres://') ||
    dbUrl.includes('sqlite:') ||
    dbUrl.startsWith('file:');

  if (!isValid) {
    throw new Error(
      `Invalid DATABASE_URL format. Must start with postgresql://, postgres://, sqlite:, or file:. Got: ${dbUrl}`
    );
  }
}
```

Then call in app startup (e.g., `src/app/layout.tsx`):
```typescript
if (typeof window === 'undefined') {
  validateEnvironment();
}
```

---

## HIGH SEVERITY ISSUES

### ISSUE #5: No Database Connection Resilience

**Severity**: HIGH
**Category**: Production Reliability
**File**: `src/lib/prisma.ts`
**Lines**: 7-11

**Current Code**:
```typescript
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
```

**Problems**:
1. No retry logic on connection failure
2. No timeout configuration
3. No connection pool settings
4. No error recovery
5. Single connection failure = app crash

**Real-World Scenario**:
1. Database server restarts for updates
2. Connection drops for 5 seconds
3. Prisma client has no retry logic
4. Request fails immediately
5. User sees "500 Internal Server Error"
6. Next request might work (if reconnected)
7. Poor user experience, lost transactions

**Recommended Fix**:

Add connection resilience settings:
```typescript
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    errorFormat: 'pretty',
  });

// Ensure connection on startup
if (process.env.NODE_ENV === 'production') {
  prisma.$connect().catch(err => {
    console.error('Failed to connect to database on startup:', err);
    process.exit(1);
  });
}
```

---

### ISSUE #6: Missing Content-Security-Policy Header

**Severity**: HIGH
**Category**: Security
**File**: `next.config.mjs`
**Lines**: 19-43

**Current Headers**:
```javascript
headers: [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
]
```

**Missing**:
- Content-Security-Policy (CSP) - **CRITICAL FOR XSS DEFENSE**
- Strict-Transport-Security (HSTS) - Enforces HTTPS
- Permissions-Policy - Restricts browser features

**Why CSP Matters**:
- Prevents inline scripts
- Limits external script sources
- Stops malicious injected code
- Industry standard for security

**Recommended Fix**:

Add to next.config.mjs around line 35:
```javascript
{
  key: 'Content-Security-Policy',
  value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'"
}
```

---

### ISSUE #7: Email HTML Not Sanitized

**Severity**: HIGH
**Category**: Security
**File**: `src/app/api/campaigns/[id]/send/route.ts`
**Line**: 47

**Current Code**:
```typescript
const body = instrumentEmailBody(campaign.body, campaign.id, recipient.id, baseUrl);
await emailProvider.send({
  // ...
  body,  // ← Raw HTML sent
  // ...
});
```

**Problem**:
- Campaign email bodies stored as raw HTML
- No sanitization verification in code
- If HTML content is user-controllable, could be XSS vector
- Email clients might render malicious scripts

**When This Is An Issue**:
- If campaign body is user-entered HTML
- If campaign body can be HTML from external source
- If email is rendered in web browser (not just email client)

**Recommended Fix**:

Install sanitization library:
```bash
npm install sanitize-html
```

Then sanitize:
```typescript
import sanitizeHtml from 'sanitize-html';

const body = instrumentEmailBody(
  sanitizeHtml(campaign.body),  // Sanitize first
  campaign.id,
  recipient.id,
  baseUrl
);
```

---

## MEDIUM SEVERITY ISSUES

### ISSUE #8: Using findUniqueOrThrow Without Defensive Checks

**Severity**: LOW (actually handled, but risky pattern)
**Category**: Code Quality
**Files**: 13 API route files
**Total Instances**: 13

**Files Affected**:
1. `src/app/api/campaigns/[id]/route.ts` lines 10, 12
2. `src/app/api/campaigns/[id]/send/route.ts` line 10
3. `src/app/api/contacts/[id]/route.ts` lines 7, 18
4. `src/app/api/deals/[id]/route.ts` lines 9, 11
5. `src/app/api/deals/[id]/stage/route.ts` line 11
6. `src/app/api/companies/[id]/route.ts` line 8
7. `src/app/api/forms/[id]/route.ts` line 8
8. `src/app/api/tasks/[id]/route.ts` line 8
9. `src/app/api/tickets/[id]/route.ts` line 8
10. `src/app/api/tickets/[id]/status/route.ts` line 8
11. And 3 more routes

**Example**:
```typescript
// campaigns/[id]/route.ts:10
const campaign = await prisma.campaign.findUniqueOrThrow({
  where: { id: params.id },
});
```

**Why This Is Risky**:
- `findUniqueOrThrow()` throws `PrismaClientKnownRequestError` if not found
- While `handleError()` catches it and returns 404, it's implicit
- Makes code harder to understand (why throw vs return null?)
- Cleaner pattern: `findUnique()` then check for null

**Recommended Fix** (refactor pattern):
```typescript
const campaign = await prisma.campaign.findUnique({
  where: { id: params.id },
});

if (!campaign) {
  return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
}
```

**Note**: This is NOT a blocker since error handling works, just a code quality improvement.

---

### ISSUE #9: No Pagination Limits

**Severity**: MEDIUM
**Category**: API Security
**Files**: All list endpoints in `src/app/api`

**Example - Contacts List**:
```typescript
// src/app/api/contacts/route.ts:36
const contacts = await prisma.contact.findMany({
  where,
  orderBy: { [sort]: dir },
  skip: (page - 1) * PAGE_SIZE,  // PAGE_SIZE = 20
  take: PAGE_SIZE,  // ← Hard-coded to 20
  // ...
});
```

**Issue**:
- Page size is enforced (20 items)
- But page parameter from URL has no max value
- Someone could request page=999999999
- Would skip billions of records before returning 20
- Potential DoS attack

**Recommended Fix**:

Validate page parameter:
```typescript
const maxPage = 1000;
const page = Math.max(1, Math.min(maxPage, Number(searchParams.get("page") ?? 1)));
```

---

## SUMMARY TABLE

| # | Issue | Severity | File | Line | Impact | Status |
|---|-------|----------|------|------|--------|--------|
| 1 | Database Provider Mismatch | CRITICAL | schema.prisma, .env | 12, 1 | Build fails, production crash | BLOCKER |
| 2 | Seed Wipes Data | CRITICAL | seed.ts | 87-102 | All data destroyed on deploy | BLOCKER |
| 3 | Hardcoded Secret | CRITICAL | .env | 2 | Security breach | BLOCKER |
| 4 | No Env Validation | CRITICAL | auth.ts, prisma.ts | 66, 9 | Silent failures | HIGH |
| 5 | No DB Resilience | HIGH | prisma.ts | 7-11 | Crashes on connection error | HIGH |
| 6 | Missing CSP Header | HIGH | next.config.mjs | 35 | Increased XSS risk | HIGH |
| 7 | Email Sanitization | HIGH | api/campaigns/[id]/send | 47 | Possible XSS | MEDIUM |
| 8 | findUniqueOrThrow Pattern | LOW | 13 files | Various | Code quality | LOW |
| 9 | No Pagination Limits | MEDIUM | api/*/route.ts | Various | Potential DoS | MEDIUM |

---

## Deployment Checklist

Before deploying to production:

- [ ] Fix database provider mismatch
- [ ] Fix seed conditional check
- [ ] Remove hardcoded secret, use environment variable
- [ ] Add environment variable validation
- [ ] Add database connection resilience
- [ ] Add Content-Security-Policy header
- [ ] Add HTML sanitization for emails
- [ ] Test production deployment locally
- [ ] Verify all environment variables are set in Railway
- [ ] Run smoke tests on production
