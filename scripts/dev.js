const { spawn } = require('child_process')
const waitOn = require('wait-on')

// Build electron first
const buildElectron = spawn('npm', ['run', 'build:electron'], {
  stdio: 'inherit',
  shell: true,
})

buildElectron.on('close', (code) => {
  if (code !== 0) {
    console.error('Failed to build electron files')
    process.exit(1)
  }

  // Start Vite dev server
  const vite = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
  })

  // Wait for Vite to be ready, then start Electron
  waitOn({
    resources: ['http://localhost:5173'],
    timeout: 30000,
  })
    .then(() => {
      console.log('Vite is ready, starting Electron...')
      const electron = spawn('electron', ['.'], {
        stdio: 'inherit',
        shell: true,
      })

      electron.on('close', () => {
        vite.kill()
        process.exit(0)
      })
    })
    .catch((err) => {
      console.error('Error waiting for Vite:', err)
      vite.kill()
      process.exit(1)
    })
})

