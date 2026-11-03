import * as React from 'react';
import type { DisponibilidadSubequipoOperador } from '../constantesOperadorRenovable';
import type { IndisponibilidadSubequipoSolicitud } from '../../../../../../models/operadorRenovable/SolicitudOperadorRenovable';

export function PuntoEstadoSubequipoSolicitud(props: {
  disponibilidad: DisponibilidadSubequipoOperador;
  dadoDeBaja?: boolean;
}): React.ReactElement {
  const { disponibilidad, dadoDeBaja } = props;
  if (dadoDeBaja) {
    return (
      <span className="or-inv-dot is-baja" title="Dado de baja" aria-label="Dado de baja" />
    );
  }
  const indisponible = disponibilidad === 'Indisponible';
  const titulo = indisponible ? 'Indisponible' : 'Disponible';
  return (
    <span
      className={`or-inv-dot${indisponible ? ' is-indisponible' : ''}`}
      title={titulo}
      aria-label={titulo}
    />
  );
}

export function PanelCopySubequipoSolicitud(props: {
  codigo: string;
  tipoEtiqueta: string;
}): React.ReactElement {
  const { codigo, tipoEtiqueta } = props;
  return (
    <span className="or-inv-copy d-flex flex-column">
      <span className="or-sol-inv-nombre fw-semibold">{codigo}</span>
      <span className="or-inv-eq text-muted small">{tipoEtiqueta || '—'}</span>
    </span>
  );
}

export function ItemListaSubequipoSolicitud(props: {
  subequipo: IndisponibilidadSubequipoSolicitud;
}): React.ReactElement {
  const { subequipo } = props;
  const indisponible = subequipo.disponibilidad === 'Indisponible';
  return (
    <li className={indisponible ? 'is-down' : undefined}>
      <PuntoEstadoSubequipoSolicitud disponibilidad={subequipo.disponibilidad} />
      <PanelCopySubequipoSolicitud codigo={subequipo.codigo} tipoEtiqueta={subequipo.tipoEtiqueta} />
    </li>
  );
}

export function FormatearMotivoSubequipoSolicitud(motivo?: string): string {
  const texto = (motivo ?? '').trim();
  return texto || '—';
}

export type CeldaEquiposSolicitudOperadorProps = {
  subequipos: IndisponibilidadSubequipoSolicitud[];
  onAbrirLista: () => void;
};

export function CeldaEquiposSolicitudOperador(props: CeldaEquiposSolicitudOperadorProps): React.ReactElement {
  const { subequipos, onAbrirLista } = props;
  if (subequipos.length === 0) {
    return <span className="text-muted">Sin equipos</span>;
  }
  if (subequipos.length === 1) {
    return (
      <ul className="or-sol-inv-list mb-0 list-unstyled">
        <ItemListaSubequipoSolicitud subequipo={subequipos[0]} />
      </ul>
    );
  }
  return (
    <button
      type="button"
      className="btn btn-sm btn-outline-secondary"
      title="Ver lista de equipos"
      onClick={onAbrirLista}
    >
      <i className="bi bi-list-ul me-1" aria-hidden="true" />
      {subequipos.length} equipos
    </button>
  );
}

export function CeldaDisponibilidadSolicitudOperador(props: {
  indisponibles: number;
  total: number;
}): React.ReactElement {
  const { indisponibles, total } = props;
  if (total === 0) {
    return <span className="text-muted">—</span>;
  }
  if (indisponibles === 0) {
    return (
      <span className="or-sol-disp is-ok">
        <i className="bi bi-check-circle-fill me-1" aria-hidden="true" />
        {total} disponible{total === 1 ? '' : 's'}
      </span>
    );
  }
  return (
    <span className="or-sol-disp is-alerta">
      <i className="bi bi-exclamation-circle-fill me-1" aria-hidden="true" />
      {indisponibles} de {total} fuera
    </span>
  );
}

const ClasesBadgeEstado: Record<string, string> = {
  Pendiente: 'bg-warning text-dark',
  'En Análisis': 'bg-info text-dark',
  'Administrador Gestionando': 'bg-primary',
  Programada: 'bg-success',
  Vigente: 'bg-secondary',
  'En Ejecución': 'bg-primary',
  Extendida: 'bg-primary',
  Finalizada: 'bg-secondary',
  Rechazada: 'bg-danger',
  Devuelta: 'bg-danger',
  Anulada: 'bg-dark'
};

export function CeldaIdCenSodiSolicitudOperador(props: {
  idSolicitud: string;
  relacionSodiCen: string;
}): React.ReactElement {
  const { idSolicitud, relacionSodiCen } = props;
  const lineaPrincipal = idSolicitud || '—';
  const mostrarRelacion =
    relacionSodiCen.trim().length > 0 && relacionSodiCen.trim() !== idSolicitud.trim();
  return (
    <span className="or-sol-id-cen d-flex flex-column">
      <span className="fw-medium">{lineaPrincipal}</span>
      {mostrarRelacion ? <span className="text-muted small">{relacionSodiCen}</span> : null}
    </span>
  );
}

export function CeldaSolicitanteSolicitudOperador(props: {
  solicitante: string;
  empresaSolicitante?: string;
}): React.ReactElement {
  const { solicitante, empresaSolicitante } = props;
  const empresa = (empresaSolicitante ?? '').trim();
  return (
    <span className="d-flex flex-column">
      <span>{solicitante || '—'}</span>
      {empresa ? <span className="text-muted small">{empresa}</span> : null}
    </span>
  );
}

export function BadgeEstadoSolicitudOperador(props: { estado: string }): React.ReactElement {
  const estado = props.estado.trim() || '—';
  const clase = ClasesBadgeEstado[estado] ?? 'bg-secondary';
  return <span className={`badge ${clase}`}>{estado}</span>;
}
