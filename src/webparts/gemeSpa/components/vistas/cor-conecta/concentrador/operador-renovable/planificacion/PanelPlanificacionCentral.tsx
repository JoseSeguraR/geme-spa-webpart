import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type {
  EquipoOperadorTarjeta,
  SubequipoOperador
} from '../../../../../../models/operadorRenovable/CatalogoEquiposOperador';
import {
  MigrarIndisponibilidadesExistentes,
  ReenviarPerfilYEstado
} from '../../../../../../services/sharepoint/operadorRenovable/ActualizarDisponibilidadSubequipoServicio';
import {
  HayServicioPeriodos,
  MigrarPeriodos,
  ObtenerPlanificacionCentral,
  PeriodoCubreAhora,
  PeriodosApiError,
  type PeriodoIndisponibilidad,
  type PlanificacionCentral,
  type TramoPerfil
} from '../../../../../../services/sharepoint/operadorRenovable/PeriodosIndisponibilidadApiServicio';
import { FormatearFechaHoraVisible } from '../../../../../../utils/FechaHoraCorConecta';
import { UseRefrescoOperadorRenovable } from '../UseRefrescoOperadorRenovable';
import ModalMarcarDisponibilidadSubequipo from '../equipos/ModalMarcarDisponibilidadSubequipo';
import ModalPeriodoIndisponibilidad, {
  EtiquetaEstadoPeriodo,
  type ModoModalPeriodo
} from '../equipos/ModalPeriodoIndisponibilidad';

export type PanelPlanificacionCentralProps = {
  context: WebPartContext;
  /** Central elegida en Disponibilidad de equipos (la planificación es siempre de una central). */
  centralId: number;
  nombreCentral: string;
  /** Tarjetas de equipos ya cargadas (para el nombre del equipo y «Marcar disponibilidad»). */
  tarjetas: EquipoOperadorTarjeta[];
};

const Meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const ClaseEstado: Record<string, string> = {
  PROGRAMADO: 'programado',
  VIGENTE: 'vigente',
  VENCIDO: 'vencido',
  FINALIZADO: 'finalizado',
  ANULADO: 'anulado'
};

const BadgeEstado: Record<string, string> = {
  PROGRAMADO: 'text-bg-warning',
  VIGENTE: 'text-bg-danger',
  VENCIDO: 'text-bg-danger',
  FINALIZADO: 'text-bg-secondary',
  ANULADO: 'text-bg-light border'
};

function FormatearMw(valor: number): string {
  return valor.toLocaleString('es-CL', { maximumFractionDigits: 2 });
}

/** Días del mes (hora local): [inicio, fin) de cada uno. */
function DiasDelMes(anio: number, mes: number): { dia: number; inicio: number; fin: number }[] {
  const cantidad = new Date(anio, mes + 1, 0).getDate();
  const dias = [];
  for (let dia = 1; dia <= cantidad; dia++) {
    dias.push({ dia, inicio: new Date(anio, mes, dia).getTime(), fin: new Date(anio, mes, dia + 1).getTime() });
  }
  return dias;
}

/** Hasta cuándo cuenta fuera el período (el de la Function; si no viene, fin real o estimado). */
function FinPeriodo(periodo: PeriodoIndisponibilidad): number {
  return Date.parse(periodo.finEfectivo ?? periodo.fechaFin ?? periodo.fechaFinEstimada);
}

/** Capacidad informada en el día: la menor de los tramos que lo tocan. */
function CapacidadDelDia(tramos: TramoPerfil[], inicio: number, fin: number): { mw?: number; detalle: string } {
  const delDia = tramos.filter((t) => Date.parse(t.desde) < fin && Date.parse(t.hasta) > inicio);
  if (delDia.length === 0) {
    return { detalle: '' };
  }
  return {
    mw: delDia.reduce((menor, t) => Math.min(menor, t.mw), Number.POSITIVE_INFINITY),
    detalle: delDia
      .map((t) => `${FormatearFechaHoraVisible(t.desde)} – ${FormatearFechaHoraVisible(t.hasta)}: ${FormatearMw(t.mw)} MW`)
      .join('\n')
  };
}

function TextoPeriodo(periodo: PeriodoIndisponibilidad): string {
  const fin = periodo.fechaFin
    ? `fin ${FormatearFechaHoraVisible(periodo.fechaFin)}`
    : `fin estimado ${FormatearFechaHoraVisible(periodo.fechaFinEstimada)}`;
  return `${periodo.subequipoCodigo} · ${EtiquetaEstadoPeriodo(periodo.estadoCalculado)} · ${periodo.motivo} · ` +
    `desde ${FormatearFechaHoraVisible(periodo.fechaInicio)} · ${fin} · fuera ${FormatearMw(periodo.mwFuera)} MW`;
}

/**
 * Planificación de una central (vista de Disponibilidad de equipos): indisponibilidades del mes en un
 * calendario, capacidad que se informa a Meteológica por día, tramos, último envío y acciones.
 */
export default function PanelPlanificacionCentral(props: PanelPlanificacionCentralProps): React.ReactElement {
  const { context, centralId, nombreCentral, tarjetas } = props;
  const configurado = HayServicioPeriodos();
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth());
  const [tokenRecarga, setTokenRecarga] = useState(0);
  const tokenRefrescoGlobal = UseRefrescoOperadorRenovable();
  const [datos, setDatos] = useState<PlanificacionCentral | undefined>(undefined);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [aviso, setAviso] = useState<string | undefined>();
  const [mensaje, setMensaje] = useState<string | undefined>();
  const [pendientesMigracion, setPendientesMigracion] = useState(0);
  const [migrando, setMigrando] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [periodoModal, setPeriodoModal] = useState<{ periodo: PeriodoIndisponibilidad; modo: ModoModalPeriodo } | undefined>();
  const [subequipoDisp, setSubequipoDisp] = useState<SubequipoOperador | undefined>();

  const subequiposPorId = useMemo(() => {
    const mapa = new Map<number, { sub: SubequipoOperador; equipo: string }>();
    tarjetas.forEach((t) => t.subequipos.forEach((sub) => mapa.set(sub.id, { sub, equipo: t.nombreEquipo })));
    return mapa;
  }, [tarjetas]);

  const dias = useMemo(() => DiasDelMes(anio, mes), [anio, mes]);

  useEffect(() => {
    if (!configurado) {
      return undefined;
    }
    let vigente = true;
    setCargando(true);
    setError(undefined);
    const desde = new Date(anio, mes, 1).toISOString();
    const hasta = new Date(anio, mes + 1, 1).toISOString();
    ObtenerPlanificacionCentral(centralId, desde, hasta)
      .then((resultado) => {
        if (vigente) {
          setDatos(resultado);
        }
      })
      .catch((err: Error) => {
        if (vigente) {
          setDatos(undefined);
          setError(err instanceof PeriodosApiError ? err.message : 'No se pudo cargar la planificación.');
        }
      })
      .then(() => {
        if (vigente) {
          setCargando(false);
        }
      })
      .catch(() => undefined);
    return () => {
      vigente = false;
    };
  }, [configurado, centralId, anio, mes, tokenRecarga, tokenRefrescoGlobal]);

  useEffect(() => {
    if (!configurado) {
      return;
    }
    MigrarPeriodos(context, true)
      .then((r) => setPendientesMigracion(r.pendientes))
      .catch(() => setPendientesMigracion(0));
  }, [configurado, context, tokenRecarga]);

  const Recargar = useCallback((): void => setTokenRecarga((v) => v + 1), []);

  const CambiarMes = (delta: number): void => {
    const fecha = new Date(anio, mes + delta, 1);
    setAnio(fecha.getFullYear());
    setMes(fecha.getMonth());
  };

  const Migrar = (): void => {
    setMigrando(true);
    setAviso(undefined);
    MigrarIndisponibilidadesExistentes(context)
      .then((r) => {
        setMensaje(`Se registraron ${r.migrados} indisponibilidades existentes con fin estimado a 30 días.`);
        if (r.omitidos.length > 0) {
          setAviso(`No se migraron: ${r.omitidos.join('; ')}.`);
        }
        Recargar();
      })
      .catch((err: Error) => setAviso(err instanceof PeriodosApiError ? err.message : 'No se pudo migrar.'))
      .then(() => setMigrando(false))
      .catch(() => undefined);
  };

  const Reenviar = (): void => {
    setReenviando(true);
    setAviso(undefined);
    ReenviarPerfilYEstado(context, centralId)
      .then((r) => {
        if (r.envio.enviado && r.avisos.length === 0) {
          setMensaje(r.envio.mensaje);
        } else {
          setAviso([r.envio.enviado ? '' : r.envio.mensaje].concat(r.avisos).filter((p) => p).join(' '));
        }
        Recargar();
      })
      .catch((err: Error) => setAviso(err instanceof PeriodosApiError ? err.message : 'No se pudo reenviar.'))
      .then(() => setReenviando(false))
      .catch(() => undefined);
  };

  const ahora = Date.now();
  const periodos = datos?.periodos ?? [];
  const tramos = datos?.perfil.tramos ?? [];
  const maxima = datos?.perfil.capacidadMaximaMw ?? 0;
  const envio = datos?.ultimoEnvio;

  const CeldasPeriodo = (periodo: PeriodoIndisponibilidad): React.ReactElement[] => {
    const inicio = Date.parse(periodo.fechaInicio);
    const fin = FinPeriodo(periodo);
    const clase = ClaseEstado[periodo.estadoCalculado] ?? 'vigente';
    return dias.map((d) => {
      const cubre = periodo.estado !== 'ANULADO' && inicio < d.fin && fin > d.inicio;
      return (
        <td
          key={d.dia}
          className={`cowork-planificacion__dia${cubre ? ` cowork-planificacion__barra--${clase}` : ''}${
            d.inicio <= ahora && ahora < d.fin ? ' cowork-planificacion__dia--hoy' : ''
          }`}
          title={cubre ? TextoPeriodo(periodo) : undefined}
        />
      );
    });
  };

  return (
    <div className="cowork-planificacion">
      {!configurado ? (
        <div className="alert alert-info py-2">
          Para planificar las indisponibilidades con fecha estimada de fin, configure «URL indisponibilidades (períodos)» en
          las propiedades del Web Part.
        </div>
      ) : null}
      {error ? <div className="alert alert-danger py-2">{error}</div> : null}
      {aviso ? <div className="alert alert-warning py-2">{aviso}</div> : null}
      {mensaje ? <div className="alert alert-success py-2">{mensaje}</div> : null}
      {configurado && pendientesMigracion > 0 ? (
        <div className="alert alert-warning py-2 d-flex flex-wrap align-items-center gap-2">
          <span className="flex-grow-1">
            Hay {pendientesMigracion} subequipo{pendientesMigracion === 1 ? '' : 's'} marcado
            {pendientesMigracion === 1 ? '' : 's'} indisponible{pendientesMigracion === 1 ? '' : 's'} antes de las fechas
            estimadas: no {pendientesMigracion === 1 ? 'cuenta' : 'cuentan'} en la capacidad que se informa a Meteológica.
          </span>
          <button type="button" className="btn btn-sm btn-warning" onClick={Migrar} disabled={migrando}>
            {migrando ? 'Migrando…' : 'Migrar indisponibilidades existentes'}
          </button>
        </div>
      ) : null}

      <div className="cowork-vista__barra-acciones d-flex flex-wrap align-items-end gap-3 mb-3">
        <div>
          <span className="form-label form-label-sm mb-1 d-block">Mes</span>
          <div className="btn-group btn-group-sm" role="group" aria-label="Mes">
            <button type="button" className="btn btn-outline-secondary" onClick={() => CambiarMes(-1)} aria-label="Mes anterior">
              <i className="bi bi-chevron-left" aria-hidden="true" />
            </button>
            <span className="btn btn-outline-secondary disabled cowork-planificacion__mes">
              {Meses[mes]} {anio}
            </span>
            <button type="button" className="btn btn-outline-secondary" onClick={() => CambiarMes(1)} aria-label="Mes siguiente">
              <i className="bi bi-chevron-right" aria-hidden="true" />
            </button>
          </div>
        </div>
        {cargando ? <span className="small text-muted">Cargando…</span> : null}
      </div>

      {configurado && datos ? (
        <>
          <div className="card mb-3">
            <div className="card-body">
              <h3 className="h6 mb-2">
                Indisponibilidades y capacidad a Meteológica · {nombreCentral}
                <small className="text-muted fw-normal ms-2">capacidad máxima {FormatearMw(maxima)} MW</small>
              </h3>
              {/* Escritorio: calendario (una columna por día, sin scroll horizontal) */}
              <div className="d-none d-lg-block">
                <table className="table table-sm table-bordered mb-1 cowork-planificacion__calendario">
                  <thead>
                    <tr>
                      <th scope="col" className="cowork-planificacion__etiqueta">
                        Subequipo
                      </th>
                      {dias.map((d) => (
                        <th
                          key={d.dia}
                          scope="col"
                          className={`cowork-planificacion__dia text-center${
                            d.inicio <= ahora && ahora < d.fin ? ' cowork-planificacion__dia--hoy' : ''
                          }`}
                        >
                          {d.dia}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {periodos.length === 0 ? (
                      <tr>
                        <td colSpan={dias.length + 1} className="text-center text-muted small">
                          Sin indisponibilidades en el mes.
                        </td>
                      </tr>
                    ) : null}
                    {periodos.map((p) => (
                      <tr key={p.id}>
                        <th scope="row" className="cowork-planificacion__etiqueta fw-normal" title={TextoPeriodo(p)}>
                          <span className="fw-medium">{p.subequipoCodigo}</span>{' '}
                          <small className="text-muted">−{FormatearMw(p.mwFuera)} MW</small>
                        </th>
                        {CeldasPeriodo(p)}
                      </tr>
                    ))}
                    <tr className="cowork-planificacion__fila-capacidad">
                      <th scope="row" className="cowork-planificacion__etiqueta">
                        Capacidad a Meteológica (MW)
                      </th>
                      {dias.map((d) => {
                        const capacidad = CapacidadDelDia(tramos, d.inicio, d.fin);
                        const reducida = capacidad.mw !== undefined && capacidad.mw < maxima - 1e-6;
                        return (
                          <td
                            key={d.dia}
                            className={`cowork-planificacion__dia text-center${reducida ? ' cowork-planificacion__capacidad--reducida' : ''}`}
                            title={capacidad.detalle || undefined}
                          >
                            {capacidad.mw === undefined ? '' : FormatearMw(capacidad.mw)}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
                <p className="small text-muted mb-0">
                  <span className="cowork-planificacion__leyenda cowork-planificacion__barra--vigente" /> Vigente{' '}
                  <span className="cowork-planificacion__leyenda cowork-planificacion__barra--vencido ms-2" /> Vencida (se sigue
                  informando fuera){' '}
                  <span className="cowork-planificacion__leyenda cowork-planificacion__barra--programado ms-2" /> Programada{' '}
                  <span className="cowork-planificacion__leyenda cowork-planificacion__barra--finalizado ms-2" /> Finalizada. En
                  la fila de capacidad, el valor más bajo del día; el detalle de los tramos está en el tooltip.
                </p>
              </div>
              {/* Pantallas angostas: fichas por indisponibilidad */}
              <div className="d-lg-none">
                {periodos.length === 0 ? <p className="small text-muted mb-0">Sin indisponibilidades en el mes.</p> : null}
                {periodos.map((p) => (
                  <div key={p.id} className="border rounded p-2 mb-2 small">
                    <span className={`badge ${BadgeEstado[p.estadoCalculado] ?? 'text-bg-secondary'} me-1`}>
                      {EtiquetaEstadoPeriodo(p.estadoCalculado)}
                    </span>
                    {TextoPeriodo(p)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-lg-6">
              <div className="card h-100">
                <div className="card-body">
                  <h3 className="h6">Tramos del mes (capacidad de la central)</h3>
                  <table className="table table-sm mb-0 cowork-tabla-fichas">
                    <thead className="table-light">
                      <tr>
                        <th scope="col">Desde</th>
                        <th scope="col">Hasta</th>
                        <th scope="col" className="text-end">
                          MW
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tramos.map((t) => (
                        <tr key={t.desde} className={t.mw < maxima - 1e-6 ? 'table-warning' : undefined}>
                          <td data-label="Desde">{FormatearFechaHoraVisible(t.desde)}</td>
                          <td data-label="Hasta">{FormatearFechaHoraVisible(t.hasta)}</td>
                          <td data-label="MW" className="text-end">
                            {FormatearMw(t.mw)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                    <h3 className="h6 mb-0 flex-grow-1">Último envío a Meteológica</h3>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={Reenviar}
                      disabled={reenviando}
                    >
                      <i className="bi bi-arrow-repeat me-1" aria-hidden="true" />
                      {reenviando ? 'Reenviando…' : 'Reenviar'}
                    </button>
                  </div>
                  {envio ? (
                    <dl className="row small mb-0">
                      <dt className="col-sm-4">Estado</dt>
                      <dd className="col-sm-8">
                        <span className={`badge ${envio.estado === 'ENVIADO' ? 'text-bg-success' : 'text-bg-warning'}`}>
                          {envio.estado}
                        </span>
                        {envio.verificado ? <span className="ms-2 text-success">verificado</span> : null}
                      </dd>
                      <dt className="col-sm-4">Fecha</dt>
                      <dd className="col-sm-8">{FormatearFechaHoraVisible(envio.enviadoEn ?? envio.creadoEn)}</dd>
                      <dt className="col-sm-4">Origen</dt>
                      <dd className="col-sm-8">
                        {envio.accion} · {envio.usuario}
                      </dd>
                      <dt className="col-sm-4">Rango</dt>
                      <dd className="col-sm-8">
                        {FormatearFechaHoraVisible(envio.desde)} – {FormatearFechaHoraVisible(envio.hasta)} ·{' '}
                        {envio.tramos.length} tramo{envio.tramos.length === 1 ? '' : 's'}
                      </dd>
                      {envio.error ? (
                        <>
                          <dt className="col-sm-4">Detalle</dt>
                          <dd className="col-sm-8 text-danger">{envio.error}</dd>
                        </>
                      ) : null}
                    </dl>
                  ) : (
                    <p className="small text-muted mb-0">Todavía no se ha enviado un perfil de esta central.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h3 className="h6">Indisponibilidades del mes</h3>
              <table className="table table-sm mb-0 cowork-tabla-fichas cowork-tabla-fichas--lg">
                <thead className="table-light">
                  <tr>
                    <th scope="col">Subequipo</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Inicio</th>
                    <th scope="col">Fin estimado / fin</th>
                    <th scope="col" className="text-end">
                      MW fuera
                    </th>
                    <th scope="col">Motivo</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {periodos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center text-muted">
                        Sin indisponibilidades en el mes.
                      </td>
                    </tr>
                  ) : null}
                  {periodos.map((p) => {
                    const sub = subequiposPorId.get(p.subequipoId);
                    return (
                      <tr key={p.id}>
                        <td data-label="Subequipo">
                          <span className="fw-medium">{p.subequipoCodigo}</span>
                          {sub ? <small className="d-block text-muted">{sub.equipo}</small> : null}
                        </td>
                        <td data-label="Estado">
                          <span className={`badge ${BadgeEstado[p.estadoCalculado] ?? 'text-bg-secondary'}`}>
                            {EtiquetaEstadoPeriodo(p.estadoCalculado)}
                          </span>
                          {p.origen === 'MIGRACION' ? <small className="d-block text-muted">migrada</small> : null}
                        </td>
                        <td data-label="Inicio">{FormatearFechaHoraVisible(p.fechaInicio)}</td>
                        <td data-label="Fin estimado / fin">
                          {p.fechaFin ? (
                            <>
                              {FormatearFechaHoraVisible(p.fechaFin)} <small className="text-muted">(real)</small>
                            </>
                          ) : (
                            FormatearFechaHoraVisible(p.fechaFinEstimada)
                          )}
                        </td>
                        <td data-label="MW fuera" className="text-end">
                          {FormatearMw(p.mwFuera)}
                        </td>
                        <td data-label="Motivo">{p.motivo}</td>
                        <td data-label="Acciones" className="text-nowrap">
                          {PeriodoCubreAhora(p) && sub ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-success me-1"
                              title="Marcar disponibilidad"
                              aria-label={`Marcar disponibilidad de ${p.subequipoCodigo}`}
                              onClick={() => setSubequipoDisp(sub.sub)}
                            >
                              <i className="bi bi-check-lg" aria-hidden="true" />
                            </button>
                          ) : null}
                          {p.estado === 'ACTIVO' ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary me-1"
                              title="Modificar fecha estimada de fin"
                              aria-label={`Modificar fecha estimada de fin de ${p.subequipoCodigo}`}
                              onClick={() => setPeriodoModal({ periodo: p, modo: 'fechaEstimada' })}
                            >
                              <i className="bi bi-calendar-event" aria-hidden="true" />
                            </button>
                          ) : null}
                          {p.estado !== 'ANULADO' ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              title="Anular (registrada por error)"
                              aria-label={`Anular la indisponibilidad de ${p.subequipoCodigo}`}
                              onClick={() => setPeriodoModal({ periodo: p, modo: 'anular' })}
                            >
                              <i className="bi bi-x-octagon" aria-hidden="true" />
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      <ModalPeriodoIndisponibilidad
        context={context}
        periodo={periodoModal?.periodo}
        modo={periodoModal?.modo ?? 'fechaEstimada'}
        onCerrar={() => setPeriodoModal(undefined)}
        onGuardado={(avisoGuardado) => {
          setAviso(avisoGuardado);
          setMensaje(avisoGuardado ? undefined : 'Cambio guardado y perfil enviado a Meteológica.');
          Recargar();
        }}
      />
      <ModalMarcarDisponibilidadSubequipo
        context={context}
        visible={subequipoDisp !== undefined}
        subequipo={subequipoDisp}
        central={nombreCentral}
        onCerrar={() => setSubequipoDisp(undefined)}
        onGuardado={Recargar}
      />
    </div>
  );
}
