import { AdmittanceInstructions, TopicManager } from "@bsv/overlay"
import { Transaction, PushDrop, Utils } from "@bsv/sdk"
import uhrpTopicDocs from "./UHRPTopicDocs.md.js"

export default class UHRPTopicManager implements TopicManager {
    identifyNeededInputs?: ((beef: number[]) => Promise<Array<{ txid: string; outputIndex: number }>>) | undefined
    async getDocumentation(): Promise<string> {
      return uhrpTopicDocs
    }
  
    async getMetaData(): Promise<{ name: string; shortDescription: string; iconURL?: string; version?: string; informationURL?: string }> {
      return {
        name: 'Universal Hash Resolution Protocol',
        shortDescription: 'Manages UHRP content availability advertisements.'
      }
    }
  
    async identifyAdmissibleOutputs(beef: number[], previousCoins: number[]): Promise<AdmittanceInstructions> {
      try {
        console.log('previous UTXOs', previousCoins.length)
        const outputs: number[] = []
        const parsedTransaction = Transaction.fromBEEF(beef)
  
        for (const [i, output] of parsedTransaction.outputs.entries()) {
          try {
   
           // TODO 1: Decode UHRP token

           const decoded = PushDrop.decode(output.lockingScript)

           // TODO 2: Validate token fields

           const protocolAddress = Utils.toUTF8(decoded.fields[0])
           if (protocolAddress !== "1UHRPYnMHPuQ5Tgb3AF8JXqwKkmZVy5hG") {
            throw new Error("Invalid protocol address")
           }

           if (decoded.fields[1].length !== 32) {
            throw new Error("Invalid hash length")
           }

           const url = Utils.toUTF8(decoded.fields[2])
           if (!url || url.length === 0) {
            throw new Error("Invalid URL")
          }

          const expiryBytes = decoded.fields[3]
          const expiryTime = Utils.toArray(expiryBytes, 'hex')
            ? parseInt(Buffer.from(expiryBytes).readUInt32LE(0).toString()) 
            : 0
            
            if (isNaN(expiryTime) || expiryTime <= 0) {
              throw new Error("Invalid expiry time")
            }

            const fileSize = decoded.fields[4].reduce(
              (acc: number, byte: number, i: number) => acc + byte * Math.pow(256, i), 0
            )
            if (isNaN(fileSize) || fileSize <= 0) {
              throw new Error("Invalid file size")
            }
   
            outputs.push(i)
          } catch (error) {
            console.error('Error with output', i, error)
          }
        }
  
        if (outputs.length === 0) {
          throw new Error('This transaction does not publish a valid UHRP token!')
        }
  
        return {
          coinsToRetain: previousCoins,
          outputsToAdmit: outputs
        }
      } catch (error: any) {
        console.error('Admittance failed:', error.message)
        return {
          coinsToRetain: [],
          outputsToAdmit: []
        }
      }
    }
  }