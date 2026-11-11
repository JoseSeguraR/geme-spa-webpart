import type { OpcionCampoCatalogo } from './TiposCatalogo';

type IconoTecnologia = {
  /** Clase Font Awesome que guarda ICONO (la leen las páginas antiguas del sitio). */
  fontAwesome: string;
  /** Equivalente en Bootstrap Icons, que es lo que carga el webpart. */
  bootstrap: string;
  etiqueta: string;
};

/** Mismas opciones que la maqueta (`modals-control-sitio.html`, selector de ícono de tecnología). */
const IconosTecnologia: readonly IconoTecnologia[] = [
  { fontAwesome: 'fas fa-solar-panel', bootstrap: 'bi-sun', etiqueta: 'Solar' },
  { fontAwesome: 'fas fa-industry', bootstrap: 'bi-buildings', etiqueta: 'Térmica / Industrial' },
  { fontAwesome: 'fas fa-wind', bootstrap: 'bi-wind', etiqueta: 'Eólica' },
  { fontAwesome: 'fas fa-water', bootstrap: 'bi-water', etiqueta: 'Hidráulica' },
  { fontAwesome: 'fas fa-battery-full', bootstrap: 'bi-battery-full', etiqueta: 'BESS / Batería' },
  { fontAwesome: 'fas fa-leaf', bootstrap: 'bi-tree', etiqueta: 'Biomasa' },
  { fontAwesome: 'fas fa-gas-pump', bootstrap: 'bi-fuel-pump', etiqueta: 'Hidrógeno verde' },
  { fontAwesome: 'fas fa-bolt', bootstrap: 'bi-lightning-charge', etiqueta: 'Genérico energía' },
  { fontAwesome: 'fas fa-sun', bootstrap: 'bi-brightness-high', etiqueta: 'Renovable (sol)' },
  { fontAwesome: 'fas fa-globe-americas', bootstrap: 'bi-globe-americas', etiqueta: 'Renovable (planeta)' }
];

export const OpcionesIconoTecnologia: readonly OpcionCampoCatalogo[] = IconosTecnologia.map((icono) => ({
  valor: icono.fontAwesome,
  etiqueta: icono.etiqueta
}));

/** `fa-solar-panel` de `fas fa-solar-panel`, `fa fa-solar-panel` o `solar-panel`. */
function NombreIconoFontAwesome(valor: string): string {
  const partes = valor.trim().split(/\s+/);
  const nombre = partes[partes.length - 1] ?? '';
  return nombre.indexOf('fa-') === 0 ? nombre : `fa-${nombre}`;
}

/** Clase Bootstrap Icons para mostrar el valor de ICONO (Font Awesome o, si ya es `bi-…`, el mismo). */
export function ClaseBootstrapIconoTecnologia(valor: string): string {
  const limpio = valor.trim();
  if (!limpio) {
    return '';
  }
  if (/(^|\s)bi-/.test(limpio)) {
    return limpio.replace(/^bi\s+/, '');
  }
  const nombre = NombreIconoFontAwesome(limpio);
  const icono = IconosTecnologia.find((i) => NombreIconoFontAwesome(i.fontAwesome) === nombre);
  return icono ? icono.bootstrap : 'bi-lightning-charge';
}
