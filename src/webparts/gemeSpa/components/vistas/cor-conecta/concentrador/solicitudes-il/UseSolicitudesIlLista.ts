import { useCallback, useEffect, useRef, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { EstadoCargaGrillaServidor } from '../../../../../models/GrillaServidor';
import type { CentralMantenedor, SolicitudIl } from '../../../../../models/SolicitudIl';
import { ObtenerCentralesDesdeSharePoint } from '../../../../../services/sharepoint/solicitudesIl/CentralesServicio';
import { ObtenerPaginaSolicitudesIlRenderListData } from '../../../../../services/sharepoint/solicitudesIl/RenderListDataSolicitudesIlServicio';
import { SharePointRestError } from '../../../../../services/sharepoint/SharePointRestError';
import { TamanoPaginaTodos } from '../../../../grilla';
import {
  CampoEstadoTareaActualIl,
  TamanoLoteCargaCompletaSolicitudesIl,
  type EstadoSolicitudIl
} from './constantesSolicitudesIl';

/** Filtro por instalaciones asignadas al solicitante; ausente en otros perfiles. */
export type RestriccionInstalacionesSolicitante =
  | { activo: false }
  | { activo: true; listo: false }
  | { activo: true; listo: true; ids: readonly number[] };

export type UseSolicitudesIlListaParams = {
  context: WebPartContext;
  estadoFiltro: EstadoSolicitudIl;
  centralIdFiltro?: number;
  restriccionInstalaciones?: RestriccionInstalacionesSolicitante;
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
    restriccionInstalaciones = { activo: false },
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
  }, [
    estadoFiltro,
    centralIdFiltro,
    restriccionInstalaciones,
    tamanoPagina,
    campoOrden,
    direccionOrden,
    textoBusqueda,
    recargarToken,
    tokenRecargaLocal
  ]);

  useEffect(() => {
    let cancelado = false;

    const Cargar = async (): Promise<void> => {
      setEstadoCarga('cargando');
      setMensajeError(undefined);

      if (restriccionInstalaciones.activo) {
        if (!restriccionInstalaciones.listo) {
          return;
        }
        if (restriccionInstalaciones.ids.length === 0) {
          setFilas([]);
          setHayPaginaSiguiente(false);
          setEstadoCarga('vacio');
          return;
        }
      }

      try {
        const instalacionesPermitidasIds =
          restriccionInstalaciones.activo && restriccionInstalaciones.listo
            ? restriccionInstalaciones.ids
            : undefined;
        const campoSharePoint = MapaCampoOrdenGrilla[campoOrden] ?? 'ID';

        if (tamanoPagina === TamanoPaginaTodos) {
          const todas: SolicitudIl[] = [];
          let pagingLote: string | undefined;
          do {
            const lote = await ObtenerPaginaSolicitudesIlRenderListData(
              context,
              {
                estado: estadoFiltro,
                centralId: centralIdFiltro,
                instalacionesPermitidasIds,
                tamanoPagina: TamanoLoteCargaCompletaSolicitudesIl,
                campoOrden: campoSharePoint,
                direccionOrden
              },
              pagingLote,
              textoBusqueda
            );
            if (cancelado) {
              return;
            }
            todas.push(...lote.filas);
            pagingLote = lote.pagingSiguiente;
          } while (pagingLote);

          setFilas(todas);
          setHayPaginaSiguiente(false);
          setEstadoCarga(todas.length === 0 ? 'vacio' : 'listo');
          return;
        }

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
                instalacionesPermitidasIds,
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
            instalacionesPermitidasIds,
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
    restriccionInstalaciones,
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
