import { NormalizarSegmentoHash } from './NavegacionHash';

export function EsRutaDisponibleEnMenu(
  ruta: string,
  rutasDisponibles: ReadonlySet<string>
): boolean {
  const segmento = NormalizarSegmentoHash(ruta);
  if (!segmento) {
    return rutasDisponibles.has('inicio');
  }
  return rutasDisponibles.has(segmento);
}
