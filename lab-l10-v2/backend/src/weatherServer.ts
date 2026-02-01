(globalThis as any).self = globalThis

import express, { Request, Response, NextFunction, RequestHandler } from "express"
import bodyParser from "body-parser"
import dotenv from "dotenv"
import { Setup, sdk } from "@bsv/wallet-toolbox"
import { createAuthMiddleware, AuthRequest } from "@bsv/auth-express-middleware"
import { PubKeyHex, VerifiableCertificate } from "@bsv/sdk"
import { createPaymentMiddleware } from "@bsv/payment-express-middleware"

const app = express()
app.use(bodyParser.json())

dotenv.config()

const SERVER_PRIVATE_KEY = process.env.SERVER_PRIVATE_KEY
const WALLET_STORAGE = process.env.WALLET_STORAGE
const HTTP_PORT = process.env.HTTP_PORT
const CERTIFIER_PRIVATE_KEY = process.env.CERTIFIER_PRIVATE_KEY
const CERTIFICATE_TYPE_ID = process.env.CERTIFICATE_TYPE_ID
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY

const initializeServer = async () => {

    try {

        const wallet = await Setup.createWalletClientNoEnv({
            chain: "main",
            rootKeyHex: SERVER_PRIVATE_KEY!,
            // storageUrl: WALLET_STORAGE,
        })

        app.use((req: Request, res: Response, next: NextFunction) => {
            res.header("Access-Control-Allow-Origin", "http://localhost:5173")
            res.header("Access-Control-Allow-Credentials", "true")
            res.header("Access-Control-Allow-Headers", 
                "Content-Type, " +
                "x-bsv-auth-version, " +
                "x-bsv-auth-message-type, " +
                "x-bsv-auth-identity-key, " +
                "x-bsv-auth-nonce, " +
                "x-bsv-auth-your-nonce, " +
                "x-bsv-auth-signature, " +
                "x-bsv-auth-request-id, " +
                "x-bsv-auth-requested-certificates"
            )
            res.header("Access-Control-Expose-Headers",
                "x-bsv-auth-version, " +
                "x-bsv-auth-message-type, " +
                "x-bsv-auth-identity-key, " +
                "x-bsv-auth-nonce, " +
                "x-bsv-auth-your-nonce, " +
                "x-bsv-auth-signature, " +
                "x-bsv-auth-request-id, " +
                "x-bsv-auth-requested-certificates"
            )
            res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
            
            if (req.method === "OPTIONS") {
                return res.sendStatus(200)
            }
            next()
        })

        const authMiddleware = createAuthMiddleware({
            wallet,
            allowUnauthenticated: false
        })

        app.use(authMiddleware)

        // Payment middleware

        app.get("/weather", async (req: AuthRequest, res) => {
            
            if (req.auth && req.auth.identityKey !== "unknown") {
                try {
                    const cityId = "5746545"
                    const apiURL = `https://api.openweathermap.org/data/2.5/weather?id=${cityId}&appid=${OPENWEATHER_API_KEY}&units=metric`

                    const response = await fetch(apiURL)

                    if (!response.ok) {
                        throw new Error("Failed to fetch weather data")
                    }

                    const weatherData = await response.json()

                    res.json(weatherData)

                } catch (error ){
                    console.error("Failed to fetch weather data", error)
                    return res.status(500).json({ error: "Failed to fetch weather data"})
                }
            }
        })

    } catch (error ) {
        console.error("Failed to initialize server", error)
    }
    
    app.listen(HTTP_PORT, () => {
        console.log(`Server running on port ${HTTP_PORT}`)
    })
}

initializeServer()