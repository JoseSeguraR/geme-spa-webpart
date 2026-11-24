export type PasoSiodSolicitudFalla = {
  operacion: 'insert' | 'update';
  intentado: boolean;
  exito: boolean;
  mensaje: string;
};

export type ResultadoSincronizacionSiodFalla = {
  pasos: PasoSiodSolicitudFalla[];
};

export function HuboFalloSiod(resultado: ResultadoSincronizacionSiodFalla | undefined): boolean {
  if (!resultado) {
    return false;
  }
  return resultado.pasos.some((paso) => !paso.exito);
}

export function AlertasDesdeResultadoSiod(
  resultado: ResultadoSincronizacionSiodFalla | undefined
): { tipo: 'success' | 'warning' | 'info'; texto: string }[] {
  if (!resultado || resultado.pasos.length === 0) {
    return [];
  }
  return resultado.pasos.map((paso) => ({
    tipo: paso.exito ? 'success' : paso.intentado ? 'warning' : 'info',
    texto: paso.mensaje
  }));
}