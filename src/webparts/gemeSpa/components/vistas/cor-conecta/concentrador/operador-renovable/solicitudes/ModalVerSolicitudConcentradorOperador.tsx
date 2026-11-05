import * as React from 'react';
import { useEffect, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { AdjuntoSolicitudIl } from '../../../../../../models/SolicitudIl';
import type { SolicitudOperadorRenovableFila } from '../../../../../../models/operadorRenovable/SolicitudOperadorRenovable';
import { ObtenerAdjuntosSolicitudConcentrador } from '../../../../../../services/sharepoint/operadorRenovable/DetalleSolicitudConcentradorServicio';

export type ModalVerSolicitudConcentradorOperadorProps = {
  context: WebPartContext;
  solicitud?: SolicitudOperadorRenovableFila;
  visible: boolean;
  onCerrar: () => void;
};

function CampoDetalle(props: { etiqueta: string; valor: React.ReactNode; multilinea?: boolean }): React.ReactElement {
  const { etiqueta, valor, multilinea } = props;
  const valorClase = multilinea
    ? 'cowork-formulario-detalle__valor cowork-formulario-detalle__valor--multilinea'
    : 'cowork-formulario-detalle__valor';
  return (
    <div className="cowork-formulario-detalle__campo">
      <span className="cowork-formulario-detalle__etiqueta">{etiqueta}</span>
      <span className={valorClase}>{valor}</span>
    </div>
  );
}

export default function ModalVerSolicitudConcentradorOperador(
  props: ModalVerSolicitudConcentradorOperadorProps
): React.ReactElement {
  const { context, solicitud, visible, onCerrar } = props;
  const [adjuntos, setAdjuntos] = useState<AdjuntoSolicitudIl[]>([]);
  const [cargandoAdjuntos, setCargandoAdjuntos] = useState(false);

  useEffect(() => {
    if (!visible || !solicitud) {
      setAdjuntos([]);
      return undefined;
    }

    let cancelado = false;
    setCargandoAdjuntos(true);

    ObtenerAdjuntosSolicitudConcentrador(context, solicitud.id)
      .then((resultado) => {
        if (!cancelado) {
          setAdjuntos(resultado);
        }
      })
      .catch(() => {
        if (!cancelado) {
          setAdjuntos([]);
        }
      })
      .then(() => {
        if (!cancelado) {
          setCargandoAdjuntos(false);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelado = true;
    };
  }, [context, solicitud, visible]);

  if (!visible || !solicitud) {
    return <></>;
  }

  return (
    <>
      <div className="modal fade show d-block" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title h5">Solicitud {solicitud.idSolicitud}</h2>
              <button type="button" className="btn-close" aria-label="Cerrar" onClick={onCerrar} />
            </div>
            <div className="modal-body">
              <div className="cowork-formulario-detalle">
                <div className="row g-3">
                  <div className="col-md-6">
                    <CampoDetalle etiqueta="ID registro" valor={solicitud.id} />
                  </div>
                  <div className="col-md-6">
                    <CampoDetalle etiqueta="Estado (motor)" valor={solicitud.estado} />
                  </div>
                  <div className="col-md-6">
                    <CampoDetalle etiqueta="ID CEN/SODI" valor={solicitud.idCenSodi} />
                  </div>
                  <div className="col-md-6">
                    <CampoDetalle etiqueta="Solicitante" valor={solicitud.solicitante} />
                  </div>
                  <div className="col-12">
                    <CampoDetalle etiqueta="Central" valor={solicitud.central} />
                  </div>
                  <div className="col-12">
                    <CampoDetalle etiqueta="Descripción" valor={solicitud.descripcion || '—'} multilinea />
                  </div>
                  <div className="col-md-6">
                    <CampoDetalle etiqueta="Inicio programado" valor={solicitud.fechaProgramadaInicio} />
                  </div>
                  <div className="col-md-6">
                    <CampoDetalle etiqueta="Inicio efectivo" valor={solicitud.fechaEfectivaInicio} />
                  </div>
                  <div className="col-md-6">
                    <CampoDetalle
                      etiqueta="Subequipos"
                      valor={`${solicitud.subequiposIndisponibles} indisp. / ${solicitud.subequiposTotal}`}
                    />
                  </div>
                </div>

                <section className="cowork-formulario-detalle__seccion mt-3" aria-labelledby="ver-sol-conc-adj">
                  <h3 className="cowork-formulario-detalle__seccion-titulo" id="ver-sol-conc-adj">
                    Archivos adjuntos
                  </h3>
                  {cargandoAdjuntos ? <p className="text-muted small mb-0">Cargando adjuntos…</p> : null}
                  {!cargandoAdjuntos && adjuntos.length === 0 ? (
                    <p className="text-muted small mb-0">Sin archivos adjuntos.</p>
                  ) : null}
                  {!cargandoAdjuntos && adjuntos.length > 0 ? (
                    <ul className="list-group list-group-flush cowork-formulario-detalle__adjuntos mb-0">
                      {adjuntos.map((adjunto) => (
                        <li
                          key={adjunto.nombreArchivo}
                          className="list-group-item d-flex align-items-center justify-content-between gap-2"
                        >
                          <span className="small text-break">{adjunto.nombreArchivo}</span>
                          <a
                            className="btn btn-sm cowork-btn-exito text-nowrap"
                            href={adjunto.urlDescarga}
                            download={adjunto.nombreArchivo}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Descargar
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              </div>
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
