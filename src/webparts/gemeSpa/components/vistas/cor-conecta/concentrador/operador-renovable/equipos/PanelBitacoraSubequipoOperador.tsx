import * as React from 'react';
import { useEffect, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { FilaBitacoraOperadorSubequipo, SubequipoOperador } from '../../../../../../models/operadorRenovable/CatalogoEquiposOperador';
import { ObtenerBitacoraSubequipoOperador } from '../../../../../../services/sharepoint/operadorRenovable/BitacoraOperadorServicio';
import { SharePointRestError } from '../../../../../../services/sharepoint/SharePointRestError';
import { FormatearFechaHoraVisible } from '../../solicitudes-il/UtilidadesFechaSolicitudIl';

export type PanelBitacoraSubequipoOperadorProps = {
  context: WebPartContext;
  subequipo: SubequipoOperador;
  nombreEquipo?: string;
  central?: string;
  onCerrar: () => void;
};

export default function PanelBitacoraSubequipoOperador(
  props: PanelBitacoraSubequipoOperadorProps
): React.ReactElement {
  const { context, subequipo, nombreEquipo, central, onCerrar } = props;
  const [filas, setFilas] = useState<FilaBitacoraOperadorSubequipo[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(undefined);

    ObtenerBitacoraSubequipoOperador(context, subequipo.id)
      .then((resultado) => {
        if (!cancelado) {
          setFilas(resultado);
        }
      })
      .catch((err) => {
        if (!cancelado) {
          setError(err instanceof SharePointRestError ? err.message : 'No se pudo cargar la bitácora.');
          setFilas([]);
        }
      })
      .then(() => {
        if (!cancelado) {
          setCargando(false);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelado = true;
    };
  }, [context, subequipo.id]);

  return (
    <div>
      <h3 className="h6 mb-2">Bitácora del subequipo</h3>
      <p className="small text-muted mb-3">
        {subequipo.codigo} · {nombreEquipo ?? ''} · {central ?? ''}
      </p>
      {error ? <div className="alert alert-danger py-2">{error}</div> : null}
      {cargando ? <p className="text-muted small mb-0">Cargando bitácora…</p> : null}
      {!cargando && filas.length === 0 ? (
        <p className="text-muted small mb-0">Sin eventos registrados.</p>
      ) : null}
      {filas.length > 0 ? (
        <ul className="list-group list-group-flush small mb-3">
          {filas.map((fila) => (
            <li key={fila.id} className="list-group-item px-0">
              <div className="fw-medium">{fila.accion}</div>
              <div className="text-muted">
                {FormatearFechaHoraVisible(fila.fecha) || fila.fecha} · {fila.usuario}
              </div>
              {fila.descripcion ? <div>{fila.descripcion}</div> : null}
            </li>
          ))}
        </ul>
      ) : null}
      <button type="button" className="btn btn-sm btn-secondary" onClick={onCerrar}>
        Cerrar panel
      </button>
    </div>
  );
}
