export interface ElectronAPI {
  saveFile: (data: string, filename: string) => Promise<string | null>
  openFile: () => Promise<{ path: string; content: string; isBinary?: boolean } | null>
  exportKMZ: (data: any, filePath: string) => Promise<void>
  importKMZ: (filePath: string) => Promise<any>
  openExternal?: (url: string) => Promise<void>
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

