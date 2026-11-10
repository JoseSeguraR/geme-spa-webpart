import * as React from 'react';
import type { GridColDef } from '@mui/x-data-grid';
import type { CampoCatalogo, FilaCatalogo, OpcionCampoCatalogo } from './TiposCatalogo';

export const EstadoRegistroActivo = 'Activo';
export const EstadoRegistroInactivo = 'Inactivo';

export const OpcionesEstadoRegistro: readonly OpcionCampoCatalogo[] = [
  { valor: EstadoRegistroActivo, etiqueta: EstadoRegistroActivo },
  { valor: EstadoRegistroInactivo, etiqueta: EstadoRegistroInactivo }
];

/** Campo ESTADO [Activo, Inactivo] común a los catálogos. */
export const CampoEstadoCatalogo: CampoCatalogo = {
  clave: 'estado',
  etiqueta: 'Estado',
  tipo: 'seleccion',
  obligatorio: true,
  opciones: OpcionesEstadoRegistro,
  valorInicial: EstadoRegistroActivo
};

/** Texto de una columna de SharePoint (número, texto o vacío). */
export function TextoColumna(valor: unknown): string {
  if (valor === undefined || valor === null) {
    return '';
  }
  return String(valor).trim();
}

/** Columna de elección múltiple: arreglo (`nometadata`), `{ results }` (`verbose`) o texto `;#`. */
export function ValoresMultiples(valor: unknown): string[] {
  if (valor === undefined || valor === null) {
    return [];
  }
  if (Array.isArray(valor)) {
    return valor.map((v) => TextoColumna(v)).filter((v) => v.length > 0);
  }
  if (typeof valor === 'object' && Array.isArray((valor as { results?: unknown[] }).results)) {
    return ValoresMultiples((valor as { results: unknown[] }).results);
  }
  return TextoColumna(valor)
    .split(';#')
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

/** Campo de un lookup expandido (`TIPO_TECNOLOGIA/NOMBRE` llega como `{ NOMBRE }`). */
export function CampoLookup(valor: unknown, campo: string): string {
  if (valor && typeof valor === 'object') {
    return TextoColumna((valor as Record<string, unknown>)[campo]);
  }
  return '';
}

export function ValorTexto(fila: FilaCatalogo, clave: string): string {
  const valor = fila[clave];
  if (Array.isArray(valor)) {
    return valor.join(', ');
  }
  return valor === undefined || valor === null ? '' : String(valor);
}

/**
 * Entero de un texto, o `null` si está vacío (para lookups y números opcionales). SharePoint REST necesita
 * `null` para vaciar la columna: `undefined` desaparece en `JSON.stringify` y la columna no cambiaría.
 */
// eslint-disable-next-line @rushstack/no-new-null
export function EnteroONulo(texto: string | string[] | undefined): number | null {
  const valor = typeof texto === 'string' ? texto.trim() : '';
  if (!valor) {
    return null;
  }
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

export function BadgeEstadoRegistro(props: { estado: string }): React.ReactElement {
  const { estado } = props;
  const activo = estado === EstadoRegistroActivo;
  return (
    <span
      className={`cowork-badge-estado cowork-badge-estado--compacto ${
        activo ? 'cowork-estado-registro--activo' : 'cowork-estado-registro--inactivo'
      }`}
    >
      {estado || '—'}
    </span>
  );
}

export const ColumnaEstadoCatalogo: GridColDef<FilaCatalogo> = {
  field: 'estado',
  headerName: 'Estado',
  width: 110,
  align: 'center',
  headerAlign: 'center',
  renderCell: (params) => <BadgeEstadoRegistro estado={ValorTexto(params.row, 'estado')} />
};
