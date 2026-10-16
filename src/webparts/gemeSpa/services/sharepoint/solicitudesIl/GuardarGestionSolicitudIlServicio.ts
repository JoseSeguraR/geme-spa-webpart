import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { ConfiguracionBitacoraSolicitudesIl } from '../../../models/ConfiguracionSolicitudesIl';
import type { DatosActualizarSolicitudIl } from '../../../models/SolicitudIl';
import type { EstadoSolicitudIl } from '../../../components/vistas/cor-conecta/concentrador/solicitudes-il/constantesSolicitudesIl';
import { ArchivoConNombreSanitizado } from '../../../utils/SanearNombreArchivoAdjunto';
import { ValidarArchivoAdjuntoSharePoint } from '../../../utils/ValidacionAdjuntosSharePoint';
import {
  EjecutarFlujoCambioEstadoSolicitudIl,
  ResolverTransicionEstadoSolicitudIl
} from './CambioEstadoSolicitudIlServicio';
import {
  ActualizarSolicitudIlEnSharePoint,
  AgregarAdjuntoSolicitudIl,
  EliminarAdjuntoSolicitudIl
} from './SolicitudesIlCrudServicio';

export type ProgresoGestionSolicitudIl = {
  mensaje: string;
};

export type ParametrosGuardarGestionSolicitudIl = {
  idSolicitud: number;
  idBitacoraActual?: number;
  estadoInicial: EstadoSolicitudIl;
  estadoNuevo: EstadoSolicitudIl;
  datos: DatosActualizarSolicitudIl;
  archivosNuevos: File[];
  nombresAdjuntosEliminar: string[];
};

export async function GuardarGestionSolicitudIlCompleta(
  context: WebPartContext,
  params: ParametrosGuardarGestionSolicitudIl,
  configBitacora: ConfiguracionBitacoraSolicitudesIl,
  onProgreso?: (progreso: ProgresoGestionSolicitudIl) => void
): Promise<void> {
  const informar = (mensaje: string): void => {
    onProgreso?.({ mensaje });
  };

  for (const archivo of params.archivosNuevos) {
    const errorArchivo = ValidarArchivoAdjuntoSharePoint(archivo);
    if (errorArchivo) {
      throw new Error(errorArchivo);
    }
  }

  informar('Actualizando la solicitud IL…');
  await ActualizarSolicitudIlEnSharePoint(context, params.idSolicitud, params.datos);

  if (params.nombresAdjuntosEliminar.length > 0) {
    informar('Eliminando adjuntos…');
    for (const nombre of params.nombresAdjuntosEliminar) {
      await EliminarAdjuntoSolicitudIl(context, params.idSolicitud, nombre);
    }
  }

  if (params.archivosNuevos.length > 0) {
    informar('Adjuntando archivos…');
    for (let indice = 0; indice < params.archivosNuevos.length; indice += 1) {
      const archivoSanitizado = ArchivoConNombreSanitizado(params.archivosNuevos[indice]);
      informar(`Adjuntando archivo ${indice + 1} de ${params.archivosNuevos.length}…`);
      await AgregarAdjuntoSolicitudIl(context, params.idSolicitud, archivoSanitizado);
    }
  }

  const transicion = ResolverTransicionEstadoSolicitudIl(params.estadoInicial, params.estadoNuevo);
  if (!transicion) {
    return;
  }

  if (!params.idBitacoraActual) {
    throw new Error(
      'La solicitud no tiene registro de bitácora actual (TAREAACTUAL). No se puede aplicar el cambio de estado.'
    );
  }

  informar('Registrando cambio de estado en bitácora…');
  await EjecutarFlujoCambioEstadoSolicitudIl(
    context,
    params.idSolicitud,
    params.idBitacoraActual,
    transicion,
    configBitacora
  );
}
