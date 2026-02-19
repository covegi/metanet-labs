import React from 'react'
import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import theme from './theme'
import CommitmentForm from './components/CommitmentForm'
import './App.scss'

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <CommitmentForm />
    </ThemeProvider>
  )
}

export default App