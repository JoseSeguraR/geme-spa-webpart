import * as React from 'react';
import { useEffect, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type {
  FilaBitacoraLimitacionSubestacion,
  LimitacionSubestacionOperador
} from '../../../../../../models/operadorRenovable/LimitacionSubestacionOperador';
import { ObtenerBitacoraLimitacionSubestacion } from '../../../../../../services/sharepoint/operadorRenovable/BitacoraSubestacionServicio';
import { SharePointRestError } from '../../../../../../services/sharepoint/SharePointRestError';
import { FormatearFechaHoraVisible } from '../../solicitudes-il/UtilidadesFechaSolicitudIl';

export type ModalBitacoraLimitacionSubestacionProps = {
  context: WebPartContext;
  limitacion?: LimitacionSubestacionOperador;
  visible: boolean;
  onCerrar: () => void;
};

export default function ModalBitacoraLimitacionSubestacion(
  props: ModalBitacoraLimitacionSubestacionProps
): React.ReactElement {
  const { context, limitacion, visible, onCerrar } = props;
  const [filas, setFilas] = useState<FilaBitacoraLimitacionSubestacion[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!visible || !limitacion) {
      setFilas([]);
      setError(undefined);
      return undefined;
    }

    let cancelado = false;
    setCargando(true);
    setError(undefined);

    ObtenerBitacoraLimitacionSubestacion(context, limitacion.id)
      .then((resultado) => {
        if (!cancelado) {
          setFilas(resultado);
        }
      })
      .catch((err) => {
        if (!cancelado) {
          const mensaje =
            err instanceof SharePointRestError ? err.message : 'No se pudo cargar la bitácora de la limitación.';
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
  }, [context, limitacion, visible]);

  if (!visible || !limitacion) {
    return <></>;
  }

  return (
    <>
      <div className="modal fade show d-block" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title h5">Bitácora PGL — {limitacion.central}</h2>
              <button type="button" className="btn-close" aria-label="Cerrar" onClick={onCerrar} />
            </div>
            <div className="modal-body">
              {error ? <div className="alert alert-danger py-2">{error}</div> : null}
              {cargando ? <p className="text-muted">Cargando eventos…</p> : null}
              {!cargando && filas.length === 0 ? (
                <p className="text-muted mb-0">
                  Sin eventos en bitácora (la lista puede no estar provisionada aún en el sitio).
                </p>
              ) : null}
              {!cargando && filas.length > 0 ? (
                <ul className="list-group list-group-flush">
                  {filas.map((fila) => (
                    <li key={fila.id} className="list-group-item px-0">
                      <div className="fw-semibold">{fila.accion}</div>
                      <div className="small text-muted">
                        {FormatearFechaHoraVisible(fila.fecha) || '—'} · {fila.usuario}
                      </div>
                      <div className="small">
                        {fila.estadoAnterior} → {fila.estadoNuevo}
                      </div>
                      {fila.descripcion ? <div className="small mt-1">{fila.descripcion}</div> : null}
                    </li>
                  ))}
                </ul>
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
      <div className="modal-backdrop fade show" />
    </>
  );
}
