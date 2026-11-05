export type EstadoCargaGrillaServidor = 'inicial' | 'cargando' | 'listo' | 'vacio' | 'error';

/** Tamaño de página que significa «todos los registros» (convención de MUI Data Grid). */
export const TamanoPaginaTodos = -1;

export type OpcionTamanoPaginaGrilla = number | { value: number; label: string };

export const OpcionesTamanoPaginaGrillaPredeterminadas: readonly OpcionTamanoPaginaGrilla[] = [10, 25, 50, 100];

export const AlturaGrillaPredeterminadaPx = 480;

export const AlturaFilaGrillaPx = 42;

export const AlturaEncabezadoGrillaPx = 40;

/** Anchos iniciales por columna (px). Columnas flex usan el valor como minWidth. */
export const PredeterminadosAnchosColumnasSistemaAccesos: Readonly<Record<string, number>> = {
  acciones: 72,
  id: 64,
  tipoAcceso: 100,
  padreTitulo: 120,
  orden: 76,
  hashTitle: 140,
  hashKey: 140,
  gruposAccesoEtiqueta: 160,
  activo: 76,
  icono: 110
};

export const CamposColumnaFlexSistemaAccesos = new Set<string>([
  'padreTitulo',
  'hashTitle',
  'hashKey',
  'gruposAccesoEtiqueta'
]);
