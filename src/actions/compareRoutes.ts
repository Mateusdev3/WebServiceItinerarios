"use client"

import * as turf from "@turf/turf"

type Coord = number[]

interface CordsProps {
  cordA: number[][]
  cordB: number[][]
}

export function getDistanceDetour({ cordA, cordB }: CordsProps) {

  const lineA = turf.lineString(cordA)
  const lineB = turf.lineString(cordB)

  const dev: Coord[] = []

  const lengthA = turf.length(lineA, { units: "meters" })
  const lengthB = turf.length(lineB, { units: "meters" })

  cordA.forEach(a => {

    const point = turf.point(a)

    const snapped = turf.nearestPointOnLine(lineB, point)

    const dist = turf.distance(point, snapped, { units: "meters" })

    
    if (dist > 30) {

      console.log(`${dist.toFixed(2)} metros de desvio`)
      dev.push(a)

    }

  })

  console.log("Tamanho A:", lengthA)
  console.log("Tamanho B:", lengthB)

  return dev
}