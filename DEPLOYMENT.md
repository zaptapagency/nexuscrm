# NexusCRM Deployment Guide

## Table of Contents

- [Railway.app (Recommended)](#railwayapp-recommended)
- [Vercel](#vercel)
- [Docker / Self-Hosted](#docker--self-hosted)
- [Environment Setup](#environment-setup)
- [Database Migration](#database-migration)
- [Monitoring & Logs](#monitoring--logs)
- [Troubleshooting](#troubleshooting)

## Railway.app (Recommended)

Railway.app provides the easiest path to production with automatic CI/CD, database management, and free tier support.

### Prerequisites

- GitHub account with repository push access
- Railway.app account (free tier available at https://railway.app)
- PostgreSQL database (included in Railway)

### Step 1: Connect Repository

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Authorize Railway to access your GitHub account
5. Select the `nexuscrm` repository

### Step 2: Configure Services

Railway auto-detects `railway.json` and should prompt to add PostgreSQL.

**If PostgreSQL doesn't auto-add:**
1. Click "Add"
2. Select "Database"
3. Choose "PostgreSQL"
4. Accept defaults

### Step 3: Set Environment Variables

Navigate to your project settings and add:

```env
NEXTAUTH_SECRET=<generated-secret>
NODE_ENV=production
```

Railway automatically provides:
- `DATABASE_URL` (from PostgreSQL plugin)
- Public domain for `NEXTAUTH_URL`

### Step 4: Deploy

1. Push code to your main branch
2. Railway automatically builds and deploys
3. Watch deployment logs in the dashboard

### Step 5: Initialize Database

Once deployed, run migrations:

```bash
# Using Railway CLI
railway run npm run db:push
railway run npm run db:seed

# Or through Railway dashboard: Run script
```

### Step 6: Access Application

Find your app's public URL in the Railway dashboard and open it in your browser.

**Expected URL format:** `https://nexuscrm-production-xxxx.railway.app`

### Post-Deployment

1. Update `NEXTAUTH_URL` to your Railway domain if needed
2. Create first admin account (or use seed demo credentials)
3. Test key flows (login, create contact, send campaign)
4. Monitor logs for errors

## Vercel

Vercel is optimized for Next.js and offers serverless deployment.

### Prerequisites

- GitHub repository access
- Vercel account (free tier available)
- PostgreSQL database (use Railway, Supabase, or other provider)

### Step 1: Deploy to Vercel

1. Go to [Vercel](https://vercel.com/new)
2. Select "Import Git Repository"
3. Choose your `nexuscrm` repository
4. Accept project defaults

### Step 2: Set Environment Variables

In the "Environment Variables" section, add:

```env
DATABASE_URL=postgresql://user:password@host:port/dbname
NEXTAUTH_SECRET=<generated-secret>
NEXTAUTH_URL=https://<your-vercel-domain>.vercel.app
NODE_ENV=production
```

### Step 3: Deploy

Click "Deploy" and wait for build to complete.

### Step 4: Database Setup

After deployment succeeds:

```bash
# Via Vercel CLI or project settings
npm run db:push  # Apply schema
npm run db:seed  # Load demo data
```

### Limitations

- Vercel requires external PostgreSQL (serverless functions have 10s timeout limit)
- Recommended: Use Railway for PostgreSQL, Vercel for app
- Email provider needs configuration for serverless

## Docker / Self-Hosted

For complete control, deploy Docker image to any infrastructure.

### Prerequisites

- Docker & Docker Compose installed
- PostgreSQL database
- Linux server or cloud VM
- Domain name and SSL certificate (recommended)

### Step 1: Build Docker Image

```bash
docker build -t nexuscrm:latest .
```

### Step 2: Docker Compose (Complete Stack)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://nexuscrm:password@postgres:5432/nexuscrm
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: ${NEXTAUTH_URL}
      NODE_ENV: production
    depends_on:
      - postgres
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: nexuscrm
      POSTGRES_USER: nexuscrm
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

### Step 3: Run Application

```bash
# Create .env file with production values
cp .env.example .env
# Edit .env with your secrets

# Start services
docker-compose up -d

# Initialize database
docker-compose exec app npm run db:push
docker-compose exec app npm run db:seed

# View logs
docker-compose logs -f app
```

### Step 4: Reverse Proxy (Nginx)

Set up Nginx to proxy traffic:

```nginx
server {
    listen 80;
    server_name nexuscrm.example.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name nexuscrm.example.com;

    ssl_certificate /etc/letsencrypt/live/nexuscrm.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nexuscrm.example.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Step 5: SSL Certificate

Use Let's Encrypt for free SSL:

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone -d nexuscrm.example.com

# Auto-renew (runs automatically)
sudo systemctl enable certbot.timer
```

## Environment Setup

### Required Variables (All Deployments)

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
NEXTAUTH_SECRET="openssl rand -base64 32"  # Generate securely
NEXTAUTH_URL="https://yourdomain.com"      # Match deployment URL
NODE_ENV="production"
```

### Optional Variables

```env
# Email configuration (currently disabled, uses local email)
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASSWORD=""

# Application settings
PORT=3000                    # Custom port
LOG_LEVEL="info"            # debug, info, warn, error
```

### Secret Generation

Generate a cryptographically secure secret:

```bash
# Linux/Mac
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Database Migration

### From SQLite to PostgreSQL

For production deployment, migrate from local SQLite to PostgreSQL:

```bash
# 1. Export from SQLite
sqlite3 dev.db ".dump" > backup.sql

# 2. Point to PostgreSQL
export DATABASE_URL="postgresql://user:password@host:5432/dbname"

# 3. Run Prisma push (creates schema)
npm run db:push

# 4. Seed with data
npm run db:seed
```

### Backup Existing Database

Before deploying:

```bash
# PostgreSQL backup
pg_dump -U nexuscrm -h localhost nexuscrm > backup.sql

# Restore if needed
psql -U nexuscrm -h localhost nexuscrm < backup.sql
```

## Monitoring & Logs

### Railway.app Logs

```bash
# View logs via CLI
railway logs -f

# View specific service logs
railway logs service-name -f
```

### Vercel Logs

Dashboard → Project → Deployments → Logs

### Docker Logs

```bash
# View logs
docker-compose logs -f app

# Follow specific service
docker-compose logs -f postgres
```

### Application Monitoring

Add monitoring for:

1. **Error Tracking**: Integrate Sentry or similar
2. **Performance**: Monitor database query performance
3. **Uptime**: Use monitoring service (Pingdom, UptimeRobot)
4. **Logs**: Centralize with ELK or Datadog

## Troubleshooting

### Common Deployment Issues

**Build fails with "tsc not found"**
- Ensure TypeScript is in devDependencies
- Clear `node_modules` and reinstall: `npm ci`

**"DATABASE_URL is not set"**
- Check environment variable in deployment platform
- Verify database connection string format
- Test locally: `DATABASE_URL=<url> npm run db:push`

**"NEXTAUTH_SECRET is required"**
- Generate and set NEXTAUTH_SECRET
- Don't leave it as example text

**"Cannot connect to database"**
- Verify DATABASE_URL is correct
- Check network/firewall rules
- Ensure database server is running
- Test connection: `psql $DATABASE_URL`

**"Application Error" on first visit**
- Check deployment logs
- Verify all environment variables
- Database might not be initialized: run `npm run db:push`

**Slow page loads**
- Check database query performance
- Review Railway/Vercel logs for bottlenecks
- Consider adding database indexes

**Email tracking not working**
- Verify `NEXTAUTH_URL` matches deployment domain
- Check `/api/track/open` and `/api/track/click` are accessible
- Test from public form at `/f/[slug]`

### Performance Optimization

**Database:**
```prisma
// Add indexes for frequently queried fields
model Contact {
  id       String @id @default(cuid())
  email    String @unique
  lifecycleStage String @db.VarChar(20)

  @@index([lifecycleStage])
  @@index([createdAt])
}
```

**Caching:**
- Use React Query for client-side caching
- Enable Vercel/Railway edge caching for static assets
- Set appropriate Cache-Control headers

**Images:**
- Use Next.js Image component
- Optimize images before upload
- Enable CDN caching

### Getting Help

- Check Railway/Vercel logs for error messages
- Review [README.md](README.md) troubleshooting section
- Open GitHub issue with logs and configuration
- Contact hosting provider support

---

For more help, see [README.md](README.md#troubleshooting)
