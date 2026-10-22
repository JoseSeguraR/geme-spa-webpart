import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { Box } from '@mui/material';
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  type GridRowId,
  type GridSortModel,
  type GridValidRowModel
} from '@mui/x-data-grid';
import CampoBusquedaGrillaMui from './CampoBusquedaGrillaMui';
import {
  AlturaGrillaPredeterminadaPx,
  OpcionesTamanoPaginaGrillaPredeterminadas,
  type EstadoCargaGrillaServidor
} from './TiposGrillaServidor';
import { TemaGrillaGeme } from './TemaGrillaMui';
import { AlturaEncabezadoGrillaPx, AlturaFilaGrillaPx } from '../../models/GrillaServidor';

export type ConfigBusquedaGrillaServidor = {
  etiqueta: string;
  valorEnConsulta: string;
  onCambioConsulta: (texto: string) => void;
  demoraMs?: number;
};

export type GrillaServidorMuiProps<Row extends GridValidRowModel & { id: GridRowId }> = {
  filas: Row[];
  columnas: GridColDef<Row>[];
  estadoCarga: EstadoCargaGrillaServidor;
  cargando?: boolean;
  mensajeError?: string;
  onReintentar?: () => void;
  paginaActual: number;
  tamanoPagina: number;
  hayPaginaSiguiente: boolean;
  onCambioPagina: (pagina: number) => void;
  onCambioTamanoPagina: (tamano: number) => void;
  campoOrden: string;
  direccionOrden: 'asc' | 'desc';
  onCambioOrdenamiento: (campo: string, direccion: 'asc' | 'desc') => void;
  onCambioAnchoColumna?: (campo: string, ancho: number) => void;
  busqueda?: ConfigBusquedaGrillaServidor;
  accionesBarra?: React.ReactNode;
  mensajeSinRegistros?: string;
  mensajeSinRegistrosBusqueda?: string;
  textoBusquedaActiva?: string;
  alturaPx?: number;
  opcionesTamanoPagina?: readonly number[];
};

function OverlayCargaGrilla(): React.ReactElement {
  return (
    <div className="d-flex align-items-center justify-content-center h-100 text-muted">
      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
      Cargando…
    </div>
  );
}

function MensajeErrorGrilla(props: {
  mensaje?: string;
  onReintentar?: () => void;
}): React.ReactElement {
  const { mensaje, onReintentar } = props;
  if (!onReintentar && !mensaje) {
    return <></>;
  }
  return (
    <div className="alert alert-warning d-flex align-items-center justify-content-between mb-2" role="alert">
      <span>{mensaje ?? 'No se pudo cargar la lista.'}</span>
      {onReintentar ? (
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onReintentar}>
          Reintentar
        </button>
      ) : null}
    </div>
  );
}

export default function GrillaServidorMui<Row extends GridValidRowModel & { id: GridRowId }>(
  props: GrillaServidorMuiProps<Row>
): React.ReactElement {
  const {
    filas,
    columnas,
    estadoCarga,
    cargando,
    mensajeError,
    onReintentar,
    paginaActual,
    tamanoPagina,
    hayPaginaSiguiente,
    onCambioPagina,
    onCambioTamanoPagina,
    campoOrden,
    direccionOrden,
    onCambioOrdenamiento,
    onCambioAnchoColumna,
    busqueda,
    accionesBarra,
    mensajeSinRegistros = 'No hay registros.',
    mensajeSinRegistrosBusqueda = 'No hay registros para la búsqueda indicada.',
    textoBusquedaActiva = '',
    alturaPx = AlturaGrillaPredeterminadaPx,
    opcionesTamanoPagina = OpcionesTamanoPaginaGrillaPredeterminadas
  } = props;

  const [textoBusquedaLocal, setTextoBusquedaLocal] = useState(busqueda?.valorEnConsulta ?? '');
  const contenedorGrillaRef = useRef<HTMLDivElement>(null);

  const ObtenerContenedorPortalWebPart = useCallback((): HTMLElement => {
    const ancestroWebPart = contenedorGrillaRef.current?.closest('.gemeSpaBootstrap');
    if (ancestroWebPart instanceof HTMLElement) {
      return ancestroWebPart;
    }
    return document.body;
  }, []);

  const slotPropsGrilla = useMemo(
    () => ({
      basePopper: {
        container: ObtenerContenedorPortalWebPart
      },
      baseSelect: {
        MenuProps: {
          container: ObtenerContenedorPortalWebPart
        }
      }
    }),
    [ObtenerContenedorPortalWebPart]
  );

  useEffect(() => {
    if (busqueda) {
      setTextoBusquedaLocal(busqueda.valorEnConsulta);
    }
  }, [busqueda?.valorEnConsulta, busqueda]);

  useEffect(() => {
    if (!busqueda) {
      return;
    }
    const textoNormalizado = textoBusquedaLocal.trim();
    const demoraBase = busqueda.demoraMs ?? 450;
    const demoraMs = textoNormalizado.length === 0 ? 0 : demoraBase;
    const id = window.setTimeout(() => {
      if (textoNormalizado !== busqueda.valorEnConsulta.trim()) {
        busqueda.onCambioConsulta(textoNormalizado);
      }
    }, demoraMs);
    return () => window.clearTimeout(id);
  }, [textoBusquedaLocal, busqueda]);

  const modeloOrden: GridSortModel = useMemo(
    () => [{ field: campoOrden, sort: direccionOrden }],
    [campoOrden, direccionOrden]
  );

  const modeloPaginacion: GridPaginationModel = useMemo(
    () => ({ page: paginaActual, pageSize: tamanoPagina }),
    [paginaActual, tamanoPagina]
  );

  const totalFilas = hayPaginaSiguiente ? -1 : paginaActual * tamanoPagina + filas.length;
  const estaCargando = cargando ?? (estadoCarga === 'cargando' || estadoCarga === 'inicial');
  const ocultarGrilla = estadoCarga === 'vacio' && filas.length === 0;
  const hayBusquedaActiva = textoBusquedaActiva.trim().length > 0;

  return (
    <ThemeProvider theme={TemaGrillaGeme}>
      <div ref={contenedorGrillaRef} className="cowork-grilla-servidor-mui">
      {busqueda || accionesBarra ? (
        <Box className="cowork-grilla-toolbar mb-3 d-flex flex-wrap gap-2 align-items-center justify-content-between">
          {busqueda ? (
            <CampoBusquedaGrillaMui
              etiqueta={busqueda.etiqueta}
              valor={textoBusquedaLocal}
              onCambio={setTextoBusquedaLocal}
            />
          ) : (
            <span />
          )}
          {accionesBarra ?? null}
        </Box>
      ) : null}

      {estadoCarga === 'error' ? (
        <MensajeErrorGrilla mensaje={mensajeError} onReintentar={onReintentar} />
      ) : null}

      {ocultarGrilla ? null : (
        <div className="cowork-vista-tabla-mui">
          <DataGrid
            rows={filas}
            columns={columnas}
            rowHeight={AlturaFilaGrillaPx}
            columnHeaderHeight={AlturaEncabezadoGrillaPx}
            loading={estaCargando}
            slots={{ loadingOverlay: OverlayCargaGrilla }}
            paginationMode="server"
            sortingMode="server"
            rowCount={totalFilas}
            paginationMeta={{ hasNextPage: hayPaginaSiguiente }}
            paginationModel={modeloPaginacion}
            onPaginationModelChange={(modelo) => {
              if (modelo.pageSize !== tamanoPagina) {
                onCambioTamanoPagina(modelo.pageSize);
                return;
              }
              if (modelo.page !== paginaActual) {
                onCambioPagina(modelo.page);
              }
            }}
            pageSizeOptions={[...opcionesTamanoPagina]}
            sortModel={modeloOrden}
            onSortModelChange={(modelo) => {
              const primero = modelo[0];
              if (!primero || !primero.sort) {
                onCambioOrdenamiento('id', 'asc');
                return;
              }
              onCambioOrdenamiento(primero.field, primero.sort);
            }}
            disableRowSelectionOnClick
            onColumnWidthChange={
              onCambioAnchoColumna
                ? (params) => {
                    onCambioAnchoColumna(params.colDef.field, params.width);
                  }
                : undefined
            }
            slotProps={slotPropsGrilla}
            sx={{ height: alturaPx }}
          />
        </div>
      )}

      {estadoCarga === 'vacio' ? (
        <p className="text-muted mb-0">{hayBusquedaActiva ? mensajeSinRegistrosBusqueda : mensajeSinRegistros}</p>
      ) : null}
      </div>
    </ThemeProvider>
  );
}
