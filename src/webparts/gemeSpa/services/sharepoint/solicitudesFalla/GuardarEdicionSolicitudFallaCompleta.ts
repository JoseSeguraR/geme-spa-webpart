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
import {
  EstadoSolicitudFallaFinalizada,
  EstadoSolicitudFallaVigente,
  ResolverEstadoSolicitudFallaDesdeFechaRetorno
} from '../../../components/vistas/cor-conecta/concentrador/solicitudes-falla/constantesSolicitudFalla';
import { FinalizarGestionSolicitudFallaConBitacora } from './GestionarFinalizacionSolicitudFallaServicio';
import { SincronizarSiodUpdateTrasFinalizacionFalla } from './SincronizarSiodUpdateTrasFinalizacionFalla';
import type { ResultadoSincronizacionSiodFalla } from './ResultadoSiodSolicitudFalla';

export type ProgresoGuardadoSolicitudFalla = {
  mensaje: string;
};

export type OpcionesSiodEdicionSolicitudFalla = {
  urlUpdateSiod?: string;
  fechaRetornoLocal?: string;
};

export type ResultadoGuardadoEdicionSolicitudFalla = {
  resultadoSiod?: ResultadoSincronizacionSiodFalla;
};

export async function GuardarEdicionSolicitudFallaCompleta(
  context: WebPartContext,
  idSolicitud: number,
  datos: DatosActualizarSolicitudFalla,
  archivosNuevos: File[],
  adjuntosEliminar: string[],
  estadoAnterior: string,
  idBitacoraReferencia?: string,
  opcionesSiod?: OpcionesSiodEdicionSolicitudFalla,
  onProgreso?: (progreso: ProgresoGuardadoSolicitudFalla) => void
): Promise<ResultadoGuardadoEdicionSolicitudFalla> {
  const informar = (mensaje: string): void => {
    onProgreso?.({ mensaje });
  };

  for (const archivo of archivosNuevos) {
    const errorArchivo = ValidarArchivoAdjuntoSharePoint(archivo);
    if (errorArchivo) {
      throw new Error(errorArchivo);
    }
  }

  informar('Validando ID CEN…');
  if (await ExisteSolicitudFallaConIdCen(context, datos.idCen, idSolicitud)) {
    throw new IdCenDuplicadoSolicitudFallaError();
  }

  const estadoNuevo = ResolverEstadoSolicitudFallaDesdeFechaRetorno(datos.fechaRetornoIso);

  informar('Actualizando la solicitud en SharePoint…');
  await ActualizarSolicitudFallaEnSharePoint(context, idSolicitud, datos);

  if (adjuntosEliminar.length > 0) {
    informar('Eliminando adjuntos…');
    for (const nombre of adjuntosEliminar) {
      await EliminarAdjuntoSolicitudFalla(context, idSolicitud, nombre);
    }
  }

  if (archivosNuevos.length > 0) {
    informar('Adjuntando archivos nuevos…');
    for (const archivo of archivosNuevos) {
      await AgregarAdjuntoSolicitudFalla(
        context,
        idSolicitud,
        ArchivoConNombreSanitizado(archivo)
      );
    }
  }

  if (
    estadoAnterior === EstadoSolicitudFallaVigente &&
    estadoNuevo === EstadoSolicitudFallaFinalizada
  ) {
    informar('Registrando cierre en bitácora…');
    await FinalizarGestionSolicitudFallaConBitacora(context, {
      idSolicitudFalla: idSolicitud,
      idBitacoraReferencia,
      observaciones: ''
    });
  } else {
    informar('Registrando bitácora de edición…');
    await CrearEntradaBitacoraEdicionSolicitudFalla(context, idSolicitud, estadoNuevo);
  }

  let resultadoSiod: ResultadoSincronizacionSiodFalla | undefined;
  if (
    estadoAnterior === EstadoSolicitudFallaVigente &&
    estadoNuevo === EstadoSolicitudFallaFinalizada &&
    opcionesSiod?.fechaRetornoLocal?.trim()
  ) {
    informar('Preparando integración SIOD por finalización…');
    resultadoSiod = await SincronizarSiodUpdateTrasFinalizacionFalla({
      idSolicitud,
      fechaRetornoLocal: opcionesSiod.fechaRetornoLocal,
      urlUpdateSiod: opcionesSiod.urlUpdateSiod,
      onProgreso: informar
    });
  }

  return { resultadoSiod };
}