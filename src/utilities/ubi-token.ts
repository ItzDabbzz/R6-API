import { UbiToken } from './interfaces/http_interfaces'
import { TokenStorage } from './token-storage'
import { UbiLoginManager } from '../http/ubi-auth'

// Track if we've attempted auto-login to prevent infinite loops
let autoLoginAttempted = false

/**
 * Retrieves cached Ubisoft auth token from storage (Vercel KV or environment variables).
 * If no token is found and this is the first attempt, triggers an auto-login.
 *
 * @param version Ubisoft auth token version (`'v2'` || `'v3'`).
 * @returns Ubisoft auth token of corresponding version.
 */
export default async function Token(version: string): Promise<UbiToken | void> {
    try {
        const token = await TokenStorage.getToken(version as 'v2' | 'v3')

        if (!token) {
            console.warn(`No token found for version ${version}`)

            // Auto-login on first request if tokens are missing
            if (!autoLoginAttempted && UbiLoginManager.instance) {
                console.log('No tokens found. Attempting auto-login to generate initial tokens...')
                autoLoginAttempted = true

                try {
                    await UbiLoginManager.instance.Login()
                    // Retry getting the token after login
                    const newToken = await TokenStorage.getToken(version as 'v2' | 'v3')
                    if (newToken) {
                        console.log(`Successfully generated token for version ${version}`)
                        return newToken
                    } else {
                        console.error('Token generation succeeded but token still not found')
                    }
                } catch (loginError) {
                    const errorMessage = loginError instanceof Error ? loginError.message : String(loginError)
                    console.error('Auto-login failed:', errorMessage)

                    // Provide helpful error message for rate limiting
                    if (errorMessage.includes('Rate limited') || errorMessage.includes('429')) {
                        console.error('SOLUTION: Wait 15-30 minutes before trying again, or manually set tokens using the /api/cron/refresh-auth endpoint')
                    }

                    throw new Error(`Failed to retrieve auth token: ${errorMessage}`)
                }
            } else if (autoLoginAttempted) {
                throw new Error(`Auth token for version ${version} not available. Auto-login already attempted and failed.`)
            }

            throw new Error(`Auth token for version ${version} not available and auto-login instance not initialized.`)
        }

        // UbiAuthResponse extends UbiToken, so this is safe
        return token
    }
    catch (error) {
        console.error(error)
    }
}