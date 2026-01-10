import express, { Request, Response, NextFunction, RequestHandler } from "express"
import bodyParser from "body-parser"
import dotenv from "dotenv"
import { Setup, sdk } from "@bsv/wallet-toolbox"
import { createAuthMiddleware, AuthRequest } from "@bsv/auth-express-middleware"
import { PrivateKey, PubKeyHex, VerifiableCertificate } from "@bsv/sdk"

const app = express()
app.use(bodyParser.json())

const initializeServer = async () => {
    dotenv.config()

    const wallet = await Setup.createWalletClientNoEnv({
        chain: "main",
        rootKeyHex: process.env.SERVER_PRIVATE_KEY!
    })

    app.use((req, res, next) => {
        res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173")
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-bsv-auth-identity-key, x-bsv-auth-certificate, x-bsv-auth-signature, x-bsv-auth-your-nonce, x-bsv-auth-nonce, x-bsv-auth-request-id, x-bsv-auth-version")
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
        res.setHeader("Access-Control-Expose-Headers", "Content-Length, X-Custom-Header, x-bsv-auth-identity-key, x-bsv-auth-certificate, x-bsv-auth-signature, x-bsv-auth-your-nonce, x-bsv-auth-nonce, x-bsv-auth-request-id, x-bsv-auth-version")
        res.setHeader("Access-Control-Allow-Private-Network", "true")

        if (req.method === "OPTIONS") {
            return res.sendStatus(200)
        }

        next()
    })

    const authMiddleware = createAuthMiddleware({
        wallet: wallet,
        allowUnauthenticated: false
    })

    app.use(authMiddleware)

    app.get("/", (req, res) => {
        res.send("Hello, world!")
    })

    app.get("/protected", (req: AuthRequest, res) => {
        if(req.auth && req.auth.identityKey) {
            if (req.headers['x-bsv-auth-version']) 
                res.setHeader('x-bsv-auth-version', req.headers['x-bsv-auth-version'] as string)
            if (req.headers['x-bsv-auth-identity-key']) 
                res.setHeader('x-bsv-auth-identity-key', req.headers['x-bsv-auth-identity-key'] as string)
            if (req.headers['x-bsv-auth-signature']) 
                res.setHeader('x-bsv-auth-signature', req.headers['x-bsv-auth-signature'] as string)
            res.send(`Hello, authenticated peer with public key: ${req.auth.identityKey}`)
        } else {
            res.status(401).send("Unauthorized")
        }
    })

    const PORT = 3000
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`)
    })
    
}

initializeServer()

