import * as turf from "@turf/turf"
import { Trophy } from "lucide-react";

type Coord = number[]

interface CordsProps {
  cordA: number[][]
  cordB: number[][]
  tol: number;
  switc: "CITGIS" | "SUMOB";
}

export function getDistanceDetour({ cordA, cordB, tol, switc }: CordsProps) {

  const lineA = turf.lineString(cordA)
  const lineB = turf.lineString(cordB)

  const devSumob: Coord[] = []
  const devTacom: Coord[] = []


  cordA.forEach(a => {
    const point = turf.point(a)
    const snapped = turf.nearestPointOnLine(lineB, point)
    const dist = turf.distance(point, snapped, { units: "meters" })

    if (dist > tol) {
      devSumob.push(a)

    }
  })



  cordB.forEach(b => {
    const point = turf.point(b)

    const snapped = turf.nearestPointOnLine(lineA, point)

    const dist = turf.distance(point, snapped, { units: "meters" })

    if (dist > tol) {
      devTacom.push(b)
    }
  })



  return [devSumob, devTacom]
}


export function getDistance(routeA: number[][], routeB: number[][], tol: number) {

  try {
    const lineA = turf.lineString(routeA)
    const lineB = turf.lineString(routeB)

    const distanceA = turf.length(lineA, { units: "kilometers" })
    const distanceB = turf.length(lineB, { units: "kilometers" })

    const formatedA = distanceA.toFixed(2)
    const formatedB = distanceB.toFixed(2)

    return [parseFloat(formatedA), parseFloat(formatedB)]

  } catch (error) {
    return ("Erro ao processar a disrtância: " + error)
  }
}


export function generateBuffer(routeA: number[][], routeB: number[][], bufferSize: number, switc: "CITGIS" | "SUMOB") {
  try {

    const lineA = turf.lineString(routeA)
    const lineB = turf.lineString(routeB)
    const dev = []

    const buffer = turf.buffer(lineA, bufferSize, { units: "meters" })
    const bufferB = turf.buffer(lineB, bufferSize, { units: "meters" })



    if (switc === "SUMOB") {
      for (const coord of routeB) {
        const point = turf.point(coord)
        if (!turf.booleanPointInPolygon(point, buffer!)) {
          dev.push(coord)
        }
      }
    }

    else if (switc === "CITGIS") {
      for (const coord of routeA) {
        const point = turf.point(coord)
        if (!turf.booleanPointInPolygon(point, bufferB!)) {
          dev.push(coord)
        }
      }
    }

    return dev



  } catch (error) {
    return error
  }
}

export function generateBufferPath(line: number[][], bufferSize: number) {
  try {
    const lineString = turf.lineString(line)
    const buffer = turf.buffer(lineString, bufferSize, { units: "meters" })

    return buffer
  } catch {

    return "Erro ao geraro buffer"
  }
}

export function calculatePercentDesviation(line: number[][]) {
  try {
    if (line.length < 2) {
      return { groups: [], distances: [] }
    }

    
    const groups: number[][][] = []
    let currentGroup: number[][] = []

    for (const coord of line) {
      if (currentGroup.length === 0) {
        currentGroup.push(coord)
      } else {
        const distance = turf.distance(
          turf.point(currentGroup[currentGroup.length - 1]),
          turf.point(coord),
          { units: "meters" }
        )

        if (distance < 500) {
          
          currentGroup.push(coord)
        } else {
         
          if (currentGroup.length > 0) {
            groups.push(currentGroup)
          }
          currentGroup = [coord]
        }
      }
    }

    
    if (currentGroup.length > 0) {
      groups.push(currentGroup)
    }

    
    const distances = groups.map(group => {
      if (group.length < 2) {
        return 0
      }
      const devLine = turf.lineString(group)
      const dist = turf.length(devLine, { units: "kilometers" })
      return parseFloat(dist.toFixed(2))
    })

    const totalDistance = parseFloat(distances.reduce((sum, dist) => sum + dist, 0).toFixed(2))

    return { groups, distances, totalDistance }
  } catch {
    throw new Error("Erro ao calcular percentual")
  }
}