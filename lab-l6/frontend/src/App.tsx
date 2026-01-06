import React, { useState } from 'react'
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider
} from '@mui/material'
import { resolveIdentityByKey, searchIdentities } from './IdentityExplorer'
import { DisplayableIdentity } from '@bsv/sdk'
import { Img } from '@bsv/uhrp-react'
import Footer from './utils/footer'

const App: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<DisplayableIdentity[]>([])
  const [selectedResult, setSelectedResult] =
    useState<DisplayableIdentity | null>(null)
  const [identityKeyInput, setIdentityKeyInput] = useState('')

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value
    setSearchTerm(term)
    if (term.trim().length < 2) {
      setSearchResults([])
      return
    }
    const results = await searchIdentities(term)
    setSearchResults(results)
  }

  const handleKeyLookup = async () => {
    const result = await resolveIdentityByKey(identityKeyInput)
    setSelectedResult(result)
  }

  return (
    <>
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Lab L-6 Implementing Identity Resolution
        </Typography>

        {/* Key Lookup Section */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Resolve by Identity Key
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="Identity Key"
              variant="outlined"
              value={identityKeyInput}
              onChange={e => setIdentityKeyInput(e.target.value)}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleKeyLookup}
            >
              Lookup
            </Button>
          </Box>
        </Box>

        {/* Search by Attribute */}
        <Box sx={{ mt: 5 }}>
          <Typography variant="h6" gutterBottom>
            Search by Name / Email / Username
          </Typography>
          <TextField
            fullWidth
            label="Search"
            variant="outlined"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <List>
            {searchResults.map((res, index) => (
              <ListItem key={`${res.identityKey}-${index}`} disablePadding>
                <ListItemButton onClick={() => setSelectedResult(res)}>
                  <ListItemText
                    primary={res.name}
                    secondary={res.abbreviatedKey}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Selected Identity */}
        {selectedResult && (
          <Box sx={{ mt: 6, textAlign: 'center' }}>
            <Divider sx={{ mb: 3 }} />
            <Typography variant="h6" gutterBottom>
              Selected Identity
            </Typography>
            <Img
              src={selectedResult.avatarURL}
              alt="Avatar"
              style={{ width: 100, height: 100, borderRadius: '50%' }}
            />
            <Typography variant="h5" sx={{ mt: 2 }}>
              {selectedResult.name}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {selectedResult.abbreviatedKey}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {selectedResult.badgeLabel}
            </Typography>
          </Box>
        )}
      </Container>
      <Footer />
    </>
  )
}

export default App