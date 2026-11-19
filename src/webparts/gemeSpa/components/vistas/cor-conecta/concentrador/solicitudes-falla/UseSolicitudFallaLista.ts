import { useCallback, useEffect, useRef, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { EstadoCargaGrillaServidor } from '../../../../../models/GrillaServidor';
import type { CentralMantenedor, EstadoFiltroSolicitudFalla } from '../../../../../models/SolicitudFalla';
import { ObtenerCentralesDesdeSharePoint } from '../../../../../services/sharepoint/solicitudesIl/CentralesServicio';
import { ObtenerPaginaSolicitudFallaRenderListData } from '../../../../../services/sharepoint/solicitudesFalla/RenderListDataSolicitudFallaServicio';
import type { SolicitudFallaNormalizada } from '../../../../../services/sharepoint/solicitudesFalla/NormalizarFilaSolicitudFallaDesdeRender';
import { SharePointRestError } from '../../../../../services/sharepoint/SharePointRestError';
import { TamanoPaginaTodos } from '../../../../grilla';
import {
  CampoDescripcionSolicitudFalla,
  CampoEstadoSolicitudFalla,
  CampoFechaPerturbacionSolicitudFalla,
  CampoFechaRetornoSolicitudFalla,
  CampoIdCenSolicitudFalla,
  CampoLookupInstalacionGmSolicitudFalla
} from '../../../../../services/sharepoint/solicitudesFalla/CamposListaSolicitudFalla';
import { EnriquecerFilasIntegracionSiodDesdeBitacora } from '../../../../../services/sharepoint/solicitudesFalla/IntegracionSiodDesdeBitacoraSolicitudFalla';
import { TamanoLoteCargaCompletaSolicitudFalla } from './constantesSolicitudFalla';
import type { RestriccionInstalacionesSolicitante } from '../solicitudes-il/UseSolicitudesIlLista';

export type FiltrosFechaSolicitudFalla = {
  fechaPerturbacionDesde?: string;
  fechaPerturbacionHasta?: string;
  fechaRetornoDesde?: string;
  fechaRetornoHasta?: string;
};

export type UseSolicitudFallaListaParams = {
  context: WebPartContext;
  estadoFiltro: EstadoFiltroSolicitudFalla;
  centralIdFiltro?: number;
  equiposIdsFiltro?: readonly number[];
  filtrosFecha?: FiltrosFechaSolicitudFalla;
  restriccionInstalaciones?: RestriccionInstalacionesSolicitante;
  textoBusqueda: string;
  paginaActual: number;
  tamanoPagina: number;
  campoOrden: string;
  direccionOrden: 'asc' | 'desc';
  recargarToken: number;
};

export type UseSolicitudFallaListaResultado = {
  filas: SolicitudFallaNormalizada[];
  hayPaginaSiguiente: boolean;
  estadoCarga: EstadoCargaGrillaServidor;
  mensajeError?: string;
  centrales: CentralMantenedor[];
  centralesCargando: boolean;
  recargar: () => void;
};

const MapaCampoOrdenGrilla: Record<string, string> = {
  id: 'ID',
  idCen: CampoIdCenSolicitudFalla,
  centralEtiqueta: CampoLookupInstalacionGmSolicitudFalla,
  fechaPerturbacion: CampoFechaPerturbacionSolicitudFalla,
  fechaRetorno: CampoFechaRetornoSolicitudFalla,
  descripcion: CampoDescripcionSolicitudFalla,
  estado: CampoEstadoSolicitudFalla
};

export function UseSolicitudFallaLista(params: UseSolicitudFallaListaParams): UseSolicitudFallaListaResultado {
  const {
    context,
    estadoFiltro,
    centralIdFiltro,
    equiposIdsFiltro,
    filtrosFecha,
    restriccionInstalaciones = { activo: false },
    textoBusqueda,
    paginaActual,
    tamanoPagina,
    campoOrden,
    direccionOrden,
    recargarToken
  } = params;

  const [filas, setFilas] = useState<SolicitudFallaNormalizada[]>([]);
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
    if (restriccionInstalaciones.activo && !restriccionInstalaciones.listo) {
      setFilas([]);
      setEstadoCarga('listo');
      return undefined;
    }

    if (restriccionInstalaciones.activo && restriccionInstalaciones.listo && restriccionInstalaciones.ids.length === 0) {
      setFilas([]);
      setHayPaginaSiguiente(false);
      setEstadoCarga('listo');
      return undefined;
    }

    let cancelado = false;
    setEstadoCarga('cargando');
    setMensajeError(undefined);

    const campoOrdenLista = MapaCampoOrdenGrilla[campoOrden] ?? 'ID';
    const instalacionesPermitidas =
      restriccionInstalaciones.activo && restriccionInstalaciones.listo
        ? restriccionInstalaciones.ids
        : undefined;

    const parametrosBase = {
      estadoFiltro,
      centralId: centralIdFiltro,
      equiposIdsFiltro: equiposIdsFiltro,
      instalacionesPermitidasIds: instalacionesPermitidas,
      fechaPerturbacionDesdeIso: filtrosFecha?.fechaPerturbacionDesde,
      fechaPerturbacionHastaIso: filtrosFecha?.fechaPerturbacionHasta,
      fechaRetornoDesdeIso: filtrosFecha?.fechaRetornoDesde,
      fechaRetornoHastaIso: filtrosFecha?.fechaRetornoHasta,
      tamanoPagina: tamanoPagina === TamanoPaginaTodos ? TamanoLoteCargaCompletaSolicitudFalla : tamanoPagina,
      campoOrden: campoOrdenLista,
      direccionOrden
    };

    const CargarPagina = async (): Promise<void> => {
      try {
        if (tamanoPagina === TamanoPaginaTodos) {
          const acumulado: SolicitudFallaNormalizada[] = [];
          let paging: string | undefined;
          do {
            const pagina = await ObtenerPaginaSolicitudFallaRenderListData(
              context,
              parametrosBase,
              paging,
              textoBusqueda
            );
            if (cancelado) {
              return;
            }
            acumulado.push(...pagina.filas);
            paging = pagina.pagingSiguiente;
          } while (paging);

          const filasConSiod = await EnriquecerFilasIntegracionSiodDesdeBitacora(context, acumulado);
          if (cancelado) {
            return;
          }
          setFilas(filasConSiod);
          setHayPaginaSiguiente(false);
          setEstadoCarga('listo');
          return;
        }

        const pagingToken = paginaActual > 0 ? tokensPagingRef.current[paginaActual - 1] : undefined;
        const resultado = await ObtenerPaginaSolicitudFallaRenderListData(
          context,
          parametrosBase,
          pagingToken,
          textoBusqueda
        );
        if (cancelado) {
          return;
        }

        if (resultado.pagingSiguiente) {
          const copia = [...tokensPagingRef.current];
          copia[paginaActual] = resultado.pagingSiguiente;
          tokensPagingRef.current = copia;
        }

        const filasConSiod = await EnriquecerFilasIntegracionSiodDesdeBitacora(context, resultado.filas);
        if (cancelado) {
          return;
        }
        setFilas(filasConSiod);
        setHayPaginaSiguiente(Boolean(resultado.pagingSiguiente));
        setEstadoCarga('listo');
      } catch (err) {
        if (!cancelado) {
          setFilas([]);
          setHayPaginaSiguiente(false);
          setEstadoCarga('error');
          setMensajeError(
            err instanceof SharePointRestError
              ? err.message
              : 'No se pudo cargar el listado de solicitudes de falla.'
          );
        }
      }
    };

    tokensPagingRef.current = [];
    CargarPagina().catch(() => undefined);

    return () => {
      cancelado = true;
    };
  }, [
    context,
    estadoFiltro,
    centralIdFiltro,
    equiposIdsFiltro,
    filtrosFecha,
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