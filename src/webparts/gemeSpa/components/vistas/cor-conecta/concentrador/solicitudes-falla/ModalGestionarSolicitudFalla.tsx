import * as React from 'react';
import { useEffect, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { AdjuntoSolicitudFalla, DetalleSolicitudFalla, SolicitudFalla } from '../../../../../models/SolicitudFalla';
import {
  ObtenerAdjuntosSolicitudFalla,
  ObtenerDetalleSolicitudFallaPorId
} from '../../../../../services/sharepoint/solicitudesFalla/SolicitudFallaCrudServicio';
import { FinalizarGestionSolicitudFallaConBitacora } from '../../../../../services/sharepoint/solicitudesFalla/GestionarFinalizacionSolicitudFallaServicio';
import { EstadoSolicitudFallaVigente } from './constantesSolicitudFalla';
import PresentacionDetalleSolicitudFalla from './PresentacionDetalleSolicitudFalla';
import SeccionAccionGestionSolicitudFalla from './SeccionAccionGestionSolicitudFalla';

export type ModalGestionarSolicitudFallaProps = {
  context: WebPartContext;
  fila?: SolicitudFalla;
  visible: boolean;
  onCerrar: () => void;
  onGuardado: () => void;
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

export default function ModalGestionarSolicitudFalla(props: ModalGestionarSolicitudFallaProps): React.ReactElement {
  const { context, fila, visible, onCerrar, onGuardado } = props;
  const [detalle, setDetalle] = useState<DetalleSolicitudFalla | undefined>();
  const [adjuntos, setAdjuntos] = useState<AdjuntoSolicitudFalla[]>([]);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [marcarFinalizada, setMarcarFinalizada] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!visible || !fila) {
      setDetalle(undefined);
      setMarcarFinalizada(false);
      setObservaciones('');
      setError(undefined);
      return undefined;
    }
    let cancelado = false;
    setDetalle(DetalleDesdeFila(fila));
    setCargandoDetalle(true);
    setMarcarFinalizada(false);
    setObservaciones('');
    setError(undefined);

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
          setCargandoDetalle(false);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelado = true;
    };
  }, [context, fila, visible]);

  if (!visible || !fila) {
    return <></>;
  }

  const estadoNoGestionable = fila.estado !== EstadoSolicitudFallaVigente;
  const detalleVisible = detalle ?? DetalleDesdeFila(fila);

  const OnGuardar = (): void => {
    if (estadoNoGestionable) {
      return;
    }
    if (!marcarFinalizada) {
      setError('Marque «Marcar como Finalizada» para continuar.');
      return;
    }
    setError(undefined);
    setGuardando(true);
    FinalizarGestionSolicitudFallaConBitacora(context, {
      idSolicitudFalla: fila.id,
      idBitacoraReferencia: detalleVisible.idBitacora ?? fila.idBitacora,
      observaciones: observaciones.trim()
    })
      .then(() => {
        onGuardado();
        onCerrar();
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'No se pudo finalizar la solicitud.');
      })
      .then(() => setGuardando(false))
      .catch(() => undefined);
  };

  return (
    <>
      <div className="modal fade show d-block" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div className="modal-content cowork-modal-solicitud-falla">
            <div className="modal-header">
              <h2 className="modal-title h5 mb-0 text-white d-flex align-items-center gap-2">
                <i className="bi bi-clipboard-check" aria-hidden="true" />
                Gestionar Solicitud de Falla
              </h2>
              <button
                type="button"
                className="btn-close btn-close-white"
                aria-label="Cerrar"
                onClick={onCerrar}
                disabled={guardando}
              />
            </div>
            <div className="modal-body">
              {estadoNoGestionable ? (
                <p className="cowork-modal-solicitud-falla__texto-apoyo mb-3">
                  Solo se pueden gestionar solicitudes en estado Vigente.
                </p>
              ) : null}
              <PresentacionDetalleSolicitudFalla
                detalle={detalleVisible}
                adjuntos={adjuntos}
                cargando={cargandoDetalle}
                prefijoId="gestionar-falla"
                mostrarIntegracionSiod={false}
              />
              {!estadoNoGestionable ? (
                <SeccionAccionGestionSolicitudFalla
                  marcarFinalizada={marcarFinalizada}
                  observaciones={observaciones}
                  deshabilitado={guardando}
                  onCambioMarcarFinalizada={setMarcarFinalizada}
                  onCambioObservaciones={setObservaciones}
                />
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
                className="btn btn-sm btn-secondary cowork-modal-solicitud-falla__btn-modal-secundario"
                onClick={onCerrar}
                disabled={guardando}
              >
                <i className="bi bi-x-lg me-1" aria-hidden="true" />
                Cancelar
              </button>
              {!estadoNoGestionable ? (
                <button
                  type="button"
                  className="btn btn-sm cowork-btn-exito"
                  onClick={OnGuardar}
                  disabled={guardando}
                >
                  <i className="bi bi-save me-1" aria-hidden="true" />
                  Guardar Solicitud
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" aria-hidden="true" />
    </>
  );
}