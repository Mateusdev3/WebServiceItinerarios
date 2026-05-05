"use server"

import { FormattedPlacemark, LinesIdResponseProps } from "@/lib/types/types";
import { XMLParser } from "fast-xml-parser";

const token = process.env.NEXT_PUBLIC_TOKEN_TACOM


export async function getLineId(lines: FormattedPlacemark[]) {

    try {

        const response = await fetch("https://citgisnext.sitbus.com.br:9998/citgis-service-bhz/citgis/linha/findByFilterValid", {
            headers: {
                "accept": "application/json, text/javascript, */*; q=0.01",
                "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
                "authorization": `Bearer ${token}`,
                "content-type": "application/json; charset=UTF-8",
            },
            body: JSON.stringify({
                maxRegistros: 1900,
                linhaCodExternoSigla: '',
                linhaDescricao: null,
                linhaCodigo: null,
                linhaEmpresa: null,
                linhaSituacao: null,
                linhaCaracteristica: null,
                linhaTipoServico: null,
                linhaOperadoraId: null,
                linhaOperadoraDescricao: null
            }),
            method: "POST",
        });

        const data: LinesIdResponseProps[] = await response.json();
        const fullLines: FormattedPlacemark[] = lines.map((sumob) => ({
            ...sumob,
            ExtendedData: {
                SchemaData: {
                    ...sumob.ExtendedData.SchemaData,
                    id: data.find(line => sumob.ExtendedData.SchemaData.SimpleData === line.codExternoSigla)?.id.toString() ?? ''
                }
            }
        }))
        return fullLines

    } catch (error) {
        console.log(error)
        throw new Error("Erro ao bucar o id das linhas")

    }
}

export async function getTacomiTinerary(lines: FormattedPlacemark[]) {
    const parser = new XMLParser();

    try {
        const results: Array<string | { erro: true }> = [];

        for (const l of lines) {
            const response = await fetch("https://citgisnext.sitbus.com.br:9998/citgis-report-service-bhz/ecitbus/relatorio/dispatcherKML", {
                method: "POST",
                headers: {
                    "accept": "*/*",
                    "authorization": `Bearer ${token}`,
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    body: JSON.stringify({
                        tipoRelatorio: "KML",
                        parametrosTitulo: null,
                        idRelatorio: 12,
                        linha: l.ExtendedData.SchemaData.id
                    }),
                    idRelatorio: 12
                }),
            });
            const text = await response.text();
            console.log(text)
            results.push(text);
        }

        return results;
    } catch (erro) {
        console.log(erro);
        throw new Error("Erro ao buscar cordenadas tacom");
    }
}
