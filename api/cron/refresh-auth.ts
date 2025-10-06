import { VercelRequest, VercelResponse } from '@vercel/node'
import { UbiLoginManager } from '../../src/http/ubi-auth'

// Create class singletons.
UbiLoginManager.instance = new UbiLoginManager()

/**
 * Vercel Cron endpoint to refresh Ubisoft authentication tokens.
 * Default schedule: Daily at midnight UTC (Hobby plan limitation).
 * For more frequent refreshes (e.g., every 2 hours), upgrade to Pro or use an external cron service.
 *
 * Note: This endpoint is protected by CRON_SECRET for security.
 * Set CRON_SECRET in your Vercel environment variables.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Verify this request is from Vercel Cron
    const authHeader = req.headers.authorization
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
        await UbiLoginManager.instance.Login()
        return res.status(200).json({ success: true, message: 'Auth tokens refreshed' })
    } catch (error) {
        console.error('Failed to refresh auth tokens:', error)
        return res.status(500).json({ error: 'Failed to refresh auth tokens' })
    }
}
