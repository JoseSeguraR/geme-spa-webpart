import type { WebPartContext } from '@microsoft/sp-webpart-base';
import {
  ActualizarItemLista,
  CrearItemLista,
  ObtenerTodosLosItemsLista,
  type CuerpoItemLista
} from '../listaGenerica/ListaSharePointServicio';
import {
  CampoLookupTipoEquipoSubequipo,
  CampoSharePointCapacidadActualMw,
  CampoSharePointCapacidadMaximaMw,
  DisponibilidadSubequipoDisponible,
  EstadoSubequipoActivo
} from '../operadorRenovable/CamposOperadorRenovable';
import { NombreListaSubequiposOperador } from '../operadorRenovable/NombresListasOperadorRenovable';
import { ParsearCapacidadesMwTexto } from '../operadorRenovable/UtilidadesCapacidadSubequipo';

/** Subequipo tal como lo edita el mantenedor «Equipos a intervenir por central». */
export type SubequipoMantenedor = {
  id: number;
  codigo: string;
  nombre: string;
  tipoId: number | undefined;
  tipo: string;
  capacidadesMw: number[];
  capacidadMaximaMw: number;
  estado: string;
  disponibilidad: string;
};

export type DatosSubequipoMantenedor = {
  codigo: string;
  nombre: string;
  tipoId: number | undefined;
  capacidadesMw: number[];
  capacidadMaximaMw: number | undefined;
};

type ElementoSubequipo = {
  Id: number;
  Title?: string;
  CODIGO?: string;
  EQUIPOId?: number;
  TIPOEQUIPOId?: number;
  TIPOEQUIPO?: { TIPOEQUIPO?: string };
  CAPACIDADES_MW?: string;
  CAPACIDAD_MAXIMA_MW?: number;
  ESTADO?: string;
  DISPONIBILIDAD?: string;
};

/** `2, 4, 6.5` → `[2, 4, 6.5]`; `undefined` si algún valor no es un número mayor que 0. */
export function InterpretarCapacidadesMw(texto: string): number[] | undefined {
  const partes = texto
    .split(/[;,]/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  const numeros: number[] = [];
  for (const parte of partes) {
    const numero = Number(parte);
    if (!Number.isFinite(numero) || numero <= 0) {
      return undefined;
    }
    if (numeros.indexOf(numero) === -1) {
      numeros.push(numero);
    }
  }
  return numeros.sort((a, b) => a - b);
}

function Normalizar(elemento: ElementoSubequipo): SubequipoMantenedor {
  const capacidadMaxima = typeof elemento.CAPACIDAD_MAXIMA_MW === 'number' ? elemento.CAPACIDAD_MAXIMA_MW : 0;
  return {
    id: elemento.Id,
    codigo: (elemento.CODIGO ?? '').trim(),
    nombre: (elemento.Title ?? '').trim(),
    tipoId: typeof elemento.TIPOEQUIPOId === 'number' ? elemento.TIPOEQUIPOId : undefined,
    tipo: (elemento.TIPOEQUIPO?.TIPOEQUIPO ?? '').trim(),
    capacidadesMw: ParsearCapacidadesMwTexto(elemento.CAPACIDADES_MW, 0),
    capacidadMaximaMw: capacidadMaxima,
    estado: (elemento.ESTADO ?? EstadoSubequipoActivo).trim() || EstadoSubequipoActivo,
    disponibilidad: (elemento.DISPONIBILIDAD ?? DisponibilidadSubequipoDisponible).trim()
  };
}

export async function ObtenerSubequiposDeEquipo(
  context: WebPartContext,
  equipoId: number
): Promise<SubequipoMantenedor[]> {
  const elementos = await ObtenerTodosLosItemsLista<ElementoSubequipo>(context, NombreListaSubequiposOperador, {
    select:
      `Id,Title,CODIGO,EQUIPOId,${CampoLookupTipoEquipoSubequipo}Id,${CampoLookupTipoEquipoSubequipo}/TIPOEQUIPO,` +
      `CAPACIDADES_MW,${CampoSharePointCapacidadMaximaMw},ESTADO,DISPONIBILIDAD`,
    expand: CampoLookupTipoEquipoSubequipo,
    filter: `EQUIPOId eq ${equipoId}`,
    orderby: 'CODIGO asc'
  });
  return elementos.map(Normalizar);
}

/** Cantidad de subequipos por equipo (para la columna «Subequipos» de la grilla de equipos). */
export async function ObtenerConteoSubequiposPorEquipo(context: WebPartContext): Promise<Map<number, number>> {
  const elementos = await ObtenerTodosLosItemsLista<ElementoSubequipo>(context, NombreListaSubequiposOperador, {
    select: 'Id,EQUIPOId'
  });
  const conteo = new Map<number, number>();
  for (const elemento of elementos) {
    if (typeof elemento.EQUIPOId === 'number') {
      conteo.set(elemento.EQUIPOId, (conteo.get(elemento.EQUIPOId) ?? 0) + 1);
    }
  }
  return conteo;
}

function CuerpoDatos(datos: DatosSubequipoMantenedor): CuerpoItemLista {
  return {
    Title: datos.nombre,
    CODIGO: datos.codigo,
    [`${CampoLookupTipoEquipoSubequipo}Id`]: datos.tipoId ?? null,
    CAPACIDADES_MW: datos.capacidadesMw.join(','),
    [CampoSharePointCapacidadMaximaMw]: datos.capacidadMaximaMw ?? null
  };
}

/**
 * Crea un subequipo disponible y activo (capacidad actual = máxima), o actualiza sus datos. Al editar un
 * subequipo disponible, su capacidad actual pasa a ser la nueva máxima; uno indisponible conserva la suya.
 */
export async function GuardarSubequipoMantenedor(
  context: WebPartContext,
  datos: DatosSubequipoMantenedor,
  ubicacion: { equipoId: number; instalacionId: number },
  existente?: SubequipoMantenedor
): Promise<void> {
  const cuerpo = CuerpoDatos(datos);
  if (existente) {
    if (existente.disponibilidad === DisponibilidadSubequipoDisponible) {
      cuerpo[CampoSharePointCapacidadActualMw] = datos.capacidadMaximaMw ?? null;
    }
    await ActualizarItemLista(context, NombreListaSubequiposOperador, existente.id, cuerpo);
    return;
  }
  await CrearItemLista(context, NombreListaSubequiposOperador, {
    ...cuerpo,
    EQUIPOId: ubicacion.equipoId,
    INSTALACIONId: ubicacion.instalacionId,
    DISPONIBILIDAD: DisponibilidadSubequipoDisponible,
    [CampoSharePointCapacidadActualMw]: datos.capacidadMaximaMw ?? null,
    ESTADO: EstadoSubequipoActivo
  });
}

/** Dar de baja (`Inactivo`) o reactivar (`Activo`); el subequipo no se elimina. */
export async function CambiarEstadoSubequipoMantenedor(
  context: WebPartContext,
  subequipoId: number,
  estado: string
): Promise<void> {
  await ActualizarItemLista(context, NombreListaSubequiposOperador, subequipoId, { ESTADO: estado });
}
