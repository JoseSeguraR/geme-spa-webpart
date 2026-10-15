export const NombreListaSolicitudesIl = 'CONC_LISTA_SOLICITUDES_IL';
export const NombreListaBitacoraEngine = 'ENGINE_BITACORA';
/** Lookup a bitácora; el estado visible proviene de TAREAORIGEN_ESTADO (columna adicional). */
export const CampoLookupTareaActualIl = 'TAREAACTUAL';
/**
 * Columna adicional «TAREAACTUAL:TAREAORIGEN_ESTADO» (campo TAREAORIGEN_ESTADO en bitácora).
 * SharePoint trunca el interno a …TAREAORIGEN_ES (ver FilterField en RenderListData de la vista nativa).
 */
export const CampoEstadoTareaActualIl = 'TAREAACTUAL_x003a_TAREAORIGEN_ES';
export const TipoRegistroBitacoraSolicitudIl = 'SOLICITUDES_IL';
export const ClasificacionTareaBitacoraFlujo = 'FLUJO';
export const EsTareaPendienteBitacoraNo = '0';
/** Columna adicional «TAREAORIGEN:TAREA» en ENGINE_BITACORA. */
export const CampoTareaOrigenBitacoraIl = 'TAREAORIGEN_x003a_TAREA';
/** Columna adicional «TAREADESTINO:ESTADO» en ENGINE_BITACORA. */
export const CampoEstadoDestinoBitacoraIl = 'TAREADESTINO_x003a_ESTADO';
/** Columna adicional «ACCIONAVANCE:ACCION» en ENGINE_BITACORA. */
export const CampoAccionAvanceBitacoraIl = 'ACCIONAVANCE_x003a_ACCION';
/** Mantenedor de instalaciones; en UI se presenta como «Central». */
export const NombreListaCentrales = 'CONC_MANTENEDOR_INSTALACIONES';
export const ModuloFiltroInstalacionConcentrador = 'Concentrador';

/** URL de ejemplo del Excel vinculado; reemplazar por la biblioteca real del sitio. */
export const UrlExcelVinculadoSolicitudesIl =
  'https://www.microsoft.com/es-es/download/details.aspx?id=5197';

export type EstadoSolicitudIl = 'Vigente' | 'Finalizada' | 'Anulada';

export function ResolverEstadoSolicitudIl(valor: string | undefined): EstadoSolicitudIl {
  if (valor === 'Finalizada' || valor === 'Anulada') {
    return valor;
  }
  return 'Vigente';
}

export const EstadosSolicitudIlRadio: readonly EstadoSolicitudIl[] = ['Vigente', 'Finalizada', 'Anulada'];

export const SubtitulosPorEstadoSolicitudIl: Record<EstadoSolicitudIl, string> = {
  Vigente: 'Muestra todas las Solicitudes IL Vigentes.',
  Finalizada: 'Muestra todas las Solicitudes IL Finalizadas.',
  Anulada: 'Muestra todas las Solicitudes IL Anuladas.'
};

export const TamanoMaximoAdjuntoBytes = 10 * 1024 * 1024;
