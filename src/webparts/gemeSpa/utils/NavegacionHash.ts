import { RutaInicio, type IdRuta } from '../models/RutaAplicacion';

const RutasValidas = new Set<string>([
  RutaInicio,
  'cor-conecta/concentrador-solicitudes/solicitante',
  'cor-conecta/concentrador-solicitudes/administrador',
  'cor-conecta/concentrador-solicitudes/despachador',
  'cor-conecta/sistema-monitoreo-datos',
  'cor-conecta/control/permisos-usuarios',
  'cor-conecta/control/mantenedores',
  'adquisiciones/proveedores/solicitante',
  'adquisiciones/proveedores/aprobadores',
  'adquisiciones/abastecimiento'
]);

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

export function EsRutaConocida(ruta: string): ruta is IdRuta {
  return RutasValidas.has(ruta);
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
