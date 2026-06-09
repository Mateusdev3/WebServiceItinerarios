"use client"

import { useEffect, useState } from "react"
import { FormattedPlacemark } from "@/lib/types/types"
import { ShowMap } from "@/components/clients/map"
import { asyncWrapProviders } from "async_hooks"
import { Shovel } from "lucide-react"
import { Dot } from "lucide-react"

export default function Map() {
    const [routeA, setRouteA] = useState<number[][] | null>(null)
    const [routeB, setRouteB] = useState<number[][] | null>(null)
    const [desviationsSumob, setDesviationsSumob] = useState<number[][] | null>(null)
    const [desviationsTacom, setDesviationsTacom] = useState<number[][] | null>(null)
    const [buffer, setBuffer] = useState<number[][] | null>(null)
    const [bufferPath, setBufferPath] = useState<any>()
    const [rows, setRows] = useState<FormattedPlacemark>()
    const [dev, setDev] = useState(0)

    useEffect(() => {
        async function loadData() {
            const r: FormattedPlacemark = await JSON.parse(localStorage.getItem("@rows") || 'null')
            setRows(r)

            if(r){
                setRouteA(r.LineString.coordinatesTacom ?? [])
                setRouteB(r.LineString.coordinates ?? [])
                setDesviationsSumob(r.LineString.deviationsSumob ?? [])
                setDesviationsTacom(r.LineString.deviationsTacom ?? [])
                setBuffer(r.ExtendedData.SchemaData.buffer ?? [])
                setBufferPath(r.ExtendedData.SchemaData.bufferPath)
                setDev(r.LineString.deviationsSumob.length + r.LineString.deviationsTacom.length )
            }
        }
        loadData()
    }, [])

    return (
        <>

            <ShowMap routeA={routeA!} routeB={routeB!} buffer={buffer!} bufferPath={bufferPath!} deviationsSumob={desviationsSumob || []} deviationsTacom={desviationsTacom || []}/>

            <div className="min-w-80 bg-black rounded-md absolute  p-2 opacity-90 flex font-bold border-2 flex-col py-4 gap-2 m-2 border-gray-700 shadow-gray-700 shadow-lg ">
                <h1 className="text-lg text-white">Linha: {rows?.ExtendedData.SchemaData.SimpleData}</h1>
                <h1 className="text-lg text-white">Pc: {rows?.ExtendedData.SchemaData.pc}</h1>
                <h1 className="text-lg text-white">Desvios: {dev}</h1>
                <h1 className="text-lg text-white">Distancia de desvio: {rows?.ExtendedData.SchemaData.kmDetour} KM</h1>
                <h1 className="text-lg text-white">Divergencia: {rows?.ExtendedData.SchemaData.percentDetour}%</h1>
            </div>

            <div className="min-w-80 bg-black rounded-md absolute  p-2 opacity-90 flex font-bold border-2 flex-col py-4 gap-2 m-2 ml-378 border-gray-700 shadow-gray-700 shadow-lg ">
                <div className="flex items-center  ">
                    <Dot size={35} color="#ff0000"/>
                    <h1 className="text-white text-sm">Itinerário CITGIS</h1>
                </div>
                <div className="flex items-center  ">
                    <Dot size={35} color="#FF8C00"/>
                    <h1 className="text-white text-sm">Desvios CITGIS</h1>
                </div>
                <div className="flex items-center  ">
                    <Dot size={35} color="#0066ff"/>
                    <h1 className="text-white text-sm">Itinerário SUMOB</h1>
                </div>
                <div className="flex items-center  ">
                    <Dot size={35} color="#9400D3"/>
                    <h1 className="text-white text-sm">Desvios SUMOB</h1>
                </div>
                <div className="flex items-center  ">
                    <Dot size={35} color="#fff"/>
                    <h1 className="text-white text-sm">Buffer</h1>
                </div>
                <div className="flex items-center text-sm ">
                    <Dot className="abso" size={35} color="rgba(0,255,0,1)"/>
                    <h1 className="text-white">Coordenadas fora do buffer</h1>
                </div>
                

            </div>


        </>

    )
}