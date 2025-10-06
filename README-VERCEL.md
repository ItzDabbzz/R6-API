# Vercel Deployment Guide

This project has been converted to work with Vercel's serverless platform.

## Key Changes from Traditional Server

1. **No clustering** - Vercel handles auto-scaling
2. **Serverless functions** - Each request is handled by a separate function instance
3. **Vercel KV storage** - Auth tokens stored in Redis-compatible KV store (or environment variables as fallback)
4. **Vercel Cron** - Scheduled auth token refresh every 2 hours

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

### 6. Set Up Cron Secret

After deploying, add the `CRON_SECRET` to your Vercel Cron configuration:

1. Go to Project Settings → Environment Variables
2. Add `CRON_SECRET` with a secure random value
3. Redeploy

## Local Development

```bash
npm run dev
```

This starts Vercel's local development server with serverless function emulation.

## API Endpoints

- **GET** `/r6/profiles/:platform/:username` - Get R6 player profile
- **POST** `/api/cron/refresh-auth` - Refresh auth tokens (protected by CRON_SECRET)

## Cron Jobs

The auth token refresh runs automatically every 2 hours via Vercel Cron (configured in `vercel.json`).

## Storage Options

### Option 1: Vercel KV (Recommended)
- Persistent Redis-compatible storage
- Automatic expiration (tokens expire after 2 hours)
- Best for production

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

**Tokens not persisting:**
- Ensure Vercel KV is properly connected
- Check environment variables are set correctly
- Verify cron job is running (`/api/cron/refresh-auth`)

**Rate limiting issues:**
- Adjust `max_requests_per_user_per_second` in config
- Consider using Vercel Edge Config for distributed rate limiting

**Authentication errors:**
- Check Ubisoft credentials in `config.json`
- Verify tokens are being refreshed (check function logs)
- Ensure cron secret matches between environment and requests

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
