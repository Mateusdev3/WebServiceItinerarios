export interface PlacemarkProps {
    Style: {
        LineStyle: {
            color: string;
        };
        PolyStyle: {
            fill: number;
        };
    };
    ExtendedData: {
        SchemaData: {
            SimpleData: number[];
        };
    };
    LineString: {
        coordinates: string
        key?: number
    }
}

export interface FormattedPlacemark {
    Style: {
        LineStyle: {
            color: string;
        };
        PolyStyle: {
            fill: number;
        };
    };
    ExtendedData: {
        SchemaData: {
            id?: string;
            SimpleData: string;
            key?: number;
            pc: string;
        };
    };
    LineString: {
        coordinates: number[][];
        coordinatesTacom?: number[][];
        deviations?: number[][];
       
    };
}

export interface TacomDataResponseProps{
   
        name: string;
        description: string;
        styleUrl: string;
        LineString: {
            coordinates: string| number[][] ;
            extrude: number;
            tessellate: number;
        }
    
}

export interface LinesIdResponseProps{
    id: number;
    codExternoSigla: string;
    descricao: string;
    descricaoOrigemIda?: string;
    descricaoDestinoIda?: string;

}


export interface TacomCordsProps{
    Placemark:{
        LineString:{
            cordinates: string;
            extrude: number;
            tessellate: number;
            description: string;
            name: string;
            styleUrl: string;

        }
    }
}