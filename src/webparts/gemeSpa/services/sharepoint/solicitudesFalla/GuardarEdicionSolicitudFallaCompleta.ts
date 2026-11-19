import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { DatosActualizarSolicitudFalla } from '../../../models/SolicitudFalla';
import { ArchivoConNombreSanitizado } from '../../../utils/SanearNombreArchivoAdjunto';
import { ValidarArchivoAdjuntoSharePoint } from '../../../utils/ValidacionAdjuntosSharePoint';
import {
  ActualizarSolicitudFallaEnSharePoint,
  AgregarAdjuntoSolicitudFalla,
  EliminarAdjuntoSolicitudFalla,
  ExisteSolicitudFallaConIdCen
} from './SolicitudFallaCrudServicio';
import { CrearEntradaBitacoraEdicionSolicitudFalla } from './BitacoraSolicitudFallaServicio';
import { IdCenDuplicadoSolicitudFallaError } from './IdCenDuplicadoSolicitudFallaError';

export async function GuardarEdicionSolicitudFallaCompleta(
  context: WebPartContext,
  idSolicitud: number,
  datos: DatosActualizarSolicitudFalla,
  archivosNuevos: File[],
  adjuntosEliminar: string[],
  estadoSolicitud: string
): Promise<void> {
  for (const archivo of archivosNuevos) {
    const errorArchivo = ValidarArchivoAdjuntoSharePoint(archivo);
    if (errorArchivo) {
      throw new Error(errorArchivo);
    }
  }

  if (await ExisteSolicitudFallaConIdCen(context, datos.idCen, idSolicitud)) {
    throw new IdCenDuplicadoSolicitudFallaError();
  }

  await ActualizarSolicitudFallaEnSharePoint(context, idSolicitud, datos);

  for (const nombre of adjuntosEliminar) {
    await EliminarAdjuntoSolicitudFalla(context, idSolicitud, nombre);
  }

  for (const archivo of archivosNuevos) {
    await AgregarAdjuntoSolicitudFalla(context, idSolicitud, ArchivoConNombreSanitizado(archivo));
  }

  await CrearEntradaBitacoraEdicionSolicitudFalla(context, idSolicitud, estadoSolicitud);
}