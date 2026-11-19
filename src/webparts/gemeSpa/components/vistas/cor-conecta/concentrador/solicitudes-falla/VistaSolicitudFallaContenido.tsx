import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { PropsVistaSpa } from '../../../../../constants/registro-vistas/TiposRegistroVistas';
import type { CentralMantenedor, EstadoFiltroSolicitudFalla, SolicitudFalla } from '../../../../../models/SolicitudFalla';
import { ObtenerCentralesDesdeSharePoint } from '../../../../../services/sharepoint/solicitudesIl/CentralesServicio';
import { ObtenerIdsInstalacionesUsuarioActual } from '../../../../../services/sharepoint/solicitudesIl/UsuarioInstalacionesSolicitanteServicio';
import { ObtenerEquiposPorCentralFalla } from '../../../../../services/sharepoint/solicitudesFalla/EquiposPorCentralFallaServicio';
import { ConvertirEntradaLocalAIsoUtc } from '../../../../../utils/FechaHoraCorConecta';
import CampoFechaHora24 from '../../../../concentrador/CampoFechaHora24';
import BarraFiltrosDesplegableVista from '../../../BarraFiltrosDesplegableVista';
import ContenedorVistaCorConecta from '../../ContenedorVistaCorConecta';
import LogosMarcaVista from '../../LogosMarcaVista';
import { ObtenerEnlacesTabsConcentrador } from '../EnlacesTabsConcentrador';
import type { RestriccionInstalacionesSolicitante } from '../solicitudes-il/UseSolicitudesIlLista';
import {
  EstadosFiltroSolicitudFallaRadio,
  NombreListaSolicitudFalla,
  SubtitulosPorEstadoFiltroSolicitudFalla
} from './constantesSolicitudFalla';
import GrillaSolicitudFalla from './GrillaSolicitudFalla';
import ModalNuevaSolicitudFalla from './ModalNuevaSolicitudFalla';
import ModalEditarSolicitudFalla from './ModalEditarSolicitudFalla';
import ModalVerSolicitudFalla from './ModalVerSolicitudFalla';
import ModalGestionarSolicitudFalla from './ModalGestionarSolicitudFalla';
import ModalIntegrarSiodSolicitudFalla from './ModalIntegrarSiodSolicitudFalla';
import ModalBitacoraSolicitudFalla from './ModalBitacoraSolicitudFalla';
import type { FiltrosFechaSolicitudFalla } from './UseSolicitudFallaLista';
import { CargarTodasSolicitudesFallaFiltradas } from './CargarTodasSolicitudesFallaFiltradas';
import { DescargarSolicitudesFallaComoExcel } from './DescargarSolicitudesFallaExcel';
import SelectMultipleFiltroVista from './SelectMultipleFiltroVista';
import {
  ObtenerModoAccionesGrillaFallaPorPerfil,
  ObtenerTituloVistaSolicitudFallaPorPerfil,
  PermitirCreacionSolicitudFallaPorPerfil,
  type PerfilVistaSolicitudFallaConcentrador
} from './PerfilVistaSolicitudFalla';
import type { EquipoMantenedorFalla } from '../../../../../models/SolicitudFalla';

const EstadoFiltroInicial: EstadoFiltroSolicitudFalla = 'Vigente';

export type VistaSolicitudFallaContenidoProps = PropsVistaSpa & {
  perfil: PerfilVistaSolicitudFallaConcentrador;
};

export default function VistaSolicitudFallaContenido(props: VistaSolicitudFallaContenidoProps): React.ReactElement {
  const { context, propiedadesSolicitudFalla, perfil } = props;
  const prefijoRutaServidorSitio = context.pageContext.site.serverRelativeUrl;
  const enlacesTabs = useMemo(
    () => ObtenerEnlacesTabsConcentrador(perfil, prefijoRutaServidorSitio),
    [perfil, prefijoRutaServidorSitio]
  );
  const modoAccionesGrilla = ObtenerModoAccionesGrillaFallaPorPerfil(perfil);
  const permitirCreacion = PermitirCreacionSolicitudFallaPorPerfil(perfil);
  const sufijoId = perfil;
  const rutaAccesoListaExcel = useMemo(() => {
    const prefijoSitio = prefijoRutaServidorSitio.replace(/^\//, '');
    return `${prefijoSitio}/Lists/${NombreListaSolicitudFalla}`;
  }, [prefijoRutaServidorSitio]);

  const [estadoPendiente, setEstadoPendiente] = useState<EstadoFiltroSolicitudFalla>(EstadoFiltroInicial);
  const [estadoAplicado, setEstadoAplicado] = useState<EstadoFiltroSolicitudFalla>(EstadoFiltroInicial);
  const [textoBusqueda, setTextoBusqueda] = useState('');
  const [filtrosVisibles, setFiltrosVisibles] = useState(false);
  const [centralPendiente, setCentralPendiente] = useState('');
  const [centralIdAplicado, setCentralIdAplicado] = useState<number | undefined>();
  const [equiposPendientesIds, setEquiposPendientesIds] = useState<string[]>([]);
  const [equiposAplicadosIds, setEquiposAplicadosIds] = useState<readonly number[] | undefined>();
  const [fechaPerturbacionDesdePendiente, setFechaPerturbacionDesdePendiente] = useState('');
  const [fechaPerturbacionHastaPendiente, setFechaPerturbacionHastaPendiente] = useState('');
  const [fechaRetornoDesdePendiente, setFechaRetornoDesdePendiente] = useState('');
  const [fechaRetornoHastaPendiente, setFechaRetornoHastaPendiente] = useState('');
  const [filtrosFechaAplicados, setFiltrosFechaAplicados] = useState<FiltrosFechaSolicitudFalla | undefined>();

  const [modalNuevaVisible, setModalNuevaVisible] = useState(false);
  const [filaVer, setFilaVer] = useState<SolicitudFalla | undefined>();
  const [filaEditar, setFilaEditar] = useState<SolicitudFalla | undefined>();
  const [filaGestionar, setFilaGestionar] = useState<SolicitudFalla | undefined>();
  const [filaIntegrarSiod, setFilaIntegrarSiod] = useState<SolicitudFalla | undefined>();
  const [bitacoraMeta, setBitacoraMeta] = useState<{ id: number; idCen?: string } | undefined>();
  const [recargarToken, setRecargarToken] = useState(0);
  const [exportandoExcel, setExportandoExcel] = useState(false);
  const [mensajeExportacionExcel, setMensajeExportacionExcel] = useState<string | undefined>();
  const [centrales, setCentrales] = useState<CentralMantenedor[]>([]);
  const [equiposFiltro, setEquiposFiltro] = useState<EquipoMantenedorFalla[]>([]);
  const [restriccionInstalaciones, setRestriccionInstalaciones] = useState<RestriccionInstalacionesSolicitante>(
    () => (perfil === 'solicitante' ? { activo: true, listo: false } : { activo: false })
  );

  useEffect(() => {
    let cancelado = false;

    const CargarCentralesGenerales = (): void => {
      ObtenerCentralesDesdeSharePoint(context)
        .then((resultado) => {
          if (!cancelado) {
            setCentrales(resultado);
          }
        })
        .catch(() => {
          if (!cancelado) {
            setCentrales([]);
          }
        });
    };

    if (perfil !== 'solicitante') {
      setRestriccionInstalaciones({ activo: false });
      CargarCentralesGenerales();
      return () => {
        cancelado = true;
      };
    }

    setRestriccionInstalaciones({ activo: true, listo: false });
    setCentrales([]);

    const CargarInstalacionesSolicitante = async (): Promise<void> => {
      try {
        const idsInstalaciones = await ObtenerIdsInstalacionesUsuarioActual(context);
        if (cancelado) {
          return;
        }
        if (idsInstalaciones.length === 0) {
          setCentrales([]);
          setRestriccionInstalaciones({ activo: true, listo: true, ids: [] });
          return;
        }

        const todasCentrales = await ObtenerCentralesDesdeSharePoint(context);
        if (cancelado) {
          return;
        }

        const idsPermitidos = new Set(idsInstalaciones);
        setCentrales(todasCentrales.filter((central) => idsPermitidos.has(central.id)));
        setRestriccionInstalaciones({ activo: true, listo: true, ids: idsInstalaciones });
      } catch {
        if (!cancelado) {
          setCentrales([]);
          setRestriccionInstalaciones({ activo: true, listo: true, ids: [] });
        }
      }
    };

    CargarInstalacionesSolicitante().catch(() => undefined);

    return () => {
      cancelado = true;
    };
  }, [context, perfil]);

  useEffect(() => {
    if (!centralPendiente) {
      setEquiposFiltro([]);
      setEquiposPendientesIds([]);
      return undefined;
    }
    let cancelado = false;
    ObtenerEquiposPorCentralFalla(context, Number(centralPendiente))
      .then((equipos) => {
        if (!cancelado) {
          setEquiposFiltro(equipos);
        }
      })
      .catch(() => {
        if (!cancelado) {
          setEquiposFiltro([]);
        }
      });
    return () => {
      cancelado = true;
    };
  }, [centralPendiente, context]);

  const AlternarFiltros = (): void => setFiltrosVisibles((visible) => !visible);

  const ConstruirFiltrosFechaAplicados = (): FiltrosFechaSolicitudFalla | undefined => {
    const filtros: FiltrosFechaSolicitudFalla = {};
    if (fechaPerturbacionDesdePendiente.trim()) {
      filtros.fechaPerturbacionDesde = ConvertirEntradaLocalAIsoUtc(fechaPerturbacionDesdePendiente);
    }
    if (fechaPerturbacionHastaPendiente.trim()) {
      filtros.fechaPerturbacionHasta = ConvertirEntradaLocalAIsoUtc(fechaPerturbacionHastaPendiente);
    }
    if (fechaRetornoDesdePendiente.trim()) {
      filtros.fechaRetornoDesde = ConvertirEntradaLocalAIsoUtc(fechaRetornoDesdePendiente);
    }
    if (fechaRetornoHastaPendiente.trim()) {
      filtros.fechaRetornoHasta = ConvertirEntradaLocalAIsoUtc(fechaRetornoHastaPendiente);
    }
    return Object.keys(filtros).length > 0 ? filtros : undefined;
  };

  const AplicarFiltros = (): void => {
    setEstadoAplicado(estadoPendiente);
    setCentralIdAplicado(centralPendiente ? Number(centralPendiente) : undefined);
    setEquiposAplicadosIds(
      equiposPendientesIds.length > 0 ? equiposPendientesIds.map((id) => Number(id)) : undefined
    );
    setFiltrosFechaAplicados(ConstruirFiltrosFechaAplicados());
  };

  const OnCambioEstadoRadio = (estado: EstadoFiltroSolicitudFalla): void => {
    setEstadoPendiente(estado);
    setEstadoAplicado(estado);
    setCentralIdAplicado(centralPendiente ? Number(centralPendiente) : undefined);
    setEquiposAplicadosIds(
      equiposPendientesIds.length > 0 ? equiposPendientesIds.map((id) => Number(id)) : undefined
    );
    setFiltrosFechaAplicados(ConstruirFiltrosFechaAplicados());
  };

  const LimpiarFiltros = (): void => {
    setEstadoPendiente(EstadoFiltroInicial);
    setEstadoAplicado(EstadoFiltroInicial);
    setCentralPendiente('');
    setCentralIdAplicado(undefined);
    setEquiposPendientesIds([]);
    setEquiposAplicadosIds(undefined);
    setFechaPerturbacionDesdePendiente('');
    setFechaPerturbacionHastaPendiente('');
    setFechaRetornoDesdePendiente('');
    setFechaRetornoHastaPendiente('');
    setFiltrosFechaAplicados(undefined);
    setFiltrosVisibles(false);
  };

  const OnRecargarGrilla = (): void => setRecargarToken((valor) => valor + 1);

  const OnDescargarExcelVinculado = (): void => {
    if (exportandoExcel) {
      return;
    }
    setMensajeExportacionExcel(undefined);
    setExportandoExcel(true);
    CargarTodasSolicitudesFallaFiltradas(context, {
      estadoFiltro: estadoAplicado,
      centralIdFiltro: centralIdAplicado,
      equiposIdsFiltro: equiposAplicadosIds,
      filtrosFecha: filtrosFechaAplicados,
      restriccionInstalaciones,
      textoBusqueda
    })
      .then((filasExportar) => {
        const descargado = DescargarSolicitudesFallaComoExcel(filasExportar, rutaAccesoListaExcel);
        if (!descargado) {
          setMensajeExportacionExcel('No hay datos para exportar con los filtros aplicados.');
        }
      })
      .catch(() => {
        setMensajeExportacionExcel('No se pudo generar el archivo Excel.');
      })
      .then(() => {
        setExportandoExcel(false);
      })
      .catch(() => undefined);
  };

  const tituloVista = ObtenerTituloVistaSolicitudFallaPorPerfil(perfil);

  const BotonDescargarExcelVinculado = (
    <button
      type="button"
      className="btn btn-sm cowork-btn-exito"
      disabled={exportandoExcel}
      onClick={OnDescargarExcelVinculado}
    >
      <i className="bi bi-file-earmark-excel me-1" aria-hidden="true" />
      Descargar Excel Vinculado
    </button>
  );

  const opcionesEquiposFiltro = useMemo(
    () =>
      equiposFiltro.map((equipo) => ({
        id: String(equipo.id),
        etiqueta: equipo.nombre
      })),
    [equiposFiltro]
  );

  return (
    <ContenedorVistaCorConecta layoutCabeceraSobreTabs>
      <div className="cowork-vista__fila-cabecera">
        <header className="cowork-vista__encabezado cowork-vista__encabezado--solicitudes-il">
          <h2 className="cowork-vista__titulo-il">
            <i className="bi bi-lightning-charge cowork-vista__titulo-il-icono" aria-hidden="true" />
            <span>{tituloVista}</span>
          </h2>
          <p className="cowork-vista__subtitulo-il mb-0">{SubtitulosPorEstadoFiltroSolicitudFalla[estadoAplicado]}</p>
        </header>
        <LogosMarcaVista />
      </div>

      <ul className="nav nav-tabs cowork-vista__tabs" role="tablist">
        <li className="nav-item" role="presentation">
          <a className="nav-link" href={enlacesTabs.urlTabSolicitudes}>
            Solicitudes
          </a>
        </li>
        <li className="nav-item" role="presentation">
          <span className="nav-link active" aria-current="page">
            Solicitud de Falla
          </span>
        </li>
        <li className="nav-item" role="presentation">
          <a className="nav-link" href={enlacesTabs.urlTabGuiasManiobra}>
            Guías de Maniobra
          </a>
        </li>
        <li className="nav-item" role="presentation">
          <a className="nav-link" href={enlacesTabs.urlTabSolicitudesIl}>
            Solicitudes IL
          </a>
        </li>
      </ul>

      <BarraFiltrosDesplegableVista
        panelVisible={filtrosVisibles}
        onAlternarPanel={AlternarFiltros}
        onLimpiar={LimpiarFiltros}
        onFiltrar={AplicarFiltros}
      >
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label form-label-sm mb-1" htmlFor={`filtro-central-falla-${sufijoId}`}>
              Central
            </label>
            <select
              id={`filtro-central-falla-${sufijoId}`}
              className="form-select form-select-sm"
              value={centralPendiente}
              onChange={(evento) => {
                setCentralPendiente(evento.target.value);
                setEquiposPendientesIds([]);
              }}
            >
              <option value="">Todas</option>
              {centrales.map((central) => (
                <option key={central.id} value={central.id}>
                  {central.central}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label form-label-sm mb-1" htmlFor={`filtro-equipos-falla-${sufijoId}`}>
              Equipo
            </label>
            <SelectMultipleFiltroVista
              id={`filtro-equipos-falla-${sufijoId}`}
              opciones={opcionesEquiposFiltro}
              valoresSeleccionados={equiposPendientesIds}
              onCambio={setEquiposPendientesIds}
              deshabilitado={!centralPendiente}
              textoSinSeleccion={centralPendiente ? 'Todos los equipos' : 'Seleccione una central'}
              etiquetaAria="Filtrar por equipos afectados"
            />
          </div>
          <div className="col-md-4">
            <label className="form-label form-label-sm mb-1" htmlFor={`filtro-pert-desde-falla-${sufijoId}`}>
              Perturbación desde
            </label>
            <CampoFechaHora24
              id={`filtro-pert-desde-falla-${sufijoId}`}
              valor={fechaPerturbacionDesdePendiente}
              onCambio={setFechaPerturbacionDesdePendiente}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label form-label-sm mb-1" htmlFor={`filtro-pert-hasta-falla-${sufijoId}`}>
              Perturbación hasta
            </label>
            <CampoFechaHora24
              id={`filtro-pert-hasta-falla-${sufijoId}`}
              valor={fechaPerturbacionHastaPendiente}
              onCambio={setFechaPerturbacionHastaPendiente}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label form-label-sm mb-1" htmlFor={`filtro-ret-desde-falla-${sufijoId}`}>
              Retorno desde
            </label>
            <CampoFechaHora24
              id={`filtro-ret-desde-falla-${sufijoId}`}
              valor={fechaRetornoDesdePendiente}
              onCambio={setFechaRetornoDesdePendiente}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label form-label-sm mb-1" htmlFor={`filtro-ret-hasta-falla-${sufijoId}`}>
              Retorno hasta
            </label>
            <CampoFechaHora24
              id={`filtro-ret-hasta-falla-${sufijoId}`}
              valor={fechaRetornoHastaPendiente}
              onCambio={setFechaRetornoHastaPendiente}
            />
          </div>
        </div>
      </BarraFiltrosDesplegableVista>

      <div className="cowork-vista__barra-acciones d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div className="d-flex flex-wrap gap-2">
          {permitirCreacion ? (
            <>
              <button
                type="button"
                className="btn btn-sm cowork-btn-primary"
                onClick={() => setModalNuevaVisible(true)}
              >
                <i className="bi bi-plus-lg me-1" aria-hidden="true" />
                Nueva Solicitud de Falla
              </button>
              {BotonDescargarExcelVinculado}
            </>
          ) : (
            BotonDescargarExcelVinculado
          )}
        </div>

        <fieldset className="cowork-vista__radios-estado d-flex flex-wrap gap-3 mb-0 border-0 p-0">
          <legend className="visually-hidden">Estado de solicitudes de falla</legend>
          {EstadosFiltroSolicitudFallaRadio.map((estado) => {
            const idRadio = `filtro-estado-falla-${sufijoId}-${estado.toLowerCase()}`;
            return (
              <div key={estado} className="form-check form-check-inline mb-0">
                <input
                  className="form-check-input"
                  type="radio"
                  name={`filtro-estado-falla-${sufijoId}`}
                  id={idRadio}
                  checked={estadoPendiente === estado}
                  onChange={() => OnCambioEstadoRadio(estado)}
                />
                <label className="form-check-label" htmlFor={idRadio}>
                  {estado === 'Todas' ? 'Todas' : estado === 'Vigente' ? 'Vigentes' : 'Finalizadas'}
                </label>
              </div>
            );
          })}
        </fieldset>
      </div>

      {mensajeExportacionExcel ? (
        <p className="text-warning small mb-2" role="status">
          {mensajeExportacionExcel}
        </p>
      ) : null}

      <GrillaSolicitudFalla
        context={context}
        estadoFiltro={estadoAplicado}
        centralIdFiltro={centralIdAplicado}
        equiposIdsFiltro={equiposAplicadosIds}
        filtrosFecha={filtrosFechaAplicados}
        restriccionInstalaciones={restriccionInstalaciones}
        textoBusqueda={textoBusqueda}
        onCambioBusqueda={setTextoBusqueda}
        recargarToken={recargarToken}
        modoAcciones={modoAccionesGrilla}
        onVer={setFilaVer}
        onEditar={permitirCreacion ? setFilaEditar : undefined}
        onGestionar={permitirCreacion ? setFilaGestionar : undefined}
        onIntegrarSiod={permitirCreacion ? setFilaIntegrarSiod : undefined}
        onBitacora={(fila) => setBitacoraMeta({ id: fila.id, idCen: fila.idCen })}
      />

      <ModalVerSolicitudFalla
        context={context}
        fila={filaVer}
        visible={filaVer !== undefined}
        onCerrar={() => setFilaVer(undefined)}
      />

      <ModalBitacoraSolicitudFalla
        context={context}
        idSolicitudFalla={bitacoraMeta?.id}
        idCen={bitacoraMeta?.idCen}
        visible={bitacoraMeta !== undefined}
        onCerrar={() => setBitacoraMeta(undefined)}
      />

      {permitirCreacion ? (
        <>
          <ModalNuevaSolicitudFalla
            context={context}
            visible={modalNuevaVisible}
            centrales={centrales}
            onCerrar={() => setModalNuevaVisible(false)}
            onCreado={OnRecargarGrilla}
          />

          <ModalEditarSolicitudFalla
            context={context}
            fila={filaEditar}
            visible={filaEditar !== undefined}
            centrales={centrales}
            onCerrar={() => setFilaEditar(undefined)}
            onGuardado={OnRecargarGrilla}
          />

          <ModalGestionarSolicitudFalla
            context={context}
            fila={filaGestionar}
            visible={filaGestionar !== undefined}
            onCerrar={() => setFilaGestionar(undefined)}
            onGuardado={OnRecargarGrilla}
          />

          <ModalIntegrarSiodSolicitudFalla
            context={context}
            fila={filaIntegrarSiod}
            visible={filaIntegrarSiod !== undefined}
            propiedadesSolicitudFalla={propiedadesSolicitudFalla}
            onCerrar={() => setFilaIntegrarSiod(undefined)}
            onIntegrado={OnRecargarGrilla}
          />
        </>
      ) : null}
    </ContenedorVistaCorConecta>
  );
}