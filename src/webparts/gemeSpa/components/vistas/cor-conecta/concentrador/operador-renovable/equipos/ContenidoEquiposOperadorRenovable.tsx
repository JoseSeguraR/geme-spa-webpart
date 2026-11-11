import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { EquipoOperadorTarjeta, SubequipoOperador } from '../../../../../../models/operadorRenovable/CatalogoEquiposOperador';
import {
  DisponibilidadSubequipoIndisponible,
  EstadoSubequipoActivo
} from '../../../../../../services/sharepoint/operadorRenovable/CamposOperadorRenovable';
import CarcasaOperadorRenovable from '../CarcasaOperadorRenovable';
import { UseRefrescoOperadorRenovable } from '../UseRefrescoOperadorRenovable';
import type { FiltroCatalogoEquiposOperador } from '../constantesOperadorRenovable';
import ModalBitacoraSubequipoOperador from './ModalBitacoraSubequipoOperador';
import ModalMarcarDisponibilidadSubequipo from './ModalMarcarDisponibilidadSubequipo';
import ModalMarcarIndisponibilidadSubequipo from './ModalMarcarIndisponibilidadSubequipo';
import { UseCapacidadMeteologicaCentral } from './UseCapacidadMeteologicaCentral';
import { AvisoCapacidadMeteologica, EtiquetaCapacidadMeteologica, TextoCapacidadMeteologica } from './IndicadorCapacidadMeteologica';
import { UseCatalogoEquiposOperadorRenovable } from './UseCatalogoEquiposOperadorRenovable';
import ModalPeriodoIndisponibilidad from './ModalPeriodoIndisponibilidad';
import PanelPlanificacionCentral from '../planificacion/PanelPlanificacionCentral';
import type { PeriodoIndisponibilidad } from '../../../../../../services/sharepoint/operadorRenovable/PeriodosIndisponibilidadApiServicio';
import { FormatearFechaHoraVisible } from '../../../../../../utils/FechaHoraCorConecta';

export type ContenidoEquiposOperadorRenovableProps = {
  context: WebPartContext;
};

type ContextoSubequipoModal = {
  subequipos: SubequipoOperador[];
  nombreEquipo: string;
  central: string;
  centralId?: number;
  capacidadEquipoMw?: number;
};

function EsActivo(sub: SubequipoOperador): boolean {
  return sub.estadoRegistro === EstadoSubequipoActivo;
}

function EsIndisponible(sub: SubequipoOperador): boolean {
  return sub.disponibilidad === DisponibilidadSubequipoIndisponible;
}

/**
 * Filas de la tarjeta según el filtro (maqueta `filasSubequiposEquipo`): Disponible / Indisponible muestran solo
 * subequipos activos en ese estado; Todos agrega los dados de baja.
 */
function FilasSegunFiltro(equipo: EquipoOperadorTarjeta, filtro: FiltroCatalogoEquiposOperador): SubequipoOperador[] {
  if (filtro === 'todos') {
    return equipo.subequipos;
  }
  return equipo.subequipos.filter((s) => EsActivo(s) && (filtro === 'indisponible' ? EsIndisponible(s) : !EsIndisponible(s)));
}

function FormatearMw(valor: number): string {
  return `${valor.toLocaleString('es-CL', { maximumFractionDigits: 2 })} MW`;
}

function FormatearKw(valorMw: number): string {
  return `${(valorMw * 1000).toLocaleString('es-CL', { maximumFractionDigits: 0 })} kW`;
}

/** 3 columnas desde 992 px, 2 desde 768 px y 1 en pantallas angostas (maqueta `columnasCentrales`). */
function UseNumeroColumnasTarjetas(): number {
  const Calcular = (): number => (window.innerWidth >= 992 ? 3 : window.innerWidth >= 768 ? 2 : 1);
  const [columnas, setColumnas] = useState(Calcular);
  useEffect(() => {
    const AlCambiarTamano = (): void => setColumnas(Calcular());
    window.addEventListener('resize', AlCambiarTamano);
    return () => window.removeEventListener('resize', AlCambiarTamano);
  }, []);
  return columnas;
}

/** Casilla «Seleccionar todos» con estado intermedio (no existe como atributo de React). */
function CasillaSeleccionarTodos(props: {
  marcada: boolean;
  intermedia: boolean;
  onCambio: (marcada: boolean) => void;
  etiqueta: string;
}): React.ReactElement {
  const { marcada, intermedia, onCambio, etiqueta } = props;
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = intermedia;
    }
  }, [intermedia]);
  return (
    <label className="form-check-label small d-inline-flex align-items-center gap-2 mb-0">
      <input
        ref={ref}
        type="checkbox"
        className="form-check-input mt-0"
        checked={marcada}
        aria-label={etiqueta}
        onChange={(e) => onCambio(e.target.checked)}
      />
      Seleccionar todos
    </label>
  );
}

export default function ContenidoEquiposOperadorRenovable(
  props: ContenidoEquiposOperadorRenovableProps
): React.ReactElement {
  const { context } = props;
  const [filtroCatalogo, setFiltroCatalogo] = useState<FiltroCatalogoEquiposOperador>('todos');
  const [filtroCentralId, setFiltroCentralId] = useState('');
  const [textoBusqueda, setTextoBusqueda] = useState('');
  const [tokenRecarga, setTokenRecarga] = useState(0);
  const tokenRefrescoGlobal = UseRefrescoOperadorRenovable();
  const [seleccionSubequipos, setSeleccionSubequipos] = useState<ReadonlySet<number>>(() => new Set());
  const [tarjetasColapsadas, setTarjetasColapsadas] = useState<ReadonlySet<number>>(() => new Set());
  /** Equipo marcado en su cabecera: los indicadores se calculan solo para él (maqueta `equipoKpiSeleccionado`). */
  const [equipoKpiId, setEquipoKpiId] = useState<number | undefined>(undefined);
  const [contextoIndisp, setContextoIndisp] = useState<ContextoSubequipoModal | undefined>(undefined);
  const [contextoDisp, setContextoDisp] = useState<ContextoSubequipoModal | undefined>(undefined);
  const [contextoBitacora, setContextoBitacora] = useState<ContextoSubequipoModal | undefined>(undefined);
  const [periodoFechaEstimada, setPeriodoFechaEstimada] = useState<PeriodoIndisponibilidad | undefined>(undefined);
  const [avisoPeriodo, setAvisoPeriodo] = useState<string | undefined>(undefined);
  /** Vista de la central elegida: sus equipos o su planificación (solo con una central seleccionada). */
  const [vista, setVista] = useState<'equipos' | 'planificacion'>('equipos');

  // «Todos» incluye los subequipos dados de baja: solo entonces se piden también los inactivos.
  const { estado, tarjetas, error, errorPeriodos, recargar } = UseCatalogoEquiposOperadorRenovable(
    context,
    tokenRecarga + tokenRefrescoGlobal,
    filtroCatalogo === 'todos'
  );
  const numeroColumnas = UseNumeroColumnasTarjetas();

  /** Como la maqueta: solo equipos con al menos un subequipo activo. */
  const equiposCatalogo = useMemo(() => tarjetas.filter((eq) => eq.subequipos.some(EsActivo)), [tarjetas]);

  const centralesDisponibles = useMemo(() => {
    const mapa = new Map<number, string>();
    for (const eq of equiposCatalogo) {
      mapa.set(eq.centralId, eq.central);
    }
    return Array.from(mapa.entries())
      .map(([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }, [equiposCatalogo]);

  const idCentralSeleccionada = filtroCentralId ? Number.parseInt(filtroCentralId, 10) : undefined;
  const nombreCentralSeleccionada = centralesDisponibles.filter((c) => c.id === idCentralSeleccionada)[0]?.nombre ?? '';
  const verPlanificacion = vista === 'planificacion' && idCentralSeleccionada !== undefined;

  // Sin central no hay planificación: se vuelve a los equipos
  useEffect(() => {
    if (!filtroCentralId) {
      setVista('equipos');
    }
  }, [filtroCentralId]);
  const capacidadMeteologica = UseCapacidadMeteologicaCentral(
    context,
    idCentralSeleccionada !== undefined && Number.isFinite(idCentralSeleccionada) ? idCentralSeleccionada : undefined
  );
  /** Capacidad de la central según GEME (todas sus tarjetas, sin filtros de catálogo ni búsqueda). */
  const capacidadGemeCentralMw = useMemo(
    () =>
      equiposCatalogo
        .filter((equipo) => equipo.centralId === idCentralSeleccionada)
        .reduce((suma, equipo) => suma + equipo.totalMw, 0),
    [equiposCatalogo, idCentralSeleccionada]
  );

  const equiposVisibles = useMemo(() => {
    const texto = textoBusqueda.trim().toLowerCase();
    return equiposCatalogo.filter((equipo) => {
      if (idCentralSeleccionada !== undefined && Number.isFinite(idCentralSeleccionada) && equipo.centralId !== idCentralSeleccionada) {
        return false;
      }
      if (!texto) {
        return true;
      }
      const blob = [
        equipo.central,
        equipo.nombreEquipo,
        ...equipo.subequipos.map((s) => [s.codigo, s.nombre, s.tipoCodigo, s.tipoNombre].join(' '))
      ]
        .join(' ')
        .toLowerCase();
      return blob.indexOf(texto) >= 0;
    });
  }, [equiposCatalogo, idCentralSeleccionada, textoBusqueda]);

  useEffect(() => {
    if (equipoKpiId !== undefined && !equiposVisibles.some((eq) => eq.id === equipoKpiId)) {
      setEquipoKpiId(undefined);
    }
  }, [equiposVisibles, equipoKpiId]);

  const equiposKpi = useMemo(
    () => (equipoKpiId !== undefined ? equiposVisibles.filter((eq) => eq.id === equipoKpiId) : equiposVisibles),
    [equiposVisibles, equipoKpiId]
  );

  const kpis = useMemo(() => {
    let totalMw = 0;
    let indispMw = 0;
    for (const eq of equiposKpi) {
      totalMw += eq.totalMw;
      indispMw += eq.indisponibleMw;
    }
    const dispMw = Math.max(0, totalMw - indispMw);
    const pct = totalMw > 0 ? (indispMw / totalMw) * 100 : 0;
    return { totalMw, dispMw, indispMw, pct };
  }, [equiposKpi]);

  const resumen = useMemo(() => {
    const total = equiposCatalogo.length;
    if (total === 0) {
      return '';
    }
    const n = equiposKpi.length;
    const conAlerta = equiposKpi.filter((eq) => eq.subequipos.some((s) => EsActivo(s) && EsIndisponible(s))).length;
    const subequipos = equiposKpi.reduce((suma, eq) => suma + FilasSegunFiltro(eq, filtroCatalogo).length, 0);
    let texto = `${n} equipo${n === 1 ? '' : 's'}${equipoKpiId !== undefined ? ' seleccionado' : ''}`;
    if (equipoKpiId === undefined && n !== total) {
      texto += ` de ${total}`;
    }
    if (conAlerta) {
      texto += ` · ${conAlerta} con indisponibilidad`;
    }
    return `${texto} · ${subequipos} subequipo${subequipos === 1 ? '' : 's'}`;
  }, [equiposCatalogo, equiposKpi, equipoKpiId, filtroCatalogo]);

  const TrasGuardar = (): void => {
    setSeleccionSubequipos(new Set());
    setTokenRecarga((valor) => valor + 1);
    recargar();
  };

  const CambiarSeleccion = (ids: number[], marcado: boolean): void => {
    setSeleccionSubequipos((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (marcado ? next.add(id) : next.delete(id)));
      return next;
    });
  };

  const AlternarColapsoTarjeta = (equipoId: number): void => {
    setTarjetasColapsadas((prev) => {
      const next = new Set(prev);
      if (next.has(equipoId)) {
        next.delete(equipoId);
      } else {
        next.add(equipoId);
      }
      return next;
    });
  };

  const AbrirIndisp = (equipo: EquipoOperadorTarjeta, subs: SubequipoOperador[]): void => {
    if (subs.length > 0) {
      setContextoIndisp({
        subequipos: subs,
        nombreEquipo: equipo.nombreEquipo,
        central: equipo.central,
        centralId: equipo.centralId,
        capacidadEquipoMw: equipo.totalMw
      });
    }
  };

  const AbrirDisp = (equipo: EquipoOperadorTarjeta, subs: SubequipoOperador[]): void => {
    if (subs.length > 0) {
      setContextoDisp({ subequipos: subs, nombreEquipo: equipo.nombreEquipo, central: equipo.central });
    }
  };

  /**
   * Una sola acción según el estado (maqueta `botonesDisponibilidad`): disponible → ✕ marcar indisponibilidad;
   * indisponible → ✓ marcar disponibilidad; dado de baja → solo bitácora.
   */
  const AccionesSubequipo = (equipo: EquipoOperadorTarjeta, sub: SubequipoOperador): React.ReactElement => (
    <div className="d-flex gap-1 flex-shrink-0">
      {!EsActivo(sub) ? null : EsIndisponible(sub) ? (
        <>
          <button
            type="button"
            className="btn btn-sm btn-success"
            title="Marcar disponibilidad"
            aria-label={`Marcar disponibilidad de ${sub.codigo}`}
            onClick={() => AbrirDisp(equipo, [sub])}
          >
            <i className="bi bi-check-lg" aria-hidden="true" />
          </button>
          {sub.periodoVigente ? (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              title="Modificar fecha estimada de fin"
              aria-label={`Modificar fecha estimada de fin de ${sub.codigo}`}
              onClick={() => setPeriodoFechaEstimada(sub.periodoVigente)}
            >
              <i className="bi bi-calendar-event" aria-hidden="true" />
            </button>
          ) : null}
        </>
      ) : (
        <button
          type="button"
          className="btn btn-sm btn-danger"
          title="Marcar indisponibilidad"
          aria-label={`Marcar indisponibilidad de ${sub.codigo}`}
          onClick={() => AbrirIndisp(equipo, [sub])}
        >
          <i className="bi bi-x-lg" aria-hidden="true" />
        </button>
      )}
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary"
        title="Ver bitácora"
        aria-label={`Bitácora de ${sub.codigo}`}
        onClick={() => setContextoBitacora({ subequipos: [sub], nombreEquipo: equipo.nombreEquipo, central: equipo.central })}
      >
        <i className="bi bi-journal-text" aria-hidden="true" />
      </button>
    </div>
  );

  const etiquetaTipo = (sub: SubequipoOperador): string => sub.tipoNombre || sub.tipoCodigo || '';

  const TarjetaEquipo = (equipo: EquipoOperadorTarjeta): React.ReactElement => {
    const filas = FilasSegunFiltro(equipo, filtroCatalogo);
    const seleccionables = filas.filter(EsActivo);
    const seleccionados = seleccionables.filter((s) => seleccionSubequipos.has(s.id));
    const paraIndisp = seleccionados.filter((s) => !EsIndisponible(s));
    const paraDisp = seleccionados.filter(EsIndisponible);
    const indisponibles = equipo.subequipos.filter((s) => EsActivo(s) && EsIndisponible(s)).length;
    const pct = equipo.totalMw > 0 ? Math.min(100, (equipo.indisponibleMw / equipo.totalMw) * 100) : 0;
    const colapsada = tarjetasColapsadas.has(equipo.id);
    const kpiSeleccionado = equipoKpiId === equipo.id;
    const idLista = `cowork-or-equipo-${equipo.id}`;

    return (
      <div
        key={equipo.id}
        className={`card mb-3 cowork-operador-renovable__tarjeta-equipo${
          indisponibles > 0 ? ' cowork-operador-renovable__tarjeta-equipo--alerta' : ''
        }${kpiSeleccionado ? ' cowork-operador-renovable__tarjeta-equipo--seleccionada' : ''}`}
      >
        <div className="card-header d-flex align-items-start gap-2 py-2">
          <input
            type="checkbox"
            className="form-check-input mt-1 flex-shrink-0"
            checked={kpiSeleccionado}
            title="Mostrar indicadores solo de este equipo"
            aria-label={`Mostrar indicadores solo de ${equipo.nombreEquipo}`}
            onChange={(e) => setEquipoKpiId(e.target.checked ? equipo.id : undefined)}
          />
          <button
            type="button"
            className="btn btn-link p-0 text-start text-reset text-decoration-none flex-grow-1 cowork-operador-renovable__cabecera-equipo"
            aria-expanded={!colapsada}
            aria-controls={idLista}
            onClick={() => AlternarColapsoTarjeta(equipo.id)}
          >
            <span className="d-flex justify-content-between align-items-start gap-2">
              <span>
                <span className="d-block fw-semibold">{equipo.nombreEquipo}</span>
                <small className="text-muted">{equipo.central}</small>
              </span>
              <i className={`bi ${colapsada ? 'bi-chevron-right' : 'bi-chevron-down'} text-secondary`} aria-hidden="true" />
            </span>
            <span className="d-flex flex-wrap gap-1 mt-1">
              <span className="cowork-operador-renovable__chip">{filas.length} subeq.</span>
              <span className="cowork-operador-renovable__chip">{FormatearMw(equipo.totalMw)}</span>
              <span className="cowork-operador-renovable__chip cowork-operador-renovable__chip--ok">
                {FormatearMw(Math.max(0, equipo.totalMw - equipo.indisponibleMw))} disp.
              </span>
              {indisponibles > 0 ? (
                <span className="cowork-operador-renovable__chip cowork-operador-renovable__chip--alerta">{indisponibles} indisp.</span>
              ) : null}
              <span className={`cowork-operador-renovable__chip${pct > 0 ? ' cowork-operador-renovable__chip--alerta' : ''}`}>
                {pct.toFixed(1)}% fuera
              </span>
            </span>
            <span
              className="progress mt-2 cowork-operador-renovable__barra"
              title={`${FormatearMw(Math.max(0, equipo.totalMw - equipo.indisponibleMw))} disponible · ${FormatearMw(
                equipo.indisponibleMw
              )} indisponible de ${FormatearMw(equipo.totalMw)}`}
            >
              <span className="progress-bar bg-danger" style={{ width: `${pct}%` }} />
            </span>
          </button>
        </div>

        {seleccionados.length > 0 ? (
          <div className="d-flex flex-wrap align-items-center gap-2 px-3 py-2 border-bottom bg-light">
            <span className="small fw-medium me-auto">
              {seleccionados.length} seleccionado{seleccionados.length === 1 ? '' : 's'}
            </span>
            {paraIndisp.length > 0 ? (
              <button type="button" className="btn btn-sm btn-outline-danger" title="Marcar indisponibilidad" onClick={() => AbrirIndisp(equipo, paraIndisp)}>
                Indisp.
              </button>
            ) : null}
            {paraDisp.length > 0 ? (
              <button type="button" className="btn btn-sm btn-outline-success" title="Marcar disponibilidad" onClick={() => AbrirDisp(equipo, paraDisp)}>
                Disp.
              </button>
            ) : null}
          </div>
        ) : null}

        {colapsada ? null : (
          <div id={idLista}>
            {seleccionables.length > 0 ? (
              <div className="px-3 pt-2">
                <CasillaSeleccionarTodos
                  marcada={seleccionados.length === seleccionables.length}
                  intermedia={seleccionados.length > 0 && seleccionados.length < seleccionables.length}
                  etiqueta={`Seleccionar todos los subequipos de ${equipo.nombreEquipo}`}
                  onCambio={(marcada) => CambiarSeleccion(seleccionables.map((s) => s.id), marcada)}
                />
              </div>
            ) : null}
            {filas.length === 0 ? (
              <p className="text-muted small px-3 py-2 mb-0">No hay subequipos con este filtro.</p>
            ) : (
              <ul className="list-group list-group-flush">
                {filas.map((sub) => {
                  const activo = EsActivo(sub);
                  const indisp = EsIndisponible(sub);
                  return (
                    <li
                      key={sub.id}
                      className={`list-group-item d-flex align-items-center gap-2 py-2${
                        !activo ? ' cowork-operador-renovable__fila--baja' : indisp ? ' cowork-operador-renovable__fila--indisp' : ''
                      }`}
                    >
                      {activo ? (
                        <input
                          type="checkbox"
                          className="form-check-input mt-0 flex-shrink-0"
                          checked={seleccionSubequipos.has(sub.id)}
                          aria-label={`Seleccionar ${sub.codigo}`}
                          onChange={(e) => CambiarSeleccion([sub.id], e.target.checked)}
                        />
                      ) : (
                        <span className="cowork-operador-renovable__casilla-vacia" aria-hidden="true" />
                      )}
                      <span
                        className={`cowork-operador-renovable__punto ${
                          !activo
                            ? 'cowork-operador-renovable__punto--baja'
                            : indisp
                              ? 'cowork-operador-renovable__punto--indisp'
                              : 'cowork-operador-renovable__punto--disp'
                        }`}
                        title={!activo ? 'Dado de baja' : indisp ? 'Indisponible' : 'Disponible'}
                        aria-label={!activo ? 'Dado de baja' : indisp ? 'Indisponible' : 'Disponible'}
                      />
                      <span className="flex-grow-1 min-w-0">
                        <span className="d-block fw-medium">
                          {sub.codigo}
                          {sub.nombre && sub.nombre !== sub.codigo ? ` · ${sub.nombre}` : ''}
                        </span>
                        <small className="text-muted">
                          {[etiquetaTipo(sub), !activo ? 'Dado de baja' : ''].filter(Boolean).join(' · ')}
                        </small>
                        {activo && sub.periodoVigente ? (
                          <small className="d-block">
                            {sub.periodoVigente.estadoCalculado === 'VENCIDO' ? (
                              <span className="badge text-bg-danger me-1">Vencida</span>
                            ) : null}
                            <span className="text-muted">
                              Fin estimado {FormatearFechaHoraVisible(sub.periodoVigente.fechaFinEstimada)}
                            </span>
                          </small>
                        ) : null}
                        {activo && sub.periodoProgramado ? (
                          <small className="d-block">
                            <span className="badge text-bg-warning me-1">Programada</span>
                            <span className="text-muted">
                              Sale el {FormatearFechaHoraVisible(sub.periodoProgramado.fechaInicio)}
                            </span>
                          </small>
                        ) : null}
                      </span>
                      <span className="small text-nowrap text-end">
                        {FormatearMw(sub.capacidadMw)}
                        {activo && indisp ? (
                          <span className="d-block text-danger">(queda en {FormatearMw(sub.capacidadActualMw)})</span>
                        ) : null}
                      </span>
                      {AccionesSubequipo(equipo, sub)}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    );
  };

  // Columnas independientes (como la maqueta): abrir una tarjeta solo empuja a las de su misma columna.
  const columnasTarjetas = useMemo(() => {
    const columnas: EquipoOperadorTarjeta[][] = [];
    for (let i = 0; i < numeroColumnas; i++) {
      columnas.push([]);
    }
    equiposVisibles.forEach((equipo, i) => columnas[i % numeroColumnas].push(equipo));
    return columnas;
  }, [equiposVisibles, numeroColumnas]);

  const hayFiltroOSeleccion = equipoKpiId !== undefined || filtroCentralId !== '';

  return (
    <CarcasaOperadorRenovable tabActiva="equipos">
      {error ? <div className="alert alert-danger py-2">{error}</div> : null}
      {errorPeriodos ? <div className="alert alert-warning py-2">{errorPeriodos}</div> : null}
      {avisoPeriodo ? <div className="alert alert-warning py-2">{avisoPeriodo}</div> : null}
      {estado === 'cargando' && tarjetas.length === 0 ? (
        <p className="text-muted mb-3">Cargando equipos desde SharePoint…</p>
      ) : null}

      <div className="row g-2 mb-2">
        {[
          { etiqueta: 'Capacidad total', valor: FormatearMw(kpis.totalMw), detalle: FormatearKw(kpis.totalMw), clase: 'primary' },
          { etiqueta: 'Disponible', valor: FormatearMw(kpis.dispMw), detalle: FormatearKw(kpis.dispMw), clase: 'success' },
          {
            etiqueta: 'Indisponibilidad actual',
            valor: FormatearMw(kpis.indispMw),
            detalle: FormatearKw(kpis.indispMw),
            clase: 'danger'
          },
          { etiqueta: '% sobre 100', valor: `${kpis.pct.toFixed(1)} %`, barra: kpis.pct, clase: 'warning' },
          ...(capacidadMeteologica.estado === 'sinCentral'
            ? []
            : [
                {
                  etiqueta: EtiquetaCapacidadMeteologica,
                  valor: TextoCapacidadMeteologica(capacidadMeteologica),
                  clase: 'info'
                }
              ])
        ].map((kpi) => (
          <div key={kpi.etiqueta} className="col-6 col-lg">
            <div className={`card h-100 cowork-operador-renovable__kpi border-${kpi.clase}`}>
              <div className="card-body py-2">
                <div className="text-muted text-uppercase small">{kpi.etiqueta}</div>
                <div className="fs-5 fw-semibold">{equiposKpi.length === 0 ? '—' : kpi.valor}</div>
                {'detalle' in kpi && kpi.detalle && equiposKpi.length > 0 ? <small className="text-muted">{kpi.detalle}</small> : null}
                {'barra' in kpi && kpi.barra !== undefined ? (
                  <div className="progress mt-2 cowork-operador-renovable__barra" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Number(kpi.barra.toFixed(1))}>
                    <div className="progress-bar bg-warning" style={{ width: `${Math.min(kpi.barra, 100)}%` }} />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
      {resumen ? <p className="small text-muted mb-3">{resumen}</p> : null}
      <AvisoCapacidadMeteologica capacidad={capacidadMeteologica} capacidadGemeMw={capacidadGemeCentralMw} />

      <div className="cowork-vista__barra-acciones d-flex flex-wrap align-items-end gap-3 mb-3">
        <div style={{ maxWidth: '14rem' }}>
          <label className="form-label form-label-sm mb-1" htmlFor="filtro-central-or">
            Central
          </label>
          <select
            id="filtro-central-or"
            className="form-select form-select-sm"
            value={filtroCentralId}
            onChange={(e) => setFiltroCentralId(e.target.value)}
          >
            <option value="">Todas las centrales</option>
            {centralesDisponibles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span className="form-label form-label-sm mb-1 d-block">Ver</span>
          <div className="btn-group btn-group-sm" role="group" aria-label="Vista de la central">
            <button
              type="button"
              className={`btn ${vista === 'equipos' ? 'btn-primary' : 'btn-outline-primary'}`}
              aria-pressed={vista === 'equipos'}
              onClick={() => setVista('equipos')}
            >
              <i className="bi bi-grid-3x3-gap me-1" aria-hidden="true" />
              Equipos
            </button>
            <button
              type="button"
              className={`btn ${verPlanificacion ? 'btn-primary' : 'btn-outline-primary'}`}
              aria-pressed={verPlanificacion}
              disabled={idCentralSeleccionada === undefined}
              title={idCentralSeleccionada === undefined ? 'Seleccione una central para ver su planificación' : undefined}
              onClick={() => setVista('planificacion')}
            >
              <i className="bi bi-calendar-range me-1" aria-hidden="true" />
              Planificación
            </button>
          </div>
        </div>
        {verPlanificacion ? null : (
          <>
            <div className="flex-grow-1" style={{ maxWidth: '20rem' }}>
              <label className="form-label form-label-sm mb-1" htmlFor="buscar-equipos-or">
                Buscar
              </label>
              <input
                id="buscar-equipos-or"
                type="search"
                className="form-control form-control-sm"
                placeholder="Equipo, código o subequipo"
                value={textoBusqueda}
                onChange={(e) => setTextoBusqueda(e.target.value)}
              />
            </div>
            <fieldset className="cowork-vista__radios-estado d-flex flex-wrap gap-3 mb-1 border-0 p-0">
              <legend className="visually-hidden">Disponibilidad de los subequipos</legend>
              {(
                [
                  ['disponible', 'Disponible'],
                  ['indisponible', 'Indisponible'],
                  ['todos', 'Todos']
                ] as const
              ).map(([valor, etiqueta]) => {
                const idRadio = `filtro-cat-or-${valor}`;
                return (
                  <div key={valor} className="form-check form-check-inline mb-0">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="filtro-cat-or"
                      id={idRadio}
                      checked={filtroCatalogo === valor}
                      onChange={() => setFiltroCatalogo(valor)}
                    />
                    <label className="form-check-label" htmlFor={idRadio}>
                      {etiqueta}
                    </label>
                  </div>
                );
              })}
            </fieldset>
            <div className="d-flex flex-wrap gap-2 ms-auto">
              {hayFiltroOSeleccion ? (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  title="Quitar el equipo seleccionado y volver a todas las centrales"
                  onClick={() => {
                    setEquipoKpiId(undefined);
                    setFiltroCentralId('');
                  }}
                >
                  Quitar selección
                </button>
              ) : null}
              <button type="button" className="btn btn-sm btn-outline-secondary" title="Abrir todas las listas visibles" onClick={() => setTarjetasColapsadas(new Set())}>
                Expandir
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                title="Cerrar todas las listas"
                onClick={() => setTarjetasColapsadas(new Set(equiposVisibles.map((eq) => eq.id)))}
              >
                Cerrar
              </button>
            </div>
          </>
        )}
      </div>

      {verPlanificacion && idCentralSeleccionada !== undefined ? (
        <PanelPlanificacionCentral
          context={context}
          centralId={idCentralSeleccionada}
          nombreCentral={nombreCentralSeleccionada}
          tarjetas={equiposCatalogo.filter((eq) => eq.centralId === idCentralSeleccionada)}
        />
      ) : (
        <>
          {estado === 'listo' && equiposCatalogo.length > 0 && equiposVisibles.length === 0 ? (
            <div className="alert alert-info py-2">No hay equipos que coincidan con la búsqueda.</div>
          ) : null}
          {estado === 'listo' && equiposCatalogo.length === 0 ? (
            <p className="text-muted mb-0">No hay equipos en el catálogo o no tiene centrales renovables asignadas.</p>
          ) : null}

          <div className="row g-3 cowork-operador-renovable__grid-tarjetas">
            {columnasTarjetas.map((columna, i) => (
              <div key={i} className="col">
                {columna.map(TarjetaEquipo)}
              </div>
            ))}
          </div>
        </>
      )}

      <ModalMarcarIndisponibilidadSubequipo
        context={context}
        visible={contextoIndisp !== undefined}
        subequipos={contextoIndisp?.subequipos}
        nombreEquipo={contextoIndisp?.nombreEquipo}
        central={contextoIndisp?.central}
        centralId={contextoIndisp?.centralId}
        capacidadEquipoMw={contextoIndisp?.capacidadEquipoMw}
        onCerrar={() => setContextoIndisp(undefined)}
        onGuardado={TrasGuardar}
      />
      <ModalMarcarDisponibilidadSubequipo
        context={context}
        visible={contextoDisp !== undefined}
        subequipos={contextoDisp?.subequipos}
        nombreEquipo={contextoDisp?.nombreEquipo}
        central={contextoDisp?.central}
        onCerrar={() => setContextoDisp(undefined)}
        onGuardado={TrasGuardar}
      />
      <ModalBitacoraSubequipoOperador
        context={context}
        visible={contextoBitacora !== undefined && contextoBitacora.subequipos.length > 0}
        subequipo={contextoBitacora?.subequipos[0]}
        nombreEquipo={contextoBitacora?.nombreEquipo}
        central={contextoBitacora?.central}
        onCerrar={() => setContextoBitacora(undefined)}
      />
      <ModalPeriodoIndisponibilidad
        context={context}
        periodo={periodoFechaEstimada}
        modo="fechaEstimada"
        onCerrar={() => setPeriodoFechaEstimada(undefined)}
        onGuardado={(aviso) => {
          setAvisoPeriodo(aviso);
          TrasGuardar();
        }}
      />
    </CarcasaOperadorRenovable>
  );
}
