import express, { Express, RequestHandler } from "express"
import bodyParser from "body-parser"
import dotenv from "dotenv"
import { Setup, sdk } from "@bsv/wallet-toolbox"
import { EventLogger, EventLogResult } from "./EventLogger.js"

dotenv.config()

const SERVER_PRIVATE_KEY = process.env.SERVER_PRIVATE_KEY!
const WALLET_STORAGE_URL = process.env.WALLET_STORAGE_URL
const BSV_NETWORK = process.env.BSV_NETWORK

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

    const wallet = await Setup.createWalletClientNoEnv({
        chain: BSV_NETWORK as sdk.Chain,
        rootKeyHex: SERVER_PRIVATE_KEY,
        storageUrl: WALLET_STORAGE_URL
        }
    )

    const eventLogger = new EventLogger(wallet)

    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: true }))

    app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*")
        res.header("Access-Control-Allow-Headers", "*")
        res.header("Access-Control-Allow-Methods", "*")
        if (req.method === "OPTIONS") {
            res.sendStatus(200)
        } else {
            next()
        }
    })

    app.post("/log-event", async (req, res) => {
        try {
            const { eventData } = req.body as LogEventRequest

            console.log("[eventData]", eventData)

            if (!eventData)  {
                res.status(400).json({ message: "Event data is required"})
                return
            }

            const result = await eventLogger.logEvent(eventData)

            console.log("[RESULT: MESSAGE]", result.message)

            res.status(200).json({
                txid: result.txid,
                message: result.message
            } as LogEventResponse)

        } catch (error) {
            console.error("Error logging event", error)
            res.status(500).json({
                message: "Failed to log event to blockchain"
            })
        }
    }) as RequestHandler

    app.get("/retrieve-logs", async (req, res, next ) => {
        try {
            const logs = await eventLogger.retrieveLogs()
            console.log("[RETRIEVE LOGS]", logs)

            res.status(200).json({ logs })
        } catch (error) {
            console.error("Error retrieving logs", error)
            res.status(500).json({ message: "Failed to retrieve logs from blockchain"})
        }
    }) as RequestHandler

    app.listen(port, () => {
        console.log(`Server running on port ${port}`)
    })
}

initialize().catch(error => {
    console.error("Failed to initialize server", error)
    process.exit(1)
})