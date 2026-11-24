/** Pausa tras éxito (SharePoint y SIOD ok) antes de cerrar el modal. */
export const EsperaCierreModalFallaExitoMs = 2800;

/** Pausa si hubo fallo SIOD u otro aviso de error tras guardar. */
export const EsperaCierreModalFallaConErrorMs = 6000;

export function ObtenerEsperaCierreModalFalla(huboError: boolean): number {
  return huboError ? EsperaCierreModalFallaConErrorMs : EsperaCierreModalFallaExitoMs;
}

export function ProgramarCierreModalFalla(onCerrar: () => void, huboError: boolean): number {
  return window.setTimeout(onCerrar, ObtenerEsperaCierreModalFalla(huboError));
}