import * as React from 'react';

export type ModalFormularioProps = {
  visible: boolean;
  titulo: string;
  /** Ícono Bootstrap del título (p. ej. `bi-building`). */
  icono?: string;
  error?: string;
  guardando?: boolean;
  textoGuardar?: string;
  /** Sin `onGuardar` el pie solo muestra «Cerrar» (modales de consulta). */
  onGuardar?: () => void;
  onCerrar: () => void;
  tamano?: 'sm' | 'lg' | 'xl';
  children: React.ReactNode;
};

/** Carcasa Bootstrap de los formularios de alta y edición (mismo marcado que los modales del Concentrador). */
export default function ModalFormulario(props: ModalFormularioProps): React.ReactElement {
  const {
    visible,
    titulo,
    icono,
    error,
    guardando = false,
    textoGuardar = 'Guardar',
    onGuardar,
    onCerrar,
    tamano,
    children
  } = props;

  if (!visible) {
    return <></>;
  }

  return (
    <>
      <div className="modal fade show d-block" role="dialog" aria-modal="true" aria-label={titulo}>
        <div className={`modal-dialog modal-dialog-scrollable${tamano ? ` modal-${tamano}` : ''}`}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title h5">
                {icono ? <i className={`bi ${icono} me-2`} aria-hidden="true" /> : null}
                {titulo}
              </h2>
              <button type="button" className="btn-close" aria-label="Cerrar" onClick={onCerrar} disabled={guardando} />
            </div>
            <form
              className="modal-body"
              noValidate
              onSubmit={(evento) => {
                evento.preventDefault();
                if (onGuardar && !guardando) {
                  onGuardar();
                }
              }}
            >
              {error ? (
                <div className="alert alert-danger py-2" role="alert">
                  {error}
                </div>
              ) : null}
              {children}
              {/* Enter en un campo envía el formulario. */}
              <button type="submit" className="d-none" tabIndex={-1} aria-hidden="true" />
            </form>
            <div className="modal-footer">
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onCerrar} disabled={guardando}>
                {onGuardar ? 'Cancelar' : 'Cerrar'}
              </button>
              {onGuardar ? (
                <button type="button" className="btn btn-sm cowork-btn-primary" onClick={onGuardar} disabled={guardando}>
                  {guardando ? 'Guardando…' : textoGuardar}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}
