import * as React from 'react';

const ClaseEtiqueta = 'form-label cowork-modal-solicitud-falla__etiqueta mb-1';
const ClaseControl = 'form-control form-control-sm cowork-modal-solicitud-falla__control';
const ClaseAyuda = 'cowork-modal-solicitud-falla__ayuda-campo d-block mt-1';

export type SeccionAccionGestionSolicitudFallaProps = {
  marcarFinalizada: boolean;
  observaciones: string;
  deshabilitado?: boolean;
  onCambioMarcarFinalizada: (valor: boolean) => void;
  onCambioObservaciones: (valor: string) => void;
};

export default function SeccionAccionGestionSolicitudFalla(
  props: SeccionAccionGestionSolicitudFallaProps
): React.ReactElement {
  const {
    marcarFinalizada,
    observaciones,
    deshabilitado,
    onCambioMarcarFinalizada,
    onCambioObservaciones
  } = props;

  return (
    <div className="card mb-3 cowork-modal-solicitud-falla__tarjeta">
      <div className="card-header cowork-modal-solicitud-falla__tarjeta-encabezado cowork-modal-solicitud-falla__tarjeta-encabezado--accion-gestion py-2">
        <h3 className="h6 mb-0 cowork-modal-solicitud-falla__tarjeta-titulo cowork-modal-solicitud-falla__tarjeta-titulo--accion-gestion">
          <i className="bi bi-list-task me-2" aria-hidden="true" />
          Acción de Gestión
        </h3>
      </div>
      <div className="card-body cowork-modal-solicitud-falla__tarjeta-cuerpo">
        <div className="alert alert-info py-2 mb-3" role="status">
          <div className="d-flex align-items-start gap-2">
            <i className="bi bi-info-circle flex-shrink-0 mt-1" aria-hidden="true" />
            <span>
              <strong>Importante:</strong> Al marcar como terminada, la solicitud cambiará su estado y no podrá ser
              modificada posteriormente.
            </span>
          </div>
        </div>
        <div className="mb-3">
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="gestionar-falla-finalizada"
              checked={marcarFinalizada}
              disabled={deshabilitado}
              onChange={(evento) => onCambioMarcarFinalizada(evento.target.checked)}
            />
            <label className="form-check-label fw-semibold" htmlFor="gestionar-falla-finalizada">
              Marcar como Finalizada
            </label>
          </div>
          <small className={ClaseAyuda}>La solicitud de falla ha sido resuelta y se puede cerrar</small>
        </div>
        <label className={ClaseEtiqueta} htmlFor="gestionar-falla-observaciones">
          Observaciones (Opcional)
        </label>
        <textarea
          id="gestionar-falla-observaciones"
          className={ClaseControl}
          rows={4}
          disabled={deshabilitado}
          placeholder="Agregue observaciones adicionales sobre el cierre de la solicitud..."
          value={observaciones}
          onChange={(evento) => onCambioObservaciones(evento.target.value)}
        />
      </div>
    </div>
  );
}