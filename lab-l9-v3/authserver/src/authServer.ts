import express, { Request, Response, NextFunction, RequestHandler } from "express"
import bodyParser from "body-parser"
import dotenv from "dotenv"
import { SetupClient, sdk } from "@bsv/wallet-toolbox"
import { createAuthMiddleware, AuthRequest } from "@bsv/auth-express-middleware"
import { PubKeyHex, VerifiableCertificate, WalletClient } from "@bsv/sdk"

const {
    SERVER_PRIVATE_KEY= "055d459c8d7cba2f8d22155093beb97848cf6b903f3af0a3c4eb45bac2dc236e"
} = process.env

const initializeServer = async () => {
    const app = express()
    app.use(bodyParser.json())

        const wallet = await SetupClient.createWalletClientNoEnv({
            chain: "main",
            rootKeyHex: SERVER_PRIVATE_KEY
        })

        const authMiddleware = createAuthMiddleware({
            wallet,
            allowUnauthenticated: false
        })

    const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
        res.header('Access-Control-Allow-Origin', '*')
        res.header('Access-Control-Allow-Headers', '*')
        res.header('Access-Control-Allow-Methods', '*')
        res.header('Access-Control-Expose-Headers', '*')
        res.header('Access-Control-Allow-Private-Network', 'true')
        if (req.method === 'OPTIONS') {
        res.sendStatus(200)
        return
    }
        next()
    }

    app.use(corsMiddleware)

    app.use(authMiddleware)

    app.get("/", (req, res) => {
        res.send("Hello world!")
    })

    app.get("/protected", (req: AuthRequest, res: Response, next: NextFunction) => {
        if (req.auth && req.auth.identityKey !== "unknown") {
            return res.send(`Hello, authenticated peer with key: ${req.auth.identityKey}`)
        } else {
            return res.status(401).send("Unauthorized")
        }
    })

    app.listen(3000, () => {
        console.log("Server is running on port 3000")
    })

}

initializeServer()
