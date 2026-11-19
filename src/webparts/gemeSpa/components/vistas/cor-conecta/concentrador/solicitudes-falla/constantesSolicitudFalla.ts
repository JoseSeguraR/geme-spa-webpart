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