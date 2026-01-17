import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { walletClient, switchProfile } from './cryptionManager'

// This index-switching.tsx is for students pursuing extra credit to implement
// profile switching between "default" and "friend" profiles in cryptionManager.ts.
// You MUST fully implement the switchProfile function in cryptionManager.ts and
// update both index-switching.tsx and App.tsx to use it for Tests 3 and 7.
// Partial implementation will break the app. If using a partner, use index.tsx instead.

// Utility function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function fetchFriendIdentity(
  setShowFriendModal: (show: boolean) => void,
  setShowDefaultModal: (show: boolean) => void
): Promise<string> {
  try {
    // Debug: Log the current identity key as a proxy for the profile
    const { publicKey: initialIdentityForDebug } =
      await walletClient.getPublicKey({
        identityKey: true
      })
    console.log(
      'fetchFriendIdentity: Initial identity (proxy for profile):',
      initialIdentityForDebug
    )

    // Fetch the initial wallet identity (default profile)
    console.log(
      'Ensure your "default" profile is active in Metanet client before proceeding.'
    )
    const { publicKey: senderIdentity } = await walletClient.getPublicKey({
      identityKey: true
    })
    if (!senderIdentity) {
      throw new Error(
        'Default profile’s public key is undefined. Please ensure your "default" profile is active in Metanet client.'
      )
    }
    console.log(
      'Default Profile’s Public Key (initial wallet):',
      senderIdentity
    )

    // TODO: Extra Credit - Implement profile switching:
    // Implement switchProfile in cryptionManager.ts and uncomment the code below to use it.
    // Ensure you also update App.tsx for Tests 3 and 7 to use switchProfile.
    // Partial implementation will break the app.
    
    setShowFriendModal(true)
    const friendIdentityFromSwitch = await switchProfile(
      senderIdentity,
      'friend',
      60000
    )
    console.log('switchProfile succeeded! New identity:', friendIdentityFromSwitch)
    console.log('Waiting 2 seconds for Metanet client to stabilize...')
    await delay(2000)
    console.log('Proceeding after delay.')
    setShowFriendModal(false)

    // Placeholder: Replace with switchProfile implementation

    // Note: The following code assumes switchProfile was successful
    let friendIdentity: string | undefined
    const maxRetries = 3
    let retryCount = 0
    while (retryCount < maxRetries) {
      try {
        console.log(
          `Attempting to fetch friend's identity key (self call, attempt ${
            retryCount + 1
          }/${maxRetries})...`
        )
        const response = await walletClient.getPublicKey({
          identityKey: true
        })
        console.log('getPublicKey response:', response)
        friendIdentity = response.publicKey
        if (!friendIdentity) {
          throw new Error('Friend’s identity key is undefined in the response.')
        }
        console.log('Friend’s Identity Key (self call):', friendIdentity)
        break
      } catch (error) {
        console.error(
          `Failed to fetch friend’s identity key (self call, attempt ${
            retryCount + 1
          }/${maxRetries}):`,
          (error as Error).message,
          (error as Error).stack
        )
        if (retryCount === maxRetries - 1) {
          throw new Error(
            'Failed to fetch friend’s identity key after multiple attempts. Please ensure a "friend" profile is active in Metanet client.'
          )
        }
        await delay(2000)
        retryCount++
      }
    }

    // Store the friend's identity key in a global variable
    if (friendIdentity) {
      ;(window as any).friendIdentityKey = friendIdentity
    } else {
      throw new Error('Failed to fetch friend’s identity key.')
    }

    // TODO: Extra Credit - Implement profile switching:
    // Implement switchProfile in cryptionManager.ts and uncomment the code below to switch back to default.
    // Ensure you also update App.tsx for Tests 3 and 7 to use switchProfile.
    // Partial implementation will break the app.
    
    setShowDefaultModal(true)
    await switchProfile(
      friendIdentityFromSwitch,
      'default',
      60000
    )
    console.log('switchProfile succeeded for default profile switch.')
    console.log('Waiting 2 seconds for Metanet client to stabilize...')
    await delay(2000)
    console.log('Proceeding after delay.')
    setShowDefaultModal(false)

    // Placeholder: Replace with switchProfile implementation

    if (!friendIdentity) {
      throw new Error(
        'Friend’s identity key is undefined. Cannot proceed with friend-related tests.'
      )
    }

    console.log(
      'Setup complete. Friend’s identity key fetched. Proceed with tests in the UI.'
    )

    return friendIdentity
  } catch (error) {
    console.error(
      'Error during startup setup:',
      (error as Error).message,
      (error as Error).stack
    )
    throw error
  }
}

// Expose walletClient to the global scope for console debugging
;(window as any).walletClient = walletClient

// Root component to handle loading state and modals
const Root: React.FC = () => {
  const [friendIdentity, setFriendIdentity] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showFriendModal, setShowFriendModal] = useState(false)
  const [showDefaultModal, setShowDefaultModal] = useState(false)

  useEffect(() => {
    fetchFriendIdentity(setShowFriendModal, setShowDefaultModal)
      .then(friendKey => {
        setFriendIdentity(friendKey)
      })
      .catch(err => {
        setError((err as Error).message)
      })
  }, [])

  if (error) {
    return <div>Error initializing app: {error}</div>
  }

  if (!friendIdentity) {
    return (
      <div>
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
                Please switch to a "friend" profile in Metanet client to fetch
                your friend’s identity key. If you don’t have a "friend"
                profile, create one now.
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
                The app has fetched your friend’s identity key. Now, please
                switch back to your "default" profile in Metanet client to
                proceed with the remaining tests.
              </p>
              <p>Waiting for wallet switch...</p>
            </div>
          </div>
        )}

        {/* Loading message when no modal is active */}
        {!showFriendModal && !showDefaultModal && <div>Loading...</div>}
      </div>
    )
  }

  return <App />
}

const root = createRoot(document.getElementById('root') as HTMLElement)
root.render(<Root />)