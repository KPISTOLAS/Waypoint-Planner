import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path from 'path'
import fs from 'fs/promises'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'default',
  })

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged
  
  // Set Content Security Policy
  // Note: In dev mode, we need 'unsafe-eval' for Vite HMR, which is why the warning appears
  // This is expected and safe for development. In production builds, the CSP will be stricter.
  if (!isDev) {
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self' 'unsafe-inline' data: blob: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https:; font-src 'self' data: https:;"
          ],
        },
      })
    })
  }
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC Handlers
ipcMain.handle('save-file', async (_, data: string, filename: string) => {
  const { filePath } = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: filename,
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
  })
  if (filePath) {
    await fs.writeFile(filePath, data, 'utf-8')
    return filePath
  }
  return null
})

ipcMain.handle('open-file', async () => {
  const { filePaths } = await dialog.showOpenDialog(mainWindow!, {
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'KMZ Files', extensions: ['kmz'] },
    ],
    properties: ['openFile'],
  })
  if (filePaths.length > 0) {
    const filePath = filePaths[0]
    const isKMZ = filePath.toLowerCase().endsWith('.kmz')
    
    if (isKMZ) {
      // Read KMZ as binary buffer
      const buffer = await fs.readFile(filePath)
      // Convert buffer to base64 for transmission
      const base64 = buffer.toString('base64')
      return { path: filePath, content: base64, isBinary: true }
    } else {
      // Read JSON as text
      const content = await fs.readFile(filePath, 'utf-8')
      return { path: filePath, content, isBinary: false }
    }
  }
  return null
})

ipcMain.handle('import-kmz', async (_, filePath: string) => {
  // KMZ import logic will be implemented
  return null
})

ipcMain.handle('export-kmz', async (_, data: any, filePath: string) => {
  // KMZ export logic will be implemented
  return null
})

ipcMain.handle('open-external', async (_, url: string) => {
  await shell.openExternal(url)
})

