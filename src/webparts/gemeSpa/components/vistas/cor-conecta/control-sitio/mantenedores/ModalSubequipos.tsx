import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import {
  CambiarEstadoSubequipoMantenedor,
  GuardarSubequipoMantenedor,
  InterpretarCapacidadesMw,
  ObtenerSubequiposDeEquipo,
  type SubequipoMantenedor
} from '../../../../../services/sharepoint/mantenedores/SubequiposMantenedorServicio';
import { NotificarCambioDisponibilidadOperadorRenovable } from '../../../../../services/sharepoint/operadorRenovable/OperadorRenovableRefrescoGlobal';
import { SharePointRestError } from '../../../../../services/sharepoint/SharePointRestError';
import ModalFormulario from '../../../../comunes/ModalFormulario';
import type { OpcionCampoCatalogo } from './TiposCatalogo';
import { BadgeEstadoRegistro, EstadoRegistroActivo, EstadoRegistroInactivo } from './UtilidadesCatalogo';

export type ModalSubequiposProps = {
  context: WebPartContext;
  equipo: { id: number; nombre: string } | undefined;
  instalacionId: number;
  /** Tipos de equipo activos (lookup TIPOEQUIPO). */
  tiposEquipo: readonly OpcionCampoCatalogo[];
  onCerrar: () => void;
  /** Se llama tras crear o cambiar un subequipo, para refrescar el conteo de la grilla de equipos. */
  onCambio: () => void;
};

type FiltroEstado = 'Activo' | 'Inactivo' | 'Todos';

type Formulario = {
  existente?: SubequipoMantenedor;
  codigo: string;
  nombre: string;
  tipoId: string;
  capacidades: string;
  maxima: string;
};

const FormularioVacio: Formulario = { codigo: '', nombre: '', tipoId: '', capacidades: '', maxima: '' };

function FormatearMw(valor: number): string {
  return String(valor).replace('.', ',');
}

/** Subequipos de un equipo (como la maqueta): listar por estado, agregar, editar, dar de baja y reactivar. */
export default function ModalSubequipos(props: ModalSubequiposProps): React.ReactElement {
  const { context, equipo, instalacionId, tiposEquipo, onCerrar, onCambio } = props;
  const [subequipos, setSubequipos] = useState<SubequipoMantenedor[]>([]);
  const [cargando, setCargando] = useState(false);
  const [filtro, setFiltro] = useState<FiltroEstado>('Activo');
  const [formulario, setFormulario] = useState<Formulario | undefined>();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [version, setVersion] = useState(0);

  const equipoId = equipo?.id;

  useEffect(() => {
    if (equipoId === undefined) {
      return undefined;
    }
    let cancelado = false;
    setCargando(true);
    ObtenerSubequiposDeEquipo(context, equipoId)
      .then((lista) => {
        if (!cancelado) {
          setSubequipos(lista);
        }
      })
      .catch((err: unknown) => {
        if (!cancelado) {
          console.error(err);
          setError(err instanceof SharePointRestError ? err.message : 'No se pudieron cargar los subequipos.');
        }
      })
      .then(() => {
        if (!cancelado) {
          setCargando(false);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelado = true;
    };
  }, [context, equipoId, version]);

  useEffect(() => {
    setFiltro('Activo');
    setFormulario(undefined);
    setError(undefined);
  }, [equipoId]);

  const visibles = useMemo(
    // ESTADO admite Activo, Inactivo y Baja: «Dados de baja» muestra todo lo que no está activo.
    () =>
      subequipos.filter(
        (s) => filtro === 'Todos' || (filtro === 'Activo' ? s.estado === EstadoRegistroActivo : s.estado !== EstadoRegistroActivo)
      ),
    [subequipos, filtro]
  );

  const capacidadesFormulario = useMemo(
    () => (formulario ? InterpretarCapacidadesMw(formulario.capacidades) ?? [] : []),
    [formulario]
  );

  const Recargar = useCallback((): void => {
    setVersion((v) => v + 1);
    onCambio();
    NotificarCambioDisponibilidadOperadorRenovable();
  }, [onCambio]);

  if (!equipo) {
    return <></>;
  }

  const AbrirFormulario = (existente?: SubequipoMantenedor): void => {
    setError(undefined);
    setFormulario(
      existente
        ? {
            existente,
            codigo: existente.codigo,
            nombre: existente.nombre,
            tipoId: existente.tipoId !== undefined ? String(existente.tipoId) : '',
            capacidades: existente.capacidadesMw.join(', '),
            maxima: existente.capacidadMaximaMw > 0 ? String(existente.capacidadMaximaMw) : ''
          }
        : { ...FormularioVacio }
    );
  };

  const CambiarCapacidades = (texto: string): void => {
    if (!formulario) {
      return;
    }
    const lista = InterpretarCapacidadesMw(texto) ?? [];
    const maximaActual = Number(formulario.maxima);
    const maxima =
      lista.indexOf(maximaActual) >= 0 ? formulario.maxima : lista.length ? String(lista[lista.length - 1]) : '';
    setFormulario({ ...formulario, capacidades: texto, maxima });
  };

  const GuardarFormulario = async (): Promise<void> => {
    if (!formulario) {
      return;
    }
    const codigo = formulario.codigo.trim().toUpperCase();
    const nombre = formulario.nombre.trim();
    const capacidades = InterpretarCapacidadesMw(formulario.capacidades);
    const maxima = formulario.maxima ? Number(formulario.maxima) : undefined;

    let mensaje: string | undefined;
    if (!codigo || !nombre) {
      mensaje = 'Complete el código y el nombre del subequipo.';
    } else if (
      subequipos.some((s) => s.id !== formulario.existente?.id && s.codigo.toUpperCase() === codigo)
    ) {
      mensaje = `Ya existe un subequipo con el código «${codigo}» en este equipo.`;
    } else if (capacidades === undefined) {
      mensaje = 'Las capacidades deben ser números mayores que 0, separados por coma (decimales con punto).';
    } else if (capacidades.length > 0 && (maxima === undefined || capacidades.indexOf(maxima) === -1)) {
      mensaje = 'Elija la capacidad máxima entre las capacidades indicadas.';
    }
    if (mensaje || !capacidades) {
      setError(mensaje);
      return;
    }

    setGuardando(true);
    setError(undefined);
    try {
      await GuardarSubequipoMantenedor(
        context,
        {
          codigo,
          nombre,
          tipoId: formulario.tipoId ? Number(formulario.tipoId) : undefined,
          capacidadesMw: capacidades,
          capacidadMaximaMw: capacidades.length ? maxima : undefined
        },
        { equipoId: equipo.id, instalacionId },
        formulario.existente
      );
      setFormulario(undefined);
      Recargar();
    } catch (err) {
      console.error(err);
      setError(err instanceof SharePointRestError ? err.message : 'No se pudo guardar el subequipo.');
    } finally {
      setGuardando(false);
    }
  };

  const CambiarEstado = async (subequipo: SubequipoMantenedor, estado: string): Promise<void> => {
    if (
      estado === EstadoRegistroInactivo &&
      !window.confirm(`¿Dar de baja el subequipo «${subequipo.codigo} - ${subequipo.nombre}»? Podrá reactivarlo después.`)
    ) {
      return;
    }
    setError(undefined);
    try {
      await CambiarEstadoSubequipoMantenedor(context, subequipo.id, estado);
      Recargar();
    } catch (err) {
      console.error(err);
      setError(err instanceof SharePointRestError ? err.message : 'No se pudo cambiar el estado del subequipo.');
    }
  };

  return (
    <ModalFormulario
      visible
      titulo={`Subequipos de ${equipo.nombre}`}
      icono="bi-diagram-3"
      error={error}
      guardando={guardando}
      onCerrar={onCerrar}
      tamano="xl"
    >
      {formulario ? (
        <fieldset className="border rounded p-3 mb-3">
          <legend className="float-none w-auto px-2 fs-6 mb-0">
            {formulario.existente ? `Editar ${formulario.existente.codigo}` : 'Nuevo subequipo'}
          </legend>
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label cowork-formulario__etiqueta--obligatoria" htmlFor="cowork-subequipo-codigo">
                Código
              </label>
              <input
                id="cowork-subequipo-codigo"
                type="text"
                className="form-control form-control-sm"
                maxLength={50}
                value={formulario.codigo}
                onChange={(e) => setFormulario({ ...formulario, codigo: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="col-md-5">
              <label className="form-label cowork-formulario__etiqueta--obligatoria" htmlFor="cowork-subequipo-nombre">
                Nombre
              </label>
              <input
                id="cowork-subequipo-nombre"
                type="text"
                className="form-control form-control-sm"
                maxLength={255}
                value={formulario.nombre}
                onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label" htmlFor="cowork-subequipo-tipo">
                Tipo
              </label>
              <select
                id="cowork-subequipo-tipo"
                className="form-select form-select-sm"
                value={formulario.tipoId}
                onChange={(e) => setFormulario({ ...formulario, tipoId: e.target.value })}
              >
                <option value="">-- Sin tipo --</option>
                {tiposEquipo.map((tipo) => (
                  <option key={tipo.valor} value={tipo.valor}>
                    {tipo.etiqueta}
                  </option>
                ))}
                {formulario.existente?.tipoId !== undefined &&
                !tiposEquipo.some((t) => t.valor === String(formulario.existente?.tipoId)) ? (
                  <option value={String(formulario.existente.tipoId)}>{formulario.existente.tipo} (inactivo)</option>
                ) : null}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="cowork-subequipo-capacidades">
                Capacidades (MW)
              </label>
              <input
                id="cowork-subequipo-capacidades"
                type="text"
                className="form-control form-control-sm"
                placeholder="2, 4"
                value={formulario.capacidades}
                aria-describedby="cowork-subequipo-capacidades-ayuda"
                onChange={(e) => CambiarCapacidades(e.target.value)}
              />
              <div id="cowork-subequipo-capacidades-ayuda" className="form-text">
                Valores en que puede operar, separados por coma; decimales con punto (p. ej. 2, 4, 6.5).
              </div>
            </div>
            <fieldset className="col-md-6">
              <legend className="form-label fs-6">Capacidad máxima (MW)</legend>
              {capacidadesFormulario.length === 0 ? (
                <p className="form-text mt-0">Indique las capacidades para elegir la máxima.</p>
              ) : (
                <div className="d-flex flex-wrap gap-3">
                  {capacidadesFormulario.map((mw) => (
                    <div key={mw} className="form-check">
                      <input
                        id={`cowork-subequipo-maxima-${mw}`}
                        type="radio"
                        name="cowork-subequipo-maxima"
                        className="form-check-input"
                        checked={formulario.maxima === String(mw)}
                        onChange={() => setFormulario({ ...formulario, maxima: String(mw) })}
                      />
                      <label className="form-check-label" htmlFor={`cowork-subequipo-maxima-${mw}`}>
                        {FormatearMw(mw)} MW
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </fieldset>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-3">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => {
                setFormulario(undefined);
                setError(undefined);
              }}
              disabled={guardando}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-sm cowork-btn-primary"
              onClick={() => {
                GuardarFormulario().catch(() => undefined);
              }}
              disabled={guardando}
            >
              {guardando ? 'Guardando…' : 'Guardar subequipo'}
            </button>
          </div>
        </fieldset>
      ) : null}

      <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between mb-2">
        <div className="d-flex align-items-center gap-2">
          <label className="form-label mb-0 small" htmlFor="cowork-subequipos-filtro">
            Estado
          </label>
          <select
            id="cowork-subequipos-filtro"
            className="form-select form-select-sm w-auto"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value as FiltroEstado)}
          >
            <option value="Activo">Activos</option>
            <option value="Inactivo">Dados de baja</option>
            <option value="Todos">Todos</option>
          </select>
        </div>
        {formulario ? null : (
          <button type="button" className="btn btn-sm cowork-btn-primary" onClick={() => AbrirFormulario()}>
            <i className="bi bi-plus-lg me-1" aria-hidden="true" />
            Agregar subequipo
          </button>
        )}
      </div>

      {cargando ? (
        <div className="text-muted py-2">
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
          Cargando…
        </div>
      ) : visibles.length === 0 ? (
        <p className="text-muted mb-0">No hay subequipos {filtro === 'Todos' ? '' : filtro === 'Activo' ? 'activos ' : 'dados de baja '}en este equipo.</p>
      ) : (
        <table className="table table-sm align-middle cowork-tabla-fichas mb-0">
          <thead>
            <tr>
              <th scope="col">Código</th>
              <th scope="col">Nombre</th>
              <th scope="col">Tipo</th>
              <th scope="col">Capacidades (MW)</th>
              <th scope="col">Estado</th>
              <th scope="col" className="text-center">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((subequipo) => (
              <tr key={subequipo.id}>
                <td data-label="Código">
                  <span className="badge text-bg-light border">{subequipo.codigo || '—'}</span>
                </td>
                <td data-label="Nombre">{subequipo.nombre || '—'}</td>
                <td data-label="Tipo">{subequipo.tipo || '—'}</td>
                <td data-label="Capacidades (MW)">
                  {subequipo.capacidadesMw.length === 0
                    ? '—'
                    : subequipo.capacidadesMw.map((mw, i) => (
                        <React.Fragment key={mw}>
                          {i > 0 ? ', ' : ''}
                          {mw === subequipo.capacidadMaximaMw ? (
                            <strong title="Capacidad máxima">{FormatearMw(mw)}</strong>
                          ) : (
                            FormatearMw(mw)
                          )}
                        </React.Fragment>
                      ))}
                </td>
                <td data-label="Estado">
                  <BadgeEstadoRegistro estado={subequipo.estado} />
                </td>
                <td data-label="Acciones" className="text-center text-nowrap">
                  <button
                    type="button"
                    className="btn btn-sm btn-link p-0 me-2 text-primary"
                    title="Editar subequipo"
                    aria-label={`Editar ${subequipo.codigo}`}
                    onClick={() => AbrirFormulario(subequipo)}
                  >
                    <i className="bi bi-pencil-square" aria-hidden="true" />
                  </button>
                  {subequipo.estado === EstadoRegistroActivo ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-link p-0 text-danger"
                      title="Dar de baja"
                      aria-label={`Dar de baja ${subequipo.codigo}`}
                      onClick={() => {
                        CambiarEstado(subequipo, EstadoRegistroInactivo).catch(() => undefined);
                      }}
                    >
                      <i className="bi bi-archive" aria-hidden="true" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-sm btn-link p-0 text-success"
                      title="Reactivar"
                      aria-label={`Reactivar ${subequipo.codigo}`}
                      onClick={() => {
                        CambiarEstado(subequipo, EstadoRegistroActivo).catch(() => undefined);
                      }}
                    >
                      <i className="bi bi-arrow-counterclockwise" aria-hidden="true" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ModalFormulario>
  );
}
