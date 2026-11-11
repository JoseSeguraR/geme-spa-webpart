import * as React from 'react';
import { useMemo, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { GridColDef, GridRowId } from '@mui/x-data-grid';
import { GrillaLocalMui } from '../../../../../grilla';
import { UseCatalogoEquiposOperadorRenovable } from '../equipos/UseCatalogoEquiposOperadorRenovable';
import { UseCapacidadMeteologicaCentral } from '../equipos/UseCapacidadMeteologicaCentral';
import {
  AvisoCapacidadMeteologica,
  EtiquetaCapacidadMeteologica,
  TextoCapacidadMeteologica
} from '../equipos/IndicadorCapacidadMeteologica';
import { CeldaAccionesCentrada, ObtenerOpcionesBaseColumnaAccionesGrilla } from '../../../../../grilla/ColumnaAccionesGrilla';
import CarcasaOperadorRenovable from '../CarcasaOperadorRenovable';
import { UseRefrescoOperadorRenovable } from '../UseRefrescoOperadorRenovable';
import { MotivoIndisponibilidadFalla } from '../../../../../../services/sharepoint/operadorRenovable/CamposOperadorRenovable';
import type { SolicitudOperadorRenovableFila } from '../../../../../../models/operadorRenovable/SolicitudOperadorRenovable';
import ModalVerSolicitudConcentradorOperador from '../solicitudes/ModalVerSolicitudConcentradorOperador';
import ModalVerSolicitudFallaOperador from './ModalVerSolicitudFallaOperador';
import DesplegableAccionesFilaGrilla from '../../../../../concentrador/DesplegableAccionesFilaGrilla';
import { AccionMenuFilaGrillaConIcono } from '../../../../../concentrador/accionesGrillaConcentrador';
import type { LimitacionSubestacionOperador } from '../../../../../../models/operadorRenovable/LimitacionSubestacionOperador';
import {
  EsLimitacionSubestacionActiva,
  FinalizarLimitacionRed,
  ReintentarEnvioMeteologicaLimitacion
} from '../../../../../../services/sharepoint/operadorRenovable/LimitacionesRedServicio';
import { SharePointRestError } from '../../../../../../services/sharepoint/SharePointRestError';
import ModalBitacoraLimitacionSubestacion from './ModalBitacoraLimitacionSubestacion';
import ModalLimitacionSubestacionOperador from './ModalLimitacionSubestacionOperador';
import { UseLimitacionesSubestacionOperadorRenovable } from './UseLimitacionesSubestacionOperadorRenovable';

export type ContenidoSubestacionOperadorRenovableProps = {
  context: WebPartContext;
};

type FilaGrilla = LimitacionSubestacionOperador & { id: GridRowId };

function FormatearMw(valor: number): string {
  return `${valor.toLocaleString('es-CL', { maximumFractionDigits: 2 })} MW`;
}

export default function ContenidoSubestacionOperadorRenovable(
  props: ContenidoSubestacionOperadorRenovableProps
): React.ReactElement {
  const { context } = props;
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
  const [mensajeAccion, setMensajeAccion] = useState<string | undefined>();

  const { filas, centrales, estadoCarga, mensajeError, recargar } = UseLimitacionesSubestacionOperadorRenovable(
    context,
    tokenRecarga + tokenRefrescoGlobal
  );

  // Capacidad instalada por central (subequipos activos), para los indicadores (maqueta `calcularResumenLimitacionRed`).
  const { tarjetas: equiposCatalogo } = UseCatalogoEquiposOperadorRenovable(context, tokenRecarga + tokenRefrescoGlobal, false);

  const idCentralFiltro = filtroCentralId ? Number.parseInt(filtroCentralId, 10) : undefined;
  const hayFiltroCentral = idCentralFiltro !== undefined && Number.isFinite(idCentralFiltro);
  const capacidadMeteologica = UseCapacidadMeteologicaCentral(context, hayFiltroCentral ? idCentralFiltro : undefined);

  // El servicio solo trae limitaciones activas.
  const filasFiltradas = useMemo(
    () => filas.filter((fila) => !hayFiltroCentral || fila.instalacionId === idCentralFiltro),
    [filas, hayFiltroCentral, idCentralFiltro]
  );

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
        fechaProgramadaInicioIso: '',
        fechaEfectivaInicioIso: '',
        estado: '—'
      });
    }
  };

  /** Capacidad total, disponible, limitado por red y % limitado de la central filtrada (o de todas). */
  const resumen = useMemo(() => {
    const totalMw = equiposCatalogo
      .filter((eq) => !hayFiltroCentral || eq.centralId === idCentralFiltro)
      .reduce((suma, eq) => suma + eq.totalMw, 0);
    const limitadoMw = filas
      .filter((l) => EsLimitacionSubestacionActiva(l.estado) && (!hayFiltroCentral || l.instalacionId === idCentralFiltro))
      .reduce((suma, l) => suma + l.potenciaLimitadaMw, 0);
    return {
      totalMw,
      limitadoMw,
      disponibleMw: Math.max(0, totalMw - limitadoMw),
      porcentaje: totalMw > 0 ? (limitadoMw / totalMw) * 100 : 0
    };
  }, [equiposCatalogo, filas, hayFiltroCentral, idCentralFiltro]);

  const RecargarTodo = (): void => {
    setTokenRecarga((v) => v + 1);
    recargar();
  };

  const Finalizar = async (fila: LimitacionSubestacionOperador): Promise<void> => {
    const confirmar = window.confirm(
      '¿Finalizar esta limitación? Se registra con la fecha y hora actual y deja de mostrarse en la lista.'
    );
    if (!confirmar) {
      return;
    }
    setErrorAccion(undefined);
    setMensajeAccion(undefined);
    try {
      const envio = await FinalizarLimitacionRed(context, fila);
      if (!envio.enviado) {
        setErrorAccion(`La limitación quedó finalizada. ${envio.mensaje}`);
      }
      RecargarTodo();
    } catch (err) {
      const mensaje =
        err instanceof SharePointRestError ? err.message : 'No se pudo finalizar la limitación.';
      setErrorAccion(mensaje);
    }
  };

  const ReintentarEnvio = async (fila: LimitacionSubestacionOperador): Promise<void> => {
    setErrorAccion(undefined);
    setMensajeAccion(undefined);
    try {
      const envio = await ReintentarEnvioMeteologicaLimitacion(fila);
      if (envio.enviado) {
        setMensajeAccion(envio.mensaje);
      } else {
        setErrorAccion(envio.mensaje);
      }
      RecargarTodo();
    } catch (err) {
      const mensaje =
        err instanceof SharePointRestError ? err.message : 'No se pudo reintentar el envío a Meteológica.';
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
            ...(activa
              ? [
                  AccionMenuFilaGrillaConIcono('editar', 'Modificar', () => setModalFormulario(fila)),
                  AccionMenuFilaGrillaConIcono('finalizar', 'Finalizar', () => {
                    Finalizar(fila).catch(() => undefined);
                  })
                ]
              : []),
            ...(tieneVinculo
              ? [
                  AccionMenuFilaGrillaConIcono('ver-solicitud', 'Ver solicitud vinculada', () =>
                    AbrirSolicitudVinculada(fila)
                  )
                ]
              : []),
            AccionMenuFilaGrillaConIcono('bitacora', 'Bitácora', () => setLimitacionBitacora(fila)),
            AccionMenuFilaGrillaConIcono('meteo', 'Reintentar envío a Meteológica', () => {
              ReintentarEnvio(fila).catch(() => undefined);
            })
          ];
          return (
            <CeldaAccionesCentrada>
              <DesplegableAccionesFilaGrilla idRegistro={fila.id} acciones={acciones} />
            </CeldaAccionesCentrada>
          );
        }
      },
      { field: 'central', headerName: 'Central', minWidth: 140, flex: 1, cellClassName: 'cowork-celda-texto-largo' },
      {
        field: 'potenciaLimitadaMw',
        headerName: 'Potencia',
        width: 120,
        renderCell: (params) => (
          <span className="d-flex flex-column lh-sm">
            <strong>{FormatearMw(params.row.potenciaLimitadaMw)}</strong>
            <small className="text-muted">{(params.row.potenciaLimitadaMw * 1000).toLocaleString('es-CL')} kW</small>
          </span>
        )
      },
      { field: 'fechaInicio', headerName: 'Fecha efectiva de inicio', width: 150 },
      { field: 'fechaFin', headerName: 'Fecha efectiva de fin', width: 150 },
      { field: 'motivo', headerName: 'Motivo', width: 100 },
      { field: 'descripcion', headerName: 'Descripción', minWidth: 180, flex: 1.5, cellClassName: 'cowork-celda-texto-largo' }
    ],
    []
  );

  const estadoGrilla =
    estadoCarga === 'error' ? 'error' : estadoCarga === 'cargando' && filas.length === 0 ? 'cargando' : 'listo';

  return (
    <CarcasaOperadorRenovable tabActiva="subestacion">
      {mensajeError ? <div className="alert alert-danger py-2">{mensajeError}</div> : null}
      {errorAccion ? <div className="alert alert-warning py-2">{errorAccion}</div> : null}
      {mensajeAccion ? <div className="alert alert-success py-2">{mensajeAccion}</div> : null}

      <div className="row g-2 mb-3">
        {[
          { etiqueta: 'Capacidad total', mw: resumen.totalMw, clase: 'primary' },
          { etiqueta: 'Disponible', mw: resumen.disponibleMw, clase: 'success' },
          { etiqueta: 'Limitado por red', mw: resumen.limitadoMw, clase: 'danger' }
        ].map((kpi) => (
          <div key={kpi.etiqueta} className="col-6 col-lg">
            <div className={`card h-100 cowork-operador-renovable__kpi border-${kpi.clase}`}>
              <div className="card-body py-2">
                <div className="text-muted text-uppercase small">{kpi.etiqueta}</div>
                <div className="fs-5 fw-semibold">{FormatearMw(kpi.mw)}</div>
                <small className="text-muted">{(kpi.mw * 1000).toLocaleString('es-CL', { maximumFractionDigits: 0 })} kW</small>
              </div>
            </div>
          </div>
        ))}
        <div className="col-6 col-lg">
          <div className="card h-100 cowork-operador-renovable__kpi border-warning">
            <div className="card-body py-2">
              <div className="text-muted text-uppercase small">% limitado</div>
              <div className="fs-5 fw-semibold">{resumen.porcentaje.toFixed(1)} %</div>
              <div
                className="progress mt-2 cowork-operador-renovable__barra"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Number(resumen.porcentaje.toFixed(1))}
              >
                <div className="progress-bar bg-warning" style={{ width: `${Math.min(resumen.porcentaje, 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
        {capacidadMeteologica.estado === 'sinCentral' ? null : (
          <div className="col-6 col-lg">
            <div className="card h-100 cowork-operador-renovable__kpi border-info">
              <div className="card-body py-2">
                <div className="text-muted text-uppercase small">{EtiquetaCapacidadMeteologica}</div>
                <div className="fs-5 fw-semibold">{TextoCapacidadMeteologica(capacidadMeteologica)}</div>
                {capacidadMeteologica.estado === 'listo' ? (
                  <small className="text-muted">
                    {(capacidadMeteologica.capacidadMw * 1000).toLocaleString('es-CL', { maximumFractionDigits: 0 })} kW
                  </small>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
      {hayFiltroCentral ? (
        <AvisoCapacidadMeteologica capacidad={capacidadMeteologica} capacidadGemeMw={resumen.totalMw} />
      ) : null}

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
            <option value="">Todas las centrales</option>
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

      <GrillaLocalMui<FilaGrilla>
        filas={filasFiltradas}
        columnas={columnas}
        estadoCarga={estadoGrilla}
        campoOrdenInicial="fechaInicio"
        direccionOrdenInicial="desc"
        valorOrden={(fila, campo) =>
          campo === 'fechaInicio' ? fila.fechaInicioIso ?? '' : campo === 'fechaFin' ? fila.fechaFinIso ?? '' : fila[campo as keyof FilaGrilla]
        }
        etiquetaBusqueda="Buscar limitación"
        textoBusquedaFila={(fila) => [fila.central, fila.descripcion, fila.motivo, fila.fechaInicio, fila.fechaFin].join(' ')}
        mensajeSinRegistros="No hay limitaciones activas."
        mensajeError={mensajeError}
        onReintentar={RecargarTodo}
      />

      <ModalLimitacionSubestacionOperador
        context={context}
        centrales={centrales}
        centralInicialId={hayFiltroCentral ? idCentralFiltro : undefined}
        limitacion={modalFormulario !== undefined && modalFormulario !== 'nueva' ? modalFormulario : undefined}
        visible={modalFormulario !== undefined}
        onCerrar={() => setModalFormulario(undefined)}
        onGuardado={(aviso) => {
          setErrorAccion(aviso);
          setMensajeAccion(undefined);
          RecargarTodo();
        }}
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
