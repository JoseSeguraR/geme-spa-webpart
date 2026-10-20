import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { EstadoSolicitudIl } from './constantesSolicitudesIl';
import type { CentralMantenedor, DatosNuevaSolicitudIl, SolicitudIl } from '../../../../../models/SolicitudIl';
import type { PropiedadesWebPartSolicitudesIl } from '../../../../../models/ConfiguracionSolicitudesIl';
import {
  ConstruirConfiguracionSolicitudesIlDesdeProps,
  ObtenerUrlInsertSiodSolicitudesIlDesdeProps
} from '../../../../../models/ConfiguracionSolicitudesIl';
import { IdCenDuplicadoSolicitudIlError } from '../../../../../services/sharepoint/solicitudesIl/IdCenDuplicadoSolicitudIlError';
import { ParsearIdCentralDesdeCodigoSiod } from '../../../../../services/sharepoint/solicitudesIl/ParsearIdCentralSiod';
import { RegistrarNuevaSolicitudIlCompleta } from '../../../../../services/sharepoint/solicitudesIl/RegistrarNuevaSolicitudIlServicio';
import { SharePointRestError } from '../../../../../services/sharepoint/SharePointRestError';
import { ConvertirEntradaLocalAIsoUtc, ConvertirIsoAFechaLocalInput } from './UtilidadesFechaSolicitudIl';
import { BloqueEstadoFormularioSolicitudIl } from './PresentacionEstadoSolicitudIl';
import { ArchivoConNombreSanitizado } from '../../../../../utils/SanearNombreArchivoAdjunto';
import { ValidarArchivoAdjuntoSharePoint } from '../../../../../utils/ValidacionAdjuntosSharePoint';

export type ModalNuevaSolicitudIlProps = {
  context: WebPartContext;
  visible: boolean;
  centrales: CentralMantenedor[];
  propiedadesSolicitudesIl: PropiedadesWebPartSolicitudesIl;
  /** Si se indica, el formulario se abre como clon (sin adjuntos ni fecha fin de origen). */
  solicitudOrigenClon?: SolicitudIl;
  onCerrar: () => void;
  onCreado: () => void;
};

function EtiquetaCampo(props: { htmlFor: string; obligatorio?: boolean; children: React.ReactNode }): React.ReactElement {
  const { htmlFor, obligatorio, children } = props;
  return (
    <label
      className={`form-label${obligatorio ? ' cowork-formulario__etiqueta--obligatoria' : ''}`}
      htmlFor={htmlFor}
    >
      {children}
    </label>
  );
}

function ObtenerEstadoDesdeFechas(finLocal: string): EstadoSolicitudIl {
  return finLocal.trim() ? 'Finalizada' : 'Vigente';
}

export default function ModalNuevaSolicitudIl(props: ModalNuevaSolicitudIlProps): React.ReactElement {
  const { context, visible, centrales, propiedadesSolicitudesIl, solicitudOrigenClon, onCerrar, onCreado } = props;
  const [idCen, setIdCen] = useState('');
  const [centralId, setCentralId] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [inicioLocal, setInicioLocal] = useState('');
  const [finLocal, setFinLocal] = useState('');
  const [archivos, setArchivos] = useState<File[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [mensajeProgreso, setMensajeProgreso] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const refIdCen = useRef<HTMLInputElement>(null);

  const estadoCalculado = useMemo(() => ObtenerEstadoDesdeFechas(finLocal), [finLocal]);
  const finHabilitado = inicioLocal.trim().length > 0;
  const esClon = solicitudOrigenClon !== undefined;

  const LimpiarFormulario = (): void => {
    setIdCen('');
    setCentralId('');
    setDescripcion('');
    setInicioLocal('');
    setFinLocal('');
    setArchivos([]);
    setError(undefined);
    setMensajeProgreso(undefined);
  };

  useEffect(() => {
    if (!visible) {
      return;
    }
    if (solicitudOrigenClon) {
      setIdCen('');
      setCentralId(
        solicitudOrigenClon.centralId !== undefined ? String(solicitudOrigenClon.centralId) : ''
      );
      setDescripcion(solicitudOrigenClon.descripcion ?? '');
      setInicioLocal(ConvertirIsoAFechaLocalInput(solicitudOrigenClon.fechaInicio));
      setFinLocal('');
      setArchivos([]);
      setError(undefined);
      setMensajeProgreso(undefined);
      return;
    }
    LimpiarFormulario();
  }, [visible, solicitudOrigenClon]);

  if (!visible) {
    return <></>;
  }

  const Cerrar = (): void => {
    if (guardando) {
      return;
    }
    LimpiarFormulario();
    onCerrar();
  };

  const OnCambioInicio = (evento: React.ChangeEvent<HTMLInputElement>): void => {
    const valor = evento.target.value;
    setInicioLocal(valor);
    if (!valor.trim()) {
      setFinLocal('');
      return;
    }
    if (finLocal && finLocal < valor) {
      setFinLocal('');
    }
  };

  const OnCambioArchivos = (evento: React.ChangeEvent<HTMLInputElement>): void => {
    const listaNueva = evento.target.files ? Array.from(evento.target.files) : [];
    evento.target.value = '';

    if (listaNueva.length === 0) {
      return;
    }

    const archivosSanitizados = listaNueva.map(ArchivoConNombreSanitizado);
    for (const archivo of archivosSanitizados) {
      const errorArchivo = ValidarArchivoAdjuntoSharePoint(archivo);
      if (errorArchivo) {
        setError(errorArchivo);
        return;
      }
    }

    setArchivos((previos) => {
      const claves = new Set(previos.map((a) => `${a.name}|${a.size}|${a.lastModified}`));
      const agregados = archivosSanitizados.filter((a) => !claves.has(`${a.name}|${a.size}|${a.lastModified}`));
      return [...previos, ...agregados];
    });
    setError(undefined);
  };

  const QuitarArchivo = (indice: number): void => {
    setArchivos((previos) => previos.filter((_, i) => i !== indice));
  };

  const Guardar = async (): Promise<void> => {
    setError(undefined);
    setMensajeProgreso(undefined);

    if (!idCen.trim()) {
      setError('Indique ID CEN.');
      return;
    }
    if (!centralId) {
      setError('Seleccione una central.');
      return;
    }

    const centralSeleccionada = centrales.find((central) => String(central.id) === centralId);
    if (!centralSeleccionada) {
      setError('No se encontró la central seleccionada.');
      return;
    }

    let idCentral: number;
    try {
      idCentral = ParsearIdCentralDesdeCodigoSiod(centralSeleccionada.codigoSiod, centralSeleccionada.central);
    } catch (errCentral) {
      setError(errCentral instanceof Error ? errCentral.message : 'Código SIOD de central inválido.');
      return;
    }

    const urlInsertSiod = ObtenerUrlInsertSiodSolicitudesIlDesdeProps(propiedadesSolicitudesIl) ?? '';

    if (!descripcion.trim()) {
      setError('Indique la descripción.');
      return;
    }
    if (descripcion.length > 230) {
      setError('La descripción no puede superar 230 caracteres.');
      return;
    }

    const inicioIso = ConvertirEntradaLocalAIsoUtc(inicioLocal);
    if (!inicioIso) {
      setError('Indique fecha y hora de inicio válidas.');
      return;
    }

    let finIso: string | undefined;
    if (finLocal.trim()) {
      if (finLocal < inicioLocal) {
        setError('La fecha fin debe ser igual o posterior a la fecha inicio.');
        return;
      }
      finIso = ConvertirEntradaLocalAIsoUtc(finLocal);
      if (!finIso) {
        setError('Indique una fecha y hora de fin válidas.');
        return;
      }
    }

    for (const archivo of archivos) {
      const errorArchivo = ValidarArchivoAdjuntoSharePoint(archivo);
      if (errorArchivo) {
        setError(errorArchivo);
        return;
      }
    }

    let configuracion;
    try {
      configuracion = ConstruirConfiguracionSolicitudesIlDesdeProps(propiedadesSolicitudesIl);
    } catch (errConfig) {
      const mensaje =
        errConfig instanceof Error
          ? errConfig.message
          : 'Configure las propiedades de Solicitudes IL en la Web Part.';
      setError(mensaje);
      return;
    }

    const datos: DatosNuevaSolicitudIl = {
      idCen: idCen.trim(),
      centralId: Number(centralId),
      descripcion: descripcion.trim(),
      fechaInicioIso: inicioIso,
      fechaFinIso: finIso,
      estadoFlujo: estadoCalculado
    };

    setGuardando(true);
    setMensajeProgreso('Iniciando registro…');
    try {
      await RegistrarNuevaSolicitudIlCompleta(
        context,
        datos,
        archivos,
        configuracion.bitacora,
        {
          urlInsertSiod,
          idCentral
        },
        (progreso) => setMensajeProgreso(progreso.mensaje)
      );
      LimpiarFormulario();
      onCreado();
      onCerrar();
    } catch (err) {
      if (err instanceof IdCenDuplicadoSolicitudIlError) {
        setError(err.message);
        refIdCen.current?.focus();
        return;
      }

      const mensaje =
        err instanceof SharePointRestError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'No se pudo crear la solicitud IL.';
      setError(mensaje);
    } finally {
      setGuardando(false);
      setMensajeProgreso(undefined);
    }
  };

  return (
    <>
      <div className="modal fade show d-block" role="dialog" aria-modal="true" aria-labelledby="modal-nueva-solicitud-il-titulo">
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title h5" id="modal-nueva-solicitud-il-titulo">
                {esClon
                  ? `Clonar solicitud IL (origen #${solicitudOrigenClon?.id ?? ''})`
                  : 'Nueva solicitud IL'}
              </h2>
              <button type="button" className="btn-close" aria-label="Cerrar" onClick={Cerrar} disabled={guardando} />
            </div>
            <div className="modal-body position-relative">
              {guardando ? (
                <div className="cowork-formulario-progreso" role="status" aria-live="polite" aria-busy="true">
                  <div className="spinner-border spinner-border-sm text-primary me-2" aria-hidden="true" />
                  <span className="cowork-formulario-progreso__texto">{mensajeProgreso ?? 'Cargando…'}</span>
                </div>
              ) : null}
              {error ? <div className="alert alert-danger py-2">{error}</div> : null}
              {esClon ? (
                <div className="alert alert-info py-2 small mb-3" role="status">
                  Formulario pre-llenado desde la solicitud origen (excepto ID CEN). No se copian adjuntos ni
                  fecha fin; puede completarlos antes de guardar.
                </div>
              ) : null}
              <p className="form-text cowork-formulario__nota-obligatorios mb-3">
                Los campos marcados con <span className="cowork-formulario__asterisco" aria-hidden="true">*</span> son
                obligatorios.
              </p>
              <fieldset className="border-0 p-0 m-0" disabled={guardando}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <EtiquetaCampo htmlFor="nueva-solicitud-id-cen" obligatorio>
                      ID CEN
                    </EtiquetaCampo>
                    <input
                      ref={refIdCen}
                      id="nueva-solicitud-id-cen"
                      className="form-control form-control-sm"
                      value={idCen}
                      onChange={(evento) => setIdCen(evento.target.value)}
                      maxLength={255}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <EtiquetaCampo htmlFor="nueva-solicitud-central" obligatorio>
                      Central
                    </EtiquetaCampo>
                    <select
                      id="nueva-solicitud-central"
                      className="form-select form-select-sm"
                      value={centralId}
                      onChange={(evento) => setCentralId(evento.target.value)}
                      required
                    >
                      <option value="">Seleccione…</option>
                      {centrales.map((central) => (
                        <option key={central.id} value={central.id}>
                          {central.central}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12">
                    <EtiquetaCampo htmlFor="nueva-solicitud-descripcion" obligatorio>
                      Descripción
                    </EtiquetaCampo>
                    <textarea
                      id="nueva-solicitud-descripcion"
                      className="form-control form-control-sm"
                      rows={3}
                      maxLength={230}
                      value={descripcion}
                      onChange={(evento) => setDescripcion(evento.target.value)}
                      required
                    />
                    <div className="form-text">{descripcion.length}/230</div>
                  </div>
                  <div className="col-md-6">
                    <EtiquetaCampo htmlFor="nueva-solicitud-inicio" obligatorio>
                      Fecha inicio
                    </EtiquetaCampo>
                    <input
                      id="nueva-solicitud-inicio"
                      type="datetime-local"
                      className="form-control form-control-sm"
                      value={inicioLocal}
                      onChange={OnCambioInicio}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <EtiquetaCampo htmlFor="nueva-solicitud-fin">Fecha fin</EtiquetaCampo>
                    <input
                      id="nueva-solicitud-fin"
                      type="datetime-local"
                      className="form-control form-control-sm"
                      value={finLocal}
                      min={inicioLocal || undefined}
                      disabled={!finHabilitado}
                      onChange={(evento) => setFinLocal(evento.target.value)}
                      aria-describedby="nueva-solicitud-fin-ayuda"
                    />
                    <div id="nueva-solicitud-fin-ayuda" className="form-text">
                      {finHabilitado
                        ? 'Opcional. Si la indica, la solicitud quedará en estado Finalizada.'
                        : 'Ingrese primero la fecha inicio.'}
                    </div>
                  </div>
                  <div className="col-12">
                    <BloqueEstadoFormularioSolicitudIl
                      estado={estadoCalculado}
                      ayuda="Vigente por defecto. Al ingresar fecha fin el estado pasa a Finalizada; al borrarla, vuelve a Vigente."
                    />
                  </div>
                  <div className="col-12">
                    <EtiquetaCampo htmlFor="nueva-solicitud-adjuntos">Archivos adjuntos</EtiquetaCampo>
                    <input
                      id="nueva-solicitud-adjuntos"
                      type="file"
                      className="form-control form-control-sm"
                      multiple
                      onChange={OnCambioArchivos}
                    />
                    <div className="form-text">
                      Opcional. Puede seleccionar varios archivos (máximo 10 MB c/u). Extensiones bloqueadas por SharePoint
                      no están permitidas. Los nombres se ajustan automáticamente (sin tildes ni caracteres especiales).
                    </div>
                    {archivos.length > 0 ? (
                      <ul className="list-group list-group-flush mt-2 cowork-formulario-adjuntos-pendientes">
                        {archivos.map((archivo, indice) => (
                            <li
                              key={`${archivo.name}-${archivo.lastModified}-${indice}`}
                              className="list-group-item d-flex align-items-center justify-content-between gap-2 py-2 px-0"
                            >
                              <span className="small">
                                <i className="bi bi-paperclip me-1" aria-hidden="true" />
                                {archivo.name}
                              </span>
                              <button
                                type="button"
                                className="btn btn-sm btn-link text-danger p-0"
                                onClick={() => QuitarArchivo(indice)}
                                aria-label={`Quitar ${archivo.name}`}
                              >
                                Quitar
                              </button>
                            </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              </fieldset>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-sm cowork-btn-filtro-alt" onClick={Cerrar} disabled={guardando}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-sm cowork-btn-primary"
                onClick={() => {
                  Guardar().catch(() => undefined);
                }}
                disabled={guardando}
              >
                {guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" onClick={Cerrar} aria-hidden="true" />
    </>
  );
}
