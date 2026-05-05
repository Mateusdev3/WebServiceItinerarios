"use client"

import { Input } from "@base-ui/react";
import { UploadCloudIcon } from "lucide-react";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import { useState } from "react";
import { Table, TableBody, TableHead, TableHeader, TableCell, TableRow, TableCaption, TableFooter, } from "@/components/ui/table";
import { Button } from "@base-ui/react";
import { getLineId, getTacomiTinerary } from "@/actions/lines";
import { FormattedPlacemark, PlacemarkProps, TacomDataResponseProps } from "@/lib/types/types";
import { getDistanceDetour } from "@/actions/compareRoutes";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";

type Coord = number[]



export default function Itinerarios() {
  const [placemark, setPlacemark] = useState<FormattedPlacemark[]>([])
  const [dev, setDev] = useState(0)
  const [isup, setIsup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResut] = useState(false)
  const [det, setDet] = useState(false)
  const router = useRouter();

  const parser = new XMLParser
  const builder = new XMLBuilder

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) {
      return
    }
    setIsup(true)
    setLoading(true)
    const text = await file.text()
    var json = await parser.parse(text)
    const jsonformatet = json.kml.Document.Folder.Placemark
    const format = await formatPlacemark(jsonformatet)

    const fullLines = await getLineId(format)
    const data = await getTacomData(fullLines)
    setPlacemark(data)
    await handleCompare(data)
    setLoading(false)
    setResut(true)

  }

  async function formatPlacemark(placemarks: PlacemarkProps[]) {
    return placemarks.map((p, i) => ({
      ...p,

      ExtendedData: {
        SchemaData: {

          SimpleData: p.ExtendedData.SchemaData.SimpleData[0].toString() + "-" + (p.ExtendedData.SchemaData.SimpleData[1] < 10 ? ("0" + p.ExtendedData.SchemaData.SimpleData[1].toString()
          ) : p.ExtendedData.SchemaData.SimpleData[1].toString()),
          key: i,
          pc: p.ExtendedData.SchemaData.SimpleData[2].toString()
        }
      },
      LineString: {
        coordinates: p.LineString.coordinates
          .split(" ")
          .map(coord => {
            return coord.split(",").map(Number);
          })
      }
    }))


  }


  const headerTable = [
    {
      name: 'Linhas'
    },
    {
      name: 'Sublinhas'
    },
    {
      name: 'Codigo Externo'
    },
    {
      name: 'Pontos'
    },
    {
      name: "Pc"
    },
    {
      name: "Status"
    },
    {
      name: 'Itínerarios'
    }
  ]




  async function getTacomData(place: FormattedPlacemark[]) {
    try {

      const response = await getTacomiTinerary(place)
      const dataTacom: any[] = []

      for (const r of response) {
        const kml = Buffer.from(r.toString(), "base64").toString("utf-8")
        var json = parser.parse(kml)
        const jsonFormated = json.kml.Document.Placemark[0]
        const pc2 = json.kml.Document.Placemark[1]
        const pc2Name = pc2.name.split(" ")


        if (pc2Name.includes("VOLTA")) {
          pc2.pc = "2"
          const formated = await formatTacomData(pc2)
          dataTacom.push(...formated)
        }
        
          jsonFormated.pc = "1"
          const formated = await formatTacomData(jsonFormated)
          dataTacom.push(...formated)
        
      }

      console.log(place)

      
      const updatePlacemark = place.map((p) => ({
        ...p,
        LineString: {
          coordinates: p.LineString.coordinates,
          coordinatesTacom: dataTacom.find((f) => f.name === p.ExtendedData.SchemaData.SimpleData && f.pc === p.ExtendedData.SchemaData.pc)?.LineString ?? ''
        }
      }))
      
      console.log(dataTacom)
      
      return updatePlacemark
      

    } catch (error) {
      console.log(error)
      return []
    }
  }

  async function formatTacomData(data: TacomDataResponseProps | TacomDataResponseProps[]) {
    const dataArray = Array.isArray(data) ? data : [data];

    return dataArray.map((d) => ({
      ...d,
      name: d.name.split(" ")[0],
      LineString: parseCoordinates(d.LineString.coordinates.toString())
    }));
  }

  function parseCoordinates(coordinates: string) {
    const numbers = coordinates.split(",").map(Number);

    const result: number[][] = [];

    for (let i = 0; i < numbers.length; i += 3) {
      const lon = numbers[i];
      const lat = numbers[i + 1];


      result.push([lon, lat]);
    }

    return result;
  }

  async function handleCompare(place: FormattedPlacemark[]) {

    try {
      place.map((p) => {


        var sumob = p.LineString.coordinates
        var tacom = p.LineString.coordinatesTacom
    
        if (tacom) {
          const points = getDistanceDetour({ cordA: sumob, cordB: tacom })
          p.LineString.deviations = points
        }
      })
      setPlacemark(place)
    }
    catch (err) {
      console.log("Erro")
    }

  }

  function handleOpenMap(linha: FormattedPlacemark) {

    localStorage.setItem("@routeA", JSON.stringify(linha.LineString.coordinates))
    localStorage.setItem("@routeB", JSON.stringify(linha.LineString.coordinatesTacom))
    localStorage.setItem("@point", JSON.stringify(linha.LineString.deviations))
  
    window.open("/map", "_blank")

  }

  function handleClear(){
    setPlacemark([])
    setDet(false)
    setDev(0)
    setIsup(false)
    setResut(false)
    setLoading(false)
    setResut(false)
    
  }


  return (
    <div className="w-full h-full text-white flex justify-center flex-col items-center">

      {loading && (
      <div className="flex justify-center items-center w-full h-full bg-app-background absolute z-50">
        <Loader2Icon size={100} className="animate-spin" />
      </div>
      )}

      {isup && !loading && det && (
      <div className="w-full h-full flex flex-col justify-center items-center space-y-4 bg-app-background">
        <h1 className="text-4xl font-bold text-white">Conferencia de Itínerarios</h1>
        <div className="w-9/12 h-7/12 overflow-x-auto border-white border-2 rounded-lg">
        <Table>
          <TableHeader className="top-0 z-10 bg-black">
          <TableRow className="text-center">
            {headerTable.map((header) => (
            <TableHead className="text-white text-center font-bold" key={header.name}>
              {header.name.toUpperCase()}
            </TableHead>
            ))}
          </TableRow>
          </TableHeader>
          <TableBody className="bg-app-background">
          {placemark.map((linha) => (
            <TableRow key={linha.ExtendedData.SchemaData.key} className="text-white text-center border-b border-gray-700 hover:bg-black hover:bg-opacity-50">
            <TableCell>{linha.ExtendedData.SchemaData.SimpleData}</TableCell>
            <TableCell>{linha.ExtendedData.SchemaData.SimpleData.split("-")[1]}</TableCell>
            <TableCell>{linha.ExtendedData.SchemaData.id}</TableCell>
            <TableCell>{linha.LineString.coordinates.length}</TableCell>
            <TableCell>{linha.ExtendedData.SchemaData.pc}</TableCell>
            <TableCell className={linha.LineString.deviations?.length ? "text-red-500" : "text-green-500"}>
              {linha.LineString.deviations?.length ? "INCOERENTE" : "OK"}
            </TableCell>
            <TableCell>
              <Button onClick={() => handleOpenMap(linha)} className="py-1 px-2 rounded-md bg-black text-white border border-white hover:bg-white hover:text-black transition-colors">
              Mapa
              </Button>
            </TableCell>
            </TableRow>
          ))}
          </TableBody>
        </Table>
        </div>
        <Button className="bg-black text-white px-4 py-2 rounded-md font-bold border border-white hover:bg-white hover:text-black transition-colors" onClick={handleClear}>
        Voltar
        </Button>
      </div>
      )}

      {result && isup && !loading && !det && (
      <div className="w-full h-full flex flex-col justify-center items-center gap-8 bg-linear-to-b from-app-background to-black py-20">
        <div className="px-12 max-w-2xl">
        <h1 className="text-white text-6xl font-bold mb-8">Resultados</h1>
        <div className="flex flex-col gap-6 bg-black rounded-lg p-8 border border-white">
          <div className="flex items-center justify-between">
          <span className="text-white text-lg">Linhas processadas:</span>
          <span className="text-white text-2xl font-bold">{placemark.length}</span>
          </div>
          <div className="h-px bg-white"></div>
          <div className="flex items-center justify-between">
          <span className="text-white text-lg">Desvios encontrados:</span>
          <span className="text-white text-2xl font-bold">{placemark.filter(p => p.LineString.deviations && p.LineString.deviations.length > 0).length}</span>
          </div>
        </div>
        </div>
        <Button className="mt-8 bg-black text-white border border-white px-12 py-3 rounded-lg font-bold text-xl hover:bg-white hover:text-black transition-colors duration-200" onClick={() => setDet(true)}>
        Ver Detalhes
        </Button>
      </div>
      )}

      {!isup && (
      <div className="w-full h-full flex flex-col justify-center items-center bg-app-background">
        <h1 className="text-4xl mb-8 font-bold text-white">Insira o arquivo KML</h1>
        <div className="w-7/12 h-5/12 border-2 border-white rounded-md flex justify-center items-center border-dashed">
        <UploadCloudIcon className="absolute text-white" width={200} height={200} />
        <Input className="w-full opacity-0 h-full cursor-pointer" type="file" accept="kml" onChange={handleFileChange} />
        </div>
      </div>
      )}

    </div>
  )
}


