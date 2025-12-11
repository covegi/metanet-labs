import { type CreateActionArgs, type CreateActionResult, WalletClient, WERR_REVIEW_ACTIONS } from "@bsv/sdk"

export const createTransaction = async (): Promise<void> => {
    try {

        const lockingScript = '2102aaa7a5a2e386840889732be8d8264d42198f116903ed9f8f2cc9763c0e9958acac0e4d7920666972737420746f6b656e0849276d204d6174744630440220187800c3732512ef3d3ccdf741966b45f4251f879ac933160837a03d1c98a420022064c4d3fb3c07b12c47aae5baef7890e996ffa680e32fb8aa678c7f06ff0d37bd6d75'

        const wallet = new WalletClient()

        const args: CreateActionArgs = {
            description: "Create a transaction",
            outputs: [
                {
                    lockingScript,
                    satoshis: 5,
                    outputDescription: "First transaction output"
                }
            ]
        }

        const result: CreateActionResult = await wallet.createAction(args)

        if (!result.tx) {
            throw new Error("Transaction creation failed")
        }

        console.log("Transactioncreated: ", result)
        console.log("TXID: ", result.txid)

    } catch (error: unknown) {
        if (error instanceof WERR_REVIEW_ACTIONS) {
            console.log("Wallet error:", error)
        } else if (error instanceof Error) {
            console.log("Error:", error.message)
        }

        throw error
    }
}