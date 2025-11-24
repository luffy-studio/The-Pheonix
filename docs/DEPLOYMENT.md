# Deployment Guide

This guide covers various deployment options for The Phoenix project.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Frontend Deployment](#frontend-deployment)
   - [Vercel](#vercel)
   - [Netlify](#netlify)
3. [Backend Deployment](#backend-deployment)
   - [Render](#render)
   - [Railway](#railway)
   - [Heroku](#heroku)
4. [Docker Deployment](#docker-deployment)
5. [Database Setup](#database-setup)
6. [Environment Variables](#environment-variables)
7. [Post-Deployment](#post-deployment)

---

## Prerequisites

- GitHub account
- Supabase account (database)
- Domain name (optional)
- Git installed locally

---

## Frontend Deployment

### Vercel

**Recommended for Next.js applications**

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/The-Pheonix-main.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select the `Frontend` directory as root
   - Configure build settings:
     - **Framework Preset**: Next.js
     - **Build Command**: `npm run build` or `pnpm build`
     - **Output Directory**: `.next`
     - **Install Command**: `pnpm install` or `npm install`

3. **Add Environment Variables**
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   NEXT_PUBLIC_API_URL=your_backend_url
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `your-app.vercel.app`

### Netlify

1. **Build Command**: `npm run build`
2. **Publish Directory**: `.next`
3. **Environment Variables**: Same as Vercel
4. **Deploy**: Follow Netlify's deployment wizard

---

## Backend Deployment

### Render

**Recommended for Python backends**

1. **Create Web Service**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `backend` directory

2. **Configure Service**
   - **Name**: phoenix-backend
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

3. **Add Environment Variables**
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   DATABASE_URL=your_database_url
   ENVIRONMENT=production
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically deploy
   - Your API will be live at `https://your-service.onrender.com`

5. **Update Frontend**
   - Update `NEXT_PUBLIC_API_URL` in Vercel to your Render URL

### Railway

1. **Create Project**
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

2. **Configure**
   - Railway auto-detects Python
   - Add environment variables in dashboard
   - Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

3. **Generate Domain**
   - Click "Generate Domain" in settings
   - Your API will be available at the generated URL

### Heroku

1. **Install Heroku CLI**
   ```bash
   # macOS
   brew tap heroku/brew && brew install heroku
   
   # Windows
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login and Create App**
   ```bash
   heroku login
   cd backend
   heroku create phoenix-backend
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set NEXT_PUBLIC_SUPABASE_URL=your_url
   heroku config:set SUPABASE_SERVICE_ROLE_KEY=your_key
   # ... add all other variables
   ```

4. **Deploy**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

5. **Open App**
   ```bash
   heroku open
   ```

---

## Docker Deployment

### Local Docker

1. **Build and Run**
   ```bash
   # From project root
   docker-compose up --build
   ```

2. **Access Services**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000

### Docker Hub

1. **Build Images**
   ```bash
   # Backend
   cd backend
   docker build -t yourusername/phoenix-backend:latest .
   docker push yourusername/phoenix-backend:latest
   
   # Frontend
   cd ../Frontend
   docker build -t yourusername/phoenix-frontend:latest .
   docker push yourusername/phoenix-frontend:latest
   ```

2. **Deploy to Server**
   ```bash
   # On your server
   docker pull yourusername/phoenix-backend:latest
   docker pull yourusername/phoenix-frontend:latest
   docker-compose up -d
   ```

### AWS ECS / Azure Container Instances

Follow your cloud provider's documentation for deploying Docker containers.

---

## Database Setup

### Supabase

1. **Create Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose organization and region
   - Set database password

2. **Create Tables**
   ```sql
   -- Run the SQL from docs/DATABASE.md
   -- Or use the Supabase Table Editor
   ```

3. **Get Credentials**
   - Go to Project Settings → API
   - Copy:
     - Project URL
     - Anon Public Key
     - Service Role Key (keep secret!)

4. **Configure RLS**
   - Enable Row Level Security on all tables
   - Add policies for user data isolation

---

## Environment Variables

### Required Variables

**Backend:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://...
ENVIRONMENT=production
PORT=8000
```

**Frontend:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

### Setting Variables

**Vercel:**
- Dashboard → Settings → Environment Variables

**Render:**
- Dashboard → Environment → Add Environment Variable

**Railway:**
- Project → Variables → New Variable

**Heroku:**
```bash
heroku config:set KEY=value
```

---

## Post-Deployment

### 1. Test API

```bash
# Test health endpoint
curl https://your-backend-url.com/

# Expected response:
# {"message": "Backend is running!"}
```

### 2. Test Frontend

- Visit your frontend URL
- Try creating an account
- Upload sample data
- Generate a timetable

### 3. Configure CORS

Update CORS origins in `backend/main.py`:

```python
origins = [
    "https://your-frontend.vercel.app",
    "http://localhost:3000"  # Keep for local development
]
```

### 4. Enable HTTPS

Most platforms (Vercel, Render, Railway) provide free SSL certificates automatically.

### 5. Set up Custom Domain (Optional)

**Vercel:**
- Dashboard → Domains → Add Domain
- Follow DNS configuration instructions

**Render:**
- Dashboard → Settings → Custom Domain
- Add CNAME record to your DNS

### 6. Monitor Logs

**Vercel:**
- Dashboard → Deployments → View Function Logs

**Render:**
- Dashboard → Logs

**Railway:**
- Project → Deployments → View Logs

### 7. Set up Monitoring

Consider adding:
- Sentry for error tracking
- LogRocket for session replay
- Google Analytics for usage tracking

---

## Continuous Deployment

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Render
        run: |
          curl ${{ secrets.RENDER_DEPLOY_HOOK }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        run: npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## Troubleshooting

### Frontend Issues

**Build Fails:**
- Check Node version (should be 20.x)
- Verify all environment variables are set
- Check build logs for specific errors

**API Connection Failed:**
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS configuration
- Ensure backend is running

### Backend Issues

**Module Not Found:**
- Verify `requirements.txt` is complete
- Check Python version (should be 3.11)

**Database Connection Failed:**
- Verify Supabase credentials
- Check database URL format
- Ensure tables are created

**CORS Errors:**
- Add frontend URL to CORS origins
- Verify credentials are included in requests

---

## Scaling

### Frontend

Vercel automatically scales. For custom solutions:
- Use CDN (Cloudflare, CloudFront)
- Enable static page generation
- Implement ISR (Incremental Static Regeneration)

### Backend

**Vertical Scaling:**
- Increase instance size on Render/Railway

**Horizontal Scaling:**
- Use load balancer
- Deploy multiple instances
- Implement Redis for session storage

### Database

- Upgrade Supabase plan
- Enable connection pooling (pgBouncer)
- Add read replicas for heavy read workloads

---

## Backup Strategy

### Database Backups

```bash
# Daily backup script
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Upload to S3
aws s3 cp backup_*.sql s3://your-backup-bucket/
```

### Application Backups

- GitHub already serves as code backup
- Export timetables regularly
- Document configuration changes

---

## Security Checklist

- [ ] Environment variables secured
- [ ] HTTPS enabled
- [ ] CORS configured properly
- [ ] RLS enabled on database
- [ ] Service role key kept secret
- [ ] Regular dependency updates
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention
- [ ] XSS protection enabled

---

## Cost Estimates

**Free Tier (suitable for development):**
- Vercel: Free (Hobby plan)
- Render: Free (with sleep after inactivity)
- Supabase: Free (500MB database, 2GB bandwidth)
- **Total: $0/month**

**Production (small scale):**
- Vercel Pro: $20/month
- Render Standard: $7/month
- Supabase Pro: $25/month
- **Total: ~$52/month**

**Production (medium scale):**
- Vercel Pro: $20/month
- Render Standard (2 instances): $14/month
- Supabase Pro with add-ons: $50/month
- Monitoring/Logging: $20/month
- **Total: ~$104/month**

---

## Support

For deployment issues:
1. Check platform-specific documentation
2. Review logs for error messages
3. Open an issue on GitHub
4. Contact platform support

---

Made with ❤️ by The Phoenix Team
