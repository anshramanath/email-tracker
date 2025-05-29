import { useState } from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

declare global {
  interface Window {
    electronAPI: {
      getEmails: () => Promise<string[]>
      summarizeEmails: (emails: string[], prompt: string) => Promise<string[]>
    }
  }
}

export default function App() {
  const [prompt, setPrompt] = useState('')
  const [summary, setSummary] = useState<string[]>([])
  const [visibleCount, setVisibleCount] = useState(5)
  const [loading, setLoading] = useState(false)

  const fetchEmails = async () => {
    setLoading(true)
    try {
      const emails = await window.electronAPI.getEmails()
      const output = await window.electronAPI.summarizeEmails(emails, prompt)
      setSummary(output)
      setVisibleCount(5) // reset visible count on new query
    } catch (err) {
      console.log('Error fetching emails:', err)
      setSummary(['❌ Failed to fetch emails'])
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    window.close()
  }

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 5)
  }

  return (
    <Box>
      {/* Top Bar */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          ✨ Email Tracker
        </Typography>
        <IconButton onClick={handleClose} sx={{ backgroundColor: '#fff', boxShadow: 1 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Typography variant="body2" sx={{ mb: 2 }}>
        Anything we should keep an eye out for?
      </Typography>

      {summary.length > 0 && (
        <Box
          sx={{
            backgroundColor: '#e3f2fd',
            borderLeft: '4px solid #2196f3',
            borderRadius: 1,
            p: 1.5,
            mb: 2,
          }}
        >
          <Typography variant="body2" fontWeight={500}>
            {summary[0]}
          </Typography>
        </Box>
      )}

      <TextField
        fullWidth
        size="small"
        variant="outlined"
        label="e.g. internships, mail..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        sx={{ mb: 1.5 }}
      />

      <Button
        variant="contained"
        color="primary"
        fullWidth
        disabled={loading}
        onClick={fetchEmails}
        sx={{ mb: 2 }}
      >
        {loading ? 'Checking...' : summary ? '⏳ Check Again' : '🔍 Check My Emails'}
      </Button>

      {summary.length > 1 && (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle1" gutterBottom>
            📩 Emails:
          </Typography>
          <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
            <List disablePadding>
              {summary.slice(1, visibleCount + 1).map((item, idx) => (
                <ListItem
                  key={idx}
                  sx={{
                    backgroundColor: '#f9f9f9',
                    mb: 1,
                    borderLeft: '4px solid #90caf9',
                    borderRadius: 1,
                    px: 2,
                    py: 0.75,
                    boxShadow: 1,
                  }}
                >
                  <ListItemText primaryTypographyProps={{ variant: 'body2' }} primary={item} />
                </ListItem>
              ))}
            </List>

            {/* Load More Button */}
            {visibleCount < summary.length && (
              <Button
                variant="outlined"
                fullWidth
                onClick={handleLoadMore}
                sx={{ mt: 1 }}
              >
                Load More
              </Button>
            )}
          </Box>
        </Box>
      )}
    </Box>
  )
}