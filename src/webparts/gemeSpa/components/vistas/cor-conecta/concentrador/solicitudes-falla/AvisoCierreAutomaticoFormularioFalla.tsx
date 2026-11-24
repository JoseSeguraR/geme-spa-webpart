import * as React from 'react';

export type AvisoCierreAutomaticoFormularioFallaProps = {
  conError: boolean;
};

export default function AvisoCierreAutomaticoFormularioFalla(
  props: AvisoCierreAutomaticoFormularioFallaProps
): React.ReactElement {
  const { conError } = props;
  return (
    <div
      className="alert alert-secondary py-2 mb-0 small cowork-modal-solicitud-falla__aviso-cierre-auto"
      role="status"
      aria-live="polite"
    >
      {conError
        ? 'Revise los mensajes de error o advertencia. Este formulario se cerrará automáticamente en unos segundos.'
        : 'Operación completada. Este formulario se cerrará automáticamente en breve.'}
    </div>
  );
}