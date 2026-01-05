import React, { FormEvent, useState, useEffect } from 'react'
import {
  Button,
  LinearProgress,
  Grid,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material'
import { CloudDownload } from '@mui/icons-material'
import { toast } from 'react-toastify'
import { StorageDownloader } from '@bsv/sdk/storage/StorageDownloader'

interface DownloadFormProps {}

type NetworkType = 'mainnet' | 'testnet' | 'local'

const DownloadForm: React.FC<DownloadFormProps> = () => {
  const [downloadURL, setDownloadURL] = useState<string>('')
  const [network, setNetwork] = useState<NetworkType>('mainnet')
  const [loading, setLoading] = useState<boolean>(false)
  const [inputsValid, setInputsValid] = useState<boolean>(false)

  useEffect(() => {
    setInputsValid(downloadURL.trim() !== '')
  }, [downloadURL])

  const handleDownload = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    toast.info("Initiating download...")
    const storageDownloader = new StorageDownloader({ networkPreset: network })

    try {
        const result = await storageDownloader.download(downloadURL)
        
        if (!result.data || !result.mimeType) {
            throw new Error(`Error fetching file from ${downloadURL}`)
        }

        const uIntArray = new Uint8Array(result.data)
        const blob = new Blob([uIntArray], {
            type: result.mimeType ?? 'application/octet-stream'
        })
        const blobUrl = URL.createObjectURL(blob)
        const fileName = "downloaded_file"

        const a = document.createElement("a")
        a.href = blobUrl
        a.download = fileName

        document.body.appendChild(a)
        a.click()
        a.remove()

        URL.revokeObjectURL(blobUrl)

        toast.success("File downloaded successfully")
    } catch (error) {
        console.log("An error occurred during download", error)
        toast.error("An error occurred during download")
        throw error
    } finally {
        setLoading(false)
    }
  }

  return (
    <form onSubmit={handleDownload}>
      <Grid container spacing={3} sx={{ py: 2 }}>
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'medium' }}>
            Download Form
          </Typography>
          <Typography color="textSecondary" paragraph sx={{ mb: 3 }}>
            Download files from UHRP Storage
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            variant="outlined"
            label="UHRP URL"
            placeholder="Enter UHRP URL to download"
            value={downloadURL}
            onChange={e => setDownloadURL(e.target.value)}
            sx={{ mb: 2 }}
          />
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth variant="outlined" sx={{ mb: 3 }}>
            <InputLabel id="network-select-label">Network</InputLabel>
            <Select
              labelId="network-select-label"
              value={network}
              label="Network"
              onChange={(e: SelectChangeEvent<string>) => {
                setNetwork(e.target.value as NetworkType)
              }}
            >
              <MenuItem value="mainnet">Mainnet</MenuItem>
              <MenuItem value="testnet">Testnet</MenuItem>
              <MenuItem value="local">Local</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid
          item
          xs={12}
          sx={{ display: 'flex', justifyContent: 'flex-start' }}
        >
          <Button
            variant="contained"
            color="primary"
            size="large"
            type="submit"
            disabled={loading || !inputsValid}
            startIcon={<CloudDownload />}
            sx={{ borderRadius: 2, px: 3, py: 1 }}
          >
            Download
          </Button>
        </Grid>

        {loading && (
          <Grid item xs={12} sx={{ mt: 2 }}>
            <LinearProgress sx={{ height: 6, borderRadius: 3 }} />
          </Grid>
        )}
      </Grid>
    </form>
  )
}

export default DownloadForm
