import * as React from 'react';

export type AlertaResultadoSiodFalla = {
  tipo: 'success' | 'warning' | 'info';
  texto: string;
};

export type PieProgresoFormularioSolicitudFallaProps = {
  procesando: boolean;
  mensajeActual?: string;
  historial?: readonly string[];
  alertasSiod?: readonly AlertaResultadoSiodFalla[];
};

export default function PieProgresoFormularioSolicitudFalla(
  props: PieProgresoFormularioSolicitudFallaProps
): React.ReactElement {
  const { procesando, mensajeActual, historial, alertasSiod } = props;
  const tieneHistorial = (historial?.length ?? 0) > 0;
  const tieneAlertas = (alertasSiod?.length ?? 0) > 0;

  if (!procesando && !tieneHistorial && !tieneAlertas) {
    return <></>;
  }

  return (
    <div className="cowork-modal-solicitud-falla__alertas-pie">
      {procesando ? (
        <div className="cowork-formulario-progreso" role="status" aria-live="polite" aria-busy="true">
          <div className="spinner-border spinner-border-sm text-primary" aria-hidden="true" />
          <span className="cowork-formulario-progreso__texto">{mensajeActual ?? 'Procesando…'}</span>
        </div>
      ) : null}
      {tieneHistorial ? (
        <ul className="list-unstyled mb-2 cowork-modal-solicitud-falla__historial-proceso" aria-live="polite">
          {historial?.map((linea, indice) => (
            <li key={`${indice}-${linea}`} className="d-flex align-items-start gap-2 mb-1">
              <i className="bi bi-check-circle-fill text-success flex-shrink-0" aria-hidden="true" />
              <span>{linea}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {alertasSiod?.map((alerta, indice) => (
        <div
          key={`siod-${indice}`}
          className={`alert py-2 mb-2 cowork-modal-solicitud-falla__alerta-progreso ${
            alerta.tipo === 'success' ? 'alert-success' : alerta.tipo === 'warning' ? 'alert-warning' : 'alert-info'
          }`}
          role="status"
        >
          {alerta.texto}
        </div>
      ))}
    </div>
  );
}