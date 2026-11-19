type CuerpoInsertSiodFalla = {
  idsolicitud: string;
  idCentral: number;
  descripcion: string;
  fechainicio: string;
  fechaFin?: string;
};

const LimiteEsperaRespuestaSiodMs = 1500;

function EsperarFetchSiod(fetchIniciado: Promise<Response>): Promise<boolean> {
  return Promise.race([
    fetchIniciado.then((respuesta) => respuesta.ok, () => false),
    new Promise<boolean>((resolve) => {
      window.setTimeout(() => resolve(false), LimiteEsperaRespuestaSiodMs);
    })
  ]);
}

export async function InsertarSolicitudFallaEnSiod(
  urlPlantilla: string,
  cuerpo: CuerpoInsertSiodFalla
): Promise<boolean> {
  const url = urlPlantilla.trim();
  if (!url) {
    return false;
  }

  try {
    return await EsperarFetchSiod(
      fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cuerpo)
      })
    );
  } catch {
    return false;
  }
}