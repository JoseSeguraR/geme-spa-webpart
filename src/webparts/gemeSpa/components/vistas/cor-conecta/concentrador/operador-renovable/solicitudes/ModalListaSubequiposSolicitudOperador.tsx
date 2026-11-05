import * as React from 'react';
import { useEffect, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { SolicitudOperadorRenovableFila } from '../../../../../../models/operadorRenovable/SolicitudOperadorRenovable';
import type { IndisponibilidadSubequipoSolicitud } from '../../../../../../models/operadorRenovable/SolicitudOperadorRenovable';
import { ObtenerIndisponibilidadesPorSolicitud } from '../../../../../../services/sharepoint/operadorRenovable/IndisponibilidadesSolicitudServicio';
import { SharePointRestError } from '../../../../../../services/sharepoint/SharePointRestError';
import { ItemListaSubequipoSolicitud } from './UiGrillaSolicitudesOperadorRenovable';

export type ModalListaSubequiposSolicitudOperadorProps = {
  context: WebPartContext;
  solicitud?: SolicitudOperadorRenovableFila;
  visible: boolean;
  onCerrar: () => void;
};

export default function ModalListaSubequiposSolicitudOperador(
  props: ModalListaSubequiposSolicitudOperadorProps
): React.ReactElement {
  const { context, solicitud, visible, onCerrar } = props;
  const [filas, setFilas] = useState<IndisponibilidadSubequipoSolicitud[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!visible || !solicitud) {
      setFilas([]);
      return undefined;
    }

    if (solicitud.subequipos.length > 0) {
      setFilas(solicitud.subequipos);
      setCargando(false);
      setError(undefined);
      return undefined;
    }

    let cancelado = false;
    setCargando(true);
    setError(undefined);

    ObtenerIndisponibilidadesPorSolicitud(context, solicitud.id)
      .then((resultado) => {
        if (!cancelado) {
          setFilas(resultado);
        }
      })
      .catch((err) => {
        if (!cancelado) {
          const mensaje =
            err instanceof SharePointRestError ? err.message : 'No se pudo cargar la lista de equipos.';
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
  }, [context, solicitud, visible]);

  if (!visible || !solicitud) {
    return <></>;
  }

  const cantidad = filas.length || solicitud.cantidadSubequipos;
  const resumenCentral = `${solicitud.central || 'Sin central'} · ${cantidad} equipo${cantidad === 1 ? '' : 's'}`;

  return (
    <>
      <div className="modal fade show d-block modal-operador-renovable" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header bg-info text-white">
              <h2 className="modal-title h5 mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-solar-panel" aria-hidden="true" />
                Equipos de solicitud #{solicitud.id}
              </h2>
              <button
                type="button"
                className="btn-close btn-close-white"
                aria-label="Cerrar"
                onClick={onCerrar}
              />
            </div>
            <div className="modal-body">
              <p className="text-muted small mb-2">{resumenCentral}</p>
              {error ? <div className="alert alert-danger py-2">{error}</div> : null}
              {cargando ? <p className="text-muted mb-0">Cargando…</p> : null}
              {!cargando && filas.length > 0 ? (
                <ul className="or-sol-inv-list mb-0 list-unstyled">
                  {filas.map((fila) => (
                    <ItemListaSubequipoSolicitud key={fila.id} subequipo={fila} />
                  ))}
                </ul>
              ) : null}
              {!cargando && !error && filas.length === 0 ? (
                <p className="text-muted mb-0">Sin equipos</p>
              ) : null}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-sm btn-secondary" onClick={onCerrar}>
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
