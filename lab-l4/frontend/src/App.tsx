import React, { useState } from "react"
import { createAndSubmitToken, queryToken } from "./helloWorldToken"

export default function App() {
    const [message, setMessage] = useState("Hello Blockchain!")
    const [isLoading, setIsLoading] = useState(false)
    const [status, setStatus] = useState("")
    const [queryResult, setQueryResult] = useState("")

    const handleCreateAndSubmitToken = async () => {
        try {
            setIsLoading(true)
            setStatus("Creating and submitting tokens...")

            await createAndSubmitToken(message)

            setStatus("Token submitted successfully!")
        } catch (error) {
            console.error("Token creation error:", error)
            setStatus("Failed to create and submit token.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleQueryToken = async () => {
        try {
            setIsLoading(true)
            setStatus("Querying tokens...")

            const result = await queryToken(message)

            setQueryResult(`Found token with message: ${result}`)
            setStatus("Token query successful!")
        } catch (error) {
            console.error("Token query error:", error)
            setStatus("Failed to query token.")
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return (
            <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
                <p>Loading...</p>
            </div>
        )
    }

    return (
        <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
            <h1>Lab L-4: Submitting and Querying Tokens with Overlay Services</h1>
            <div style={{ marginBottom: "1rem" }}>
                <label htmlFor="messageInput">Message:</label>
                <input
                    type="text" 
                    value={message}
                    onChange={(event) => setMessage(event?.target.value)}
                    style={{ width: "100%", padding: "0.5rem" }}
                />
            </div>
            <div style={{ marginBottom: "1rem" }}>
                <button 
                    onClick={handleCreateAndSubmitToken}
                    style={{ marginRight: "1rem" }}
                >
                Create and submit token
                </button>
                <button
                    onClick={handleQueryToken}
                >
                Query token
                </button>
            </div>

            <div style={{ marginBottom: "1rem", color: "gray" }}>{status}</div>

            {queryResult && (
                <div>
                    <h3>Queried Tokens Message</h3>
                    <pre>{queryResult}</pre>
                </div>
            )}

        </div>
    )
       
}