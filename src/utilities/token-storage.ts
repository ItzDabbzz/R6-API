import { R6UserResponse } from './interfaces/http_interfaces'

/**
 * Token storage adapter for serverless environments.
 * Uses Vercel KV if available, falls back to environment variables.
 */
export class TokenStorage {
    private static kvStore: any = null

    static async initialize() {
        // Try to load Vercel KV if available
        try {
            const { kv } = await import('@vercel/kv')
            this.kvStore = kv
        } catch {
            // KV not available, will use environment variables
            console.log('Vercel KV not available, using environment variables for tokens')
        }
    }

    static async saveToken(version: 'v2' | 'v3', token: R6UserResponse): Promise<void> {
        const key = `auth_token_${version}`

        if (this.kvStore) {
            // Store in Vercel KV with 2 hour expiry (tokens refresh every 2 hours)
            await this.kvStore.set(key, JSON.stringify(token), { ex: 7200 })
        } else {
            // Fallback: Store in process memory (not ideal for serverless, but works for single invocation)
            // For production, you should use Vercel KV or another persistent store
            if (!global.tokenCache) {
                global.tokenCache = {}
            }
            global.tokenCache[key] = token
        }
    }

    static async getToken(version: 'v2' | 'v3'): Promise<R6UserResponse | null> {
        const key = `auth_token_${version}`

        if (this.kvStore) {
            const data = await this.kvStore.get(key)
            return data ? JSON.parse(data as string) : null
        } else {
            // Try environment variables first (set these in Vercel dashboard)
            const envKey = `UBI_TOKEN_${version.toUpperCase()}`
            if (process.env[envKey]) {
                try {
                    return JSON.parse(process.env[envKey]!)
                } catch {
                    console.error(`Failed to parse ${envKey} from environment`)
                }
            }

            // Fallback to in-memory cache
            return global.tokenCache?.[key] || null
        }
    }
}

// Initialize on module load
TokenStorage.initialize()

// Type augmentation for global token cache
declare global {
    var tokenCache: Record<string, R6UserResponse> | undefined
}
