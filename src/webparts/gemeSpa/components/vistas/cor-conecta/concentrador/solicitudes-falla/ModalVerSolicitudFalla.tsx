import * as React from 'react';
import { useEffect, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { AdjuntoSolicitudFalla, DetalleSolicitudFalla, SolicitudFalla } from '../../../../../models/SolicitudFalla';
import {
  ObtenerAdjuntosSolicitudFalla,
  ObtenerDetalleSolicitudFallaPorId
} from '../../../../../services/sharepoint/solicitudesFalla/SolicitudFallaCrudServicio';
import PresentacionDetalleSolicitudFalla from './PresentacionDetalleSolicitudFalla';

export type ModalVerSolicitudFallaProps = {
  context: WebPartContext;
  fila?: SolicitudFalla;
  visible: boolean;
  onCerrar: () => void;
};

function DetalleDesdeFila(
  fila: SolicitudFalla,
  parcial?: Partial<DetalleSolicitudFalla>
): DetalleSolicitudFalla {
  return {
    ...fila,
    equiposIds: parcial?.equiposIds ?? [],
    ...parcial
  };
}

export default function ModalVerSolicitudFalla(props: ModalVerSolicitudFallaProps): React.ReactElement {
  const { context, fila, visible, onCerrar } = props;
  const [detalle, setDetalle] = useState<DetalleSolicitudFalla | undefined>();
  const [adjuntos, setAdjuntos] = useState<AdjuntoSolicitudFalla[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!visible || !fila) {
      setDetalle(undefined);
      return undefined;
    }
    let cancelado = false;
    setDetalle(DetalleDesdeFila(fila));
    setCargando(true);
    Promise.all([
      ObtenerDetalleSolicitudFallaPorId(context, fila.id),
      ObtenerAdjuntosSolicitudFalla(context, fila.id)
    ])
      .then(([det, adj]) => {
        if (!cancelado) {
          setDetalle(
            DetalleDesdeFila(fila, {
              ...det,
              equiposEtiqueta: det.equiposEtiqueta || fila.equiposEtiqueta
            })
          );
          setAdjuntos(adj);
        }
      })
      .catch(() => {
        if (!cancelado) {
          setDetalle(DetalleDesdeFila(fila));
          setAdjuntos([]);
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
  }, [context, fila, visible]);

  if (!visible || !fila || !detalle) {
    return <></>;
  }

  return (
    <>
      <div className="modal fade show d-block" role="dialog" aria-modal="true" aria-labelledby="modal-ver-solicitud-falla-titulo">
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div className="modal-content cowork-modal-solicitud-falla">
            <div className="modal-header">
              <h2 className="modal-title h5 text-white mb-0" id="modal-ver-solicitud-falla-titulo">
                <i className="bi bi-eye me-2" aria-hidden="true" />
                Detalle de Solicitud de Falla
              </h2>
              <button
                type="button"
                className="btn-close btn-close-white"
                aria-label="Cerrar"
                onClick={onCerrar}
              />
            </div>
            <div className="modal-body">
              <PresentacionDetalleSolicitudFalla
                detalle={detalle}
                adjuntos={adjuntos}
                cargando={cargando}
                prefijoId="ver-falla"
              />
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
      <div className="modal-backdrop fade show" onClick={onCerrar} aria-hidden="true" />
    </>
  );
}