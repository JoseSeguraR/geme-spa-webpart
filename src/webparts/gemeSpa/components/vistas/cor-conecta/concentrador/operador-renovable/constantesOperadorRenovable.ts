/** Nombres de listas SharePoint del módulo Operador renovable (ya provisionadas en sitio). */
export const NombreListaSubequiposOperador = 'CONC_MANTENEDOR_SUBEQUIPOS';
export const NombreListaIndisponibilidades = 'CONC_LISTA_INDISPONIBILIDADES';
export const NombreListaLimitacionesRed = 'CONC_LISTA_LIMITACIONESRED';
export const NombreListaSolicitudFalla = 'CONC_LISTA_SOLICITUDFALLA';
/** Legacy (obsoleta 30-oct-2026); sustituida por {@link NombreListaBitacoraSubequipo}. */
export const NombreListaBitacoraOperador = 'CONC_LISTA_BITACORAOPERADOR';
export const NombreListaBitacoraSubequipo = 'CONC_LISTA_BITACORA_SUBEQUIPO';
export const NombreListaBitacoraSubestacion = 'CONC_LISTA_BITACORA_SUBESTACION';

export {
  NombreListaBitacoraEngine,
  NombreListaCentrales,
  NombreListaConcentrador,
  NombreListaUsuariosInstalaciones,
  TipoRegistroBitacoraConcentrador
} from '../../../../../services/sharepoint/concentradorComun/NombresListasConcentrador';

/** Estado visible en grilla P1: motor de flujos (mismo criterio que Solicitudes IL). */
export {
  CampoEstadoTareaActualConcentrador,
  CampoLookupTareaActualConcentrador
} from '../../../../../services/sharepoint/operadorRenovable/CamposOperadorRenovable';

export type FiltroEstadoSolicitudesOperadorRenovable = 'enCurso' | 'todosEstados';

export type FiltroDisponibilidadSolicitudesOperador = 'todas' | 'alerta' | 'ok';

export type FiltroCatalogoEquiposOperador = 'disponible' | 'indisponible' | 'todos';

export type FiltroEstadoLimitacionSubestacion = 'activas' | 'todas';

export type DisponibilidadSubequipoOperador = 'Disponible' | 'Indisponible';

export type EstadoLimitacionSubestacion = 'Activa' | 'Finalizada';
