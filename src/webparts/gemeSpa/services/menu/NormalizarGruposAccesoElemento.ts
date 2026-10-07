import type { ElementoSistemaAccesoSharePoint } from '../sharepoint/ElementoSistemaAccesoSharePoint';

/**
 * GRUPOACCESOId (User/Group multivalor): null sin audiencia, o array de Id numéricos.
 * Array vacío se trata como sin restricción de audiencia.
 */
export function NormalizarGruposAccesoElemento(elemento: ElementoSistemaAccesoSharePoint): number[] {
  const raw = elemento.GRUPOACCESOId;
  if (raw === null || raw === undefined) {
    return [];
  }

  if (!Array.isArray(raw)) {
    return [];
  }

  const ids: number[] = [];
  for (const id of raw) {
    if (typeof id === 'number' && Number.isFinite(id) && id > 0) {
      ids.push(id);
    }
  }

  return ids;
}
