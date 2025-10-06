import { UbiToken } from './interfaces/http_interfaces'
import { TokenStorage } from './token-storage'



/**
 * Retrieves cached Ubisoft auth token from storage (Vercel KV or environment variables).
 *
 * @param version Ubisoft auth token version (`'v2'` || `'v3'`).
 * @returns Ubisoft auth token of corresponding version.
 */
export default async function Token(version: string): Promise<UbiToken | void> {
    try {
        const token = await TokenStorage.getToken(version as 'v2' | 'v3')

        if (!token) {
            console.error(`No token found for version ${version}`)
            return
        }

        // UbiAuthResponse extends UbiToken, so this is safe
        return token
    }
    catch (error) {
        console.error(error)
    }
}