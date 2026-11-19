import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { GridColDef, GridRowId } from '@mui/x-data-grid';
import { GrillaServidorMui, TamanoPaginaTodos, type OpcionTamanoPaginaGrilla } from '../../../../grilla';
import { CeldaAccionesCentrada, ObtenerOpcionesBaseColumnaAccionesGrilla } from '../../../../grilla/ColumnaAccionesGrilla';
import type { SolicitudFalla, EstadoFiltroSolicitudFalla } from '../../../../../models/SolicitudFalla';
import { FormatearFechaHoraVisible } from '../../../../../utils/FechaHoraCorConecta';
import DesplegableAccionesFilaSolicitudFalla from './DesplegableAccionesFilaSolicitudFalla';
import type { ModoAccionesFilaSolicitudFalla } from './PerfilVistaSolicitudFalla';
import { BloqueEstadoSolicitudFalla } from './PresentacionEstadoSolicitudFalla';
import {
  UseSolicitudFallaLista,
  type FiltrosFechaSolicitudFalla
} from './UseSolicitudFallaLista';
import type { RestriccionInstalacionesSolicitante } from '../solicitudes-il/UseSolicitudesIlLista';

type FilaGrilla = SolicitudFalla & { id: GridRowId };

const OpcionesTamanoPagina: readonly OpcionTamanoPaginaGrilla[] = [
  10,
  25,
  50,
  100,
  { value: TamanoPaginaTodos, label: 'Mostrar todo' }
];

export type GrillaSolicitudFallaProps = {
  context: WebPartContext;
  estadoFiltro: EstadoFiltroSolicitudFalla;
  centralIdFiltro?: number;
  equiposIdsFiltro?: readonly number[];
  filtrosFecha?: FiltrosFechaSolicitudFalla;
  restriccionInstalaciones?: RestriccionInstalacionesSolicitante;
  textoBusqueda: string;
  onCambioBusqueda: (texto: string) => void;
  recargarToken: number;
  modoAcciones?: ModoAccionesFilaSolicitudFalla;
  onVer: (fila: SolicitudFalla) => void;
  onEditar?: (fila: SolicitudFalla) => void;
  onGestionar?: (fila: SolicitudFalla) => void;
  onIntegrarSiod?: (fila: SolicitudFalla) => void;
  onBitacora?: (fila: SolicitudFalla) => void;
};

export default function GrillaSolicitudFalla(props: GrillaSolicitudFallaProps): React.ReactElement {
  const {
    context,
    estadoFiltro,
    centralIdFiltro,
    equiposIdsFiltro,
    filtrosFecha,
    restriccionInstalaciones,
    textoBusqueda,
    onCambioBusqueda,
    recargarToken,
    modoAcciones,
    onVer,
    onEditar,
    onGestionar,
    onIntegrarSiod,
    onBitacora
  } = props;

  const [paginaActual, setPaginaActual] = useState(0);
  const [tamanoPagina, setTamanoPagina] = useState(10);
  const [campoOrden, setCampoOrden] = useState('id');
  const [direccionOrden, setDireccionOrden] = useState<'asc' | 'desc'>('desc');

  const { filas, hayPaginaSiguiente, estadoCarga, mensajeError, recargar } = UseSolicitudFallaLista({
    context,
    estadoFiltro,
    centralIdFiltro,
    equiposIdsFiltro,
    filtrosFecha,
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
  }, [
    estadoFiltro,
    centralIdFiltro,
    equiposIdsFiltro,
    filtrosFecha,
    restriccionInstalaciones,
    textoBusqueda,
    recargarToken
  ]);

  const columnas: GridColDef<FilaGrilla>[] = useMemo(
    () => [
      {
        ...ObtenerOpcionesBaseColumnaAccionesGrilla(96),
        renderCell: (params) => (
          <CeldaAccionesCentrada alinearVerticalInicio>
            <DesplegableAccionesFilaSolicitudFalla
              fila={params.row}
              modoAcciones={modoAcciones}
              onVer={(fila) => onVer(fila)}
              onEditar={onEditar}
              onGestionar={onGestionar}
              onIntegrarSiod={onIntegrarSiod}
              onBitacora={onBitacora}
            />
          </CeldaAccionesCentrada>
        )
      },
      { field: 'idCen', headerName: 'ID Solicitud', minWidth: 120, flex: 0.8 },
      {
        field: 'centralEtiqueta',
        headerName: 'Central GM',
        minWidth: 140,
        flex: 1,
        cellClassName: 'cowork-celda-texto-largo'
      },
      {
        field: 'fechaPerturbacion',
        headerName: 'Fecha Hora Perturbación',
        minWidth: 150,
        flex: 0.9,
        renderCell: (params) => FormatearFechaHoraVisible(params.row.fechaPerturbacion) || '—'
      },
      {
        field: 'fechaRetorno',
        headerName: 'Fecha Hora Efectiva Retorno',
        minWidth: 150,
        flex: 0.9,
        renderCell: (params) => FormatearFechaHoraVisible(params.row.fechaRetorno) || '—'
      },
      {
        field: 'equiposEtiqueta',
        headerName: 'Equipo Afectado',
        minWidth: 140,
        flex: 1,
        cellClassName: 'cowork-celda-texto-largo'
      },
      {
        field: 'descripcion',
        headerName: 'Descripción',
        minWidth: 180,
        flex: 1.2,
        cellClassName: 'cowork-celda-texto-largo'
      },
      {
        field: 'estado',
        headerName: 'Estado',
        minWidth: 110,
        flex: 0.6,
        renderCell: (params) => <BloqueEstadoSolicitudFalla estado={String(params.value ?? '')} />
      }
    ],
    [modoAcciones, onBitacora, onEditar, onGestionar, onIntegrarSiod, onVer]
  );

  return (
    <GrillaServidorMui<FilaGrilla>
      filas={filas as FilaGrilla[]}
      columnas={columnas}
      estadoCarga={estadoCarga}
      cargando={estadoCarga === 'cargando'}
      mensajeError={mensajeError}
      onReintentar={recargar}
      paginaActual={paginaActual}
      tamanoPagina={tamanoPagina}
      hayPaginaSiguiente={hayPaginaSiguiente}
      opcionesTamanoPagina={OpcionesTamanoPagina}
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
      mensajeSinRegistros="No hay solicitudes de falla para los filtros aplicados."
      alturaAutomatica
      claseContenedor="cowork-vista-tabla-mui--celdas-superior"
      columnasAutoajustables={['idCen', 'fechaPerturbacion', 'fechaRetorno', 'estado']}
    />
  );
}