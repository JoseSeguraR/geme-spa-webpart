import type { AlertaResultadoSiodFalla } from './PieProgresoFormularioSolicitudFalla';

export type AccionesUiProgresoModalFalla = {
  cancelarCierre: () => void;
  reiniciar: () => void;
  setAlertasSiod: (alertas: AlertaResultadoSiodFalla[]) => void;
  setEsperandoCierreAutomatico: (valor: boolean) => void;
  setCierreAutomaticoConError: (valor: boolean) => void;
  setGuardando?: (valor: boolean) => void;
};

/** Limpia historial, alertas SIOD y temporizador de cierre (al abrir o al cerrar el modal). */
export function ReiniciarUiProgresoModalFalla(acciones: AccionesUiProgresoModalFalla): void {
  acciones.cancelarCierre();
  acciones.setAlertasSiod([]);
  acciones.setEsperandoCierreAutomatico(false);
  acciones.setCierreAutomaticoConError(false);
  acciones.setGuardando?.(false);
  acciones.reiniciar();
}