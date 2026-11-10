import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { CentralMantenedor } from '../../../../../../models/concentradorComun/CentralMantenedor';
import type {
  DatosFormularioLimitacionSubestacion,
  LimitacionSubestacionOperador
} from '../../../../../../models/operadorRenovable/LimitacionSubestacionOperador';
import {
  MotivoIndisponibilidadFalla,
  MotivoIndisponibilidadTrabajo
} from '../../../../../../services/sharepoint/operadorRenovable/CamposOperadorRenovable';
import {
  ObtenerOpcionesSolicitudConcentradorPgl,
  ObtenerOpcionesSolicitudFallaPgl,
  type OpcionSolicitudVinculadaPgl
} from '../../../../../../services/sharepoint/operadorRenovable/SolicitudesVinculadasPglServicio';
import {
  ActualizarLimitacionRedConBitacora,
  CrearLimitacionRedConBitacora
} from '../../../../../../services/sharepoint/operadorRenovable/LimitacionesRedServicio';
import { SharePointRestError } from '../../../../../../services/sharepoint/SharePointRestError';
import {
  ConvertirEntradaLocalAIsoUtc,
  ConvertirIsoAFechaLocalInput
} from '../../../../../../utils/FechaHoraCorConecta';
import CampoFechaHora24 from '../../../../../concentrador/CampoFechaHora24';

export type ModalLimitacionSubestacionOperadorProps = {
  context: WebPartContext;
  centrales: CentralMantenedor[];
  /** Central propuesta al crear (la del filtro de la pestaña); sin ella, la primera. */
  centralInicialId?: number;
  limitacion?: LimitacionSubestacionOperador;
  visible: boolean;
  onCerrar: () => void;
  /** Tras guardar (el modal se cierra siempre, como la maqueta); `aviso` si el envío a Meteológica falló. */
  onGuardado: (aviso?: string) => void;
};

export default function ModalLimitacionSubestacionOperador(
  props: ModalLimitacionSubestacionOperadorProps
): React.ReactElement {
  const { context, centrales, centralInicialId, limitacion, visible, onCerrar, onGuardado } = props;
  const esEdicion = limitacion !== undefined;

  const [instalacionId, setInstalacionId] = useState('');
  const [potenciaMw, setPotenciaMw] = useState('');
  const [fechaInicioLocal, setFechaInicioLocal] = useState('');
  const [fechaFinLocal, setFechaFinLocal] = useState('');
  // Vacío hasta que se elige (maqueta: «Seleccione»); la solicitud vinculada aparece después.
  const [motivo, setMotivo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [solicitudVinculadaId, setSolicitudVinculadaId] = useState('');
  const [opcionesVinculo, setOpcionesVinculo] = useState<OpcionSolicitudVinculadaPgl[]>([]);
  const [cargandoVinculos, setCargandoVinculos] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | undefined>();
  /** Guardada en SharePoint, pero sin envío a Meteológica: se informa y el modal queda solo para cerrar. */

  const mapaCentrales = useMemo(() => new Map(centrales.map((c) => [c.id, c.central])), [centrales]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setError(undefined);
    setGuardando(false);
    if (limitacion) {
      setInstalacionId(String(limitacion.instalacionId));
      setPotenciaMw(String(limitacion.potenciaLimitadaMw));
      setFechaInicioLocal(
        ConvertirIsoAFechaLocalInput(limitacion.fechaInicioIso) ||
          ConvertirIsoAFechaLocalInput(new Date().toISOString())
      );
      setFechaFinLocal(ConvertirIsoAFechaLocalInput(limitacion.fechaFinIso));
      setMotivo(limitacion.motivo || '');
      setDescripcion(limitacion.descripcion);
      if (limitacion.motivo === MotivoIndisponibilidadFalla && limitacion.solicitudFallaId) {
        setSolicitudVinculadaId(String(limitacion.solicitudFallaId));
      } else if (limitacion.solicitudConcentradorId) {
        setSolicitudVinculadaId(String(limitacion.solicitudConcentradorId));
      } else {
        setSolicitudVinculadaId('');
      }
    } else {
      const propuesta = centrales.find((c) => c.id === centralInicialId) ?? centrales[0];
      setInstalacionId(propuesta ? String(propuesta.id) : '');
      setPotenciaMw('');
      setFechaInicioLocal(ConvertirIsoAFechaLocalInput(new Date().toISOString()));
      setFechaFinLocal('');
      setMotivo('');
      setDescripcion('');
      setSolicitudVinculadaId('');
    }
  }, [visible, limitacion, centrales, centralInicialId]);

  useEffect(() => {
    if (!visible) {
      setOpcionesVinculo([]);
      return undefined;
    }
    const idInst = Number.parseInt(instalacionId, 10);
    if (!Number.isFinite(idInst) || !motivo) {
      setOpcionesVinculo([]);
      return undefined;
    }
    let cancelado = false;
    setCargandoVinculos(true);
    const promesa =
      motivo === MotivoIndisponibilidadFalla
        ? ObtenerOpcionesSolicitudFallaPgl(context, idInst)
        : ObtenerOpcionesSolicitudConcentradorPgl(context, idInst);
    promesa
      .then((lista) => {
        if (!cancelado) {
          setOpcionesVinculo(lista);
        }
      })
      .catch(() => {
        if (!cancelado) {
          setOpcionesVinculo([]);
        }
      })
      .then(() => {
        if (!cancelado) {
          setCargandoVinculos(false);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelado = true;
    };
  }, [visible, context, instalacionId, motivo]);

  const potenciaKw = useMemo(() => {
    const mw = Number.parseFloat(potenciaMw.replace(',', '.'));
    return Number.isFinite(mw) ? mw * 1000 : undefined;
  }, [potenciaMw]);

  if (!visible) {
    return <></>;
  }

  const ConstruirDatosFormulario = (): DatosFormularioLimitacionSubestacion | undefined => {
    const idInst = Number.parseInt(instalacionId, 10);
    const mw = Number.parseFloat(potenciaMw.replace(',', '.'));
    const inicioIso = ConvertirEntradaLocalAIsoUtc(fechaInicioLocal);
    const finIso = fechaFinLocal.trim() ? ConvertirEntradaLocalAIsoUtc(fechaFinLocal) : undefined;

    if (!Number.isFinite(idInst) || !mapaCentrales.has(idInst)) {
      setError('Seleccione una central válida.');
      return undefined;
    }
    if (!Number.isFinite(mw) || mw <= 0) {
      setError('Indique potencia limitada mayor a 0 MW.');
      return undefined;
    }
    if (!motivo) {
      setError('Indique si la limitación se debe a falla o trabajo.');
      return undefined;
    }
    if (!inicioIso) {
      setError('Indique fecha y hora de inicio.');
      return undefined;
    }
    if (finIso && new Date(finIso).getTime() < new Date(inicioIso).getTime()) {
      setError('La fecha de fin debe ser posterior al inicio.');
      return undefined;
    }

    const idVinculo = solicitudVinculadaId.trim()
      ? Number.parseInt(solicitudVinculadaId, 10)
      : undefined;
    const datos: DatosFormularioLimitacionSubestacion = {
      instalacionId: idInst,
      potenciaLimitadaMw: mw,
      fechaInicioIso: inicioIso,
      fechaFinIso: finIso,
      motivo,
      descripcion: descripcion.trim() || undefined
    };
    if (Number.isFinite(idVinculo)) {
      if (motivo === MotivoIndisponibilidadFalla) {
        datos.solicitudFallaId = idVinculo;
      } else {
        datos.solicitudConcentradorId = idVinculo;
      }
    }
    return datos;
  };

  const GuardarYEnviar = async (): Promise<void> => {
    const datos = ConstruirDatosFormulario();
    if (!datos) {
      return;
    }
    const nombreCentral = mapaCentrales.get(datos.instalacionId) ?? 'Central';

    setGuardando(true);
    setError(undefined);
    try {
      const envio =
        esEdicion && limitacion
          ? await ActualizarLimitacionRedConBitacora(context, limitacion, datos, nombreCentral, true)
          : (await CrearLimitacionRedConBitacora(context, datos, nombreCentral, true)).envio;
      onGuardado(envio && !envio.enviado ? `La limitación quedó guardada. ${envio.mensaje}` : undefined);
      onCerrar();
    } catch (err) {
      const mensaje =
        err instanceof SharePointRestError ? err.message : 'No se pudo guardar la limitación.';
      setError(mensaje);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <div className="modal fade show d-block" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title h5">
                {esEdicion ? 'Modificar limitación por subestación' : 'Nueva limitación por subestación'}
              </h2>
              <button type="button" className="btn-close" aria-label="Cerrar" onClick={onCerrar} />
            </div>
            <div className="modal-body">
              {error ? <div className="alert alert-danger py-2">{error}</div> : null}
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label" htmlFor="pgl-central">
                    Central
                  </label>
                  <select
                    id="pgl-central"
                    className="form-select form-select-sm"
                    value={instalacionId}
                    onChange={(e) => setInstalacionId(e.target.value)}
                  >
                    {centrales.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.central}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="pgl-mw">
                    Potencia limitada (MW)
                  </label>
                  <input
                    id="pgl-mw"
                    type="number"
                    min={0}
                    step={0.1}
                    className="form-control form-control-sm"
                    value={potenciaMw}
                    aria-describedby="pgl-mw-kw"
                    onChange={(e) => setPotenciaMw(e.target.value)}
                  />
                  <div id="pgl-mw-kw" className="form-text">
                    Equivalente previsto a Meteológica: {(potenciaKw ?? 0).toLocaleString('es-CL', { maximumFractionDigits: 0 })} kW
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="pgl-inicio">
                    Inicio
                  </label>
                  <CampoFechaHora24
                    id="pgl-inicio"
                    valor={fechaInicioLocal}
                    onCambio={setFechaInicioLocal}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="pgl-fin">
                    Fin (opcional)
                  </label>
                  <CampoFechaHora24
                    id="pgl-fin"
                    valor={fechaFinLocal}
                    onCambio={setFechaFinLocal}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="pgl-motivo">
                    Motivo
                  </label>
                  <select
                    id="pgl-motivo"
                    className="form-select form-select-sm"
                    value={motivo}
                    onChange={(e) => {
                      setMotivo(e.target.value);
                      setSolicitudVinculadaId('');
                    }}
                  >
                    <option value="">Seleccione</option>
                    <option value={MotivoIndisponibilidadFalla}>{MotivoIndisponibilidadFalla}</option>
                    <option value={MotivoIndisponibilidadTrabajo}>{MotivoIndisponibilidadTrabajo}</option>
                  </select>
                </div>
                {motivo ? (
                <div className="col-md-6">
                  <label className="form-label" htmlFor="pgl-solicitud-vinculada">
                    {motivo === MotivoIndisponibilidadFalla ? 'Solicitud de falla' : 'Solicitud concentrador'}
                  </label>
                  <select
                    id="pgl-solicitud-vinculada"
                    className="form-select form-select-sm"
                    value={solicitudVinculadaId}
                    onChange={(e) => setSolicitudVinculadaId(e.target.value)}
                    disabled={cargandoVinculos}
                  >
                    <option value="">-- Sin vincular --</option>
                    {opcionesVinculo.map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.etiqueta}
                      </option>
                    ))}
                  </select>
                  <div className="form-text">
                    Puede vincularla ahora o modificar esta limitación más tarde para agregarla.
                  </div>
                </div>
                ) : null}
                <div className="col-12">
                  <label className="form-label" htmlFor="pgl-desc">
                    Descripción
                  </label>
                  <textarea
                    id="pgl-desc"
                    className="form-control form-control-sm"
                    rows={3}
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                  />
                </div>
              </div>
              <div className="alert alert-info mt-3 mb-0">
                Al guardar, la limitación queda activa y se envía a Meteológica como tope de la central.
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onCerrar} disabled={guardando}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-sm cowork-btn-primary"
                onClick={() => {
                  GuardarYEnviar().catch(() => undefined);
                }}
                disabled={guardando}
              >
                {guardando ? 'Guardando…' : 'Guardar y enviar a Meteológica'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}
