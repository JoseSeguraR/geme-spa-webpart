import * as React from 'react';
import { TextoLeyendaFormularioSolicitudFalla } from './constantesSolicitudFalla';

/** Leyenda superior compartida en modales Nueva, Editar y Gestionar. */
export default function BloqueLeyendaFormularioSolicitudFalla(): React.ReactElement {
  return (
    <div className="alert alert-info py-2 mb-3" role="status">
      <div className="d-flex align-items-start gap-2">
        <i className="bi bi-info-circle flex-shrink-0 mt-1" aria-hidden="true" />
        <div className="small mb-0">
          <strong className="d-block mb-1">Leyenda</strong>
          <p className="mb-2">
            Los campos marcados con <span className="text-danger">*</span> son obligatorios.
          </p>
          <p className="mb-0">{TextoLeyendaFormularioSolicitudFalla}</p>
        </div>
      </div>
    </div>
  );
}