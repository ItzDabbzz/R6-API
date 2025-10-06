# Setting Up External Cron for Token Refresh

Since Vercel Hobby plan only allows daily cron jobs, you can use a free external cron service to refresh tokens more frequently (e.g., every 2 hours).

## Recommended: cron-job.org (100% Free)

### Setup Steps:

1. **Go to [cron-job.org](https://cron-job.org)** and create a free account

2. **Create a new cron job** with these settings:
   - **Title**: `R6 API Token Refresh`
   - **URL**: `https://your-app.vercel.app/api/cron/refresh-auth`
   - **Schedule**: Every 2 hours (or choose: `0 */2 * * *`)
   - **Request Method**: POST
   - **Headers**: Add custom header
     - Key: `Authorization`
     - Value: `Bearer YOUR_CRON_SECRET` (replace with your actual secret)

3. **Save and enable** the cron job

4. **Test it** by clicking "Run now" to verify it works

### What This Does:

- Calls your Vercel endpoint every 2 hours
- Refreshes both V2 and V3 Ubisoft auth tokens
- Stores them in Vercel KV (or environment variables)
- Completely free, no limitations

## Alternative: EasyCron

1. Go to [easycron.com](https://www.easycron.com)
2. Create free account (25 jobs, runs every 30 min minimum)
3. Create cron job:
   - **URL**: `https://your-app.vercel.app/api/cron/refresh-auth`
   - **Cron Expression**: `0 */2 * * *` (every 2 hours)
   - **HTTP Method**: POST
   - **HTTP Headers**: `Authorization: Bearer YOUR_CRON_SECRET`

## Alternative: UptimeRobot (Workaround)

UptimeRobot is primarily for monitoring, but can be used as a workaround:

1. Create free account at [uptimerobot.com](https://uptimerobot.com)
2. Add new monitor:
   - **Monitor Type**: HTTP(s)
   - **URL**: `https://your-app.vercel.app/api/cron/refresh-auth`
   - **Monitoring Interval**: 5 minutes (minimum on free plan)
3. Configure custom HTTP headers:
   - Add: `Authorization: Bearer YOUR_CRON_SECRET`

**Note**: UptimeRobot uses GET requests by default, so you may need to modify your endpoint to accept GET requests as well, or use a service that supports POST.

## Security Note

Your `CRON_SECRET` should be:
- Generated using: `openssl rand -base64 32`
- Stored securely in Vercel environment variables
- Never committed to git
- Unique and complex

## Testing Your Setup

After configuration, test your endpoint manually:

```bash
curl -X POST https://your-app.vercel.app/api/cron/refresh-auth \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -v
```

Expected response:
```json
{
  "success": true,
  "message": "Auth tokens refreshed"
}
```

## Monitoring

Check your Vercel function logs to verify tokens are being refreshed:
1. Go to Vercel Dashboard → Your Project → Functions
2. Click on `/api/cron/refresh-auth`
3. View logs to see successful refreshes

## Hybrid Approach (Recommended)

Use **both** Vercel Cron (daily) **and** an external service (every 2 hours):
- Vercel Cron acts as a backup in case the external service fails
- External service provides the frequent refreshes you need
- Total redundancy with zero cost
