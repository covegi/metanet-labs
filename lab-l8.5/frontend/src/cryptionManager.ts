import {
    WalletClient,
    Utils,
    ECDSA,
    PublicKey,
    Hash,
    BigNumber,
    Signature,
    PushDrop,
    Transaction,
    MasterCertificate,
    ProtoWallet,
    VerifiableCertificate
  } from '@bsv/sdk'
// import { kvProtocol } from '@bsv/sdk/kvstore/types.ts'
  
  const walletClient = new WalletClient()
  
  const KEY_ID = '1'

  const pushdrop = new PushDrop(walletClient)
  
  // Define a minimal Certificate interface for TypeScript
  interface Certificate {
    type: string
    fields: Record<string, string>
    keyring?: Record<string, string> | string // Support both object and string keyring formats
    serialNumber: string
    subject: string
    certifier: string
    revocationOutpoint: string
    signature: string
  }
  
  // Define the expected structure of ListCertificatesResult
  interface ListCertificatesResult {
    certificates: Certificate[]
    totalCertificates: number
  }
  
  // Utility to create a test certificate with a valid signature
  async function createTestCertificate(): Promise<Certificate> {
    try {
      const { publicKey: subject } = await walletClient.getPublicKey({
        identityKey: true
      })
      if (!subject) {
        throw new Error(
          'Failed to retrieve wallet client identity key for subject'
        )
      }
  
      const certificateType = Utils.toBase64(Utils.toArray('emailCert', 'utf8'))
  
      const randomBytes = new Uint8Array(32)
      window.crypto.getRandomValues(randomBytes)
      const randomBytesArray = Array.from(randomBytes)
      const randomHex = Utils.toHex(randomBytesArray)
      const serialNumber = Utils.toBase64(Utils.toArray(randomHex, 'utf8'))
  
      const fields = {
        email: Utils.toBase64(Utils.toArray('bob@projectbabbage.com', 'utf8'))
      }
  
      const { publicKey: certifier } = await walletClient.getPublicKey({
        identityKey: true
      })
      if (!certifier) {
        throw new Error(
          'Failed to retrieve wallet client identity key for certifier'
        )
      }
  
      const mockTxid = 'a'.repeat(64)
      const revocationOutpoint = `${mockTxid}.0`
  
      const certData = JSON.stringify({
        type: certificateType,
        serialNumber,
        subject,
        certifier,
        revocationOutpoint,
        fields
      })
      const certDataArray = Utils.toArray(certData, 'utf8') as number[]
  
      const signatureResponse = await walletClient.createSignature({
        protocolID: [0, 'cryption'],
        keyID: KEY_ID,
        data: certDataArray,
        counterparty: 'self'
      })
  
      if (!signatureResponse.signature) {
        throw new Error('Signature creation failed: Signature is undefined.')
      }
  
      const signatureObj = Signature.fromDER(signatureResponse.signature)
      const signature = Utils.toHex(signatureObj.toDER() as number[])
  
      const certificate: Certificate = {
        type: certificateType,
        serialNumber,
        subject,
        certifier,
        revocationOutpoint,
        fields,
        signature
      }
  
      return certificate
    } catch (error) {
      console.error(
        'Failed to create test certificate:',
        (error as Error).message
      )
      throw new Error(
        `Test certificate creation failed: ${(error as Error).message}`
      )
    }
  }
  
  // Utility to convert number[] to hex string
  const toHex = (array: number[]): string => {
    return Array.from(array)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('')
  }
  
  // Utility to convert hex string to number[]
  const fromHex = (hex: string): number[] => {
    return Utils.toArray(hex, 'hex')
  }
  
  // Utility to convert string to base64 using @bsv/sdk Utils
  const toBase64 = (str: string): string => {
    const bytes = Utils.toArray(str, 'utf8')
    return Utils.toBase64(bytes)
  }
  
  // Utility to validate a public key format
  const validatePublicKey = (key: string): void => {
    try {
      if (
        /^[a-zA-Z0-9]+$/.test(key) &&
        !/^[0-9a-fA-F]{66}$|^[0-9a-fA-F]{130}$/.test(key)
      ) {
        return // Valid wallet ID, no further validation needed
      }
      if (!/^[0-9a-fA-F]{66}$|^[0-9a-fA-F]{130}$/.test(key)) {
        throw new Error(
          'Invalid public key format: Must be 33 or 65 bytes in hex or a valid wallet ID'
        )
      }
      const pubKey = PublicKey.fromString(key)
      if (!pubKey) {
        throw new Error(
          'Invalid public key: Failed to parse as a valid elliptic curve point'
        )
      }
      console.log(`Validated public key: ${key}`)
    } catch (error) {
      console.error(`Public key validation failed for key: ${key}`, error)
      throw new Error(`Invalid public key: ${(error as Error).message}`)
    }
  }
  
  // Utility to decode and verify certificate type
  const decryptCertificateType = (
    encodedType: string
  ): { decodedType: string; isEmailCert: boolean } => {
    try {
      const decodedBytes = Utils.toArray(encodedType, 'base64')
      const decodedType = Utils.toUTF8(decodedBytes)
      const isEmailCert = decodedType === 'emailCert'
      console.log(
        `decryptCertificateType: Decoded type: ${decodedType}, isEmailCert: ${isEmailCert}`
      )
      return { decodedType, isEmailCert }
    } catch (error) {
      console.error(
        `Failed to decode certificate type: ${encodedType}`,
        (error as Error).message
      )
      return { decodedType: encodedType, isEmailCert: false }
    }
  }
  
  /**
   * Encrypt a message for yourself (e.g., Alice encrypts for Alice).
   */
  async function encryptForSelf(message: string): Promise<string> {
    try {
      const messageUTF8ByteArray = Utils.toArray(message, "utf8")
      const encryptedMessage = await walletClient.encrypt({
        plaintext: messageUTF8ByteArray,
        protocolID: [0, 'cryption'],
        keyID: KEY_ID,
        counterparty: "self"
    })
      if (encryptedMessage.ciphertext) {
          const ciphertextHex = Utils.toHex(encryptedMessage.ciphertext)
          return ciphertextHex
        } else {
          throw new Error("Ciphertext not defined")
        }
    } catch (error) {
      throw new Error(`${error}`)
    }
  }
  
  /**
   * Decrypt a message encrypted for yourself (e.g., Alice decrypts her own message).
   */
  async function decryptForSelf(ciphertext: string): Promise<string> {
    try {
      const messageByteArray = fromHex(ciphertext)
      const decryptedMessage = await walletClient.decrypt({
        ciphertext: messageByteArray,
        protocolID: [0, 'cryption'],
        keyID: KEY_ID,
        counterparty: "self",
    })
      if (decryptedMessage.plaintext) {
        const utf8String = Utils.toUTF8(decryptedMessage.plaintext)
        return utf8String
      } else {
        throw new Error("Plaintext not defined")
      }
    } catch (error) {
      throw new Error(`${error}`)
    }
  }
  
  /**
   * Encrypt a message for a friend (e.g., Alice encrypts for Bob).
   */
  async function encryptForFriend(
    message: string,
    friendIdentity: string
  ): Promise<{ ciphertext: string; senderIdentity: string }> {
    try {
      validatePublicKey(friendIdentity)
      
      const messageUTF8ByteArray = Utils.toArray(message, "utf8")
      const encryptedMessage = await walletClient.encrypt({
        plaintext: messageUTF8ByteArray,
        protocolID: [0, 'cryption'],
        keyID: KEY_ID,
        counterparty: friendIdentity
      })
      if (!encryptedMessage.ciphertext) throw new Error("Ciphertext not defined")
      
      const ciphertextHex = toHex(encryptedMessage.ciphertext)

      const senderPublicKey = await walletClient.getPublicKey({
        identityKey: true,
      })

      if (!senderPublicKey.publicKey) throw new Error("Sender identity key is undefined")

      return {ciphertext: ciphertextHex, senderIdentity: senderPublicKey.publicKey}

    } catch (error) {
      throw new Error(`${error}`)
    }
  }
  
  /**
   * Decrypt a message encrypted by a friend (e.g., Bob decrypts Alice’s message).
   */
  async function decryptFromFriend(
    ciphertext: string,
    friendIdentity: string
  ): Promise<string> {
    try {
      validatePublicKey(friendIdentity)
      const messageByteArray = fromHex(ciphertext)

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("10 seconds past. Decryption timed out!"))
        }, 10000)
      })

      const decryptedMessage = await Promise.race([
        walletClient.decrypt({
          ciphertext: messageByteArray,
          protocolID: [0, 'cryption'],
          keyID: KEY_ID,
          counterparty: friendIdentity
        }),
        timeoutPromise
      ]) as { plaintext: number[]}

      if (!decryptedMessage.plaintext) throw new Error("Plaintext not defined")

      const messageUTF8String = Utils.toUTF8(decryptedMessage.plaintext)
      return messageUTF8String

    } catch (error) {
      throw new Error(`${error}`)
    }
  }
  
  /**
   * Sign a message for yourself (e.g., Alice signs for Alice).
   */
  async function signForSelf(message: string): Promise<string> {
    try {
      const messageUTF8ByteArray = Utils.toArray(message)
      const signature = await walletClient.createSignature({
        data: messageUTF8ByteArray,
        protocolID: [0, 'cryption'],
        keyID: KEY_ID,
        counterparty: "self"
    })
    if (!signature.signature) throw new Error("Signature not defined")

    const signatureDER = Signature.fromDER(signature.signature)
    const signatureHex = toHex(signatureDER.toDER() as number[])
    return signatureHex
    
    } catch (error) {
      throw new Error(`${error}`)
    } 
  } 
  
  /**
   * Verify a message signed by yourself (e.g., Alice verifies her own signature).
   */
  async function verifyForSelf(
    message: string,
    signature: string
  ): Promise<boolean> {
    try {
      const publicKey = await walletClient.getPublicKey({
        identityKey: true,
      })
      validatePublicKey(publicKey.publicKey)

      const messageUTF8ByteArray = Utils.toArray(message)
      const signatureByteArray = fromHex(signature)
      const verifiedSignature = await walletClient.verifySignature({
        data: messageUTF8ByteArray,
        protocolID: [0, 'cryption'],
        keyID: KEY_ID,
        counterparty: "self",
        forSelf: true,
        signature: signatureByteArray,
      })
      if (!verifiedSignature.valid) throw new Error("Signature not valid")
      return verifiedSignature.valid

    } catch (error) {
      console.error("Verification failed", error)
      return false as boolean
    }
  }
  
  /**
   * Sign a message for a friend (e.g., Alice signs for Bob).
   */
  async function signForFriend(
    message: string,
    friendIdentity: string
  ): Promise<string> {
    try {
        validatePublicKey(friendIdentity)
        const messageUTF8ByteArray = Utils.toArray(message)
        const signature = await walletClient.createSignature({
          data: messageUTF8ByteArray,
          protocolID: [0, 'cryption'],
          keyID: KEY_ID,
          counterparty: friendIdentity
      })
        if (!signature.signature) throw new Error("Signature not defined")
        
        const signatureDER = Signature.fromDER(signature.signature)
        const signatureHex = toHex(signatureDER.toDER() as number[])
        return signatureHex
    } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Failed to sign for friend: ${error.message}`)
        } 
        throw new Error("Failed to sign for friend")
      }
    }
  
  /**
   * Verify a message signed by a friend (e.g., Bob verifies Alice’s signature).
   */
  async function verifyFromFriend(
    message: string,
    signature: string,
    friendIdentity: string
  ): Promise<boolean> {
    try {
      validatePublicKey(friendIdentity)
      const messageUTF8ByteArray = Utils.toArray(message)
      const signatureByteArray = fromHex(signature)
      const verifiedSignature = await walletClient.verifySignature({
        data: messageUTF8ByteArray,
        signature: signatureByteArray,
        protocolID: [0, 'cryption'],
        keyID: KEY_ID,
        counterparty: friendIdentity,
        forSelf: false,
      })
      if (!verifiedSignature.valid) throw new Error("Signature not valid")
      
      return verifiedSignature.valid

    } catch (error) {
        console.error("Verification failed", error)
        return false as boolean
    }
  }
  
  /**
   * Sign a message for anyone.
   */
  async function signForAnyone(message: string): Promise<string> {
    try {
      const messageUTF8ByteArray = Utils.toArray(message)
      const signatureAll = await walletClient.createSignature({
        data: messageUTF8ByteArray,
        protocolID: [0, 'cryption'],
        keyID: KEY_ID,
        counterparty: "anyone",
      })
      if (!signatureAll.signature) throw new Error("Signature not defined!")
      
      const signatureDER = Signature.fromDER(signatureAll.signature)
      const signatureHex = toHex(signatureDER.toDER() as number[])
      return signatureHex
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to sign for all: ${error.message}`)
      } 
      throw new Error("Failed to sign for all")
    }

  }
  
  /**
   * Verify a message signed for anyone (e.g., verify a signature with the signer’s identity key).
   */
  async function verifyForAnyone(
    message: string,
    signature: string,
    signerIdentity: string
  ): Promise<boolean> {
    try {
      validatePublicKey(signerIdentity)

      const messageUTF8ByteArray = Utils.toArray(message)
      const signatureHex = fromHex(signature)
      const signerPublicKey = await walletClient.getPublicKey({
        protocolID: [0, 'cryption'],
        keyID: KEY_ID,
        counterparty: signerIdentity,
      })
      validatePublicKey(signerPublicKey.publicKey)
      const verifiedSignature = await walletClient.verifySignature({
        data: messageUTF8ByteArray,
        protocolID: [0, 'cryption'],
        keyID: KEY_ID,
        counterparty: signerIdentity,
        forSelf: false,
        signature: signatureHex
      })
      if (!verifiedSignature.valid) throw new Error("Signature not valid!")
      return verifiedSignature.valid
    } catch (error) {
      console.error("Verification failed", error)
      return false as boolean
    }
  }
  
  /**
   * Prove a certificate to a verifier (e.g., Alice proves to Bob).
   * Returns an object containing the proof (if successful) and the decoded certificate fields.
   */
  async function proveCertificate(
    certificate: Certificate | null,
    fieldsToReveal: string[],
    verifierIdentity: string
  ): Promise<{
    proof?: any
    decodedCertificateFields?: { [key: string]: string }[]
  }> {
    try {
      validatePublicKey(verifierIdentity)

      const currentIdentity = await walletClient.getPublicKey({
        identityKey: true
      })

      const verifierPublicKey = await walletClient.getPublicKey({
        protocolID: [0, 'cryption'],
        keyID: KEY_ID,
        counterparty: verifierIdentity
      })

      if (fieldsToReveal.length === 0) {
        fieldsToReveal = ["email", "issuer", "subject"]
      }

      let allCertsToUse;

      const emailCerts = await walletClient.listCertificates({
        certifiers: [],
        types: ["ZW1haWxDZXJ0"]
      })
      if (emailCerts.certificates.length === 0) {
        const allCerts = await walletClient.listCertificates({
          certifiers: [],
          types: []
        })
        allCertsToUse = allCerts.certificates
      } else {
        allCertsToUse = emailCerts.certificates
      }
      
      let firstEmailCert = null
      let firstCertWithFields = null

      for (const cert of allCertsToUse) {
        const { isEmailCert } = decryptCertificateType(cert.type)

        if (isEmailCert && !firstEmailCert) {
          firstEmailCert = cert
        }
        if (cert.fields && Object.keys(cert.fields).length > 0 && !firstCertWithFields)
          firstCertWithFields = cert
      }

      const selectedCert = certificate ||
                          firstEmailCert ||
                          firstCertWithFields ||
                          await createTestCertificate()

      const proof = await walletClient.proveCertificate({
        certificate: selectedCert,
        fieldsToReveal: fieldsToReveal,
        verifier: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
        privileged: false
      })

      const decodedFields: { [key: string]: string}[] = []

      if (proof.keyringForVerifier) {
        const veriCert = new VerifiableCertificate(
          selectedCert.type,
          selectedCert.serialNumber,
          selectedCert.subject,
          selectedCert.certifier,
          selectedCert.revocationOutpoint,
          selectedCert.fields,
          proof.keyringForVerifier
        )
        const protoWallet = new ProtoWallet('anyone')
        const decrypted = await veriCert.decryptFields(protoWallet)
    
        for (const [key, value] of Object.entries(decrypted)) {
        decodedFields.push({ [key]: value })
      }
    } else {
      for (const [key, value] of Object.entries(selectedCert.fields)) {
          try {
              const bytes = Utils.toArray(value, 'base64')
              const decoded = Utils.toUTF8(bytes)
              decodedFields.push({ [key]: decoded })
          } catch {
              decodedFields.push({ [key]: value })
          }
        }
  }
  return { decodedCertificateFields: decodedFields }
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to prove certificate: ${error.message}`)
        }
        throw new Error('Failed to prove certificate')
    }
}
  
  /**
   * Sign a transaction to redeem a PushDrop token (e.g., Alice redeems a token).
   */
  async function signTransaction(
    basket: string = 'signing demo'
  ): Promise<void> {
    try {
      // const pushdrop = new PushDrop(walletClient)

      const sampleData = Utils.toArray("Some test data", "utf8")

      const initialLockingScript = await pushdrop.lock(
        [sampleData],
        [0, "cryption"],
        KEY_ID,
        "anyone",
        true
      )

      const initialLockingScriptHex = initialLockingScript.toHex()

      const transaction = await walletClient.createAction({
        description: "initial locking script transaction",
        outputs: [{
          outputDescription: "initial outputs",
          basket: basket,
          lockingScript: initialLockingScriptHex,
          satoshis: 5,
        }],
        options: {
          acceptDelayedBroadcast: false
        }
      })

      const txid = transaction.txid
      const beefData = await walletClient.listOutputs({
        basket: basket,
        include: "entire transactions"
      })

      const BEEF = beefData.BEEF

      const redeemingData = Utils.toArray("Redeeming token", "utf8")
      const redeemingLockingScript = await pushdrop.lock(
        [redeemingData],
        [0, 'cryption'],
        KEY_ID,
        "anyone",
        true
      )

      const outputIndex = 0
      const redeemAction = await walletClient.createAction({
        description: "redeem token",
        inputBEEF: BEEF,
        inputs: [{
          inputDescription: "token to redeem",
          outpoint: `${txid}.${outputIndex}`,
          unlockingScriptLength: 73,
        }],
        outputs: [{
          outputDescription: "new token",
          basket: basket,
          lockingScript: redeemingLockingScript.toHex(),
          satoshis: 5,
        }],
        options: {
          acceptDelayedBroadcast: false
        }
      })

      const unlocker = pushdrop.unlock(
        [0, "cryption"],
        KEY_ID,
        "anyone",
        "all",
        true,
        5,
        initialLockingScript
      )

      const unlockingScript = await unlocker.sign(
        Transaction.fromBEEF(redeemAction.signableTransaction!.tx),
        0
      )

      await walletClient.signAction({
        reference: redeemAction.signableTransaction!.reference,
        spends: {
          0: {
            unlockingScript: unlockingScript.toHex()
          }
        }
      })

      const outputs = await walletClient.listOutputs({
        basket: basket
      })

      console.log("Transaction signed successfully, outputs:", outputs)
    
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Failed to sign transaction: ${error.message}`)
      }
      throw new Error("Failed to sign transaction")
      }
  }
  
  /**
   * Extra Credit: Switch between Metanet client profiles (e.g., from "default" to "friend").
   */
  async function switchProfile(
    initialIdentity: string,
    targetProfile: string,
    timeoutMs: number = 30000
  ): Promise<string> {
    const startTime = Date.now()

    return new Promise((resolve, reject) => {
      const interval = setInterval( async () => {
        try {
          const { publicKey } = await walletClient.getPublicKey({ identityKey: true })

          if (publicKey && publicKey !== initialIdentity) {
            clearInterval(interval)
            resolve(publicKey)
          }

          if (Date.now() - startTime > timeoutMs) {
            clearInterval(interval)
            reject(new Error(`Failed to switch to ${targetProfile}`))
          }
        } catch (error) {
          clearInterval(interval)
          reject(error)
        }
      }) 
    })
  }
  
  // Export WalletClient class, walletClient instance, and functions for use in index.tsx and App.tsx
  export {
    WalletClient,
    walletClient,
    encryptForSelf,
    decryptForSelf,
    encryptForFriend,
    decryptFromFriend,
    signForSelf,
    verifyForSelf,
    signForFriend,
    verifyFromFriend,
    signForAnyone,
    verifyForAnyone,
    proveCertificate,
    signTransaction,
    switchProfile
  }