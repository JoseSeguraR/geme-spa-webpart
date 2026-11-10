import { useCallback, useEffect, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { EquipoOperadorTarjeta } from '../../../../../../models/operadorRenovable/CatalogoEquiposOperador';
import { ObtenerTarjetasEquiposOperadorRenovable } from '../../../../../../services/sharepoint/operadorRenovable/SubequiposServicio';
import {
  AplicarPeriodosATarjetas,
  EstadosDesactualizados
} from '../../../../../../services/sharepoint/operadorRenovable/AplicarPeriodosSubequipos';
import { AplicarEstadoSubequiposSharePoint } from '../../../../../../services/sharepoint/operadorRenovable/ActualizarDisponibilidadSubequipoServicio';
import {
  HayServicioPeriodos,
  ObtenerPeriodosAbiertos,
  type PeriodoIndisponibilidad
} from '../../../../../../services/sharepoint/operadorRenovable/PeriodosIndisponibilidadApiServicio';
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
  /** Con la App Function de períodos: no se pudo leer y el estado viene de SharePoint. */
  errorPeriodos?: string;
  /** El estado de los subequipos sale de los períodos de la App Function. */
  conPeriodos: boolean;
  recargar: () => void;
} {
  const [estado, setEstado] = useState<EstadoCatalogoEquiposOperador>('idle');
  const [tarjetas, setTarjetas] = useState<EquipoOperadorTarjeta[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [errorPeriodos, setErrorPeriodos] = useState<string | undefined>();
  const [conPeriodos, setConPeriodos] = useState(false);
  const [tokenInterno, setTokenInterno] = useState(0);

  const recargar = useCallback(() => {
    setTokenInterno((valor) => valor + 1);
  }, []);

  useEffect(() => {
    let cancelado = false;
    setEstado('cargando');
    setError(undefined);
    const usarPeriodos = HayServicioPeriodos();
    let fallaPeriodos: string | undefined;
    const periodos: Promise<PeriodoIndisponibilidad[] | undefined> = usarPeriodos
      ? ObtenerPeriodosAbiertos().catch((err: Error) => {
          fallaPeriodos = `No se pudieron leer las indisponibilidades de la App Function (${err.message}); se muestra el estado guardado en SharePoint.`;
          return undefined;
        })
      : Promise.resolve(undefined);

    Promise.all([ObtenerTarjetasEquiposOperadorRenovable(context, { incluirEquiposInactivos }), periodos])
      .then(([resultado, abiertos]) => {
        if (abiertos) {
          // Pone al día en SharePoint lo que cambió solo con la hora (inicio programado, vencida): la App
          // Function no escribe en listas. En segundo plano y sin avisos: si el usuario no puede escribir, se
          // reintenta en la próxima carga de un operador.
          const desactualizados = EstadosDesactualizados(resultado, abiertos);
          if (desactualizados.length > 0) {
            AplicarEstadoSubequiposSharePoint(context, desactualizados).catch(() => undefined);
          }
        }
        if (!cancelado) {
          setTarjetas(abiertos ? AplicarPeriodosATarjetas(resultado, abiertos) : resultado);
          setConPeriodos(abiertos !== undefined);
          setErrorPeriodos(fallaPeriodos);
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

  return { estado, tarjetas, error, errorPeriodos, conPeriodos, recargar };
}
