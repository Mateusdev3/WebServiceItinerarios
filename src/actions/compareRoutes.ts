"use client"

import * as turf from "@turf/turf"

type Coord = number[]

interface CordsProps {
  cordA: number[][]
  cordB: number[][]
  tol:  number;
}

export function getDistanceDetour({ cordA, cordB, tol }: CordsProps) {

  const lineA = turf.lineString(cordA)
  const lineB = turf.lineString(cordB)

  const dev: Coord[] = []

  const lengthA = turf.length(lineA, { units: "kilometers" })
  const lengthB = turf.length(lineB, { units: "kilometers" })

  console.log(lengthA)

  cordA.forEach(a => {

    const point = turf.point(a)

    const snapped = turf.nearestPointOnLine(lineB, point)

    const dist = turf.distance(point, snapped, { units: "meters" })

    if (dist > tol) {
      dev.push(a)

    }
  })

  cordB.forEach(b => {
    const point =  turf.point(b)

    const snapped = turf.nearestPointOnLine(lineA, point)

    const dist = turf.distance(point, snapped, {units: "meters"})

    if(dist > tol ){
      dev.push(b)
    }
  })

  console.log("Tamanho A:", lengthA)
  console.log("Tamanho B:", lengthB)

  return dev
}