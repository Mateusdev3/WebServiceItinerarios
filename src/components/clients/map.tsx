"use client"

import  Map, { Source, Layer } from "react-map-gl/maplibre";
import type { Feature, FeatureCollection, LineString, Point } from "geojson"

interface MapProps{
    routeA?: number[][] ;
    routeB?: number[][];
    deviations?: number[][];


}

export function ShowMap({routeA, routeB, deviations}: MapProps) {
  if(!deviations){
    deviations = []
  }
  if (!routeB || !deviations || !routeA) {
    return null;
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

  const devPoints: FeatureCollection<Point> = {
    type: "FeatureCollection",
    features: deviations.map(p => ({
      type: "Feature",
      properties: {},
      geometry: {
        type: "Point",
        coordinates: p
      }
    })) 
  }

    return(
       <Map
      initialViewState={{
        longitude: routeA![0][0],
        latitude: routeA![0][1],
        zoom: 14
      }}
      style={{ width: "100%", height: "100vh" }}
      mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" cursor=""
    >

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
            "line-width": 5
          }}
        />
      </Source>

      
      <Source id="deviations" type="geojson" data={devPoints}>
        <Layer
          id="deviation-points"
          type="circle"
          paint={{
            "circle-radius": 5,
            "circle-color": "#fff000"
          }}
        />
      </Source>
    </Map>
    )
}