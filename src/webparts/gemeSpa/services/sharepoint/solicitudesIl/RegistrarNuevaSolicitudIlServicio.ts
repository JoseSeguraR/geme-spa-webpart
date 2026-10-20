import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { ConfiguracionBitacoraSolicitudesIl } from '../../../models/ConfiguracionSolicitudesIl';
import type { DatosNuevaSolicitudIl } from '../../../models/SolicitudIl';
import type { EstadoSolicitudIl } from '../../../components/vistas/cor-conecta/concentrador/solicitudes-il/constantesSolicitudesIl';
import { ArchivoConNombreSanitizado } from '../../../utils/SanearNombreArchivoAdjunto';
import { ValidarArchivoAdjuntoSharePoint } from '../../../utils/ValidacionAdjuntosSharePoint';
import { CrearRegistroBitacoraEngine } from './BitacoraEngineServicio';
import { IdCenDuplicadoSolicitudIlError } from './IdCenDuplicadoSolicitudIlError';
import {
  InsertarSolicitudFinalizadaEnSiod,
  InsertarSolicitudVigenteEnSiod
} from './SiodSolicitudIlApiServicio';
import {
  ActualizarTareaActualSolicitudIl,
  AgregarAdjuntoSolicitudIl,
  CrearSolicitudIlEnSharePoint,
  ExisteSolicitudIlConIdCen
} from './SolicitudesIlCrudServicio';

export type OpcionesRegistroSiodSolicitudIl = {
  urlInsertSiod: string;
  idCentral: number;
};

export type ProgresoRegistroSolicitudIl = {
  mensaje: string;
};

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

async function CrearBitacorasSegunEstado(
  context: WebPartContext,
  idSolicitud: number,
  estado: EstadoSolicitudIl,
  config: ConfiguracionBitacoraSolicitudesIl
): Promise<number> {
  const ahoraIso = ObtenerFechaHoraActualIsoUtc();
  const idUsuario = ObtenerIdUsuarioActual(context);

  if (estado === 'Finalizada') {
    await CrearRegistroBitacoraEngine(context, {
      idRegistroSolicitud: idSolicitud,
      tareaOrigenId: config.idTareaCrear,
      tareaOrigenEstado: 'Vigente',
      fechaIngresoIso: ahoraIso,
      fechaSalidaIso: ahoraIso,
      accionAvanceId: config.idAccionFinalizar,
      usuarioAvanceId: idUsuario,
      tareaDestinoId: config.idTareaFinalizar
    });

    const idBitacoraActual = await CrearRegistroBitacoraEngine(context, {
      idRegistroSolicitud: idSolicitud,
      tareaOrigenId: config.idTareaFinalizar,
      tareaOrigenEstado: 'Finalizada',
      fechaIngresoIso: ahoraIso
    });

    return idBitacoraActual;
  }

  return CrearRegistroBitacoraEngine(context, {
    idRegistroSolicitud: idSolicitud,
    tareaOrigenId: config.idTareaCrear,
    tareaOrigenEstado: 'Vigente',
    fechaIngresoIso: ahoraIso
  });
}

export async function RegistrarNuevaSolicitudIlCompleta(
  context: WebPartContext,
  datos: DatosNuevaSolicitudIl,
  archivos: File[],
  configBitacora: ConfiguracionBitacoraSolicitudesIl,
  opcionesSiod: OpcionesRegistroSiodSolicitudIl,
  onProgreso?: (progreso: ProgresoRegistroSolicitudIl) => void
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
  if (await ExisteSolicitudIlConIdCen(context, datos.idCen)) {
    throw new IdCenDuplicadoSolicitudIlError();
  }

  informar('Guardando la solicitud IL…');
  const idSolicitud = await CrearSolicitudIlEnSharePoint(context, datos);

  if (archivos.length > 0) {
    informar('Adjuntando archivos…');
    for (let indice = 0; indice < archivos.length; indice += 1) {
      const archivoSanitizado = ArchivoConNombreSanitizado(archivos[indice]);
      informar(`Adjuntando archivo ${indice + 1} de ${archivos.length}…`);
      await AgregarAdjuntoSolicitudIl(context, idSolicitud, archivoSanitizado);
    }
  }

  informar('Registrando bitácora…');
  const idBitacoraActual = await CrearBitacorasSegunEstado(
    context,
    idSolicitud,
    datos.estadoFlujo,
    configBitacora
  );

  informar('Actualizando tarea actual de la solicitud…');
  await ActualizarTareaActualSolicitudIl(context, idSolicitud, idBitacoraActual);

  informar('Enviando orden a SIOD…');
  try {
    const cuerpoBase = {
      idsolicitud: datos.idCen.trim(),
      idCentral: opcionesSiod.idCentral,
      descripcion: datos.descripcion.trim(),
      fechainicio: datos.fechaInicioIso
    };

    if (datos.estadoFlujo === 'Finalizada' && datos.fechaFinIso) {
      await InsertarSolicitudFinalizadaEnSiod(opcionesSiod.urlInsertSiod, {
        ...cuerpoBase,
        fechaFin: datos.fechaFinIso
      });
    } else {
      await InsertarSolicitudVigenteEnSiod(opcionesSiod.urlInsertSiod, cuerpoBase);
    }
  } catch {
    // Fire-and-forget: no afecta el resultado del alta en SharePoint.
  }

  return idSolicitud;
}
