import {
  RutaHashAnclaSolicitudesAdministrador,
  RutasHashGrupoTabsSolicitudesAdministrador
} from '../components/vistas/cor-conecta/concentrador/administrador/rutas';
import {
  RutaHashAnclaSolicitudesDespachador,
  RutasHashGrupoTabsSolicitudesDespachador
} from '../components/vistas/cor-conecta/concentrador/despachador/rutas';
import {
  RutaHashAnclaSolicitudesSolicitante,
  RutasHashGrupoTabsSolicitudesSolicitante
} from '../components/vistas/cor-conecta/concentrador/solicitante/rutas';
import {
  RutaHashAnclaOperadorRenovable,
  RutasHashGrupoTabsOperadorRenovable
} from '../components/vistas/cor-conecta/concentrador/operador-renovable/rutas';

type AnclaMenuGrupoTabs = {
  rutaEnlaceMenu: string;
  rutasRelacionadas: readonly string[];
};

/**
 * Rutas de tab u otras pantallas del mismo grupo que deben resaltar el ítem de menú ancla
 * (aunque el hash del menú no coincida exactamente).
 */
const anclasMenuGrupoTabs: readonly AnclaMenuGrupoTabs[] = [
  {
    rutaEnlaceMenu: RutaHashAnclaSolicitudesAdministrador,
    rutasRelacionadas: RutasHashGrupoTabsSolicitudesAdministrador
  },
  {
    rutaEnlaceMenu: RutaHashAnclaSolicitudesSolicitante,
    rutasRelacionadas: RutasHashGrupoTabsSolicitudesSolicitante
  },
  {
    rutaEnlaceMenu: RutaHashAnclaSolicitudesDespachador,
    rutasRelacionadas: RutasHashGrupoTabsSolicitudesDespachador
  },
  {
    rutaEnlaceMenu: RutaHashAnclaOperadorRenovable,
    rutasRelacionadas: RutasHashGrupoTabsOperadorRenovable
  }
];

export function EsRutaRelacionadaConAnclaMenu(rutaEnlaceMenu: string, rutaActual: string): boolean {
  const ancla = anclasMenuGrupoTabs.find((grupo) => grupo.rutaEnlaceMenu === rutaEnlaceMenu);
  if (!ancla) {
    return false;
  }
  return ancla.rutasRelacionadas.some((ruta) => ruta === rutaActual);
}
