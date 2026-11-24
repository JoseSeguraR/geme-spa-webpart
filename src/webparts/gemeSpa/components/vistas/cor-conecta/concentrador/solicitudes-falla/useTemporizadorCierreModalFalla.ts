import { useCallback, useEffect, useRef } from 'react';
import { ProgramarCierreModalFalla } from './temporizadorCierreModalFalla';

export function useTemporizadorCierreModalFalla(): {
  programarCierre: (onCerrar: () => void, huboError: boolean) => void;
  cancelarCierre: () => void;
} {
  const idTemporizadorRef = useRef<number | undefined>();

  const cancelarCierre = useCallback((): void => {
    if (idTemporizadorRef.current !== undefined) {
      window.clearTimeout(idTemporizadorRef.current);
      idTemporizadorRef.current = undefined;
    }
  }, []);

  const programarCierre = useCallback((onCerrar: () => void, huboError: boolean): void => {
    cancelarCierre();
    idTemporizadorRef.current = ProgramarCierreModalFalla(() => {
      idTemporizadorRef.current = undefined;
      onCerrar();
    }, huboError);
  }, [cancelarCierre]);

  useEffect(() => () => cancelarCierre(), [cancelarCierre]);

  return { programarCierre, cancelarCierre };
}