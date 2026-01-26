import React, { useState } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Stack,
  Box
} from '@mui/material';

export default function App() {
  const [message, setMessage] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  const handleLogEvent = async () => {
    setStatus('Logging...');
    try {
      const response = await fetch('http://localhost:3000/log-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventData: { message } })
      });
      console.log("[RESPONSE]", response.body)

      const data = await response.json();
      console.log("[data]", data)

      if (response.ok) {
        setStatus(`Logged with txid: ${data.txid}`);
        setMessage('');
      } else {
        setStatus(`Failed: ${data.message}`);
      }
    } catch (error) {
      setStatus(`Error: ${String(error)}`);
    }
  };

  const handleRetrieveLogs = async () => {
    setStatus('Fetching logs...');
    try {
      const response = await fetch('http://localhost:3000/retrieve-logs');
      const data = await response.json();
      console.log("[RETRIEVING LOGS]", data)
      if (response.ok && Array.isArray(data.logs)) {
        setLogs(data.logs);
        setStatus('Logs retrieved');
      } else {
        setStatus('Failed to retrieve logs');
      }
    } catch (error) {
      setStatus(`Error retrieving logs: ${String(error)}`);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Stack spacing={4} alignItems="center">
        <Typography variant="h4" fontWeight="bold" align="center">
          Lab L-12: Event Logger
        </Typography>
        <TextField
          fullWidth
          label="Enter an event message"
          variant="outlined"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Stack direction="row" spacing={2}>
          <Button variant="contained" color="primary" onClick={handleLogEvent}>
            Log Event
          </Button>
          <Button variant="contained" color="success" onClick={handleRetrieveLogs}>
            Retrieve Logs
          </Button>
        </Stack>
        {status && (
          <Typography variant="body2" color="text.secondary" align="center">
            {status}
          </Typography>
        )}
        <Card sx={{ width: '100%', maxWidth: '1000px', overflowX: 'auto', bgcolor: 'grey.900', color: 'white', p: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom align="center">
              Logged Events
            </Typography>
            {logs.length === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center">
                No logs yet.
              </Typography>
            ) : (
              <Box component="ul" sx={{ listStyleType: 'disc', pl: 4, m: 0 }}>
                {logs.map((log, idx) => (
                  <Box component="li" key={idx}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'nowrap', overflowX: 'auto' }}>
                      {log}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}