import type { NodoMenu } from '../models/NodoMenu';
import { EsNodoMenuEnlaceInterno, EsNodoMenuGrupo } from '../models/NodoMenu';
import { EsEnlaceMenuActivoParaRuta } from './MenuRutaActiva';

export function ObtenerGruposAncestrosParaRuta(nodos: NodoMenu[], ruta: string): Set<string> {
  const expandidos = new Set<string>();

  const Recorrer = (items: NodoMenu[], idsGruposAncestros: string[]): boolean => {
    for (const nodo of items) {
      if (EsNodoMenuGrupo(nodo)) {
        const ancestrosGrupo = [...idsGruposAncestros, nodo.id];
        if (Recorrer(nodo.hijos, ancestrosGrupo)) {
          expandidos.add(nodo.id);
          return true;
        }
      } else if (EsNodoMenuEnlaceInterno(nodo) && EsEnlaceMenuActivoParaRuta(nodo.rutaHash, ruta)) {
        idsGruposAncestros.forEach((id) => expandidos.add(id));
        return true;
      }
    }
    return false;
  };

  Recorrer(nodos, []);
  return expandidos;
}
