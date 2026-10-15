import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import { TemaGrillaGeme } from '../../../../grilla/TemaGrillaMui';
import { AlturaEncabezadoGrillaPx, AlturaFilaGrillaPx } from '../../../../../models/GrillaServidor';
import type { FilaBitacoraSolicitudIl } from '../../../../../models/BitacoraSolicitudIl';
import { ObtenerFilasBitacoraSolicitudIl } from '../../../../../services/sharepoint/solicitudesIl/BitacoraListaServicio';
import { SharePointRestError } from '../../../../../services/sharepoint/SharePointRestError';
import { FormatearFechaHoraVisible } from './UtilidadesFechaSolicitudIl';

export type ModalBitacoraSolicitudIlProps = {
  context: WebPartContext;
  idSolicitudIl: number | null;
  visible: boolean;
  onCerrar: () => void;
};

type FilaGrillaBitacora = FilaBitacoraSolicitudIl & { id: number };

function CeldaTexto(valor: string): React.ReactElement {
  return <span>{valor || '—'}</span>;
}

function CeldaFecha(valor: string): React.ReactElement {
  const visible = FormatearFechaHoraVisible(valor);
  return <span>{visible || '—'}</span>;
}

export default function ModalBitacoraSolicitudIl(props: ModalBitacoraSolicitudIlProps): React.ReactElement | null {
  const { context, idSolicitudIl, visible, onCerrar } = props;
  const [filas, setFilas] = useState<FilaGrillaBitacora[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!visible || idSolicitudIl === null) {
      setFilas([]);
      setError(undefined);
      return undefined;
    }

    let cancelado = false;
    setCargando(true);
    setError(undefined);

    ObtenerFilasBitacoraSolicitudIl(context, idSolicitudIl)
      .then((resultado) => {
        if (!cancelado) {
          setFilas(resultado.map((fila) => ({ ...fila, id: fila.id })));
        }
      })
      .catch((err) => {
        if (!cancelado) {
          const mensaje =
            err instanceof SharePointRestError
              ? err.message
              : 'No se pudo cargar la bitácora de la solicitud.';
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
  }, [context, idSolicitudIl, visible]);

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

  if (!visible || idSolicitudIl === null) {
    return null;
  }

  return (
    <>
      <div
        className="modal fade show d-block"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-bitacora-solicitud-il-titulo"
      >
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title h5" id="modal-bitacora-solicitud-il-titulo">
                Bitácora — Solicitud IL #{idSolicitudIl}
              </h2>
              <button type="button" className="btn-close" aria-label="Cerrar" onClick={onCerrar} />
            </div>
            <div className="modal-body">
              {error ? <div className="alert alert-danger py-2">{error}</div> : null}
              {!error && !cargando && filas.length === 0 ? (
                <p className="text-muted mb-0">No hay registros de bitácora para esta solicitud.</p>
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
