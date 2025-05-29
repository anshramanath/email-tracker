const { contextBridge, ipcRenderer } = require('electron')

// Expose a secure, limited API from the preload script to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Renderer can now call: window.electronAPI.getEmails()
  getEmails: () => ipcRenderer.invoke('get-emails'),

  // Renderer can now call: window.electronAPI.summarizeEmails(emails, prompt)
  summarizeEmails: (emails, prompt) => ipcRenderer.invoke('summarize-emails', emails, prompt)
})