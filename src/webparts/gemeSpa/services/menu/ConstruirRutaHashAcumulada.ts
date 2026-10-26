import type { RegistroSistemaAccesoNormalizado } from '../../models/SistemaAcceso';

function SegmentoValido(segmento: string): boolean {
  return segmento.length > 0;
}

function ResolverPadreJerarquia(
  registro: RegistroSistemaAccesoNormalizado,
  mapaPorId: ReadonlyMap<number, RegistroSistemaAccesoNormalizado>
): RegistroSistemaAccesoNormalizado | undefined {
  for (const padreId of registro.padreIds) {
    const padre = mapaPorId.get(padreId);
    if (padre) {
      return padre;
    }
  }
  return undefined;
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

    const padre = ResolverPadreJerarquia(actual, mapaPorId);
    if (!padre) {
      break;
    }
    actual = padre;
  }

  return segmentos;
}

export function ConstruirRutaHashDesdeSegmentos(segmentos: string[]): string {
  return segmentos.filter(SegmentoValido).join('/');
}
