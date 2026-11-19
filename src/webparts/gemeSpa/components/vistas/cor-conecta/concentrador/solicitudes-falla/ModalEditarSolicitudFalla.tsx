import * as React from 'react';
import { useEffect, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { AdjuntoSolicitudFalla, CentralMantenedor, SolicitudFalla } from '../../../../../models/SolicitudFalla';
import {
  ObtenerAdjuntosSolicitudFalla,
  ObtenerDetalleSolicitudFallaPorId
} from '../../../../../services/sharepoint/solicitudesFalla/SolicitudFallaCrudServicio';
import { GuardarEdicionSolicitudFallaCompleta } from '../../../../../services/sharepoint/solicitudesFalla/GuardarEdicionSolicitudFallaCompleta';
import { IdCenDuplicadoSolicitudFallaError } from '../../../../../services/sharepoint/solicitudesFalla/IdCenDuplicadoSolicitudFallaError';
import { ObtenerEquiposPorCentralFalla } from '../../../../../services/sharepoint/solicitudesFalla/EquiposPorCentralFallaServicio';
import {
  ConvertirEntradaLocalAIsoUtc,
  ConvertirIsoAFechaLocalInput
} from '../../../../../utils/FechaHoraCorConecta';
import FormularioCamposSolicitudFalla, {
  ValidarFechasFalla,
  type ValoresFormularioSolicitudFalla
} from './FormularioCamposSolicitudFalla';
import { TarjetaSeccionVerSolicitudFalla } from './PresentacionVerSolicitudFalla';
import SeccionAdjuntosActualesEdicionSolicitudFalla from './SeccionAdjuntosActualesEdicionSolicitudFalla';
import SeccionCargarAdjuntosNuevosSolicitudFalla from './SeccionCargarAdjuntosNuevosSolicitudFalla';

export type ModalEditarSolicitudFallaProps = {
  context: WebPartContext;
  fila?: SolicitudFalla;
  centrales: CentralMantenedor[];
  visible: boolean;
  onCerrar: () => void;
  onGuardado: () => void;
};

export default function ModalEditarSolicitudFalla(props: ModalEditarSolicitudFallaProps): React.ReactElement {
  const { context, fila, centrales, visible, onCerrar, onGuardado } = props;
  const [valores, setValores] = useState<ValoresFormularioSolicitudFalla | undefined>(undefined);
  const [estado, setEstado] = useState('');
  const [equipos, setEquipos] = useState<{ id: number; nombre: string }[]>([]);
  const [equiposCargando, setEquiposCargando] = useState(false);
  const [archivosNuevos, setArchivosNuevos] = useState<File[]>([]);
  const [adjuntosActuales, setAdjuntosActuales] = useState<AdjuntoSolicitudFalla[]>([]);
  const [adjuntosEliminar, setAdjuntosEliminar] = useState<string[]>([]);
  const [adjuntosCargando, setAdjuntosCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!visible || !fila) {
      setValores(undefined);
      setArchivosNuevos([]);
      setAdjuntosActuales([]);
      setAdjuntosEliminar([]);
      setAdjuntosCargando(false);
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
        setEstado(detalle.estado);
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
          setError('No se pudo cargar la solicitud para editar.');
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
  }, [context, fila, visible]);

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

    setGuardando(true);
    GuardarEdicionSolicitudFallaCompleta(
      context,
      fila.id,
      {
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
      },
      archivosNuevos,
      adjuntosEliminar,
      estado
    )
      .then(() => {
        onGuardado();
        onCerrar();
      })
      .catch((err) => {
        if (err instanceof IdCenDuplicadoSolicitudFallaError) {
          setError(err.message);
        } else {
          setError(err instanceof Error ? err.message : 'No se pudo guardar la edición.');
        }
      })
      .then(() => setGuardando(false))
      .catch(() => undefined);
  };

  if (!visible || !fila || !valores) {
    return <></>;
  }

  return (
    <>
      <div className="modal fade show d-block" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div className="modal-content cowork-modal-solicitud-falla">
            <div className="modal-header">
              <h2 className="modal-title h5 mb-0 text-white d-flex align-items-center gap-2">
                <i className="bi bi-pencil" aria-hidden="true" />
                Editar Solicitud de Falla
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
                valores={valores}
                centrales={centrales}
                equipos={equipos}
                equiposCargando={equiposCargando}
                estadoSoloLectura={estado}
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
                  idAdjuntos="falla-adjuntos-editar-nuevos"
                  archivosAdjuntos={archivosNuevos}
                  onCambioArchivosAdjuntos={setArchivosNuevos}
                  deshabilitado={guardando}
                />
              </TarjetaSeccionVerSolicitudFalla>
              {error ? (
                <div className="cowork-modal-solicitud-falla__alertas-pie">
                  <div className="alert alert-danger py-2 mb-0" role="alert">
                    {error}
                  </div>
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