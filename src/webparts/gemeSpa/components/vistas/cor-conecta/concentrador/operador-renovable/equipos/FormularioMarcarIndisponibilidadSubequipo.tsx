import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { SubequipoOperador } from '../../../../../../models/operadorRenovable/CatalogoEquiposOperador';
import { MarcarIndisponibilidadConPeriodos } from '../../../../../../services/sharepoint/operadorRenovable/ActualizarDisponibilidadSubequipoServicio';
import {
  HayServicioPeriodos,
  PeriodosApiError
} from '../../../../../../services/sharepoint/operadorRenovable/PeriodosIndisponibilidadApiServicio';
import {
  DisponibilidadSubequipoIndisponible,
  MotivoIndisponibilidadFalla,
  MotivoIndisponibilidadTrabajo
} from '../../../../../../services/sharepoint/operadorRenovable/CamposOperadorRenovable';
import { CalcularMwFueraServicio } from '../../../../../../services/sharepoint/operadorRenovable/UtilidadesCapacidadSubequipo';
import {
  ConvertirEntradaLocalAIsoUtc,
  ConvertirIsoAFechaLocalInput
} from '../../../../../../utils/FechaHoraCorConecta';
import CampoFechaHora24 from '../../../../../concentrador/CampoFechaHora24';

export type FormularioMarcarIndisponibilidadSubequipoProps = {
  context: WebPartContext;
  subequipos: SubequipoOperador[];
  nombreEquipo?: string;
  central?: string;
  /** Central de los subequipos (la indisponibilidad se registra por central en la App Function). */
  centralId?: number;
  /** Capacidad del equipo (subequipos activos), para el «% del equipo» que queda fuera. */
  capacidadEquipoMw?: number;
  /** Título propio (panel de Gestionar); en el modal lo pone su encabezado. */
  mostrarTitulo?: boolean;
  onCancelar: () => void;
  onGuardado: () => void;
};

/**
 * Capacidades con las que puede quedar el subequipo (maqueta `obtenerCapacidadesActualesParaSubequipo`):
 * 0 MW (fuera por completo) y las parciales menores que su capacidad máxima.
 */
function CapacidadesConQueQueda(sub: SubequipoOperador): number[] {
  const parciales = sub.capacidadesMwOpciones.filter((mw) => mw > 0 && (sub.capacidadMw <= 0 || mw < sub.capacidadMw));
  return [0].concat(parciales.filter((mw, i) => parciales.indexOf(mw) === i)).sort((a, b) => a - b);
}

/** Preselección: la capacidad con que ya está si sigue indisponible; si no, 0 MW. */
function CapacidadInicial(sub: SubequipoOperador): number {
  const opciones = CapacidadesConQueQueda(sub);
  const actual = sub.disponibilidad === DisponibilidadSubequipoIndisponible ? sub.capacidadActualMw : 0;
  return opciones.indexOf(actual) >= 0 ? actual : 0;
}

function FormatearNumero(valor: number, decimales = 2): string {
  return valor.toLocaleString('es-CL', { maximumFractionDigits: decimales });
}

function NombreSubequipo(sub: SubequipoOperador): string {
  return sub.nombre && sub.nombre !== sub.codigo ? `${sub.codigo} · ${sub.nombre}` : sub.codigo;
}

function RadiosCapacidad(props: {
  nombre: string;
  capacidades: number[];
  seleccionada: number | undefined;
  onCambio: (mw: number) => void;
  disabled?: boolean;
}): React.ReactElement {
  const { nombre, capacidades, seleccionada, onCambio, disabled } = props;
  return (
    <div className="d-flex flex-wrap align-items-center gap-3">
      {capacidades.map((mw) => {
        const id = `${nombre}-${String(mw).replace('.', '_')}`;
        return (
          <div key={mw} className="form-check form-check-inline mb-0 me-0">
            <input
              id={id}
              type="radio"
              name={nombre}
              className="form-check-input"
              checked={seleccionada === mw}
              disabled={disabled}
              onChange={() => onCambio(mw)}
            />
            <label className="form-check-label" htmlFor={id}>
              {FormatearNumero(mw)} MW
            </label>
          </div>
        );
      })}
    </div>
  );
}

/** Mismo orden y controles que la maqueta (`#modalIndisponibilidadSubequipo`): capacidad con radios, motivo y fecha, descripción. */
export default function FormularioMarcarIndisponibilidadSubequipo(
  props: FormularioMarcarIndisponibilidadSubequipoProps
): React.ReactElement {
  const { context, subequipos, nombreEquipo, central, centralId, capacidadEquipoMw, mostrarTitulo = false, onCancelar, onGuardado } = props;
  const subequipo = subequipos[0];
  const esLote = subequipos.length > 1;

  const [motivo, setMotivo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaLocal, setFechaLocal] = useState('');
  const [fechaFinEstimadaLocal, setFechaFinEstimadaLocal] = useState('');
  /** Capacidad con la que queda cada subequipo, por Id. */
  const [capacidades, setCapacidades] = useState<Record<number, number>>({});
  const [capacidadTodos, setCapacidadTodos] = useState<number | undefined>(undefined);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | undefined>();
  /** Guardado, pero sin envío a Meteológica: se informa y el formulario queda solo para cerrar. */
  const [aviso, setAviso] = useState<string | undefined>();

  /** Unión de capacidades del lote, para «TODOS» (maqueta `unionCapacidadesLote`). */
  const capacidadesLote = useMemo(() => {
    const todas: number[] = [];
    subequipos.forEach((sub) =>
      CapacidadesConQueQueda(sub).forEach((mw) => {
        if (todas.indexOf(mw) === -1) {
          todas.push(mw);
        }
      })
    );
    return todas.sort((a, b) => a - b);
  }, [subequipos]);

  useEffect(() => {
    if (!subequipo) {
      return;
    }
    const iniciales: Record<number, number> = {};
    subequipos.forEach((sub) => {
      iniciales[sub.id] = CapacidadInicial(sub);
    });
    setCapacidades(iniciales);
    setCapacidadTodos(undefined);
    setMotivo('');
    setDescripcion('');
    setFechaLocal(ConvertirIsoAFechaLocalInput(new Date().toISOString()));
    setFechaFinEstimadaLocal('');
    setError(undefined);
    setAviso(undefined);
    setGuardando(false);
  }, [subequipo, subequipos]);

  if (!subequipo) {
    return <></>;
  }

  const bloqueado = guardando || aviso !== undefined;
  const mwFuera = subequipos.reduce(
    (suma, sub) => suma + (capacidades[sub.id] === undefined ? 0 : CalcularMwFueraServicio(sub.capacidadMw, capacidades[sub.id])),
    0
  );
  const porcentajeEquipo = capacidadEquipoMw && capacidadEquipoMw > 0 ? (mwFuera / capacidadEquipoMw) * 100 : undefined;
  const textoQuedanFuera = (
    <>
      Quedan fuera: <strong>{mwFuera ? FormatearNumero(mwFuera) : '—'}</strong> MW (
      {mwFuera ? FormatearNumero(mwFuera * 1000, 0) : '—'} kW)
      {porcentajeEquipo !== undefined ? ` · ${mwFuera ? `${porcentajeEquipo.toFixed(1)} %` : '—'} del equipo` : ''}
    </>
  );

  const AplicarATodos = (): void => {
    if (capacidadTodos === undefined) {
      return;
    }
    setCapacidades((previas) => {
      const siguientes = { ...previas };
      subequipos.forEach((sub) => {
        if (CapacidadesConQueQueda(sub).indexOf(capacidadTodos) >= 0) {
          siguientes[sub.id] = capacidadTodos;
        }
      });
      return siguientes;
    });
  };

  const Confirmar = async (): Promise<void> => {
    if (!motivo) {
      setError('Indique si la indisponibilidad se debe a falla o trabajo.');
      return;
    }
    const fechaIso = ConvertirEntradaLocalAIsoUtc(fechaLocal);
    if (!fechaIso) {
      setError('Ingrese la fecha y hora de indisponibilidad.');
      return;
    }
    if (subequipos.some((sub) => capacidades[sub.id] === undefined)) {
      setError(esLote ? 'Seleccione con cuántos MW queda cada equipo.' : 'Seleccione con cuántos MW queda el equipo.');
      return;
    }
    const fechaFinEstimadaIso = ConvertirEntradaLocalAIsoUtc(fechaFinEstimadaLocal);
    if (!fechaFinEstimadaIso) {
      setError('Ingrese la fecha estimada de fin de la indisponibilidad.');
      return;
    }
    if (fechaFinEstimadaIso <= fechaIso) {
      setError('La fecha estimada de fin debe ser posterior al inicio.');
      return;
    }
    if (!HayServicioPeriodos()) {
      setError('No se puede registrar: falta configurar «URL indisponibilidades (períodos)» en el Web Part (App Function).');
      return;
    }
    if (centralId === undefined) {
      setError('No se puede registrar: no se identificó la central del equipo.');
      return;
    }

    setGuardando(true);
    setError(undefined);
    try {
      const resultado = await MarcarIndisponibilidadConPeriodos(context, {
        instalacionId: centralId,
        fechaInicio: fechaIso,
        fechaFinEstimada: fechaFinEstimadaIso,
        motivo,
        descripcion: descripcion.trim() || undefined,
        items: subequipos.map((sub) => ({ subequipoId: sub.id, capacidadMw: capacidades[sub.id] }))
      });
      onGuardado();
      if (!resultado.envio.enviado || resultado.avisos.length > 0) {
        setAviso(['La indisponibilidad quedó guardada.', resultado.envio.enviado ? '' : resultado.envio.mensaje]
          .concat(resultado.avisos).filter((parte) => parte).join(' '));
        return;
      }
      onCancelar();
    } catch (err) {
      setError(err instanceof PeriodosApiError ? err.message : 'No se pudo registrar la indisponibilidad.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div>
      {mostrarTitulo ? <h3 className="h6 text-danger mb-2">Marcar indisponibilidad</h3> : null}
      <p className="mb-1">
        <strong>{esLote ? `${subequipos.length} subequipos` : NombreSubequipo(subequipo)}</strong>
      </p>
      <p className="small text-muted mb-3">
        {[nombreEquipo, central].filter((parte) => parte).join(' · ')}
      </p>
      {error ? <div className="alert alert-danger py-2">{error}</div> : null}
      {aviso ? <div className="alert alert-warning py-2">{aviso}</div> : null}

      {esLote ? (
        <div className="mb-3">
          <table className="table table-sm table-bordered mb-2 cowork-tabla-fichas">
            <thead className="table-light">
              <tr>
                <th scope="col">Equipo</th>
                <th scope="col">
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    <span className="me-1">TODOS</span>
                    <RadiosCapacidad
                      nombre="or-indisp-lote-todos"
                      capacidades={capacidadesLote}
                      seleccionada={capacidadTodos}
                      onCambio={setCapacidadTodos}
                      disabled={bloqueado}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={AplicarATodos}
                      disabled={bloqueado || capacidadTodos === undefined}
                    >
                      Aplicar
                    </button>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {subequipos.map((sub) => (
                <tr key={sub.id}>
                  <td data-label="Equipo">{NombreSubequipo(sub)}</td>
                  <td data-label="Capacidad con la que queda">
                    <RadiosCapacidad
                      nombre={`or-indisp-lote-${sub.id}`}
                      capacidades={CapacidadesConQueQueda(sub)}
                      seleccionada={capacidades[sub.id]}
                      onCambio={(mw) => setCapacidades((previas) => ({ ...previas, [sub.id]: mw }))}
                      disabled={bloqueado}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <small className="form-text text-muted">{textoQuedanFuera}</small>
        </div>
      ) : (
        <fieldset className="mb-3">
          <legend className="form-label fs-6 fw-semibold mb-1">Capacidad con la que queda el equipo (MW)</legend>
          <RadiosCapacidad
            nombre="or-indisp-capacidad"
            capacidades={CapacidadesConQueQueda(subequipo)}
            seleccionada={capacidades[subequipo.id]}
            onCambio={(mw) => setCapacidades({ [subequipo.id]: mw })}
            disabled={bloqueado}
          />
          <small className="form-text text-muted">
            Máximo del equipo: <strong>{FormatearNumero(subequipo.capacidadMw)}</strong> MW · {textoQuedanFuera}
          </small>
        </fieldset>
      )}

      <div className="row g-3 mb-3">
        <div className="col-md-4">
          <label className="form-label fw-semibold" htmlFor="or-indisp-motivo">
            Motivo
          </label>
          <select
            id="or-indisp-motivo"
            className="form-select form-select-sm"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            disabled={bloqueado}
          >
            <option value="">Seleccione</option>
            <option value={MotivoIndisponibilidadFalla}>Falla</option>
            <option value={MotivoIndisponibilidadTrabajo}>Trabajo</option>
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label fw-semibold" htmlFor="or-indisp-fecha">
            Inicio
          </label>
          <CampoFechaHora24 id="or-indisp-fecha" valor={fechaLocal} onCambio={setFechaLocal} disabled={bloqueado} />
        </div>
        <div className="col-md-4">
          <label className="form-label fw-semibold" htmlFor="or-indisp-fin-estimado">
            Fecha estimada de fin
          </label>
          <CampoFechaHora24
            id="or-indisp-fin-estimado"
            valor={fechaFinEstimadaLocal}
            onCambio={setFechaFinEstimadaLocal}
            min={fechaLocal}
            disabled={bloqueado}
            aria-describedby="or-indisp-fin-estimado-ayuda"
          />
          <div id="or-indisp-fin-estimado-ayuda" className="form-text">
            Si llega la fecha y el equipo no se marcó disponible, se sigue informando fuera.
          </div>
        </div>
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold" htmlFor="or-indisp-desc">
          Descripción
        </label>
        <textarea
          id="or-indisp-desc"
          className="form-control form-control-sm"
          rows={2}
          placeholder="Texto libre de la indisponibilidad"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          disabled={bloqueado}
        />
      </div>
      <div className="d-flex justify-content-end gap-2">
        <button type="button" className="btn btn-sm btn-secondary" onClick={onCancelar} disabled={guardando}>
          {aviso ? 'Cerrar' : 'Cancelar'}
        </button>
        <button
          type="button"
          className="btn btn-sm btn-danger"
          onClick={() => {
            Confirmar().catch(() => undefined);
          }}
          disabled={bloqueado}
        >
          {guardando ? 'Guardando…' : 'Marcar indisponibilidad'}
        </button>
      </div>
    </div>
  );
}
