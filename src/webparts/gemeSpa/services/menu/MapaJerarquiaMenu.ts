import type { RegistroSistemaAccesoNormalizado } from '../../models/SistemaAcceso';

/** Agrupa hijos por id de padre; sin padres → clave `undefined` (raíz). Un hijo con varios padres aparece bajo cada uno. */
export function ConstruirMapaHijosPorPadre(
  registros: RegistroSistemaAccesoNormalizado[]
): Map<number | undefined, RegistroSistemaAccesoNormalizado[]> {
  const hijosPorPadre = new Map<number | undefined, RegistroSistemaAccesoNormalizado[]>();

  const Agregar = (clavePadre: number | undefined, registro: RegistroSistemaAccesoNormalizado): void => {
    const hermanos = hijosPorPadre.get(clavePadre);
    if (hermanos) {
      hermanos.push(registro);
    } else {
      hijosPorPadre.set(clavePadre, [registro]);
    }
  };

  for (const registro of registros) {
    if (registro.padreIds.length === 0) {
      Agregar(undefined, registro);
      continue;
    }

    for (const padreId of registro.padreIds) {
      Agregar(padreId, registro);
    }
  }

  return hijosPorPadre;
}

export function RegistroTieneAlgunPadreEnMapa(
  registro: RegistroSistemaAccesoNormalizado,
  mapaPorId: ReadonlyMap<number, RegistroSistemaAccesoNormalizado>
): boolean {
  return registro.padreIds.some((padreId) => mapaPorId.has(padreId));
}
