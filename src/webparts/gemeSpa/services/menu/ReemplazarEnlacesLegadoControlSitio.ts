import type { NodoMenu, NodoMenuEnlaceInterno } from '../../models/NodoMenu';
import { EsNodoMenuEnlaceExterno, EsNodoMenuEnlaceInterno, EsNodoMenuGrupo } from '../../models/NodoMenu';
import {
  HashKeyGrupoMantenedores,
  HashKeyPermisosUsuarios,
  PantallasMantenedores,
  PrefijoRutaControlSitio
} from '../../components/vistas/cor-conecta/control-sitio/rutas';

/** Páginas antiguas del Concentrador (`CONC/Administracion/...`) que el web part ya implementa. */
const PaginaPermisosLegado = 'conc/administracion/admuserfn.aspx';
const PaginaMantenedoresLegado = 'conc/administracion/mantenedores.aspx';

function DestinoNormalizado(nodo: NodoMenu): string {
  const destino = EsNodoMenuEnlaceExterno(nodo) ? nodo.url : EsNodoMenuEnlaceInterno(nodo) ? nodo.rutaHash : '';
  let texto = destino;
  try {
    texto = decodeURIComponent(destino);
  } catch {
    // URL mal codificada: se compara tal cual
  }
  return texto.trim().toLowerCase();
}

function EnlacePermisos(nodo: NodoMenu): NodoMenuEnlaceInterno {
  return {
    tipo: 'enlace',
    id: nodo.id,
    etiqueta: nodo.etiqueta,
    icono: nodo.icono ?? 'people',
    rutaHash: `${PrefijoRutaControlSitio}/${HashKeyPermisosUsuarios}`
  };
}

/** El enlace único a `mantenedores.aspx` pasa a ser un grupo con una opción por mantenedor. */
function GrupoMantenedores(nodo: NodoMenu): NodoMenu {
  const prefijo = `${PrefijoRutaControlSitio}/${HashKeyGrupoMantenedores}`;
  return {
    tipo: 'grupo',
    id: nodo.id,
    etiqueta: nodo.etiqueta,
    icono: nodo.icono ?? 'tools',
    prefijoRutaHash: prefijo,
    hijos: PantallasMantenedores.map(
      (pantalla): NodoMenuEnlaceInterno => ({
        tipo: 'enlace',
        id: `${nodo.id}-${pantalla.clave}`,
        etiqueta: pantalla.etiqueta,
        icono: pantalla.icono,
        rutaHash: `${prefijo}/${pantalla.clave}`
      })
    )
  };
}

/**
 * SISTEMA_ACCESOS sigue apuntando a las páginas antiguas de Control del Sitio del Concentrador; el menú las
 * reemplaza por las pantallas del web part (Permisos de usuario y un ítem por mantenedor), sin cambiar la lista.
 * La audiencia de cada enlace se respeta porque el reemplazo ocurre después de filtrar por audiencia.
 */
export function ReemplazarEnlacesLegadoControlSitio(nodos: NodoMenu[]): NodoMenu[] {
  return nodos.map((nodo): NodoMenu => {
    if (EsNodoMenuGrupo(nodo)) {
      return { ...nodo, hijos: ReemplazarEnlacesLegadoControlSitio(nodo.hijos) };
    }
    const destino = DestinoNormalizado(nodo);
    if (destino.indexOf(PaginaPermisosLegado) >= 0) {
      return EnlacePermisos(nodo);
    }
    if (destino.indexOf(PaginaMantenedoresLegado) >= 0) {
      return GrupoMantenedores(nodo);
    }
    return nodo;
  });
}
