import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { PropiedadesWebPartSolicitudFalla } from '../../../../../models/ConfiguracionSolicitudFalla';
import { ObtenerUrlUpdateSiodSolicitudFallaDesdeProps } from '../../../../../models/ConfiguracionSolicitudFalla';
import type { AdjuntoSolicitudFalla, CentralMantenedor, SolicitudFalla } from '../../../../../models/SolicitudFalla';
import {
  ObtenerAdjuntosSolicitudFalla,
  ObtenerDetalleSolicitudFallaPorId
} from '../../../../../services/sharepoint/solicitudesFalla/SolicitudFallaCrudServicio';
import { GuardarEdicionSolicitudFallaCompleta } from '../../../../../services/sharepoint/solicitudesFalla/GuardarEdicionSolicitudFallaCompleta';
import { IdCenDuplicadoSolicitudFallaError } from '../../../../../services/sharepoint/solicitudesFalla/IdCenDuplicadoSolicitudFallaError';
import {
  AlertasDesdeResultadoSiod,
  HuboFalloSiod
} from '../../../../../services/sharepoint/solicitudesFalla/ResultadoSiodSolicitudFalla';
import { ObtenerEquiposPorCentralFalla } from '../../../../../services/sharepoint/solicitudesFalla/EquiposPorCentralFallaServicio';
import {
  ConvertirEntradaLocalAIsoUtc,
  ConvertirIsoAFechaLocalInput
} from '../../../../../utils/FechaHoraCorConecta';
import {
  EstadoSolicitudFallaFinalizada,
  EstadoSolicitudFallaVigente,
  ResolverEstadoSolicitudFallaDesdeFechaRetorno
} from './constantesSolicitudFalla';
import type { AlertaResultadoSiodFalla } from './PieProgresoFormularioSolicitudFalla';
import BloquePieFormularioSolicitudFalla from './BloquePieFormularioSolicitudFalla';
import { useDesplazarAlPieFormularioFalla } from './useDesplazarAlPieFormularioFalla';
import { useMensajesProgresoSolicitudFalla } from './useMensajesProgresoSolicitudFalla';
import { useTemporizadorCierreModalFalla } from './useTemporizadorCierreModalFalla';
import { ReiniciarUiProgresoModalFalla } from './reiniciarUiProgresoModalFalla';
import FormularioCamposSolicitudFalla, {
  ValidarFechasFalla,
  type ValoresFormularioSolicitudFalla
} from './FormularioCamposSolicitudFalla';
import { TarjetaSeccionVerSolicitudFalla } from './PresentacionVerSolicitudFalla';
import SeccionAdjuntosActualesEdicionSolicitudFalla from './SeccionAdjuntosActualesEdicionSolicitudFalla';
import SeccionCargarAdjuntosNuevosSolicitudFalla from './SeccionCargarAdjuntosNuevosSolicitudFalla';
import BloqueLeyendaFormularioSolicitudFalla from './BloqueLeyendaFormularioSolicitudFalla';

export type ModalGestionarSolicitudFallaProps = {
  context: WebPartContext;
  fila?: SolicitudFalla;
  centrales: CentralMantenedor[];
  propiedadesSolicitudFalla: PropiedadesWebPartSolicitudFalla;
  visible: boolean;
  onCerrar: () => void;
  onGuardado: () => void;
};

export default function ModalGestionarSolicitudFalla(props: ModalGestionarSolicitudFallaProps): React.ReactElement {
  const { context, fila, centrales, propiedadesSolicitudFalla, visible, onCerrar, onGuardado } = props;
  const [valores, setValores] = useState<ValoresFormularioSolicitudFalla | undefined>(undefined);
  const [estadoAnterior, setEstadoAnterior] = useState('');
  const [equipos, setEquipos] = useState<{ id: number; nombre: string }[]>([]);
  const [equiposCargando, setEquiposCargando] = useState(false);
  const [archivosNuevos, setArchivosNuevos] = useState<File[]>([]);
  const [adjuntosActuales, setAdjuntosActuales] = useState<AdjuntoSolicitudFalla[]>([]);
  const [adjuntosEliminar, setAdjuntosEliminar] = useState<string[]>([]);
  const [adjuntosCargando, setAdjuntosCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [alertasSiod, setAlertasSiod] = useState<AlertaResultadoSiodFalla[]>([]);
  const [esperandoCierreAutomatico, setEsperandoCierreAutomatico] = useState(false);
  const [cierreAutomaticoConError, setCierreAutomaticoConError] = useState(false);
  const { mensajeActual, historial, informar, cerrarProgreso, reiniciar } = useMensajesProgresoSolicitudFalla();
  const { programarCierre, cancelarCierre } = useTemporizadorCierreModalFalla();
  const anclaPieFormularioRef = useRef<HTMLDivElement>(null);
  const hayProgresoVisible =
    guardando ||
    historial.length > 0 ||
    alertasSiod.length > 0 ||
    esperandoCierreAutomatico;
  useDesplazarAlPieFormularioFalla(anclaPieFormularioRef, {
    activo: hayProgresoVisible,
    mensajeActual,
    cantidadHistorial: historial.length,
    cantidadAlertas: alertasSiod.length,
    esperandoCierreAutomatico
  });

  const idSolicitudSesionAnteriorRef = useRef<number | undefined>();
  useEffect(() => {
    const accionesUi = {
      cancelarCierre,
      reiniciar,
      setAlertasSiod,
      setEsperandoCierreAutomatico,
      setCierreAutomaticoConError,
      setGuardando
    };
    const idSesion = visible && fila ? fila.id : undefined;
    const idAnterior = idSolicitudSesionAnteriorRef.current;
    if (idSesion !== idAnterior) {
      if (idAnterior !== undefined) {
        ReiniciarUiProgresoModalFalla(accionesUi);
        if (idSesion === undefined) {
          setValores(undefined);
          setArchivosNuevos([]);
          setAdjuntosActuales([]);
          setAdjuntosEliminar([]);
          setAdjuntosCargando(false);
        }
      }
      if (idSesion !== undefined) {
        ReiniciarUiProgresoModalFalla({
          cancelarCierre,
          reiniciar,
          setAlertasSiod,
          setEsperandoCierreAutomatico,
          setCierreAutomaticoConError
        });
      }
      idSolicitudSesionAnteriorRef.current = idSesion;
    }
  }, [visible, fila?.id, reiniciar, cancelarCierre]);

  useEffect(() => {
    if (!visible || !fila) {
      return undefined;
    }
    let cancelado = false;
    setAdjuntosCargando(true);
    setAdjuntosEliminar([]);
    setArchivosNuevos([]);

    Promise.all([
      ObtenerDetalleSolicitudFallaPorId(context, fila.id),
      ObtenerAdjuntosSolicitudFalla(context, fila.id)
    ])
      .then(([detalle, adjuntos]) => {
        if (cancelado) {
          return;
        }
        setEstadoAnterior(detalle.estado);
        const centralId = detalle.centralId ? String(detalle.centralId) : '';
        setValores({
          idCen: detalle.idCen,
          centralId,
          equiposIds: detalle.equiposIds.map(String),
          fechaPerturbacion: ConvertirIsoAFechaLocalInput(detalle.fechaPerturbacion),
          fechaRetorno: ConvertirIsoAFechaLocalInput(detalle.fechaRetorno),
          potencia: detalle.potencia !== undefined ? String(detalle.potencia) : '',
          medida: (detalle.medida === 'MWh' ? 'MWh' : 'MW') as 'MW' | 'MWh',
          descripcion: detalle.descripcion
        });
        setAdjuntosActuales(adjuntos);
        if (detalle.centralId) {
          setEquiposCargando(true);
          ObtenerEquiposPorCentralFalla(context, detalle.centralId)
            .then(setEquipos)
            .catch(() => setEquipos([]))
            .then(() => setEquiposCargando(false))
            .catch(() => undefined);
        }
      })
      .catch(() => {
        if (!cancelado) {
          setError('No se pudo cargar la solicitud para gestionar.');
          setAdjuntosActuales([]);
        }
      })
      .then(() => {
        if (!cancelado) {
          setAdjuntosCargando(false);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelado = true;
    };
  }, [context, fila?.id, visible]);

  const OnCambioCentral = (centralId: string): void => {
    setValores((previo) => (previo ? { ...previo, centralId, equiposIds: [] } : previo));
    if (!centralId) {
      setEquipos([]);
      return;
    }
    setEquiposCargando(true);
    ObtenerEquiposPorCentralFalla(context, Number(centralId))
      .then(setEquipos)
      .catch(() => setEquipos([]))
      .then(() => setEquiposCargando(false))
      .catch(() => undefined);
  };

  const OnMarcarEliminarAdjunto = (nombreArchivo: string): void => {
    setAdjuntosEliminar((previos) =>
      previos.some((nombre) => nombre === nombreArchivo) ? previos : [...previos, nombreArchivo]
    );
    setAdjuntosActuales((previos) => previos.filter((adjunto) => adjunto.nombreArchivo !== nombreArchivo));
  };

  const OnGuardar = (): void => {
    if (!fila || !valores) {
      return;
    }
    setError(undefined);
    const errorFechas = ValidarFechasFalla(valores.fechaPerturbacion, valores.fechaRetorno);
    if (errorFechas) {
      setError(errorFechas);
      return;
    }
    if (!valores.equiposIds.length) {
      setError('Seleccione al menos un equipo.');
      return;
    }
    const potencia = Number(valores.potencia);
    if (!Number.isFinite(potencia) || potencia < 0) {
      setError('Indique una pérdida de potencia válida.');
      return;
    }

    const fechaRetornoIso = valores.fechaRetorno.trim()
      ? ConvertirEntradaLocalAIsoUtc(valores.fechaRetorno)
      : undefined;
    const estadoNuevo = ResolverEstadoSolicitudFallaDesdeFechaRetorno(fechaRetornoIso);
    const urlUpdate = ObtenerUrlUpdateSiodSolicitudFallaDesdeProps(propiedadesSolicitudFalla);
    const opcionesSiod =
      estadoAnterior === EstadoSolicitudFallaVigente && estadoNuevo === EstadoSolicitudFallaFinalizada
        ? {
            urlUpdateSiod: urlUpdate,
            fechaRetornoLocal: valores.fechaRetorno.trim()
          }
        : undefined;

    setGuardando(true);
    setAlertasSiod([]);
    setEsperandoCierreAutomatico(false);
    reiniciar();
    informar('Iniciando guardado…');

    void GuardarEdicionSolicitudFallaCompleta(
      context,
      fila.id,
      {
        idCen: valores.idCen.trim(),
        centralId: Number(valores.centralId),
        equiposIds: valores.equiposIds.map((id) => Number(id)),
        fechaPerturbacionIso: ConvertirEntradaLocalAIsoUtc(valores.fechaPerturbacion),
        fechaRetornoIso,
        potencia,
        medida: valores.medida,
        descripcion: valores.descripcion.trim()
      },
      archivosNuevos,
      adjuntosEliminar,
      estadoAnterior,
      fila.idBitacora,
      opcionesSiod,
      (p) => informar(p.mensaje)
    )
      .then((resultado) => {
        cerrarProgreso();
        const alertas = AlertasDesdeResultadoSiod(resultado.resultadoSiod);
        if (alertas.length > 0) {
          setAlertasSiod(alertas);
        }
        const huboErrorSiod = HuboFalloSiod(resultado.resultadoSiod);
        onGuardado();
        setCierreAutomaticoConError(huboErrorSiod);
        setEsperandoCierreAutomatico(true);
        programarCierre(onCerrar, huboErrorSiod);
      })
      .catch((err) => {
        cerrarProgreso();
        if (err instanceof IdCenDuplicadoSolicitudFallaError) {
          setError(err.message);
        } else {
          setError(err instanceof Error ? err.message : 'No se pudo guardar la gestión.');
        }
      })
      .then(() => setGuardando(false))
      .catch(() => undefined);
  };

  const OnCerrarModal = (): void => {
    if (guardando) {
      return;
    }
    cancelarCierre();
    onCerrar();
  };

  if (!visible || !fila) {
    return <></>;
  }

  const estadoNoGestionable = fila.estado !== EstadoSolicitudFallaVigente && estadoAnterior !== EstadoSolicitudFallaVigente;

  if (!valores) {
    return <></>;
  }

  return (
    <>
      <div className="modal fade show d-block" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div className="modal-content cowork-modal-solicitud-falla">
            <div className="modal-header">
              <h2 className="modal-title h5 mb-0 text-white d-flex align-items-center gap-2">
                <i className="bi bi-clipboard-check" aria-hidden="true" />
                Gestionar Solicitud de Falla
              </h2>
              <button
                type="button"
                className="btn-close btn-close-white"
                aria-label="Cerrar"
                onClick={OnCerrarModal}
                disabled={guardando}
              />
            </div>
            <div className="modal-body">
              {estadoNoGestionable ? (
                <p className="cowork-modal-solicitud-falla__texto-apoyo mb-3">
                  Solo se pueden gestionar solicitudes en estado Vigente.
                </p>
              ) : null}
              {!estadoNoGestionable ? (
                <>
                  <BloqueLeyendaFormularioSolicitudFalla />
                  <FormularioCamposSolicitudFalla
                    disposicion="secciones"
                    derivarEstadoDesdeFechaRetorno
                    valores={valores}
                    centrales={centrales}
                    equipos={equipos}
                    equiposCargando={equiposCargando}
                    onCambio={(parcial) => setValores((previo) => (previo ? { ...previo, ...parcial } : previo))}
                    onCambioCentral={OnCambioCentral}
                  />
                  <TarjetaSeccionVerSolicitudFalla titulo="Adjuntos Actuales" iconoBootstrap="bi-paperclip">
                    <SeccionAdjuntosActualesEdicionSolicitudFalla
                      adjuntos={adjuntosActuales}
                      cargando={adjuntosCargando}
                      deshabilitado={guardando}
                      onEliminar={OnMarcarEliminarAdjunto}
                    />
                  </TarjetaSeccionVerSolicitudFalla>
                  <TarjetaSeccionVerSolicitudFalla titulo="Agregar Nuevos Adjuntos" iconoBootstrap="bi-cloud-upload">
                    <SeccionCargarAdjuntosNuevosSolicitudFalla
                      idAdjuntos="falla-adjuntos-gestionar-nuevos"
                      archivosAdjuntos={archivosNuevos}
                      onCambioArchivosAdjuntos={setArchivosNuevos}
                      deshabilitado={guardando}
                    />
                  </TarjetaSeccionVerSolicitudFalla>
                </>
              ) : null}
              {error ? (
                <div className="alert alert-danger py-2 mb-0 mt-3" role="alert">
                  {error}
                </div>
              ) : null}
              <BloquePieFormularioSolicitudFalla
                ref={anclaPieFormularioRef}
                procesando={guardando}
                mensajeActual={mensajeActual}
                historial={historial}
                alertasSiod={alertasSiod}
                esperandoCierreAutomatico={esperandoCierreAutomatico}
                cierreAutomaticoConError={cierreAutomaticoConError}
              />
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-sm btn-secondary cowork-modal-solicitud-falla__btn-modal-secundario"
                onClick={OnCerrarModal}
                disabled={guardando}
              >
                <i className="bi bi-x-lg me-1" aria-hidden="true" />
                {esperandoCierreAutomatico ? 'Cerrar ahora' : 'Cancelar'}
              </button>
              {!estadoNoGestionable && !esperandoCierreAutomatico ? (
                <button
                  type="button"
                  className="btn btn-sm cowork-btn-exito"
                  onClick={OnGuardar}
                  disabled={guardando}
                >
                  <i className="bi bi-save me-1" aria-hidden="true" />
                  Guardar Solicitud
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" aria-hidden="true" />
    </>
  );
}