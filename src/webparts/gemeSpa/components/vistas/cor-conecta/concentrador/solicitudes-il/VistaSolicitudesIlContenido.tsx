import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { PropsVistaSpa } from '../../../../../constants/registro-vistas/TiposRegistroVistas';
import type { CentralMantenedor, SolicitudIl } from '../../../../../models/SolicitudIl';
import { ObtenerCentralesDesdeSharePoint } from '../../../../../services/sharepoint/solicitudesIl/CentralesServicio';
import { ObtenerIdsInstalacionesUsuarioActual } from '../../../../../services/sharepoint/solicitudesIl/UsuarioInstalacionesSolicitanteServicio';
import type { RestriccionInstalacionesSolicitante } from './UseSolicitudesIlLista';
import {
  EstadosSolicitudIlRadio,
  SubtitulosPorEstadoSolicitudIl,
  type EstadoSolicitudIl
} from './constantesSolicitudesIl';
import { ObtenerUrlExcelVinculadoSolicitudesIlDesdeProps } from '../../../../../models/ConfiguracionSolicitudesIl';
import BarraFiltrosDesplegableVista from '../../../BarraFiltrosDesplegableVista';
import ContenedorVistaCorConecta from '../../ContenedorVistaCorConecta';
import LogosMarcaVista from '../../LogosMarcaVista';
import GrillaSolicitudesIl from './GrillaSolicitudesIl';
import ModalNuevaSolicitudIl from './ModalNuevaSolicitudIl';
import ModalVerSolicitudIl from './ModalVerSolicitudIl';
import ModalBitacoraSolicitudIl from './ModalBitacoraSolicitudIl';
import ModalGestionarSolicitudIl from './ModalGestionarSolicitudIl';
import {
  ObtenerEnlacesTabsSolicitudesIl,
  ObtenerModoAccionesGrillaPorPerfil,
  ObtenerTituloVistaSolicitudesIlPorPerfil,
  PermitirCreacionSolicitudesIlPorPerfil,
  type PerfilVistaSolicitudesIlConcentrador
} from './PerfilVistaSolicitudesIl';

const EstadoFiltroInicial: EstadoSolicitudIl = 'Vigente';

const EtiquetasRadioEstado: Record<EstadoSolicitudIl, string> = {
  Vigente: 'Vigente',
  Finalizada: 'Finalizada',
  Anulada: 'Anuladas'
};

export type VistaSolicitudesIlContenidoProps = PropsVistaSpa & {
  perfil: PerfilVistaSolicitudesIlConcentrador;
};

export default function VistaSolicitudesIlContenido(props: VistaSolicitudesIlContenidoProps): React.ReactElement {
  const { context, propiedadesSolicitudesIl, perfil } = props;
  const prefijoRutaServidorSitio = context.pageContext.site.serverRelativeUrl;
  const enlacesTabs = useMemo(
    () => ObtenerEnlacesTabsSolicitudesIl(perfil, prefijoRutaServidorSitio),
    [perfil, prefijoRutaServidorSitio]
  );
  const modoAccionesGrilla = ObtenerModoAccionesGrillaPorPerfil(perfil);
  const permitirCreacion = PermitirCreacionSolicitudesIlPorPerfil(perfil);
  const urlExcelVinculado = ObtenerUrlExcelVinculadoSolicitudesIlDesdeProps(propiedadesSolicitudesIl);
  const sufijoId = perfil;

  const [estadoPendiente, setEstadoPendiente] = useState<EstadoSolicitudIl>(EstadoFiltroInicial);
  const [estadoAplicado, setEstadoAplicado] = useState<EstadoSolicitudIl>(EstadoFiltroInicial);
  const [textoBusqueda, setTextoBusqueda] = useState('');
  const [filtrosVisibles, setFiltrosVisibles] = useState(false);
  const [centralPendiente, setCentralPendiente] = useState('');
  const [centralIdAplicado, setCentralIdAplicado] = useState<number | undefined>();
  const [modalNuevaVisible, setModalNuevaVisible] = useState(false);
  const [solicitudVer, setSolicitudVer] = useState<SolicitudIl | undefined>(undefined);
  const [idSolicitudBitacora, setIdSolicitudBitacora] = useState<number | undefined>(undefined);
  const [solicitudGestionar, setSolicitudGestionar] = useState<SolicitudIl | undefined>(undefined);
  const [solicitudOrigenClon, setSolicitudOrigenClon] = useState<SolicitudIl | undefined>(undefined);
  const [recargarToken, setRecargarToken] = useState(0);
  const [centrales, setCentrales] = useState<CentralMantenedor[]>([]);
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

  const AlternarFiltros = (): void => {
    setFiltrosVisibles((visible) => !visible);
  };

  const AplicarFiltros = (): void => {
    setEstadoAplicado(estadoPendiente);
    setCentralIdAplicado(centralPendiente ? Number(centralPendiente) : undefined);
  };

  const OnCambioEstadoRadio = (estado: EstadoSolicitudIl): void => {
    setEstadoPendiente(estado);
    setEstadoAplicado(estado);
    setCentralIdAplicado(centralPendiente ? Number(centralPendiente) : undefined);
  };

  const LimpiarFiltros = (): void => {
    setEstadoPendiente(EstadoFiltroInicial);
    setEstadoAplicado(EstadoFiltroInicial);
    setCentralPendiente('');
    setCentralIdAplicado(undefined);
    setFiltrosVisibles(false);
  };

  const OnCreadoNuevaSolicitud = (): void => {
    setRecargarToken((valor) => valor + 1);
  };

  const tituloVista = ObtenerTituloVistaSolicitudesIlPorPerfil(perfil);

  return (
    <ContenedorVistaCorConecta layoutCabeceraSobreTabs>
      <div className="cowork-vista__fila-cabecera">
        <header className="cowork-vista__encabezado cowork-vista__encabezado--solicitudes-il">
          <h2 className="cowork-vista__titulo-il">
            <i className="bi bi-inbox cowork-vista__titulo-il-icono" aria-hidden="true" />
            <span>{tituloVista}</span>
          </h2>
          <p className="cowork-vista__subtitulo-il mb-0">{SubtitulosPorEstadoSolicitudIl[estadoAplicado]}</p>
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
          <a className="nav-link" href={enlacesTabs.urlTabGuiasManiobra}>
            Guías de Maniobra
          </a>
        </li>
        <li className="nav-item" role="presentation">
          <span className="nav-link active" aria-current="page">
            Solicitudes IL
          </span>
        </li>
      </ul>

      <BarraFiltrosDesplegableVista
        panelVisible={filtrosVisibles}
        onAlternarPanel={AlternarFiltros}
        onLimpiar={LimpiarFiltros}
        onFiltrar={AplicarFiltros}
      >
        <div>
          <label className="form-label form-label-sm mb-1" htmlFor={`filtro-central-solicitudes-il-${sufijoId}`}>
            Central
          </label>
          <select
            id={`filtro-central-solicitudes-il-${sufijoId}`}
            className="form-select form-select-sm"
            value={centralPendiente}
            onChange={(evento) => setCentralPendiente(evento.target.value)}
          >
            <option value="">Todas</option>
            {centrales.map((central) => (
              <option key={central.id} value={central.id}>
                {central.central}
              </option>
            ))}
          </select>
        </div>
      </BarraFiltrosDesplegableVista>

      <div className="cowork-vista__barra-acciones d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div className="d-flex flex-wrap gap-2">
          {permitirCreacion ? (
            <>
              <button
                type="button"
                className="btn btn-sm cowork-btn-primary"
                onClick={() => {
                  setSolicitudOrigenClon(undefined);
                  setModalNuevaVisible(true);
                }}
              >
                <i className="bi bi-plus-lg me-1" aria-hidden="true" />
                Nueva solicitud IL
              </button>
              {urlExcelVinculado ? (
                <a
                  className="btn btn-sm cowork-btn-exito"
                  href={urlExcelVinculado}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bi bi-file-earmark-excel me-1" aria-hidden="true" />
                  Excel vinculado
                </a>
              ) : null}
            </>
          ) : null}
        </div>

        <fieldset
          className="cowork-vista__radios-estado d-flex flex-wrap gap-3 mb-0 border-0 p-0"
        >
          <legend className="visually-hidden">Estado de solicitudes</legend>
          {EstadosSolicitudIlRadio.map((estado) => {
            const idRadio = `filtro-estado-solicitudes-il-${sufijoId}-${estado.toLowerCase()}`;
            return (
              <div key={estado} className="form-check form-check-inline mb-0">
                <input
                  className="form-check-input"
                  type="radio"
                  name={`filtro-estado-solicitudes-il-${sufijoId}`}
                  id={idRadio}
                  checked={estadoPendiente === estado}
                  onChange={() => OnCambioEstadoRadio(estado)}
                />
                <label className="form-check-label" htmlFor={idRadio}>
                  {EtiquetasRadioEstado[estado]}
                </label>
              </div>
            );
          })}
        </fieldset>
      </div>

      <GrillaSolicitudesIl
        context={context}
        estadoFiltro={estadoAplicado}
        centralIdFiltro={centralIdAplicado}
        restriccionInstalaciones={restriccionInstalaciones}
        textoBusqueda={textoBusqueda}
        onCambioBusqueda={setTextoBusqueda}
        recargarToken={recargarToken}
        modoAcciones={modoAccionesGrilla}
        onVerSolicitud={setSolicitudVer}
        onClonarSolicitud={
          permitirCreacion
            ? (solicitud) => {
                setSolicitudOrigenClon(solicitud);
                setModalNuevaVisible(true);
              }
            : undefined
        }
        onBitacoraSolicitud={(solicitud) => setIdSolicitudBitacora(solicitud.id)}
        onGestionarSolicitud={permitirCreacion ? setSolicitudGestionar : undefined}
      />

      <ModalVerSolicitudIl
        context={context}
        solicitud={solicitudVer}
        visible={solicitudVer !== undefined}
        onCerrar={() => setSolicitudVer(undefined)}
      />

      <ModalBitacoraSolicitudIl
        context={context}
        idSolicitudIl={idSolicitudBitacora}
        visible={idSolicitudBitacora !== undefined}
        onCerrar={() => setIdSolicitudBitacora(undefined)}
      />

      {permitirCreacion ? (
        <>
          <ModalNuevaSolicitudIl
            context={context}
            visible={modalNuevaVisible}
            centrales={centrales}
            propiedadesSolicitudesIl={propiedadesSolicitudesIl}
            solicitudOrigenClon={solicitudOrigenClon}
            onCerrar={() => {
              setModalNuevaVisible(false);
              setSolicitudOrigenClon(undefined);
            }}
            onCreado={OnCreadoNuevaSolicitud}
          />

          <ModalGestionarSolicitudIl
            context={context}
            solicitud={solicitudGestionar}
            visible={solicitudGestionar !== undefined}
            centrales={centrales}
            propiedadesSolicitudesIl={propiedadesSolicitudesIl}
            onCerrar={() => setSolicitudGestionar(undefined)}
            onGuardado={OnCreadoNuevaSolicitud}
          />
        </>
      ) : null}
    </ContenedorVistaCorConecta>
  );
}
