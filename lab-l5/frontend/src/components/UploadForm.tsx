import React, { useState, type ChangeEvent, type FormEvent, useEffect } from 'react'
import {
  Button,
  LinearProgress,
  Grid,
  Select,
  MenuItem,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  SelectChangeEvent
} from '@mui/material'
import { CloudUpload } from '@mui/icons-material'
import { toast } from 'react-toastify'
import constants from '../utils/constants.js'
import WalletClient from '@bsv/sdk/wallet/WalletClient'
import { StorageUploader } from '@bsv/sdk/storage/StorageUploader'

interface UploadFormProps {}

const DURATION_OPTIONS = {
  '15min': 15,
  '3 Hours': 180,
  '1 Day': 1440,
  '1 Week': 1440 * 7,
  '1 Month': 1440 * 30,
  '3 Months': 1440 * 90,
  '6 Months': 1440 * 180,
  '1 Year': 525600,
  '2 Years': 525600 * 2,
  '5 Years': 525600 * 5,
  '10 Years': 525600 * 10,
  '20 Years': 525600 * 20,
  '30 Years': 525600 * 30,
  '50 Years': 525600 * 50,
  '100 Years': 525600 * 100
}

const UploadForm: React.FC<UploadFormProps> = () => {
  const [storageURL, setStorageURL] = useState<string>('')
  const [storageURLs, setStorageURLs] = useState<string[]>(
    constants.storageUrls.map(x => x.toString())
  )
  const [hostingMinutes, setHostingMinutes] = useState<number>(180)
  const [loading, setLoading] = useState<boolean>(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isFormValid, setIsFormValid] = useState<boolean>(false)
  const [results, setResults] = useState<{ uhrpURL: string } | null>(null)
  const [actionTXID, setActionTXID] = useState('')
  const [inputsValid, setInputsValid] = useState<boolean>(false)
  const [openDialog, setOpenDialog] = useState<boolean>(false)
  const [newOption, setNewOption] = useState<string>('')

  useEffect(() => {
    setInputsValid(storageURL.trim() !== '')
  }, [storageURL])

  useEffect(() => {
    if (constants.storageUrls && constants.storageUrls.length > 0) {
      setStorageURL(constants.storageUrls[0].toString())
    }
  }, [])

  useEffect(() => {
    setIsFormValid(
      storageURL.trim() !== '' && hostingMinutes >= 15 && file !== null
    )
  }, [storageURL, hostingMinutes, file])

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setActionTXID('')

    try {
        const wallet = new WalletClient("auto", "localhost")
        const storageUploader = new StorageUploader({
            storageURL: storageURL,
            wallet: wallet
    })

    if (!file || file === null) {
        throw new Error("No file was uploaded!")
    }

    let numberArray: number[]

    try {
        const arrayBuffer = await file.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        numberArray = Array.from(uint8Array)
    } catch (error) {
        throw new Error("Failed to read the file. Please try again with a valid file.")
    }

    const uploadableFile = {
        data: numberArray,
        type: file.type
    }

    const result = await storageUploader.publishFile({
        file: uploadableFile,
        retentionPeriod: DURATION_OPTIONS['1 Day']
    })
    setResults({ uhrpURL: result.uhrpURL})

    } catch (error) {
        console.log("Upload failed:", error)
        toast.error("Upload failed")
        throw error
    } finally {
        setLoading(false)
        setUploadProgress(0)
    }
}

const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files

    if (selectedFiles && selectedFiles.length > 0) {
      const firstFile = selectedFiles[0]
      if (firstFile instanceof File) {
        setFile(firstFile)
      } else {
        console.error('Invalid file object received:', firstFile)
      }
    } else {
      setFile(null)
    }
  }

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const selectedValue = event.target.value
    if (selectedValue === 'add-new-option') {
      setOpenDialog(true)
    } else {
      setStorageURL(selectedValue)
    }
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
  }

  const handleAddOption = () => {
    if (newOption.trim() !== '' && !constants.storageUrls.includes(newOption)) {
      setStorageURLs(prevStorageURLs => [...prevStorageURLs, newOption])
      setStorageURL(newOption)
      setNewOption('')
      setOpenDialog(false)
    }
  }

  return (
    <form onSubmit={handleUpload}>
      <Grid container spacing={3} sx={{ py: 2 }}>
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'medium' }}>
            Upload Form
          </Typography>
          <Typography color="textSecondary" paragraph sx={{ mb: 3 }}>
            Upload files to UHRP Storage
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel>UHRP Storage Server URL</InputLabel>
            <Select
              value={storageURL}
              onChange={handleSelectChange}
              label="Storage Server URL"
            >
              {storageURLs.map((url, index) => (
                <MenuItem key={index} value={url.toString()}>
                  {url.toString()}
                </MenuItem>
              ))}
              <MenuItem value="add-new-option">+ Add New Option</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel>Duration</InputLabel>
            <Select
              fullWidth
              label="Duration"
              variant="outlined"
              value={hostingMinutes}
              onChange={(e: SelectChangeEvent<number>) => {
                setHostingMinutes(e.target.value as number)
              }}
            >
              {Object.entries(DURATION_OPTIONS).map(([label, value]) => (
                <MenuItem key={label} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sx={{ mb: 3 }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Select a file to upload
          </Typography>
          <input
            type="file"
            name="file"
            onChange={handleFileChange}
            style={{
              padding: '10px 0',
              width: '100%'
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <Dialog
            open={openDialog}
            onClose={handleCloseDialog}
            PaperProps={{
              elevation: 24,
              sx: { borderRadius: 2 }
            }}
          >
            <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
              Add a New Server URL
            </DialogTitle>
            <DialogContent sx={{ pt: 3, pb: 2, px: 3, mt: 1 }}>
              <TextField
                autoFocus
                margin="dense"
                label="URL"
                type="text"
                fullWidth
                value={newOption}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewOption(e.target.value)
                }
                placeholder="Enter complete URL including http:// or https://"
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 1 }}
              >
                Enter the full URL of the UHRP storage server you want to add
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button
                onClick={handleCloseDialog}
                variant="outlined"
                sx={{ borderRadius: 2 }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddOption}
                variant="contained"
                color="primary"
                sx={{ borderRadius: 2 }}
                disabled={!newOption.trim()}
              >
                Add
              </Button>
            </DialogActions>
          </Dialog>
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
            disabled={loading || !isFormValid}
            startIcon={<CloudUpload />}
            sx={{ borderRadius: 2, px: 3, py: 1 }}
          >
            Upload
          </Button>
        </Grid>
        {loading && (
          <Grid item xs={12} sx={{ mt: 2 }}>
            <LinearProgress
              variant={uploadProgress === 0 ? 'indeterminate' : 'determinate'}
              value={uploadProgress}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Grid>
        )}
        {results && (
          <Grid
            item
            xs={12}
            sx={{ mt: 3, p: 2, bgcolor: 'success.light', borderRadius: 2 }}
          >
            <Typography variant="h6" sx={{ color: 'success.dark', mb: 2 }}>
              Upload Successful!
            </Typography>

            {actionTXID && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                <b>Payment TXID:</b> {actionTXID}
              </Typography>
            )}

            <Typography variant="body2" sx={{ mb: 1 }}>
              <b>UHRP URL (can never change, works with all nodes):</b>
            </Typography>
            <Typography
              variant="body1"
              sx={{
                p: 1.5,
                bgcolor: 'background.paper',
                borderRadius: 1,
                wordBreak: 'break-all',
                mb: 2,
                fontFamily: 'monospace'
              }}
            >
              {results.uhrpURL}
            </Typography>

            <Typography variant="body2" sx={{ mb: 1 }}>
              <b>
                Legacy HTTPS URL (only for this node and commitment, may
                expire):
              </b>
            </Typography>
            <Typography
              variant="body1"
              sx={{
                p: 1.5,
                bgcolor: 'background.paper',
                borderRadius: 1,
                wordBreak: 'break-all',
                fontFamily: 'monospace'
              }}
            >
              <a
                href={results.uhrpURL}
                target="_blank"
                rel="noopener noreferrer"
              >
                {results.uhrpURL}
              </a>
            </Typography>
          </Grid>
        )}
      </Grid>
    </form>
  )
}

export default UploadForm