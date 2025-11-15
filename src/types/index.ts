export interface Waypoint {
  id: string
  latitude: number
  longitude: number
  altitude: number
  speed?: number
  gimbalPitch?: number
  heading?: number
  actions?: WaypointAction[]
  dynamicAltitude?: boolean
}

export interface WaypointAction {
  type: 'takePhoto' | 'startRecord' | 'stopRecord' | 'rotateGimbal' | 'hover'
  params?: Record<string, any>
}

export interface FlightPlan {
  id: string
  name: string
  droneModel: DJIModel
  waypoints: Waypoint[]
  settings: FlightSettings
  createdAt: Date
  updatedAt: Date
}

export interface FlightSettings {
  altitude: number
  speed: number
  gimbalAngle: number
  pathSpacing: number
  imageOverlap: {
    forward: number
    side: number
  }
  reversePoints: boolean
  lineOrientation: number
  straightenedPaths: boolean
  dynamicAltitude: boolean
  autoTakePhoto: boolean
}

export type DJIModel =
  | 'Mini 5 Pro'
  | 'Mavic 4 Pro'
  | 'Mini 4 Pro'
  | 'Air 3'
  | 'Air 3S'
  | 'Mavic 3'
  | 'Mavic 3 Pro'
  | 'Mavic 3 Classic'

export const DJI_MODELS: DJIModel[] = [
  'Mini 5 Pro',
  'Mavic 4 Pro',
  'Mini 4 Pro',
  'Air 3',
  'Air 3S',
  'Mavic 3',
  'Mavic 3 Pro',
  'Mavic 3 Classic',
]

