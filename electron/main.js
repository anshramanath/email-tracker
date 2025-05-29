import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { getUnreadEmails } from './gmail.js'
import { summarizeText } from './summarize.js'

// Convert ES module URL to __dirname equivalent (Node doesn't provide __dirname in ESM)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Check if we're in development mode
const isDev = process.env.NODE_ENV === 'development'

function createWindow() {
  const win = new BrowserWindow({
    width: 700,
    height: 610,
    resizable: false,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  })    

  // Load local dev server or production build
  const url = isDev
    ? 'http://localhost:5173' // Vite or React dev server
    : `file://${path.join(__dirname, '../react-app/dist/index.html')}`

  win.loadURL(url)

  console.log('✅ Electron window created')
}

// App lifecycle: Create the window when Electron is ready
app.whenReady().then(() => {
  createWindow()

  // On macOS, re-create the window when clicking the dock icon
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit the app when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// IPC handler: Respond to get-emails from the renderer
ipcMain.handle('get-emails', async () => {
  try {
    const emails = await getUnreadEmails() // Your Gmail logic
    return emails
  } catch (err) {
    console.error('❌ Failed in main process:', err)
    return ['Failed to fetch emails']
  }
})

// IPC handler: Summarize emails using the LLM
ipcMain.handle('summarize-emails', async (_event, emails, prompt) => {
  try {
    const summaryList = await summarizeText(emails, prompt)
    return summaryList
  } catch (err) {
    console.error('❌ Error summarizing:', err)
    return ['Prompt Status: Failed to summarize']
  }
})