import { atom } from 'jotai'
import { FlightPlan, Waypoint, FlightSettings, DJIModel } from '../types'

const defaultSettings: FlightSettings = {
  altitude: 50,
  speed: 5,
  gimbalAngle: -90,
  pathSpacing: 20,
  imageOverlap: {
    forward: 70,
    side: 70,
  },
  reversePoints: false,
  lineOrientation: 0,
  straightenedPaths: false,
  dynamicAltitude: false,
  autoTakePhoto: false,
}

export const currentFlightPlanAtom = atom<FlightPlan | null>(null)
export const waypointsAtom = atom<Waypoint[]>([])
export const selectedWaypointAtom = atom<string | null>(null)
export const droneModelAtom = atom<DJIModel>('Mavic 3')
export const flightSettingsAtom = atom<FlightSettings>(defaultSettings)
export const mapCenterAtom = atom<[number, number]>([0, 0])
export const mapZoomAtom = atom<number>(13)

