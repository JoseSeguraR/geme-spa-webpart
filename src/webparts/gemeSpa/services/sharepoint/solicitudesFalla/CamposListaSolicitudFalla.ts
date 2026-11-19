/**
 * Nombres internos de `CONC_LISTA_SOLICITUDFALLA` (definición en el sitio GEME).
 * Fuente de verdad para REST, CAML y normalización de RenderListData.
 */

export const CampoTituloSolicitudFalla = 'Title';

export const CampoIdCenSolicitudFalla = 'ID_CEN';

export const CampoFechaPerturbacionSolicitudFalla = 'FECHAPERTURBACION';

export const CampoFechaRetornoSolicitudFalla = 'FECHAEFECTIVARETORNO';

export const CampoLookupInstalacionGmSolicitudFalla = 'INSTALACION_GM';

/** Columna mostrada del lookup a `CONC_MANTENEDOR_INSTALACIONES`. */
export const CampoLookupInstalacionGmTexto = 'INSTALACION';

export const CampoLookupEquiposSolicitudFalla = 'EQUIPOS';

/** Columna mostrada del lookup a `CONC_MANTENEDOR_EQUIPOS`. */
export const CampoLookupEquiposTexto = 'EQUIPO';

export const CampoPotenciaSolicitudFalla = 'POTENCIA';

export const CampoMedidaSolicitudFalla = 'MEDIDA';

export const CampoDescripcionSolicitudFalla = 'DESCRIPCION';

/** Texto de una línea: identificador o referencia del registro en `ENGINE_BITACORA`. */
export const CampoIdBitacoraSolicitudFalla = 'ID_BITACORA';

export const CampoEstadoSolicitudFalla = 'ESTADO';

export function IdLookupInstalacionGmSolicitudFalla(): string {
  return `${CampoLookupInstalacionGmSolicitudFalla}Id`;
}

export function IdLookupEquiposSolicitudFalla(): string {
  return `${CampoLookupEquiposSolicitudFalla}Id`;
}

/** Campos de la lista usados en vistas y consultas de grilla. */
export const CamposConsultaGrillaSolicitudFalla: readonly string[] = [
  'ID',
  CampoIdCenSolicitudFalla,
  CampoLookupInstalacionGmSolicitudFalla,
  CampoLookupEquiposSolicitudFalla,
  CampoFechaPerturbacionSolicitudFalla,
  CampoFechaRetornoSolicitudFalla,
  CampoDescripcionSolicitudFalla,
  CampoPotenciaSolicitudFalla,
  CampoMedidaSolicitudFalla,
  CampoEstadoSolicitudFalla,
  CampoIdBitacoraSolicitudFalla
];