import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { PropiedadesWebPartSolicitudFalla } from '../../../../../models/ConfiguracionSolicitudFalla';
import { ObtenerUrlInsertSiodSolicitudFallaDesdeProps } from '../../../../../models/ConfiguracionSolicitudFalla';
import type { SolicitudFalla } from '../../../../../models/SolicitudFalla';
import { IntegrarSolicitudFallaEnSiod } from '../../../../../services/sharepoint/solicitudesFalla/IntegrarSiodSolicitudFallaServicio';
import {
  CampoLecturaVerSolicitudFalla,
  ColumnaCampoVerSolicitudFalla,
  GrillaCamposVerSolicitudFalla,
  TarjetaSeccionVerSolicitudFalla
} from './PresentacionVerSolicitudFalla';
import { BloqueEstadoSolicitudFalla } from './PresentacionEstadoSolicitudFalla';
import PieProgresoFormularioSolicitudFalla from './PieProgresoFormularioSolicitudFalla';
import { useMensajesProgresoSolicitudFalla } from './useMensajesProgresoSolicitudFalla';
import { useTemporizadorCierreModalFalla } from './useTemporizadorCierreModalFalla';
import AvisoCierreAutomaticoFormularioFalla from './AvisoCierreAutomaticoFormularioFalla';

export type ModalIntegrarSiodSolicitudFallaProps = {
  context: WebPartContext;
  fila?: SolicitudFalla;
  visible: boolean;
  propiedadesSolicitudFalla: PropiedadesWebPartSolicitudFalla;
  onCerrar: () => void;
  onIntegrado: () => void;
};

function ReiniciarEstadoIntegracionSiod(): {
  procesando: false;
  progreso: 0;
  resultado: undefined;
  exito: undefined;
  mostrarProgreso: false;
} {
  return {
    procesando: false,
    progreso: 0,
    resultado: undefined,
    exito: undefined,
    mostrarProgreso: false
  };
}

export default function ModalIntegrarSiodSolicitudFalla(
  props: ModalIntegrarSiodSolicitudFallaProps
): React.ReactElement {
  const { context, fila, visible, propiedadesSolicitudFalla, onCerrar, onIntegrado } = props;
  const [procesando, setProcesando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [resultado, setResultado] = useState<string | undefined>();
  const [exito, setExito] = useState<boolean | undefined>();
  const [mostrarProgreso, setMostrarProgreso] = useState(false);
  const intervaloProgresoRef = useRef<number | undefined>();
  const { mensajeActual, historial, informar, cerrarProgreso, reiniciar } = useMensajesProgresoSolicitudFalla();
  const { programarCierre, cancelarCierre } = useTemporizadorCierreModalFalla();
  const [esperandoCierreAutomatico, setEsperandoCierreAutomatico] = useState(false);

  useEffect(() => {
    return () => {
      if (intervaloProgresoRef.current !== undefined) {
        window.clearInterval(intervaloProgresoRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (intervaloProgresoRef.current !== undefined) {
      window.clearInterval(intervaloProgresoRef.current);
      intervaloProgresoRef.current = undefined;
    }

    if (!visible || !fila) {
      const reinicio = ReiniciarEstadoIntegracionSiod();
      setProcesando(reinicio.procesando);
      setProgreso(reinicio.progreso);
      setResultado(reinicio.resultado);
      setExito(reinicio.exito);
      setMostrarProgreso(reinicio.mostrarProgreso);
      reiniciar();
      cancelarCierre();
      setEsperandoCierreAutomatico(false);
      return;
    }

    const reinicio = ReiniciarEstadoIntegracionSiod();
    setProcesando(reinicio.procesando);
    setProgreso(reinicio.progreso);
    setResultado(reinicio.resultado);
    setExito(reinicio.exito);
    setMostrarProgreso(reinicio.mostrarProgreso);
    reiniciar();
    cancelarCierre();
    setEsperandoCierreAutomatico(false);
  }, [visible, fila?.id, reiniciar, cancelarCierre]);

  if (!visible || !fila) {
    return <></>;
  }

  const manejarCerrar = (): void => {
    if (intervaloProgresoRef.current !== undefined) {
      window.clearInterval(intervaloProgresoRef.current);
      intervaloProgresoRef.current = undefined;
    }
    cancelarCierre();
    onCerrar();
  };

  const IniciarIntegracion = (): void => {
    if (intervaloProgresoRef.current !== undefined) {
      window.clearInterval(intervaloProgresoRef.current);
    }

    setMostrarProgreso(true);
    setProcesando(true);
    setProgreso(0);
    setResultado(undefined);
    setExito(undefined);
    reiniciar();
    informar('Iniciando integración manual con SIOD…');

    const intervalo = window.setInterval(() => {
      setProgreso((valor) => Math.min(valor + 10, 90));
    }, 250);
    intervaloProgresoRef.current = intervalo;

    const urlInsert = ObtenerUrlInsertSiodSolicitudFallaDesdeProps(propiedadesSolicitudFalla);

    void IntegrarSolicitudFallaEnSiod(context, fila.id, urlInsert, (mensaje) => informar(mensaje))
      .then((res) => {
        if (intervaloProgresoRef.current !== undefined) {
          window.clearInterval(intervaloProgresoRef.current);
          intervaloProgresoRef.current = undefined;
        }
        cerrarProgreso();
        setProgreso(100);
        setExito(res.exito);
        setResultado(res.mensaje);
        setProcesando(false);
        if (res.exito) {
          onIntegrado();
        }
        setEsperandoCierreAutomatico(true);
        programarCierre(manejarCerrar, !res.exito);
      })
      .catch(() => {
        if (intervaloProgresoRef.current !== undefined) {
          window.clearInterval(intervaloProgresoRef.current);
          intervaloProgresoRef.current = undefined;
        }
        cerrarProgreso();
        setProgreso(100);
        setExito(false);
        setResultado('Integración SIOD (inserción): error inesperado al completar el proceso.');
        setProcesando(false);
        setEsperandoCierreAutomatico(true);
        programarCierre(manejarCerrar, true);
      });
  };

  return (
    <>
      <div className="modal fade show d-block" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content cowork-modal-solicitud-falla">
            <div className="modal-header">
              <h2 className="modal-title h5 mb-0 text-white d-flex align-items-center gap-2">
                <i className="bi bi-cloud-upload" aria-hidden="true" />
                Integrar a SIOD
              </h2>
              <button
                type="button"
                className="btn-close btn-close-white"
                aria-label="Cerrar"
                onClick={manejarCerrar}
              />
            </div>
            <div className="modal-body">
              <TarjetaSeccionVerSolicitudFalla titulo="Información Solicitud" iconoBootstrap="bi-lightning-charge">
                <GrillaCamposVerSolicitudFalla>
                  <ColumnaCampoVerSolicitudFalla>
                    <CampoLecturaVerSolicitudFalla
                      id="integrar-siod-id-cen"
                      etiqueta="ID CEN"
                      valor={fila.idCen || '—'}
                    />
                  </ColumnaCampoVerSolicitudFalla>
                  <ColumnaCampoVerSolicitudFalla>
                    <CampoLecturaVerSolicitudFalla
                      id="integrar-siod-central"
                      etiqueta="Central"
                      valor={fila.centralEtiqueta || '—'}
                    />
                  </ColumnaCampoVerSolicitudFalla>
                  <ColumnaCampoVerSolicitudFalla>
                    <div className="cowork-modal-solicitud-falla__campo-contenedor">
                      <span className="form-label cowork-modal-solicitud-falla__etiqueta mb-1 d-block">Estado</span>
                      <BloqueEstadoSolicitudFalla estado={fila.estado} />
                    </div>
                  </ColumnaCampoVerSolicitudFalla>
                </GrillaCamposVerSolicitudFalla>
              </TarjetaSeccionVerSolicitudFalla>
              <div className="alert alert-info py-3 mb-3" role="status">
                <div className="d-flex align-items-start gap-2">
                  <i className="bi bi-info-circle flex-shrink-0 mt-1" aria-hidden="true" />
                  <div>
                    <p className="mb-1 fw-semibold">¿Desea integrar esta solicitud al sistema SIOD?</p>
                    <p className="mb-0 cowork-modal-solicitud-falla__texto-apoyo">
                      Este proceso enviará la información de la perturbación al Sistema Integrado de Operación y
                      Despacho.
                    </p>
                  </div>
                </div>
              </div>
              {mostrarProgreso ? (
                <TarjetaSeccionVerSolicitudFalla titulo="Progreso" iconoBootstrap="bi-hourglass-split">
                  <div
                    className="progress mb-3"
                    role="progressbar"
                    aria-valuenow={progreso}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div className="progress-bar" style={{ width: `${progreso}%` }}>
                      {progreso}%
                    </div>
                  </div>
                  <PieProgresoFormularioSolicitudFalla
                    procesando={procesando}
                    mensajeActual={mensajeActual}
                    historial={historial}
                  />
                </TarjetaSeccionVerSolicitudFalla>
              ) : null}
              {resultado ? (
                <div className="cowork-modal-solicitud-falla__alertas-pie">
                  <div className={`alert py-2 mb-0 ${exito ? 'alert-success' : 'alert-warning'}`} role="status">
                    {resultado}
                  </div>
                </div>
              ) : null}
              {esperandoCierreAutomatico ? (
                <AvisoCierreAutomaticoFormularioFalla conError={!exito} />
              ) : null}
            </div>
            <div className="modal-footer">
              {!resultado ? (
                <>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary cowork-modal-solicitud-falla__btn-modal-secundario"
                    onClick={manejarCerrar}
                    disabled={procesando}
                  >
                    <i className="bi bi-x-lg me-1" aria-hidden="true" />
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm cowork-btn-primary"
                    onClick={IniciarIntegracion}
                    disabled={procesando}
                  >
                    <i className="bi bi-play-fill me-1" aria-hidden="true" />
                    Iniciar Integración
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn btn-sm btn-secondary cowork-modal-solicitud-falla__btn-cerrar"
                  onClick={manejarCerrar}
                >
                  <i className="bi bi-x-lg me-1" aria-hidden="true" />
                  {esperandoCierreAutomatico ? 'Cerrar ahora' : 'Cerrar'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" aria-hidden="true" />
    </>
  );
}