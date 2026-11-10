/** Nombres de listas SharePoint del módulo Operador renovable (ya provisionadas en sitio). */
export const NombreListaSubequiposOperador = 'CONC_MANTENEDOR_SUBEQUIPOS';
export const NombreListaIndisponibilidades = 'CONC_LISTA_INDISPONIBILIDADES';
export const NombreListaLimitacionesRed = 'CONC_LISTA_LIMITACIONESRED';
export const NombreListaSolicitudFalla = 'CONC_LISTA_SOLICITUDFALLA';
// Las bitácoras de subequipos y limitaciones están en la BD de la App Function (10-11-2026), no en listas.

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

export type DisponibilidadSubequipoOperador = 'Disponible' | 'Indisponible';

export type EstadoLimitacionSubestacion = 'Activa' | 'Finalizada';
