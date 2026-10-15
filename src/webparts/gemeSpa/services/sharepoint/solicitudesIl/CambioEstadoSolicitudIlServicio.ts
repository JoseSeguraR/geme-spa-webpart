import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { ConfiguracionBitacoraSolicitudesIl } from '../../../models/ConfiguracionSolicitudesIl';
import type { EstadoSolicitudIl } from '../../../components/vistas/cor-conecta/concentrador/administrador/constantesSolicitudesIl';
import { CerrarRegistroBitacoraEngine, CrearRegistroBitacoraEngine } from './BitacoraEngineServicio';
import { ActualizarTareaActualSolicitudIl } from './SolicitudesIlCrudServicio';

export type TransicionEstadoSolicitudIl =
  | 'vigente-a-finalizada'
  | 'vigente-a-anulada'
  | 'finalizada-a-vigente'
  | 'anulada-a-vigente';

function ObtenerFechaHoraActualIsoUtc(): string {
  return new Date().toISOString();
}

function ObtenerIdUsuarioActual(context: WebPartContext): number {
  const id = context.pageContext.legacyPageContext.userId;
  if (!id || id <= 0) {
    throw new Error('No se pudo determinar el usuario actual para la bitácora.');
  }
  return id;
}

export function ResolverTransicionEstadoSolicitudIl(
  estadoInicial: EstadoSolicitudIl,
  estadoNuevo: EstadoSolicitudIl
): TransicionEstadoSolicitudIl | undefined {
  if (estadoInicial === estadoNuevo) {
    return undefined;
  }
  if (estadoInicial === 'Vigente' && estadoNuevo === 'Finalizada') {
    return 'vigente-a-finalizada';
  }
  if (estadoInicial === 'Vigente' && estadoNuevo === 'Anulada') {
    return 'vigente-a-anulada';
  }
  if (estadoInicial === 'Finalizada' && estadoNuevo === 'Vigente') {
    return 'finalizada-a-vigente';
  }
  if (estadoInicial === 'Anulada' && estadoNuevo === 'Vigente') {
    return 'anulada-a-vigente';
  }
  return undefined;
}

type ParametrosNuevoRegistroBitacora = {
  tareaOrigenId: number;
  tareaOrigenEstado: EstadoSolicitudIl;
};

function ObtenerParametrosTransicion(
  transicion: TransicionEstadoSolicitudIl,
  config: ConfiguracionBitacoraSolicitudesIl
): {
  accionAvanceId: number;
  tareaDestinoId: number;
  nuevoRegistro: ParametrosNuevoRegistroBitacora;
} {
  switch (transicion) {
    case 'vigente-a-finalizada':
      return {
        accionAvanceId: config.idAccionFinalizar,
        tareaDestinoId: config.idTareaFinalizar,
        nuevoRegistro: {
          tareaOrigenId: config.idTareaFinalizar,
          tareaOrigenEstado: 'Finalizada'
        }
      };
    case 'vigente-a-anulada':
      return {
        accionAvanceId: config.idAccionAnular,
        tareaDestinoId: config.idTareaAnular,
        nuevoRegistro: {
          tareaOrigenId: config.idTareaAnular,
          tareaOrigenEstado: 'Anulada'
        }
      };
    case 'finalizada-a-vigente':
    case 'anulada-a-vigente':
      return {
        accionAvanceId: config.idAccionReactivar,
        tareaDestinoId: config.idTareaReactivar,
        nuevoRegistro: {
          tareaOrigenId: config.idTareaReactivar,
          tareaOrigenEstado: 'Vigente'
        }
      };
    default: {
      const exhaustivo: never = transicion;
      throw new Error(`Transición no soportada: ${String(exhaustivo)}`);
    }
  }
}

export async function EjecutarFlujoCambioEstadoSolicitudIl(
  context: WebPartContext,
  idSolicitud: number,
  idBitacoraActual: number,
  transicion: TransicionEstadoSolicitudIl,
  config: ConfiguracionBitacoraSolicitudesIl
): Promise<void> {
  const ahoraIso = ObtenerFechaHoraActualIsoUtc();
  const idUsuario = ObtenerIdUsuarioActual(context);
  const parametros = ObtenerParametrosTransicion(transicion, config);

  await CerrarRegistroBitacoraEngine(context, {
    idRegistroBitacora: idBitacoraActual,
    fechaSalidaIso: ahoraIso,
    accionAvanceId: parametros.accionAvanceId,
    usuarioAvanceId: idUsuario,
    tareaDestinoId: parametros.tareaDestinoId
  });

  const idNuevaBitacora = await CrearRegistroBitacoraEngine(context, {
    idRegistroSolicitud: idSolicitud,
    tareaOrigenId: parametros.nuevoRegistro.tareaOrigenId,
    tareaOrigenEstado: parametros.nuevoRegistro.tareaOrigenEstado,
    fechaIngresoIso: ahoraIso
  });

  await ActualizarTareaActualSolicitudIl(context, idSolicitud, idNuevaBitacora);
}
