import { EsRutaRelacionadaConAnclaMenu } from '../constants/AnclasMenuGrupoRuta';
import { NormalizarSegmentoHash } from './NavegacionHash';

function UltimoSegmentoRuta(ruta: string): string {
  const indice = ruta.lastIndexOf('/');
  return indice === -1 ? ruta : ruta.slice(indice + 1);
}

function PrefijoDirectorioRuta(ruta: string): string {
  const indice = ruta.lastIndexOf('/');
  return indice === -1 ? '' : ruta.slice(0, indice);
}

function EsRutaAnidadaBajoEnlace(rutaEnlace: string, rutaActual: string): boolean {
  return rutaActual.startsWith(`${rutaEnlace}/`);
}

/**
 * Tabs hermanos bajo el mismo prefijo (p. ej. solicitudes y solicitudes-il).
 * No aplica a segmentos independientes como guias-maniobra; esos se registran en anclas de grupo.
 */
function EsRutaExtensionTabHermano(rutaEnlace: string, rutaActual: string): boolean {
  const prefijoEnlace = PrefijoDirectorioRuta(rutaEnlace);
  const prefijoActual = PrefijoDirectorioRuta(rutaActual);
  if (!prefijoEnlace || prefijoEnlace !== prefijoActual) {
    return false;
  }

  const ultimoEnlace = UltimoSegmentoRuta(rutaEnlace);
  const ultimoActual = UltimoSegmentoRuta(rutaActual);
  if (ultimoActual === ultimoEnlace) {
    return false;
  }

  return ultimoActual.startsWith(`${ultimoEnlace}-`);
}

/**
 * Indica si un ítem de menú (rutaHash del enlace) debe mostrarse activo para la ruta actual.
 */
export function EsEnlaceMenuActivoParaRuta(rutaEnlace: string, rutaActual: string): boolean {
  const enlace = NormalizarSegmentoHash(rutaEnlace);
  const actual = NormalizarSegmentoHash(rutaActual);
  if (!enlace || !actual) {
    return false;
  }

  if (enlace === actual) {
    return true;
  }

  if (EsRutaAnidadaBajoEnlace(enlace, actual)) {
    return true;
  }

  if (EsRutaExtensionTabHermano(enlace, actual)) {
    return true;
  }

  return EsRutaRelacionadaConAnclaMenu(enlace, actual);
}
