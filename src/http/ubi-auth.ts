import axios, { AxiosError } from 'axios'
import config from '../utilities/config-loader'
import { TokenStorage } from '../utilities/token-storage'
import { UbiAuthResponse } from '../utilities/interfaces/http_interfaces'
import { UbiAppId } from '../utilities/interfaces/enums'



export class UbiLoginManager {
    static instance: UbiLoginManager

    /**
     * Logs into a Ubisoft acount twice, once with a V2 appId and once with a
     * V3 appId. Saves both auth tokens to storage (Vercel KV or environment variables).
     *
     * Avoid calling this function more than 3 times per hour.
     *
     * @returns Whether the login was aborted.
     */
    async Login(): Promise<void> {
        try {
            const tokenV2 = await this.RequestLogin(UbiAppId.v2)
            if (tokenV2) {
                await TokenStorage.saveToken('v2', tokenV2)
            }

            const tokenV3 = await this.RequestLogin(UbiAppId.v3)
            if (tokenV3) {
                await TokenStorage.saveToken('v3', tokenV3)
            }
        }
        catch (error) {
            console.error(error)
        }
    }

    /**
     * Makes an HTTP request to Ubisoft to login to the specified account.
     *
     * @param appId Ubi-AppId header value.
     * @returns Auth response with token and session data.
     */
    async RequestLogin(appId: UbiAppId): Promise<UbiAuthResponse | void> {
        const credentials = Buffer.from(`${config.ubi_credentials.email}:${config.ubi_credentials.password}`).toString('base64')

        const httpConfig = {
            method: 'POST',
            url: 'https://public-ubiservices.ubi.com/v3/profiles/sessions',
            headers: {
                'User-Agent': config.http.user_agent,
                'Authorization': `Basic ${credentials}`,
                'Ubi-AppId': appId,
                'Connection': 'Keep-Alive',
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                rememberMe: true
            })
        }

        try {
            const response = await axios(httpConfig)
            return response.data as UbiAuthResponse
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError

                if (axiosError.response?.status) {
                    switch (axiosError.response?.status) {
                        case 401: throw 'Account does not exist.'
                        case 409: throw 'Captcha needed.'
                        case 429: throw 'Too many requests.'
                        default: throw error
                    }
                }
            }
            else { throw error }
        }
    }
}