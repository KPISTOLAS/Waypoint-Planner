import { Waypoint, FlightSettings } from '../types'
import L from 'leaflet'

/**
 * Generate waypoints in a grid pattern within a polygon or rectangle
 */
export const generateWaypointsFromArea = (
  layer: L.Polygon | L.Rectangle,
  settings: FlightSettings
): Waypoint[] => {
  const bounds = layer.getBounds()
  const sw = bounds.getSouthWest()
  const ne = bounds.getNorthEast()
  const centerLat = (sw.lat + ne.lat) / 2
  
  // Calculate grid spacing based on path spacing setting
  // Account for latitude (degrees vary by latitude)
  const metersPerDegreeLat = 111320 // meters per degree latitude (constant)
  const metersPerDegreeLng = 111320 * Math.cos((centerLat * Math.PI) / 180) // varies by latitude
  
  const spacingLat = settings.pathSpacing / metersPerDegreeLat
  const spacingLng = settings.pathSpacing / metersPerDegreeLng
  
  // Calculate number of rows and columns
  const latRange = ne.lat - sw.lat
  const lngRange = ne.lng - sw.lng
  
  const rows = Math.ceil(latRange / spacingLat)
  const cols = Math.ceil(lngRange / spacingLng)
  
  const waypoints: Waypoint[] = []
  
  // Generate waypoints in a grid pattern
  for (let row = 0; row <= rows; row++) {
    const lat = sw.lat + (row * spacingLat)
    
    const rowWaypoints: Waypoint[] = []
    
    for (let col = 0; col <= cols; col++) {
      const lng = sw.lng + (col * spacingLng)
      const point = L.latLng(lat, lng)
      
      // Check if point is inside the polygon/rectangle
      if (layer instanceof L.Rectangle || isPointInPolygon(point, layer as L.Polygon)) {
        rowWaypoints.push({
          id: `generated-${row}-${col}-${Date.now()}`,
          latitude: lat,
          longitude: lng,
          altitude: settings.altitude,
          speed: settings.speed,
          gimbalPitch: settings.gimbalAngle,
          heading: 0,
          actions: settings.autoTakePhoto ? [{ type: 'takePhoto' }] : [],
          dynamicAltitude: settings.dynamicAltitude,
        })
      }
    }
    
    // Sort row waypoints by longitude
    rowWaypoints.sort((a, b) => a.longitude - b.longitude)
    
    // Add in zigzag pattern: even rows left-to-right, odd rows right-to-left
    if (row % 2 === 0) {
      waypoints.push(...rowWaypoints)
    } else {
      waypoints.push(...rowWaypoints.reverse())
    }
  }
  
  return waypoints
}

/**
 * Check if a point is inside a polygon
 */
const isPointInPolygon = (point: L.LatLng, polygon: L.Polygon): boolean => {
  const latlngs = polygon.getLatLngs()[0] as L.LatLng[]
  let inside = false
  
  for (let i = 0, j = latlngs.length - 1; i < latlngs.length; j = i++) {
    const xi = latlngs[i].lng
    const yi = latlngs[i].lat
    const xj = latlngs[j].lng
    const yj = latlngs[j].lat
    
    const intersect = ((yi > point.lat) !== (yj > point.lat)) &&
      (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi)
    
    if (intersect) inside = !inside
  }
  
  return inside
}

/**
 * Generate waypoints around a circle perimeter, all facing the center
 */
export const generateWaypointsFromPOI = (
  circle: L.Circle,
  settings: FlightSettings
): Waypoint[] => {
  const center = circle.getLatLng()
  const radius = circle.getRadius() // radius in meters
  
  // Calculate number of waypoints based on path spacing
  const circumference = 2 * Math.PI * radius
  const numWaypoints = Math.max(8, Math.ceil(circumference / settings.pathSpacing))
  
  const waypoints: Waypoint[] = []
  const centerLat = center.lat
  const centerLng = center.lng
  
  // Convert radius from meters to degrees (approximate)
  const metersPerDegreeLat = 111320
  const metersPerDegreeLng = 111320 * Math.cos((centerLat * Math.PI) / 180)
  const radiusLat = radius / metersPerDegreeLat
  const radiusLng = radius / metersPerDegreeLng
  
  // Generate waypoints around the circle perimeter
  for (let i = 0; i < numWaypoints; i++) {
    const angle = (2 * Math.PI * i) / numWaypoints
    
    // Calculate waypoint position on circle perimeter
    const lat = centerLat + radiusLat * Math.cos(angle)
    const lng = centerLng + radiusLng * Math.sin(angle)
    
    // Calculate heading to face the center (in degrees, 0-360)
    // Heading is the bearing from waypoint to center
    // Use atan2 with (lng difference, lat difference) for proper bearing calculation
    const dLng = centerLng - lng
    const dLat = centerLat - lat
    const headingRad = Math.atan2(dLng, dLat)
    const headingDeg = (headingRad * 180) / Math.PI
    // Normalize to 0-360 (heading is clockwise from North)
    const heading = ((headingDeg + 360) % 360)
    
    waypoints.push({
      id: `poi-${i}-${Date.now()}`,
      latitude: lat,
      longitude: lng,
      altitude: settings.altitude,
      speed: settings.speed,
      gimbalPitch: settings.gimbalAngle,
      heading: heading,
      actions: settings.autoTakePhoto ? [{ type: 'takePhoto' }] : [],
      dynamicAltitude: settings.dynamicAltitude,
    })
  }
  
  return waypoints
}


