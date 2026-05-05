"use client"

import { ShowMap } from "@/components/clients/map"

export default function Map(){

    const rA = localStorage.getItem("@routeA") || 'null'
    const rB = localStorage.getItem("@routeB") || 'null'
    const dev = localStorage.getItem("@point") || 'null'

    const routeA = JSON.parse(rA)
    const routeB = JSON.parse(rB)
    const desviations = JSON.parse(dev)



    return(
        
        <ShowMap routeA={routeA} routeB={routeB} deviations={desviations}/>
        
    )
}