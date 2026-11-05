import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { TemaGrillaGeme } from '../grilla/TemaGrillaMui';
import { AlturaEncabezadoGrillaPx, AlturaFilaGrillaPx } from '../../models/GrillaServidor';
import type { FilaBitacoraEngine } from '../../models/concentradorComun/FilaBitacoraEngine';
import { FormatearFechaHoraVisible } from '../../utils/FechaHoraCorConecta';

export type ModalBitacoraEngineProps = {
  visible: boolean;
  idRegistro?: number;
  tituloModal: string;
  onCerrar: () => void;
  cargarFilas: (idRegistro: number) => Promise<FilaBitacoraEngine[]>;
  mensajeSinRegistros?: string;
  mensajeErrorGenerico?: string;
};

type FilaGrillaBitacora = FilaBitacoraEngine & { id: number };

function CeldaTexto(valor: string): React.ReactElement {
  return <span>{valor || '—'}</span>;
}

function CeldaFecha(valor: string): React.ReactElement {
  const visible = FormatearFechaHoraVisible(valor);
  return <span>{visible || '—'}</span>;
}

export default function ModalBitacoraEngine(props: ModalBitacoraEngineProps): React.ReactElement {
  const {
    visible,
    idRegistro,
    tituloModal,
    onCerrar,
    cargarFilas,
    mensajeSinRegistros = 'No hay registros de bitácora para este registro.',
    mensajeErrorGenerico = 'No se pudo cargar la bitácora.'
  } = props;
  const [filas, setFilas] = useState<FilaGrillaBitacora[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!visible || idRegistro === undefined) {
      setFilas([]);
      setError(undefined);
      return undefined;
    }

    let cancelado = false;
    setCargando(true);
    setError(undefined);

    cargarFilas(idRegistro)
      .then((resultado) => {
        if (!cancelado) {
          setFilas(resultado.map((fila) => ({ ...fila, id: fila.id })));
        }
      })
      .catch((err) => {
        if (!cancelado) {
          const mensaje = err instanceof Error ? err.message : mensajeErrorGenerico;
          setError(mensaje);
          setFilas([]);
        }
      })
      .then(() => {
        if (!cancelado) {
          setCargando(false);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelado = true;
    };
  }, [visible, idRegistro, cargarFilas, mensajeErrorGenerico]);

  const columnas: GridColDef<FilaGrillaBitacora>[] = useMemo(
    () => [
      { field: 'id', headerName: 'ID', width: 72 },
      {
        field: 'tarea',
        headerName: 'Tarea',
        minWidth: 120,
        flex: 1,
        renderCell: (params) => CeldaTexto(String(params.value ?? ''))
      },
      {
        field: 'fechaInicioTarea',
        headerName: 'Fecha inicio tarea',
        minWidth: 150,
        flex: 1,
        renderCell: (params) => CeldaFecha(String(params.value ?? ''))
      },
      {
        field: 'estadoInicial',
        headerName: 'Estado inicial',
        minWidth: 110,
        flex: 0.8,
        renderCell: (params) => CeldaTexto(String(params.value ?? ''))
      },
      {
        field: 'accionCierre',
        headerName: 'Acción cierre',
        minWidth: 120,
        flex: 1,
        renderCell: (params) => CeldaTexto(String(params.value ?? ''))
      },
      {
        field: 'fechaCierre',
        headerName: 'Fecha cierre',
        minWidth: 150,
        flex: 1,
        renderCell: (params) => CeldaFecha(String(params.value ?? ''))
      },
      {
        field: 'responsableCierre',
        headerName: 'Responsable cierre',
        minWidth: 140,
        flex: 1,
        renderCell: (params) => CeldaTexto(String(params.value ?? ''))
      },
      {
        field: 'estadoFinal',
        headerName: 'Estado final',
        minWidth: 110,
        flex: 0.8,
        renderCell: (params) => CeldaTexto(String(params.value ?? ''))
      }
    ],
    []
  );

  if (!visible || idRegistro === undefined) {
    return <></>;
  }

  const idTitulo = 'modal-bitacora-engine-titulo';

  return (
    <>
      <div className="modal fade show d-block" role="dialog" aria-modal="true" aria-labelledby={idTitulo}>
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title h5" id={idTitulo}>
                {tituloModal}
              </h2>
              <button type="button" className="btn-close" aria-label="Cerrar" onClick={onCerrar} />
            </div>
            <div className="modal-body">
              {error ? <div className="alert alert-danger py-2">{error}</div> : null}
              {!error && !cargando && filas.length === 0 ? (
                <p className="text-muted mb-0">{mensajeSinRegistros}</p>
              ) : null}
              {!error && (cargando || filas.length > 0) ? (
                <ThemeProvider theme={TemaGrillaGeme}>
                  <div className="cowork-vista-tabla-mui cowork-vista-tabla-mui--modal-bitacora">
                    <DataGrid
                      rows={filas}
                      columns={columnas}
                      rowHeight={AlturaFilaGrillaPx}
                      columnHeaderHeight={AlturaEncabezadoGrillaPx}
                      loading={cargando}
                      disableRowSelectionOnClick
                      pageSizeOptions={[10, 25, 50]}
                      initialState={{
                        pagination: { paginationModel: { pageSize: 10, page: 0 } },
                        sorting: { sortModel: [{ field: 'id', sort: 'desc' }] }
                      }}
                      sx={{ minHeight: 360 }}
                    />
                  </div>
                </ThemeProvider>
              ) : null}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-sm cowork-btn-filtro-alt" onClick={onCerrar}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" onClick={onCerrar} aria-hidden="true" />
    </>
  );
}
