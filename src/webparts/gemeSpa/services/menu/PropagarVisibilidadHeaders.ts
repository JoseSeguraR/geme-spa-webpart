import type { RegistroSistemaAccesoNormalizado } from '../../models/SistemaAcceso';
import { ConstruirMapaHijosPorPadre, RegistroTieneAlgunPadreEnMapa } from './MapaJerarquiaMenu';

function OrdenarHermanos(registros: RegistroSistemaAccesoNormalizado[]): RegistroSistemaAccesoNormalizado[] {
  return [...registros].sort((a, b) => a.orden - b.orden || a.id - b.id);
}

function EsEnlaceVisible(registro: RegistroSistemaAccesoNormalizado): boolean {
  return registro.tipo === 'Route' || registro.tipo === 'ExternalLink';
}

export function ObtenerIdsRegistrosVisibles(
  registrosFiltradosAudiencia: RegistroSistemaAccesoNormalizado[]
): Set<number> {
  const mapaPorId = new Map(registrosFiltradosAudiencia.map((r) => [r.id, r]));
  const hijosPorPadre = ConstruirMapaHijosPorPadre(registrosFiltradosAudiencia);
  const visibles = new Set<number>();
  const visitados = new Set<number>();

  const Evaluar = (registro: RegistroSistemaAccesoNormalizado): boolean => {
    if (visitados.has(registro.id)) {
      return visibles.has(registro.id);
    }
    visitados.add(registro.id);

    if (EsEnlaceVisible(registro)) {
      visibles.add(registro.id);
      return true;
    }

    const hijos = OrdenarHermanos(hijosPorPadre.get(registro.id) ?? []);
    let algunHijoVisible = false;
    for (const hijo of hijos) {
      if (!mapaPorId.has(hijo.id)) {
        continue;
      }
      if (Evaluar(hijo)) {
        algunHijoVisible = true;
      }
    }

    if (algunHijoVisible) {
      visibles.add(registro.id);
    }

    return algunHijoVisible;
  };

  const raices = OrdenarHermanos(hijosPorPadre.get(undefined) ?? []);
  for (const raiz of raices) {
    Evaluar(raiz);
  }

  for (const registro of registrosFiltradosAudiencia) {
    if (RegistroTieneAlgunPadreEnMapa(registro, mapaPorId)) {
      continue;
    }
    Evaluar(registro);
  }

  return visibles;
}

export function FiltrarRegistrosVisibles(
  registrosFiltradosAudiencia: RegistroSistemaAccesoNormalizado[],
  idsVisibles: Set<number>
): RegistroSistemaAccesoNormalizado[] {
  return registrosFiltradosAudiencia.filter((registro) => idsVisibles.has(registro.id));
}
