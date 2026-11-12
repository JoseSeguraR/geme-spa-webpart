/** Identificadores de tareas y acciones del flujo IL (ítems lookup en listas del motor). */
export type ConfiguracionBitacoraSolicitudesIl = {
  idTareaCrear: number;
  idTareaFinalizar: number;
  idTareaAnular: number;
  idTareaReactivar: number;
  idAccionFinalizar: number;
  idAccionAnular: number;
  idAccionReactivar: number;
};

export type ConfiguracionModuloSolicitudesIl = {
  bitacora: ConfiguracionBitacoraSolicitudesIl;
};

export type PropiedadesWebPartSolicitudesIl = {
  concSolicitudesIlIdTareaCrear?: string;
  concSolicitudesIlIdTareaFinalizar?: string;
  concSolicitudesIlIdTareaAnular?: string;
  concSolicitudesIlIdTareaReactivar?: string;
  concSolicitudesIlIdAccionFinalizar?: string;
  concSolicitudesIlIdAccionAnular?: string;
  concSolicitudesIlIdAccionReactivar?: string;
  /** Enlace al Excel vinculado de Solicitudes IL (descarga / apertura en Office). */
  concSolicitudesIlUrlExcelVinculado?: string;
  concSolicitudesIlUrlInsertSIOD?: string;
  concSolicitudesIlUrlDeleteSIOD?: string;
  concSolicitudesIlUrlUpdateSIOD?: string;
  /** POST /api/ai/summarize-text de la App Function con ?code=<function key> (resumen de la descripción larga). */
  concSolicitudesIlUrlResumenIa?: string;
};

export function ObtenerUrlExcelVinculadoSolicitudesIlDesdeProps(
  props: PropiedadesWebPartSolicitudesIl
): string | undefined {
  const url = props.concSolicitudesIlUrlExcelVinculado?.trim() ?? '';
  return url.length > 0 ? url : undefined;
}

export function ObtenerUrlInsertSiodSolicitudesIlDesdeProps(
  props: PropiedadesWebPartSolicitudesIl
): string | undefined {
  const url = props.concSolicitudesIlUrlInsertSIOD?.trim() ?? '';
  return url.length > 0 ? url : undefined;
}

export function ObtenerUrlUpdateSiodSolicitudesIlDesdeProps(
  props: PropiedadesWebPartSolicitudesIl
): string | undefined {
  const url = props.concSolicitudesIlUrlUpdateSIOD?.trim() ?? '';
  return url.length > 0 ? url : undefined;
}

export function ObtenerUrlDeleteSiodSolicitudesIlDesdeProps(
  props: PropiedadesWebPartSolicitudesIl
): string | undefined {
  const url = props.concSolicitudesIlUrlDeleteSIOD?.trim() ?? '';
  return url.length > 0 ? url : undefined;
}

export function ObtenerUrlResumenIaSolicitudesIlDesdeProps(
  props: PropiedadesWebPartSolicitudesIl
): string | undefined {
  const url = props.concSolicitudesIlUrlResumenIa?.trim() ?? '';
  return url.length > 0 ? url : undefined;
}

function ParsearIdNumerico(valor: string | undefined, nombreCampo: string): number {
  const texto = valor?.trim() ?? '';
  if (!texto) {
    throw new Error(`Configure la propiedad de Web Part «${nombreCampo}».`);
  }
  const numero = Number(texto);
  if (!Number.isFinite(numero) || numero <= 0) {
    throw new Error(`La propiedad «${nombreCampo}» debe ser un número entero mayor que cero.`);
  }
  return Math.trunc(numero);
}

export function ConstruirConfiguracionSolicitudesIlDesdeProps(
  props: PropiedadesWebPartSolicitudesIl
): ConfiguracionModuloSolicitudesIl {
  return {
    bitacora: {
      idTareaCrear: ParsearIdNumerico(props.concSolicitudesIlIdTareaCrear, 'ID Tarea Crear'),
      idTareaFinalizar: ParsearIdNumerico(props.concSolicitudesIlIdTareaFinalizar, 'ID Tarea Finalizar'),
      idTareaAnular: ParsearIdNumerico(props.concSolicitudesIlIdTareaAnular, 'ID Tarea Anular'),
      idTareaReactivar: ParsearIdNumerico(props.concSolicitudesIlIdTareaReactivar, 'ID Tarea Reactivar'),
      idAccionFinalizar: ParsearIdNumerico(props.concSolicitudesIlIdAccionFinalizar, 'ID Acción Finalizar'),
      idAccionAnular: ParsearIdNumerico(props.concSolicitudesIlIdAccionAnular, 'ID Acción Anular'),
      idAccionReactivar: ParsearIdNumerico(props.concSolicitudesIlIdAccionReactivar, 'ID Acción Reactivar')
    }
  };
}
