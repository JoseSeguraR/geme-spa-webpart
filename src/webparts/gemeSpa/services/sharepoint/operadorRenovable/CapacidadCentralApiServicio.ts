import type { PropiedadesWebPartOperadorRenovable } from '../../../models/ConfiguracionOperadorRenovable';
import { FormatearFechaHoraVisible } from '../../../utils/FechaHoraCorConecta';

/**
 * Configuración del Operador renovable (App Function), centrales de Meteológica y el texto para el
 * operador del resultado de un envío de capacidad (limitaciones por subestación, tramo GRID).
 */

/** Los campos vacíos llegan como null en el JSON; se tratan igual que ausentes. */
type EnvioMeteologicaApi = {
  estado?: string;
  tipo?: string;
  valorMw?: number;
  desde?: string;
  hasta?: string;
  error?: string;
};

export type RespuestaCapacidadCentralApi = {
  success?: boolean;
  error?: string;
  capacidadMw?: number;
  meteologica?: EnvioMeteologicaApi;
};

type CentralMeteologicaApi = {
  facilityId?: string;
  facilityName?: string;
  installedCapacity?: number;
};

/** Central de la cuenta de Meteológica, para asociarla a una central de GEME (`FACILITY_ID_METEOLOGICA`). */
export type CentralMeteologica = {
  facilityId: string;
  nombre: string;
  /** Capacidad instalada en MW (Meteológica la entrega en kW). */
  capacidadMw: number | undefined;
};

export type ResultadoEnvioMeteologica = {
  enviado: boolean;
  /** ENVIADO, ERROR, SIN_FACILITY_ID, DESHABILITADO (de la Function) o ERROR_APP_FUNCTION. */
  estado: string;
  mensaje: string;
};

let configuracion: PropiedadesWebPartOperadorRenovable = {};
let centralesMeteologica: Promise<CentralMeteologicaApi[]> | undefined;

/** La llama el Web Part en cada render con sus propiedades (evita pasarlas por todas las vistas y modales). */
export function EstablecerConfiguracionOperadorRenovable(props: PropiedadesWebPartOperadorRenovable): void {
  if (props.concOperadorRenovableUrlMeteologicaFacilities !== configuracion.concOperadorRenovableUrlMeteologicaFacilities) {
    centralesMeteologica = undefined;
  }
  configuracion = { ...props };
}

export function ObtenerConfiguracionOperadorRenovable(): PropiedadesWebPartOperadorRenovable {
  return configuracion;
}

export function ResultadoSinEnvio(estado: string, mensaje: string): ResultadoEnvioMeteologica {
  return { enviado: false, estado, mensaje };
}

/** Texto para el operador del envío de un evento de limitación (respuesta de la App Function). */
export function DescribirEnvioCapacidad(respuesta: RespuestaCapacidadCentralApi): ResultadoEnvioMeteologica {
  const envio = respuesta.meteologica ?? {};
  const estado = envio.estado ?? 'ERROR';
  const capacidad = typeof respuesta.capacidadMw === 'number' ? ` Capacidad de la central: ${respuesta.capacidadMw} MW.` : '';

  if (estado === 'ENVIADO') {
    const tramo = `${FormatearFechaHoraVisible(envio.desde || undefined)} al ${FormatearFechaHoraVisible(envio.hasta || undefined)}`;
    return {
      enviado: true,
      estado,
      mensaje: `Enviado a Meteológica: ${envio.valorMw ?? '—'} MW disponibles (${envio.tipo ?? '—'}) del ${tramo}.${capacidad}`
    };
  }
  if (estado === 'SIN_FACILITY_ID') {
    return ResultadoSinEnvio(estado, `No enviado a Meteológica: la central no tiene FACILITY_ID_METEOLOGICA.${capacidad}`);
  }
  if (estado === 'DESHABILITADO') {
    return ResultadoSinEnvio(estado, `No enviado: los envíos a Meteológica están deshabilitados en la App Function.${capacidad}`);
  }
  return ResultadoSinEnvio(estado, `Error al enviar a Meteológica: ${envio.error ?? 'sin detalle'}.${capacidad}`);
}

async function CargarCentralesMeteologica(url: string): Promise<CentralMeteologicaApi[]> {
  const response = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const json = (await response.json()) as { facilities?: CentralMeteologicaApi[] };
  return json.facilities ?? [];
}

/**
 * Centrales de la cuenta de Meteológica (`GET /meteologica-facilities`); undefined si el web part no tiene la URL.
 * El listado se pide una vez por sesión.
 */
export async function ObtenerCentralesMeteologica(): Promise<CentralMeteologica[] | undefined> {
  const url = configuracion.concOperadorRenovableUrlMeteologicaFacilities?.trim() ?? '';
  if (!url) {
    return undefined;
  }
  if (!centralesMeteologica) {
    centralesMeteologica = CargarCentralesMeteologica(url);
    centralesMeteologica.catch(() => {
      centralesMeteologica = undefined;
    });
  }
  return (await centralesMeteologica)
    .filter((item) => !!item.facilityId)
    .map((item) => ({
      facilityId: item.facilityId as string,
      nombre: item.facilityName || (item.facilityId as string),
      capacidadMw: typeof item.installedCapacity === 'number' ? item.installedCapacity / 1000 : undefined
    }));
}

/** Capacidad instalada (MW) de la central en Meteológica; undefined si no está configurado o no existe. */
export async function ObtenerCapacidadInstaladaMeteologicaMw(facilityId: string): Promise<number | undefined> {
  if (!facilityId) {
    return undefined;
  }
  const centrales = await ObtenerCentralesMeteologica();
  return centrales?.find((central) => central.facilityId === facilityId)?.capacidadMw;
}
