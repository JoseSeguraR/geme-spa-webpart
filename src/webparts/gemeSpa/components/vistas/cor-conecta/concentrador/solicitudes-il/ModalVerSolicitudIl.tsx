import * as React from 'react';
import { useEffect, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { AdjuntoSolicitudIl, SolicitudIl } from '../../../../../models/SolicitudIl';
import { ObtenerAdjuntosSolicitudIl } from '../../../../../services/sharepoint/solicitudesIl/SolicitudesIlCrudServicio';
import { FormatearFechaHoraVisible } from './UtilidadesFechaSolicitudIl';
import {
  BloqueEstadoFormularioSolicitudIl,
  ResolverEstadoSolicitudIl
} from './PresentacionEstadoSolicitudIl';

export type ModalVerSolicitudIlProps = {
  context: WebPartContext;
  solicitud?: SolicitudIl;
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

export default function ModalVerSolicitudIl(props: ModalVerSolicitudIlProps): React.ReactElement {
  const { context, solicitud, visible, onCerrar } = props;
  const [adjuntos, setAdjuntos] = useState<AdjuntoSolicitudIl[]>([]);
  const [cargandoAdjuntos, setCargandoAdjuntos] = useState(false);
  const [errorAdjuntos, setErrorAdjuntos] = useState<string | undefined>();

  useEffect(() => {
    if (!visible || !solicitud) {
      setAdjuntos([]);
      setErrorAdjuntos(undefined);
      return undefined;
    }

    let cancelado = false;
    setCargandoAdjuntos(true);

    ObtenerAdjuntosSolicitudIl(context, solicitud.id)
      .then((resultado) => {
        if (!cancelado) {
          setAdjuntos(resultado);
        }
      })
      .catch(() => {
        if (!cancelado) {
          setErrorAdjuntos('No se pudieron cargar los adjuntos.');
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

  const estadoVisible = ResolverEstadoSolicitudIl(solicitud.estado);
  const inicioVisible = FormatearFechaHoraVisible(solicitud.fechaInicio) || '—';
  const finVisible = FormatearFechaHoraVisible(solicitud.fechaFin) || '—';

  return (
    <>
      <div className="modal fade show d-block" role="dialog" aria-modal="true" aria-labelledby="modal-ver-solicitud-il-titulo">
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title h5" id="modal-ver-solicitud-il-titulo">
                Solicitud IL #{solicitud.id}
              </h2>
              <button type="button" className="btn-close" aria-label="Cerrar" onClick={onCerrar} />
            </div>
            <div className="modal-body">
              <div className="cowork-formulario-detalle">
                <BloqueEstadoFormularioSolicitudIl estado={estadoVisible} />

                <div className="row g-3 mt-1">
                  <div className="col-md-6">
                    <CampoDetalle etiqueta="ID" valor={solicitud.id} />
                  </div>
                  <div className="col-md-6">
                    <CampoDetalle etiqueta="ID CEN" valor={solicitud.idCen || '—'} />
                  </div>
                  <div className="col-12">
                    <CampoDetalle etiqueta="Central" valor={solicitud.centralEtiqueta || '—'} />
                  </div>
                  <div className="col-12">
                    <CampoDetalle
                      etiqueta="Descripción"
                      valor={solicitud.descripcion || '—'}
                      multilinea
                    />
                  </div>
                  <div className="col-md-6">
                    <CampoDetalle etiqueta="Fecha inicio" valor={inicioVisible} />
                  </div>
                  <div className="col-md-6">
                    <CampoDetalle etiqueta="Fecha fin" valor={finVisible} />
                  </div>
                </div>

                <section className="cowork-formulario-detalle__seccion" aria-labelledby="ver-solicitud-adjuntos-titulo">
                  <h3 className="cowork-formulario-detalle__seccion-titulo" id="ver-solicitud-adjuntos-titulo">
                    <i className="bi bi-paperclip me-2" aria-hidden="true" />
                    Archivos adjuntos
                  </h3>
                  {cargandoAdjuntos ? (
                    <p className="text-muted mb-0 small">Cargando adjuntos…</p>
                  ) : null}
                  {errorAdjuntos ? <div className="alert alert-danger py-2 mb-0">{errorAdjuntos}</div> : null}
                  {!cargandoAdjuntos && !errorAdjuntos && adjuntos.length === 0 ? (
                    <p className="text-muted mb-0 small">Sin archivos adjuntos.</p>
                  ) : null}
                  {!cargandoAdjuntos && adjuntos.length > 0 ? (
                    <ul className="list-group list-group-flush cowork-formulario-detalle__adjuntos mb-0">
                      {adjuntos.map((adjunto) => (
                        <li key={adjunto.nombreArchivo} className="list-group-item d-flex align-items-center justify-content-between gap-2">
                          <span className="small text-break">
                            <i className="bi bi-paperclip me-2" aria-hidden="true" />
                            {adjunto.nombreArchivo}
                          </span>
                          <a
                            className="btn btn-sm cowork-btn-exito text-nowrap"
                            href={adjunto.urlDescarga}
                            download={adjunto.nombreArchivo}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <i className="bi bi-download me-1" aria-hidden="true" />
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
      <div className="modal-backdrop fade show" onClick={onCerrar} aria-hidden="true" />
    </>
  );
}
