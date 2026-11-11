import { RutaInicio } from '../models/RutaAplicacion';

/** Decodifica `%2F` y similares: SharePoint en modo edición reescribe el hash como `#/%2Fruta%2Fhija`. */
function DecodificarHash(hash: string): string {
  if (hash.indexOf('%') < 0) {
    return hash;
  }
  try {
    return decodeURIComponent(hash);
  } catch {
    return hash;
  }
}

export function NormalizarSegmentoHash(hash: string): string {
  return DecodificarHash(hash.replace(/^#/, '')).replace(/^\/+/, '').trim();
}

export function ObtenerRutaDesdeHash(hash: string = window.location.hash): string {
  const segmento = NormalizarSegmentoHash(hash);
  if (!segmento) {
    return RutaInicio;
  }
  return segmento;
}

export function ConstruirHashDesdeRuta(ruta: string): string {
  const segmento = NormalizarSegmentoHash(ruta);
  return `#/${segmento || RutaInicio}`;
}

export function EstablecerRutaHash(ruta: string): void {
  const destino = ConstruirHashDesdeRuta(ruta);
  if (window.location.hash !== destino) {
    window.location.hash = destino;
  }
}

export function AsegurarHashInicial(): void {
  if (!NormalizarSegmentoHash(window.location.hash)) {
    EstablecerRutaHash(RutaInicio);
  }
}
