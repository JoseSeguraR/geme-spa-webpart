export type FilaRenderListData = Record<string, unknown>;

export function ObtenerTexto(valor: unknown): string {
  if (valor === null || valor === undefined) {
    return '';
  }
  if (typeof valor === 'string') {
    return valor;
  }
  if (typeof valor === 'number') {
    return String(valor);
  }
  if (Array.isArray(valor) && valor.length > 0) {
    const primero = valor[0] as Record<string, unknown>;
    if (typeof primero.lookupValue === 'string') {
      return primero.lookupValue;
    }
    if (typeof primero.title === 'string') {
      return primero.title;
    }
  }
  if (typeof valor === 'object') {
    const objeto = valor as Record<string, unknown>;
    if (typeof objeto.lookupValue === 'string') {
      return objeto.lookupValue;
    }
    if (typeof objeto.title === 'string') {
      return objeto.title;
    }
  }
  return String(valor);
}

export function ObtenerLookupId(valor: unknown): number | undefined {
  if (Array.isArray(valor) && valor.length > 0) {
    const primero = valor[0] as Record<string, unknown>;
    const id = primero.lookupId ?? primero.LookupId;
    if (typeof id === 'number') {
      return id;
    }
    if (typeof id === 'string' && id.trim()) {
      return Number(id);
    }
  }
  if (typeof valor === 'object' && valor !== null) {
    const objeto = valor as Record<string, unknown>;
    const id = objeto.lookupId ?? objeto.LookupId;
    if (typeof id === 'number') {
      return id;
    }
  }
  return undefined;
}

export function ObtenerNumero(valor: unknown): number {
  if (typeof valor === 'number') {
    return valor;
  }
  if (typeof valor === 'string' && valor.trim()) {
    return Number(valor);
  }
  return 0;
}
