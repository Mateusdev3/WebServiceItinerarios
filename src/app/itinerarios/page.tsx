"use client"

import { Input } from "@base-ui/react";
import {UploadCloudIcon } from "lucide-react";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import { useEffect, useState } from "react";
import { Table, TableBody, TableHead, TableHeader, TableCell, TableRow, TableCaption, TableFooter, } from "@/components/ui/table";
import { Progress, ProgressValue, ProgressLabel, ProgressIndicator } from "@/components/ui/progress";
import { Button } from "@base-ui/react";
import { getLineId, getTacomiTinerary } from "@/actions/lines";
import { FormattedPlacemark, PlacemarkProps, TacomDataResponseProps } from "@/lib/types/types";
import { calculatePercentDesviation, generateBuffer, generateBufferPath, getDistance, getDistanceDetour } from "@/actions/compareRoutes";
import { useRouter } from "next/navigation";
import { Input as InputUi } from "@/components/ui/input";
import { format } from '../../../node_modules/date-fns'
import ExcelJS from 'exceljs'
import { Color } from "maplibre-gl";
import {Sidebar, SidebarProvider, SidebarContent, SidebarHeader } from "@/components/ui/sidebar";
import { points } from "@turf/turf";


type Coord = number[]


export default  function Itinerarios() {
  

  const [placemark, setPlacemark] = useState<FormattedPlacemark[]>([])
  const [dev, setDev] = useState(0)
  const [isup, setIsup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [percentLoad, setPercentLoad] = useState(0)
  const [result, setResut] = useState(false)
  const [det, setDet] = useState(false)
  const [tol, setTol] = useState<number>(50)
  const [bufferSize, SetbufferSize] = useState<number>(10)
  const [bufferPath, SetbufferPath] = useState<"SUMOB"|"CITGIS">("CITGIS")

  useEffect(() => {

   const data: FormattedPlacemark[] = JSON.parse(localStorage.getItem("@data") as string) || null
   if(data != null ){
    setPlacemark(data)
    setIsup(true)
    setLoading(false)
    setResut(true)
   }

  }, [])

console.log(placemark)
  const workbook = new ExcelJS.Workbook();
  const parser = new XMLParser


  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) {
      return
    }
    setIsup(true)
    setLoading(true)
    setPercentLoad(0)

    const simulateProgress = setInterval(() => {
      setPercentLoad(prev => {
        if (prev < 80) return prev + Math.random() * 15
        return prev
      })
    }, 300)

    try {

      const text = await file.text()
      var json = await parser.parse(text)
      const jsonformatet = json.kml.Document.Folder.Placemark
      const format = await formatPlacemark(jsonformatet)
      setPercentLoad(Math.min(25, 100))

      const fullLines = await getLineId(format)
      setPercentLoad(Math.min(40, 100))
      const data = await getTacomData(fullLines)
      setPlacemark(data)
      await handleCompare(data)
      setPercentLoad(100)
    } finally {
      clearInterval(simulateProgress)
      setLoading(false)
      setResut(true)
    }

  }

  async function formatPlacemark(placemarks: PlacemarkProps[]) {
    return placemarks.map((p, i) => ({
      ...p,
      ExtendedData: {
        SchemaData: {

          SimpleData: p.ExtendedData.SchemaData.SimpleData[1].toString() + "-" + (p.ExtendedData.SchemaData.SimpleData[2] < 10 ? ("0" + p.ExtendedData.SchemaData.SimpleData[2].toString()
          ) : p.ExtendedData.SchemaData.SimpleData[2].toString()),
          key: i,
          pc: p.ExtendedData.SchemaData.SimpleData[3].toString(),
          obs: '',
          buffer: '',
          bufferPath: '',
          kmDetour: 0,
          percentDetour: '',
          stats: ''
        }
      },
      LineString: {
        coordinates: p.LineString.coordinates
          .split(" ")
          .map(coord => {
            return coord.split(",").map(Number);
          }),

          deviationsSumob: [],
          deviationsTacom: [],
          lineDeviation:[]
      }
    }))
  }
  const headerTable = [
    {
      name: 'Linhas'
    },
    {
      name: 'Codigo Externo'
    },
    {
      name: "Pc"
    },
    {
      name: 'Km sumob'
    },
    {
      name: 'km tacom'
    },
    {
      name: 'Desvios'
    },
    {
      name: 'km de desvio'
    },
     {
      name: "% desvio"
    },
    {
      name: "Status"
    },
   
    {
      name: 'Observação'
    },
    {
      name: 'Itínerarios'
    }
  ]

  async function getTacomData(place: FormattedPlacemark[]) {
    try {

      const response = await getTacomiTinerary(place)
      const dataTacom: any[] = []

      // console.log(response + "Retorno")

      if (!response) {
        throw new Error("Api nao respondeu")
      }

      for (const r of response) {

        const kml = Buffer.from(r.toString(), "base64").toString("utf-8")
        var json = parser.parse(kml)
        const isValid = json.kml.Document.Placemark
      
        if (isValid != undefined) {
          const jsonFormated = json.kml.Document.Placemark[0]
          const pc2 = json.kml.Document.Placemark[1]
          const pc2Name = pc2.name.split(" ")

          const pc1Name = jsonFormated.name.split(" ")

           if(pc1Name.includes("QRP") || pc1Name.includes("qrp")){
              jsonFormated.obs = "POSSUI QRP"
            }else{
              jsonFormated.obs = "SEM QRP"
            }


             if(pc2Name.includes("QRP") || pc2Name.includes("qrp")){
              pc2.obs = "POSSUI QRP"
            }else{
              pc2.obs = "SEM QRP"
            }
  

          if (pc1Name.includes("IDA") || pc1Name.includes("ida")) {

           

            jsonFormated.pc = "1"
            const formated = await formatTacomData(jsonFormated)
            dataTacom.push(...formated)
          } else if (pc1Name.includes("VOLTA") || pc1Name.includes("volta")) {
            jsonFormated.pc = "2"
            const formated = await formatTacomData(jsonFormated)
            dataTacom.push(...formated)
          }
          else {
            jsonFormated.pc = "1"
            const formated = await formatTacomData(jsonFormated)
            dataTacom.push(...formated)
          }

          if (pc2Name.includes("VOLTA") || pc2Name.includes("volta")) {
            pc2.pc = "2"
            const formated = await formatTacomData(pc2)

            dataTacom.push(...formated)
          } else if (pc2Name.includes("IDA") || pc2Name.includes("ida")) {
            pc2.pc = "1"
            const formated = await formatTacomData(pc2)

            dataTacom.push(...formated)
          } else {
            pc2.pc = "1"
            const formated = await formatTacomData(jsonFormated)
            dataTacom.push(...formated)
          }
          
        }
        else {
          //console.log("Erro ao tratar nome")
        }
      }

     // console.log(dataTacom)

      const updatePlacemark = place.map((p) => ({
        ...p,
        LineString: {
          coordinates: p.LineString.coordinates,
          coordinatesTacom: dataTacom.find((f) => f.name === p.ExtendedData.SchemaData.SimpleData && f.pc === p.ExtendedData.SchemaData.pc)?.LineString ?? '',
          deviationsSumob: p.LineString.deviationsSumob ?? [],
          deviationsTacom: p.LineString.coordinatesTacom ?? [],
          lineDesviation: p.LineString.lineDesviation ?? []
        },
        ExtendedData:{
        SchemaData:{
          id: p.ExtendedData.SchemaData.id,
          SimpleData: p.ExtendedData.SchemaData.SimpleData,
          key: p.ExtendedData.SchemaData.key,
          pc: p.ExtendedData.SchemaData.pc,
          sumobDistance: p.ExtendedData.SchemaData.sumobDistance,
          tacomDistance: p.ExtendedData.SchemaData.tacomDistance,
          obs: dataTacom.find((f) => f.name === p.ExtendedData.SchemaData.SimpleData && f.pc === p.ExtendedData.SchemaData.pc)?.obs ?? '',
          buffer: p.ExtendedData.SchemaData.buffer ?? '',
          bufferPath: p.ExtendedData.SchemaData.bufferPath ?? '',
          kmDetour: p.ExtendedData.SchemaData.kmDetour ?? '',
          percentDetour: p.ExtendedData.SchemaData.percentDetour ?? '',
          stats: "",
          
        }
      }
      }))
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
  async function buildDeviationReport(lines: FormattedPlacemark[]) {
    const sheet = workbook.addWorksheet("Principal");

    sheet.columns = [

      { header: "LINHA", key: 'lin', width: 10 },
      { header: "ID", key: 'id', width: 5 },
      { header: "PC", key: 'pc', width: 5 },
      { header: "DESVIOS", key: 'dev', width: 10 },
      { header: "DESVIOS EM KM", key: 'devkm', width: 10 },
      { header: "KM SUMOB", key: 'ks', width: 15},
      { header: "KM CITGIS", key: 'kc', width: 15},
      { header: "OBS", key: 'ob', width: 10},
      { header: "STATUS", key: 'stats', width: 12 }

    ]

  
    for (var l of lines) {
      sheet.addRow({
        lin: l.ExtendedData.SchemaData.SimpleData ?? " ",
        id: l.ExtendedData.SchemaData.id ?? " ",
        pc: l.ExtendedData.SchemaData.pc ?? " ",
        dev: l.LineString.deviationsSumob?.length + l.LineString.deviationsTacom?.length,
        devkm: l.ExtendedData.SchemaData.kmDetour,
        ks: l.ExtendedData.SchemaData.sumobDistance ?? " ",
        kc: l.ExtendedData.SchemaData.tacomDistance ?? " ",
        ob: l.ExtendedData.SchemaData.obs ?? " ",
        stats: l.ExtendedData.SchemaData.stats ?? " "
      })
    }

    const buffer = await workbook.xlsx.writeBuffer();

    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const date = format(new Date().toString(), "dd-MM-yyyy HH-mm-ss")
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Processamento ${date}`
    a.click();
    URL.revokeObjectURL(url);
  }
  async function handleCompare(place: FormattedPlacemark[]) {
    try {
      var percent = 0
      const deviatedLines: FormattedPlacemark[] = [];
      place.forEach((p) => {
        const sumob = p.LineString.coordinates;
        const tacom = p.LineString.coordinatesTacom;
        if (tacom) {
          var rota = null

          const points = getDistanceDetour({ cordA: sumob, cordB: tacom, tol: tol, switc: bufferPath });
          const buffer = generateBuffer( sumob, tacom, bufferSize, bufferPath)
          const distance = getDistance(sumob, tacom, tol);

          if(bufferPath === "CITGIS"){
            rota = tacom
          }else{
            rota = sumob
          }

          const path = generateBufferPath(rota, bufferSize)
          const sumobs = parseFloat(distance[0].toString());
          const tacoms = parseFloat(distance[1].toString());
          const kmDev = calculatePercentDesviation(points[0])

        

          p.LineString.deviationsSumob = points[0] ?? [];
          p.LineString.deviationsTacom = points[1] ?? [];
          p.ExtendedData.SchemaData.sumobDistance = sumobs;
          p.ExtendedData.SchemaData.tacomDistance = tacoms;
          p.ExtendedData.SchemaData.buffer = buffer;
          p.ExtendedData.SchemaData.bufferPath = path;
          p.ExtendedData.SchemaData.kmDetour = kmDev.totalDistance ?? 0
          p.ExtendedData.SchemaData.percentDetour = calculatePercentDetour(kmDev.totalDistance ?? 0, sumobs)
          p.LineString.lineDesviation = kmDev.groups
            deviatedLines.push(p);
            percent = percent + 1
          }
        }

      );
      setPercentLoad(prev => prev + percent)
      console.log(percentLoad)
      setPlacemark(place);
      validateItineraries(place)
    }
    catch (err) {
      console.log("Erro", err);
    }
  }

  function handleOpenMap(linha: FormattedPlacemark) {

    localStorage.setItem("@rows", JSON.stringify(linha))
    window.open("/map", "_blank")

  }
  function handleClear() {
    setPlacemark([])
    setDet(false)
    setDev(0)
    setIsup(false)
    setResut(false)
    setLoading(false)
    setResut(false)
    localStorage.clear()
  }

  function calculatePercentDetour(kmDet: number, kmTotal: number){
    const percent = (kmDet / kmTotal) * 100
    
    return  percent.toFixed(1).toString()
  }

 function validateItineraries(place: FormattedPlacemark[]){

  place.forEach((p) => {
    const desviationsKm = p.ExtendedData.SchemaData.kmDetour ?? 0
    const percentDev = Number(p.ExtendedData.SchemaData.percentDetour) ?? 0
    const devLength = p.LineString.deviationsSumob.length ?? 0 + p.LineString.deviationsTacom.length 
    const buffer = p.ExtendedData.SchemaData.buffer.length

    if(devLength >= 2 && percentDev > 1 && buffer >= 1 || percentDev > 1 || devLength > 4){
      p.ExtendedData.SchemaData.stats = "INCOERENTE"
    }else{
      p.ExtendedData.SchemaData.stats = "OK"
    }
  })
  setPlacemark(place)

  localStorage.setItem("@data", JSON.stringify(place))
 }
  return (

    <div className="w-full h-full text-white flex justify-center flex-col items-center">

      {loading && (

        <Progress className="w-full max-w-sm" value={percentLoad} max={200} >
          <ProgressLabel>Procesando...</ProgressLabel>
          <ProgressValue />
        </Progress>
      )}

      {isup && !loading && det && (
        <div className="w-full h-full flex flex-col justify-center items-center space-y-4 bg-black">
          <h1 className="text-4xl font-bold text-white">Conferencia de Itínerarios</h1>
          <div className="w-9/12 h-7/12 overflow-x-auto border-gray-700 border-2 rounded-lg">
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
                    <TableCell>{linha.ExtendedData.SchemaData.id}</TableCell>
                    <TableCell>{linha.ExtendedData.SchemaData.pc}</TableCell>
                    <TableCell>{linha.ExtendedData.SchemaData.sumobDistance}</TableCell>
                    <TableCell>{linha.ExtendedData.SchemaData.tacomDistance}</TableCell>
                    <TableCell>{linha.LineString.deviationsSumob?.length + linha.LineString.deviationsTacom?.length}</TableCell>
                     <TableCell>{linha.ExtendedData.SchemaData.kmDetour}</TableCell>
                     <TableCell>{linha.ExtendedData.SchemaData.percentDetour}%</TableCell>
                     <TableCell className={linha.ExtendedData.SchemaData.stats === "INCOERENTE" ? "text-red-500 font-bold" : "text-white font-bold"}>
                      {linha.ExtendedData.SchemaData.stats}   </TableCell>
                    <TableCell className={linha.ExtendedData.SchemaData.obs === "POSSUI QRP" ? "text-green-600" : "text-white font-bold"}>{linha.ExtendedData.SchemaData.obs}</TableCell>

                    <TableCell>
                      <Button onClick={() => handleOpenMap(linha)} className="py-1 px-2 rounded-md bg-gray-800 text-white border border-gray-600 hover:bg-gray-700 transition-colors">
                        Mapa
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="space-x-3"> <Button className="bg-gray-800  text-white min-w-35 py-2 rounded-md font-bold border border-gray-600 hover:bg-gray-700 transition-colors" onClick={() => setDet(false)} >
            Voltar
          </Button>
            <Button className="bg-gray-800 text-white py-2 rounded-md min-w-35 font-bold border border-gray-600 hover:bg-gray-700 transition-colors" onClick={handleClear}>
              Reiniciar
            </Button>

            <Button className="bg-gray-800 text-white min-w-35 px-4 py-2 rounded-md font-bold border border-gray-600 hover:bg-gray-700 transition-colors"
              onClick={() => buildDeviationReport(placemark)}>
              Gerar relatório
            </Button>

          </div>

        </div>
      )}
      {result && isup && !loading && !det && (
        <div className="w-full h-full flex flex-col justify-center items-center gap-8 bg-black py-20">
         
          <div className="px-12 max-w-2xl">
            <h1 className="text-white text-6xl font-bold mb-8 text-center">Resultados</h1>
            <div className="flex flex-col gap-6 bg-black rounded-lg p-8 border w-120 border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-lg">Linhas processadas:</span>
                <span className="text-white text-2xl font-bold">{placemark.length}</span>
              </div>
              <div className="h-px bg-gray-700"></div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-lg">Desvios encontrados:</span>
                <span className="text-white text-2xl font-bold">{placemark.filter(p => p.ExtendedData.SchemaData.stats === "INCOERENTE").length}</span>
              </div>
              <div className="h-px bg-gray-700"></div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-lg">Tolerância em metros:</span>
                <span className="text-white text-2xl font-bold">{tol}</span>
              </div>
            </div>
          </div>
          <Button className="mt-8 bg-gray-800 text-white border border-gray-600 px-12 py-3 rounded-lg font-bold text-xl hover:bg-gray-700 transition-colors duration-200" onClick={() => setDet(true)}>
            Ver detalhes
          </Button>
        </div>
      )}

      {!isup && !loading && (
        <div className="w-full h-full flex  justify-center items-center bg-black ">
          <SidebarProvider className="w-100  border-2 border-gray-700 rounded-md flex-col bg-black">
            <SidebarHeader className="w-full py-4 border-b border-gray-700  ">
              <div className="flex flex-col items-center gap-2">
                <h1 className="font-bold text-2xl text-center text-white">Configurações</h1>
                
              </div>
            </SidebarHeader>
            <SidebarContent className="p-6 space-y-6">

         
              <div className="space-y-3 bg-black rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-white text-sm">Tolerância de Desvio</label>
                  <span className="text-sm font-semibold text-gray-300 bg-gray-900 px-3 py-1 rounded">{tol}m</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="200" 
                  step="5"
                  value={tol} 
                  onChange={(e) => setTol(Number(e.target.value))} 
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-gray-400"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>10m</span>
                  <span>200m</span>
                </div>
                <p className="text-xs text-gray-500">Distância máxima entre os Itinerarios</p>
              </div>

           
              <div className="space-y-3 bg-black rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-white text-sm">Tamanho do Buffer</label>
                  <span className="text-sm font-semibold text-gray-300 bg-gray-900 px-3 py-1 rounded">{bufferSize}m</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="100" 
                  step="5"
                  value={bufferSize} 
                  onChange={(e) => SetbufferSize(Number(e.target.value))} 
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-gray-400"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>10m</span>
                  <span>100m</span>
                </div>
                <p className="text-xs text-gray-500">Raio do traçado do buffer</p>
              </div>

             
              <div className="space-y-3 bg-black rounded-lg p-4 border border-gray-700">
                <label className="font-bold text-white text-sm block">Fonte de Dados</label>
                <div className="flex gap-2">
                  <Button 
                    className={`flex-1 py-2 rounded-md font-semibold text-sm transition-all ${
                      bufferPath === "CITGIS" 
                        ? "bg-gray-700 text-white border-2 border-red-700" 
                        : "bg-gray-900 text-gray-400 border-2 border-gray-700 hover:bg-gray-800"
                    }`} 
                    onClick={() => SetbufferPath(bufferPath === "CITGIS" ? "SUMOB" : "CITGIS")}
                  >
                    {bufferPath === "CITGIS" ? "✓ CITGIS" : "CITGIS"}
                  </Button>
                  <Button 
                    className={`flex-1 py-2 rounded-md font-semibold text-sm transition-all ${
                      bufferPath === "SUMOB" 
                        ? "bg-gray-700 text-white border-2 border-blue-700" 
                        : "bg-gray-900 text-gray-400 border-2 border-gray-700 hover:bg-gray-800"
                    }`} 
                    onClick={() => SetbufferPath(bufferPath === "SUMOB" ? "CITGIS" : "SUMOB")}
                  >
                    {bufferPath === "SUMOB" ? "✓ SUMOB" : "SUMOB"}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">Origem dos dados do buffer</p>
              </div>

             
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <h3 className="text-sm font-bold text-white mb-3">Resumo</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tolerância:</span>
                    <span className="text-gray-200 font-semibold">{tol}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Buffer:</span>
                    <span className="text-gray-200 font-semibold">{bufferSize}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Fonte do buffer:</span>
                    <span className="text-gray-200 font-semibold">{bufferPath}</span>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full bg-gray-800 text-white py-2 rounded-md font-semibold hover:bg-gray-700 transition-colors border border-gray-600"
                onClick={() => {
                  setTol(50);
                  SetbufferSize(30);
                  SetbufferPath("CITGIS");
                }}
              >
                Resetar Padrões
              </Button>

          
              
            </SidebarContent>
          </SidebarProvider>

          <div className="w-full ">
            <div className="w-full h-screen flex flex-col justify-center items-center ">
              <h1 className="text-4xl mb-8 font-bold text-white">Insira o arquivo KML</h1>
              <div className="w-7/12 h-5/12 border-2 border-gray-700 rounded-md flex justify-center items-center border-dashed">
                <UploadCloudIcon className="absolute text-gray-400" width={200} height={200} />
                <Input className="w-full opacity-0 h-full cursor-pointer" type="file" accept="kml" onChange={handleFileChange} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


