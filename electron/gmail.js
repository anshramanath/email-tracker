import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { google } from 'googleapis'
import open from 'open'
import http from 'http'
import url from 'url'

// Convert ES module URL to usable __filename and __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Gmail API scope for read-only access
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

// Paths to store OAuth tokens and credentials
const TOKEN_PATH = path.join(__dirname, 'token.json')
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json')

// Try to load a previously saved token from disk
function loadSavedToken() {
  if (fs.existsSync(TOKEN_PATH)) {
    const content = fs.readFileSync(TOKEN_PATH, 'utf-8')
    return JSON.parse(content)
  }
  return null
}

// Save a new token to disk
function saveToken(token) {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(token))
}

// Load and return an authenticated Gmail client
async function loadGmailClient() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'))
  const { client_secret, client_id } = credentials.installed

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    'http://localhost:3000/oauth2callback' // Redirect URI for local auth
  )

  const token = loadSavedToken()
  if (token) {
    oAuth2Client.setCredentials(token)
    return oAuth2Client
  }

  // If no token saved, start interactive OAuth flow
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  })

  console.log('Authorize this app by visiting this URL:', authUrl)
  await open(authUrl) // Opens the URL in user's default browser

  // Wait for the user to authorize and the browser to redirect back with a code
  const code = await waitForCode()

  // Exchange the auth code for access tokens
  const { tokens } = await oAuth2Client.getToken(code)
  oAuth2Client.setCredentials(tokens)
  saveToken(tokens) // Save tokens for next time

  return oAuth2Client
}

// Starts a temporary HTTP server to capture the OAuth redirect code
function waitForCode() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const qs = new url.URL(req.url, 'http://localhost:3000').searchParams
      const code = qs.get('code')
      if (code) {
        res.end('Authentication successful! You can close this window.')
        server.close()
        resolve(code)
      } else {
        res.end('No code received.')
        reject(new Error('No code received'))
      }
    }).listen(3000) // Listen on port 3000 for Google's redirect
  })
}

// Main function: Fetch unread Gmail messages and return short snippets
export async function getUnreadEmails() {
  const auth = await loadGmailClient()
  const gmail = google.gmail({ version: 'v1', auth })

  const res = await gmail.users.messages.list({
    userId: 'me',
    q: 'is:unread',
    maxResults: 20 // Limit to 5 unread emails
  })

  const messages = res.data.messages || []

  // For each message, fetch the full message and return just the snippet (preview)
  const summaries = await Promise.all(
    messages.map(async (msg) => {
      const full = await gmail.users.messages.get({ userId: 'me', id: msg.id })
      return full.data.snippet
    })
  )

  return summaries
}