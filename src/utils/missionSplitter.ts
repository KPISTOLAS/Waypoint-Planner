import { FlightPlan, Waypoint } from '../types'

export interface SplitMissionOptions {
  waypointsPerMission: number
  baseName: string
}

export interface SplitMissionResult {
  missions: FlightPlan[]
  totalMissions: number
  waypointsPerMission: number[]
}

/**
 * Split a large flight plan into multiple smaller missions
 */
export const splitMission = (
  flightPlan: FlightPlan,
  options: SplitMissionOptions
): SplitMissionResult => {
  const { waypointsPerMission, baseName } = options
  const waypoints = flightPlan.waypoints
  const totalWaypoints = waypoints.length

  if (totalWaypoints <= waypointsPerMission) {
    // No need to split
    return {
      missions: [flightPlan],
      totalMissions: 1,
      waypointsPerMission: [totalWaypoints],
    }
  }

  const missions: FlightPlan[] = []
  const waypointsPerMissionArray: number[] = []
  const totalMissions = Math.ceil(totalWaypoints / waypointsPerMission)

  for (let i = 0; i < totalMissions; i++) {
    const startIndex = i * waypointsPerMission
    const endIndex = Math.min(startIndex + waypointsPerMission, totalWaypoints)
    const missionWaypoints = waypoints.slice(startIndex, endIndex)

    const mission: FlightPlan = {
      id: `${flightPlan.id}-part-${i + 1}`,
      name: `${baseName} - Part ${i + 1} of ${totalMissions}`,
      droneModel: flightPlan.droneModel,
      waypoints: missionWaypoints,
      settings: { ...flightPlan.settings },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    missions.push(mission)
    waypointsPerMissionArray.push(missionWaypoints.length)
  }

  return {
    missions,
    totalMissions,
    waypointsPerMission: waypointsPerMissionArray,
  }
}

/**
 * Calculate recommended waypoints per mission based on total waypoints
 */
export const getRecommendedSplit = (totalWaypoints: number): number => {
  if (totalWaypoints <= 50) return 50
  if (totalWaypoints <= 100) return 50
  if (totalWaypoints <= 200) return 75
  if (totalWaypoints <= 500) return 100
  return 150
}

