import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { EstadoSolicitudIl } from './constantesSolicitudesIl';
import type {
  AdjuntoSolicitudIl,
  CentralMantenedor,
  DatosActualizarSolicitudIl,
  SolicitudIl
} from '../../../../../models/SolicitudIl';
import type { PropiedadesWebPartSolicitudesIl } from '../../../../../models/ConfiguracionSolicitudesIl';
import {
  ConstruirConfiguracionSolicitudesIlDesdeProps,
  ObtenerUrlDeleteSiodSolicitudesIlDesdeProps,
  ObtenerUrlInsertSiodSolicitudesIlDesdeProps,
  ObtenerUrlUpdateSiodSolicitudesIlDesdeProps
} from '../../../../../models/ConfiguracionSolicitudesIl';
import {
  ObtenerAdjuntosSolicitudIl,
  ObtenerDetalleSolicitudIlPorId
} from '../../../../../services/sharepoint/solicitudesIl/SolicitudesIlCrudServicio';
import { GuardarGestionSolicitudIlCompleta } from '../../../../../services/sharepoint/solicitudesIl/GuardarGestionSolicitudIlServicio';
import { IdCenDuplicadoSolicitudIlError } from '../../../../../services/sharepoint/solicitudesIl/IdCenDuplicadoSolicitudIlError';
import {
  CrearResolverIdCentralDesdeCentrales,
  type SnapshotCamposSiodSolicitudIl
} from '../../../../../services/sharepoint/solicitudesIl/SincronizarSiodGestionSolicitudIlServicio';
import { SharePointRestError } from '../../../../../services/sharepoint/SharePointRestError';
import {
  ConvertirEntradaLocalAIsoUtc,
  ConvertirIsoAFechaLocalInput
} from './UtilidadesFechaSolicitudIl';
import { BloqueEstadoFormularioSolicitudIl, ResolverEstadoSolicitudIl } from './PresentacionEstadoSolicitudIl';
import { ArchivoConNombreSanitizado } from '../../../../../utils/SanearNombreArchivoAdjunto';
import { ValidarArchivoAdjuntoSharePoint } from '../../../../../utils/ValidacionAdjuntosSharePoint';

export type ModalGestionarSolicitudIlProps = {
  context: WebPartContext;
  solicitud?: SolicitudIl;
  visible: boolean;
  centrales: CentralMantenedor[];
  propiedadesSolicitudesIl: PropiedadesWebPartSolicitudesIl;
  onCerrar: () => void;
  onGuardado: () => void;
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

function CalcularEstadoNuevo(
  estadoInicial: EstadoSolicitudIl,
  anularMarcado: boolean,
  reactivarMarcado: boolean,
  finLocal: string
): EstadoSolicitudIl {
  if (estadoInicial === 'Vigente') {
    if (anularMarcado) {
      return 'Anulada';
    }
    if (finLocal.trim()) {
      return 'Finalizada';
    }
    return 'Vigente';
  }
  if (reactivarMarcado) {
    return 'Vigente';
  }
  return estadoInicial;
}

export default function ModalGestionarSolicitudIl(props: ModalGestionarSolicitudIlProps): React.ReactElement {
  const { context, solicitud, visible, centrales, propiedadesSolicitudesIl, onCerrar, onGuardado } = props;

  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | undefined>();
  const [idBitacoraActual, setIdBitacoraActual] = useState<number | undefined>(undefined);
  const [estadoInicial, setEstadoInicial] = useState<EstadoSolicitudIl>('Vigente');
  const [snapshotSiodInicial, setSnapshotSiodInicial] = useState<SnapshotCamposSiodSolicitudIl | undefined>(
    undefined
  );
  const [teniaFechaFinAlCargar, setTeniaFechaFinAlCargar] = useState(false);

  const [idCen, setIdCen] = useState('');
  const [centralId, setCentralId] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [inicioLocal, setInicioLocal] = useState('');
  const [finLocal, setFinLocal] = useState('');
  const [anularMarcado, setAnularMarcado] = useState(false);
  const [reactivarMarcado, setReactivarMarcado] = useState(false);

  const [adjuntosExistentes, setAdjuntosExistentes] = useState<AdjuntoSolicitudIl[]>([]);
  const [adjuntosMarcadosEliminar, setAdjuntosMarcadosEliminar] = useState<string[]>([]);
  const [archivosNuevos, setArchivosNuevos] = useState<File[]>([]);

  const [guardando, setGuardando] = useState(false);
  const [mensajeProgreso, setMensajeProgreso] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const refIdCen = useRef<HTMLInputElement>(null);

  const modoEdicion = estadoInicial === 'Vigente';
  const finHabilitado = modoEdicion && inicioLocal.trim().length > 0 && !anularMarcado;
  const anularHabilitado = modoEdicion && !finLocal.trim();
  const estadoCalculado = useMemo(
    () => CalcularEstadoNuevo(estadoInicial, anularMarcado, reactivarMarcado, finLocal),
    [estadoInicial, anularMarcado, reactivarMarcado, finLocal]
  );

  useEffect(() => {
    if (!visible || !solicitud) {
      setErrorCarga(undefined);
      setCargandoDetalle(false);
      setIdBitacoraActual(undefined);
      setAdjuntosExistentes([]);
      setAdjuntosMarcadosEliminar([]);
      setArchivosNuevos([]);
      setAnularMarcado(false);
      setReactivarMarcado(false);
      return undefined;
    }

    let cancelado = false;
    setCargandoDetalle(true);
    setErrorCarga(undefined);
    setError(undefined);

    Promise.all([
      ObtenerDetalleSolicitudIlPorId(context, solicitud.id),
      ObtenerAdjuntosSolicitudIl(context, solicitud.id)
    ])
      .then(([detalle, adjuntos]) => {
        if (cancelado) {
          return;
        }
        const estado = ResolverEstadoSolicitudIl(String(detalle.estado));
        setEstadoInicial(estado);
        setIdBitacoraActual(detalle.idBitacoraActual);
        setIdCen(detalle.idCen);
        setCentralId(detalle.centralId ? String(detalle.centralId) : '');
        setDescripcion(detalle.descripcion);
        setInicioLocal(ConvertirIsoAFechaLocalInput(detalle.fechaInicio));
        setFinLocal(ConvertirIsoAFechaLocalInput(detalle.fechaFin));
        setTeniaFechaFinAlCargar(Boolean(detalle.fechaFin));
        setSnapshotSiodInicial({
          idCen: detalle.idCen,
          centralId: detalle.centralId ?? 0,
          descripcion: detalle.descripcion,
          fechaInicioIso: detalle.fechaInicio ?? '',
          fechaFinIso: detalle.fechaFin
        });
        setAdjuntosExistentes(adjuntos);
        setAdjuntosMarcadosEliminar([]);
        setArchivosNuevos([]);
        setAnularMarcado(false);
        setReactivarMarcado(false);
      })
      .catch((err) => {
        if (!cancelado) {
          const mensaje =
            err instanceof SharePointRestError
              ? err.message
              : 'No se pudo cargar la solicitud para gestión.';
          setErrorCarga(mensaje);
        }
      })
      .then(() => {
        if (!cancelado) {
          setCargandoDetalle(false);
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

  const Cerrar = (): void => {
    if (guardando) {
      return;
    }
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

  const OnCambioAnular = (evento: React.ChangeEvent<HTMLInputElement>): void => {
    const marcado = evento.target.checked;
    setAnularMarcado(marcado);
    if (marcado) {
      setFinLocal('');
    }
  };

  const OnCambioFin = (evento: React.ChangeEvent<HTMLInputElement>): void => {
    const valor = evento.target.value;
    setFinLocal(valor);
    if (valor.trim()) {
      setAnularMarcado(false);
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
    setArchivosNuevos((previos) => [...previos, ...archivosSanitizados]);
    setError(undefined);
  };

  const QuitarArchivoNuevo = (indice: number): void => {
    setArchivosNuevos((previos) => previos.filter((_, i) => i !== indice));
  };

  const AlternarEliminarAdjunto = (nombreArchivo: string): void => {
    setAdjuntosMarcadosEliminar((previos) =>
      previos.indexOf(nombreArchivo) >= 0
        ? previos.filter((n) => n !== nombreArchivo)
        : [...previos, nombreArchivo]
    );
  };

  const puedeGuardar =
    !cargandoDetalle &&
    !errorCarga &&
    (modoEdicion || reactivarMarcado);

  const Guardar = async (): Promise<void> => {
    setError(undefined);
    setMensajeProgreso(undefined);

    if (!modoEdicion && !reactivarMarcado) {
      return;
    }

    if (modoEdicion) {
      if (!idCen.trim()) {
        setError('Indique ID CEN.');
        return;
      }
      if (!centralId) {
        setError('Seleccione una central.');
        return;
      }
      if (!descripcion.trim()) {
        setError('Indique la descripción.');
        return;
      }
      if (descripcion.length > 230) {
        setError('La descripción no puede superar 230 caracteres.');
        return;
      }
    }

    const inicioIso = modoEdicion ? ConvertirEntradaLocalAIsoUtc(inicioLocal) : '';
    if (modoEdicion && !inicioIso) {
      setError('Indique fecha y hora de inicio válidas.');
      return;
    }

    let finIso: string | undefined;
    if (modoEdicion && finLocal.trim() && !anularMarcado) {
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

    for (const archivo of archivosNuevos) {
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

    const estadoNuevo = estadoCalculado;
    const reactivacion =
      (estadoInicial === 'Finalizada' || estadoInicial === 'Anulada') && estadoNuevo === 'Vigente';
    const limpiarFechaFin =
      estadoNuevo === 'Anulada' ||
      reactivacion ||
      (modoEdicion && !finLocal.trim() && teniaFechaFinAlCargar);

    const inicioPersistir = modoEdicion ? inicioIso : ConvertirEntradaLocalAIsoUtc(inicioLocal);
    if (!inicioPersistir) {
      setError('No se pudo determinar la fecha de inicio de la solicitud.');
      return;
    }
    if (!centralId) {
      setError('La solicitud no tiene central asociada.');
      return;
    }

    const datos: DatosActualizarSolicitudIl = {
      idCen: idCen.trim(),
      centralId: Number(centralId),
      descripcion: descripcion.trim(),
      fechaInicioIso: inicioPersistir,
      fechaFinIso: modoEdicion ? finIso : undefined,
      limpiarFechaFin: limpiarFechaFin || undefined
    };

    if (!snapshotSiodInicial) {
      setError('No se pudo determinar el estado inicial de la solicitud para SIOD.');
      return;
    }

    const urlInsertSiod = ObtenerUrlInsertSiodSolicitudesIlDesdeProps(propiedadesSolicitudesIl) ?? '';
    const urlUpdateSiod = ObtenerUrlUpdateSiodSolicitudesIlDesdeProps(propiedadesSolicitudesIl) ?? '';
    const urlDeleteSiod = ObtenerUrlDeleteSiodSolicitudesIlDesdeProps(propiedadesSolicitudesIl) ?? '';

    const resolverIdCentralSiod = CrearResolverIdCentralDesdeCentrales(centrales);

    setGuardando(true);
    setMensajeProgreso('Guardando cambios…');
    try {
      await GuardarGestionSolicitudIlCompleta(
        context,
        {
          idSolicitud: solicitud.id,
          idBitacoraActual,
          estadoInicial,
          estadoNuevo,
          datos,
          archivosNuevos: modoEdicion ? archivosNuevos : [],
          nombresAdjuntosEliminar: modoEdicion ? adjuntosMarcadosEliminar : [],
          snapshotSiodInicial,
          urlsSiod: {
            urlInsertSiod,
            urlUpdateSiod,
            urlDeleteSiod
          },
          resolverIdCentralSiod
        },
        configuracion.bitacora,
        (progreso) => setMensajeProgreso(progreso.mensaje)
      );
      onGuardado();
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
            : 'No se pudo guardar la gestión de la solicitud IL.';
      setError(mensaje);
    } finally {
      setGuardando(false);
      setMensajeProgreso(undefined);
    }
  };

  const adjuntosVisibles = adjuntosExistentes.filter(
    (a) => adjuntosMarcadosEliminar.indexOf(a.nombreArchivo) < 0
  );

  return (
    <>
      <div
        className="modal fade show d-block"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-gestionar-solicitud-il-titulo"
      >
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title h5" id="modal-gestionar-solicitud-il-titulo">
                Gestionar solicitud IL #{solicitud.id}
              </h2>
              <button type="button" className="btn-close" aria-label="Cerrar" onClick={Cerrar} disabled={guardando} />
            </div>
            <div className="modal-body position-relative">
              {cargandoDetalle ? (
                <div className="cowork-formulario-progreso" role="status" aria-live="polite">
                  <div className="spinner-border spinner-border-sm text-primary me-2" aria-hidden="true" />
                  <span className="cowork-formulario-progreso__texto">Cargando solicitud…</span>
                </div>
              ) : null}
              {errorCarga ? <div className="alert alert-danger py-2">{errorCarga}</div> : null}
              {guardando ? (
                <div className="cowork-formulario-progreso" role="status" aria-live="polite" aria-busy="true">
                  <div className="spinner-border spinner-border-sm text-primary me-2" aria-hidden="true" />
                  <span className="cowork-formulario-progreso__texto">{mensajeProgreso ?? 'Guardando…'}</span>
                </div>
              ) : null}
              {error ? <div className="alert alert-danger py-2">{error}</div> : null}
              {!cargandoDetalle && !errorCarga ? (
                <fieldset className="border-0 p-0 m-0" disabled={guardando}>
                  <BloqueEstadoFormularioSolicitudIl
                    estado={estadoCalculado}
                    ayuda={
                      modoEdicion
                        ? 'Vigente: edite campos y adjuntos. Fecha fin → Finalizada. Switch anular → Anulada (limpia fecha fin).'
                        : 'Solo lectura. Use el switch para reactivar a Vigente.'
                    }
                  />

                  {modoEdicion ? (
                    <div
                      className={`cowork-formulario-estado-switch cowork-formulario-estado-switch--anular mt-3${
                        anularMarcado ? ' cowork-formulario-estado-switch--activo' : ''
                      }`}
                    >
                      <div className="form-check form-switch mb-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id="gestionar-solicitud-anular"
                          checked={anularMarcado}
                          disabled={!anularHabilitado}
                          onChange={OnCambioAnular}
                        />
                        <label className="form-check-label" htmlFor="gestionar-solicitud-anular">
                          Anular solicitud
                        </label>
                      </div>
                      <p className="cowork-formulario-estado-switch__ayuda mb-0">
                        {anularHabilitado
                          ? 'Marque para pasar a estado Anulada al guardar.'
                          : 'Desactive fecha fin para habilitar la anulación.'}
                      </p>
                    </div>
                  ) : null}

                  {!modoEdicion ? (
                    <div
                      className={`cowork-formulario-estado-switch cowork-formulario-estado-switch--reactivar mt-3${
                        reactivarMarcado ? ' cowork-formulario-estado-switch--activo' : ''
                      }`}
                    >
                      <div className="form-check form-switch mb-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id="gestionar-solicitud-reactivar"
                          checked={reactivarMarcado}
                          onChange={(evento) => setReactivarMarcado(evento.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="gestionar-solicitud-reactivar">
                          Reactivar solicitud (Vigente)
                        </label>
                      </div>
                      <p className="cowork-formulario-estado-switch__ayuda mb-0">
                        Al guardar se limpiará la fecha fin y se registrará el cambio en bitácora.
                      </p>
                    </div>
                  ) : null}

                  <div className="row g-3 mt-1">
                    <div className="col-md-6">
                      <EtiquetaCampo htmlFor="gestionar-solicitud-id-cen" obligatorio={modoEdicion}>
                        ID CEN
                      </EtiquetaCampo>
                      <input
                        ref={refIdCen}
                        id="gestionar-solicitud-id-cen"
                        className="form-control form-control-sm"
                        value={idCen}
                        onChange={(evento) => setIdCen(evento.target.value)}
                        maxLength={255}
                        readOnly={!modoEdicion}
                        disabled={!modoEdicion}
                        required={modoEdicion}
                      />
                    </div>
                    <div className="col-md-6">
                      <EtiquetaCampo htmlFor="gestionar-solicitud-central" obligatorio={modoEdicion}>
                        Central
                      </EtiquetaCampo>
                      <select
                        id="gestionar-solicitud-central"
                        className="form-select form-select-sm"
                        value={centralId}
                        onChange={(evento) => setCentralId(evento.target.value)}
                        disabled={!modoEdicion}
                        required={modoEdicion}
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
                      <EtiquetaCampo htmlFor="gestionar-solicitud-descripcion" obligatorio={modoEdicion}>
                        Descripción
                      </EtiquetaCampo>
                      <textarea
                        id="gestionar-solicitud-descripcion"
                        className="form-control form-control-sm"
                        rows={3}
                        maxLength={230}
                        value={descripcion}
                        onChange={(evento) => setDescripcion(evento.target.value)}
                        readOnly={!modoEdicion}
                        disabled={!modoEdicion}
                        required={modoEdicion}
                      />
                      {modoEdicion ? <div className="form-text">{descripcion.length}/230</div> : null}
                    </div>
                    <div className="col-md-6">
                      <EtiquetaCampo htmlFor="gestionar-solicitud-inicio" obligatorio={modoEdicion}>
                        Fecha inicio
                      </EtiquetaCampo>
                      <input
                        id="gestionar-solicitud-inicio"
                        type="datetime-local"
                        className="form-control form-control-sm"
                        value={inicioLocal}
                        onChange={OnCambioInicio}
                        readOnly={!modoEdicion}
                        disabled={!modoEdicion}
                        required={modoEdicion}
                      />
                    </div>
                    <div className="col-md-6">
                      <EtiquetaCampo htmlFor="gestionar-solicitud-fin">Fecha fin</EtiquetaCampo>
                      <input
                        id="gestionar-solicitud-fin"
                        type="datetime-local"
                        className="form-control form-control-sm"
                        value={finLocal}
                        min={inicioLocal || undefined}
                        disabled={!finHabilitado}
                        onChange={OnCambioFin}
                        readOnly={!modoEdicion}
                      />
                      {modoEdicion ? (
                        <div className="form-text">
                          {anularMarcado
                            ? 'Deshabilitada mientras la solicitud se anule.'
                            : finHabilitado
                              ? 'Opcional. Si la indica, al guardar pasará a Finalizada.'
                              : 'Ingrese fecha inicio o desmarque anular.'}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <section className="cowork-formulario-detalle__seccion mt-4" aria-labelledby="gestionar-solicitud-adjuntos-titulo">
                    <h3 className="cowork-formulario-detalle__seccion-titulo" id="gestionar-solicitud-adjuntos-titulo">
                      <i className="bi bi-paperclip me-2" aria-hidden="true" />
                      Archivos adjuntos
                    </h3>
                    {adjuntosExistentes.length === 0 && archivosNuevos.length === 0 ? (
                      <p className="text-muted mb-0 small">Sin archivos adjuntos.</p>
                    ) : null}
                    {adjuntosExistentes.length > 0 ? (
                      <ul className="list-group list-group-flush cowork-formulario-detalle__adjuntos mb-2">
                        {adjuntosExistentes.map((adjunto) => {
                          const marcadoEliminar = adjuntosMarcadosEliminar.indexOf(adjunto.nombreArchivo) >= 0;
                          return (
                            <li
                              key={adjunto.nombreArchivo}
                              className={`list-group-item d-flex align-items-center justify-content-between gap-2${
                                marcadoEliminar ? ' opacity-50' : ''
                              }`}
                            >
                              <span className="small text-break">
                                <i className="bi bi-paperclip me-2" aria-hidden="true" />
                                {adjunto.nombreArchivo}
                              </span>
                              <div className="d-flex flex-wrap gap-2">
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
                                {modoEdicion ? (
                                  <button
                                    type="button"
                                    className={`btn btn-sm ${marcadoEliminar ? 'cowork-btn-filtro-alt' : 'btn-outline-danger'}`}
                                    onClick={() => AlternarEliminarAdjunto(adjunto.nombreArchivo)}
                                  >
                                    {marcadoEliminar ? 'Deshacer' : 'Eliminar'}
                                  </button>
                                ) : null}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                    {modoEdicion ? (
                      <>
                        <input
                          id="gestionar-solicitud-adjuntos"
                          type="file"
                          className="form-control form-control-sm"
                          multiple
                          onChange={OnCambioArchivos}
                        />
                        <div className="form-text">
                          Puede agregar archivos o marcar existentes para eliminar al guardar (máx. 10 MB c/u).
                        </div>
                        {archivosNuevos.length > 0 ? (
                          <ul className="list-group list-group-flush mt-2">
                            {archivosNuevos.map((archivo, indice) => (
                              <li
                                key={`${archivo.name}-${archivo.lastModified}-${indice}`}
                                className="list-group-item d-flex align-items-center justify-content-between gap-2 py-2 px-0"
                              >
                                <span className="small">{archivo.name}</span>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-link text-danger p-0"
                                  onClick={() => QuitarArchivoNuevo(indice)}
                                >
                                  Quitar
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </>
                    ) : null}
                    {!modoEdicion && adjuntosVisibles.length === 0 && adjuntosExistentes.length > 0 ? (
                      <p className="text-muted mb-0 small">Sin adjuntos visibles.</p>
                    ) : null}
                  </section>
                </fieldset>
              ) : null}
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
                disabled={guardando || !puedeGuardar}
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
