import { SPHttpClient, type SPHttpClientResponse } from '@microsoft/sp-http';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import { NombreListaIndisponibilidades } from '../../../components/vistas/cor-conecta/concentrador/operador-renovable/constantesOperadorRenovable';
import type { SubequipoOperador } from '../../../models/operadorRenovable/CatalogoEquiposOperador';
import type {
  IndisponibilidadSubequipoSolicitud,
  ResumenIndisponibilidadesSolicitud,
  SolicitudOperadorRenovableFila
} from '../../../models/operadorRenovable/SolicitudOperadorRenovable';
import type { RespuestaListaSharePoint } from '../RespuestaListaSharePoint';
import { SharePointRestError } from '../SharePointRestError';
import { ObtenerMapaSubequiposPorId } from './SubequiposServicio';
import { CalcularMwFueraServicio } from './UtilidadesCapacidadSubequipo';

type ElementoIndisponibilidadSharePoint = {
  Id?: number;
  ID_SOLICITUDId?: number;
  SUBEQUIPOId?: number;
};

const TamanoLoteFiltroIds = 35;

async function ValidarRespuesta(response: SPHttpClientResponse, operacion: string, url: string): Promise<void> {
  if (response.ok) {
    return;
  }
  throw new SharePointRestError(operacion, url, response.status, response.statusText);
}

function NormalizarIndisponibilidad(
  elemento: ElementoIndisponibilidadSharePoint,
  mapaSubequipos: ReadonlyMap<number, SubequipoOperador>
): IndisponibilidadSubequipoSolicitud | undefined {
  const idSolicitudConcentrador = elemento.ID_SOLICITUDId;
  const subequipoId = elemento.SUBEQUIPOId;
  if (
    typeof elemento.Id !== 'number' ||
    typeof idSolicitudConcentrador !== 'number' ||
    typeof subequipoId !== 'number'
  ) {
    return undefined;
  }

  const sub = mapaSubequipos.get(subequipoId);
  const codigo = (sub?.codigo ?? `#${subequipoId}`).trim();
  const capacidadMw = sub?.capacidadMw ?? 0;
  const capacidadActualMw = sub?.capacidadActualMw ?? capacidadMw;
  const mwFueraServicio =
    sub !== undefined ? CalcularMwFueraServicio(sub.capacidadMw, sub.capacidadActualMw) : 0;

  return {
    id: elemento.Id,
    idSolicitudConcentrador,
    subequipoId,
    codigo,
    tipoEtiqueta: (sub?.tipoNombre ?? sub?.tipoCodigo ?? '').trim() || '—',
    capacidadMw,
    capacidadesMwOpciones: sub?.capacidadesMwOpciones ?? (capacidadMw > 0 ? [capacidadMw] : []),
    capacidadActualMw,
    mwFueraServicio,
    disponibilidad: sub?.disponibilidad ?? 'Disponible',
    motivo: sub?.motivo
  };
}

function ConstruirUrlIndisponibilidades(webUrl: string, tituloLista: string, filtro: string): string {
  return (
    `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items` +
    `?$select=Id,ID_SOLICITUDId,SUBEQUIPOId` +
    `&$filter=${encodeURIComponent(filtro)}&$top=5000`
  );
}

async function ObtenerIndisponibilidadesPorLoteIds(
  context: WebPartContext,
  idsSolicitud: readonly number[],
  mapaSubequipos: ReadonlyMap<number, SubequipoOperador>
): Promise<IndisponibilidadSubequipoSolicitud[]> {
  if (idsSolicitud.length === 0) {
    return [];
  }

  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaIndisponibilidades);
  const filtro = idsSolicitud.map((id) => `ID_SOLICITUDId eq ${id}`).join(' or ');
  const url = ConstruirUrlIndisponibilidades(webUrl, tituloLista, filtro);
  const response = await context.spHttpClient.get(url, SPHttpClient.configurations.v1);

  await ValidarRespuesta(response, 'ObtenerIndisponibilidadesPorLoteIds', url);

  const json = (await response.json()) as RespuestaListaSharePoint<ElementoIndisponibilidadSharePoint>;
  return json.value
    .map((elemento) => NormalizarIndisponibilidad(elemento, mapaSubequipos))
    .filter((fila): fila is IndisponibilidadSubequipoSolicitud => fila !== undefined);
}

async function ObtenerTodasIndisponibilidadesParaSolicitudes(
  context: WebPartContext,
  idsSolicitud: readonly number[]
): Promise<Map<number, IndisponibilidadSubequipoSolicitud[]>> {
  const mapa = new Map<number, IndisponibilidadSubequipoSolicitud[]>();
  for (const id of idsSolicitud) {
    mapa.set(id, []);
  }

  const mapaSubequipos = await ObtenerMapaSubequiposPorId(context);

  for (let i = 0; i < idsSolicitud.length; i += TamanoLoteFiltroIds) {
    const lote = idsSolicitud.slice(i, i + TamanoLoteFiltroIds);
    const filas = await ObtenerIndisponibilidadesPorLoteIds(context, lote, mapaSubequipos);
    for (const fila of filas) {
      const lista = mapa.get(fila.idSolicitudConcentrador) ?? [];
      lista.push(fila);
      mapa.set(fila.idSolicitudConcentrador, lista);
    }
  }

  return mapa;
}

function ConstruirResumen(filas: IndisponibilidadSubequipoSolicitud[]): ResumenIndisponibilidadesSolicitud {
  const indisponibles = filas.filter((f) => f.disponibilidad === 'Indisponible').length;
  const primerCodigo = filas[0]?.codigo ?? '—';
  return {
    total: filas.length,
    indisponibles,
    primerCodigo,
    filas
  };
}

export async function ObtenerIndisponibilidadesPorSolicitud(
  context: WebPartContext,
  idSolicitudConcentrador: number
): Promise<IndisponibilidadSubequipoSolicitud[]> {
  const mapaSubequipos = await ObtenerMapaSubequiposPorId(context);
  return ObtenerIndisponibilidadesPorLoteIds(context, [idSolicitudConcentrador], mapaSubequipos);
}

export async function EnriquecerSolicitudesConIndisponibilidades(
  context: WebPartContext,
  filasBase: Omit<
    SolicitudOperadorRenovableFila,
    'equiposResumen' | 'cantidadSubequipos' | 'subequiposIndisponibles' | 'subequiposTotal' | 'subequipos'
  >[]
): Promise<SolicitudOperadorRenovableFila[]> {
  if (filasBase.length === 0) {
    return [];
  }

  const ids = filasBase.map((f) => f.id);
  const mapa = await ObtenerTodasIndisponibilidadesParaSolicitudes(context, ids);

  return filasBase.map((fila) => {
    const indisponibilidades = mapa.get(fila.id) ?? [];
    const resumen = ConstruirResumen(indisponibilidades);
    const equiposResumen =
      resumen.total <= 1 ? resumen.primerCodigo : `${resumen.total} equipos`;

    return {
      ...fila,
      equiposResumen,
      cantidadSubequipos: resumen.total,
      subequiposTotal: resumen.total,
      subequiposIndisponibles: resumen.indisponibles,
      subequipos: indisponibilidades
    };
  });
}
