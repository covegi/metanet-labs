import {
    WalletClient,
    PushDrop,
    Utils,
    LockingScript,
    Transaction,
    WalletProtocol,
    WERR_REVIEW_ACTIONS
  } from '@bsv/sdk'
  import { v4 as uuidv4 } from 'uuid'
  
  export interface CardData {
    name: string
    description: string
    rarity: string
    ability: string
    history: string
    sats: number
    txid: string
    outputIndex: number
    outputScript: string
    keyID: string
    envelope?: any
  }
  
  const PROTOCOL_ID: WalletProtocol = [1, 'card collectibles']
  const BASKET_NAME = 'cards'
  
  const walletClient = new WalletClient('json-api', 'localhost')
  const pushdrop = new PushDrop(walletClient)
  
  function generateUniqueKeyID(): string {
    return uuidv4()
  }
  
  export async function createCard(
    card: Omit<
      CardData,
      'txid' | 'outputIndex' | 'outputScript' | 'envelope' | 'keyID'
    >,
    testWerrLabel = false
  ): Promise<void> {
    try {
        const keyID = generateUniqueKeyID()

        const defaultHistory = card.history || `Card created on ${new Date().toLocaleString()}`

        const cardAttributesObj = {
            name: card.name,
            description: card.description,
            rarity: card.rarity,    
            ability: card.ability,
            history: defaultHistory
        }

        const cardAttributesJSON = JSON.stringify(cardAttributesObj)
        const cardAttributes = Utils.toArray(cardAttributesJSON, "utf8")

        const lockingScript = await pushdrop.lock(
            [cardAttributes],
            PROTOCOL_ID,
            keyID,
            "self",
            true
        )

        const transaction = await walletClient.createAction({
            description: "card token",
            outputs: [{
                outputDescription: "collectible card token",
                lockingScript: lockingScript.toHex(),
                satoshis: card.sats,
                basket: BASKET_NAME,
                customInstructions: JSON.stringify({ 
                    keyID, 
                    history: defaultHistory
                })
            }],
            options: {
                randomizeOutputs: false,
                acceptDelayedBroadcast: false
            }
        })
    } catch (error: unknown) {
        if (error instanceof WERR_REVIEW_ACTIONS) {
            throw new Error("Transaction requires review before broadcast")
        }
        if (error instanceof Error) {
            throw new Error("Unknown error during task creation")
        }
    }
  }
  
  export async function loadCards(): Promise<CardData[]> {
    try {
        const collectibleCardTokens = await walletClient.listOutputs({
            basket: BASKET_NAME,
            include: "entire transactions",
            includeCustomInstructions: true,
        })
        const { outputs, BEEF } = collectibleCardTokens

        if (!BEEF) throw new Error("BEEF data not available")

            const cards = outputs.map(x => {
                try {
                    const [txid, outputIndexStr] = x.outpoint.split(".")
                    const outputIndex = parseInt(outputIndexStr, 10)

                    const transaction = Transaction.fromBEEF(BEEF, txid)
                    const output = transaction.outputs[outputIndex]
                    const lockingScript = output.lockingScript

                    const decoded = PushDrop.decode(lockingScript)
                    const cardAttributesJSON = decoded.fields[0]
                    const jsonString = Utils.toUTF8(cardAttributesJSON)
                    const cardAttributes = JSON.parse(jsonString)
                    
                    const customInstructions = x.customInstructions
                    const { keyID, history } = customInstructions ? JSON.parse(customInstructions) : { keyID: "", history: "" }

                    const cardObj: CardData = {
                        name: cardAttributes.name,
                        description: cardAttributes.description,
                        rarity: cardAttributes.rarity,
                        ability: cardAttributes.ability,
                        sats: x.satoshis,
                        txid: txid,
                        outputIndex: outputIndex,
                        outputScript: output.lockingScript.toHex(),
                        keyID: keyID,
                        history: history
                    }

                        return cardObj

                } catch (error) {
                    console.warn('Failed to parse card:', error)
                    return null
                }
            })
            const cleanCards = cards.filter((obj): obj is CardData => obj !== null)
            return cleanCards

    } catch (error: unknown) {
        if (error instanceof WERR_REVIEW_ACTIONS) {
            throw new Error("Transaction requires review before broadcast")
        }
        if (error instanceof Error) {
            throw new Error("Unknown error during task creation")
        }
        return []
    }
}

  export async function redeemCard(card: CardData): Promise<void> {
    try {
        const beefData = await walletClient.listOutputs({
            basket: BASKET_NAME,
            include: "entire transactions"  
        })

        if(!beefData.BEEF) throw new Error("BEEF data not available")

        const lockingScript = LockingScript.fromHex(card.outputScript)

        const unlocker = pushdrop.unlock(
            PROTOCOL_ID,
            card.keyID,
            "self",
            "all",
            false,
            card.sats,
            lockingScript
        )

        const action = await walletClient.createAction({
            description: "redeem card",
            inputBEEF: beefData.BEEF,
            inputs: [
                {
                    outpoint: `${card.txid}.${card.outputIndex}`,
                    unlockingScriptLength: 73,
                    inputDescription: "mystery cards"
                }
            ],
            outputs: [],
            options: {
                randomizeOutputs: false, 
                acceptDelayedBroadcast: false
            }
        })

        const unlockingScript = await unlocker.sign(
            Transaction.fromBEEF(action.signableTransaction!.tx),
            0
        )

        await walletClient.signAction({
            reference: action.signableTransaction!.reference,
            spends: {
                0: {
                    unlockingScript: unlockingScript.toHex()
                }
            },
        })

        } catch (error) {
            if (error instanceof WERR_REVIEW_ACTIONS) {
                throw new Error("Transaction requires review before broadcast")
            }
            if (error instanceof Error) throw error
            throw new Error("Unknown error during task creation")
        }
    }

    export async function updateCardHistory(card: CardData, newEntry: string): Promise<void> {
        try {
            await redeemCard(card)

            const timeStamp = new Date().toLocaleString()
            const newHistoryEntry = `${newEntry} ${timeStamp}`
            const updateHistory = card.history 
            ? `${card.history}\n${newHistoryEntry}`
            : newHistoryEntry

            await createCard({
                name: card.name,
                description: card.description,
                rarity: card.rarity,
                ability: card.ability,
                history: updateHistory,
                sats: card.sats
            })
        } catch (error) {
            console.error("Failed to update card history:", error)
            throw error
        }
    }