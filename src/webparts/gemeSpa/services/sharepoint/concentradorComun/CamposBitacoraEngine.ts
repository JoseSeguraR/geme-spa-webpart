/** Columnas adicionales proyectadas en RenderListData de ENGINE_BITACORA. */

export const CampoTareaOrigenBitacoraEngine = 'TAREAORIGEN_x003a_TAREA';
export const CampoEstadoDestinoBitacoraEngine = 'TAREADESTINO_x003a_ESTADO';
export const CampoAccionAvanceBitacoraEngine = 'ACCIONAVANCE_x003a_ACCION';

export const CamposViewBitacoraEngine = [
  'ID',
  'TAREA_IDENTIFICADOR',
  'TAREAORIGEN_FECHAINGRESO',
  'TAREAORIGEN_ESTADO',
  'TAREAORIGEN_RESPONSABLE_MULTIPLE',
  'TAREAORIGEN_FECHASALIDA',
  'TAREAORIGEN',
  CampoTareaOrigenBitacoraEngine,
  'ACCIONAVANCE',
  CampoAccionAvanceBitacoraEngine,
  'USUARIOAVANCE',
  'RESPONSABLE_COMENTARIOS',
  'TAREADESTINO',
  CampoEstadoDestinoBitacoraEngine
] as const;
