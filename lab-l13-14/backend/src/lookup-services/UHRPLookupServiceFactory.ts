import { AdmissionMode, LookupService, OutputAdmittedByTopic, OutputSpent, SpendNotificationMode } from '@bsv/overlay'
import { PushDrop, Utils, StorageUtils } from '@bsv/sdk'
import { UHRPRecord, UTXOReference } from '../types.js'
import { Db, Collection } from 'mongodb'
import uhrpLookupDocs from './UHRPLookupDocs.md.js'

class UHRPLookupService implements LookupService {
  readonly admissionMode: AdmissionMode = 'locking-script'
  readonly spendNotificationMode: SpendNotificationMode = 'none'
  records: Collection<UHRPRecord>

  constructor(db: Db) {
    this.records = db.collection<UHRPRecord>('uhrp')
    this.lookup = this.lookup.bind(this)
  }

  async getDocumentation(): Promise<string> {
    return uhrpLookupDocs
  }

  async getMetaData(): Promise<{ name: string; shortDescription: string; iconURL?: string; version?: string; informationURL?: string }> {
    return {
      name: 'UHRP Lookup Service',
      shortDescription: 'Lookup Service for User file hosting commitment tokens'
    }
  }

  async outputAdmittedByTopic(payload: OutputAdmittedByTopic) {
    if (payload.mode !== 'locking-script') throw new Error('Invalid payload')
    const { topic, txid, outputIndex, lockingScript } = payload
    if (topic !== 'tm_uhrp') return

    const decoded = PushDrop.decode(lockingScript)

    const uhrpUrl = Utils.toUTF8(decoded.fields[2])
    const expiryTime = Number(Utils.toUTF8(decoded.fields[3]))
    const fileSize = Number(Utils.toUTF8(decoded.fields[4]))

    await this.records.updateOne(
      { txid, outputIndex },
      { 
        $set: {
          txid,
          outputIndex,
          uhrpUrl,
          expiryTime,
          fileSize,
          hostIdentityKey: decoded.lockingPublicKey?.toString() || ''
        }
      },
      { upsert: true }
    )

    console.log(`Commitment stored: ${uhrpUrl}`)
  }

  async outputSpent(payload: OutputSpent) {
    if (payload.mode !== 'none') throw new Error('Invalid payload')
    const { topic, txid, outputIndex } = payload
    if (topic !== 'tm_uhrp') return

    // TODO 3: Remove spent commitment

    await this.records.deleteOne({ txid, outputIndex })

  }

  async outputEvicted(txid: string, outputIndex: number) {

    // TODO 4: Remove evicted commitment

    await this.records.deleteOne({ txid, outputIndex })

  }

  async lookup (params: any): Promise<UTXOReference[]> {
    console.log("!!! LOOKUP CALLED !!!")
    // TODO 5: Validate query
    // TODO 6: Handle query

    const query = params.query ? params.query : params

    if (!query || Object.keys(query).length === 0) {
        throw new Error("Invalid query parameter");
    }

    let filter: any = {}
    if (query.txid && query.outputIndex !== undefined) {
        filter = { txid: query.txid, outputIndex: Number(query.outputIndex) }
    } else if (query.uhrpUrl) {
        filter = { uhrpUrl: query.uhrpUrl }
    } else if (query.expiryTime) {
        filter = { expiryTime: Number(query.expiryTime) }
    } else if (query.hostIdentityKey) {
        filter = { hostIdentityKey: query.hostIdentityKey }
    } else {
        throw new Error("Invalid query parameter")
    }

    const results = await this.records.find(filter).toArray()
    console.log('MongoDB results:', JSON.stringify(results, null, 2))
    if (results.length > 0) {
      console.log(`Queried commitment: ${results[0].uhrpUrl}`)
    }

  return results.map(result => ({ 
    txid: result.txid, 
    outputIndex: result.outputIndex,
    uhrpUrl: result.uhrpUrl,
    expiryTime: result.expiryTime,
    fileSize: result.fileSize
  }))
}

}

export default (db: Db) => {
  const service = new UHRPLookupService(db);

  return {
    admissionMode: service.admissionMode,
    spendNotificationMode: service.spendNotificationMode,
    getDocumentation: service.getDocumentation.bind(service),
    getMetaData: service.getMetaData.bind(service),
    outputAdmittedByTopic: service.outputAdmittedByTopic.bind(service),
    outputSpent: service.outputSpent.bind(service),
    outputEvicted: service.outputEvicted.bind(service),
    lookup: (params: any) => service.lookup(params)
  };
};
