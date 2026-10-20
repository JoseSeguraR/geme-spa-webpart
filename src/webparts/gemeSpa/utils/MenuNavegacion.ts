import type { NodoMenu } from '../models/NodoMenu';
import { EsNodoMenuEnlaceInterno, EsNodoMenuGrupo, type NodoMenuGrupo } from '../models/NodoMenu';
import { RutaInicio } from '../models/RutaAplicacion';
import { EsEnlaceMenuActivoParaRuta } from './MenuRutaActiva';
import { NormalizarSegmentoHash } from './NavegacionHash';

function NormalizarRutaMenu(ruta: string): string {
  return NormalizarSegmentoHash(ruta) || ruta.trim();
}

function PrefijoGrupoContieneRuta(prefijoRutaHash: string | undefined, rutaActual: string): boolean {
  const prefijo = prefijoRutaHash ? NormalizarRutaMenu(prefijoRutaHash) : '';
  const actual = NormalizarRutaMenu(rutaActual);
  if (!prefijo || !actual) {
    return false;
  }

  return actual === prefijo || actual.startsWith(`${prefijo}/`);
}

export function RutaPerteneceASubarbolMenu(nodo: NodoMenu, rutaActual: string): boolean {
  if (EsNodoMenuEnlaceInterno(nodo)) {
    return EsEnlaceMenuActivoParaRuta(nodo.rutaHash, rutaActual);
  }

  if (!EsNodoMenuGrupo(nodo)) {
    return false;
  }

  if (PrefijoGrupoContieneRuta(nodo.prefijoRutaHash, rutaActual)) {
    return true;
  }

  return nodo.hijos.some((hijo) => RutaPerteneceASubarbolMenu(hijo, rutaActual));
}

/**
 * Grupo de primer nivel cuyo subárbol contiene la ruta actual.
 * No aplica en inicio ni cuando la ruta coincide con un enlace interno de primer nivel.
 */
export function ObtenerGrupoPrimerNivelParaRuta(
  nodos: NodoMenu[],
  ruta: string
): NodoMenuGrupo | undefined {
  const actual = NormalizarSegmentoHash(ruta) || ruta.trim();
  if (!actual || actual === RutaInicio) {
    return undefined;
  }

  for (const nodo of nodos) {
    if (EsNodoMenuEnlaceInterno(nodo) && EsEnlaceMenuActivoParaRuta(nodo.rutaHash, actual)) {
      return undefined;
    }

    if (EsNodoMenuGrupo(nodo) && RutaPerteneceASubarbolMenu(nodo, actual)) {
      return nodo;
    }
  }

  return undefined;
}

function AgregarGruposExpandidosPorPrefijoRuta(
  items: NodoMenu[],
  ruta: string,
  expandidos: Set<string>
): void {
  const actual = NormalizarRutaMenu(ruta);
  if (!actual) {
    return;
  }

  const RecorrerPrefijo = (nodos: NodoMenu[]): void => {
    for (const nodo of nodos) {
      if (!EsNodoMenuGrupo(nodo)) {
        continue;
      }

      if (!PrefijoGrupoContieneRuta(nodo.prefijoRutaHash, actual)) {
        continue;
      }

      expandidos.add(nodo.id);
      RecorrerPrefijo(nodo.hijos);
      return;
    }
  };

  RecorrerPrefijo(items);
}

export function ObtenerGruposAncestrosParaRuta(nodos: NodoMenu[], ruta: string): Set<string> {
  const expandidos = new Set<string>();
  const actual = NormalizarRutaMenu(ruta);

  const Recorrer = (items: NodoMenu[], idsGruposAncestros: string[]): boolean => {
    for (const nodo of items) {
      if (EsNodoMenuGrupo(nodo)) {
        const ancestrosGrupo = [...idsGruposAncestros, nodo.id];
        if (Recorrer(nodo.hijos, ancestrosGrupo)) {
          expandidos.add(nodo.id);
          return true;
        }
      } else if (EsNodoMenuEnlaceInterno(nodo) && EsEnlaceMenuActivoParaRuta(nodo.rutaHash, actual)) {
        idsGruposAncestros.forEach((id) => expandidos.add(id));
        return true;
      }
    }
    return false;
  };

  Recorrer(nodos, []);
  AgregarGruposExpandidosPorPrefijoRuta(nodos, actual, expandidos);
  return expandidos;
}
