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
  type GridValidRowModel,
  useGridApiRef
} from '@mui/x-data-grid';
import CampoBusquedaGrillaMui from './CampoBusquedaGrillaMui';
import MensajeVacioGrillaMui from './MensajeVacioGrillaMui';
import {
  AlturaGrillaPredeterminadaPx,
  OpcionesTamanoPaginaGrillaPredeterminadas,
  TamanoPaginaTodos,
  type EstadoCargaGrillaServidor,
  type OpcionTamanoPaginaGrilla
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
  /** Tamaños de página; `{ value: TamanoPaginaTodos, label }` agrega la opción de ver todo. */
  opcionesTamanoPagina?: readonly OpcionTamanoPaginaGrilla[];
  /** Sin scroll vertical: la grilla crece con las filas y cada fila con su contenido (texto multilínea). */
  alturaAutomatica?: boolean;
  /** Columnas cuyo ancho se ajusta al contenido cada vez que cambian las filas. */
  columnasAutoajustables?: readonly string[];
  /** Clase CSS adicional por fila (p. ej. resaltado de alerta en operador renovable). */
  obtenerClaseFila?: (fila: Row) => string | undefined;
  /** Total conocido de registros (paginación local); si se omite, se deduce de la página actual. */
  totalFilas?: number;
  /** Clase adicional del contenedor de la tabla (p. ej. `cowork-vista-tabla-mui--centrada`). */
  claseContenedor?: string;
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
    opcionesTamanoPagina = OpcionesTamanoPaginaGrillaPredeterminadas,
    alturaAutomatica = false,
    columnasAutoajustables,
    obtenerClaseFila,
    totalFilas: totalFilasConocido,
    claseContenedor
  } = props;

  const apiRef = useGridApiRef();

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

  // El padre suele pasar `busqueda` como objeto en línea: los efectos dependen de sus valores, no del
  // objeto, para que un re-render (p. ej. al llegar la respuesta) no pise lo que el usuario está escribiendo.
  const valorEnConsulta = busqueda?.valorEnConsulta;
  const demoraBusquedaMs = busqueda?.demoraMs ?? 450;
  const onCambioConsultaRef = useRef(busqueda?.onCambioConsulta);
  onCambioConsultaRef.current = busqueda?.onCambioConsulta;

  useEffect(() => {
    if (valorEnConsulta === undefined) {
      return;
    }
    // Solo cuando el valor cambia desde fuera (p. ej. limpiar filtros); conserva espacios al final.
    setTextoBusquedaLocal((actual) => (actual.trim() === valorEnConsulta.trim() ? actual : valorEnConsulta));
  }, [valorEnConsulta]);

  useEffect(() => {
    if (valorEnConsulta === undefined) {
      return;
    }
    const textoNormalizado = textoBusquedaLocal.trim();
    const demoraMs = textoNormalizado.length === 0 ? 0 : demoraBusquedaMs;
    const id = window.setTimeout(() => {
      if (textoNormalizado !== valorEnConsulta.trim()) {
        onCambioConsultaRef.current?.(textoNormalizado);
      }
    }, demoraMs);
    return () => window.clearTimeout(id);
  }, [textoBusquedaLocal, valorEnConsulta, demoraBusquedaMs]);

  const modeloOrden: GridSortModel = useMemo(
    () => [{ field: campoOrden, sort: direccionOrden }],
    [campoOrden, direccionOrden]
  );

  const modeloPaginacion: GridPaginationModel = useMemo(
    () => ({ page: paginaActual, pageSize: tamanoPagina }),
    [paginaActual, tamanoPagina]
  );

  useEffect(() => {
    if (!columnasAutoajustables?.length || filas.length === 0) {
      return;
    }
    // autosizeColumns mide solo celdas ya dibujadas: se espera a que existan (con altura automática
    // MUI dibuja las filas algunos cuadros después), si no mediría solo el encabezado.
    let id = 0;
    const Autoajustar = (intentosRestantes: number): void => {
      const raiz = apiRef.current?.rootElementRef?.current;
      const hayCeldas = raiz?.querySelector(`.MuiDataGrid-cell[data-field="${columnasAutoajustables[0]}"]`);
      if (!hayCeldas && intentosRestantes > 0) {
        id = window.requestAnimationFrame(() => Autoajustar(intentosRestantes - 1));
        return;
      }
      apiRef.current?.autosizeColumns({
        columns: [...columnasAutoajustables],
        includeHeaders: true,
        includeOutliers: true
      }).catch(() => undefined);
    };
    id = window.requestAnimationFrame(() => Autoajustar(30));
    return () => window.cancelAnimationFrame(id);
  }, [apiRef, columnasAutoajustables, filas]);

  const columnasGrilla = useMemo(() => {
    if (!columnasAutoajustables?.length) {
      return columnas;
    }
    return columnas.map((columna): GridColDef<Row> => {
      if (columnasAutoajustables.indexOf(columna.field) === -1) {
        return columna;
      }
      const claseOriginal = columna.cellClassName;
      return {
        ...columna,
        cellClassName: (params) => {
          const clase = typeof claseOriginal === 'function' ? claseOriginal(params) : claseOriginal;
          return clase ? `${clase} cowork-celda-autoajustada` : 'cowork-celda-autoajustada';
        }
      };
    });
  }, [columnas, columnasAutoajustables]);

  const totalFilas = totalFilasConocido !== undefined
    ? totalFilasConocido
    : hayPaginaSiguiente
    ? -1
    : tamanoPagina === TamanoPaginaTodos
      ? filas.length
      : paginaActual * tamanoPagina + filas.length;
  const estaCargando = cargando ?? (estadoCarga === 'cargando' || estadoCarga === 'inicial');
  const ocultarGrilla = estadoCarga === 'vacio' && filas.length === 0;
  const hayBusquedaActiva = textoBusquedaActiva.trim().length > 0;
  const mensajeVacio = hayBusquedaActiva ? mensajeSinRegistrosBusqueda : mensajeSinRegistros;

  const slotsGrilla = useMemo(
    () => ({
      loadingOverlay: OverlayCargaGrilla,
      noRowsOverlay: function OverlaySinFilas(): React.ReactElement {
        return <MensajeVacioGrillaMui mensaje={mensajeVacio} variante="overlay" />;
      },
      noResultsOverlay: function OverlaySinResultados(): React.ReactElement {
        return (
          <MensajeVacioGrillaMui mensaje={mensajeSinRegistrosBusqueda} variante="overlay" />
        );
      }
    }),
    [mensajeVacio, mensajeSinRegistrosBusqueda]
  );

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
        <div
          className={`cowork-vista-tabla-mui${alturaAutomatica ? ' cowork-vista-tabla-mui--multilinea' : ''}${
            claseContenedor ? ` ${claseContenedor}` : ''
          }`}
        >
          <DataGrid
            apiRef={apiRef}
            rows={filas}
            columns={columnasGrilla}
            rowHeight={AlturaFilaGrillaPx}
            autoHeight={alturaAutomatica}
            getRowHeight={alturaAutomatica ? () => 'auto' : undefined}
            columnHeaderHeight={AlturaEncabezadoGrillaPx}
            loading={estaCargando}
            slots={slotsGrilla}
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
            getRowClassName={
              obtenerClaseFila
                ? (params) => obtenerClaseFila(params.row as Row) ?? ''
                : undefined
            }
            onColumnWidthChange={
              onCambioAnchoColumna
                ? (params) => {
                    onCambioAnchoColumna(params.colDef.field, params.width);
                  }
                : undefined
            }
            slotProps={slotPropsGrilla}
            sx={alturaAutomatica ? undefined : { height: alturaPx }}
          />
        </div>
      )}

      {estadoCarga === 'vacio' ? (
        <MensajeVacioGrillaMui mensaje={mensajeVacio} alturaMinimaPx={alturaPx} />
      ) : null}
      </div>
    </ThemeProvider>
  );
}
