import React, { useState, useEffect } from 'react'
import {
  WalletClient,
  encryptForSelf,
  decryptForSelf,
  encryptForFriend,
  decryptFromFriend,
  signForSelf,
  verifyForSelf,
  signForFriend,
  verifyFromFriend,
  signForAnyone,
  proveCertificate,
  signTransaction,
  switchProfile,
  walletClient as walletClientInstance
} from './cryptionManager'

// This App.tsx is for students pursuing extra credit to implement
// profile switching between "default" and "friend" profiles in cryptionManager.ts.
// You MUST fully implement the switchProfile function in cryptionManager.ts and
// update both the profile-switching index.tsx and this App.tsx to use it for Tests 3 and 7.
// Partial implementation will break the app. If using a partner, use the non-switching profile App.tsx instead.

// Utility function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Default wallet switch detection function (used as reference, to be replaced by switchProfile)
async function waitForWalletSwitch(
  initialIdentity: string,
  promptMessage: string,
  setShowModal: (show: boolean) => void,
  timeoutMs: number = 60000
) {
  const pollIntervalMs = 2000
  const maxAttempts = timeoutMs / pollIntervalMs
  let attempts = 0

  console.log(promptMessage)
  console.log('Current wallet identity:', initialIdentity)

  while (attempts < maxAttempts) {
    try {
      const { publicKey: currentIdentity } = await walletClientInstance.getPublicKey({
        identityKey: true
      })
      if (!currentIdentity) {
        throw new Error(
          'Current wallet identity is undefined. Please ensure a valid wallet is active in Metanet client.'
        )
      }
      if (currentIdentity !== initialIdentity) {
        console.log('Wallet switch detected! New identity:', currentIdentity)
        console.log('Waiting 2 seconds for Metanet client to stabilize...')
        await delay(2000)
        console.log('Proceeding after delay.')
        setShowModal(false) // Hide the modal once the switch is detected
        return currentIdentity
      }
      console.log('Wallet not switched yet. Current identity:', currentIdentity)
    } catch (error) {
      console.error('Error checking wallet identity:', (error as Error).message)
    }
    await delay(pollIntervalMs)
    attempts++
  }

  setShowModal(false)
  throw new Error(
    'Timeout waiting for wallet switch. Please ensure you have switched wallets as instructed.'
  )
}

const App: React.FC = () => {
  const [test1Message, setTest1Message] = useState('test 1')
  const [test1Ciphertext, setTest1Ciphertext] = useState('')
  const [test2Message, setTest2Message] = useState('test 2')
  const [test2FriendIdentity, setTest2FriendIdentity] = useState('')
  const [test3Ciphertext, setTest3Ciphertext] = useState('')
  const [test3FriendIdentity, setTest3FriendIdentity] = useState('')
  const [test4Message, setTest4Message] = useState('test 4')
  const [test5Message, setTest5Message] = useState('test 5')
  const [test5Signature, setTest5Signature] = useState('')
  const [test6Message, setTest6Message] = useState('test 6')
  const [test6FriendIdentity, setTest6FriendIdentity] = useState('')
  const [test7Message, setTest7Message] = useState('test 7')
  const [test7Signature, setTest7Signature] = useState('')
  const [test7FriendIdentity, setTest7FriendIdentity] = useState('')
  const [test8Message, setTest8Message] = useState('test 8')
  const [test9CertFields, setTest9CertFields] = useState('email')
  const [test9VerifierIdentity, setTest9VerifierIdentity] = useState('')
  const [test10Basket, setTest10Basket] = useState('signing demo')
  const [showFriendModal, setShowFriendModal] = useState(false)
  const [showDefaultModal, setShowDefaultModal] = useState(false)

  const [completedTests, setCompletedTests] = useState({
    test1Encrypt: false,
    test1Decrypt: false,
    test2: false,
    test3: false,
    test4: false,
    test5: false,
    test6: false,
    test7: false,
    test8: false,
    test9: false,
    test10: false
  })

  const [results, setResults] = useState<{ [key: string]: string }>({})
  const [decodedCertificateFields, setDecodedCertificateFields] = useState<
    { [key: string]: string }[]
  >([])

  const getEnabledButton = () => {
    console.log('getEnabledButton called with completedTests:', completedTests)
    if (!completedTests.test1Encrypt) return 'test1Encrypt'
    if (!completedTests.test1Decrypt) return 'test1Decrypt'
    if (!completedTests.test2) return 'test2'
    if (!completedTests.test3) return 'test3'
    if (!completedTests.test4) return 'test4'
    if (!completedTests.test5) return 'test5'
    if (!completedTests.test6) return 'test6'
    if (!completedTests.test7) return 'test7'
    if (!completedTests.test8) return 'test8'
    if (!completedTests.test9) return 'test9'
    if (!completedTests.test10) return 'test10'
    return null
  }

  useEffect(() => {
    const fetchFriendIdentity = async () => {
      try {
        console.log('Fetching identity key for App.tsx tests...')
        const { publicKey: initialIdentityForDebug } =
          await walletClientInstance.getPublicKey({
            identityKey: true
          })
        console.log(
          'App.tsx useEffect: Initial identity (proxy for profile):',
          initialIdentityForDebug
        )

        const friendKey = (window as any).friendIdentityKey
        if (!friendKey) {
          throw new Error(
            'Friend’s identity key is not available. Please ensure index.tsx has fetched it.'
          )
        }
        console.log('Friend’s identity key (from index.tsx):', friendKey)

        const { publicKey: initialIdentity } = await walletClientInstance.getPublicKey({
          identityKey: true
        })
        if (!initialIdentity) {
          throw new Error(
            'Initial wallet identity is undefined. Please ensure a valid wallet is active in Metanet client.'
          )
        }

        const defaultResponse = await walletClientInstance.getPublicKey({
          identityKey: true
        })
        if (!defaultResponse.publicKey) {
          throw new Error('Default profile identity key is undefined.')
        }
        const defaultKey = defaultResponse.publicKey
        console.log('Default profile identity key:', defaultKey)

        setTest2FriendIdentity(friendKey)
        setTest6FriendIdentity(friendKey)
        setTest9VerifierIdentity(friendKey)
        setTest3FriendIdentity(friendKey)
        setTest7FriendIdentity(friendKey)
      } catch (error) {
        console.error(
          'Failed to fetch identity key for App.tsx:',
          (error as Error).message
        )
        setResults((prev: { [key: string]: string }) => ({
          ...prev,
          setup: `Error fetching identity key: ${
            (error as Error).message
          }. Please ensure the "default" profile is active and index.tsx has fetched the friend identity.`
        }))
      }
    }

    fetchFriendIdentity()
  }, [])

  const markTestCompleted = (testKey: string) => {
    setCompletedTests(prev => {
      const newState = { ...prev, [testKey]: true }
      console.log(
        `markTestCompleted: Updated completedTests[${testKey}] to true. New state:`,
        newState
      )
      return newState
    })
  }

  const handleTest1Encrypt = async () => {
    try {
      console.log('handleTest1Encrypt: Starting encryption...')
      const ciphertext = await encryptForSelf(test1Message)
      setTest1Ciphertext(ciphertext)
      setResults((prev: { [key: string]: string }) => {
        const newResults = { ...prev, test1: `Ciphertext: ${ciphertext}` }
        console.log('handleTest1Encrypt: Updated results:', newResults)
        return newResults
      })
      markTestCompleted('test1Encrypt')
    } catch (error) {
      setResults((prev: { [key: string]: string }) => {
        const newResults = {
          ...prev,
          test1: `Error: ${(error as Error).message}`
        }
        console.log('handleTest1Encrypt: Error - Updated results:', newResults)
        return newResults
      })
    }
  }

  const handleTest1Decrypt = async () => {
    try {
      console.log('handleTest1Decrypt: Starting decryption...')
      const plaintext = await decryptForSelf(test1Ciphertext)
      setResults((prev: { [key: string]: string }) => {
        const newResults = { ...prev, test1: `Plaintext: ${plaintext}` }
        console.log('handleTest1Decrypt: Updated results:', newResults)
        return newResults
      })
      markTestCompleted('test1Decrypt')
    } catch (error) {
      setResults((prev: { [key: string]: string }) => {
        const newResults = {
          ...prev,
          test1: `Error: ${(error as Error).message}`
        }
        console.log('handleTest1Decrypt: Error - Updated results:', newResults)
        return newResults
      })
    }
  }

  const handleTest2 = async () => {
    try {
      console.log('handleTest2: Starting encryption for friend...')
      if (!test2FriendIdentity) {
        throw new Error('Friend’s identity key is not available.')
      }
      const { ciphertext, senderIdentity } = await encryptForFriend(
        test2Message,
        test2FriendIdentity
      )
      setResults((prev: { [key: string]: string }) => ({
        ...prev,
        test2: `Ciphertext: ${ciphertext}, Sender: ${senderIdentity}`
      }))
      setTest3Ciphertext(ciphertext)
      markTestCompleted('test2')
    } catch (error) {
      setResults((prev: { [key: string]: string }) => ({
        ...prev,
        test2: `Error: ${(error as Error).message}`
      }))
    }
  }

  const handleTest3 = async () => {
    try {
      console.log('handleTest3: Starting decryption from friend...')
      if (!test3FriendIdentity) {
        throw new Error('Friend’s identity key is not available.')
      }
      if (!test3Ciphertext) {
        throw new Error('Ciphertext is not available from Test 2.')
      }

      // TODO: Extra Credit - Implement profile switching:
      // Implement switchProfile in cryptionManager.ts and uncomment the code below to switch to the friend profile for decryption.
      // Ensure you also update index.tsx and handleTest7 in this file to use switchProfile.
      // Partial implementation will break the app.
      
      setShowFriendModal(true)
      const { publicKey: currentIdentity } = await walletClientInstance.getPublicKey({
        identityKey: true
      })
      const friendIdentityFromSwitch = await switchProfile(
        currentIdentity,
        'friend',
        60000
      )
      console.log('switchProfile to friend succeeded! New identity:', friendIdentityFromSwitch)
      console.log('Waiting 2 seconds for Metanet client to stabilize...')
      await delay(2000)
      console.log('Proceeding with decryption...')
      setShowFriendModal(false)

      // Placeholder: Replace with switchProfile implementation

      // Perform decryption with friend profile
      const plaintext = await decryptFromFriend(
        test3Ciphertext,
        test3FriendIdentity
      )

      // TODO: Extra Credit - Switch back to default profile:
      // Implement switchProfile in cryptionManager.ts and uncomment the code below to switch back to the default profile.
      // Ensure you also update index.tsx and handleTest7 in this file to use switchProfile.
      // Partial implementation will break the app.
      
      setShowDefaultModal(true)
      await switchProfile(
        friendIdentityFromSwitch,
        'default',
        60000
      )
      console.log('switchProfile to default succeeded.')
      console.log('Waiting 2 seconds for Metanet client to stabilize...')
      await delay(2000)
      console.log('Proceeding after switch back...')
      setShowDefaultModal(false)

      // Placeholder: Replace with switchProfile implementation

      setResults((prev: { [key: string]: string }) => ({
        ...prev,
        test3: `Plaintext: ${plaintext}`
      }))
      markTestCompleted('test3')
    } catch (error) {
      setResults((prev: { [key: string]: string }) => ({
        ...prev,
        test3: `Error decrypting from friend: ${(error as Error).message}`
      }))
    }
  }

  const handleTest4 = async () => {
    try {
      const { publicKey: currentIdentityBeforeSign } =
        await walletClientInstance.getPublicKey({
          identityKey: true
        })
      console.log('Current identity before Test 4:', currentIdentityBeforeSign)
      if (currentIdentityBeforeSign !== test3FriendIdentity) {
        throw new Error(
          `Incorrect profile active. Expected "default" profile with identity ${test3FriendIdentity}, but found ${currentIdentityBeforeSign}. Please ensure the "default" profile is active.`
        )
      }

      const signature = await signForSelf(test4Message)
      setResults((prev: { [key: string]: string }) => ({
        ...prev,
        test4: `Signature: ${signature}`
      }))
      setTest5Signature(signature)
      setTest5Message(test4Message)
      markTestCompleted('test4')
    } catch (error) {
      setResults((prev: { [key: string]: string }) => ({
        ...prev,
        test4: `Error signing for self: ${(error as Error).message}`
      }))
    }
  }

  const handleTest5 = async () => {
    try {
      const isValid = await verifyForSelf(test5Message, test5Signature)
      setResults((prev: { [key: string]: string }) => ({
        ...prev,
        test5: `Valid: ${isValid}`
      }))
      markTestCompleted('test5')
    } catch (error) {
      setResults((prev: { [key: string]: string }) => ({
        ...prev,
        test5: `Error: ${(error as Error).message}`
      }))
    }
  }

  const handleTest6 = async () => {
    try {
      if (!test6FriendIdentity) {
        throw new Error('Friend’s identity key is not available.')
      }
      const signature = await signForFriend(test6Message, test6FriendIdentity)
      setResults((prev: { [key: string]: string }) => ({
        ...prev,
        test6: `Signature: ${signature}`
      }))
      setTest7Signature(signature)
      setTest7Message(test6Message)
      markTestCompleted('test6')
    } catch (error) {
      setResults((prev: { [key: string]: string }) => ({
        ...prev,
        test6: `Error: ${(error as Error).message}`
      }))
    }
  }

  const handleTest7 = async () => {
    try {
      console.log('handleTest7: Starting verification from friend...')
      if (!test7FriendIdentity) {
        throw new Error('Friend’s identity key is not available.')
      }
      if (!test7Signature) {
        throw new Error('Signature is not available from Test 6.')
      }

      // TODO: Extra Credit - Implement profile switching:
      // Implement switchProfile in cryptionManager.ts and uncomment the code below to switch to the friend profile for verification.
      // Ensure you also update index.tsx and handleTest3 in this file to use switchProfile.
      // Partial implementation will break the app.
      
      setShowFriendModal(true)
      const { publicKey: currentIdentity } = await walletClientInstance.getPublicKey({
        identityKey: true
      })
      const friendIdentityFromSwitch = await switchProfile(
        currentIdentity,
        'friend',
        60000
      )
      console.log('switchProfile to friend succeeded! New identity:', friendIdentityFromSwitch)
      console.log('Waiting 2 seconds for Metanet client to stabilize...')
      await delay(2000)
      console.log('Proceeding with verification...')
      setShowFriendModal(false)
      

      // Placeholder: Replace with switchProfile implementation

      // Perform verification with friend profile
      const isValid = await verifyFromFriend(
        test7Message,
        test7Signature,
        test7FriendIdentity
      )

      // TODO: Extra Credit - Switch back to default profile:
      // Implement switchProfile in cryptionManager.ts and uncomment the code below to switch back to the default profile.
      // Ensure you also update index.tsx and handleTest3 in this file to use switchProfile.
      // Partial implementation will break the app.
      
      setShowDefaultModal(true)
      await switchProfile(
        friendIdentityFromSwitch,
        'default',
        60000
      )
      console.log('switchProfile to default succeeded.')
      console.log('Waiting 2 seconds for Metanet client to stabilize...')
      await delay(2000)
      console.log('Proceeding after switch back...')
      setShowDefaultModal(false)
      

      // Placeholder: Replace with switchProfile implementation

      setResults((prev: { [key: string]: string }) => ({
        ...prev,
        test7: `Valid: ${isValid}`
      }))
      markTestCompleted('test7')
    } catch (error) {
      setResults((prev: { [key: string]: string }) => ({
        ...prev,
        test7: `Error verifying from friend: ${(error as Error).message}`
      }))
    }
  }

  const handleTest8 = async () => {
    try {
      const signature = await signForAnyone(test8Message)
      setResults((prev: { [key: string]: string }) => ({
        ...prev,
        test8: `Signature: ${signature}`
      }))
      markTestCompleted('test8')
    } catch (error) {
      setResults((prev: { [key: string]: string }) => ({
        ...prev,
        test8: `Error: ${(error as Error).message}`
      }))
    }
  }

  const handleTest9 = async () => {
    try {
      console.log('handleTest9: Initializing wallet client...')
      const reinitializedWalletClient = new WalletClient()

      const { publicKey: currentIdentityBeforeTest } =
        await reinitializedWalletClient.getPublicKey({
          identityKey: true
        })
      console.log('Current identity before Test 9:', currentIdentityBeforeTest)

      if (!test9VerifierIdentity) {
        throw new Error('Verifier’s identity key is not available.')
      }

      const fieldsToReveal = test9CertFields
        .split(',')
        .map(field => field.trim())
        .filter(field => field)
      const result = await proveCertificate(
        null,
        fieldsToReveal,
        test9VerifierIdentity
      )
      setDecodedCertificateFields(result.decodedCertificateFields || [])
      setResults((prev: { [key: string]: string }) => ({
        ...prev,
        test9: `Decoded Fields: ${
          result.decodedCertificateFields
            ? JSON.stringify(result.decodedCertificateFields)
            : 'None'
        }`
      }))
      markTestCompleted('test9')
    } catch (error) {
      console.error('handleTest9 failed:', (error as Error).message)
      setResults((prev: { [key: string]: string }) => ({
        ...prev,
        test9: `Error proving certificate: ${
          (error as Error).message
        }. Ensure the correct keyring is used and the Metanet client API is accessible at localhost:3321.`
      }))
    }
  }

  const handleTest10 = async () => {
    try {
      await signTransaction(test10Basket)
      setResults((prev: { [key: string]: string }) => ({
        ...prev,
        test10: 'Transaction signed successfully'
      }))
      markTestCompleted('test10')
    } catch (error) {
      setResults((prev: { [key: string]: string }) => ({
        ...prev,
        test10: `Error: ${(error as Error).message}`
      }))
    }
  }

  const enabledButton = getEnabledButton()

  const buttonStyle = (buttonKey: string) => ({
    padding: '8px 16px',
    margin: '0 5px',
    backgroundColor: enabledButton === buttonKey ? '#4CAF50' : '#ccc', // Green for enabled, grey for disabled
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: enabledButton === buttonKey ? 'pointer' : 'not-allowed'
  })

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Encryption and Signing</h1>

      {/* Instructions Section */}
      <div
        style={{
          marginBottom: '20px',
          padding: '10px',
          border: '1px solid #ddd',
          borderRadius: '5px'
        }}
      >
        <h2>Instructions</h2>
        <p>
          This app tests the cryptographic functions provided by the Cryption
          Manager. Follow these steps to complete the tests:
        </p>
        <ol>
          <li>
            <strong>Prerequisites:</strong> Ensure Metanet client is running with
            both "default" and "friend" profiles configured. You will switch
            between these profiles for Tests 3 and 7.
          </li>
          <li>
            <strong>Test Flow:</strong> Tests must be completed in order (1
            through 10). Each test will enable the next one upon successful
            completion.
          </li>
          <li>
            <strong>Inputs:</strong> You can modify the input fields (e.g.,
            messages, identity keys, fields to reveal) before running each test.
            Default values are provided for convenience.
          </li>
          <li>
            <strong>Tests 3 and 7:</strong> These tests require switching to the
            "friend" profile to perform decryption (Test 3) and verification
            (Test 7), then switching back to "default". Complete the switchProfile
            TODOs in cryptionManager.ts and uncomment the profile-switching code
            in this file and index.tsx.
          </li>
          <li>
            <strong>Results:</strong> The result of each test will be displayed
            below the test section. If an error occurs, it will be shown in the
            result.
          </li>
          <li>
            <strong>Test 9 (Prove Certificate):</strong> This test retrieves
            certificates from your wallet and attempts to decode their fields.
            Ensure your wallet has an email certificate, or you will be
            requested to create a test certificate.
          </li>
          <li>
            <strong>Test 10 (Sign Transaction):</strong> This test creates and
            signs a transaction using a PushDrop token. Ensure your wallet has
            sufficient funds for the transaction.
          </li>
          <li>
            <strong>Troubleshooting:</strong> If a test fails, check the browser
            console for detailed logs. Ensure Metanet client is running and
            accessible at <code>localhost:3321</code>.
          </li>
        </ol>
      </div>

      {/* Modal for switching to friend profile */}
      {showFriendModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '5px',
              maxWidth: '500px',
              textAlign: 'center'
            }}
          >
            <h2>Switch to Friend Profile</h2>
            <p>
              Please switch to a "friend" profile in Metanet client to perform
              this test. If you don’t have a "friend" profile, create one now.
            </p>
            <p>Waiting for wallet switch...</p>
          </div>
        </div>
      )}

      {/* Modal for switching back to default profile */}
      {showDefaultModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '5px',
              maxWidth: '500px',
              textAlign: 'center'
            }}
          >
            <h2>Switch Back to Default Profile</h2>
            <p>
              The test is complete. Now, please switch back to your "default"
              profile in Metanet client to proceed with the remaining tests.
            </p>
            <p>Waiting for wallet switch...</p>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h2>Test 1: Encrypt/Decrypt for Self</h2>
        <small>
          Tests encryption and decryption of a message for the default profile:
          <br />
        </small>
        <input
          type="text"
          value={test1Message}
          onChange={e => setTest1Message(e.target.value)}
          placeholder="Message to encrypt"
          style={{ marginRight: '10px' }}
        />
        <button
          onClick={handleTest1Encrypt}
          disabled={enabledButton !== 'test1Encrypt'}
          style={buttonStyle('test1Encrypt')}
        >
          Encrypt
        </button>
        <button
          onClick={handleTest1Decrypt}
          disabled={enabledButton !== 'test1Decrypt'}
          style={buttonStyle('test1Decrypt')}
        >
          Decrypt
        </button>
        <p>Result: {results.test1 || 'Not run'}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Test 2: Encrypt for Friend</h2>
        <small>
          Tests encryption of a message for a friend's identity key:
          <br />
        </small>
        <input
          type="text"
          value={test2Message}
          onChange={e => setTest2Message(e.target.value)}
          placeholder="Message to encrypt"
          style={{ marginRight: '10px' }}
        />
        <input
          type="text"
          value={test2FriendIdentity}
          onChange={e => setTest2FriendIdentity(e.target.value)}
          placeholder="Friend’s identity key"
          style={{ marginRight: '10px' }}
        />
        <button
          onClick={handleTest2}
          disabled={enabledButton !== 'test2'}
          style={buttonStyle('test2')}
        >
          Encrypt
        </button>
        <p>Result: {results.test2 || 'Not run'}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Test 3: Decrypt from Friend</h2>
        <small>
          Tests decryption of a message encrypted by the default profile, using
          the friend profile:
          <br />
        </small>
        <input
          type="text"
          value={test3Ciphertext}
          onChange={e => setTest3Ciphertext(e.target.value)}
          placeholder="Ciphertext to decrypt"
          style={{ marginRight: '10px' }}
        />
        <input
          type="text"
          value={test3FriendIdentity}
          onChange={e => setTest3FriendIdentity(e.target.value)}
          placeholder="Friend’s identity key"
          style={{ marginRight: '10px' }}
        />
        <button
          onClick={handleTest3}
          disabled={enabledButton !== 'test3'}
          style={buttonStyle('test3')}
        >
          Decrypt
        </button>
        <p>Result: {results.test3 || 'Not run'}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Test 4: Sign for Self</h2>
        <small>
          Tests signing a message for the default profile:
          <br />
        </small>
        <input
          type="text"
          value={test4Message}
          onChange={e => setTest4Message(e.target.value)}
          placeholder="Message to sign"
          style={{ marginRight: '10px' }}
        />
        <button
          onClick={handleTest4}
          disabled={enabledButton !== 'test4'}
          style={buttonStyle('test4')}
        >
          Sign
        </button>
        <p>Result: {results.test4 || 'Not run'}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Test 5: Verify for Self</h2>
        <small>
          Tests verification of a signature created by the default profile:
          <br />
        </small>
        <input
          type="text"
          value={test5Message}
          onChange={e => setTest5Message(e.target.value)}
          placeholder="Message to verify"
          style={{ marginRight: '10px' }}
        />
        <input
          type="text"
          value={test5Signature}
          onChange={e => setTest5Signature(e.target.value)}
          placeholder="Signature to verify"
          style={{ marginRight: '10px' }}
        />
        <button
          onClick={handleTest5}
          disabled={enabledButton !== 'test5'}
          style={buttonStyle('test5')}
        >
          Verify
        </button>
        <p>Result: {results.test5 || 'Not run'}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Test 6: Sign for Friend</h2>
        <small>
          Tests signing a message for a friend's identity key:
          <br />
        </small>
        <input
          type="text"
          value={test6Message}
          onChange={e => setTest6Message(e.target.value)}
          placeholder="Message to sign"
          style={{ marginRight: '10px' }}
        />
        <input
          type="text"
          value={test6FriendIdentity}
          onChange={e => setTest6FriendIdentity(e.target.value)}
          placeholder="Friend’s identity key"
          style={{ marginRight: '10px' }}
        />
        <button
          onClick={handleTest6}
          disabled={enabledButton !== 'test6'}
          style={buttonStyle('test6')}
        >
          Sign
        </button>
        <p>Result: {results.test6 || 'Not run'}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Test 7: Verify from Friend</h2>
        <small>
          Tests verification of a signature created by the default profile, using
          the friend profile:
          <br />
        </small>
        <input
          type="text"
          value={test7Message}
          onChange={e => setTest7Message(e.target.value)}
          placeholder="Message to verify"
          style={{ marginRight: '10px' }}
        />
        <input
          type="text"
          value={test7Signature}
          onChange={e => setTest7Signature(e.target.value)}
          placeholder="Signature to verify"
          style={{ marginRight: '10px' }}
        />
        <input
          type="text"
          value={test7FriendIdentity}
          onChange={e => setTest7FriendIdentity(e.target.value)}
          placeholder="Friend’s identity key"
          style={{ marginRight: '10px' }}
        />
        <button
          onClick={handleTest7}
          disabled={enabledButton !== 'test7'}
          style={buttonStyle('test7')}
        >
          Verify
        </button>
        <p>Result: {results.test7 || 'Not run'}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Test 8: Sign for Anyone</h2>
        <small>
          Tests signing a message that can be verified by anyone:
          <br />
        </small>
        <input
          type="text"
          value={test8Message}
          onChange={e => setTest8Message(e.target.value)}
          placeholder="Message to sign"
          style={{ marginRight: '10px' }}
        />
        <button
          onClick={handleTest8}
          disabled={enabledButton !== 'test8'}
          style={buttonStyle('test8')}
        >
          Sign
        </button>
        <p>Result: {results.test8 || 'Not run'}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Test 9: Prove Certificate</h2>
        <small>
          Tests proving a certificate and decoding its fields for a verifier:
          <br />
        </small>
        <input
          type="text"
          value={test9CertFields}
          onChange={e => setTest9CertFields(e.target.value)}
          placeholder="Fields to reveal (comma-separated)"
          style={{ marginRight: '10px' }}
        />
        <input
          type="text"
          value={test9VerifierIdentity}
          onChange={e => setTest9VerifierIdentity(e.target.value)}
          placeholder="Verifier’s identity key"
          style={{ marginRight: '10px' }}
        />
        <button
          onClick={handleTest9}
          disabled={enabledButton !== 'test9'}
          style={buttonStyle('test9')}
        >
          Prove
        </button>
        <p>Result: {results.test9 || 'Not run'}</p>
        {decodedCertificateFields.length > 0 && (
          <div>
            <h3>Decoded Certificate Fields:</h3>
            <pre>{JSON.stringify(decodedCertificateFields, null, 2)}</pre>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Test 10: Sign Transaction</h2>
        <small>
          Tests creating and signing a transaction using a PushDrop token:
          <br />
        </small>
        <input
          type="text"
          value={test10Basket}
          onChange={e => setTest10Basket(e.target.value)}
          placeholder="Basket name"
          style={{ marginRight: '10px' }}
        />
        <button
          onClick={handleTest10}
          disabled={enabledButton !== 'test10'}
          style={buttonStyle('test10')}
        >
          Sign
        </button>
        <p>Result: {results.test10 || 'Not run'}</p>
      </div>
    </div>
  )
}

export default App