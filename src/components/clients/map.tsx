"use client"

import Map, { Source, Layer } from "react-map-gl/maplibre";
import type { Feature, FeatureCollection, LineString, Point } from "geojson"


interface MapProps {
  routeA: number[][];
  routeB?: number[][];
  deviationsSumob?: number[][];
  deviationsTacom?: number[][];
  buffer?: number[][];
  bufferPath?: any;
  lineDesviation?: number[][][];
  


}

export function ShowMap({ routeA, routeB, deviationsSumob, deviationsTacom, buffer, bufferPath, lineDesviation }: MapProps) {
  if (!deviationsSumob) {
    deviationsSumob = []
  }
  if (!deviationsTacom) {
    deviationsTacom = []
  }
  if(buffer === undefined){
    buffer = []
  }
  if (!routeB  && !routeA ) {
    return (
    <>
    
    </>

    )
    
  }

 
  const linhaDesv: Feature<LineString> = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: deviationsSumob!
    }
  }


  const routeAGeo: Feature<LineString> = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: routeA!
    }
  }

  const routeBGeo: Feature<LineString> = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: routeB ?? []
    }
  }


  const devPointsSumob: FeatureCollection<Point> = {
    type: "FeatureCollection",
    features: deviationsSumob.map(b => ({
      type: "Feature",
      properties: {},
      geometry: {
        type: "Point",
        coordinates: b
      }
    }))

  }
  const devPointsTacm: FeatureCollection<Point> = {
    type: "FeatureCollection",
    features: deviationsTacom.map(b => ({
      type: "Feature",
      properties: {},
      geometry: {
        type: "Point",
        coordinates: b
      }
    }))

  }

  const devPointsBuffer: FeatureCollection<Point> = {
    type: "FeatureCollection",
    features: buffer.map(b => ({
      type: "Feature",
      properties: {},
      geometry: {
        type: "Point",
        coordinates: b
      }
    }))
  }
 
  const devLinesGroups: FeatureCollection<LineString> = {
    type: "FeatureCollection",
    features: (lineDesviation && lineDesviation.length > 0) ? lineDesviation.map(l => ({
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: l
      }
    })) : []
  }
  return (
    <Map
      initialViewState={{
        longitude: routeA![0][0],
        latitude: routeA![0][1],
        zoom: 12
      }}
      style={{ width: "100%", height: "100vh" }}
      mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" cursor="pointer" renderWorldCopies={false} projection={"mercator"}
    >

      <Source id="line-desviated" type="geojson" data={devLinesGroups}>
        <Layer
          id="line-desv"
          type="line"
          paint={{
            "line-color": "#FF1493",
            "line-width": 15

          }}
        />
      </Source>

      <Source id="routeA" type="geojson" data={routeAGeo}>
        <Layer
          id="routeA-line"
          type="line"
          paint={{
            "line-color": "#ff0000",
            "line-width": 8

          }}
        />
      </Source>

      <Source id="routeB" type="geojson" data={routeBGeo}>
        <Layer
          id="routeB-line"
          type="line"
          paint={{
            "line-color": " #0066ff",
            "line-width": 8
          }}
        />
      </Source>

  <Source 
   id="deviations-leng-sumob" type="geojson" data={devPointsSumob}>
        <Layer
          id="deviation-points-leng-sumob"
          type="circle"
          paint={{
            "circle-radius": 5,
            "circle-color": "#9400D3"
          }}/>
      </Source> 

  <Source 
   id="deviations-leng-tacom" type="geojson" data={devPointsTacm}>
        <Layer
          id="deviation-points-leng-tacom"
          type="circle"
          paint={{
            "circle-radius": 5,
            "circle-color": "#FF8C00"
          }}/>
      </Source> 

     <Source id="deviations" type="geojson" data={devPointsBuffer}>
        <Layer
          id="deviation-points"
          type="circle"
          paint={{
            "circle-radius": 5,
            "circle-color": "rgba(0,255,0, 1)"
          }}
        />
      </Source>  

      

      <Source id="linha-buffer" type="geojson" data={bufferPath}>

        <Layer id="linha-buffer-layer"
          type="fill"
          source="linha-buffer"
          paint={{
            "fill-color": "white",
            "fill-opacity": 0.4,
          }}/>
      </Source>


    </Map>
  )
}