import * as React from 'react';
import { useMemo, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { EquipoOperadorTarjeta, SubequipoOperador } from '../../../../../../models/operadorRenovable/CatalogoEquiposOperador';
import { EstadoSubequipoActivo } from '../../../../../../services/sharepoint/operadorRenovable/CamposOperadorRenovable';
import { CalcularMwFueraServicio } from '../../../../../../services/sharepoint/operadorRenovable/UtilidadesCapacidadSubequipo';
import CarcasaOperadorRenovable from '../CarcasaOperadorRenovable';
import { UseRefrescoOperadorRenovable } from '../UseRefrescoOperadorRenovable';
import type { FiltroCatalogoEquiposOperador } from '../constantesOperadorRenovable';
import ModalBitacoraSubequipoOperador from './ModalBitacoraSubequipoOperador';
import ModalMarcarDisponibilidadSubequipo from './ModalMarcarDisponibilidadSubequipo';
import ModalMarcarIndisponibilidadSubequipo from './ModalMarcarIndisponibilidadSubequipo';
import { UseCatalogoEquiposOperadorRenovable } from './UseCatalogoEquiposOperadorRenovable';

export type ContenidoEquiposOperadorRenovableProps = {
  context: WebPartContext;
};

type ContextoSubequipoModal = {
  subequipos: SubequipoOperador[];
  nombreEquipo: string;
  central: string;
};

function SubequiposActivos(equipo: EquipoOperadorTarjeta): SubequipoOperador[] {
  return equipo.subequipos.filter((s) => s.estadoRegistro === EstadoSubequipoActivo);
}

function EquipoVisiblePorCatalogo(equipo: EquipoOperadorTarjeta, filtro: FiltroCatalogoEquiposOperador): boolean {
  if (filtro === 'todos') {
    return equipo.subequipos.length > 0;
  }
  const activos = SubequiposActivos(equipo);
  if (activos.length === 0) {
    return false;
  }
  const hayIndisp = activos.some((s) => s.disponibilidad === 'Indisponible');
  return filtro === 'indisponible' ? hayIndisp : !hayIndisp;
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
  const [contextoIndisp, setContextoIndisp] = useState<ContextoSubequipoModal | undefined>(undefined);
  const [contextoDisp, setContextoDisp] = useState<ContextoSubequipoModal | undefined>(undefined);
  const [contextoBitacora, setContextoBitacora] = useState<ContextoSubequipoModal | undefined>(undefined);

  const incluirInactivos = filtroCatalogo === 'todos';
  const { estado, tarjetas, error, recargar } = UseCatalogoEquiposOperadorRenovable(
    context,
    tokenRecarga + tokenRefrescoGlobal,
    incluirInactivos
  );

  const centralesDisponibles = useMemo(() => {
    const mapa = new Map<number, string>();
    for (const eq of tarjetas) {
      mapa.set(eq.centralId, eq.central);
    }
    return Array.from(mapa.entries())
      .map(([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }, [tarjetas]);

  const equiposVisibles = useMemo(() => {
    const texto = textoBusqueda.trim().toLowerCase();
    const idCentralFiltro = filtroCentralId ? Number.parseInt(filtroCentralId, 10) : undefined;
    return tarjetas.filter((equipo) => {
      if (!EquipoVisiblePorCatalogo(equipo, filtroCatalogo)) {
        return false;
      }
      if (idCentralFiltro !== undefined && Number.isFinite(idCentralFiltro) && equipo.centralId !== idCentralFiltro) {
        return false;
      }
      if (!texto) {
        return true;
      }
      const blob = [
        equipo.central,
        equipo.nombreEquipo,
        ...equipo.subequipos.map((s) => [s.codigo, s.tipoCodigo, s.tipoNombre].join(' '))
      ]
        .join(' ')
        .toLowerCase();
      return blob.includes(texto);
    });
  }, [tarjetas, filtroCatalogo, filtroCentralId, textoBusqueda]);

  const kpis = useMemo(() => {
    let totalMw = 0;
    let indispMw = 0;
    for (const eq of equiposVisibles) {
      totalMw += eq.totalMw;
      indispMw += eq.indisponibleMw;
    }
    const dispMw = Math.max(0, totalMw - indispMw);
    const pct = totalMw > 0 ? (indispMw / totalMw) * 100 : 0;
    return { totalMw, dispMw, indispMw, pct };
  }, [equiposVisibles]);

  const TrasGuardar = (): void => {
    setSeleccionSubequipos(new Set());
    setTokenRecarga((valor) => valor + 1);
    recargar();
  };

  const SubsSeleccionados = useMemo((): SubequipoOperador[] => {
    const lista: SubequipoOperador[] = [];
    for (const eq of equiposVisibles) {
      for (const sub of eq.subequipos) {
        if (seleccionSubequipos.has(sub.id)) {
          lista.push(sub);
        }
      }
    }
    return lista;
  }, [equiposVisibles, seleccionSubequipos]);

  const AlternarSeleccionSub = (subId: number, marcado: boolean): void => {
    setSeleccionSubequipos((prev) => {
      const next = new Set(prev);
      if (marcado) {
        next.add(subId);
      } else {
        next.delete(subId);
      }
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
    if (subs.length === 0) {
      return;
    }
    setContextoIndisp({ subequipos: subs, nombreEquipo: equipo.nombreEquipo, central: equipo.central });
  };

  const AbrirDisp = (equipo: EquipoOperadorTarjeta, subs: SubequipoOperador[]): void => {
    if (subs.length === 0) {
      return;
    }
    setContextoDisp({ subequipos: subs, nombreEquipo: equipo.nombreEquipo, central: equipo.central });
  };

  const AbrirBitacora = (equipo: EquipoOperadorTarjeta, sub: SubequipoOperador): void => {
    setContextoBitacora({ subequipos: [sub], nombreEquipo: equipo.nombreEquipo, central: equipo.central });
  };

  const AccionesSubequipo = (equipo: EquipoOperadorTarjeta, sub: SubequipoOperador): React.ReactElement => {
    const operable = sub.estadoRegistro === EstadoSubequipoActivo;
    return (
      <div className="btn-group btn-group-sm">
        <button
          type="button"
          className="btn btn-outline-danger"
          title="Marcar indisponibilidad"
          disabled={!operable}
          onClick={() => AbrirIndisp(equipo, [sub])}
        >
          <i className="bi bi-x-lg" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="btn btn-outline-success"
          title="Marcar disponibilidad"
          disabled={!operable || sub.disponibilidad === 'Disponible'}
          onClick={() => AbrirDisp(equipo, [sub])}
        >
          <i className="bi bi-check-lg" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="btn btn-outline-secondary"
          title="Bitácora"
          onClick={() => AbrirBitacora(equipo, sub)}
        >
          <i className="bi bi-journal-text" aria-hidden="true" />
        </button>
      </div>
    );
  };

  const etiquetaTipo = (sub: SubequipoOperador): string => sub.tipoNombre || sub.tipoCodigo || '—';

  return (
    <CarcasaOperadorRenovable tabActiva="equipos">
      {error ? <div className="alert alert-danger py-2">{error}</div> : null}
      {estado === 'cargando' && tarjetas.length === 0 ? (
        <p className="text-muted mb-3">Cargando equipos desde SharePoint…</p>
      ) : null}

      <div className="row g-2 mb-3">
        {[
          { etiqueta: 'Capacidad total', valor: `${kpis.totalMw.toFixed(1)} MW`, clase: 'primary' },
          { etiqueta: 'Disponible', valor: `${kpis.dispMw.toFixed(1)} MW`, clase: 'success' },
          { etiqueta: 'Indisponible', valor: `${kpis.indispMw.toFixed(1)} MW`, clase: 'danger' },
          { etiqueta: '% indisponibilidad', valor: `${kpis.pct.toFixed(1)} %`, clase: 'warning' }
        ].map((kpi) => (
          <div key={kpi.etiqueta} className="col-6 col-lg-3">
            <div className={`card cowork-operador-renovable__kpi border-${kpi.clase}`}>
              <div className="card-body py-2">
                <div className="text-muted small">{kpi.etiqueta}</div>
                <div className="fw-semibold">{kpi.valor}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="cowork-vista__barra-acciones d-flex flex-wrap align-items-end justify-content-between gap-3 mb-3">
        <div className="d-flex flex-wrap gap-3 flex-grow-1">
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
              <option value="">Todas</option>
              {centralesDisponibles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-grow-1" style={{ maxWidth: '20rem' }}>
            <label className="form-label form-label-sm mb-1" htmlFor="buscar-equipos-or">
              Buscar
            </label>
            <input
              id="buscar-equipos-or"
              type="search"
              className="form-control form-control-sm"
              placeholder="Central, equipo o código"
              value={textoBusqueda}
              onChange={(e) => setTextoBusqueda(e.target.value)}
            />
          </div>
        </div>
        <fieldset className="cowork-vista__radios-estado d-flex flex-wrap gap-3 mb-0 border-0 p-0">
          <legend className="visually-hidden">Catálogo</legend>
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
      </div>

      {SubsSeleccionados.length > 0 ? (
        <div className="cowork-vista__barra-acciones d-flex flex-wrap align-items-center gap-2 mb-3 p-2 border rounded bg-light">
          <span className="small fw-medium">{SubsSeleccionados.length} subequipo(s) seleccionado(s)</span>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={() =>
              setContextoIndisp({
                subequipos: SubsSeleccionados,
                nombreEquipo: 'Lote',
                central: 'Varias'
              })
            }
          >
            Indisponibilidad en lote
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-success"
            onClick={() =>
              setContextoDisp({
                subequipos: SubsSeleccionados.filter((s) => s.disponibilidad === 'Indisponible'),
                nombreEquipo: 'Lote',
                central: 'Varias'
              })
            }
          >
            Disponibilidad en lote
          </button>
          <button type="button" className="btn btn-sm btn-link" onClick={() => setSeleccionSubequipos(new Set())}>
            Limpiar selección
          </button>
        </div>
      ) : null}

      <div className="row g-3 cowork-operador-renovable__grid-tarjetas">
        {equiposVisibles.map((equipo) => (
          <div key={equipo.id} className="col-12 col-md-6 col-lg-4">
            <div
              className={`card cowork-operador-renovable__tarjeta-equipo ${
                equipo.indisponibleMw > 0 ? 'cowork-operador-renovable__tarjeta-equipo--alerta' : ''
              }`}
            >
              <div className="card-header d-flex justify-content-between align-items-center py-2">
                <div className="d-flex align-items-start gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-link p-0 text-secondary"
                    aria-expanded={!tarjetasColapsadas.has(equipo.id)}
                    aria-label={tarjetasColapsadas.has(equipo.id) ? 'Expandir tarjeta' : 'Colapsar tarjeta'}
                    onClick={() => AlternarColapsoTarjeta(equipo.id)}
                  >
                    <i
                      className={`bi ${tarjetasColapsadas.has(equipo.id) ? 'bi-chevron-right' : 'bi-chevron-down'}`}
                      aria-hidden="true"
                    />
                  </button>
                  <div>
                    <div className="fw-semibold">{equipo.nombreEquipo}</div>
                    <small className="text-muted">{equipo.central}</small>
                  </div>
                </div>
                <span className="badge text-bg-light">
                  {equipo.indisponibleMw.toFixed(1)} / {equipo.totalMw.toFixed(1)} MW indisp.
                </span>
              </div>
              {!tarjetasColapsadas.has(equipo.id) ? (
              <ul className="list-group list-group-flush">
                {equipo.subequipos.map((sub) => (
                  <li
                    key={sub.id}
                    className="list-group-item d-flex flex-wrap align-items-center justify-content-between gap-2 py-2"
                  >
                    <div className="d-flex align-items-center gap-2">
                      <input
                        type="checkbox"
                        className="form-check-input mt-0"
                        checked={seleccionSubequipos.has(sub.id)}
                        disabled={sub.estadoRegistro !== EstadoSubequipoActivo}
                        aria-label={`Seleccionar ${sub.codigo}`}
                        onChange={(e) => AlternarSeleccionSub(sub.id, e.target.checked)}
                      />
                      <span
                        className={`cowork-operador-renovable__punto ${
                          sub.disponibilidad === 'Indisponible'
                            ? 'cowork-operador-renovable__punto--indisp'
                            : 'cowork-operador-renovable__punto--disp'
                        }`}
                        aria-hidden="true"
                      />
                      <div>
                        <div className="fw-medium">{sub.codigo}</div>
                        <small className="text-muted">
                          {etiquetaTipo(sub)} · {sub.capacidadMw} MW
                          {sub.estadoRegistro !== EstadoSubequipoActivo ? ` · ${sub.estadoRegistro}` : ''}
                          {sub.disponibilidad === 'Indisponible'
                            ? ` · ${CalcularMwFueraServicio(sub.capacidadMw, sub.capacidadActualMw)} MW fuera`
                            : ''}
                        </small>
                      </div>
                    </div>
                    {AccionesSubequipo(equipo, sub)}
                  </li>
                ))}
              </ul>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {estado === 'listo' && equiposVisibles.length === 0 ? (
        <p className="text-muted mt-3 mb-0">No hay equipos que coincidan con el filtro o no tiene centrales renovables asignadas.</p>
      ) : null}

      <ModalMarcarIndisponibilidadSubequipo
        context={context}
        visible={contextoIndisp !== undefined}
        subequipos={contextoIndisp?.subequipos}
        nombreEquipo={contextoIndisp?.nombreEquipo}
        central={contextoIndisp?.central}
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
    </CarcasaOperadorRenovable>
  );
}
