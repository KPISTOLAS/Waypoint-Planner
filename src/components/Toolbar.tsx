import React, { useState, useEffect } from 'react'
import { useAtom } from 'jotai'
import { currentFlightPlanAtom, waypointsAtom, flightSettingsAtom, droneModelAtom } from '../store/flightPlanStore'
import { FlightPlan } from '../types'
import { exportToKMZ, importFromKMZ, parseKMLPolygon, parseWGS84, generateWaypointsFromPolygonCoords } from '../utils/kmzHandler'
import { splitMission, getRecommendedSplit } from '../utils/missionSplitter'
import { Save, FolderOpen, Download, Upload, Trash2, Scissors, HelpCircle } from 'lucide-react'
import './Toolbar.css'

const Toolbar: React.FC = () => {
  const [flightPlan, setFlightPlan] = useAtom(currentFlightPlanAtom)
  const [waypoints, setWaypoints] = useAtom(waypointsAtom)
  const [settings] = useAtom(flightSettingsAtom)
  const [droneModel] = useAtom(droneModelAtom)
  const [showSplitDialog, setShowSplitDialog] = useState(false)
  const [waypointsPerMission, setWaypointsPerMission] = useState(50)

  // Auto-create flight plan if it doesn't exist (backup initialization)
  // Main initialization happens in MainLayout.tsx
  useEffect(() => {
    if (!flightPlan) {
      const newPlan: FlightPlan = {
        id: Date.now().toString(),
        name: 'New Flight Plan',
        droneModel,
        waypoints: [],
        settings,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      setFlightPlan(newPlan)
      console.log('Toolbar: Auto-created flight plan (backup):', newPlan)
    }
  }, [flightPlan, droneModel, settings, setFlightPlan])

  // Update flight plan when waypoints or settings change
  useEffect(() => {
    if (flightPlan) {
      setFlightPlan({
        ...flightPlan,
        waypoints,
        settings,
        updatedAt: new Date(),
      })
    }
  }, [waypoints, settings, flightPlan, setFlightPlan])


  const handleSave = async () => {
    if (!flightPlan) return
    
    const planToSave = {
      ...flightPlan,
      waypoints,
      settings,
      updatedAt: new Date(),
    }
    
    const data = JSON.stringify(planToSave, null, 2)
    
    if (window.electronAPI) {
      const filePath = await window.electronAPI.saveFile(data, `${flightPlan.name}.json`)
      if (filePath) {
        setFlightPlan({ ...planToSave, updatedAt: new Date() })
      }
    } else {
      // Fallback for browser
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${flightPlan.name}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleOpen = async () => {
    try {
      let result: { path: string; content: string; isBinary?: boolean } | null = null
      let file: File | null = null

      if (window.electronAPI) {
        // Use Electron file dialog
        result = await window.electronAPI.openFile()
        if (result && result.isBinary) {
          // Convert base64 back to binary and create File object
          const binaryString = atob(result.content)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          const blob = new Blob([bytes], { type: 'application/vnd.google-earth.kmz' })
          file = new File([blob], result.path.split(/[/\\]/).pop() || 'file.kmz', { type: 'application/vnd.google-earth.kmz' })
        }
      } else {
        // Fallback for browser - use file input
        result = await new Promise<{ path: string; content: string } | null>((resolve) => {
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = '.json,.kmz'
          input.onchange = async (e) => {
            const selectedFile = (e.target as HTMLInputElement).files?.[0]
            if (selectedFile) {
              file = selectedFile
              try {
                if (selectedFile.name.toLowerCase().endsWith('.kmz')) {
                  // For KMZ, we'll use the File object directly
                  resolve({ path: selectedFile.name, content: '' })
                } else {
                  // For JSON, read as text
                  const content = await selectedFile.text()
                  resolve({ path: selectedFile.name, content })
                }
              } catch (error) {
                console.error('Failed to read file:', error)
                alert('Failed to read file. Please try again.')
                resolve(null)
              }
            } else {
              resolve(null)
            }
          }
          input.oncancel = () => resolve(null)
          input.click()
        })
      }

      if (!result) {
        return // User cancelled
      }

      const filePath = result.path.toLowerCase()
      
      // Check if it's a KMZ file
      if (filePath.endsWith('.kmz')) {
        try {
          if (!file) {
            throw new Error('File object not available for KMZ import')
          }
          
          const kmzData = await importFromKMZ(file)
          
          if (kmzData.waypoints.length > 0) {
            const newPlan: FlightPlan = {
              id: Date.now().toString(),
              name: kmzData.name || 'Imported Flight Plan',
              droneModel: droneModel,
              waypoints: kmzData.waypoints,
              settings: settings,
              createdAt: new Date(),
              updatedAt: new Date(),
            }
            setFlightPlan(newPlan)
            setWaypoints(kmzData.waypoints)
            alert(`Successfully imported ${kmzData.waypoints.length} waypoints from KMZ file.`)
          } else {
            alert('KMZ file contains no waypoints.')
          }
        } catch (error) {
          console.error('Failed to import KMZ:', error)
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          alert(`Failed to import KMZ file: ${errorMessage}`)
        }
      } else {
        // JSON file
        try {
          if (!result.content) {
            throw new Error('File content is empty')
          }
          
          const plan = JSON.parse(result.content) as FlightPlan
          
          // Validate the plan structure
          if (!plan.waypoints || !Array.isArray(plan.waypoints)) {
            throw new Error('Invalid flight plan format: missing waypoints array')
          }
          
          setFlightPlan(plan)
          setWaypoints(plan.waypoints || [])
          
          alert(`Successfully loaded flight plan "${plan.name}" with ${plan.waypoints.length} waypoints.`)
        } catch (error) {
          console.error('Failed to parse file:', error)
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          alert(`Failed to open file: ${errorMessage}`)
        }
      }
    } catch (error) {
      console.error('Error opening file:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`An error occurred while opening the file: ${errorMessage}`)
    }
  }

  const handleExportKMZ = async () => {
    // Ensure flight plan exists (should be auto-created, but just in case)
    const planToUse = flightPlan || {
      id: Date.now().toString(),
      name: 'New Flight Plan',
      droneModel,
      waypoints: [],
      settings,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    // Check for waypoints
    if (waypoints.length === 0) {
      alert('Please add at least one waypoint before exporting to KMZ.')
      return
    }
    
    try {
      const kmzBlob = await exportToKMZ({
        ...planToUse,
        waypoints,
        settings,
        updatedAt: new Date(),
      })
      
      // Use browser download method (works in both Electron and browser)
      const url = URL.createObjectURL(kmzBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${planToUse.name}.kmz`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      console.log('KMZ file exported successfully:', `${planToUse.name}.kmz`)
    } catch (error) {
      console.error('Failed to export KMZ:', error)
      alert('Failed to export KMZ file. Please check the console for details.')
    }
  }

  const handleImport = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.kmz,.kml,.wgs84,.txt'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      
      const fileName = file.name.toLowerCase()
      const fileExtension = fileName.split('.').pop() || ''
      
      try {
        if (fileExtension === 'kmz') {
          // Import KMZ - show the plan
          const kmzData = await importFromKMZ(file)
          if (kmzData.waypoints.length > 0) {
            const newPlan: FlightPlan = {
              id: Date.now().toString(),
              name: kmzData.name || 'Imported Flight Plan',
              droneModel,
              waypoints: kmzData.waypoints,
              settings,
              createdAt: new Date(),
              updatedAt: new Date(),
            }
            setFlightPlan(newPlan)
            setWaypoints(kmzData.waypoints)
            alert(`Successfully imported ${kmzData.waypoints.length} waypoints from KMZ file.`)
          } else {
            alert('KMZ file contains no waypoints.')
          }
        } else if (fileExtension === 'kml') {
          // Import KML - create polygon plan
          const content = await file.text()
          const polygonData = parseKMLPolygon(content)
          
          if (polygonData.coordinates.length >= 3) {
            // Generate waypoints from polygon
            const generatedWaypoints = generateWaypointsFromPolygonCoords(polygonData.coordinates, settings)
            
            if (generatedWaypoints.length > 0) {
              const newPlan: FlightPlan = {
                id: Date.now().toString(),
                name: polygonData.name || 'Imported Polygon Plan',
                droneModel,
                waypoints: generatedWaypoints,
                settings,
                createdAt: new Date(),
                updatedAt: new Date(),
              }
              setFlightPlan(newPlan)
              setWaypoints(generatedWaypoints)
              alert(`Successfully created polygon plan with ${generatedWaypoints.length} waypoints from KML file.`)
            } else {
              alert('Failed to generate waypoints from polygon.')
            }
          } else {
            alert('KML file does not contain a valid polygon (needs at least 3 coordinates).')
          }
        } else if (fileExtension === 'wgs84' || fileExtension === 'txt') {
          // Import WGS84 - create polygon plan
          const content = await file.text()
          const wgs84Data = parseWGS84(content)
          
          if (wgs84Data.coordinates.length >= 3) {
            // Generate waypoints from polygon
            const generatedWaypoints = generateWaypointsFromPolygonCoords(wgs84Data.coordinates, settings)
            
            if (generatedWaypoints.length > 0) {
              const newPlan: FlightPlan = {
                id: Date.now().toString(),
                name: wgs84Data.name || 'Imported WGS84 Plan',
                droneModel,
                waypoints: generatedWaypoints,
                settings,
                createdAt: new Date(),
                updatedAt: new Date(),
              }
              setFlightPlan(newPlan)
              setWaypoints(generatedWaypoints)
              alert(`Successfully created polygon plan with ${generatedWaypoints.length} waypoints from WGS84 file.`)
            } else {
              alert('Failed to generate waypoints from coordinates.')
            }
          } else {
            alert('WGS84 file must contain at least 3 coordinate pairs.')
          }
        } else {
          alert('Unsupported file type. Please select a KMZ, KML, or WGS84 file.')
        }
      } catch (error) {
        console.error('Failed to import file:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        alert(`Failed to import file: ${errorMessage}`)
      }
    }
    input.click()
  }

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all waypoints?')) {
      setWaypoints([])
    }
  }

  const handleHelp = () => {
    const helpUrl = 'https://kpistolas.github.io/Waypoint-Planner/guide.html'
    if (window.electronAPI) {
      // Use Electron's shell.openExternal if available
      window.electronAPI.openExternal?.(helpUrl).catch(() => {
        // Fallback to window.open if openExternal fails
        window.open(helpUrl, '_blank')
      })
    } else {
      // Browser fallback
      window.open(helpUrl, '_blank')
    }
  }

  const handleSplitMission = () => {
    if (!flightPlan || waypoints.length === 0) {
      alert('Please create a flight plan with waypoints before splitting.')
      return
    }

    const recommended = getRecommendedSplit(waypoints.length)
    if (waypoints.length <= recommended) {
      alert(`This mission only has ${waypoints.length} waypoints. Recommended split size is ${recommended}. No need to split.`)
      return
    }

    // Set recommended value when opening dialog
    setWaypointsPerMission(recommended)
    setShowSplitDialog(true)
  }

  const handleConfirmSplit = () => {
    if (!flightPlan) return

    const recommended = getRecommendedSplit(waypoints.length)
    const splitOptions = {
      waypointsPerMission: waypointsPerMission || recommended,
      baseName: flightPlan.name,
    }

    const result = splitMission(
      {
        ...flightPlan,
        waypoints,
        settings,
        updatedAt: new Date(),
      },
      splitOptions
    )

    // Export all split missions as KMZ files
    result.missions.forEach(async (mission, index) => {
      try {
        const kmzBlob = await exportToKMZ(mission)
        const url = URL.createObjectURL(kmzBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${mission.name}.kmz`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } catch (error) {
        console.error(`Failed to export mission ${index + 1}:`, error)
      }
    })

    alert(`Mission split into ${result.totalMissions} parts. All files have been downloaded.`)
    setShowSplitDialog(false)
  }

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <h1 className="app-title">Waypoint Planner</h1>
        <div className="toolbar-separator"></div>
        <div className="toolbar-section-label">Flight Settings</div>
      </div>
      <div className="toolbar-right">
        <button className="toolbar-btn" onClick={handleOpen} title="Open Flight Plan">
          <FolderOpen size={18} />
          <span>Open</span>
        </button>
        <button 
          className="toolbar-btn" 
          onClick={handleSave} 
          disabled={!flightPlan}
          title="Save Flight Plan"
        >
          <Save size={18} />
          <span>Save</span>
        </button>
        <button 
          className="toolbar-btn" 
          onClick={handleImport}
          title="Import KMZ, KML, or WGS84 files"
        >
          <Upload size={18} />
          <span>Import</span>
        </button>
        <button 
          className="toolbar-btn" 
          onClick={handleExportKMZ}
          title={!flightPlan ? "Create a flight plan first" : waypoints.length === 0 ? "Add waypoints to export" : "Export KMZ"}
        >
          <Download size={18} />
          <span>Export KMZ</span>
        </button>
        <button 
          className="toolbar-btn" 
          onClick={handleSplitMission}
          disabled={!flightPlan || waypoints.length === 0}
          title={waypoints.length > 0 ? `Split mission (${waypoints.length} waypoints)` : "Split Mission"}
        >
          <Scissors size={18} />
          <span>Split Mission</span>
        </button>
        <button 
          className="toolbar-btn danger" 
          onClick={handleClear}
          disabled={waypoints.length === 0}
          title="Clear All Waypoints"
        >
          <Trash2 size={18} />
          <span>Clear</span>
        </button>
        <div className="toolbar-separator"></div>
        <button 
          className="toolbar-btn" 
          onClick={handleHelp}
          title="Open User Guide"
        >
          <HelpCircle size={18} />
          <span>Help</span>
        </button>
      </div>

      {showSplitDialog && (
        <div className="split-dialog-overlay" onClick={() => setShowSplitDialog(false)}>
          <div className="split-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Split Mission</h3>
            <p>This mission has <strong>{waypoints.length}</strong> waypoints.</p>
            <p>Recommended: <strong>{getRecommendedSplit(waypoints.length)}</strong> waypoints per mission</p>
            <div className="split-dialog-input">
              <label>
                Waypoints per mission:
                <input
                  type="number"
                  min="10"
                  max={waypoints.length}
                  value={waypointsPerMission}
                  onChange={(e) => setWaypointsPerMission(parseInt(e.target.value) || 50)}
                />
              </label>
            </div>
            <p className="split-dialog-info">
              This will create <strong>{Math.ceil(waypoints.length / (waypointsPerMission || 50))}</strong> separate mission files.
            </p>
            <div className="split-dialog-buttons">
              <button className="toolbar-btn" onClick={handleConfirmSplit}>
                Split & Export All
              </button>
              <button className="toolbar-btn" onClick={() => setShowSplitDialog(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Toolbar

