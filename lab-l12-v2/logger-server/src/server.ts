import express, { Express, Request, Response, NextFunction, RequestHandler } from "express"
import bodyParser from "body-parser"
import dotenv from "dotenv"
import { SetupClient, sdk } from "@bsv/wallet-toolbox"
import { EventLogger, EventLogResult } from "./EventLogger.js"

dotenv.config()

const SERVER_PRIVATE_KEY = process.env.SERVER_PRIVATE_KEY || ''
const WALLET_STORAGE_URL = process.env.WALLET_STORAGE_URL || 'https://storage.babbage.systems'
const BSV_NETWORK = process.env.BSV_NETWORK || 'main'

interface LogEventRequest {
    eventData: Record<string, any>
}

interface LogEventResponse {
    txid: string,
    message: string
}

const app: Express = express()
const port = process.env.PORT || 3000

async function initialize() {
    // TODO 1: Initialize BSV wallet
    const wallet = await SetupClient.createWalletClientNoEnv({
        chain: BSV_NETWORK as sdk.Chain,
        rootKeyHex: SERVER_PRIVATE_KEY,
        storageUrl: WALLET_STORAGE_URL
    })
    // TODO 2: Create EventLogger instance
    const eventLogger = new EventLogger(wallet)
    // TODO 3: Configure body-parser middleware
    app.use(bodyParser.json())
    // TODO 4: Set up CORS middleware
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
    // TODO 5: Implement /log-event POST endpoint
    app.post("/log-event", async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { eventData } = req.body as LogEventRequest
            const result: LogEventResponse = await eventLogger.logEvent(eventData)
            res.json(result)
        } catch (error) {
            console.error("[/log-event] Error:", error)
            res.status(500).json({ error: "Failed to log event" })
        }
    })
    // TODO 6: Implement /retrieve-logs GET endpoint
    app.get("/retrieve-logs", async (req: Request, res: Response, next: NextFunction) => {
        try {
            const logs: EventLogResult[] = await eventLogger.retrieveLogs()
            res.json({ logs: logs.map(log => log.txid)})
        } catch (error) {
            console.error("[/retrieve-logs] Error:", error)
            res.status(500).json({ error: "Failed to retrieve logs" })
        }
    })
    // TODO 7: Start the Express server
    app.listen(port, () => {
        console.log(`Server running on port:${port}`)
    })
  }
  
  initialize().catch(err => {
    console.error('Failed to initialize backend wallet:', err)
    process.exit(1)
  })