import * as React from 'react';
import { useMemo, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { GridColDef, GridRowId } from '@mui/x-data-grid';
import { GrillaLocalMui } from '../../../../../grilla';
import { CeldaAccionesCentrada, ObtenerOpcionesBaseColumnaAccionesGrilla } from '../../../../../grilla/ColumnaAccionesGrilla';
import DesplegableAccionesFilaGrilla from '../../../../../concentrador/DesplegableAccionesFilaGrilla';
import { AccionMenuFilaGrillaConIcono } from '../../../../../concentrador/accionesGrillaConcentrador';
import type { SolicitudOperadorRenovableFila } from '../../../../../../models/operadorRenovable/SolicitudOperadorRenovable';
import CarcasaOperadorRenovable from '../CarcasaOperadorRenovable';
import { UseRefrescoOperadorRenovable } from '../UseRefrescoOperadorRenovable';
import type {
  FiltroDisponibilidadSolicitudesOperador,
  FiltroEstadoSolicitudesOperadorRenovable
} from '../constantesOperadorRenovable';
import ModalBitacoraSolicitudConcentradorOperador from './ModalBitacoraSolicitudConcentradorOperador';
import ModalGestionarSubequiposSolicitudOperador from './ModalGestionarSubequiposSolicitudOperador';
import ModalListaSubequiposSolicitudOperador from './ModalListaSubequiposSolicitudOperador';
import ModalVerSolicitudConcentradorOperador from './ModalVerSolicitudConcentradorOperador';
import { UseSolicitudesOperadorRenovableLista } from './UseSolicitudesOperadorRenovableLista';
import {
  BadgeEstadoSolicitudOperador,
  CeldaDisponibilidadSolicitudOperador,
  CeldaEquiposSolicitudOperador,
  CeldaIdCenSodiSolicitudOperador,
  CeldaSolicitanteSolicitudOperador
} from './UiGrillaSolicitudesOperadorRenovable';

export type ContenidoSolicitudesOperadorRenovableProps = {
  context: WebPartContext;
};

type FilaGrilla = SolicitudOperadorRenovableFila & { id: GridRowId };

function SolicitudTieneAlerta(fila: SolicitudOperadorRenovableFila): boolean {
  return fila.subequiposIndisponibles > 0;
}

function SolicitudCumpleFiltro(
  fila: SolicitudOperadorRenovableFila,
  filtro: FiltroDisponibilidadSolicitudesOperador
): boolean {
  if (filtro === 'todas') {
    return true;
  }
  if (filtro === 'alerta') {
    return SolicitudTieneAlerta(fila);
  }
  return !SolicitudTieneAlerta(fila);
}

export default function ContenidoSolicitudesOperadorRenovable(
  props: ContenidoSolicitudesOperadorRenovableProps
): React.ReactElement {
  const { context } = props;
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstadoSolicitudesOperadorRenovable>('enCurso');
  const [filtroDisponibilidad, setFiltroDisponibilidad] =
    useState<FiltroDisponibilidadSolicitudesOperador>('todas');
  const [tokenRecarga, setTokenRecarga] = useState(0);
  const tokenRefrescoGlobal = UseRefrescoOperadorRenovable();

  const [solicitudVer, setSolicitudVer] = useState<SolicitudOperadorRenovableFila | undefined>(undefined);
  const [solicitudGestionar, setSolicitudGestionar] = useState<SolicitudOperadorRenovableFila | undefined>(undefined);
  const [solicitudBitacora, setSolicitudBitacora] = useState<SolicitudOperadorRenovableFila | undefined>(undefined);
  const [solicitudListaEquipos, setSolicitudListaEquipos] = useState<SolicitudOperadorRenovableFila | undefined>(
    undefined
  );

  // Como la maqueta: búsqueda, orden y paginación en el navegador sobre las solicitudes cargadas.
  const { filas, estadoCarga, mensajeError, recargar } = UseSolicitudesOperadorRenovableLista(
    context,
    '',
    filtroEstado,
    tokenRecarga + tokenRefrescoGlobal
  );

  const filasFiltradas = useMemo(() => {
    return filas.filter((fila) => SolicitudCumpleFiltro(fila, filtroDisponibilidad));
  }, [filas, filtroDisponibilidad]);

  const kpis = useMemo(() => {
    const total = filas.length;
    const alerta = filas.filter(SolicitudTieneAlerta).length;
    const ok = total - alerta;
    return { total, alerta, ok };
  }, [filas]);

  const RecargarTodo = (): void => {
    setTokenRecarga((valor) => valor + 1);
    recargar();
  };

  const columnas: GridColDef<FilaGrilla>[] = useMemo(
    () => [
      {
        ...ObtenerOpcionesBaseColumnaAccionesGrilla(96),
        renderCell: (params) => {
          const fila = params.row;
          return (
            <CeldaAccionesCentrada>
              <DesplegableAccionesFilaGrilla
                idRegistro={fila.id}
                acciones={[
                  AccionMenuFilaGrillaConIcono('ver', 'Ver solicitud', () => setSolicitudVer(fila)),
                  AccionMenuFilaGrillaConIcono('gestionar', 'Gestionar', () => setSolicitudGestionar(fila)),
                  AccionMenuFilaGrillaConIcono('bitacora', 'Bitácora', () => setSolicitudBitacora(fila))
                ]}
              />
            </CeldaAccionesCentrada>
          );
        }
      },
      { field: 'id', headerName: 'ID', width: 80 },
      {
        field: 'idCenSodi',
        headerName: 'ID CEN/SODI',
        minWidth: 120,
        flex: 1,
        renderCell: (params) => (
          <CeldaIdCenSodiSolicitudOperador
            idSolicitud={params.row.idSolicitud}
            relacionSodiCen={params.row.relacionSodiCen}
          />
        )
      },
      {
        field: 'solicitante',
        headerName: 'Solicitante',
        minWidth: 140,
        flex: 1,
        renderCell: (params) => (
          <CeldaSolicitanteSolicitudOperador
            solicitante={params.row.solicitante}
            empresaSolicitante={params.row.empresaSolicitante}
          />
        )
      },
      { field: 'central', headerName: 'Central', minWidth: 130, flex: 1 },
      {
        field: 'equiposResumen',
        headerName: 'Equipos',
        minWidth: 140,
        flex: 0.9,
        sortable: false,
        renderCell: (params) => {
          const fila = params.row;
          return (
            <CeldaEquiposSolicitudOperador
              subequipos={fila.subequipos}
              onAbrirLista={() => setSolicitudListaEquipos(fila)}
            />
          );
        }
      },
      { field: 'descripcion', headerName: 'Descripción', minWidth: 180, flex: 1.2 },
      {
        field: 'disponibilidadResumen',
        headerName: 'Disponibilidad',
        minWidth: 130,
        sortable: false,
        renderCell: (params) => (
          <CeldaDisponibilidadSolicitudOperador
            indisponibles={params.row.subequiposIndisponibles}
            total={params.row.subequiposTotal}
          />
        )
      },
      { field: 'fechaProgramadaInicio', headerName: 'Fecha programada de inicio', minWidth: 170 },
      {
        field: 'fechaEfectivaInicio',
        headerName: 'Fecha efectiva de inicio',
        minWidth: 130,
        valueGetter: (_valor, fila) => (fila.estado === 'Vigente' ? fila.fechaEfectivaInicio : '—')
      },
      {
        field: 'estado',
        headerName: 'Estado',
        minWidth: 120,
        renderCell: (params) => <BadgeEstadoSolicitudOperador estado={String(params.value ?? '')} />
      }
    ],
    []
  );

  const estadoGrilla = estadoCarga === 'error' ? 'error' : estadoCarga === 'cargando' && filas.length === 0 ? 'cargando' : 'listo';

  const TextoBusquedaFila = (fila: FilaGrilla): string =>
    [
      fila.id,
      fila.idSolicitud,
      fila.relacionSodiCen,
      fila.solicitante,
      fila.empresaSolicitante ?? '',
      fila.central,
      fila.subequipos.map((s) => s.codigo).join(' '),
      fila.descripcion,
      fila.fechaProgramadaInicio,
      fila.fechaEfectivaInicio,
      fila.estado
    ].join(' ');

  const ValorOrden = (fila: FilaGrilla, campo: string): unknown => {
    if (campo === 'fechaProgramadaInicio') {
      return fila.fechaProgramadaInicioIso;
    }
    if (campo === 'fechaEfectivaInicio') {
      return fila.estado === 'Vigente' ? fila.fechaEfectivaInicioIso : '';
    }
    if (campo === 'idCenSodi') {
      return fila.idSolicitud.indexOf('#') === 0 ? fila.relacionSodiCen : fila.idSolicitud;
    }
    return fila[campo as keyof FilaGrilla];
  };

  return (
    <CarcasaOperadorRenovable tabActiva="solicitudes">
      {mensajeError ? <div className="alert alert-danger py-2">{mensajeError}</div> : null}

      <div className="cowork-operador-renovable__toolbar d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <div className="d-flex flex-wrap gap-2">
          <span className="cowork-operador-renovable__chip">{kpis.total} solicitudes</span>
          <span className="cowork-operador-renovable__chip cowork-operador-renovable__chip--alerta">
            {kpis.alerta} con indisponibilidad
          </span>
          <span className="cowork-operador-renovable__chip cowork-operador-renovable__chip--ok">
            {kpis.ok} disponibles
          </span>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-4">
          <fieldset className="cowork-vista__radios-estado d-flex flex-wrap gap-3 mb-0 border-0 p-0">
            <legend className="visually-hidden">Estado de la solicitud</legend>
            {(
              [
                ['enCurso', 'En curso'],
                ['todosEstados', 'Todos los estados']
              ] as const
            ).map(([valor, etiqueta]) => {
              const idRadio = `filtro-sol-or-estado-${valor}`;
              return (
                <div key={valor} className="form-check form-check-inline mb-0">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="filtro-sol-or-estado"
                    id={idRadio}
                    checked={filtroEstado === valor}
                    onChange={() => setFiltroEstado(valor)}
                  />
                  <label className="form-check-label" htmlFor={idRadio}>
                    {etiqueta}
                  </label>
                </div>
              );
            })}
          </fieldset>
          <fieldset className="cowork-vista__radios-estado d-flex flex-wrap gap-3 mb-0 border-0 p-0">
            <legend className="visually-hidden">Filtro de disponibilidad</legend>
            {(
              [
                ['todas', 'Todas'],
                ['alerta', 'Con indisponibilidad'],
                ['ok', 'Todas disponibles']
              ] as const
            ).map(([valor, etiqueta]) => {
              const idRadio = `filtro-sol-or-disp-${valor}`;
              return (
                <div key={valor} className="form-check form-check-inline mb-0">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="filtro-sol-or-disp"
                    id={idRadio}
                    checked={filtroDisponibilidad === valor}
                    onChange={() => setFiltroDisponibilidad(valor)}
                  />
                  <label className="form-check-label" htmlFor={idRadio}>
                    {etiqueta}
                  </label>
                </div>
              );
            })}
          </fieldset>
        </div>
      </div>

      <p className="text-muted small mb-3">
        Solicitudes con flag de indisponibilidad en sus centrales renovables. Por defecto se muestran en curso
        (Programada, Vigente, Extendida). El estado proviene del motor (TAREAACTUAL).
      </p>

      <GrillaLocalMui<FilaGrilla>
        filas={filasFiltradas}
        columnas={columnas}
        obtenerClaseFila={(fila) => (fila.subequiposIndisponibles > 0 ? 'or-sol-row-alerta' : undefined)}
        estadoCarga={estadoGrilla}
        campoOrdenInicial="fechaProgramadaInicio"
        valorOrden={ValorOrden}
        etiquetaBusqueda="Buscar solicitud"
        textoBusquedaFila={TextoBusquedaFila}
        mensajeSinRegistros={
          filtroEstado === 'enCurso'
            ? 'No hay solicitudes en curso con equipos indisponibles en sus centrales.'
            : 'No hay solicitudes con equipos indisponibles en sus centrales.'
        }
        mensajeError={mensajeError}
        onReintentar={RecargarTodo}
      />

      <ModalVerSolicitudConcentradorOperador
        context={context}
        solicitud={solicitudVer}
        visible={solicitudVer !== undefined}
        onCerrar={() => setSolicitudVer(undefined)}
      />
      <ModalGestionarSubequiposSolicitudOperador
        context={context}
        solicitud={solicitudGestionar}
        visible={solicitudGestionar !== undefined}
        onCerrar={() => setSolicitudGestionar(undefined)}
        onActualizado={RecargarTodo}
      />
      <ModalBitacoraSolicitudConcentradorOperador
        context={context}
        idSolicitudConcentrador={solicitudBitacora?.id}
        etiquetaIdSolicitud={solicitudBitacora?.idSolicitud}
        visible={solicitudBitacora !== undefined}
        onCerrar={() => setSolicitudBitacora(undefined)}
      />
      <ModalListaSubequiposSolicitudOperador
        context={context}
        solicitud={solicitudListaEquipos}
        visible={solicitudListaEquipos !== undefined}
        onCerrar={() => setSolicitudListaEquipos(undefined)}
      />
    </CarcasaOperadorRenovable>
  );
}
