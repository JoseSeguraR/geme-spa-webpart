import { SPHttpClient, type SPHttpClientResponse } from '@microsoft/sp-http';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import { NombreListaUsuariosInstalaciones } from '../../../components/vistas/cor-conecta/concentrador/administrador/constantesSolicitudesIl';
import type { RespuestaListaSharePoint } from '../RespuestaListaSharePoint';
import { SharePointRestError } from '../SharePointRestError';

type ElementoUsuarioInstalacionesSharePoint = {
  Id?: number;
  INSTALACIONESId?: number[] | { results?: number[] };
};

async function ValidarRespuesta(response: SPHttpClientResponse, operacion: string, url: string): Promise<void> {
  if (response.ok) {
    return;
  }
  throw new SharePointRestError(operacion, url, response.status, response.statusText);
}

function ObtenerIdUsuarioActual(context: WebPartContext): number | undefined {
  const id = context.pageContext.legacyPageContext.userId;
  if (typeof id !== 'number' || id <= 0) {
    return undefined;
  }
  return id;
}

function NormalizarIdsLookupMulti(
  valor: ElementoUsuarioInstalacionesSharePoint['INSTALACIONESId']
): number[] {
  if (valor === undefined || valor === null) {
    return [];
  }
  if (Array.isArray(valor)) {
    return valor.filter((id): id is number => typeof id === 'number' && id > 0);
  }
  const resultados = valor.results;
  if (!Array.isArray(resultados)) {
    return [];
  }
  return resultados.filter((id): id is number => typeof id === 'number' && id > 0);
}

/**
 * Instalaciones asignadas al usuario en CONC_MANTENEDOR_USUARIOSINSTALACIONES.
 * Si hay más de un ítem para el mismo usuario, se usa el primero devuelto por SharePoint.
 */
export async function ObtenerIdsInstalacionesUsuarioActual(context: WebPartContext): Promise<number[]> {
  const usuarioId = ObtenerIdUsuarioActual(context);
  if (usuarioId === undefined) {
    return [];
  }

  const webUrl = context.pageContext.web.absoluteUrl;
  const tituloLista = encodeURIComponent(NombreListaUsuariosInstalaciones);
  const filtro = `USUARIOId eq ${usuarioId}`;
  const url =
    `${webUrl}/_api/web/lists/getbytitle('${tituloLista}')/items` +
    `?$select=Id,INSTALACIONESId&$filter=${encodeURIComponent(filtro)}&$top=1`;

  const response = await context.spHttpClient.get(url, SPHttpClient.configurations.v1);
  await ValidarRespuesta(response, 'ObtenerIdsInstalacionesUsuarioActual', url);

  const json = (await response.json()) as RespuestaListaSharePoint<ElementoUsuarioInstalacionesSharePoint>;
  const primerItem = json.value[0];
  if (!primerItem) {
    return [];
  }

  const ids = NormalizarIdsLookupMulti(primerItem.INSTALACIONESId);
  return Array.from(new Set(ids));
}
