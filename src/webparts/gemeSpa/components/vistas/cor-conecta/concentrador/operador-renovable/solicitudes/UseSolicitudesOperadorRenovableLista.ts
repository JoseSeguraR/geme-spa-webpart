import { useCallback, useEffect, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { EstadoCargaGrillaServidor } from '../../../../../../models/GrillaServidor';
import type { SolicitudOperadorRenovableFila } from '../../../../../../models/operadorRenovable/SolicitudOperadorRenovable';
import type { FiltroEstadoSolicitudesOperadorRenovable } from '../constantesOperadorRenovable';
import { ObtenerSolicitudesIndispOperadorRenovable } from '../../../../../../services/sharepoint/operadorRenovable/RenderListDataSolicitudesIndispServicio';
import { SharePointRestError } from '../../../../../../services/sharepoint/SharePointRestError';

export function UseSolicitudesOperadorRenovableLista(
  context: WebPartContext,
  textoBusqueda: string,
  filtroEstado: FiltroEstadoSolicitudesOperadorRenovable,
  tokenRecarga: number
): {
  filas: SolicitudOperadorRenovableFila[];
  estadoCarga: EstadoCargaGrillaServidor;
  mensajeError?: string;
  recargar: () => void;
} {
  const [filas, setFilas] = useState<SolicitudOperadorRenovableFila[]>([]);
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

    ObtenerSolicitudesIndispOperadorRenovable(
      context,
      {
        tamanoPagina: 200,
        campoOrden: 'INICIO_PROGRAMADO',
        direccionOrden: 'asc',
        filtroEstado
      },
      textoBusqueda
    )
      .then((resultado) => {
        if (!cancelado) {
          setFilas(resultado);
          setEstadoCarga('listo');
        }
      })
      .catch((err) => {
        if (!cancelado) {
          const mensaje =
            err instanceof SharePointRestError
              ? err.message
              : 'No se pudieron cargar las solicitudes con indisponibilidad.';
          setMensajeError(mensaje);
          setFilas([]);
          setEstadoCarga('error');
        }
      })
      .catch(() => undefined);

    return () => {
      cancelado = true;
    };
  }, [context, textoBusqueda, filtroEstado, tokenRecarga, tokenInterno]);

  return { filas, estadoCarga, mensajeError, recargar };
}
