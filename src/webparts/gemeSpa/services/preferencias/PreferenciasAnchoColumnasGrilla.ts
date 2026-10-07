import type { EntradaCacheLocal } from '../../models/EntradaCacheLocal';

const VERSION_PREFERENCIAS_ANCHO = 'v2';

export type AnchosColumnasGrilla = Record<string, number>;

function ConstruirClave(loginUsuario: string, nombreLista: string): string {
  const usuarioSeguro = loginUsuario.replace(/[^\w.-@]/g, '_');
  return `grilla_ancho_${nombreLista}_${usuarioSeguro}_${VERSION_PREFERENCIAS_ANCHO}`;
}

export function LeerAnchosColumnasGrilla(
  loginUsuario: string,
  nombreLista: string
): AnchosColumnasGrilla | undefined {
  if (typeof window === 'undefined' || !window.localStorage) {
    return undefined;
  }
  const clave = ConstruirClave(loginUsuario, nombreLista);
  const crudo = window.localStorage.getItem(clave);
  if (!crudo) {
    return undefined;
  }
  try {
    const entrada = JSON.parse(crudo) as EntradaCacheLocal<AnchosColumnasGrilla>;
    if (entrada.version !== VERSION_PREFERENCIAS_ANCHO || !entrada.datos) {
      return undefined;
    }
    return entrada.datos;
  } catch {
    return undefined;
  }
}

export function GuardarAnchosColumnasGrilla(
  loginUsuario: string,
  nombreLista: string,
  anchosPersonalizados: AnchosColumnasGrilla
): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  const clave = ConstruirClave(loginUsuario, nombreLista);
  const entrada: EntradaCacheLocal<AnchosColumnasGrilla> = {
    almacenadoEn: new Date().toISOString(),
    version: VERSION_PREFERENCIAS_ANCHO,
    datos: anchosPersonalizados
  };
  try {
    if (Object.keys(anchosPersonalizados).length === 0) {
      window.localStorage.removeItem(clave);
      return;
    }
    window.localStorage.setItem(clave, JSON.stringify(entrada));
  } catch {
    // almacenamiento no disponible
  }
}

/** Combina defaults del sistema con overrides persistidos por el usuario. */
export function CombinarAnchosColumnasGrilla(
  predeterminados: Readonly<Record<string, number>>,
  guardados: AnchosColumnasGrilla | undefined
): Record<string, number> {
  const resultado: Record<string, number> = { ...predeterminados };
  if (!guardados) {
    return resultado;
  }
  for (const clave of Object.keys(predeterminados)) {
    const valor = guardados[clave];
    if (typeof valor === 'number' && valor > 40) {
      resultado[clave] = valor;
    }
  }
  return resultado;
}

/** Solo anchos distintos del default (para persistir sin guardar valores de sistema). */
export function ExtraerAnchosPersonalizadosGrilla(
  anchosEfectivos: Record<string, number>,
  predeterminados: Readonly<Record<string, number>>
): AnchosColumnasGrilla {
  const personalizados: AnchosColumnasGrilla = {};
  for (const clave of Object.keys(predeterminados)) {
    const efectivo = anchosEfectivos[clave];
    const def = predeterminados[clave];
    if (typeof efectivo === 'number' && efectivo !== def) {
      personalizados[clave] = efectivo;
    }
  }
  return personalizados;
}
