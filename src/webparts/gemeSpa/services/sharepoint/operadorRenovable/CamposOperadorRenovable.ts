/** Valores de elección en listas del operador renovable (nombres visibles en SharePoint). */

export const DisponibilidadSubequipoDisponible = 'Disponible';
export const DisponibilidadSubequipoIndisponible = 'Indisponible';

export const EstadoSubequipoActivo = 'Activo';

/** Choice en sitio `geme` (mayúscula inicial). */
export const MotivoIndisponibilidadFalla = 'Falla';
export const MotivoIndisponibilidadTrabajo = 'Trabajo';

/** Estado de solicitud en grilla (motor de flujos, mismo origen que Solicitudes IL). */
export const CampoLookupTareaActualConcentrador = 'TAREAACTUAL';
export const CampoEstadoTareaActualConcentrador = 'TAREAACTUAL_x003a_TAREAORIGEN_ES';

/** Filtro «En curso» en pestaña Solicitudes (maqueta oct-2026). */
export const EstadosEnCursoOperadorRenovable = ['Programada', 'Vigente', 'Extendida'] as const;

/**
 * Respuesta Sí/No a «¿Quedarán indisponibles algunos equipos?» en `CONC_LISTA_CONCENTRADOR`.
 * Mismo nombre en maqueta y sitio (desde 29-10-2026; revisado 03-11-2026). Booleano en producción.
 * Reemplaza el nombre histórico `TIENE_INVERSORES_INDISPONIBLES`.
 */
export const CampoTieneSubequiposIndisponibles = 'TIENE_SUBEQUIPOS_INDISPONIBLES';

export const CampoInstalacionGmConcentrador = 'INSTALACION_GM';
export const CampoLookupIndisponibilidadSolicitud = 'ID_SOLICITUD';
export const CampoLookupIndisponibilidadSubequipo = 'SUBEQUIPO';

/**
 * Internal names en `CONC_MANTENEDOR_SUBEQUIPOS` (ver docs/operador-renovable/listas-y-campos.md).
 * En sitio `geme`, `CAPACIDAD_MW` fue reemplazada por `CAPACIDAD_MAXIMA_MW`;
 * la capacidad operativa usa `CAPACIDAD_ACTUAL_MW` (no `CAPACIDAD_INDISPONIBLE_MW`).
 */
export const CampoSharePointCapacidadMaximaMw = 'CAPACIDAD_MAXIMA_MW';
/** MW con los que queda operando el subequipo (internal name en sitio `geme`). */
export const CampoSharePointCapacidadActualMw = 'CAPACIDAD_ACTUAL_MW';
export const CampoLookupTipoEquipoSubequipo = 'TIPOEQUIPO';

/** `CONC_LISTA_LIMITACIONESRED` */
export const CampoLookupLimitacionInstalacion = 'INSTALACION';
export const CampoPotenciaLimitadaMw = 'POTENCIA_LIMITADA_MW';
export const CampoFechaInicioLimitacion = 'FECHA_INICIO';
export const CampoFechaFinLimitacion = 'FECHA_FIN';
export const CampoEstadoLimitacionRed = 'ESTADO';
export const EstadoLimitacionRedActiva = 'Activa';
export const EstadoLimitacionRedFinalizada = 'Finalizada';

/** Lookups en `CONC_LISTA_LIMITACIONESRED` (mapeo-listas §4.5). */
export const CampoLookupLimitacionSolicitudConcentrador = 'ID_SOLICITUD';
export const CampoLookupLimitacionSolicitudFalla = 'FALLA';

export const NombreListaSolicitudFallaConcentrador = 'CONC_LISTA_SOLICITUDFALLA';
export const EstadoSolicitudFallaVigente = 'Vigente';

export const CampoEmpresaSolicitanteConcentrador = 'EMPRESA_SOLICITANTE';

/** `CONC_MANTENEDOR_INSTALACIONES`: ID de la central en Meteológica (lo lee la App Function). */
export const CampoFacilityIdMeteologica = 'FACILITY_ID_METEOLOGICA';

/** ACCION de `app.concentrador_bitacora_limitacion` (BD de la App Function). */
export const AccionBitacoraCrearLimitacion = 'Crear limitación';
export const AccionBitacoraModificarLimitacion = 'Modificar limitación';
export const AccionBitacoraFinalizarLimitacion = 'Finalizar';
