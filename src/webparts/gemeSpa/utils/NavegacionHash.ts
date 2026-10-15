import { RutaInicio } from '../models/RutaAplicacion';

export function NormalizarSegmentoHash(hash: string): string {
  return hash.replace(/^#/, '').replace(/^\//, '').trim();
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
