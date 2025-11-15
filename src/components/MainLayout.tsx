import React, { useEffect } from 'react'
import { useAtom } from 'jotai'
import { currentFlightPlanAtom, waypointsAtom, flightSettingsAtom, droneModelAtom } from '../store/flightPlanStore'
import { FlightPlan } from '../types'
import Toolbar from './Toolbar'
import MapView from './MapView'
import WaypointPanel from './WaypointPanel'
import SettingsPanel from './SettingsPanel'
import './MainLayout.css'

const MainLayout: React.FC = () => {
  console.log('MainLayout rendering...')
  const [flightPlan, setFlightPlan] = useAtom(currentFlightPlanAtom)
  const [waypoints] = useAtom(waypointsAtom)
  const [settings] = useAtom(flightSettingsAtom)
  const [droneModel] = useAtom(droneModelAtom)

  // Initialize flight plan immediately when MainLayout mounts
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
      console.log('MainLayout: Auto-created flight plan:', newPlan)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount - flightPlan check prevents re-initialization

  return (
    <div className="main-layout">
      <Toolbar />
      <div className="main-content">
        <div className="left-panel">
          <SettingsPanel />
          <WaypointPanel />
        </div>
        <div className="map-container">
          <MapView />
        </div>
      </div>
    </div>
  )
}

export default MainLayout

