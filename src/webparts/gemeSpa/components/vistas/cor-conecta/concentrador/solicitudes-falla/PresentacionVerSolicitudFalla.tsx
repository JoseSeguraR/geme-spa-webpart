import * as React from 'react';
import { EstadoSolicitudFallaFinalizada, EstadoSolicitudFallaVigente } from './constantesSolicitudFalla';

export type TarjetaSeccionVerSolicitudFallaProps = {
  titulo: string;
  iconoBootstrap: string;
  children: React.ReactNode;
  idTitulo?: string;
};

export function TarjetaSeccionVerSolicitudFalla(props: TarjetaSeccionVerSolicitudFallaProps): React.ReactElement {
  const { titulo, iconoBootstrap, children, idTitulo } = props;
  return (
    <div className="card mb-3 cowork-modal-solicitud-falla__tarjeta">
      <div className="card-header cowork-modal-solicitud-falla__tarjeta-encabezado py-2">
        <h3 className="h6 mb-0 cowork-modal-solicitud-falla__tarjeta-titulo" id={idTitulo}>
          <i className={`bi ${iconoBootstrap} me-2`} aria-hidden="true" />
          {titulo}
        </h3>
      </div>
      <div className="card-body cowork-modal-solicitud-falla__tarjeta-cuerpo">{children}</div>
    </div>
  );
}

/** Filas de campos con gutter Bootstrap (`g-3`); en `md+` cada columna ocupa 4/12 (3 por fila). */
export function GrillaCamposVerSolicitudFalla(props: { children: React.ReactNode }): React.ReactElement {
  return <div className="row g-3 cowork-modal-solicitud-falla__grilla">{props.children}</div>;
}

export type ColumnaCampoVerSolicitudFallaProps = {
  children: React.ReactNode;
  /** Textarea y bloques anchos: una fila completa (`col-12`). */
  anchoCompleto?: boolean;
};

export function ColumnaCampoVerSolicitudFalla(props: ColumnaCampoVerSolicitudFallaProps): React.ReactElement {
  const { children, anchoCompleto } = props;
  const claseColumna = anchoCompleto ? 'col-12' : 'col-12 col-md-4';
  return <div className={claseColumna}>{children}</div>;
}

export type CampoLecturaVerSolicitudFallaProps = {
  id?: string;
  etiqueta: string;
  valor: string;
  multilinea?: boolean;
  filas?: number;
};

export function CampoLecturaVerSolicitudFalla(props: CampoLecturaVerSolicitudFallaProps): React.ReactElement {
  const { id, etiqueta, valor, multilinea, filas = 3 } = props;
  return (
    <div className="cowork-modal-solicitud-falla__campo-contenedor">
      <label className="form-label cowork-modal-solicitud-falla__etiqueta mb-1" htmlFor={id}>
        {etiqueta}
      </label>
      {multilinea ? (
        <textarea
          id={id}
          className="form-control form-control-sm cowork-modal-solicitud-falla__campo"
          rows={filas}
          readOnly
          value={valor}
        />
      ) : (
        <input
          id={id}
          type="text"
          className="form-control form-control-sm cowork-modal-solicitud-falla__campo"
          readOnly
          value={valor}
        />
      )}
    </div>
  );
}

export function BloqueEstadoAlertaVerSolicitudFalla(props: { estado: string }): React.ReactElement {
  const { estado } = props;
  const esVigente = estado === EstadoSolicitudFallaVigente;
  const esFinalizada = estado === EstadoSolicitudFallaFinalizada;
  const claseAlerta = esVigente ? 'alert-primary' : esFinalizada ? 'alert-success' : 'alert-secondary';
  const claseInsignia = esVigente ? 'bg-primary' : esFinalizada ? 'bg-success' : 'bg-secondary';
  const descripcion = esVigente
    ? 'La solicitud está activa y puede ser gestionada'
    : esFinalizada
      ? 'La solicitud ha sido cerrada'
      : 'Estado de la solicitud';

  return (
    <div className={`alert ${claseAlerta} mb-0 d-flex align-items-start gap-2`} role="status">
      <i className="bi bi-circle-fill small mt-1" aria-hidden="true" />
      <div>
        <span>
          <strong>Estado:</strong>{' '}
          <span className={`badge ${claseInsignia} ms-1`}>{estado}</span>
        </span>
        <small className="d-block mt-1 cowork-modal-solicitud-falla__texto-apoyo">{descripcion}</small>
      </div>
    </div>
  );
}

export function InsigniaIntegracionSiodVerFalla(props: { integrado: boolean }): React.ReactElement {
  const { integrado } = props;
  if (integrado) {
    return (
      <span className="badge bg-success cowork-modal-solicitud-falla__insignia fw-normal">
        <i className="bi bi-check-circle me-1" aria-hidden="true" />
        Integrado a SIOD
      </span>
    );
  }
  return (
    <span className="badge bg-warning text-dark cowork-modal-solicitud-falla__insignia fw-normal">
      <i className="bi bi-exclamation-circle me-1" aria-hidden="true" />
      No integrado
    </span>
  );
}

export function ResolverTextoResultadoIntegracionSiod(integrado: boolean, resultado?: string): string {
  if (!integrado) {
    return '';
  }
  if (resultado?.trim()) {
    return resultado.trim();
  }
  return 'Integración Exitosa';
}