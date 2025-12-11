import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import { createTransaction } from "./createTx"

createTransaction()
    .then(() => {
        console.log("Transaction created successfully")
    })
    .catch(error => {
        console.error('Failed to create transaction:', error)
    })

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement)
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)