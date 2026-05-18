"use client"

import { useEffect, useState } from "react"
import { FormattedPlacemark } from "@/lib/types/types"
import { ShowMap } from "@/components/clients/map"

export default function Map() {
    const [routeA, setRouteA] = useState<number[][] | null>(null)
    const [routeB, setRouteB] = useState<number[][] | null>(null)
    const [desviations, setDesviations] = useState<number[][] | null>(null)
    const [rows, setRows] = useState<FormattedPlacemark>()

    useEffect(() => {
        const r: FormattedPlacemark = JSON.parse(localStorage.getItem("@rows") || 'null')
        const rA = r.LineString.coordinatesTacom
        const rB = r.LineString.coordinates
        const dev = r.LineString.deviations
        setRouteB(rB)
        setRows(r)

        if (rA && dev) {
            setRouteA(rA)
            setDesviations(dev)
        }
    }, [])
    return (
        <>
        <ShowMap routeA={routeA || undefined} routeB={routeB || undefined} deviations={desviations || undefined} />
        <div className="min-w-80 bg-app-background rounded-md absolute  p-2 opacity-90 flex font-bold border-2 flex-col py-4 gap-2 m-2 border-dashed">
            <h1 className="text-3xl text-white">Linha: {rows?.ExtendedData.SchemaData.SimpleData}</h1>
            <h1 className="text-3xl text-white">Pc: {rows?.ExtendedData.SchemaData.pc}</h1>
            <h1 className="text-3xl text-white">Desvios: {rows?.LineString.deviations?.length}</h1>

        </div>
        </>
        
    )
}