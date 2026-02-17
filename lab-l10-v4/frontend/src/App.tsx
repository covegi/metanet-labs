import React, { useState } from 'react'
import {
  Button,
  Typography,
  Container,
  CircularProgress,
  Card,
  CardContent
} from '@mui/material'
import {
  WalletClient,
  AuthFetch
} from '@bsv/sdk'

const PORT = 3000
const SERVER_URL = `http://localhost:${PORT}`

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<string | null>(null)
  const [weather, setWeather] = useState<any | null>(null)

  const handleWeatherRequest = async () => {
    setIsLoading(true)
    setResponse(null)

    try {
      const wallet = new WalletClient('json-api', 'localhost')
      const authFetch = new AuthFetch(wallet)

      const res = await authFetch.fetch(`${SERVER_URL}/weather`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!res.ok) {
        throw new Error(`Server responded with status ${res.status}`)
      }

      const data = await res.json()
      setWeather(data)
      console.log('weather data:', data)

    } catch (err: any) {
      setResponse(`Error: ${err.message || err}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" component="h1" gutterBottom>
        Weather Request App
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={handleWeatherRequest}
        disabled={isLoading}
      >
        {isLoading ? <CircularProgress size={24} /> : 'Send Weather Request'}
      </Button>

      {response && (
        <Typography variant="body1" style={{ marginTop: 20 }}>
          Response from backend: {response}
        </Typography>
      )}

      {weather && (
        <Card style={{ marginTop: 20 }}>
          <CardContent>
            <Typography variant="h4">{weather.name} Weather</Typography>
            <Typography variant="h6">
              Temp: {weather.main.temp} °C
            </Typography>
            <Typography variant="body2">
              High: {weather.main.temp_max} °C
            </Typography>
            <Typography variant="body2">
              Low: {weather.main.temp_min} °C
            </Typography>
            <Typography variant="body2">
              Humidity: {weather.main.humidity}%
            </Typography>
          </CardContent>
        </Card>
      )}
    </Container>
  )
}

export default App