import React from 'react'
import { Typography } from '@mui/material'

const Footer: React.FC = () => {
  return (
    <>
      <br />
      <br />
      <Typography align="center" paragraph>
        Check out the{' '}
        <a href="https://bsv-blockchain.github.io/ts-sdk/">
          Bitcoin SV SDK
        </a>
        
      </Typography>
      <Typography align="center">
        <a href="https://projectbabbage.com">www.ProjectBabbage.com</a>
      </Typography>
    </>
  )
}

export default Footer