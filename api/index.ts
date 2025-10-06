import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import router from '../src/router'
import config from '../src/utilities/config-loader'
import { tooManyRequestsError } from '../src/utilities/errors'
import { UbiLoginManager } from '../src/http/ubi-auth'

// Toggle debug mode.
if (!config.debug_mode) {
    console.log = () => {}
    console.error = () => {}
    console.debug = () => {}
    console.info = () => {}
    console.warn = () => {}
}

// Create Express instance.
const app = express()

// Create class singletons.
UbiLoginManager.instance = new UbiLoginManager()

// Maximum of X requests per user per second.
const limiter = rateLimit({
    max: config.max_requests_per_user_per_second,
    windowMs: 1000,
    standardHeaders: false,
    legacyHeaders: false,
    message: tooManyRequestsError
})

// Enable Helmet security.
app.use(helmet())
// Enable rate limiter.
app.use(limiter)
// Enable handling of all requests via the router.ts file.
app.use('/', router)

// Export the Express app for Vercel serverless
export default app
