import {
  UrlAzureFunctionIncluyeCodigoAutorizacion
} from '../../../models/ConfiguracionSolicitudFalla';

export type CuerpoInsertAltaSiodFalla = {
  idsolicitud: string;
  instalacion: number;
  descripcion: string;
  fechainicio: string;
};

export type CuerpoUpdateAltaSiodFalla = {
  idreg: string;
  fechaefectivafin: string;
};

export type ResultadoPostSiodFalla = {
  exito: boolean;
  codigoEstado?: number;
  detalle?: string;
};

const LimiteEsperaRespuestaSiodMs = 60_000;

function EsExitoHttpSiod(codigo: number): boolean {
  return codigo >= 200 && codigo < 300;
}

export function MensajeUsuarioResultadoPostSiodFalla(
  resultado: ResultadoPostSiodFalla,
  contexto: 'inserción' | 'actualización'
): string {
  if (resultado.exito) {
    return `Integración SIOD (${contexto}): la Azure Function respondió correctamente.`;
  }

  const partes: string[] = [`Integración SIOD (${contexto}): no hubo respuesta exitosa.`];
  if (resultado.codigoEstado === 401) {
    partes.push(
      'Código HTTP 401 (no autorizado). En el web part, URL Insert SIOD debe ser la URL completa con ?code=<function key> válida (sin saltos de línea ni key truncada).'
    );
  } else if (resultado.codigoEstado !== undefined) {
    partes.push(`Código HTTP ${resultado.codigoEstado}.`);
  }
  const detalle = resultado.detalle?.trim();
  if (detalle) {
    const esFetchBloqueado = /failed to fetch|networkerror|cors/i.test(detalle);
    if (esFetchBloqueado) {
      partes.push(
        'El navegador bloqueó la llamada (red o CORS). En workbench local agregue https://localhost:4321 en CORS de la Function App.'
      );
    } else if (resultado.codigoEstado !== 401) {
      partes.push(detalle);
    }
  } else if (resultado.codigoEstado === undefined) {
    partes.push('Tiempo de espera agotado o error de red.');
  }
  return partes.join(' ');
}

async function EjecutarPostSiod(urlPlantilla: string, cuerpo: unknown): Promise<ResultadoPostSiodFalla> {
  const url = urlPlantilla.trim();
  if (!url) {
    return { exito: false, detalle: 'URL vacía' };
  }
  if (!UrlAzureFunctionIncluyeCodigoAutorizacion(url)) {
    return {
      exito: false,
      detalle:
        'La URL configurada no incluye ?code=. Pegue la URL completa de la Azure Function (incluida la function key).'
    };
  }

  const abortar = new AbortController();
  const temporizador = window.setTimeout(() => abortar.abort(), LimiteEsperaRespuestaSiodMs);

  try {
    const respuesta = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cuerpo),
      signal: abortar.signal,
      mode: 'cors',
      credentials: 'omit'
    });

    let cuerpoTexto = '';
    try {
      cuerpoTexto = await respuesta.text();
    } catch {
      cuerpoTexto = '';
    }

    if (EsExitoHttpSiod(respuesta.status)) {
      return { exito: true, codigoEstado: respuesta.status };
    }

    const extracto = cuerpoTexto.trim().slice(0, 240);
    return {
      exito: false,
      codigoEstado: respuesta.status,
      detalle: extracto || 'La Function devolvió un código de error.'
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { exito: false, detalle: `Tiempo de espera agotado (${LimiteEsperaRespuestaSiodMs / 1000} s).` };
    }
    const detalle = error instanceof Error ? error.message : 'Error de red';
    return { exito: false, detalle };
  } finally {
    window.clearTimeout(temporizador);
  }
}

/** Alta e integración manual: contrato insert SIOD (`instalacion` = ID de central en mantenedor). */
export async function InsertarAltaSiodSolicitudFalla(
  urlPlantilla: string | undefined,
  cuerpo: CuerpoInsertAltaSiodFalla
): Promise<ResultadoPostSiodFalla> {
  if (!urlPlantilla) {
    return { exito: false, detalle: 'URL insert SIOD no configurada' };
  }
  return EjecutarPostSiod(urlPlantilla, cuerpo);
}

export async function ActualizarAltaSiodSolicitudFalla(
  urlPlantilla: string | undefined,
  cuerpo: CuerpoUpdateAltaSiodFalla
): Promise<ResultadoPostSiodFalla> {
  if (!urlPlantilla) {
    return { exito: false, detalle: 'URL update SIOD no configurada' };
  }
  return EjecutarPostSiod(urlPlantilla, cuerpo);
}