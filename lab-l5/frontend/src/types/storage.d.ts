import { UploadableFile } from "@bsv/sdk/dist/types/src/storage/StorageUploader"

declare module "@bsv/sdk/storage/StorageUploader" {
    import { WalletClient } from "@bsv/sdk"

    interface StorageUploaderOptions {
        storageUrl: string,
        wallet: WalletClient
    }

    interface ListUploaderResult {
        uhrpUrl: string,
        expiryDate: number
    }

    interface FindFileData {
        name: string,
        size: string,
        mimeType: string,
        expiryDate: number
    }

    interface RenewFileResult {
        status: string,
        prevExpiryTime?: number,
        newExpiryTime?: number,
        amount: number
    }

    export class StorageUploader {
        constructor(options: StorageUploaderOptions)

        publishFile(params: {
            file: UploadableFile,
            retentionPeriod: number,
        }): Promise<UploadableFile>

        listUploads(): Promise<ListUploaderResult[]>
        renewFile(uhrpUrl: string, additionalMinutes: number): Promise<RenewFileResult>
        findFile(uhrpUrl: string): Promise<FindFileData> 
    }
}