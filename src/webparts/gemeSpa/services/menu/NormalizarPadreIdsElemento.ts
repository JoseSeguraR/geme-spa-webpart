import type { ElementoSistemaAccesoSharePoint } from '../sharepoint/ElementoSistemaAccesoSharePoint';

type LookupConResultados = {
  results?: unknown[];
};

function EsLookupConResultados(valor: unknown): valor is LookupConResultados {
  return typeof valor === 'object' && valor !== null && 'results' in valor;
}

function ParsearIdNumerico(valor: unknown): number | undefined {
  if (typeof valor === 'number' && Number.isFinite(valor)) {
    return valor;
  }
  if (typeof valor === 'string') {
    const trimmed = valor.trim();
    if (!trimmed) {
      return undefined;
    }
    const parseado = parseInt(trimmed, 10);
    if (Number.isFinite(parseado)) {
      return parseado;
    }
  }
  return undefined;
}

function ExtraerIdDeElementoLookup(item: unknown): number | undefined {
  if (item === null || item === undefined) {
    return undefined;
  }

  const directo = ParsearIdNumerico(item);
  if (directo !== undefined) {
    return directo;
  }

  if (typeof item !== 'object') {
    return undefined;
  }

  const registro = item as Record<string, unknown>;
  for (const clave of ['Id', 'ID', 'LookupId', 'lookupId']) {
    const id = ParsearIdNumerico(registro[clave]);
    if (id !== undefined) {
      return id;
    }
  }

  return undefined;
}

function AgregarIdUnico(ids: number[], vistos: Set<number>, id: number | undefined): void {
  if (id === undefined || id <= 0 || vistos.has(id)) {
    return;
  }
  vistos.add(id);
  ids.push(id);
}

function ExtraerIdsNumericosDeResultados(items: unknown[]): number[] {
  const ids: number[] = [];
  const vistos = new Set<number>();

  for (const item of items) {
    AgregarIdUnico(ids, vistos, ExtraerIdDeElementoLookup(item));
  }

  return ids;
}

/** Formato clásico SharePoint: `5;#Título` o `5;#Título;#6;#Otro`. */
function ExtraerIdsDesdeCadenaLookupSharePoint(texto: string): number[] {
  const trimmed = texto.trim();
  if (!trimmed) {
    return [];
  }

  if (!trimmed.includes(';#')) {
    const unico = ParsearIdNumerico(trimmed);
    return unico !== undefined && unico > 0 ? [unico] : [];
  }

  const ids: number[] = [];
  const vistos = new Set<number>();
  const partes = trimmed.split(';#');

  for (let indice = 0; indice < partes.length; indice += 2) {
    AgregarIdUnico(ids, vistos, ParsearIdNumerico(partes[indice]));
  }

  return ids;
}

function ExtraerPadreIdsDesdeValorCrudo(valor: unknown): number[] {
  if (valor === null || valor === undefined) {
    return [];
  }

  if (Array.isArray(valor)) {
    return ExtraerIdsNumericosDeResultados(valor);
  }

  if (typeof valor === 'string') {
    return ExtraerIdsDesdeCadenaLookupSharePoint(valor);
  }

  const idUnico = ParsearIdNumerico(valor);
  if (idUnico !== undefined && idUnico > 0) {
    return [idUnico];
  }

  if (EsLookupConResultados(valor) && Array.isArray(valor.results)) {
    return ExtraerIdsNumericosDeResultados(valor.results);
  }

  if (typeof valor === 'object') {
    const idObjeto = ExtraerIdDeElementoLookup(valor);
    if (idObjeto !== undefined && idObjeto > 0) {
      return [idObjeto];
    }
  }

  return [];
}

/**
 * PADRE (lookup multivalor): ids en `PADREId` como array, `{ results: [...] }`, cadena `;#` o número simple.
 * Respaldo con `PADRE` expandido (`results` o lookup simple).
 */
export function NormalizarPadreIdsElemento(elemento: ElementoSistemaAccesoSharePoint): number[] {
  const desdePadreId = ExtraerPadreIdsDesdeValorCrudo(elemento.PADREId);
  if (desdePadreId.length > 0) {
    return desdePadreId;
  }

  return ExtraerPadreIdsDesdeValorCrudo(elemento.PADRE);
}
