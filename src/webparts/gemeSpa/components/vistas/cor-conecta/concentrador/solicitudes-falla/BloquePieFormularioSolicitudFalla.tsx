import * as React from 'react';
import { forwardRef } from 'react';
import AvisoCierreAutomaticoFormularioFalla from './AvisoCierreAutomaticoFormularioFalla';
import PieProgresoFormularioSolicitudFalla, {
  type AlertaResultadoSiodFalla
} from './PieProgresoFormularioSolicitudFalla';

export type BloquePieFormularioSolicitudFallaProps = {
  procesando: boolean;
  mensajeActual?: string;
  historial?: readonly string[];
  alertasSiod?: readonly AlertaResultadoSiodFalla[];
  esperandoCierreAutomatico: boolean;
  cierreAutomaticoConError: boolean;
};

const BloquePieFormularioSolicitudFalla = forwardRef<HTMLDivElement, BloquePieFormularioSolicitudFallaProps>(
  function BloquePieFormularioSolicitudFalla(props, ref): React.ReactElement {
    const {
      procesando,
      mensajeActual,
      historial,
      alertasSiod,
      esperandoCierreAutomatico,
      cierreAutomaticoConError
    } = props;

    const hayProgreso =
      procesando ||
      (historial?.length ?? 0) > 0 ||
      (alertasSiod?.length ?? 0) > 0 ||
      esperandoCierreAutomatico;

    if (!hayProgreso) {
      return <></>;
    }

    return (
      <div ref={ref} className="cowork-modal-solicitud-falla__pie-formulario">
        <PieProgresoFormularioSolicitudFalla
          procesando={procesando}
          mensajeActual={mensajeActual}
          historial={historial}
          alertasSiod={alertasSiod}
        />
        {esperandoCierreAutomatico ? (
          <AvisoCierreAutomaticoFormularioFalla conError={cierreAutomaticoConError} />
        ) : null}
      </div>
    );
  }
);

export default BloquePieFormularioSolicitudFalla;