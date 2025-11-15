import React, { useState, useEffect } from 'react'
import { useAtom } from 'jotai'
import { flightSettingsAtom, droneModelAtom, waypointsAtom } from '../store/flightPlanStore'
import { DJI_MODELS, FlightSettings } from '../types'
import { Settings, Radio, ChevronDown, ChevronUp, Box, Map, Scan, Eye } from 'lucide-react'
import './SettingsPanel.css'

// Preset configurations
const PRESETS: Record<string, { name: string; icon: React.ReactNode; settings: FlightSettings }> = {
  '3d-modeling': {
    name: '3D Modeling',
    icon: <Box size={16} />,
    settings: {
      altitude: 40,
      speed: 4,
      gimbalAngle: -90,
      pathSpacing: 15,
      imageOverlap: {
        forward: 80,
        side: 80,
      },
      reversePoints: false,
      lineOrientation: 0,
      straightenedPaths: true,
      dynamicAltitude: false,
      autoTakePhoto: true,
    },
  },
  'mapping': {
    name: 'Mapping',
    icon: <Map size={16} />,
    settings: {
      altitude: 60,
      speed: 6,
      gimbalAngle: -90,
      pathSpacing: 25,
      imageOverlap: {
        forward: 70,
        side: 70,
      },
      reversePoints: false,
      lineOrientation: 0,
      straightenedPaths: true,
      dynamicAltitude: false,
      autoTakePhoto: true,
    },
  },
  'scanning': {
    name: 'Scanning',
    icon: <Scan size={16} />,
    settings: {
      altitude: 50,
      speed: 5,
      gimbalAngle: -90,
      pathSpacing: 20,
      imageOverlap: {
        forward: 75,
        side: 75,
      },
      reversePoints: true,
      lineOrientation: 0,
      straightenedPaths: true,
      dynamicAltitude: true,
      autoTakePhoto: true,
    },
  },
  'inspection': {
    name: 'Inspection',
    icon: <Eye size={16} />,
    settings: {
      altitude: 30,
      speed: 3,
      gimbalAngle: -45,
      pathSpacing: 10,
      imageOverlap: {
        forward: 60,
        side: 60,
      },
      reversePoints: false,
      lineOrientation: 0,
      straightenedPaths: false,
      dynamicAltitude: false,
      autoTakePhoto: true,
    },
  },
}

const SettingsPanel: React.FC = () => {
  const [settings, setSettings] = useAtom(flightSettingsAtom)
  const [droneModel, setDroneModel] = useAtom(droneModelAtom)
  const [, setWaypoints] = useAtom(waypointsAtom)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  const applyPreset = (presetKey: string) => {
    const preset = PRESETS[presetKey]
    if (preset) {
      setSettings(preset.settings)
      setSelectedPreset(presetKey)
    }
  }

  const updateSetting = <K extends keyof typeof settings>(
    key: K,
    value: typeof settings[K]
  ) => {
    setSettings({ ...settings, [key]: value })
  }

  // Apply/remove takePhoto action to all waypoints when autoTakePhoto setting changes
  useEffect(() => {
    if (settings.autoTakePhoto) {
      // Add takePhoto action to all waypoints that don't have it
      setWaypoints(prevWaypoints =>
        prevWaypoints.map(wp => {
          const hasTakePhoto = wp.actions?.some(action => action.type === 'takePhoto')
          if (!hasTakePhoto) {
            return {
              ...wp,
              actions: [...(wp.actions || []), { type: 'takePhoto' }],
            }
          }
          return wp
        })
      )
    } else {
      // Remove takePhoto action from all waypoints
      setWaypoints(prevWaypoints =>
        prevWaypoints.map(wp => ({
          ...wp,
          actions: wp.actions?.filter(action => action.type !== 'takePhoto') || [],
        }))
      )
    }
  }, [settings.autoTakePhoto, setWaypoints])

  // Check if current settings match a preset
  useEffect(() => {
    for (const [key, preset] of Object.entries(PRESETS)) {
      const matches = 
        settings.altitude === preset.settings.altitude &&
        settings.speed === preset.settings.speed &&
        settings.gimbalAngle === preset.settings.gimbalAngle &&
        settings.pathSpacing === preset.settings.pathSpacing &&
        settings.imageOverlap.forward === preset.settings.imageOverlap.forward &&
        settings.imageOverlap.side === preset.settings.imageOverlap.side &&
        settings.reversePoints === preset.settings.reversePoints &&
        settings.lineOrientation === preset.settings.lineOrientation &&
        settings.straightenedPaths === preset.settings.straightenedPaths &&
        settings.dynamicAltitude === preset.settings.dynamicAltitude &&
        settings.autoTakePhoto === preset.settings.autoTakePhoto

      if (matches) {
        setSelectedPreset(key)
        return
      }
    }
    setSelectedPreset(null)
  }, [settings])

  return (
    <div className="settings-panel">
      {/* Drone Model Section - At the top */}
      <div className="drone-model-section">
        <div className="setting-group">
          <label className="setting-label">
            <Radio size={16} />
            Drone Model
          </label>
          <select
            className="setting-input"
            value={droneModel}
            onChange={(e) => setDroneModel(e.target.value as any)}
          >
            {DJI_MODELS.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Presets Section */}
      <div className="presets-section">
        <div className="presets-header">
          <h3>Presets</h3>
        </div>
        <div className="presets-grid">
          {Object.entries(PRESETS).map(([key, preset]) => (
            <button
              key={key}
              className={`preset-btn ${selectedPreset === key ? 'active' : ''}`}
              onClick={() => applyPreset(key)}
              title={preset.name}
            >
              {preset.icon}
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="panel-header" onClick={() => setIsCollapsed(!isCollapsed)} style={{ cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={18} />
          <h2>Advanced Settings</h2>
        </div>
        {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
      </div>
      
      {!isCollapsed && (
      <div className="settings-content">

        <div className="setting-group">
          <label className="setting-label">Altitude (m)</label>
          <input
            type="number"
            className="setting-input"
            value={settings.altitude}
            onChange={(e) => updateSetting('altitude', parseFloat(e.target.value) || 0)}
            min="0"
            step="0.1"
          />
        </div>

        <div className="setting-group">
          <label className="setting-label">Speed (m/s)</label>
          <input
            type="number"
            className="setting-input"
            value={settings.speed}
            onChange={(e) => updateSetting('speed', parseFloat(e.target.value) || 0)}
            min="0"
            step="0.1"
          />
        </div>

        <div className="setting-group">
          <label className="setting-label">Gimbal Angle (°)</label>
          <input
            type="number"
            className="setting-input"
            value={settings.gimbalAngle}
            onChange={(e) => updateSetting('gimbalAngle', parseFloat(e.target.value) || 0)}
            min="-90"
            max="30"
            step="1"
          />
        </div>

        <div className="setting-group">
          <label className="setting-label">Path Spacing (m)</label>
          <input
            type="number"
            className="setting-input"
            value={settings.pathSpacing}
            onChange={(e) => updateSetting('pathSpacing', parseFloat(e.target.value) || 0)}
            min="0"
            step="0.1"
          />
        </div>

        <div className="setting-group">
          <label className="setting-label">Image Overlap - Forward (%)</label>
          <input
            type="number"
            className="setting-input"
            value={settings.imageOverlap.forward}
            onChange={(e) =>
              updateSetting('imageOverlap', {
                ...settings.imageOverlap,
                forward: parseFloat(e.target.value) || 0,
              })
            }
            min="0"
            max="100"
            step="1"
          />
        </div>

        <div className="setting-group">
          <label className="setting-label">Image Overlap - Side (%)</label>
          <input
            type="number"
            className="setting-input"
            value={settings.imageOverlap.side}
            onChange={(e) =>
              updateSetting('imageOverlap', {
                ...settings.imageOverlap,
                side: parseFloat(e.target.value) || 0,
              })
            }
            min="0"
            max="100"
            step="1"
          />
        </div>

        <div className="setting-group">
          <label className="setting-label">Line Orientation (°)</label>
          <input
            type="number"
            className="setting-input"
            value={settings.lineOrientation}
            onChange={(e) => updateSetting('lineOrientation', parseFloat(e.target.value) || 0)}
            min="0"
            max="360"
            step="1"
          />
        </div>

        <div className="setting-group checkbox-group">
          <label className="setting-checkbox">
            <input
              type="checkbox"
              checked={settings.dynamicAltitude}
              onChange={(e) => updateSetting('dynamicAltitude', e.target.checked)}
            />
            <span>Dynamic Altitude Adjustment</span>
          </label>
        </div>

        <div className="setting-group checkbox-group">
          <label className="setting-checkbox">
            <input
              type="checkbox"
              checked={settings.reversePoints}
              onChange={(e) => updateSetting('reversePoints', e.target.checked)}
            />
            <span>Reverse Points</span>
          </label>
        </div>

        <div className="setting-group checkbox-group">
          <label className="setting-checkbox">
            <input
              type="checkbox"
              checked={settings.straightenedPaths}
              onChange={(e) => updateSetting('straightenedPaths', e.target.checked)}
            />
            <span>Straightened Flight Paths</span>
          </label>
        </div>

        <div className="setting-group checkbox-group">
          <label className="setting-checkbox">
            <input
              type="checkbox"
              checked={settings.autoTakePhoto}
              onChange={(e) => updateSetting('autoTakePhoto', e.target.checked)}
            />
            <span>Auto Take Photo at All Waypoints</span>
          </label>
        </div>
      </div>
      )}
    </div>
  )
}

export default SettingsPanel

