import type { WebPartContext } from '@microsoft/sp-webpart-base';
import { FormatearFechaHoraVisible } from '../../../utils/FechaHoraCorConecta';
import { ObtenerConfiguracionOperadorRenovable, ResultadoSinEnvio, type ResultadoEnvioMeteologica } from './CapacidadCentralApiServicio';

/**
 * Cliente de los períodos de indisponibilidad de la App Function (`/api/concentrador-periodos`).
 * Cada período tiene inicio, fecha estimada de fin y fin real; ante cada cambio la Function recalcula
 * el perfil de capacidad de la central y lo envía completo a Meteológica.
 */

/** Estado que ve el operador (lo calcula la Function según la hora). */
export type EstadoCalculadoPeriodo = 'PROGRAMADO' | 'VIGENTE' | 'VENCIDO' | 'FINALIZADO' | 'ANULADO';

export type PeriodoIndisponibilidad = {
  id: number;
  instalacionId: number;
  instalacionCodigo: string;
  equipoId?: number;
  subequipoId: number;
  subequipoCodigo: string;
  capacidadMaximaMw: number;
  /** Con cuánto queda el subequipo. */
  capacidadMw: number;
  mwFuera: number;
  /** Fechas ISO UTC. */
  fechaInicio: string;
  fechaFinEstimada: string;
  fechaFin?: string;
  /** Hasta cuándo cuenta fuera (un vencido se extiende día a día). */
  finEfectivo?: string;
  motivo: string;
  descripcion?: string;
  estado: 'ACTIVO' | 'FINALIZADO' | 'ANULADO';
  estadoCalculado: EstadoCalculadoPeriodo;
  origen: 'OPERADOR' | 'MIGRACION';
  creadoPor: string;
  creadoEn?: string;
  actualizadoPor: string;
  actualizadoEn?: string;
};

export type TramoPerfil = { desde: string; hasta: string; mw: number };

export type PerfilCentral = {
  desde: string;
  hasta: string;
  capacidadMaximaMw: number;
  tramos: TramoPerfil[];
};

export type EnvioPerfil = {
  id: number;
  accion?: string;
  usuario?: string;
  desde?: string;
  hasta?: string;
  tramos: TramoPerfil[];
  capacidadMaximaMw?: number;
  estado?: string;
  error?: string;
  verificado?: boolean;
  facilityId?: string;
  creadoEn?: string;
  enviadoEn?: string;
};

export type PlanificacionCentral = {
  ahora: string;
  periodos: PeriodoIndisponibilidad[];
  perfil: PerfilCentral;
  ultimoEnvio?: EnvioPerfil;
};

/**
 * Estado de hoy de un subequipo (columnas de CONC_MANTENEDOR_SUBEQUIPOS) que calcula la App Function. Lo
 * escribe el web part con la API REST de SharePoint: la Function no tiene escritura en listas.
 */
export type EstadoSubequipoSharePoint = {
  subequipoId: number;
  subequipoCodigo: string;
  campos: Record<string, string | number>;
};

export type ResultadoAccionPeriodos = {
  periodos: PeriodoIndisponibilidad[];
  /** Subequipos cuyo estado en SharePoint hay que actualizar. */
  subequipos: EstadoSubequipoSharePoint[];
  perfil?: PerfilCentral;
  envio: ResultadoEnvioMeteologica;
  avisos: string[];
};

export type DatosCrearPeriodos = {
  instalacionId: number;
  /** ISO UTC. */
  fechaInicio: string;
  fechaFinEstimada: string;
  motivo: string;
  descripcion?: string;
  items: { subequipoId: number; capacidadMw: number }[];
};

/** Error de la API con su mensaje para el operador (validación, cruce de fechas, etc.). */
export class PeriodosApiError extends Error {
  public readonly status: number;

  public constructor(mensaje: string, status: number) {
    super(mensaje);
    // El web part compila a ES5: sin esto, `instanceof PeriodosApiError` da false y se pierde el mensaje
    Object.setPrototypeOf(this, PeriodosApiError.prototype);
    this.name = 'PeriodosApiError';
    this.status = status;
  }
}

/** Los campos vacíos llegan como null en el JSON; se tratan igual que ausentes. */
type RespuestaMeteologica = {
  estado?: string;
  error?: string;
  verificado?: boolean;
  enviadoEn?: string;
};

type RespuestaAccion = {
  success?: boolean;
  error?: string;
  periodos?: PeriodoIndisponibilidad[];
  perfil?: PerfilCentral;
  meteologica?: RespuestaMeteologica;
  avisos?: string[];
  subequipos?: EstadoSubequipoSharePoint[];
  centrales?: { meteologica?: RespuestaMeteologica; perfil?: PerfilCentral; instalacionCodigo?: string }[];
};

/** Hay URL de la API de períodos: el operador trabaja con fechas estimadas y perfil de capacidad. */
export function HayServicioPeriodos(): boolean {
  return !!ObtenerConfiguracionOperadorRenovable().concOperadorRenovableUrlPeriodos?.trim();
}

/**
 * URL de un endpoint de la App Function del Operador renovable. La propiedad del web part es
 * `https://<host>/api/concentrador-periodos?code=<llave>`: de ella salen el host, `/api` y la llave, y la
 * misma llave sirve para los demás endpoints (`concentrador-bitacora`, `concentrador-limitaciones/...`).
 */
export function UrlApiOperador(ruta: string, query?: Record<string, string>): string {
  const base = ObtenerConfiguracionOperadorRenovable().concOperadorRenovableUrlPeriodos?.trim() ?? '';
  if (!base) {
    throw new PeriodosApiError('Falta configurar «URL indisponibilidades (períodos)» en el Web Part.', 0);
  }
  const [rutaBase, consulta = ''] = base.split('?');
  const api = rutaBase.replace(/\/+$/, '').replace(/\/concentrador-periodos$/, '');
  const parametros = Object.keys(query ?? {})
    .map((clave) => `${encodeURIComponent(clave)}=${encodeURIComponent((query ?? {})[clave])}`)
    .join('&');
  const todos = [consulta, parametros].filter((parte) => parte).join('&');
  return `${api}/${ruta}${todos ? `?${todos}` : ''}`;
}

function UrlPeriodos(subruta: string, query?: Record<string, string>): string {
  return UrlApiOperador(`concentrador-periodos${subruta}`, query);
}

/** Quién hace el cambio, para la tabla de la Function (no se verifica en el servidor). */
export function UsuarioOperador(context: WebPartContext): string {
  const usuario = context.pageContext.user;
  return usuario.email ? `${usuario.displayName} <${usuario.email}>` : usuario.displayName;
}

/** GET (sin cuerpo) o POST JSON a la App Function; lanza `PeriodosApiError` con el mensaje de la API. */
export async function PedirApiOperador<T extends { success?: boolean; error?: string }>(url: string, cuerpo?: object): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: cuerpo ? 'POST' : 'GET',
      headers: cuerpo ? { Accept: 'application/json', 'Content-Type': 'application/json' } : { Accept: 'application/json' },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined
    });
  } catch {
    throw new PeriodosApiError('No se pudo contactar la App Function del Operador renovable.', 0);
  }
  const respuesta = (await response.json().catch(() => ({}))) as T;
  if (!response.ok || !respuesta.success) {
    throw new PeriodosApiError(respuesta.error ?? `La App Function respondió HTTP ${response.status}.`, response.status);
  }
  return respuesta;
}

function FormatearMw(valor: number): string {
  return `${valor.toLocaleString('es-CL', { maximumFractionDigits: 3 })} MW`;
}

/** Texto para el operador del envío del perfil (mismo criterio que `DescribirEnvio` de capacidad). */
export function DescribirEnvioPerfil(
  meteologica: RespuestaMeteologica | undefined,
  perfil: PerfilCentral | undefined,
  central?: string
): ResultadoEnvioMeteologica {
  const estado = meteologica?.estado ?? 'ERROR';
  const prefijo = central ? `${central}: ` : '';
  if (estado === 'ENVIADO' && perfil) {
    const minimo = perfil.tramos.reduce((menor, tramo) => Math.min(menor, tramo.mw), Number.POSITIVE_INFINITY);
    const tramos = perfil.tramos.length === 1 ? '1 tramo' : `${perfil.tramos.length} tramos`;
    return {
      enviado: true,
      estado,
      mensaje:
        `${prefijo}enviado a Meteológica el perfil de la central (${tramos}) del ${FormatearFechaHoraVisible(perfil.desde)} ` +
        `al ${FormatearFechaHoraVisible(perfil.hasta)}; capacidad mínima ${FormatearMw(Number.isFinite(minimo) ? minimo : 0)}.`
    };
  }
  if (estado === 'SIN_FACILITY_ID') {
    return ResultadoSinEnvio(estado, `${prefijo}no enviado a Meteológica: la central no tiene FACILITY_ID_METEOLOGICA.`);
  }
  if (estado === 'DESHABILITADO') {
    return ResultadoSinEnvio(estado, `${prefijo}no enviado: los envíos a Meteológica están deshabilitados en la App Function.`);
  }
  return ResultadoSinEnvio(estado, `${prefijo}error al enviar a Meteológica: ${meteologica?.error ?? 'sin detalle'}.`);
}

function ResultadoAccion(respuesta: RespuestaAccion): ResultadoAccionPeriodos {
  const centrales = respuesta.centrales && respuesta.centrales.length > 1 ? respuesta.centrales : undefined;
  let envio = DescribirEnvioPerfil(respuesta.meteologica, respuesta.perfil);
  if (centrales) {
    const envios = centrales.map((c) => DescribirEnvioPerfil(c.meteologica, c.perfil, c.instalacionCodigo));
    envio = {
      enviado: envios.every((e) => e.enviado),
      estado: envios.every((e) => e.enviado) ? 'ENVIADO' : 'ERROR',
      mensaje: envios.map((e) => e.mensaje).join(' ')
    };
  }
  return {
    periodos: respuesta.periodos ?? [],
    subequipos: respuesta.subequipos ?? [],
    perfil: respuesta.perfil,
    envio,
    avisos: respuesta.avisos ?? []
  };
}

/** Períodos que no terminaron (activos o con fin real futuro) de todas las centrales: estado de las tarjetas. */
export async function ObtenerPeriodosAbiertos(): Promise<PeriodoIndisponibilidad[]> {
  const respuesta = await PedirApiOperador<{ success?: boolean; error?: string; periodos?: PeriodoIndisponibilidad[] }>(UrlPeriodos(''));
  return respuesta.periodos ?? [];
}

/** Períodos de la central en el rango, su perfil calculado y el último envío (vista Planificación). */
export async function ObtenerPlanificacionCentral(
  instalacionId: number,
  desdeIso: string,
  hastaIso: string
): Promise<PlanificacionCentral> {
  const respuesta = await PedirApiOperador<PlanificacionCentral & { success?: boolean; error?: string }>(
    UrlPeriodos('', { instalacion: String(instalacionId), desde: desdeIso, hasta: hastaIso })
  );
  return { ahora: respuesta.ahora, periodos: respuesta.periodos ?? [], perfil: respuesta.perfil, ultimoEnvio: respuesta.ultimoEnvio };
}

export async function CrearPeriodos(context: WebPartContext, datos: DatosCrearPeriodos): Promise<ResultadoAccionPeriodos> {
  const respuesta = await PedirApiOperador<RespuestaAccion>(UrlPeriodos(''), { ...datos, usuario: UsuarioOperador(context) });
  return ResultadoAccion(respuesta);
}

/** Fin real de los períodos; `subequipoIdsSinPeriodo`: Indisponibles sin período (datos anteriores). */
export async function FinalizarPeriodos(
  context: WebPartContext,
  ids: number[],
  fechaFinIso: string,
  subequipoIdsSinPeriodo: number[] = []
): Promise<ResultadoAccionPeriodos> {
  const respuesta = await PedirApiOperador<RespuestaAccion>(UrlPeriodos('/finalizar'), {
    ids,
    subequipoIdsSinPeriodo,
    fechaFin: fechaFinIso,
    usuario: UsuarioOperador(context)
  });
  return ResultadoAccion(respuesta);
}

export async function CambiarFechaEstimadaPeriodo(
  context: WebPartContext,
  id: number,
  fechaFinEstimadaIso: string
): Promise<ResultadoAccionPeriodos> {
  const respuesta = await PedirApiOperador<RespuestaAccion>(UrlPeriodos('/fecha-estimada'), {
    id,
    fechaFinEstimada: fechaFinEstimadaIso,
    usuario: UsuarioOperador(context)
  });
  return ResultadoAccion(respuesta);
}

export async function AnularPeriodo(context: WebPartContext, id: number): Promise<ResultadoAccionPeriodos> {
  const respuesta = await PedirApiOperador<RespuestaAccion>(UrlPeriodos('/anular'), { id, usuario: UsuarioOperador(context) });
  return ResultadoAccion(respuesta);
}

export async function ReenviarPerfilCentral(context: WebPartContext, instalacionId: number): Promise<ResultadoAccionPeriodos> {
  const respuesta = await PedirApiOperador<RespuestaAccion>(UrlPeriodos('/reenviar'), {
    instalacionId,
    usuario: UsuarioOperador(context)
  });
  return ResultadoAccion(respuesta);
}

export type ResultadoMigracion = {
  pendientes: number;
  migrados: number;
  omitidos: string[];
  /** Estado de los subequipos migrados, para escribirlo en SharePoint. */
  subequipos: EstadoSubequipoSharePoint[];
};

/** Crea períodos para los subequipos Indisponibles en SharePoint que no tienen uno (simular: solo cuenta). */
export async function MigrarPeriodos(context: WebPartContext, simular: boolean): Promise<ResultadoMigracion> {
  const respuesta = await PedirApiOperador<{
    success?: boolean;
    error?: string;
    pendientes?: number;
    migrados?: number;
    omitidos?: string[];
    centrales?: { subequipos?: EstadoSubequipoSharePoint[] }[];
  }>(UrlPeriodos('/migrar'), { usuario: UsuarioOperador(context), simular });
  return {
    pendientes: respuesta.pendientes ?? 0,
    migrados: respuesta.migrados ?? 0,
    omitidos: respuesta.omitidos ?? [],
    subequipos: (respuesta.centrales ?? []).reduce<EstadoSubequipoSharePoint[]>(
      (todos, central) => todos.concat(central.subequipos ?? []),
      []
    )
  };
}

/** El período deja fuera al subequipo ahora (vigente, vencido o finalizado con fin real futuro). */
export function PeriodoCubreAhora(periodo: PeriodoIndisponibilidad): boolean {
  return periodo.estadoCalculado === 'VIGENTE' || periodo.estadoCalculado === 'VENCIDO';
}
