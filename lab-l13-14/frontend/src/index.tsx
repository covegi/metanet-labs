import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"

import { ThemeProvider, CssBaseline } from "@mui/material"
import web3Theme from "./theme"

const rootElement = document.getElementById("root")
if (!rootElement) {
    const div = document.createElement("div")
    div.innerHTML = "<h1>Missing Root Element</h1><p>The root element was not found. Please check your index.html.</p>"
    document.body.append(div)
    throw new Error("Root element not found")
}

const root = ReactDOM.createRoot(rootElement)
root.render(
    <React.StrictMode>
        <ThemeProvider theme={web3Theme}>
            <CssBaseline>
                <App />
            </CssBaseline>
        </ThemeProvider>
    </React.StrictMode>
)