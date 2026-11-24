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
import { ResolverEstadoSolicitudFallaDesdeFechaRetorno } from '../../../components/vistas/cor-conecta/concentrador/solicitudes-falla/constantesSolicitudFalla';
import { SincronizarSiodTrasAltaSolicitudFalla } from './SincronizarSiodTrasAltaSolicitudFalla';
import type { ResultadoSincronizacionSiodFalla } from './ResultadoSiodSolicitudFalla';

export type ProgresoRegistroSolicitudFalla = {
  mensaje: string;
};

export type ResultadoRegistroNuevaSolicitudFalla = {
  idSolicitud: number;
  resultadoSiod?: ResultadoSincronizacionSiodFalla;
};

export type OpcionesSiodAltaSolicitudFalla = {
  urlInsertSiod?: string;
  urlUpdateSiod?: string;
  fechaPerturbacionLocal: string;
  fechaRetornoLocal?: string;
};

export async function RegistrarNuevaSolicitudFallaCompleta(
  context: WebPartContext,
  datos: DatosNuevaSolicitudFalla,
  archivos: File[],
  opcionesSiod?: OpcionesSiodAltaSolicitudFalla,
  onProgreso?: (progreso: ProgresoRegistroSolicitudFalla) => void
): Promise<ResultadoRegistroNuevaSolicitudFalla> {
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
  const estadoSolicitud = ResolverEstadoSolicitudFallaDesdeFechaRetorno(datos.fechaRetornoIso);
  const idBitacora = await CrearEntradaBitacoraAltaSolicitudFalla(context, idSolicitud, estadoSolicitud);

  await ActualizarIdBitacoraFalla(context, idSolicitud, idBitacora);

  let resultadoSiod: ResultadoSincronizacionSiodFalla | undefined;
  if (opcionesSiod?.urlInsertSiod) {
    informar('Preparando integración con SIOD…');
    resultadoSiod = await SincronizarSiodTrasAltaSolicitudFalla({
      idSolicitud,
      datos,
      fechaPerturbacionLocal: opcionesSiod.fechaPerturbacionLocal,
      fechaRetornoLocal: opcionesSiod.fechaRetornoLocal,
      urlInsertSiod: opcionesSiod.urlInsertSiod,
      urlUpdateSiod: opcionesSiod.urlUpdateSiod,
      onProgreso: informar
    });
  }

  return { idSolicitud, resultadoSiod };
}