import express, { type Request, type Response, type NextFunction, type RequestHandler } from "express"
import bodyParser from "body-parser"
import dotenv from "dotenv"
import { Setup, sdk } from "@bsv/wallet-toolbox"
import { createAuthMiddleware, AuthRequest } from "@bsv/auth-express-middleware"
import { PubKeyHex, VerifiableCertificate, Utils } from "@bsv/sdk"

import { createPaymentMiddleware } from "@bsv/payment-express-middleware"
import crypto from "crypto"

dotenv.config()

if (!globalThis.crypto) {
    (globalThis as any).crypto = crypto
}
if (!globalThis.crypto.subtle) {
    (globalThis.crypto as any).subtle = (crypto as any).webcrypto.subtle
}

const {
    SERVER_PRIVATE_KEY = '',
    WALLET_STORAGE_URL = '',
    HTTP_PORT = '',
    CERTIFIER_IDENTITY_KEY = '',
    CERTIFICATE_TYPE_ID = '',
    OPENWEATHER_API_KEY = ''
  } = process.env

type CertificateMap = Record<PubKeyHex, VerifiableCertificate[]>
const CERTIFICATES_RECEIVED: CertificateMap = {}

async function init() {
    const app = express()
    const port = parseInt(HTTP_PORT, 10)

    app.use(bodyParser.json({ limit: "64mb"}))

    const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
        res.header("Access-Control-Allow-Origin", "*")
        res.header("Access-Control-Allow-Headers", "*")
        res.header("Access-Control-Allow-Methods", "*")
        res.header("Access-Control-Expose-Headers", "*")
        res.header("Access-Control-Allow-Private-Network", "true")
        res.header("Access-Control-Max-Age", "86400")
        if (req.method === "OPTIONS") {
            res.sendStatus(200)
            return
        }
        next()
    }
    app.use(corsMiddleware)

    const wallet = await Setup.createWalletClientNoEnv({
        chain: "main" as sdk.Chain,
        rootKeyHex: SERVER_PRIVATE_KEY,
        storageUrl: WALLET_STORAGE_URL
    })

    const authMiddleware = createAuthMiddleware({
        wallet,
        allowUnauthenticated: false,
        logger: console,
        logLevel: "debug",
        // certificatesToRequest: {
        //     certifiers: [CERTIFIER_IDENTITY_KEY],
        //     types: {
        //         [CERTIFICATE_TYPE_ID]: ["cool"]
        //     },
        // },
        // onCertificatesReceived: (
        //     senderPublicKey: string,
        //     certs: VerifiableCertificate[], 
        //     req: AuthRequest,
        //     res: Response,
        //     next: NextFunction
        // ) => {
        //     console.log("CERTS received from", senderPublicKey, certs)
        //     if (!CERTIFICATES_RECEIVED[senderPublicKey]) {
        //         CERTIFICATES_RECEIVED[senderPublicKey] = []
        //     }
        //     CERTIFICATES_RECEIVED[senderPublicKey].push(...certs)
        //     next()
        // }
    })

    app.use(authMiddleware)

    const paymentMiddleware = createPaymentMiddleware({
        wallet,
        calculateRequestPrice: async (req) => {
            console.log("=== PAYMENT MIDDLEWARE: Calculating price ===")
            return 50
        }
    })

    interface PaymentRequest extends AuthRequest {
        payment?: {
            satoshisPaid: number,
            accepted: boolean,
            tx: any
        }
    }

    app.use(paymentMiddleware)

    app.post("/weather", async (req: Request, res: Response) => {
        console.log("=== WEATHER ROUTE HIT ===")
        const payReq = req as PaymentRequest

        try {
            const cityId = "5746545"
            const apiURL = `https://api.openweathermap.org/data/2.5/weather?id=${cityId}&appid=${OPENWEATHER_API_KEY}&units=metric`

            const weatherResponse = await fetch(apiURL)

            if (!weatherResponse.ok) {
                throw new Error("Failed to fetch weather data")
            }

            const weatherData = await weatherResponse.json()

            console.log(`Payment received: ${payReq.payment?.satoshisPaid || 0} sats`)

            res.json(weatherData)

        } catch (error) {
            console.error("Weather fetch error:", error)
            res.status(500).json({ error: "Failed to fetch weather data"})
        }
    })

    app.listen(port, () => {
        console.log(`Weather API server is running on port ${port} http://localhost:${port}`)
      })
}

init().catch(err => {
    console.error('Failed to initialize server:', err)
})
