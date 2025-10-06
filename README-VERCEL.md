# Vercel Deployment Guide

This project has been converted to work with Vercel's serverless platform.

## Key Changes from Traditional Server

1. **No clustering** - Vercel handles auto-scaling
2. **Serverless functions** - Each request is handled by a separate function instance
3. **Vercel KV storage** - Auth tokens stored in Redis-compatible KV store (or environment variables as fallback)
4. **Vercel Cron** - Scheduled auth token refresh daily (or upgrade to Pro for more frequent refreshes)

## Project Structure

```
api/
  index.ts              # Main serverless handler
  cron/
    refresh-auth.ts     # Cron endpoint for token refresh
src/
  [existing source files]
```

## Deployment Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Vercel CLI (optional, for local testing)

```bash
npm install -g vercel
```

### 3. Set Up Vercel KV (Recommended)

1. Go to your Vercel dashboard
2. Navigate to Storage → Create Database → KV
3. Name it (e.g., "r6-api-tokens")
4. Connect it to your project
5. Vercel will automatically add the KV environment variables

**OR use Environment Variables fallback:**

If you don't want to use Vercel KV, you can set tokens directly as environment variables in the Vercel dashboard.

### 4. Configure Environment Variables

In your Vercel dashboard, add these environment variables:

**Required:**
- Your existing config values from `config.json` should be added as environment variables
- `CRON_SECRET` - A random string to secure your cron endpoint (generate with: `openssl rand -base64 32`)

**Optional (if not using Vercel KV):**
- `UBI_TOKEN_V2` - Manually set v2 token as JSON string
- `UBI_TOKEN_V3` - Manually set v3 token as JSON string

### 5. Deploy to Vercel

```bash
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

### 6. Initialize Auth Tokens

**IMPORTANT**: After deploying, you MUST manually trigger the auth refresh endpoint to generate initial tokens:

```bash
curl -X POST https://your-app.vercel.app/api/cron/refresh-auth \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

You should see: `{"success":true,"message":"Auth tokens refreshed"}`

**⚠️ RATE LIMITING WARNING**:
- Ubisoft's API has strict rate limits on login attempts
- **Do NOT** call the refresh endpoint more than once every 15-30 minutes
- If you get a 429 error, wait at least 30 minutes before trying again
- The API will auto-generate tokens on the first request if missing, but this can trigger rate limits if you make multiple requests

**Best Practice**: Initialize tokens once manually, then let the daily cron job handle refreshes.

## Local Development

```bash
npm run dev
```

This starts Vercel's local development server with serverless function emulation.

## API Endpoints

- **GET** `/r6/profiles/:platform/:username` - Get R6 player profile
- **POST** `/api/cron/refresh-auth` - Refresh auth tokens (protected by CRON_SECRET)

## Cron Jobs

**Hobby Plan**: The auth token refresh runs once daily at midnight UTC (`0 0 * * *`) via Vercel Cron.

**Pro Plan**: You can upgrade to more frequent refreshes (e.g., every 2 hours: `0 */2 * * *`) by changing the schedule in `vercel.json`.

### Alternative: Manual Token Refresh

If daily refresh isn't frequent enough, you can:

1. **Manually trigger the cron endpoint**:
   ```bash
   curl -X POST https://your-app.vercel.app/api/cron/refresh-auth \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

2. **Use an external cron service** (free options):
   - [cron-job.org](https://cron-job.org) - Free, reliable cron service (Recommended!)
   - [EasyCron](https://www.easycron.com) - Free tier available
   - [UptimeRobot](https://uptimerobot.com) - Monitor endpoint + trigger refreshes

   Configure them to call your `/api/cron/refresh-auth` endpoint every 2 hours.

   **See [EXTERNAL-CRON-SETUP.md](EXTERNAL-CRON-SETUP.md) for detailed setup instructions.**

3. **Upgrade to Vercel Pro** for native multi-hourly cron support.

## Storage Options

### Option 1: Vercel KV (Recommended)
- Persistent Redis-compatible storage
- Tokens stored with 2-hour TTL (auto-deleted after expiration)
- Best for production use

### Option 2: Environment Variables
- Set `UBI_TOKEN_V2` and `UBI_TOKEN_V3` manually
- Tokens must be updated manually or via cron
- Good for testing or simple deployments

### Option 3: In-Memory (Development Only)
- Tokens stored in process memory
- Lost on each cold start
- Only use for local development

## Important Notes

1. **Cold Starts**: First request after inactivity may be slower
2. **File System**: Vercel serverless functions have read-only file systems (except `/tmp`)
3. **Execution Time**: Functions timeout after 10 seconds (60s on Pro plan)
4. **Rate Limiting**: Works per-function instance, may need adjustment for serverless

## Troubleshooting

**"No token found for version v2/v3":**
- First deployment: Manually trigger `/api/cron/refresh-auth` to initialize tokens
- Check that `UBI_EMAIL` and `UBI_PASSWORD` environment variables are set correctly
- Verify Vercel KV is connected (or tokens won't persist across cold starts)
- The API will auto-login on first request, but manual initialization is recommended

**"Too many requests" / 429 Rate Limit Error:**
- Ubisoft limits login attempts to ~3 per hour per account
- **WAIT 30-60 minutes** before trying to refresh tokens again
- This often happens if you:
  - Made multiple deployments/tests in quick succession
  - Auto-login triggered multiple times
  - Manually called `/api/cron/refresh-auth` too frequently
- **Solution**: Be patient and wait for the rate limit to reset
- **Prevention**: Only initialize tokens once after deployment, then use daily cron

**"JSON.parse" errors with Vercel KV:**
- This has been fixed - Vercel KV handles JSON serialization automatically
- If you see this error, ensure you're using the latest code version

**"trust proxy" / rate limiting errors:**
- Fixed in latest version - `app.set('trust proxy', 1)` is now enabled
- Vercel uses proxies, so Express needs to trust the `X-Forwarded-For` header

**Tokens not persisting:**
- Ensure Vercel KV is properly connected in your project dashboard
- Without KV, tokens only persist in memory (lost on cold starts)
- Alternative: Set `UBI_TOKEN_V2` and `UBI_TOKEN_V3` as environment variables

**Rate limiting issues:**
- Adjust `MAX_REQUESTS_PER_SECOND` environment variable (default: 8)
- Rate limiting is per-function instance in serverless

**Authentication errors:**
- Check `UBI_EMAIL` and `UBI_PASSWORD` environment variables
- Verify tokens are being refreshed (check function logs in Vercel dashboard)
- Ensure `CRON_SECRET` matches between environment and cron service

## Migrating from Traditional Server

The original `src/index.ts` remains for backward compatibility if you want to run a traditional Node.js server. The new serverless entry point is `api/index.ts`.

To use the traditional server:
```bash
npm start
```

To use serverless (Vercel):
```bash
npm run dev  # local
vercel       # deploy
```
