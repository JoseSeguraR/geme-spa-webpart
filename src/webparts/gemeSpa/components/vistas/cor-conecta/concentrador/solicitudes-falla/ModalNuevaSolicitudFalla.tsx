import * as React from 'react';
import { useEffect, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { CentralMantenedor, DatosNuevaSolicitudFalla } from '../../../../../models/SolicitudFalla';
import { RegistrarNuevaSolicitudFallaCompleta } from '../../../../../services/sharepoint/solicitudesFalla/RegistrarNuevaSolicitudFallaCompleta';
import { IdCenDuplicadoSolicitudFallaError } from '../../../../../services/sharepoint/solicitudesFalla/IdCenDuplicadoSolicitudFallaError';
import { ObtenerEquiposPorCentralFalla } from '../../../../../services/sharepoint/solicitudesFalla/EquiposPorCentralFallaServicio';
import { ConvertirEntradaLocalAIsoUtc } from '../../../../../utils/FechaHoraCorConecta';
import FormularioCamposSolicitudFalla, {
  ValidarFechasFalla,
  type ValoresFormularioSolicitudFalla
} from './FormularioCamposSolicitudFalla';

export type ModalNuevaSolicitudFallaProps = {
  context: WebPartContext;
  visible: boolean;
  centrales: CentralMantenedor[];
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
  const { context, visible, centrales, onCerrar, onCreado } = props;
  const [valores, setValores] = useState<ValoresFormularioSolicitudFalla>(ValoresIniciales);
  const [equipos, setEquipos] = useState<{ id: number; nombre: string }[]>([]);
  const [equiposCargando, setEquiposCargando] = useState(false);
  const [archivos, setArchivos] = useState<File[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [progreso, setProgreso] = useState<string | undefined>();

  useEffect(() => {
    if (!visible) {
      setValores(ValoresIniciales);
      setEquipos([]);
      setArchivos([]);
      setError(undefined);
      setProgreso(undefined);
    }
  }, [visible]);

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

    setGuardando(true);
    RegistrarNuevaSolicitudFallaCompleta(context, datos, archivos, (p) => setProgreso(p.mensaje))
      .then(() => {
        onCreado();
        onCerrar();
      })
      .catch((err) => {
        if (err instanceof IdCenDuplicadoSolicitudFallaError) {
          setError(err.message);
        } else {
          setError(err instanceof Error ? err.message : 'No se pudo crear la solicitud de falla.');
        }
      })
      .then(() => setGuardando(false))
      .catch(() => undefined);
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
                onClick={onCerrar}
                disabled={guardando}
              />
            </div>
            <div className="modal-body">
              <div className="alert alert-info py-2 mb-3" role="status">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-info-circle" aria-hidden="true" />
                  <span>
                    <strong>Leyenda:</strong>
                    <span className="ms-2">
                      <span className="text-danger">*</span> Campos obligatorios
                    </span>
                  </span>
                </div>
              </div>
              <FormularioCamposSolicitudFalla
                disposicion="secciones"
                mostrarEstadoInicialVigente
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
              {error || progreso ? (
                <div className="cowork-modal-solicitud-falla__alertas-pie">
                  {error ? (
                    <div className="alert alert-danger py-2 mb-2" role="alert">
                      {error}
                    </div>
                  ) : null}
                  {progreso ? (
                    <p className="cowork-modal-solicitud-falla__texto-apoyo mb-0">{progreso}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-sm btn-secondary cowork-modal-solicitud-falla__btn-modal-secundario"
                onClick={onCerrar}
                disabled={guardando}
              >
                <i className="bi bi-x-lg me-1" aria-hidden="true" />
                Cancelar
              </button>
              <button type="button" className="btn btn-sm cowork-btn-primary" onClick={OnGuardar} disabled={guardando}>
                <i className="bi bi-save me-1" aria-hidden="true" />
                Guardar Solicitud
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" aria-hidden="true" />
    </>
  );
}