import { WalletClient } from "@bsv/sdk"

const client = new WalletClient("auto", "localhost")

export default async function checkForMetanetClient() {
    try {
        const { network: result } = await client.getNetwork()
        if (result === "mainnet" || result === "testnet") {
            return 1
        } else {
            return -1
        }
    } catch (error) {
        return 0
    }
}