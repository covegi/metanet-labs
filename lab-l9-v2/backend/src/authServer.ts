(globalThis as any).self = globalThis

import express, { Request, Response, NextFunction, RequestHandler } from "express"
import bodyParser from "body-parser"
import dotenv from "dotenv"
import { Setup, sdk } from "@bsv/wallet-toolbox"
import { createAuthMiddleware, AuthRequest } from "@bsv/auth-express-middleware"
import { PubKeyHex, VerifiableCertificate } from "@bsv/sdk"

const app = express()
app.use(bodyParser.json())

const initialize = async () => {
    dotenv.config()

    try {
        const wallet = await Setup.createWalletClientNoEnv({
            chain: "main",
            rootKeyHex: process.env.SERVER_PRIVATE_KEY!
        })

       app.use((req: Request, res: Response, next: NextFunction) => {
            res.header("Access-Control-Allow-Origin", "http://localhost:5174")
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

        app.get("/", (req, res) => {
            res.send("Hello world!")
        })

        app.get("/protected", (req: AuthRequest, res) => {
            if (req.auth && req.auth.identityKey !== "unknown") {
                return res.send(`Hello, authenticated peer with key: ${req.auth.identityKey}`)
            } else {
                return res.status(401).send("Unauthorized")
            }
        })

    } catch (error) {
        console.error(error)
    }

    const PORT = 3000
    app.listen(PORT, () => {
        console.log("Server is running on port 3000")
    })
}

initialize()