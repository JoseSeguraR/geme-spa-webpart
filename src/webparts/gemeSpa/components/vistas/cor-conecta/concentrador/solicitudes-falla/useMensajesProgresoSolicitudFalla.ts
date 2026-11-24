import { useCallback, useRef, useState } from 'react';

function AgregarLineaHistorialSinDuplicar(historial: string[], linea: string): string[] {
  const texto = linea.trim();
  if (!texto) {
    return historial;
  }
  if (historial.length > 0 && historial[historial.length - 1] === texto) {
    return historial;
  }
  return [...historial, texto];
}

export function useMensajesProgresoSolicitudFalla(): {
  mensajeActual: string | undefined;
  historial: string[];
  informar: (mensaje: string) => void;
  cerrarProgreso: () => void;
  reiniciar: () => void;
} {
  const [mensajeActual, setMensajeActual] = useState<string | undefined>();
  const [historial, setHistorial] = useState<string[]>([]);
  const mensajeEnCursoRef = useRef<string | undefined>();

  const informar = useCallback((mensaje: string): void => {
    const anterior = mensajeEnCursoRef.current;
    if (anterior && anterior !== mensaje) {
      setHistorial((h) => AgregarLineaHistorialSinDuplicar(h, anterior));
    }
    mensajeEnCursoRef.current = mensaje;
    setMensajeActual(mensaje);
  }, []);

  const cerrarProgreso = useCallback((): void => {
    const anterior = mensajeEnCursoRef.current;
    if (anterior) {
      setHistorial((h) => AgregarLineaHistorialSinDuplicar(h, anterior));
    }
    mensajeEnCursoRef.current = undefined;
    setMensajeActual(undefined);
  }, []);

  const reiniciar = useCallback((): void => {
    mensajeEnCursoRef.current = undefined;
    setMensajeActual(undefined);
    setHistorial([]);
  }, []);

  return { mensajeActual, historial, informar, cerrarProgreso, reiniciar };
}