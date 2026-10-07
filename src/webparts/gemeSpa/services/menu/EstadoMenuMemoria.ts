import type { ResultadoInicializacionMenu } from '../../models/ResultadoInicializacionMenu';

let resultadoEnMemoria: ResultadoInicializacionMenu | undefined;

export function ObtenerResultadoMenuMemoria(): ResultadoInicializacionMenu | undefined {
  return resultadoEnMemoria;
}

export function EstablecerResultadoMenuMemoria(resultado: ResultadoInicializacionMenu): void {
  resultadoEnMemoria = resultado;
}

export function LimpiarResultadoMenuMemoria(): void {
  resultadoEnMemoria = undefined;
}
