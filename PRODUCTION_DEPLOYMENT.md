# Production Deployment Guide - Codilla.ai

This guide covers the complete production deployment process for Codilla.ai.

## Pre-Deployment Checklist

### 1. Environment Variables

Create a `.env` file (or configure in your hosting platform):

```env
# Required
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
VITE_SUPABASE_PROJECT_ID=your_project_id

# Production
NODE_ENV=production
```

### 2. Supabase Configuration

#### Email Settings
1. Go to Supabase Dashboard → Authentication → Email Templates
2. Configure custom email templates for:
   - Confirmation (signup verification)
   - Magic Link
   - Password Reset
   - Email Change
3. Set your custom domain emails (e.g., noreply@codilla.ai)
4. Enable email confirmations in Auth settings

#### Authentication Settings
- **Site URL**: `https://codilla.ai`
- **Redirect URLs**: Add all production URLs
- Enable email confirmations
- Set session timeout (default: 24 hours)
- Configure password requirements

#### Razorpay Configuration
Add Supabase secrets (Edge Functions):
```bash
supabase secrets set RAZORPAY_KEY_ID=your_razorpay_key_id
supabase secrets set RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

#### AI Provider Keys
```bash
supabase secrets set ANTHROPIC_API_KEY=your_claude_key
supabase secrets set GOOGLE_AI_API_KEY=your_gemini_key
supabase secrets set OPENAI_API_KEY=your_openai_key
```

#### Database Setup
1. Run all migrations:
```bash
cd supabase
supabase db push
```

2. Apply performance indexes:
```bash
psql -h your-db-host -U postgres -d postgres -f migrations/20251105100000_add_performance_indexes.sql
```

3. Verify RLS policies are active:
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### 3. Build Optimization

Update `vite.config.ts` for production:
```typescript
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
});
```

## Deployment Options

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Deploy**:
```bash
vercel --prod
```

3. **Configure Environment Variables** in Vercel Dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`

4. **Custom Domain**:
   - Add domain in Vercel dashboard
   - Update DNS records:
     - A record: `@` → Vercel IP
     - CNAME: `www` → `cname.vercel-dns.com`

### Option 2: Netlify

1. **Deploy via CLI**:
```bash
npm i -g netlify-cli
netlify deploy --prod
```

2. **Or via Git**:
   - Connect GitHub repository
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Environment Variables**:
   - Add in Netlify Dashboard → Site settings → Environment variables

### Option 3: Self-Hosted (Docker)

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Create `nginx.conf`:
```nginx
server {
    listen 80;
    server_name codilla.ai;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Build and run:
```bash
docker build -t codilla-ai .
docker run -p 80:80 codilla-ai
```

## Post-Deployment Steps

### 1. SSL Certificate
- Vercel/Netlify: Automatic
- Self-hosted: Use Let's Encrypt
```bash
sudo certbot --nginx -d codilla.ai -d www.codilla.ai
```

### 2. DNS Configuration
```
Type    Name    Value                   TTL
A       @       your-server-ip          3600
CNAME   www     codilla.ai              3600
TXT     @       v=spf1 include:...      3600
```

### 3. Email Configuration (for codilla.ai emails)

Configure SMTP in Supabase:
1. Go to Authentication → Email Settings
2. Use custom SMTP:
   - Host: `smtp.gmail.com` (or your provider)
   - Port: `587`
   - Username: `noreply@codilla.ai`
   - Password: Your app-specific password

### 4. Monitoring Setup

#### Sentry Error Tracking
1. Install Sentry:
```bash
npm install @sentry/react @sentry/tracing
```

2. Initialize in `main.tsx`:
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
});
```

#### Uptime Monitoring
- Use UptimeRobot or Pingdom
- Monitor: `https://codilla.ai/health` (create endpoint)

### 5. Performance Optimization

#### CDN Setup
- Cloudflare (recommended):
  - Add site to Cloudflare
  - Update nameservers
  - Enable caching rules
  - Enable Brotli compression

#### Database
- Enable connection pooling in Supabase
- Set up read replicas if needed
- Monitor slow queries

### 6. Security Headers

Verify security headers (use securityheaders.com):
- ✅ Content-Security-Policy
- ✅ X-Frame-Options
- ✅ X-Content-Type-Options
- ✅ Strict-Transport-Security
- ✅ Referrer-Policy

### 7. Analytics

#### Google Analytics
Add to `index.html`:
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

#### PostHog (Alternative)
```bash
npm install posthog-js
```

### 8. Backup Strategy

#### Database
- Supabase: Automatic daily backups (paid plans)
- Manual backup:
```bash
pg_dump -h db.project.supabase.co -U postgres -d postgres > backup.sql
```

#### Code
- GitHub: Already versioned
- Docker images: Push to registry

## Testing Production Build Locally

```bash
# Build
npm run build

# Preview
npm run preview

# Or use serve
npx serve -s dist
```

## Rollback Procedure

### Vercel/Netlify
```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]
```

### Docker
```bash
# Keep previous images tagged
docker tag codilla-ai:latest codilla-ai:backup
docker run -p 80:80 codilla-ai:backup
```

## Monitoring Checklist

- [ ] Uptime monitoring active
- [ ] Error tracking (Sentry) configured
- [ ] Database connection pool monitored
- [ ] API rate limits monitored
- [ ] Token usage tracked
- [ ] Payment transactions logged
- [ ] Security alerts configured
- [ ] SSL certificate auto-renewal enabled

## Performance Targets

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

## Support & Maintenance

### Health Check Endpoint
Create `/api/health`:
```typescript
export default async function handler(req, res) {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
  res.status(200).json(health);
}
```

### Log Aggregation
- Use Supabase Logs for Edge Functions
- CloudWatch for AWS deployments
- Datadog for comprehensive monitoring

## Troubleshooting

### Build Fails
```bash
# Clear cache
rm -rf node_modules dist .vite
npm install
npm run build
```

### Environment Variables Not Loading
- Ensure they're prefixed with `VITE_`
- Restart dev server after adding
- Check hosting platform settings

### CORS Issues
- Verify Supabase URL matches exactly
- Check Edge Function CORS headers
- Ensure API URLs are whitelisted

## Success Criteria

✅ All pages load < 3 seconds
✅ Email verification working
✅ Password reset working
✅ Payment flow functional
✅ AI validation working
✅ SSL certificate active
✅ Security headers present
✅ Error tracking active
✅ Backups automated
✅ Monitoring configured

## Emergency Contacts

- Supabase Support: support@supabase.com
- Vercel Support: support@vercel.com
- Razorpay Support: support@razorpay.com

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Vite Production Build](https://vitejs.dev/guide/build.html)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Web.dev Metrics](https://web.dev/metrics/)
