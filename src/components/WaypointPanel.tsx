import React, { useState } from 'react'
import { useAtom } from 'jotai'
import { waypointsAtom, selectedWaypointAtom, flightSettingsAtom } from '../store/flightPlanStore'
import { Waypoint, WaypointAction } from '../types'
import { MapPin, Trash2, Edit, Plus, Camera, Video, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import './WaypointPanel.css'

const WaypointPanel: React.FC = () => {
  const [waypoints, setWaypoints] = useAtom(waypointsAtom)
  const [selectedWaypoint, setSelectedWaypoint] = useAtom(selectedWaypointAtom)
  const [settings] = useAtom(flightSettingsAtom)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleAddWaypoint = () => {
    const newWaypoint: Waypoint = {
      id: Date.now().toString(),
      latitude: 0,
      longitude: 0,
      altitude: settings.altitude,
      speed: settings.speed,
      gimbalPitch: settings.gimbalAngle,
      heading: 0,
      actions: settings.autoTakePhoto ? [{ type: 'takePhoto' }] : [],
      dynamicAltitude: settings.dynamicAltitude,
    }
    setWaypoints([...waypoints, newWaypoint])
    setSelectedWaypoint(newWaypoint.id)
  }

  const handleDeleteWaypoint = (id: string) => {
    setWaypoints(waypoints.filter((wp) => wp.id !== id))
    if (selectedWaypoint === id) {
      setSelectedWaypoint(null)
    }
  }

  const handleUpdateWaypoint = (id: string, updates: Partial<Waypoint>) => {
    setWaypoints(
      waypoints.map((wp) => (wp.id === id ? { ...wp, ...updates } : wp))
    )
  }

  const handleAddAction = (waypointId: string, action: WaypointAction) => {
    const waypoint = waypoints.find((wp) => wp.id === waypointId)
    if (waypoint) {
      handleUpdateWaypoint(waypointId, {
        actions: [...(waypoint.actions || []), action],
      })
    }
  }

  const selectedWp = waypoints.find((wp) => wp.id === selectedWaypoint)

  return (
    <div className="waypoint-panel">
      <div className="panel-header" onClick={() => setIsCollapsed(!isCollapsed)} style={{ cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <MapPin size={18} />
          <h2>Waypoints ({waypoints.length})</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            className="add-waypoint-btn" 
            onClick={(e) => {
              e.stopPropagation()
              handleAddWaypoint()
            }} 
            title="Add Waypoint"
          >
            <Plus size={16} />
          </button>
          {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </div>
      </div>
      
      {!isCollapsed && (
      <div className="waypoint-panel-content">
      <div className="waypoint-list">
        {waypoints.length === 0 ? (
          <div className="empty-state">
            <MapPin size={48} strokeWidth={1} />
            <p>No waypoints yet</p>
            <p className="empty-hint">Click "Add Waypoint" or click on the map to create one</p>
          </div>
        ) : (
          waypoints.map((waypoint, index) => (
            <div
              key={waypoint.id}
              className={`waypoint-item ${selectedWaypoint === waypoint.id ? 'selected' : ''}`}
              onClick={() => setSelectedWaypoint(waypoint.id)}
            >
              <div className="waypoint-number">{index + 1}</div>
              <div className="waypoint-info">
                <div className="waypoint-coords">
                  {waypoint.latitude.toFixed(6)}, {waypoint.longitude.toFixed(6)}
                </div>
                <div className="waypoint-details">
                  Alt: {waypoint.altitude}m | Speed: {waypoint.speed || settings.speed}m/s
                </div>
                {waypoint.actions && waypoint.actions.length > 0 && (
                  <div className="waypoint-actions">
                    {waypoint.actions.length} action(s)
                  </div>
                )}
              </div>
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteWaypoint(waypoint.id)
                }}
                title="Delete Waypoint"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      {selectedWp && (
        <div className="waypoint-editor">
          <div className="editor-header">
            <Edit size={16} />
            <span>Edit Waypoint {waypoints.findIndex((wp) => wp.id === selectedWp.id) + 1}</span>
          </div>
          <div className="editor-content">
            <div className="editor-field">
              <label>Latitude</label>
              <input
                type="number"
                value={selectedWp.latitude}
                onChange={(e) =>
                  handleUpdateWaypoint(selectedWp.id, {
                    latitude: parseFloat(e.target.value) || 0,
                  })
                }
                step="0.000001"
              />
            </div>
            <div className="editor-field">
              <label>Longitude</label>
              <input
                type="number"
                value={selectedWp.longitude}
                onChange={(e) =>
                  handleUpdateWaypoint(selectedWp.id, {
                    longitude: parseFloat(e.target.value) || 0,
                  })
                }
                step="0.000001"
              />
            </div>
            <div className="editor-field">
              <label>Altitude (m)</label>
              <input
                type="number"
                value={selectedWp.altitude}
                onChange={(e) =>
                  handleUpdateWaypoint(selectedWp.id, {
                    altitude: parseFloat(e.target.value) || 0,
                  })
                }
                step="0.1"
              />
            </div>
            <div className="editor-field">
              <label>Speed (m/s)</label>
              <input
                type="number"
                value={selectedWp.speed || settings.speed}
                onChange={(e) =>
                  handleUpdateWaypoint(selectedWp.id, {
                    speed: parseFloat(e.target.value) || settings.speed,
                  })
                }
                step="0.1"
              />
            </div>
            <div className="editor-field">
              <label>Gimbal Pitch (°)</label>
              <input
                type="number"
                value={selectedWp.gimbalPitch || settings.gimbalAngle}
                onChange={(e) =>
                  handleUpdateWaypoint(selectedWp.id, {
                    gimbalPitch: parseFloat(e.target.value) || settings.gimbalAngle,
                  })
                }
                min="-90"
                max="30"
                step="1"
              />
            </div>
            <div className="editor-field">
              <label>Heading (°)</label>
              <input
                type="number"
                value={selectedWp.heading || 0}
                onChange={(e) =>
                  handleUpdateWaypoint(selectedWp.id, {
                    heading: parseFloat(e.target.value) || 0,
                  })
                }
                min="0"
                max="360"
                step="1"
              />
            </div>

            <div className="editor-section">
              <label>Waypoint Actions</label>
              <div className="action-buttons">
                <button
                  className="action-btn"
                  onClick={() =>
                    handleAddAction(selectedWp.id, { type: 'takePhoto' })
                  }
                >
                  <Camera size={16} />
                  Take Photo
                </button>
                <button
                  className="action-btn"
                  onClick={() =>
                    handleAddAction(selectedWp.id, { type: 'startRecord' })
                  }
                >
                  <Video size={16} />
                  Start Record
                </button>
                <button
                  className="action-btn"
                  onClick={() =>
                    handleAddAction(selectedWp.id, { type: 'stopRecord' })
                  }
                >
                  <Video size={16} />
                  Stop Record
                </button>
                <button
                  className="action-btn"
                  onClick={() =>
                    handleAddAction(selectedWp.id, {
                      type: 'rotateGimbal',
                      params: { angle: -45 },
                    })
                  }
                >
                  <RotateCcw size={16} />
                  Rotate Gimbal
                </button>
              </div>
              {selectedWp.actions && selectedWp.actions.length > 0 && (
                <div className="actions-list">
                  {selectedWp.actions.map((action, idx) => (
                    <div key={idx} className="action-item">
                      {action.type}
                      <button
                        onClick={() => {
                          const newActions = selectedWp.actions?.filter((_, i) => i !== idx) || []
                          handleUpdateWaypoint(selectedWp.id, { actions: newActions })
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
      )}
    </div>
  )
}

export default WaypointPanel

