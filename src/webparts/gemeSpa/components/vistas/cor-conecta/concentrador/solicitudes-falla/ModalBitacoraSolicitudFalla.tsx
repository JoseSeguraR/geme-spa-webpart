import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import { ThemeProvider } from '@mui/material/styles';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { TemaGrillaGeme } from '../../../../grilla/TemaGrillaMui';
import { AlturaEncabezadoGrillaPx, AlturaFilaGrillaPx } from '../../../../../models/GrillaServidor';
import type { FilaBitacoraEngine } from '../../../../../models/concentradorComun/FilaBitacoraEngine';
import { FormatearFechaHoraVisible } from '../../../../../utils/FechaHoraCorConecta';
import { ObtenerFilasBitacoraSolicitudFalla } from '../../../../../services/sharepoint/solicitudesFalla/BitacoraSolicitudFallaServicio';
import { SharePointRestError } from '../../../../../services/sharepoint/SharePointRestError';
import { BloqueEstadoSolicitudFalla } from './PresentacionEstadoSolicitudFalla';

export type ModalBitacoraSolicitudFallaProps = {
  context: WebPartContext;
  idSolicitudFalla?: number;
  idCen?: string;
  visible: boolean;
  onCerrar: () => void;
};

type FilaGrillaBitacora = FilaBitacoraEngine & { id: number };

function CeldaTexto(valor: string): React.ReactElement {
  return <span>{valor || '—'}</span>;
}

function CeldaFecha(valor: string): React.ReactElement {
  const visible = FormatearFechaHoraVisible(valor);
  return <span>{visible || '—'}</span>;
}

function CeldaMultilinea(valor: string): React.ReactElement {
  const texto = valor?.trim() || '—';
  return <span className="cowork-celda-texto-largo">{texto}</span>;
}

function CeldaEstadoInicial(valor: string): React.ReactElement {
  const estado = valor?.trim();
  if (!estado) {
    return <span>—</span>;
  }
  return <BloqueEstadoSolicitudFalla estado={estado} />;
}

function ResolverEstadoActualDesdeBitacora(filas: readonly FilaGrillaBitacora[]): string {
  if (filas.length === 0) {
    return '—';
  }
  const ultima = [...filas].sort((a, b) => b.id - a.id)[0];
  const estadoFinal = ultima.estadoFinal?.trim();
  if (estadoFinal) {
    return estadoFinal;
  }
  const estadoInicial = ultima.estadoInicial?.trim();
  return estadoInicial || '—';
}

export default function ModalBitacoraSolicitudFalla(props: ModalBitacoraSolicitudFallaProps): React.ReactElement {
  const { context, idSolicitudFalla, idCen, visible, onCerrar } = props;
  const [filas, setFilas] = useState<FilaGrillaBitacora[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const Cargar = useCallback(() => {
    if (idSolicitudFalla === undefined) {
      return;
    }
    setCargando(true);
    setError(undefined);
    ObtenerFilasBitacoraSolicitudFalla(context, idSolicitudFalla)
      .then((resultado) => setFilas(resultado.map((fila) => ({ ...fila, id: fila.id }))))
      .catch((err) => {
        setError(err instanceof SharePointRestError ? err.message : 'No se pudo cargar la bitácora.');
        setFilas([]);
      })
      .then(() => setCargando(false))
      .catch(() => undefined);
  }, [context, idSolicitudFalla]);

  useEffect(() => {
    if (visible && idSolicitudFalla !== undefined) {
      Cargar();
    } else {
      setFilas([]);
    }
  }, [visible, idSolicitudFalla, Cargar]);

  const columnas: GridColDef<FilaGrillaBitacora>[] = useMemo(
    () => [
      { field: 'id', headerName: 'ID', width: 72 },
      {
        field: 'tareaIdentificador',
        headerName: 'Tarea',
        minWidth: 140,
        flex: 1,
        renderCell: (params) => CeldaTexto(String(params.value ?? ''))
      },
      {
        field: 'fechaInicioTarea',
        headerName: 'Fecha Inicio',
        minWidth: 150,
        flex: 1,
        renderCell: (params) => CeldaFecha(String(params.value ?? ''))
      },
      {
        field: 'estadoInicial',
        headerName: 'Estado Inicial',
        minWidth: 120,
        flex: 0.9,
        cellClassName: 'cowork-celda-autoajustada',
        renderCell: (params) => CeldaEstadoInicial(String(params.value ?? ''))
      },
      {
        field: 'responsablesOrigen',
        headerName: 'Responsable',
        minWidth: 160,
        flex: 1.1,
        cellClassName: 'cowork-celda-texto-largo',
        renderCell: (params) => CeldaMultilinea(String(params.value ?? ''))
      },
      {
        field: 'usuarioAvance',
        headerName: 'Responsable Avance',
        minWidth: 130,
        flex: 1,
        renderCell: (params) => CeldaTexto(String(params.value ?? ''))
      },
      {
        field: 'fechaCierre',
        headerName: 'Fecha Cierre',
        minWidth: 150,
        flex: 1,
        renderCell: (params) => CeldaFecha(String(params.value ?? ''))
      },
      {
        field: 'responsableComentarios',
        headerName: 'Observaciones',
        minWidth: 160,
        flex: 1.1,
        cellClassName: 'cowork-celda-texto-largo',
        renderCell: (params) => CeldaMultilinea(String(params.value ?? ''))
      }
    ],
    []
  );

  const estadoActual = useMemo(() => ResolverEstadoActualDesdeBitacora(filas), [filas]);
  const etiquetaSolicitud = idCen?.trim() || (idSolicitudFalla !== undefined ? `#${idSolicitudFalla}` : '—');

  if (!visible || idSolicitudFalla === undefined) {
    return <></>;
  }

  return (
    <>
      <div className="modal fade show d-block" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div className="modal-content cowork-modal-solicitud-falla">
            <div className="modal-header">
              <h2 className="modal-title h5 mb-0 text-white d-flex align-items-center gap-2">
                <i className="bi bi-journal-text" aria-hidden="true" />
                Bitácora de Solicitud de Falla
              </h2>
              <button type="button" className="btn-close btn-close-white" aria-label="Cerrar" onClick={onCerrar} />
            </div>
            <div className="modal-body">
              <div className="alert alert-info py-2 mb-3" role="status">
                <div className="d-flex flex-wrap align-items-center gap-3">
                  <i className="bi bi-info-circle flex-shrink-0" aria-hidden="true" />
                  <span>
                    <strong>Solicitud:</strong> {etiquetaSolicitud}
                  </span>
                  <span className="d-inline-flex align-items-center gap-2">
                    <strong>Estado actual:</strong>
                    {estadoActual === '—' ? (
                      <span className="text-muted">—</span>
                    ) : (
                      <BloqueEstadoSolicitudFalla estado={estadoActual} />
                    )}
                  </span>
                </div>
              </div>
              {!error && !cargando && filas.length === 0 ? (
                <p className="cowork-modal-solicitud-falla__texto-apoyo mb-0">No hay registros de bitácora para esta solicitud.</p>
              ) : null}
              {!error && (cargando || filas.length > 0) ? (
                <ThemeProvider theme={TemaGrillaGeme}>
                  <div className="cowork-vista-tabla-mui cowork-vista-tabla-mui--modal-bitacora cowork-vista-tabla-mui--multilinea cowork-vista-tabla-mui--celdas-superior">
                    <DataGrid
                      rows={filas}
                      columns={columnas}
                      rowHeight={AlturaFilaGrillaPx}
                      getRowHeight={() => 'auto'}
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
              {error ? (
                <div className="cowork-modal-solicitud-falla__alertas-pie">
                  <div className="alert alert-danger py-2 mb-0" role="alert">
                    {error}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-sm btn-secondary cowork-modal-solicitud-falla__btn-cerrar"
                onClick={onCerrar}
              >
                <i className="bi bi-x-lg me-1" aria-hidden="true" />
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" aria-hidden="true" />
    </>
  );
}