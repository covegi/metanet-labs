import { 
    PushDrop, 
    Utils, 
    Transaction, 
    TopicBroadcaster, 
    WalletClient, 
    StorageUploader, 
    StorageUtils,
    WERR_REVIEW_ACTIONS
} from '@bsv/sdk'
import { UploadableFile } from '@bsv/sdk/storage/StorageUploader'

export async function publishCommitment({
  url,
  hostingMinutes,
  address,
  serviceURL = 'https://nanostore.babbage.systems',
  testWerrLabel = false
}: {
  url: string
  hostingMinutes: number
  address: string
  serviceURL?: string
  testWerrLabel: boolean
}): Promise<string> {
  try {
    console.log('Starting publishCommitment')
    console.log('URL:', url)
    console.log('Service URL:', serviceURL)

    // TODO 1: Fetch file from URL

    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`Failed to fetch file from ${url}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    const fileData = new Uint8Array(arrayBuffer)
    const contentLength = fileData.length

    // TODO 2: Initialize WalletClient and StorageUploader

    const wallet = new WalletClient()
    const storageUploader = new StorageUploader({
        storageURL: serviceURL,
        wallet: wallet
    })

    // TODO 3: Convert file to uploadable format

    const uploadableFile: UploadableFile = {
        data: fileData,
        type: response.headers.get("content-type") || "application/octet-stream"
    }

    // TODO 4: Upload file and get UHRP URL

    const UHRPURL = await storageUploader.publishFile({
        file: uploadableFile,
        retentionPeriod: hostingMinutes * 60
    })

    console.log('Generated UHRP URL:', UHRPURL)

    // TODO 5: Generate UHRP hash

    const UHRHash = StorageUtils.getHashFromURL(UHRPURL.uhrpURL)

    console.log('Generated UHR Hash:', UHRHash)

    // TODO 6: Calculate expiry time

    const expiryTime = Math.floor(Date.now() / 1000) + (hostingMinutes * 60)

    // TODO 7: Create and broadcast UHRP token

    const pushdrop = new PushDrop(wallet)
    const lockingScript = await pushdrop.lock(
        [
            Utils.toArray("1UHRPYnMHPuQ5Tgb3AF8JXqwKkmZVy5hG"),
            UHRHash,
            Utils.toArray(UHRPURL.uhrpURL),
            Utils.toArray(expiryTime.toString()),
            Utils.toArray(contentLength.toString())
        ],
        [1, "tm uhrp"],
        "1",
        "self"
    )

    const tx = await wallet.createAction({
        description: "Create UHRP commitment",
        outputs: [
            {
                outputDescription: "UHRP token",
                lockingScript: lockingScript.toHex(),
                satoshis: 1
            }
        ]
    })

    const broadcaster = new TopicBroadcaster(['tm_uhrp'], {
      networkPreset: 'local'
    })
    await broadcaster.broadcast(Transaction.fromAtomicBEEF(tx.tx!))


    console.log('Transaction created and broadcasted:', tx.txid ?? "unknown")
    console.log('[commitmentToken] Token created with TXID:', tx.txid ?? "unknown")
    return `${UHRPURL.uhrpURL}`
  } catch (error) {
    console.error('Error creating commitment:', error)
    throw error
  }
}   