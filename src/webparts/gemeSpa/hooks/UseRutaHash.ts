import { useCallback, useEffect, useState } from 'react';
import {
  AsegurarHashInicial,
  EstablecerRutaHash,
  ObtenerRutaDesdeHash
} from '../utils/NavegacionHash';

export type UseRutaHashResultado = {
  rutaActual: string;
  Navegar: (ruta: string) => void;
};

export function UseRutaHash(): UseRutaHashResultado {
  const [rutaActual, setRutaActual] = useState<string>(() => ObtenerRutaDesdeHash());

  useEffect(() => {
    AsegurarHashInicial();
    setRutaActual(ObtenerRutaDesdeHash());

    const ActualizarRuta = (): void => {
      setRutaActual(ObtenerRutaDesdeHash());
    };

    window.addEventListener('hashchange', ActualizarRuta);
    return () => window.removeEventListener('hashchange', ActualizarRuta);
  }, []);

  const Navegar = useCallback((ruta: string): void => {
    EstablecerRutaHash(ruta);
    setRutaActual(ObtenerRutaDesdeHash());
  }, []);

  return { rutaActual, Navegar };
}
