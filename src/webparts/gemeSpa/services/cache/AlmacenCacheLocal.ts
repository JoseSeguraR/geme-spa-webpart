import type { EntradaCacheLocal } from '../../models/EntradaCacheLocal';

export function LeerEntradaCacheLocal<T>(
  clave: string,
  versionEsperada: string,
  ttlMs: number
): T | undefined {
  if (typeof window === 'undefined' || !window.localStorage) {
    return undefined;
  }

  const crudo = window.localStorage.getItem(clave);
  if (!crudo) {
    return undefined;
  }

  try {
    const entrada = JSON.parse(crudo) as EntradaCacheLocal<T>;
    if (!entrada || typeof entrada !== 'object') {
      EliminarEntradaCacheLocal(clave);
      return undefined;
    }

    if (entrada.version !== versionEsperada) {
      EliminarEntradaCacheLocal(clave);
      return undefined;
    }

    const almacenadoEn = Date.parse(entrada.almacenadoEn);
    if (Number.isNaN(almacenadoEn) || Date.now() - almacenadoEn > ttlMs) {
      EliminarEntradaCacheLocal(clave);
      return undefined;
    }

    return entrada.datos;
  } catch {
    EliminarEntradaCacheLocal(clave);
    return undefined;
  }
}

export function GuardarEntradaCacheLocal<T>(clave: string, version: string, datos: T): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  const entrada: EntradaCacheLocal<T> = {
    almacenadoEn: new Date().toISOString(),
    version,
    datos
  };

  try {
    window.localStorage.setItem(clave, JSON.stringify(entrada));
  } catch {
    // Quota o modo privado: la SPA continúa sin persistencia.
  }
}

export function EliminarEntradaCacheLocal(clave: string): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  window.localStorage.removeItem(clave);
}
