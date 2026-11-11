import type {
  EnvioMeteologicaBitacora,
  FilaBitacoraOperadorSubequipo
} from '../../../models/operadorRenovable/CatalogoEquiposOperador';
import { PedirApiOperador, UrlApiOperador } from './PeriodosIndisponibilidadApiServicio';

/**
 * Bitácora de subequipos: `app.concentrador_bitacora_subequipo` en la BD de la App Function (reemplaza a la
 * lista CONC_LISTA_BITACORA_SUBEQUIPO, 10-11-2026). La escribe la Function en cada acción sobre las
 * indisponibilidades (crear, finalizar, fecha estimada, anular, migrar, timer); el web part solo la lee.
 */

/** Los campos vacíos llegan como null en el JSON; se tratan igual que ausentes. */
type FilaBitacoraSubequipoApi = {
  id: number;
  accion?: string;
  estadoAnterior?: string;
  estadoNuevo?: string;
  capacidadMw?: number;
  motivo?: string;
  descripcion?: string;
  usuario?: string;
  fechaEvento?: string;
  creadoEn?: string;
  fechaInicio?: string;
  fechaFinEstimada?: string;
  fechaFin?: string;
  fechaFinEstimadaAnterior?: string;
  meteologica?: EnvioMeteologicaBitacora;
};

function Texto(valor: string | undefined): string | undefined {
  return valor || undefined;
}

export function NormalizarEnvioBitacora(envio: EnvioMeteologicaBitacora | undefined): EnvioMeteologicaBitacora | undefined {
  if (!envio) {
    return undefined;
  }
  return {
    estado: Texto(envio.estado),
    error: Texto(envio.error),
    verificado: typeof envio.verificado === 'boolean' ? envio.verificado : undefined,
    desde: Texto(envio.desde),
    hasta: Texto(envio.hasta),
    tramos: envio.tramos ?? undefined,
    tipo: Texto(envio.tipo),
    valorMw: typeof envio.valorMw === 'number' ? envio.valorMw : undefined,
    enviadoEn: Texto(envio.enviadoEn)
  };
}

/** Últimos 200 eventos del subequipo, del más reciente al más antiguo. */
export async function ObtenerBitacoraSubequipoOperador(subequipoId: number): Promise<FilaBitacoraOperadorSubequipo[]> {
  const respuesta = await PedirApiOperador<{ success?: boolean; error?: string; bitacora?: FilaBitacoraSubequipoApi[] }>(
    UrlApiOperador('concentrador-bitacora', { subequipo: String(subequipoId) })
  );
  return (respuesta.bitacora ?? []).map((fila) => ({
    id: fila.id,
    accion: fila.accion ?? '',
    estadoAnterior: fila.estadoAnterior ?? '',
    estadoNuevo: fila.estadoNuevo ?? '',
    capacidadMw: typeof fila.capacidadMw === 'number' ? fila.capacidadMw : undefined,
    motivo: Texto(fila.motivo),
    descripcion: Texto(fila.descripcion),
    usuario: fila.usuario || '—',
    fecha: fila.fechaEvento ?? fila.creadoEn ?? '',
    fechaInicio: Texto(fila.fechaInicio),
    fechaFinEstimada: Texto(fila.fechaFinEstimada),
    fechaFin: Texto(fila.fechaFin),
    fechaFinEstimadaAnterior: Texto(fila.fechaFinEstimadaAnterior),
    meteologica: NormalizarEnvioBitacora(fila.meteologica)
  }));
}
