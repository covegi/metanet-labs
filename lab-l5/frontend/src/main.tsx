import React from 'react'
import ReactDOM from 'react-dom/client'
import { CssBaseline } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import App from './App'
import web3Theme from './theme'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const rootElement = document.getElementById('root') as HTMLElement
if (!rootElement) {
  const div = document.createElement("div")
  div.style.padding = "2rem"
  div.style.fontFamily = "Arial, sans-serif"
  div.innerHTML = "<h1>Initialization Error</h1><p>Root element not found. Please check your index.html.</p>"
  document.body.append(div)
} else {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <ThemeProvider theme={web3Theme}>
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <CssBaseline />
      <App />
    </ThemeProvider>
  )
}
