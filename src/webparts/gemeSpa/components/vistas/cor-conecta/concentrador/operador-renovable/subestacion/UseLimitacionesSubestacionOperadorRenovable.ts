import { useCallback, useEffect, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { CentralMantenedor } from '../../../../../../models/concentradorComun/CentralMantenedor';
import type { EstadoCargaGrillaServidor } from '../../../../../../models/GrillaServidor';
import type { LimitacionSubestacionOperador } from '../../../../../../models/operadorRenovable/LimitacionSubestacionOperador';
import { ObtenerInstalacionesOperadorRenovable } from '../../../../../../services/sharepoint/operadorRenovable/InstalacionesOperadorRenovableServicio';
import { ObtenerLimitacionesRedOperadorRenovable } from '../../../../../../services/sharepoint/operadorRenovable/LimitacionesRedServicio';
import { SharePointRestError } from '../../../../../../services/sharepoint/SharePointRestError';

export function UseLimitacionesSubestacionOperadorRenovable(
  context: WebPartContext,
  tokenRecarga: number
): {
  filas: LimitacionSubestacionOperador[];
  centrales: CentralMantenedor[];
  estadoCarga: EstadoCargaGrillaServidor;
  mensajeError?: string;
  recargar: () => void;
} {
  const [filas, setFilas] = useState<LimitacionSubestacionOperador[]>([]);
  const [centrales, setCentrales] = useState<CentralMantenedor[]>([]);
  const [estadoCarga, setEstadoCarga] = useState<EstadoCargaGrillaServidor>('inicial');
  const [mensajeError, setMensajeError] = useState<string | undefined>();
  const [tokenInterno, setTokenInterno] = useState(0);

  const recargar = useCallback(() => {
    setTokenInterno((valor) => valor + 1);
  }, []);

  useEffect(() => {
    let cancelado = false;
    setEstadoCarga('cargando');
    setMensajeError(undefined);

    Promise.all([ObtenerLimitacionesRedOperadorRenovable(context), ObtenerInstalacionesOperadorRenovable(context)])
      .then(([limitaciones, instalaciones]) => {
        if (!cancelado) {
          setFilas(limitaciones);
          setCentrales(instalaciones);
          setEstadoCarga('listo');
        }
      })
      .catch((err) => {
        if (!cancelado) {
          const mensaje =
            err instanceof SharePointRestError
              ? err.message
              : 'No se pudieron cargar las limitaciones por subestación.';
          setMensajeError(mensaje);
          setFilas([]);
          setEstadoCarga('error');
        }
      })
      .catch(() => undefined);

    return () => {
      cancelado = true;
    };
  }, [context, tokenRecarga, tokenInterno]);

  return { filas, centrales, estadoCarga, mensajeError, recargar };
}
