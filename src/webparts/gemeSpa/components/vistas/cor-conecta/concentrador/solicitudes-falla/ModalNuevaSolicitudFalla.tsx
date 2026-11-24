import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { PropiedadesWebPartSolicitudFalla } from '../../../../../models/ConfiguracionSolicitudFalla';
import {
  ObtenerUrlInsertSiodSolicitudFallaDesdeProps,
  ObtenerUrlUpdateSiodSolicitudFallaDesdeProps
} from '../../../../../models/ConfiguracionSolicitudFalla';
import type { CentralMantenedor, DatosNuevaSolicitudFalla } from '../../../../../models/SolicitudFalla';
import { RegistrarNuevaSolicitudFallaCompleta } from '../../../../../services/sharepoint/solicitudesFalla/RegistrarNuevaSolicitudFallaCompleta';
import { IdCenDuplicadoSolicitudFallaError } from '../../../../../services/sharepoint/solicitudesFalla/IdCenDuplicadoSolicitudFallaError';
import { ObtenerEquiposPorCentralFalla } from '../../../../../services/sharepoint/solicitudesFalla/EquiposPorCentralFallaServicio';
import {
  AlertasDesdeResultadoSiod,
  HuboFalloSiod
} from '../../../../../services/sharepoint/solicitudesFalla/ResultadoSiodSolicitudFalla';
import { ConvertirEntradaLocalAIsoUtc } from '../../../../../utils/FechaHoraCorConecta';
import FormularioCamposSolicitudFalla, {
  ValidarFechasFalla,
  type ValoresFormularioSolicitudFalla
} from './FormularioCamposSolicitudFalla';
import BloqueLeyendaFormularioSolicitudFalla from './BloqueLeyendaFormularioSolicitudFalla';
import type { AlertaResultadoSiodFalla } from './PieProgresoFormularioSolicitudFalla';
import BloquePieFormularioSolicitudFalla from './BloquePieFormularioSolicitudFalla';
import { useDesplazarAlPieFormularioFalla } from './useDesplazarAlPieFormularioFalla';
import { useMensajesProgresoSolicitudFalla } from './useMensajesProgresoSolicitudFalla';
import { useTemporizadorCierreModalFalla } from './useTemporizadorCierreModalFalla';
import { ReiniciarUiProgresoModalFalla } from './reiniciarUiProgresoModalFalla';

export type ModalNuevaSolicitudFallaProps = {
  context: WebPartContext;
  visible: boolean;
  centrales: CentralMantenedor[];
  propiedadesSolicitudFalla: PropiedadesWebPartSolicitudFalla;
  onCerrar: () => void;
  onCreado: () => void;
};

const ValoresIniciales: ValoresFormularioSolicitudFalla = {
  idCen: '',
  centralId: '',
  equiposIds: [],
  fechaPerturbacion: '',
  fechaRetorno: '',
  potencia: '',
  medida: 'MW',
  descripcion: ''
};

export default function ModalNuevaSolicitudFalla(props: ModalNuevaSolicitudFallaProps): React.ReactElement {
  const { context, visible, centrales, propiedadesSolicitudFalla, onCerrar, onCreado } = props;
  const [valores, setValores] = useState<ValoresFormularioSolicitudFalla>(ValoresIniciales);
  const [equipos, setEquipos] = useState<{ id: number; nombre: string }[]>([]);
  const [equiposCargando, setEquiposCargando] = useState(false);
  const [archivos, setArchivos] = useState<File[]>([]);
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

  const visibleAnteriorRef = useRef(false);
  useEffect(() => {
    const estabaVisible = visibleAnteriorRef.current;
    if (visible && !estabaVisible) {
      ReiniciarUiProgresoModalFalla({
        cancelarCierre,
        reiniciar,
        setAlertasSiod,
        setEsperandoCierreAutomatico,
        setCierreAutomaticoConError,
        setGuardando
      });
    }
    if (!visible && estabaVisible) {
      ReiniciarUiProgresoModalFalla({
        cancelarCierre,
        reiniciar,
        setAlertasSiod,
        setEsperandoCierreAutomatico,
        setCierreAutomaticoConError,
        setGuardando
      });
      setValores(ValoresIniciales);
      setEquipos([]);
      setArchivos([]);
      setError(undefined);
    }
    visibleAnteriorRef.current = visible;
  }, [visible, reiniciar, cancelarCierre]);

  const OnCambioCentral = (centralId: string): void => {
    setValores((previo) => ({ ...previo, centralId, equiposIds: [] }));
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

  const OnGuardar = (): void => {
    setError(undefined);
    setAlertasSiod([]);
    setEsperandoCierreAutomatico(false);
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

    const datos: DatosNuevaSolicitudFalla = {
      idCen: valores.idCen.trim(),
      centralId: Number(valores.centralId),
      equiposIds: valores.equiposIds.map((id) => Number(id)),
      fechaPerturbacionIso: ConvertirEntradaLocalAIsoUtc(valores.fechaPerturbacion),
      fechaRetornoIso: valores.fechaRetorno.trim()
        ? ConvertirEntradaLocalAIsoUtc(valores.fechaRetorno)
        : undefined,
      potencia,
      medida: valores.medida,
      descripcion: valores.descripcion.trim()
    };

    const urlInsert = ObtenerUrlInsertSiodSolicitudFallaDesdeProps(propiedadesSolicitudFalla);
    const urlUpdate = ObtenerUrlUpdateSiodSolicitudFallaDesdeProps(propiedadesSolicitudFalla);
    const opcionesSiod = urlInsert
      ? {
          urlInsertSiod: urlInsert,
          urlUpdateSiod: urlUpdate,
          fechaPerturbacionLocal: valores.fechaPerturbacion.trim(),
          fechaRetornoLocal: valores.fechaRetorno.trim() || undefined
        }
      : undefined;

    setGuardando(true);
    reiniciar();
    informar('Iniciando registro…');

    void RegistrarNuevaSolicitudFallaCompleta(context, datos, archivos, opcionesSiod, (p) => informar(p.mensaje))
      .then((resultado) => {
        cerrarProgreso();
        const alertas = AlertasDesdeResultadoSiod(resultado.resultadoSiod);
        if (alertas.length > 0) {
          setAlertasSiod(alertas);
        }
        const huboErrorSiod = HuboFalloSiod(resultado.resultadoSiod);
        onCreado();
        setCierreAutomaticoConError(huboErrorSiod);
        setEsperandoCierreAutomatico(true);
        programarCierre(onCerrar, huboErrorSiod);
      })
      .catch((err) => {
        cerrarProgreso();
        if (err instanceof IdCenDuplicadoSolicitudFallaError) {
          setError(err.message);
        } else {
          setError(err instanceof Error ? err.message : 'No se pudo crear la solicitud de falla.');
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

  if (!visible) {
    return <></>;
  }

  return (
    <>
      <div className="modal fade show d-block" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div className="modal-content cowork-modal-solicitud-falla">
            <div className="modal-header">
              <h2 className="modal-title h5 mb-0 text-white d-flex align-items-center gap-2">
                <i className="bi bi-plus-circle" aria-hidden="true" />
                Nueva Solicitud de Falla
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
              <BloqueLeyendaFormularioSolicitudFalla />
              <fieldset className="border-0 p-0 m-0" disabled={guardando}>
                <FormularioCamposSolicitudFalla
                  disposicion="secciones"
                  derivarEstadoDesdeFechaRetorno
                  valores={valores}
                  centrales={centrales}
                  equipos={equipos}
                  equiposCargando={equiposCargando}
                  archivosAdjuntos={archivos}
                  onCambioArchivosAdjuntos={setArchivos}
                  idAdjuntos="nueva-falla-adjuntos"
                  onCambio={(parcial) => setValores((previo) => ({ ...previo, ...parcial }))}
                  onCambioCentral={OnCambioCentral}
                />
              </fieldset>
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
              {!esperandoCierreAutomatico ? (
                <button
                  type="button"
                  className="btn btn-sm cowork-btn-primary"
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