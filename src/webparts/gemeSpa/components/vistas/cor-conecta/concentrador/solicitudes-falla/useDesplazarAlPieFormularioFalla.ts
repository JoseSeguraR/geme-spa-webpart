import { useEffect, type RefObject } from 'react';

/** Desplaza el cuerpo scrollable del modal hasta el bloque de progreso al guardar o al agregar líneas. */
export function useDesplazarAlPieFormularioFalla(
  anclaRef: RefObject<HTMLDivElement>,
  opciones: {
    activo: boolean;
    mensajeActual?: string;
    cantidadHistorial: number;
    cantidadAlertas: number;
    esperandoCierreAutomatico: boolean;
  }
): void {
  const { activo, mensajeActual, cantidadHistorial, cantidadAlertas, esperandoCierreAutomatico } = opciones;

  useEffect(() => {
    if (!activo || !anclaRef.current) {
      return undefined;
    }
    const idMarco = window.requestAnimationFrame(() => {
      anclaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    return () => window.cancelAnimationFrame(idMarco);
  }, [activo, mensajeActual, cantidadHistorial, cantidadAlertas, esperandoCierreAutomatico, anclaRef]);
}