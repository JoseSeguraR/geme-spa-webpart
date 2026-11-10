import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { SolicitudOperadorRenovableFila } from '../../../../../../models/operadorRenovable/SolicitudOperadorRenovable';
import {
  IndisponibilidadASubequipoOperador,
  type IndisponibilidadSubequipoSolicitud
} from '../../../../../../models/operadorRenovable/SolicitudOperadorRenovable';
import { ObtenerIndisponibilidadesPorSolicitud } from '../../../../../../services/sharepoint/operadorRenovable/IndisponibilidadesSolicitudServicio';
import {
  AgruparPeriodosPorSubequipo,
  AplicarPeriodosASubequipo
} from '../../../../../../services/sharepoint/operadorRenovable/AplicarPeriodosSubequipos';
import {
  HayServicioPeriodos,
  ObtenerPeriodosAbiertos,
  type PeriodoIndisponibilidad
} from '../../../../../../services/sharepoint/operadorRenovable/PeriodosIndisponibilidadApiServicio';
import { SharePointRestError } from '../../../../../../services/sharepoint/SharePointRestError';
import FormularioMarcarDisponibilidadSubequipo from '../equipos/FormularioMarcarDisponibilidadSubequipo';
import FormularioMarcarIndisponibilidadSubequipo from '../equipos/FormularioMarcarIndisponibilidadSubequipo';
import PanelBitacoraSubequipoOperador from '../equipos/PanelBitacoraSubequipoOperador';
import type { SubequipoOperador } from '../../../../../../models/operadorRenovable/CatalogoEquiposOperador';
import {
  FormatearMotivoSubequipoSolicitud,
  PanelCopySubequipoSolicitud,
  PuntoEstadoSubequipoSolicitud
} from './UiGrillaSolicitudesOperadorRenovable';

export type ModalGestionarSubequiposSolicitudOperadorProps = {
  context: WebPartContext;
  solicitud?: SolicitudOperadorRenovableFila;
  visible: boolean;
  onCerrar: () => void;
  onActualizado: () => void;
};

type ModoPanelGestion = 'indisp' | 'disp' | 'bitacora';

type ContextoSub = {
  subequipo: SubequipoOperador;
  /** Arreglo estable: si se recreara en cada render, el formulario se reiniciaría y perdería su aviso. */
  subequipos: SubequipoOperador[];
};

/** La fila con el estado según los períodos de la App Function (si los hay). */
function FilaConPeriodos(
  fila: IndisponibilidadSubequipoSolicitud,
  periodos: Map<number, PeriodoIndisponibilidad[]> | undefined
): { fila: IndisponibilidadSubequipoSolicitud; subequipo: SubequipoOperador } {
  const base = IndisponibilidadASubequipoOperador(fila);
  if (!periodos) {
    return { fila, subequipo: base };
  }
  const subequipo = AplicarPeriodosASubequipo(base, periodos.get(fila.subequipoId));
  return {
    fila: {
      ...fila,
      disponibilidad: subequipo.disponibilidad,
      capacidadActualMw: subequipo.capacidadActualMw,
      motivo: subequipo.motivo ?? (subequipo.periodoVigente ? fila.motivo : undefined)
    },
    subequipo
  };
}

export default function ModalGestionarSubequiposSolicitudOperador(
  props: ModalGestionarSubequiposSolicitudOperadorProps
): React.ReactElement {
  const { context, solicitud, visible, onCerrar, onActualizado } = props;
  const [filas, setFilas] = useState<IndisponibilidadSubequipoSolicitud[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [modoPanel, setModoPanel] = useState<ModoPanelGestion | undefined>(undefined);
  const [contextoPanel, setContextoPanel] = useState<ContextoSub | undefined>(undefined);
  const [periodos, setPeriodos] = useState<Map<number, PeriodoIndisponibilidad[]> | undefined>(undefined);

  const Recargar = useCallback((): void => {
    if (!solicitud) {
      return;
    }
    setCargando(true);
    setError(undefined);
    if (HayServicioPeriodos()) {
      ObtenerPeriodosAbiertos()
        .then((abiertos) => setPeriodos(AgruparPeriodosPorSubequipo(abiertos)))
        .catch(() => setPeriodos(undefined));
    }
    ObtenerIndisponibilidadesPorSolicitud(context, solicitud.id)
      .then(setFilas)
      .catch((err) => {
        const mensaje =
          err instanceof SharePointRestError ? err.message : 'No se pudieron cargar los equipos de la solicitud.';
        setError(mensaje);
        setFilas([]);
      })
      .then(() => setCargando(false))
      .catch(() => undefined);
  }, [context, solicitud]);

  useEffect(() => {
    if (!visible || !solicitud) {
      setFilas([]);
      setError(undefined);
      setModoPanel(undefined);
      setContextoPanel(undefined);
      return;
    }
    if (solicitud.subequipos.length > 0) {
      setFilas(solicitud.subequipos);
    }
    Recargar();
  }, [visible, solicitud, Recargar]);

  if (!visible || !solicitud) {
    return <></>;
  }

  // El formulario se cierra solo (onCancelar) si todo salió bien; si no, deja su aviso visible.
  const TrasGuardar = (): void => {
    Recargar();
    onActualizado();
  };

  const AbrirPanel = (modo: ModoPanelGestion, fila: IndisponibilidadSubequipoSolicitud): void => {
    const { subequipo } = FilaConPeriodos(fila, periodos);
    setModoPanel(modo);
    setContextoPanel({ subequipo, subequipos: [subequipo] });
  };

  const CerrarPanel = (): void => {
    setModoPanel(undefined);
    setContextoPanel(undefined);
  };

  return (
    <>
      <div className="modal fade show d-block modal-operador-renovable" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h2 className="modal-title h5 mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-solar-panel" aria-hidden="true" />
                Disponibilidad de equipos
              </h2>
              <button
                type="button"
                className="btn-close btn-close-white"
                aria-label="Cerrar"
                onClick={onCerrar}
              />
            </div>
            <div className="modal-body">
              <p className="text-muted mb-3">
                Equipos de la solicitud. Use las acciones para marcar disponibilidad o indisponibilidad.
              </p>
              {error ? <div className="alert alert-danger py-2">{error}</div> : null}

              {modoPanel && contextoPanel ? (
                <div id="gestionInvOperacionHost" className="or-gestion-panel border rounded p-3 mb-3 bg-light">
                  {modoPanel === 'indisp' ? (
                    <FormularioMarcarIndisponibilidadSubequipo
                      context={context}
                      mostrarTitulo
                      subequipos={contextoPanel.subequipos}
                      nombreEquipo={undefined}
                      central={solicitud.central}
                      centralId={solicitud.centralId}
                      onCancelar={CerrarPanel}
                      onGuardado={TrasGuardar}
                    />
                  ) : null}
                  {modoPanel === 'disp' ? (
                    <FormularioMarcarDisponibilidadSubequipo
                      context={context}
                      subequipos={contextoPanel.subequipos}
                      nombreEquipo={undefined}
                      central={solicitud.central}
                      onCancelar={CerrarPanel}
                      onGuardado={TrasGuardar}
                    />
                  ) : null}
                  {modoPanel === 'bitacora' ? (
                    <PanelBitacoraSubequipoOperador
                      context={context}
                      subequipo={contextoPanel.subequipo}
                      nombreEquipo={undefined}
                      central={solicitud.central}
                      onCerrar={CerrarPanel}
                    />
                  ) : null}
                </div>
              ) : null}

              {cargando && filas.length === 0 ? <p className="text-muted mb-0">Cargando equipos…</p> : null}
              <div>
                <table className="table table-sm table-bordered mb-0 cowork-tabla-fichas">
                  <thead className="table-light">
                    <tr>
                      <th scope="col">Equipo</th>
                      <th scope="col" className="text-center">
                        Estado
                      </th>
                      <th scope="col">Motivo</th>
                      <th scope="col">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!cargando && filas.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center text-muted">
                          No hay equipos vinculados en CONC_LISTA_INDISPONIBILIDADES.
                        </td>
                      </tr>
                    ) : null}
                    {filas.map((original) => {
                      const { fila } = FilaConPeriodos(original, periodos);
                      const indisponible = fila.disponibilidad === 'Indisponible';
                      return (
                        <tr key={fila.id}>
                          <td data-label="Equipo">
                            <PanelCopySubequipoSolicitud codigo={fila.codigo} tipoEtiqueta={fila.tipoEtiqueta} />
                          </td>
                          <td className="text-center align-middle" data-label="Estado">
                            <PuntoEstadoSubequipoSolicitud disponibilidad={fila.disponibilidad} />
                          </td>
                          <td className="align-middle" data-label="Motivo">{FormatearMotivoSubequipoSolicitud(fila.motivo)}</td>
                          <td className="text-nowrap align-middle" data-label="Acciones">
                            {/* Una sola acción según el estado (maqueta `botonesDisponibilidad`). */}
                            {indisponible ? (
                              <button
                                type="button"
                                className="btn btn-sm btn-success me-1"
                                title="Marcar disponibilidad"
                                aria-label={`Marcar disponibilidad de ${fila.codigo}`}
                                onClick={() => AbrirPanel('disp', fila)}
                              >
                                <i className="bi bi-check-lg" aria-hidden="true" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-sm btn-danger me-1"
                                title="Marcar indisponibilidad"
                                aria-label={`Marcar indisponibilidad de ${fila.codigo}`}
                                onClick={() => AbrirPanel('indisp', fila)}
                              >
                                <i className="bi bi-x-lg" aria-hidden="true" />
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              title="Ver bitácora"
                              aria-label={`Bitácora de ${fila.codigo}`}
                              onClick={() => AbrirPanel('bitacora', fila)}
                            >
                              <i className="bi bi-journal-text" aria-hidden="true" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-sm btn-secondary" onClick={onCerrar}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" aria-hidden="true" />
    </>
  );
}
