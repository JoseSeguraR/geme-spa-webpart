import * as React from 'react';
import { useEffect, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import {
  ObtenerDetalleSolicitudFallaOperador,
  type DetalleSolicitudFallaOperador
} from '../../../../../../services/sharepoint/operadorRenovable/DetalleSolicitudFallaServicio';
import { SharePointRestError } from '../../../../../../services/sharepoint/SharePointRestError';

export type ModalVerSolicitudFallaOperadorProps = {
  context: WebPartContext;
  solicitudFallaId?: number;
  visible: boolean;
  onCerrar: () => void;
};

function CampoDetalle(props: { etiqueta: string; valor: React.ReactNode }): React.ReactElement {
  return (
    <div className="cowork-formulario-detalle__campo">
      <span className="cowork-formulario-detalle__etiqueta">{props.etiqueta}</span>
      <span className="cowork-formulario-detalle__valor">{props.valor}</span>
    </div>
  );
}

export default function ModalVerSolicitudFallaOperador(
  props: ModalVerSolicitudFallaOperadorProps
): React.ReactElement {
  const { context, solicitudFallaId, visible, onCerrar } = props;
  const [detalle, setDetalle] = useState<DetalleSolicitudFallaOperador | undefined>(undefined);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!visible || typeof solicitudFallaId !== 'number') {
      setDetalle(undefined);
      setError(undefined);
      return undefined;
    }
    let cancelado = false;
    setCargando(true);
    setError(undefined);
    ObtenerDetalleSolicitudFallaOperador(context, solicitudFallaId)
      .then((resultado) => {
        if (!cancelado) {
          setDetalle(resultado);
          if (!resultado) {
            setError('No se encontró la solicitud de falla.');
          }
        }
      })
      .catch((err) => {
        if (!cancelado) {
          setError(err instanceof SharePointRestError ? err.message : 'Error al cargar la solicitud de falla.');
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
  }, [context, solicitudFallaId, visible]);

  if (!visible) {
    return <></>;
  }

  return (
    <>
      <div className="modal fade show d-block" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title h5">Solicitud de falla {detalle?.idCen ?? ''}</h2>
              <button type="button" className="btn-close" aria-label="Cerrar" onClick={onCerrar} />
            </div>
            <div className="modal-body">
              {cargando ? <p className="text-muted mb-0">Cargando…</p> : null}
              {error ? <div className="alert alert-danger py-2">{error}</div> : null}
              {detalle ? (
                <div className="cowork-formulario-detalle row g-3">
                  <div className="col-md-6">
                    <CampoDetalle etiqueta="ID CEN" valor={detalle.idCen} />
                  </div>
                  <div className="col-md-6">
                    <CampoDetalle etiqueta="Estado" valor={detalle.estado} />
                  </div>
                  <div className="col-12">
                    <CampoDetalle etiqueta="Central" valor={detalle.central} />
                  </div>
                  <div className="col-md-6">
                    <CampoDetalle etiqueta="Potencia" valor={detalle.potencia} />
                  </div>
                  <div className="col-md-6">
                    <CampoDetalle etiqueta="Perturbación" valor={detalle.fechaPerturbacion} />
                  </div>
                  <div className="col-md-6">
                    <CampoDetalle etiqueta="Retorno efectivo" valor={detalle.fechaRetorno} />
                  </div>
                  <div className="col-12">
                    <CampoDetalle etiqueta="Descripción" valor={detalle.descripcion || '—'} />
                  </div>
                </div>
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
