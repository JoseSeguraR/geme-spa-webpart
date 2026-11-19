import * as React from 'react';
import {
  ColumnaCampoVerSolicitudFalla,
  GrillaCamposVerSolicitudFalla
} from './PresentacionVerSolicitudFalla';

const ClaseEtiqueta = 'form-label cowork-modal-solicitud-falla__etiqueta mb-1';
const ClaseControl = 'form-control form-control-sm cowork-modal-solicitud-falla__control';
const ClaseAyuda = 'cowork-modal-solicitud-falla__ayuda-campo d-block mt-1';

export type SeccionCargarAdjuntosNuevosSolicitudFallaProps = {
  idAdjuntos: string;
  archivosAdjuntos: File[];
  onCambioArchivosAdjuntos: (archivos: File[]) => void;
  deshabilitado?: boolean;
};

/** Carga de adjuntos nuevos (paridad con el bloque del formulario Nueva). */
export default function SeccionCargarAdjuntosNuevosSolicitudFalla(
  props: SeccionCargarAdjuntosNuevosSolicitudFallaProps
): React.ReactElement {
  const { idAdjuntos, archivosAdjuntos, onCambioArchivosAdjuntos, deshabilitado } = props;

  return (
    <GrillaCamposVerSolicitudFalla>
      <ColumnaCampoVerSolicitudFalla anchoCompleto>
        <div className="cowork-modal-solicitud-falla__campo-contenedor">
          <label className={ClaseEtiqueta} htmlFor={idAdjuntos}>
            Archivos
          </label>
          <input
            id={idAdjuntos}
            type="file"
            className={ClaseControl}
            multiple
            disabled={deshabilitado}
            accept=".pdf,.zip,.cfg,.dat,application/pdf,application/zip"
            onChange={(evento) => onCambioArchivosAdjuntos(Array.from(evento.target.files ?? []))}
          />
          <small className={ClaseAyuda}>Formatos permitidos: PDF, ZIP, CFG, DAT</small>
          {archivosAdjuntos.length > 0 ? (
            <ul className="list-group cowork-modal-solicitud-falla__adjuntos mt-2 mb-0">
              {archivosAdjuntos.map((archivo) => (
                <li key={`${archivo.name}-${archivo.size}`} className="list-group-item py-1">
                  <span className="cowork-modal-solicitud-falla__texto-adjunto d-flex align-items-center gap-2">
                    <i className="bi bi-file-earmark" aria-hidden="true" />
                    {archivo.name}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </ColumnaCampoVerSolicitudFalla>
    </GrillaCamposVerSolicitudFalla>
  );
}