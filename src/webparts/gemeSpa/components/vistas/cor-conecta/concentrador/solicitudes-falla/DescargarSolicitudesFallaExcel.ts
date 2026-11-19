import * as XLSX from 'xlsx-js-style';
import type { SolicitudFalla } from '../../../../../models/SolicitudFalla';

/** Encabezados al estilo exportación SharePoint / Excel vinculado (como Solicitudes IL). */
const EncabezadosExportacionVinculado = [
  'ID',
  'ID_BITACORA',
  'ID_CEN',
  'INSTALACION',
  'EQUIPOS',
  'FECHAPERTURBACION',
  'FECHAEFECTIVARETORNO',
  'POTENCIA',
  'MEDIDA',
  'DESCRIPCION',
  'ESTADO',
  'TIPO DE ELEMENTO',
  'RUTA DE ACCESO'
] as const;

const NombreHojaExportacion = 'query';
const NombreArchivoExportacionSolicitudFalla = 'GM_Concentrador_Solicitud_Falla.xlsx';
const FormatoFechaExcelVinculado = 'dd-mm-yyyy h:mm';
const TipoElementoListaSharePoint = 'Elemento';

const ColorEncabezadoFondo = '003F5C';
const ColorEncabezadoTexto = 'FFFFFF';
const ColorFilaDatosClara = 'D9EAF7';
const ColorFilaDatosBlanca = 'FFFFFF';
const ColorBordeCelda = '9DC3E6';

type EstiloCeldaExportacion = XLSX.CellObject['s'];

/** Origen Excel 1900 (días desde 1899-12-30 UTC). */
function FechaIsoASerialExcel(valorIso: string | undefined): number | undefined {
  if (!valorIso?.trim()) {
    return undefined;
  }
  const fecha = new Date(valorIso);
  if (Number.isNaN(fecha.getTime())) {
    return undefined;
  }
  const origenUtc = Date.UTC(1899, 11, 30);
  return (fecha.getTime() - origenUtc) / 86_400_000;
}

function BordeCeldaTabla(): NonNullable<EstiloCeldaExportacion>['border'] {
  const linea = { style: 'thin', color: { rgb: ColorBordeCelda } };
  return { top: linea, bottom: linea, left: linea, right: linea };
}

function EstiloEncabezado(): EstiloCeldaExportacion {
  return {
    fill: { patternType: 'solid', fgColor: { rgb: ColorEncabezadoFondo } },
    font: { bold: true, color: { rgb: ColorEncabezadoTexto } },
    alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
    border: BordeCeldaTabla()
  };
}

function EstiloCeldaDatos(indiceFilaHoja: number, multilinea: boolean): EstiloCeldaExportacion {
  const esFilaCeleste = indiceFilaHoja >= 1 && indiceFilaHoja % 2 === 1;
  return {
    fill: {
      patternType: 'solid',
      fgColor: { rgb: esFilaCeleste ? ColorFilaDatosClara : ColorFilaDatosBlanca }
    },
    font: { color: { rgb: '000000' } },
    alignment: { horizontal: 'left', vertical: 'top', wrapText: multilinea },
    border: BordeCeldaTabla()
  };
}

type CeldaHoja = XLSX.CellObject;

function CeldaTexto(valor: string): CeldaHoja {
  return { v: valor, t: 's', z: '@' };
}

function CeldaNumero(valor: number, formato: string): CeldaHoja {
  return { v: valor, t: 'n', z: formato };
}

function CeldaFechaVinculada(valorIso: string | undefined): CeldaHoja {
  const serial = FechaIsoASerialExcel(valorIso);
  if (serial === undefined) {
    return { t: 'z', z: FormatoFechaExcelVinculado };
  }
  return { v: serial, t: 'n', z: FormatoFechaExcelVinculado };
}

const AnchosColumnasExportacionVinculado: XLSX.ColInfo[] = [
  { wch: 6 },
  { wch: 14 },
  { wch: 16 },
  { wch: 18 },
  { wch: 28 },
  { wch: 20 },
  { wch: 20 },
  { wch: 10 },
  { wch: 8 },
  { wch: 52 },
  { wch: 14 },
  { wch: 18 },
  { wch: 44 }
];

const IndiceColumnaDescripcion = EncabezadosExportacionVinculado.indexOf('DESCRIPCION');

function FilaDatosVinculados(
  fila: SolicitudFalla,
  rutaAccesoLista: string
): readonly CeldaHoja[] {
  const potencia =
    typeof fila.potencia === 'number' && !Number.isNaN(fila.potencia) ? fila.potencia : undefined;

  return [
    CeldaNumero(fila.id, '0'),
    CeldaTexto(fila.idBitacora ?? ''),
    CeldaTexto(fila.idCen ?? ''),
    CeldaTexto(fila.centralEtiqueta ?? ''),
    CeldaTexto(fila.equiposEtiqueta ?? ''),
    CeldaFechaVinculada(fila.fechaPerturbacion),
    CeldaFechaVinculada(fila.fechaRetorno),
    potencia !== undefined ? CeldaNumero(potencia, 'General') : CeldaTexto(''),
    CeldaTexto(fila.medida?.trim() ?? ''),
    CeldaTexto(fila.descripcion ?? ''),
    CeldaTexto(fila.estado ?? ''),
    CeldaTexto(TipoElementoListaSharePoint),
    CeldaTexto(rutaAccesoLista)
  ];
}

function AplicarEstilosHoja(hoja: XLSX.WorkSheet, totalFilas: number, totalColumnas: number): void {
  for (let fila = 0; fila < totalFilas; fila += 1) {
    for (let columna = 0; columna < totalColumnas; columna += 1) {
      const direccion = XLSX.utils.encode_cell({ r: fila, c: columna });
      const celda = hoja[direccion];
      if (!celda) {
        continue;
      }
      if (fila === 0) {
        celda.s = EstiloEncabezado();
        continue;
      }
      const multilinea = columna === IndiceColumnaDescripcion;
      celda.s = EstiloCeldaDatos(fila, multilinea);
    }
  }
}

function ConstruirHojaExportacionVinculada(
  filas: readonly SolicitudFalla[],
  rutaAccesoLista: string
): XLSX.WorkSheet {
  const hoja: XLSX.WorkSheet = {};
  const totalFilas = filas.length + 1;
  const totalColumnas = EncabezadosExportacionVinculado.length;

  EncabezadosExportacionVinculado.forEach((titulo, indiceColumna) => {
    const celda = XLSX.utils.encode_cell({ r: 0, c: indiceColumna });
    hoja[celda] = CeldaTexto(titulo);
  });

  filas.forEach((fila, indiceFila) => {
    const celdas = FilaDatosVinculados(fila, rutaAccesoLista);
    celdas.forEach((celda, indiceColumna) => {
      const direccion = XLSX.utils.encode_cell({ r: indiceFila + 1, c: indiceColumna });
      hoja[direccion] = celda;
    });
  });

  const rango = {
    s: { r: 0, c: 0 },
    e: { r: totalFilas - 1, c: totalColumnas - 1 }
  };
  hoja['!ref'] = XLSX.utils.encode_range(rango);
  hoja['!cols'] = AnchosColumnasExportacionVinculado;
  hoja['!autofilter'] = { ref: hoja['!ref'] };
  AplicarEstilosHoja(hoja, totalFilas, totalColumnas);
  return hoja;
}

export function DescargarSolicitudesFallaComoExcel(
  filas: readonly SolicitudFalla[],
  rutaAccesoLista: string
): boolean {
  if (filas.length === 0) {
    return false;
  }

  const hoja = ConstruirHojaExportacionVinculada(filas, rutaAccesoLista);
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, NombreHojaExportacion);
  XLSX.writeFile(libro, NombreArchivoExportacionSolicitudFalla, { cellStyles: true });
  return true;
}