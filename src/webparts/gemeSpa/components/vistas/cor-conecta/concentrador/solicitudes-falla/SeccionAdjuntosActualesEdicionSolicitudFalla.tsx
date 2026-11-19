import * as React from 'react';
import type { AdjuntoSolicitudFalla } from '../../../../../models/SolicitudFalla';
import { IconoAdjuntoPorNombre } from './UtilidadesAdjuntosSolicitudFalla';

export type SeccionAdjuntosActualesEdicionSolicitudFallaProps = {
  adjuntos: readonly AdjuntoSolicitudFalla[];
  cargando: boolean;
  deshabilitado?: boolean;
  onEliminar: (nombreArchivo: string) => void;
};

export default function SeccionAdjuntosActualesEdicionSolicitudFalla(
  props: SeccionAdjuntosActualesEdicionSolicitudFallaProps
): React.ReactElement {
  const { adjuntos, cargando, deshabilitado, onEliminar } = props;

  if (cargando) {
    return <p className="cowork-modal-solicitud-falla__texto-apoyo mb-0">Cargando adjuntos…</p>;
  }

  if (adjuntos.length === 0) {
    return <p className="cowork-modal-solicitud-falla__texto-apoyo mb-0">Sin archivos adjuntos</p>;
  }

  return (
    <ul className="list-group cowork-modal-solicitud-falla__adjuntos mb-0">
      {adjuntos.map((adjunto) => (
        <li
          key={adjunto.nombreArchivo}
          className="list-group-item d-flex flex-wrap align-items-center justify-content-between gap-2 py-2"
        >
          <span className="text-break d-flex align-items-center gap-2 cowork-modal-solicitud-falla__texto-adjunto">
            <i className={`bi ${IconoAdjuntoPorNombre(adjunto.nombreArchivo)}`} aria-hidden="true" />
            {adjunto.nombreArchivo}
          </span>
          <div className="d-flex flex-wrap gap-2">
            <a
              className="btn btn-sm cowork-btn-exito text-nowrap"
              href={adjunto.urlDescarga}
              download={adjunto.nombreArchivo}
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="bi bi-download me-1" aria-hidden="true" />
              Descargar
            </a>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger text-nowrap"
              disabled={deshabilitado}
              onClick={() => onEliminar(adjunto.nombreArchivo)}
            >
              <i className="bi bi-trash me-1" aria-hidden="true" />
              Eliminar
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}