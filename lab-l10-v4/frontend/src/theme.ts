import { createTheme } from "@mui/material/styles"

const customSpacing = (factor: number): string => `${8 * factor}px`

const web3Theme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#00d1b2'
      },
      secondary: {
        main: '#7e57c2'
      },
      background: {
        default: '#121212',
        paper: '#242424'
      },
      error: {
        main: '#ff3860'
      }
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h4: {
        fontWeight: 700
      },
      button: {
        textTransform: 'none'
      }
    },
    spacing: customSpacing
  })
  
  export default web3Theme