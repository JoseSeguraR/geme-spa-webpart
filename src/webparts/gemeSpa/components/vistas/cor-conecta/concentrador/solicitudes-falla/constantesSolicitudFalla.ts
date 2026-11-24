export {
  ModuloFiltroInstalacionConcentrador,
  NombreListaBitacoraEngine,
  NombreListaCentrales,
  NombreListaUsuariosInstalaciones
} from '../../../../../services/sharepoint/concentradorComun/NombresListasConcentrador';

export {
  ClasificacionTareaBitacoraFlujo,
  EsTareaPendienteBitacoraNo
} from '../solicitudes-il/constantesSolicitudesIl';

export const ClasificacionTareaBitacoraCierre = 'CIERRE';

export const TextoResponsableComentariosBitacoraEdicionSolicitudFalla = 'Edición de la Solicitud';

export const NombreListaSolicitudFalla = 'CONC_LISTA_SOLICITUDFALLA';

export {
  CampoDescripcionSolicitudFalla,
  CampoEstadoSolicitudFalla,
  CampoFechaPerturbacionSolicitudFalla,
  CampoFechaRetornoSolicitudFalla,
  CampoIdBitacoraSolicitudFalla as CampoIdBitacoraFalla,
  CampoIdCenSolicitudFalla,
  CampoLookupEquiposSolicitudFalla as CampoEquiposFalla,
  CampoLookupInstalacionGmSolicitudFalla as CampoLookupInstalacionGmFalla,
  CampoMedidaSolicitudFalla,
  CampoPotenciaSolicitudFalla,
  CampoTituloSolicitudFalla,
  CamposConsultaGrillaSolicitudFalla,
  CampoLookupEquiposTexto,
  CampoLookupInstalacionGmTexto,
  IdLookupEquiposSolicitudFalla,
  IdLookupInstalacionGmSolicitudFalla
} from '../../../../../services/sharepoint/solicitudesFalla/CamposListaSolicitudFalla';

/** Valor `TIPO_REGISTRO` en `ENGINE_BITACORA` para solicitudes de falla del concentrador. */
export const TipoRegistroBitacoraSolicitudFalla = 'CONCENTRADOR-SOLICITUDFALLA';

export const ActorTareaOrigenBitacoraSolicitudFalla = 'CONCENTRADOR - SOLICITUD DE FALLA';

export const CampoBitacoraResponsableMultipleId = 'TAREAORIGEN_RESPONSABLE_MULTIPLEId';

export function ConstruirTareaIdentificadorSolicitudFalla(idSolicitud: number): string {
  return `SOLICITUDFALLA-${idSolicitud}`;
}

export const EstadoSolicitudFallaVigente = 'Vigente';
export const EstadoSolicitudFallaFinalizada = 'Finalizada';

export const TextoLeyendaFormularioSolicitudFalla =
  'El estado de la solicitud se calcula al guardar según la Fecha y Hora Efectiva de Retorno: si la indica, ' +
  'la solicitud queda Finalizada; si la deja vacía, queda Vigente. El campo Estado del formulario solo refleja ' +
  'ese criterio y no se edita directamente. Puede adjuntar varios archivos (PDF, ZIP, CFG, DAT) en una o más ' +
  'selecciones del control de archivos.';

/** Valor del campo de fecha/hora local (`CampoFechaHora24`) o ISO en guardado. */
export function ResolverEstadoSolicitudFallaDesdeFechaRetorno(fechaRetorno?: string): typeof EstadoSolicitudFallaVigente | typeof EstadoSolicitudFallaFinalizada {
  return fechaRetorno?.trim() ? EstadoSolicitudFallaFinalizada : EstadoSolicitudFallaVigente;
}

import type { EstadoFiltroSolicitudFalla, MedidaPotenciaFalla } from '../../../../../models/SolicitudFalla';

export type { MedidaPotenciaFalla, EstadoFiltroSolicitudFalla };

export const EstadosFiltroSolicitudFallaRadio: readonly EstadoFiltroSolicitudFalla[] = [
  'Vigente',
  'Finalizada',
  'Todas'
];

export const SubtitulosPorEstadoFiltroSolicitudFalla: Record<EstadoFiltroSolicitudFalla, string> = {
  Vigente: 'Muestra las solicitudes de falla vigentes.',
  Finalizada: 'Muestra las solicitudes de falla finalizadas.',
  Todas: 'Muestra todas las solicitudes de falla.'
};

export const TamanoMaximoAdjuntoBytesFalla = 10 * 1024 * 1024;

export const TamanoLoteCargaCompletaSolicitudFalla = 500;

export const ResultadoIntegracionSiodExitosa = 'Exitosa';
export const ResultadoIntegracionSiodFallida = 'Fallida';

export const TextoResponsableComentariosBitacoraIntegracionSiodExitosa =
  'Integración SIOD exitosa.';
export const TextoResponsableComentariosBitacoraIntegracionSiodFallida =
  'Integración SIOD fallida.';