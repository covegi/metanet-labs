import { MessageBoxClient } from "@bsv/message-box-client"
import { WalletClient } from "@bsv/sdk"

const MESSAGEBOX_HOST = 'https://messagebox.babbage.systems'

let client: MessageBoxClient
let walletClient: WalletClient

// Purpose: Initialize (initialize MessageBoxClient and WalletClient)

export async function initializeClient() {
    try {
        console.log("[initializeClient] creating WalletClient...")
        walletClient = new WalletClient("json-api", "localhost")

        console.log("[initializeClient] Creating MessageBoxClient")
        client = new MessageBoxClient({
            host: MESSAGEBOX_HOST,
            networkPreset: "mainnet",
            walletClient,
            enableLogging: true
        })

        console.log("[initializeClient] Initializing MessageBoxClient...")

        await client.init()

        console.log("[initializeClient] MessageBoxClient initialized successfully.")

    } catch (error) {

        console.log("[initializeClient] Failed", error)

        throw error
    }
}

// Purpose: Fetch (user's public key)

export async function getMyIdentityKey(): Promise<string> {
    try {
        console.log("[getMyIdentityKey] Fetching public identity key...")

        const { publicKey } = await walletClient.getPublicKey({ identityKey: true})

        console.log('[getMyIdentityKey] Fetched identity key:', publicKey)

        return publicKey

    } catch (error) {
        console.error("[getMyIdentityKey] Failed to fetch identity key:", error)

        throw error
    }
}

// Purpose: Send (a message to a given recipient's identity key)

export async function sendMessage( recipient: string, body: string ) {
    try {
        console.log('[sendMessage] Sending message to:', recipient)
        await client.sendMessage({
            recipient,
            messageBox: "L3_inbox",
            body
        })
        console.log('[sendMessage] Message sent successfully.')
    } catch (error) {
        console.error("[sendMessage] Failed to send message:", error)

        throw error
    }
}

// Purpose: List (incoming messages from the configured inbox)

export async function listMessages() {
    try {
        console.log('[listMessages] Listing messages from inbox...')
        const messages = await client.listMessages({
            messageBox: "L3_inbox"
        })
        console.log("[listMessages] Messages retrieved:", messages)
        console.log("[listMessages] Message count:", messages.length)
        return messages
    } catch (error) {
        console.error("[listMessages] Failed to list messages:", error)

        throw error
    }
}

// Purpose: Acknowledge (a list of message IDs to remove them from the inbox)

export async function acknowledgeMessages( messageIds: string[] ) {
    try {
        console.log('[acknowledgeMessages] Acknowledging messages:', messageIds)
        await client.acknowledgeMessage({ messageIds })
        console.log('[acknowledgeMessages] Messages acknowledged successfully.')
    } catch (error) {
        console.error("[acknowledgeMessages] Failed to acknowledge messages:", error)

        throw error
    }
}