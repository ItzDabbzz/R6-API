import configJson from '../configs/config.json'

/**
 * Configuration loader that prioritizes environment variables over config.json.
 * This allows secure credential management in serverless environments.
 */
export interface Config {
    debug_mode: boolean
    port: number
    current_season: string
    http: {
        user_agent: string
    }
    max_requests_per_user_per_second: number
    ubi_credentials: {
        email: string
        password: string
    }
}

/**
 * Loads configuration with environment variable overrides.
 */
export function loadConfig(): Config {
    return {
        debug_mode: process.env.DEBUG_MODE === 'true' || configJson.debug_mode,
        port: parseInt(process.env.PORT || '') || configJson.port,
        current_season: process.env.CURRENT_SEASON || configJson.current_season,
        http: {
            user_agent: process.env.HTTP_USER_AGENT || configJson.http.user_agent
        },
        max_requests_per_user_per_second: parseInt(process.env.MAX_REQUESTS_PER_SECOND || '') || configJson.max_requests_per_user_per_second,
        ubi_credentials: {
            email: process.env.UBI_EMAIL || configJson.ubi_credentials.email,
            password: process.env.UBI_PASSWORD || configJson.ubi_credentials.password
        }
    }
}

// Export singleton config instance
const config = loadConfig()
export default config
