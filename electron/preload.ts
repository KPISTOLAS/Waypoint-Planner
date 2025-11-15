import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  saveFile: (data: string, filename: string) =>
    ipcRenderer.invoke('save-file', data, filename),
  openFile: () => ipcRenderer.invoke('open-file'),
  
  // KMZ operations
  importKMZ: (filePath: string) =>
    ipcRenderer.invoke('import-kmz', filePath),
  exportKMZ: (data: any, filePath: string) =>
    ipcRenderer.invoke('export-kmz', data, filePath),
  
  // External URL
  openExternal: (url: string) =>
    ipcRenderer.invoke('open-external', url),
})

