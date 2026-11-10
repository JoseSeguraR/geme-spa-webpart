import * as React from 'react';
import { useEffect, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { FilaBitacoraOperadorSubequipo, SubequipoOperador } from '../../../../../../models/operadorRenovable/CatalogoEquiposOperador';
import { ObtenerBitacoraSubequipoOperador } from '../../../../../../services/sharepoint/operadorRenovable/BitacoraOperadorServicio';
import { FormatearFechaHoraVisible } from '../../../../../../utils/FechaHoraCorConecta';
import { EnvioEventoBitacora, FechasEventoBitacora } from './DetalleEventoBitacora';

export type ModalBitacoraSubequipoOperadorProps = {
  context: WebPartContext;
  subequipo?: SubequipoOperador;
  nombreEquipo?: string;
  central?: string;
  visible: boolean;
  onCerrar: () => void;
};

export default function ModalBitacoraSubequipoOperador(
  props: ModalBitacoraSubequipoOperadorProps
): React.ReactElement {
  const { context, subequipo, nombreEquipo, central, visible, onCerrar } = props;
  const [filas, setFilas] = useState<FilaBitacoraOperadorSubequipo[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!visible || !subequipo) {
      setFilas([]);
      setError(undefined);
      return undefined;
    }

    let cancelado = false;
    setCargando(true);
    setError(undefined);

    ObtenerBitacoraSubequipoOperador(subequipo.id)
      .then((resultado) => {
        if (!cancelado) {
          setFilas(resultado);
        }
      })
      .catch((err) => {
        if (!cancelado) {
          const mensaje =
            err instanceof Error ? err.message : 'No se pudo cargar la bitácora del subequipo.';
          setError(mensaje);
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
  }, [context, subequipo, visible]);

  if (!visible || !subequipo) {
    return <></>;
  }

  return (
    <>
      <div className="modal fade show d-block" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title h5">
                Bitácora — {subequipo.codigo}
              </h2>
              <button type="button" className="btn-close" aria-label="Cerrar" onClick={onCerrar} />
            </div>
            <div className="modal-body">
              <p className="small text-muted mb-3">
                {nombreEquipo} · {central}
              </p>
              {error ? <div className="alert alert-danger py-2">{error}</div> : null}
              {cargando ? <p className="text-muted mb-0">Cargando…</p> : null}
              {!cargando && !error && filas.length === 0 ? (
                <p className="text-muted mb-0">No hay eventos registrados para este subequipo.</p>
              ) : null}
              {!cargando && filas.length > 0 ? (
                <ul className="list-group list-group-flush">
                  {filas.map((fila) => (
                    <li key={fila.id} className="list-group-item px-0">
                      <div className="d-flex justify-content-between gap-2">
                        <strong>{fila.accion || 'Evento'}</strong>
                        <span className="text-muted small">{FormatearFechaHoraVisible(fila.fecha)}</span>
                      </div>
                      <div className="small text-muted">
                        {fila.estadoAnterior || '—'} → {fila.estadoNuevo || '—'}
                        {fila.capacidadMw !== undefined ? ` · ${fila.capacidadMw} MW` : ''}
                        {fila.motivo ? ` · ${fila.motivo}` : ''}
                      </div>
                      <FechasEventoBitacora
                        fechaInicio={fila.fechaInicio}
                        fechaFinEstimada={fila.fechaFinEstimada}
                        fechaFin={fila.fechaFin}
                        fechaFinEstimadaAnterior={fila.fechaFinEstimadaAnterior}
                      />
                      {fila.descripcion ? <div className="small mt-1">{fila.descripcion}</div> : null}
                      <EnvioEventoBitacora envio={fila.meteologica} />
                      <div className="small text-muted mt-1">{fila.usuario}</div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-sm cowork-btn-filtro-alt" onClick={onCerrar}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" aria-hidden="true" />
    </>
  );
}
