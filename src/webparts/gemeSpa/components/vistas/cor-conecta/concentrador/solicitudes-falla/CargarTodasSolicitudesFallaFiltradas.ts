import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type { EstadoFiltroSolicitudFalla } from '../../../../../models/SolicitudFalla';
import { ObtenerPaginaSolicitudFallaRenderListData } from '../../../../../services/sharepoint/solicitudesFalla/RenderListDataSolicitudFallaServicio';
import type { SolicitudFallaNormalizada } from '../../../../../services/sharepoint/solicitudesFalla/NormalizarFilaSolicitudFallaDesdeRender';
import {
  CampoDescripcionSolicitudFalla,
  CampoEstadoSolicitudFalla,
  CampoFechaPerturbacionSolicitudFalla,
  CampoFechaRetornoSolicitudFalla,
  CampoIdCenSolicitudFalla,
  CampoLookupInstalacionGmSolicitudFalla
} from '../../../../../services/sharepoint/solicitudesFalla/CamposListaSolicitudFalla';
import { EnriquecerFilasIntegracionSiodDesdeBitacora } from '../../../../../services/sharepoint/solicitudesFalla/IntegracionSiodDesdeBitacoraSolicitudFalla';
import type { RestriccionInstalacionesSolicitante } from '../solicitudes-il/UseSolicitudesIlLista';
import { TamanoLoteCargaCompletaSolicitudFalla } from './constantesSolicitudFalla';
import type { FiltrosFechaSolicitudFalla } from './UseSolicitudFallaLista';

const MapaCampoOrdenGrilla: Record<string, string> = {
  id: 'ID',
  idCen: CampoIdCenSolicitudFalla,
  centralEtiqueta: CampoLookupInstalacionGmSolicitudFalla,
  fechaPerturbacion: CampoFechaPerturbacionSolicitudFalla,
  fechaRetorno: CampoFechaRetornoSolicitudFalla,
  descripcion: CampoDescripcionSolicitudFalla,
  estado: CampoEstadoSolicitudFalla
};

export type ParametrosCargaTodasSolicitudesFalla = {
  estadoFiltro: EstadoFiltroSolicitudFalla;
  centralIdFiltro?: number;
  equiposIdsFiltro?: readonly number[];
  filtrosFecha?: FiltrosFechaSolicitudFalla;
  restriccionInstalaciones?: RestriccionInstalacionesSolicitante;
  textoBusqueda: string;
  campoOrden?: string;
  direccionOrden?: 'asc' | 'desc';
};

export async function CargarTodasSolicitudesFallaFiltradas(
  context: WebPartContext,
  params: ParametrosCargaTodasSolicitudesFalla
): Promise<SolicitudFallaNormalizada[]> {
  const {
    estadoFiltro,
    centralIdFiltro,
    equiposIdsFiltro,
    filtrosFecha,
    restriccionInstalaciones = { activo: false },
    textoBusqueda,
    campoOrden = 'id',
    direccionOrden = 'desc'
  } = params;

  if (restriccionInstalaciones.activo && !restriccionInstalaciones.listo) {
    return [];
  }
  if (
    restriccionInstalaciones.activo &&
    restriccionInstalaciones.listo &&
    restriccionInstalaciones.ids.length === 0
  ) {
    return [];
  }

  const instalacionesPermitidas =
    restriccionInstalaciones.activo && restriccionInstalaciones.listo
      ? restriccionInstalaciones.ids
      : undefined;

  const parametrosBase = {
    estadoFiltro,
    centralId: centralIdFiltro,
    equiposIdsFiltro,
    instalacionesPermitidasIds: instalacionesPermitidas,
    fechaPerturbacionDesdeIso: filtrosFecha?.fechaPerturbacionDesde,
    fechaPerturbacionHastaIso: filtrosFecha?.fechaPerturbacionHasta,
    fechaRetornoDesdeIso: filtrosFecha?.fechaRetornoDesde,
    fechaRetornoHastaIso: filtrosFecha?.fechaRetornoHasta,
    tamanoPagina: TamanoLoteCargaCompletaSolicitudFalla,
    campoOrden: MapaCampoOrdenGrilla[campoOrden] ?? 'ID',
    direccionOrden
  };

  const acumulado: SolicitudFallaNormalizada[] = [];
  let paging: string | undefined;
  do {
    const pagina = await ObtenerPaginaSolicitudFallaRenderListData(context, parametrosBase, paging, textoBusqueda);
    acumulado.push(...pagina.filas);
    paging = pagina.pagingSiguiente;
  } while (paging);

  return EnriquecerFilasIntegracionSiodDesdeBitacora(context, acumulado);
}