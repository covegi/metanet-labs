// TODO 1: Define UHRPRecord interface

export interface UHRPRecord {
    uhrpUrl: string,
    hash: string,
    expiryTime: number,
    fileSize: number,
    txid: string,
    outputIndex: number,
    hostIdentityKey: string
}

// TODO 2: Define UTXOReference interface

export interface UTXOReference {
    txid: string,
    outputIndex: number
}

