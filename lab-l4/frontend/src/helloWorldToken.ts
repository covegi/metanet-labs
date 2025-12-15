import { WERR_REVIEW_ACTIONS, WalletClient } from "@bsv/sdk"
import { createToken, queryTokens } from "hello-tokens"

const walletClient = new WalletClient("json-api", "localhost")

export async function createAndSubmitToken(message: string): Promise<void> {
    
    try {
        console.log("[createAndSubmitToken] Creating token with message:", message)
  
        await createToken(
                message,
                walletClient
            )

        console.log("[createAndSubmitToken] Token created and submitted successfully!")
    } catch (error: unknown) {
        if (error instanceof WERR_REVIEW_ACTIONS) {
            console.error("[createAndSubmitToken]", {
                code: error.code,
                message: error.message,
                reviewActionResults: error.reviewActionResults,
                sendWithResults: error.sendWithResults,
                txid: error.txid,
                tx: error.tx
            })
        } else if (error instanceof Error) {
            console.error("[createAndSubmitToken]", {
                message: error.message,
                name: error.name,
                stack: error.stack,
                error: error
            })
        } else {
            console.error("[createAndSubmitToken]", error)
        }

        throw error
    }
}

export async function queryToken(originalMessage: string): Promise<string> {
    try {
        console.log('[queryToken] Querying tokens with message:', originalMessage)

        const results = await queryTokens({
            limit: 10,
            message: originalMessage,
        })
        console.log("[queryToken] Query results:", results)

        if (!results || results.length === 0) {
            console.error("[queryToken] No tokens found")
            throw Error("No Hello World tokens found")
        }

        const firstMessage = results[0].message
        console.log("[queryToken] First matched message:", firstMessage)

        return firstMessage

    } catch (error) {
        console.error("[queryToken] Query failed:", error)

        throw error
    }
}