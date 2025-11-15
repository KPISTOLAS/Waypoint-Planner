/**
 * Dynamically load leaflet-draw from CDN
 * This avoids Vite bundling issues with leaflet-draw
 */
export const loadLeafletDraw = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if ((window as any).L?.Draw) {
      resolve()
      return
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[data-leaflet-draw]')
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve())
      existingScript.addEventListener('error', () => reject(new Error('Failed to load leaflet-draw')))
      return
    }

    // Load the script
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.js'
    script.setAttribute('data-leaflet-draw', 'true')
    script.onload = () => {
      // Wait a bit for it to extend L
      setTimeout(() => {
        if ((window as any).L?.Draw) {
          resolve()
        } else {
          reject(new Error('Leaflet Draw loaded but L.Draw not available'))
        }
      }, 100)
    }
    script.onerror = () => reject(new Error('Failed to load leaflet-draw script'))
    document.head.appendChild(script)
  })
}

