import type { RegistroSistemaAccesoNormalizado } from '../../models/SistemaAcceso';

function SegmentoValido(segmento: string): boolean {
  return segmento.length > 0;
}

export function ObtenerSegmentosHashKeyAncestros(
  registro: RegistroSistemaAccesoNormalizado,
  mapaPorId: ReadonlyMap<number, RegistroSistemaAccesoNormalizado>
): string[] {
  const segmentos: string[] = [];
  const visitados = new Set<number>();
  let actual: RegistroSistemaAccesoNormalizado | undefined = registro;

  while (actual) {
    if (visitados.has(actual.id)) {
      break;
    }
    visitados.add(actual.id);

    if (SegmentoValido(actual.hashKey)) {
      segmentos.unshift(actual.hashKey);
    }

    if (!actual.padreId) {
      break;
    }
    actual = mapaPorId.get(actual.padreId);
  }

  return segmentos;
}

export function ConstruirRutaHashDesdeSegmentos(segmentos: string[]): string {
  return segmentos.filter(SegmentoValido).join('/');
}
