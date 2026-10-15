import { useCallback, useEffect, useRef, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { EstadoCargaGrillaServidor } from '../../../../../models/GrillaServidor';
import type { CentralMantenedor, SolicitudIl } from '../../../../../models/SolicitudIl';
import { ObtenerCentralesDesdeSharePoint } from '../../../../../services/sharepoint/solicitudesIl/CentralesServicio';
import { ObtenerPaginaSolicitudesIlRenderListData } from '../../../../../services/sharepoint/solicitudesIl/RenderListDataSolicitudesIlServicio';
import { SharePointRestError } from '../../../../../services/sharepoint/SharePointRestError';
import { CampoEstadoTareaActualIl, type EstadoSolicitudIl } from './constantesSolicitudesIl';

export type UseSolicitudesIlListaParams = {
  context: WebPartContext;
  estadoFiltro: EstadoSolicitudIl;
  centralIdFiltro?: number;
  textoBusqueda: string;
  paginaActual: number;
  tamanoPagina: number;
  campoOrden: string;
  direccionOrden: 'asc' | 'desc';
  recargarToken: number;
};

export type UseSolicitudesIlListaResultado = {
  filas: SolicitudIl[];
  hayPaginaSiguiente: boolean;
  estadoCarga: EstadoCargaGrillaServidor;
  mensajeError?: string;
  centrales: CentralMantenedor[];
  centralesCargando: boolean;
  recargar: () => void;
};

const MapaCampoOrdenGrilla: Record<string, string> = {
  id: 'ID',
  idCen: 'ID_CEN',
  centralEtiqueta: 'INSTALACION',
  descripcion: 'DESCRIPCION',
  inicioProgramado: 'FECHA_INICIO',
  finProgramado: 'FECHA_FIN',
  estado: CampoEstadoTareaActualIl
};

export function UseSolicitudesIlLista(params: UseSolicitudesIlListaParams): UseSolicitudesIlListaResultado {
  const {
    context,
    estadoFiltro,
    centralIdFiltro,
    textoBusqueda,
    paginaActual,
    tamanoPagina,
    campoOrden,
    direccionOrden,
    recargarToken
  } = params;

  const [filas, setFilas] = useState<SolicitudIl[]>([]);
  const [hayPaginaSiguiente, setHayPaginaSiguiente] = useState(false);
  const [estadoCarga, setEstadoCarga] = useState<EstadoCargaGrillaServidor>('inicial');
  const [mensajeError, setMensajeError] = useState<string | undefined>();
  const [centrales, setCentrales] = useState<CentralMantenedor[]>([]);
  const [centralesCargando, setCentralesCargando] = useState(true);
  const [tokenRecargaLocal, setTokenRecargaLocal] = useState(0);

  const tokensPagingRef = useRef<string[]>([]);

  const recargar = useCallback(() => {
    setTokenRecargaLocal((valor) => valor + 1);
  }, []);

  useEffect(() => {
    let cancelado = false;
    setCentralesCargando(true);
    ObtenerCentralesDesdeSharePoint(context)
      .then((resultado) => {
        if (!cancelado) {
          setCentrales(resultado);
        }
      })
      .catch(() => {
        if (!cancelado) {
          setCentrales([]);
        }
      })
      .then(() => {
        if (!cancelado) {
          setCentralesCargando(false);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelado = true;
    };
  }, [context]);

  useEffect(() => {
    tokensPagingRef.current = [];
  }, [estadoFiltro, centralIdFiltro, tamanoPagina, campoOrden, direccionOrden, textoBusqueda, recargarToken, tokenRecargaLocal]);

  useEffect(() => {
    let cancelado = false;

    const Cargar = async (): Promise<void> => {
      setEstadoCarga('cargando');
      setMensajeError(undefined);

      try {
        const campoSharePoint = MapaCampoOrdenGrilla[campoOrden] ?? 'ID';
        let paging: string | undefined;
        const tokens = tokensPagingRef.current;

        if (paginaActual > 0) {
          while (tokens.length < paginaActual) {
            const indice = tokens.length;
            const pagingAnterior = indice === 0 ? undefined : tokens[indice - 1];
            const intermedio = await ObtenerPaginaSolicitudesIlRenderListData(
              context,
              {
                estado: estadoFiltro,
                centralId: centralIdFiltro,
                tamanoPagina,
                campoOrden: campoSharePoint,
                direccionOrden
              },
              pagingAnterior,
              textoBusqueda
            );
            if (intermedio.pagingSiguiente) {
              tokens.push(intermedio.pagingSiguiente);
            } else {
              break;
            }
          }
          paging = paginaActual === 0 ? undefined : tokens[paginaActual - 1];
        }

        const resultado = await ObtenerPaginaSolicitudesIlRenderListData(
          context,
          {
            estado: estadoFiltro,
            centralId: centralIdFiltro,
            tamanoPagina,
            campoOrden: campoSharePoint,
            direccionOrden
          },
          paging,
          textoBusqueda
        );

        if (cancelado) {
          return;
        }

        if (resultado.pagingSiguiente) {
          const tokensActualizados = tokensPagingRef.current.slice();
          tokensActualizados[paginaActual] = resultado.pagingSiguiente;
          tokensPagingRef.current = tokensActualizados;
        }

        setFilas(resultado.filas);
        setHayPaginaSiguiente(Boolean(resultado.pagingSiguiente));
        setEstadoCarga(resultado.filas.length === 0 ? 'vacio' : 'listo');
      } catch (error) {
        if (cancelado) {
          return;
        }
        const mensaje =
          error instanceof SharePointRestError
            ? error.message
            : 'No se pudieron cargar las solicitudes IL.';
        setMensajeError(mensaje);
        setFilas([]);
        setHayPaginaSiguiente(false);
        setEstadoCarga('error');
      }
    };

    Cargar().catch(() => undefined);
    return () => {
      cancelado = true;
    };
  }, [
    context,
    estadoFiltro,
    centralIdFiltro,
    textoBusqueda,
    paginaActual,
    tamanoPagina,
    campoOrden,
    direccionOrden,
    recargarToken,
    tokenRecargaLocal
  ]);

  return {
    filas,
    hayPaginaSiguiente,
    estadoCarga,
    mensajeError,
    centrales,
    centralesCargando,
    recargar
  };
}
