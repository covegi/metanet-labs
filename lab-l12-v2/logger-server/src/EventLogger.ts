import { PushDrop, Utils, Transaction, WalletInterface, WERR_REVIEW_ACTIONS } from "@bsv/sdk"

export interface EventLogResult {
    txid: string,
    message: string,
    timestamp: string
} 

export class EventLogger {
    private wallet: WalletInterface
    private pushdrop: PushDrop

    private readonly PROTOCOL_ID: [1, string] = [1, 'Event Logger']
    private readonly KEY_ID = '1'
    private readonly BASKET_NAME = 'event logs v2'

    constructor(wallet: WalletInterface) {
        this.wallet = wallet
        this.pushdrop = new PushDrop(wallet)
    }

    async logEvent(
        eventData: Record<string, any>,
        testWerrLabel = false
    ): Promise<Omit<EventLogResult, "timestamp">> {
        // TODO 1: Validate eventData and enhance error handling
        if (!eventData || Object.keys(eventData).length === 0) {
            throw new Error("Event data is required")
        }

        const timestamp = new Date().toISOString()
        const ip = "unknown"
        const endpoint = "/log-event"

        const payload = {
            ip,
            timestamp,
            endpoint,
            ...eventData
        }

    
    // TODO 2: Validate PushDrop script generation
    const lockingScript = await this.pushdrop.lock(
        [Utils.toArray(JSON.stringify(payload))],
        this.PROTOCOL_ID,
        this.KEY_ID,
        "self"
    )
    // TODO 3: Validate transaction ID and handle broadcast errors

    try {
        const tx = await this.wallet.createAction({
            description: "Log event to blockchain",
            outputs: [
                {
                    outputDescription: "Event log entry",
                    basket: this.BASKET_NAME,
                    lockingScript: lockingScript.toHex(),
                    satoshis: 1
                }
            ]
        })

        if (!tx || !tx.txid) {
            throw new Error("No transaction created. No txid returned.")
        }

        return {
            txid: tx.txid,
            message: "Event logged successfully"
        }
    } catch (err: unknown) {
        if (err instanceof WERR_REVIEW_ACTIONS) {
          console.error('[logEvent] Wallet threw WERR_REVIEW_ACTIONS:', {
            code: err.code,
            message: err.message,
            reviewActionResults: err.reviewActionResults,
            sendWithResults: err.sendWithResults,
            txid: err.txid,
            tx: err.tx,
            noSendChange: err.noSendChange
          })
        } else if (err instanceof Error) {
          console.error('[logEvent] Failed with error status:', {
            message: err.message,
            name: err.name,
            stack: err.stack,
            error: err
          })
        } else {
          console.error('[logEvent] Failed with unknown error:', err)
        }
        throw err
    }}
  
    async retrieveLogs(): Promise<EventLogResult[]> {
      console.log('[retrieveLogs] Fetching outputs from basket:', this.BASKET_NAME)
  
      // TODO 4: Optimize log retrieval for large datasets

      const { BEEF, outputs } = await this.wallet.listOutputs({
        basket: this.BASKET_NAME,
        include: "entire transactions",
        limit: 100,
        offset: 0
      })
  
      if (!BEEF) {
        console.warn('[retrieveLogs] No BEEF returned, cannot proceed.')
        return []
      }
  
      const logs: EventLogResult[] = []
  
      // TODO 5: Process blockchain data with validation and optimization

      await Promise.all(
        outputs.map(async (entry: any) => {
            try {
                const outpointParts = entry.outpoint.split(".")
                if (outpointParts.length !== 2) return null

                const [ txid, voutStr ] = outpointParts
                const vout = parseInt(voutStr, 10)
                if (isNaN(vout)) return null

                const tx = Transaction.fromBEEF(BEEF, txid)
                const output = tx.outputs[vout]
                if (!output) return null

                const decoded = PushDrop.decode(output.lockingScript)
                if (!decoded.fields || decoded.fields.length === 0) return null

                const payloadStr = Utils.toUTF8(decoded.fields[0])
                const payloadJSON = JSON.parse(payloadStr)

                if (!payloadJSON.message) return null

                logs.push({
                    txid,
                    message: payloadJSON.message,
                    timestamp: payloadJSON.timestamp
                })
            } catch (error) {
                console.warn("[retrieveLogs] Failed to process output", error)
              }
        })
      )
  
      return logs
    }
  }