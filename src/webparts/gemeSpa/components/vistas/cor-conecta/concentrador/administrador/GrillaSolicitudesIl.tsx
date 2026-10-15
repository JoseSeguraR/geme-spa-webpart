import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { GridColDef, GridRowId } from '@mui/x-data-grid';
import { GrillaServidorMui } from '../../../../grilla';
import { CeldaAccionesCentrada, ObtenerOpcionesBaseColumnaAccionesGrilla } from '../../../../grilla/ColumnaAccionesGrilla';
import type { SolicitudIl } from '../../../../../models/SolicitudIl';
import type { EstadoSolicitudIl } from './constantesSolicitudesIl';
import {
  ClaseInsigniaEstadoSolicitudIl,
  ResolverEstadoSolicitudIl
} from './PresentacionEstadoSolicitudIl';
import DesplegableAccionesFila, {
  type ModoAccionesFilaSolicitudesIl
} from '../DesplegableAccionesFila';
import { FormatearFechaHoraVisible } from './UtilidadesFechaSolicitudIl';
import { UseSolicitudesIlLista, type RestriccionInstalacionesSolicitante } from './UseSolicitudesIlLista';

export type GrillaSolicitudesIlProps = {
  context: WebPartContext;
  estadoFiltro: EstadoSolicitudIl;
  centralIdFiltro?: number;
  restriccionInstalaciones?: RestriccionInstalacionesSolicitante;
  textoBusqueda: string;
  onCambioBusqueda: (texto: string) => void;
  recargarToken: number;
  modoAcciones?: ModoAccionesFilaSolicitudesIl;
  onVerSolicitud: (solicitud: SolicitudIl) => void;
  onClonarSolicitud?: (solicitud: SolicitudIl) => void;
  onBitacoraSolicitud: (solicitud: SolicitudIl) => void;
  onGestionarSolicitud?: (solicitud: SolicitudIl) => void;
};

type FilaGrilla = SolicitudIl & { id: GridRowId };

export default function GrillaSolicitudesIl(props: GrillaSolicitudesIlProps): React.ReactElement {
  const {
    context,
    estadoFiltro,
    centralIdFiltro,
    restriccionInstalaciones,
    textoBusqueda,
    onCambioBusqueda,
    recargarToken,
    modoAcciones = 'completo',
    onVerSolicitud,
    onClonarSolicitud,
    onBitacoraSolicitud,
    onGestionarSolicitud
  } = props;

  const [paginaActual, setPaginaActual] = useState(0);
  const [tamanoPagina, setTamanoPagina] = useState(10);
  const [campoOrden, setCampoOrden] = useState('id');
  const [direccionOrden, setDireccionOrden] = useState<'asc' | 'desc'>('desc');

  const { filas, hayPaginaSiguiente, estadoCarga, mensajeError, recargar } = UseSolicitudesIlLista({
    context,
    estadoFiltro,
    centralIdFiltro,
    restriccionInstalaciones,
    textoBusqueda,
    paginaActual,
    tamanoPagina,
    campoOrden,
    direccionOrden,
    recargarToken
  });

  useEffect(() => {
    setPaginaActual(0);
  }, [estadoFiltro, centralIdFiltro, restriccionInstalaciones, textoBusqueda, recargarToken]);

  const mapaFilasPorId = useMemo(() => {
    const mapa = new Map<number, SolicitudIl>();
    for (const fila of filas) {
      mapa.set(fila.id, fila);
    }
    return mapa;
  }, [filas]);

  const columnas: GridColDef<FilaGrilla>[] = useMemo(
    () => [
      {
        ...ObtenerOpcionesBaseColumnaAccionesGrilla(96),
        renderCell: (params) => (
          <CeldaAccionesCentrada>
            <DesplegableAccionesFila
              idRegistro={Number(params.row.id)}
              modoAcciones={modoAcciones}
              onVer={(id) => {
                const solicitud = mapaFilasPorId.get(id);
                if (solicitud) {
                  onVerSolicitud(solicitud);
                }
              }}
              onClonar={
                onClonarSolicitud
                  ? (id) => {
                      const solicitud = mapaFilasPorId.get(id);
                      if (solicitud) {
                        onClonarSolicitud(solicitud);
                      }
                    }
                  : undefined
              }
              onBitacora={(id) => {
                const solicitud = mapaFilasPorId.get(id);
                if (solicitud) {
                  onBitacoraSolicitud(solicitud);
                }
              }}
              onGestionar={
                onGestionarSolicitud
                  ? (id) => {
                      const solicitud = mapaFilasPorId.get(id);
                      if (solicitud) {
                        onGestionarSolicitud(solicitud);
                      }
                    }
                  : undefined
              }
            />
          </CeldaAccionesCentrada>
        )
      },
      { field: 'id', headerName: 'ID', width: 72 },
      { field: 'idCen', headerName: 'ID CEN', minWidth: 110, flex: 0.8 },
      { field: 'centralEtiqueta', headerName: 'Central', minWidth: 140, flex: 1 },
      { field: 'descripcion', headerName: 'Descripción', minWidth: 180, flex: 1.2 },
      {
        field: 'fechaInicio',
        headerName: 'Fecha inicio',
        minWidth: 150,
        flex: 1,
        renderCell: (params) => FormatearFechaHoraVisible(params.row.fechaInicio)
      },
      {
        field: 'fechaFin',
        headerName: 'Fecha fin',
        minWidth: 150,
        flex: 1,
        renderCell: (params) => FormatearFechaHoraVisible(params.row.fechaFin)
      },
      {
        field: 'estado',
        headerName: 'Estado',
        minWidth: 120,
        flex: 0.7,
        renderCell: (params) => (
          <span className={ClaseInsigniaEstadoSolicitudIl(ResolverEstadoSolicitudIl(String(params.value)))}>
            {params.value}
          </span>
        )
      }
    ],
    [mapaFilasPorId, modoAcciones, onVerSolicitud, onClonarSolicitud, onBitacoraSolicitud, onGestionarSolicitud]
  );

  const filasGrilla: FilaGrilla[] = filas as FilaGrilla[];

  return (
    <GrillaServidorMui
      filas={filasGrilla}
      columnas={columnas}
      estadoCarga={estadoCarga}
      cargando={estadoCarga === 'cargando'}
      mensajeError={mensajeError}
      onReintentar={recargar}
      paginaActual={paginaActual}
      tamanoPagina={tamanoPagina}
      hayPaginaSiguiente={hayPaginaSiguiente}
      onCambioPagina={setPaginaActual}
      onCambioTamanoPagina={(tamano) => {
        setTamanoPagina(tamano);
        setPaginaActual(0);
      }}
      campoOrden={campoOrden}
      direccionOrden={direccionOrden}
      onCambioOrdenamiento={(campo, direccion) => {
        setCampoOrden(campo);
        setDireccionOrden(direccion);
        setPaginaActual(0);
      }}
      busqueda={{
        etiqueta: 'Buscar',
        valorEnConsulta: textoBusqueda,
        onCambioConsulta: onCambioBusqueda
      }}
      textoBusquedaActiva={textoBusqueda}
      mensajeSinRegistros="No hay solicitudes IL para mostrar."
      mensajeSinRegistrosBusqueda="No hay solicitudes que coincidan con la búsqueda."
    />
  );
}
