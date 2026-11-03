import * as React from 'react';
import { useMemo, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { GridColDef, GridRowId } from '@mui/x-data-grid';
import { GrillaServidorMui } from '../../../../../grilla';
import { CeldaAccionesCentrada, ObtenerOpcionesBaseColumnaAccionesGrilla } from '../../../../../grilla/ColumnaAccionesGrilla';
import CarcasaOperadorRenovable from '../CarcasaOperadorRenovable';
import { UseRefrescoOperadorRenovable } from '../UseRefrescoOperadorRenovable';
import { MotivoIndisponibilidadFalla } from '../../../../../../services/sharepoint/operadorRenovable/CamposOperadorRenovable';
import type { SolicitudOperadorRenovableFila } from '../../../../../../models/operadorRenovable/SolicitudOperadorRenovable';
import ModalVerSolicitudConcentradorOperador from '../solicitudes/ModalVerSolicitudConcentradorOperador';
import ModalVerSolicitudFallaOperador from './ModalVerSolicitudFallaOperador';
import DesplegableAccionesFilaGrilla from '../../../../../concentrador/DesplegableAccionesFilaGrilla';
import { AccionMenuFilaGrillaConIcono } from '../../../../../concentrador/accionesGrillaConcentrador';
import type { FiltroEstadoLimitacionSubestacion } from '../constantesOperadorRenovable';
import type { LimitacionSubestacionOperador } from '../../../../../../models/operadorRenovable/LimitacionSubestacionOperador';
import {
  EsLimitacionSubestacionActiva,
  FinalizarLimitacionRed,
  RegistrarEnvioMeteologicaLimitacionSimulado
} from '../../../../../../services/sharepoint/operadorRenovable/LimitacionesRedServicio';
import { SharePointRestError } from '../../../../../../services/sharepoint/SharePointRestError';
import ModalBitacoraLimitacionSubestacion from './ModalBitacoraLimitacionSubestacion';
import ModalLimitacionSubestacionOperador from './ModalLimitacionSubestacionOperador';
import { UseLimitacionesSubestacionOperadorRenovable } from './UseLimitacionesSubestacionOperadorRenovable';

export type ContenidoSubestacionOperadorRenovableProps = {
  context: WebPartContext;
};

type FilaGrilla = LimitacionSubestacionOperador & { id: GridRowId };

export default function ContenidoSubestacionOperadorRenovable(
  props: ContenidoSubestacionOperadorRenovableProps
): React.ReactElement {
  const { context } = props;
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstadoLimitacionSubestacion>('activas');
  const [textoBusqueda, setTextoBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(0);
  const [tamanoPagina, setTamanoPagina] = useState(10);
  const [tokenRecarga, setTokenRecarga] = useState(0);
  const tokenRefrescoGlobal = UseRefrescoOperadorRenovable();
  const [filtroCentralId, setFiltroCentralId] = useState('');
  const [solicitudConcentradorVer, setSolicitudConcentradorVer] = useState<
    SolicitudOperadorRenovableFila | undefined
  >(undefined);
  const [solicitudFallaVerId, setSolicitudFallaVerId] = useState<number | undefined>(undefined);
  const [modalFormulario, setModalFormulario] = useState<LimitacionSubestacionOperador | 'nueva' | undefined>(
    undefined
  );
  const [limitacionBitacora, setLimitacionBitacora] = useState<LimitacionSubestacionOperador | undefined>(undefined);
  const [errorAccion, setErrorAccion] = useState<string | undefined>();

  const { filas, centrales, estadoCarga, mensajeError, recargar } = UseLimitacionesSubestacionOperadorRenovable(
    context,
    tokenRecarga + tokenRefrescoGlobal
  );

  const filasFiltradas = useMemo(() => {
    const texto = textoBusqueda.trim().toLowerCase();
    const idCentral = filtroCentralId ? Number.parseInt(filtroCentralId, 10) : undefined;
    return filas.filter((fila) => {
      if (filtroEstado === 'activas' && !EsLimitacionSubestacionActiva(fila.estado)) {
        return false;
      }
      if (idCentral !== undefined && Number.isFinite(idCentral) && fila.instalacionId !== idCentral) {
        return false;
      }
      if (!texto) {
        return true;
      }
      const blob = [fila.central, fila.descripcion, fila.motivo, fila.estado].join(' ').toLowerCase();
      return blob.includes(texto);
    });
  }, [filas, filtroEstado, filtroCentralId, textoBusqueda]);

  const AbrirSolicitudVinculada = (fila: LimitacionSubestacionOperador): void => {
    if (fila.motivo === MotivoIndisponibilidadFalla && fila.solicitudFallaId) {
      setSolicitudFallaVerId(fila.solicitudFallaId);
      return;
    }
    if (fila.solicitudConcentradorId) {
      setSolicitudConcentradorVer({
        id: fila.solicitudConcentradorId,
        idSolicitud: fila.solicitudConcentradorEtiqueta ?? `#${fila.solicitudConcentradorId}`,
        idCenSodi: fila.solicitudConcentradorEtiqueta ?? `#${fila.solicitudConcentradorId}`,
        relacionSodiCen: '',
        solicitante: '—',
        central: fila.central,
        equiposResumen: '',
        cantidadSubequipos: 0,
        descripcion: '',
        subequiposIndisponibles: 0,
        subequiposTotal: 0,
        subequipos: [],
        fechaProgramadaInicio: '—',
        fechaEfectivaInicio: '—',
        estado: '—'
      });
    }
  };

  const resumen = useMemo(() => {
    const activas = filas.filter((l) => EsLimitacionSubestacionActiva(l.estado));
    const mwLimitados = activas.reduce((sum, l) => sum + l.potenciaLimitadaMw, 0);
    return { activas: activas.length, mwLimitados };
  }, [filas]);

  const RecargarTodo = (): void => {
    setTokenRecarga((v) => v + 1);
    recargar();
  };

  const Finalizar = async (fila: LimitacionSubestacionOperador): Promise<void> => {
    const confirmar = window.confirm(`¿Finalizar la limitación en ${fila.central} (${fila.potenciaLimitadaMw} MW)?`);
    if (!confirmar) {
      return;
    }
    setErrorAccion(undefined);
    try {
      await FinalizarLimitacionRed(context, fila);
      RecargarTodo();
    } catch (err) {
      const mensaje =
        err instanceof SharePointRestError ? err.message : 'No se pudo finalizar la limitación.';
      setErrorAccion(mensaje);
    }
  };

  const EnviarMeteologica = async (fila: LimitacionSubestacionOperador): Promise<void> => {
    setErrorAccion(undefined);
    try {
      await RegistrarEnvioMeteologicaLimitacionSimulado(context, fila);
      RecargarTodo();
    } catch (err) {
      const mensaje =
        err instanceof SharePointRestError ? err.message : 'No se pudo registrar el envío simulado.';
      setErrorAccion(mensaje);
    }
  };

  const columnas: GridColDef<FilaGrilla>[] = useMemo(
    () => [
      {
        ...ObtenerOpcionesBaseColumnaAccionesGrilla(96),
        renderCell: (params) => {
          const fila = params.row;
          const activa = EsLimitacionSubestacionActiva(fila.estado);
          const tieneVinculo =
            (fila.motivo === MotivoIndisponibilidadFalla && fila.solicitudFallaId) ||
            fila.solicitudConcentradorId;
          const acciones = [
            ...(tieneVinculo
              ? [
                  AccionMenuFilaGrillaConIcono('ver-solicitud', 'Ver solicitud vinculada', () =>
                    AbrirSolicitudVinculada(fila)
                  )
                ]
              : []),
            AccionMenuFilaGrillaConIcono('bitacora', 'Bitácora', () => setLimitacionBitacora(fila)),
            ...(activa
              ? [
                  AccionMenuFilaGrillaConIcono('editar', 'Modificar', () => setModalFormulario(fila)),
                  AccionMenuFilaGrillaConIcono('finalizar', 'Finalizar', () => {
                    Finalizar(fila).catch(() => undefined);
                  }),
                  AccionMenuFilaGrillaConIcono('meteo', 'Enviar a Meteológica', () => {
                    EnviarMeteologica(fila).catch(() => undefined);
                  })
                ]
              : [])
          ];
          return (
            <CeldaAccionesCentrada>
              <DesplegableAccionesFilaGrilla idRegistro={fila.id} acciones={acciones} />
            </CeldaAccionesCentrada>
          );
        }
      },
      { field: 'central', headerName: 'Central', minWidth: 140, flex: 1 },
      {
        field: 'potenciaLimitadaMw',
        headerName: 'Potencia (MW)',
        minWidth: 110,
        valueFormatter: (valor) => `${Number(valor)} MW (${Number(valor) * 1000} kW)`
      },
      { field: 'fechaInicio', headerName: 'Inicio', minWidth: 140 },
      { field: 'fechaFin', headerName: 'Fin', minWidth: 120 },
      { field: 'motivo', headerName: 'Motivo', minWidth: 90 },
      { field: 'descripcion', headerName: 'Descripción', minWidth: 200, flex: 1.2 },
      {
        field: 'estado',
        headerName: 'Estado',
        minWidth: 110,
        renderCell: (params) => {
          const activa = EsLimitacionSubestacionActiva(String(params.value));
          return (
            <span className={activa ? 'cowork-grilla-celda-alerta' : undefined}>{String(params.value)}</span>
          );
        }
      }
    ],
    []
  );

  const estadoGrilla =
    estadoCarga === 'error' ? 'error' : estadoCarga === 'cargando' && filas.length === 0 ? 'cargando' : 'listo';

  return (
    <CarcasaOperadorRenovable tabActiva="subestacion">
      {mensajeError ? <div className="alert alert-danger py-2">{mensajeError}</div> : null}
      {errorAccion ? <div className="alert alert-warning py-2">{errorAccion}</div> : null}

      <div className="cowork-operador-renovable__toolbar d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <div className="d-flex flex-wrap gap-2">
          <span className="cowork-operador-renovable__chip">{resumen.activas} activas</span>
          <span className="cowork-operador-renovable__chip">
            {resumen.mwLimitados.toFixed(1)} MW limitados (activas)
          </span>
        </div>
        <fieldset className="cowork-vista__radios-estado d-flex flex-wrap gap-3 mb-0 border-0 p-0">
          <legend className="visually-hidden">Estado limitación</legend>
          {(
            [
              ['activas', 'Activas'],
              ['todas', 'Todas']
            ] as const
          ).map(([valor, etiqueta]) => {
            const idRadio = `filtro-pgl-or-${valor}`;
            return (
              <div key={valor} className="form-check form-check-inline mb-0">
                <input
                  className="form-check-input"
                  type="radio"
                  name="filtro-pgl-or"
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
      </div>

      <div className="cowork-vista__barra-acciones d-flex flex-wrap align-items-end gap-3 mb-3">
        <div style={{ maxWidth: '14rem' }}>
          <label className="form-label form-label-sm mb-1" htmlFor="filtro-central-pgl">
            Central
          </label>
          <select
            id="filtro-central-pgl"
            className="form-select form-select-sm"
            value={filtroCentralId}
            onChange={(e) => setFiltroCentralId(e.target.value)}
          >
            <option value="">Todas</option>
            {centrales.map((c) => (
              <option key={c.id} value={c.id}>
                {c.central}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="btn btn-sm cowork-btn-primary"
          disabled={centrales.length === 0}
          onClick={() => setModalFormulario('nueva')}
        >
          <i className="bi bi-plus-lg me-1" aria-hidden="true" />
          Crear limitación
        </button>
      </div>

      <GrillaServidorMui
        filas={filasFiltradas}
        columnas={columnas}
        estadoCarga={estadoGrilla}
        paginaActual={paginaActual}
        tamanoPagina={tamanoPagina}
        hayPaginaSiguiente={false}
        onCambioPagina={setPaginaActual}
        onCambioTamanoPagina={setTamanoPagina}
        campoOrden="fechaInicio"
        direccionOrden="desc"
        onCambioOrdenamiento={() => undefined}
        busqueda={{
          etiqueta: 'Buscar limitación',
          valorEnConsulta: textoBusqueda,
          onCambioConsulta: setTextoBusqueda
        }}
        mensajeSinRegistros="No hay limitaciones registradas."
        mensajeSinRegistrosBusqueda="No hay limitaciones que coincidan con la búsqueda."
        textoBusquedaActiva={textoBusqueda}
        mensajeError={mensajeError}
        onReintentar={RecargarTodo}
      />

      <ModalLimitacionSubestacionOperador
        context={context}
        centrales={centrales}
        limitacion={modalFormulario !== undefined && modalFormulario !== 'nueva' ? modalFormulario : undefined}
        visible={modalFormulario !== undefined}
        onCerrar={() => setModalFormulario(undefined)}
        onGuardado={RecargarTodo}
      />
      <ModalBitacoraLimitacionSubestacion
        context={context}
        limitacion={limitacionBitacora}
        visible={limitacionBitacora !== undefined}
        onCerrar={() => setLimitacionBitacora(undefined)}
      />
      <ModalVerSolicitudConcentradorOperador
        context={context}
        solicitud={solicitudConcentradorVer}
        visible={solicitudConcentradorVer !== undefined}
        onCerrar={() => setSolicitudConcentradorVer(undefined)}
      />
      <ModalVerSolicitudFallaOperador
        context={context}
        solicitudFallaId={solicitudFallaVerId}
        visible={solicitudFallaVerId !== undefined}
        onCerrar={() => setSolicitudFallaVerId(undefined)}
      />
    </CarcasaOperadorRenovable>
  );
}
