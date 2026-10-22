type CuerpoInsertVigenteSiod = {
  idsolicitud: string;
  idCentral: number;
  descripcion: string;
  fechainicio: string;
};

type CuerpoInsertFinalizadaSiod = CuerpoInsertVigenteSiod & {
  fechaFin: string;
};

type CuerpoUpdateSiod = {
  idsolicitud: string;
  idCentral?: number;
  descripcion?: string;
  fechainicio?: string;
  /** undefined = omitir; usar limpiarFechaFin para enviar null en JSON. */
  fechaFin?: string;
  limpiarFechaFin?: boolean;
};

const LimiteEsperaRespuestaSiodMs = 1500;

/**
 * Espera como máximo {@link LimiteEsperaRespuestaSiodMs} ms; la petición puede seguir en segundo plano.
 */
function EsperarFetchSiod(fetchIniciado: Promise<Response>): Promise<void> {
  return Promise.race([
    fetchIniciado.then(
      () => undefined,
      () => undefined
    ),
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, LimiteEsperaRespuestaSiodMs);
    })
  ]);
}

/**
 * Envía POST a SIOD sin interpretar la respuesta ni afectar el flujo de guardado en SharePoint.
 */
async function EnviarPostSiod(urlPlantilla: string, cuerpo?: unknown): Promise<void> {
  const url = urlPlantilla.trim();
  if (!url) {
    return;
  }

  const init: RequestInit = {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  };

  if (cuerpo !== undefined) {
    init.body = JSON.stringify(cuerpo);
  }

  try {
    await EsperarFetchSiod(fetch(url, init));
  } catch {
    // Fire-and-forget: errores de red no se propagan a la UI.
  }
}

async function EnviarDeleteSiod(url: string): Promise<void> {
  const destino = url.trim();
  if (!destino) {
    return;
  }

  try {
    await EsperarFetchSiod(
      fetch(destino, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json'
        }
      })
    );
  } catch {
    // Fire-and-forget: errores de red no se propagan a la UI.
  }
}

export async function InsertarSolicitudVigenteEnSiod(
  urlInsertSiod: string,
  cuerpo: CuerpoInsertVigenteSiod
): Promise<void> {
  await EnviarPostSiod(urlInsertSiod, cuerpo);
}

export async function InsertarSolicitudFinalizadaEnSiod(
  urlInsertSiod: string,
  cuerpo: CuerpoInsertFinalizadaSiod
): Promise<void> {
  await EnviarPostSiod(urlInsertSiod, cuerpo);
}

export async function ActualizarSolicitudEnSiod(urlUpdateSiod: string, cuerpo: CuerpoUpdateSiod): Promise<void> {
  const payload: Record<string, string | number | null> = {
    idsolicitud: cuerpo.idsolicitud
  };

  if (cuerpo.idCentral !== undefined) {
    payload.idCentral = cuerpo.idCentral;
  }
  if (cuerpo.descripcion !== undefined) {
    payload.descripcion = cuerpo.descripcion;
  }
  if (cuerpo.fechainicio !== undefined) {
    payload.fechainicio = cuerpo.fechainicio;
  }
  if (cuerpo.limpiarFechaFin) {
    payload.fechaFin = null;
  } else if (cuerpo.fechaFin !== undefined) {
    payload.fechaFin = cuerpo.fechaFin;
  }

  await EnviarPostSiod(urlUpdateSiod, payload);
}

export async function EliminarSolicitudEnSiod(urlDeletePlantilla: string, idCen: string): Promise<void> {
  const id = idCen.trim();
  if (!id || !urlDeletePlantilla.trim()) {
    return;
  }

  if (!urlDeletePlantilla.includes('{idsolicitud}')) {
    return;
  }

  const url = urlDeletePlantilla.trim().replace('{idsolicitud}', encodeURIComponent(id));
  await EnviarDeleteSiod(url);
}
