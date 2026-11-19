import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { DatosNuevaSolicitudFalla } from '../../../models/SolicitudFalla';
import { ArchivoConNombreSanitizado } from '../../../utils/SanearNombreArchivoAdjunto';
import { ValidarArchivoAdjuntoSharePoint } from '../../../utils/ValidacionAdjuntosSharePoint';
import {
  ActualizarIdBitacoraFalla,
  AgregarAdjuntoSolicitudFalla,
  CrearSolicitudFallaEnSharePoint,
  ExisteSolicitudFallaConIdCen
} from './SolicitudFallaCrudServicio';
import { CrearEntradaBitacoraAltaSolicitudFalla } from './BitacoraSolicitudFallaServicio';
import { IdCenDuplicadoSolicitudFallaError } from './IdCenDuplicadoSolicitudFallaError';

export type ProgresoRegistroSolicitudFalla = {
  mensaje: string;
};

export async function RegistrarNuevaSolicitudFallaCompleta(
  context: WebPartContext,
  datos: DatosNuevaSolicitudFalla,
  archivos: File[],
  onProgreso?: (progreso: ProgresoRegistroSolicitudFalla) => void
): Promise<number> {
  const informar = (mensaje: string): void => {
    onProgreso?.({ mensaje });
  };

  for (const archivo of archivos) {
    const errorArchivo = ValidarArchivoAdjuntoSharePoint(archivo);
    if (errorArchivo) {
      throw new Error(errorArchivo);
    }
  }

  informar('Validando ID CEN…');
  if (await ExisteSolicitudFallaConIdCen(context, datos.idCen)) {
    throw new IdCenDuplicadoSolicitudFallaError();
  }

  informar('Guardando la solicitud de falla…');
  const idSolicitud = await CrearSolicitudFallaEnSharePoint(context, datos);

  if (archivos.length > 0) {
    informar('Adjuntando archivos…');
    for (let indice = 0; indice < archivos.length; indice += 1) {
      const archivoSanitizado = ArchivoConNombreSanitizado(archivos[indice]);
      informar(`Adjuntando archivo ${indice + 1} de ${archivos.length}…`);
      await AgregarAdjuntoSolicitudFalla(context, idSolicitud, archivoSanitizado);
    }
  }

  informar('Registrando bitácora…');
  const idBitacora = await CrearEntradaBitacoraAltaSolicitudFalla(context, idSolicitud);

  await ActualizarIdBitacoraFalla(context, idSolicitud, idBitacora);

  return idSolicitud;
}