import type { NodoMenu } from '../models/NodoMenu';
import { EsNodoMenuEnlaceInterno, EsNodoMenuGrupo } from '../models/NodoMenu';
import { EsEnlaceMenuActivoParaRuta } from './MenuRutaActiva';

/** Rail del sidebar colapsado: valor de ICONO en SISTEMA_ACCESOS (p. ej. bi-diagram-3) o este predeterminado. */
const ICONO_RAIL_PREDETERMINADO = 'three-dots-vertical';

export function ObtenerClaseIconoMenu(nodo: NodoMenu): string {
  const sufijo = nodo.icono?.trim() ? nodo.icono.trim() : ICONO_RAIL_PREDETERMINADO;
  return `bi bi-${sufijo}`;
}

export function EsNodoPrimerNivelActivo(nodo: NodoMenu, rutaActual: string): boolean {
  if (EsNodoMenuEnlaceInterno(nodo)) {
    return EsEnlaceMenuActivoParaRuta(nodo.rutaHash, rutaActual);
  }

  if (!EsNodoMenuGrupo(nodo)) {
    return false;
  }

  return nodo.hijos.some((hijo) => RutaPerteneceANodo(hijo, rutaActual));
}

function RutaPerteneceANodo(nodo: NodoMenu, rutaActual: string): boolean {
  if (EsNodoMenuEnlaceInterno(nodo)) {
    return EsEnlaceMenuActivoParaRuta(nodo.rutaHash, rutaActual);
  }

  if (!EsNodoMenuGrupo(nodo)) {
    return false;
  }

  return nodo.hijos.some((hijo) => RutaPerteneceANodo(hijo, rutaActual));
}
