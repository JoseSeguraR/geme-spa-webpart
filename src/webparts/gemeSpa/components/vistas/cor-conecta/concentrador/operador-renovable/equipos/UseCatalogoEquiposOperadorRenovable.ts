import { useCallback, useEffect, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { EquipoOperadorTarjeta } from '../../../../../../models/operadorRenovable/CatalogoEquiposOperador';
import { ObtenerTarjetasEquiposOperadorRenovable } from '../../../../../../services/sharepoint/operadorRenovable/SubequiposServicio';
import { SharePointRestError } from '../../../../../../services/sharepoint/SharePointRestError';

export type EstadoCatalogoEquiposOperador = 'idle' | 'cargando' | 'listo' | 'error';

export function UseCatalogoEquiposOperadorRenovable(
  context: WebPartContext,
  tokenRecarga: number,
  incluirEquiposInactivos: boolean
): {
  estado: EstadoCatalogoEquiposOperador;
  tarjetas: EquipoOperadorTarjeta[];
  error?: string;
  recargar: () => void;
} {
  const [estado, setEstado] = useState<EstadoCatalogoEquiposOperador>('idle');
  const [tarjetas, setTarjetas] = useState<EquipoOperadorTarjeta[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [tokenInterno, setTokenInterno] = useState(0);

  const recargar = useCallback(() => {
    setTokenInterno((valor) => valor + 1);
  }, []);

  useEffect(() => {
    let cancelado = false;
    setEstado('cargando');
    setError(undefined);

    ObtenerTarjetasEquiposOperadorRenovable(context, { incluirEquiposInactivos })
      .then((resultado) => {
        if (!cancelado) {
          setTarjetas(resultado);
          setEstado('listo');
        }
      })
      .catch((err) => {
        if (!cancelado) {
          const mensaje =
            err instanceof SharePointRestError
              ? err.message
              : 'No se pudo cargar el catálogo de equipos renovables.';
          setError(mensaje);
          setTarjetas([]);
          setEstado('error');
        }
      })
      .catch(() => undefined);

    return () => {
      cancelado = true;
    };
  }, [context, tokenRecarga, tokenInterno, incluirEquiposInactivos]);

  return { estado, tarjetas, error, recargar };
}
