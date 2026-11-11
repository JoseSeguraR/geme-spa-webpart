import { SPHttpClient, type SPHttpClientResponse } from '@microsoft/sp-http';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import type {
  FuncionPermiso,
  InstalacionesUsuario,
  PersonaEncontrada,
  UsuarioPermisos
} from '../../../models/permisosUsuarios/PermisosUsuarios';
import {
  NombreListaSistemaFunciones,
  NombreListaUsuariosInstalaciones
} from '../concentradorComun/NombresListasConcentrador';
import { ExtraerMensajeErrorSharePoint } from '../ExtraerMensajeErrorSharePoint';
import {
  ActualizarItemLista,
  CrearItemLista,
  ObtenerTodosLosItemsLista
} from '../listaGenerica/ListaSharePointServicio';
import type { RespuestaListaSharePoint } from '../RespuestaListaSharePoint';
import { SharePointRestError } from '../SharePointRestError';

/**
 * Réplica de `CONC/Administracion/admuserfn.aspx`: filas = usuarios del grupo «GEME - CONC - Todos los usuarios»;
 * columnas = funciones de SISTEMA_FUNCIONES de estos módulos; cada función es un grupo de SharePoint.
 */
export const GrupoTodosLosUsuariosConcentrador = 'GEME - CONC - Todos los usuarios';
/** Grupo general de GEME (legado `arrAllGroups`: se quita al desvincular y se agrega al dar de alta). */
export const GrupoTodosLosUsuariosGeme = 'GEME - Todos los Usuarios';
export const ModulosFuncionesConcentrador: readonly string[] = ['Concentrador', 'Control Sitio', 'COPE'];
/** El usuario conectado no puede quitarse las funciones de este módulo (legado `idBloqGrupo`). */
export const ModuloBloqueoPropio = 'Control Sitio';

const EncabezadosJson = {
  Accept: 'application/json;odata=nometadata',
  'Content-Type': 'application/json;odata=nometadata;charset=utf-8'
};

async function ValidarRespuesta(response: SPHttpClientResponse, operacion: string, url: string): Promise<void> {
  if (response.ok) {
    return;
  }
  const mensaje = await ExtraerMensajeErrorSharePoint(response);
  throw new SharePointRestError(operacion, url, response.status, response.statusText, mensaje);
}

function UrlWeb(context: WebPartContext): string {
  return context.pageContext.web.absoluteUrl;
}

function EscaparOData(texto: string): string {
  return texto.replace(/'/g, "''");
}

async function Post(context: WebPartContext, url: string, operacion: string, cuerpo?: unknown): Promise<SPHttpClientResponse> {
  const response = await context.spHttpClient.post(url, SPHttpClient.configurations.v1, {
    headers: EncabezadosJson,
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo)
  });
  await ValidarRespuesta(response, operacion, url);
  return response;
}

type ElementoFuncion = {
  ID?: number;
  Id?: number;
  MODULO?: string;
  ORDENMODULO?: number;
  FUNCION?: string;
  ORDENFUNCION?: number;
  DESCRIPCION_FUNCION?: string;
  GRUPO_SHAREPOINTId?: number;
  REQUIEREVALIDACION?: boolean;
};

export async function ObtenerFuncionesConcentrador(context: WebPartContext): Promise<FuncionPermiso[]> {
  const filtro = ModulosFuncionesConcentrador.map((m) => `MODULO eq '${EscaparOData(m)}'`).join(' or ');
  const elementos = await ObtenerTodosLosItemsLista<ElementoFuncion>(context, NombreListaSistemaFunciones, {
    select: 'ID,ORDENMODULO,MODULO,ORDENFUNCION,FUNCION,DESCRIPCION_FUNCION,GRUPO_SHAREPOINTId,REQUIEREVALIDACION',
    filter: filtro,
    orderby: 'ORDENMODULO asc,ORDENFUNCION asc'
  });
  return elementos
    .filter((e) => typeof e.GRUPO_SHAREPOINTId === 'number')
    .map((e) => ({
      id: Number(e.ID ?? e.Id),
      modulo: (e.MODULO ?? '').trim(),
      funcion: (e.FUNCION ?? '').trim(),
      descripcion: (e.DESCRIPCION_FUNCION ?? '').trim(),
      grupoId: e.GRUPO_SHAREPOINTId as number,
      requiereValidacion: e.REQUIEREVALIDACION === true
    }));
}

type ElementoUsuarioGrupo = {
  Id: number;
  Title?: string;
  LoginName?: string;
  Email?: string;
  Groups?: { Id: number }[];
};

/** Usuarios del grupo «GEME - CONC - Todos los usuarios» con los Id de todos sus grupos. */
export async function ObtenerUsuariosConcentrador(context: WebPartContext): Promise<UsuarioPermisos[]> {
  const usuarios: UsuarioPermisos[] = [];
  let url: string | undefined =
    `${UrlWeb(context)}/_api/web/sitegroups/getbyname('${encodeURIComponent(EscaparOData(GrupoTodosLosUsuariosConcentrador))}')/users` +
    '?$select=Id,Title,LoginName,Email,Groups/Id&$expand=Groups&$orderby=Title&$top=5000';

  while (url) {
    const response: SPHttpClientResponse = await context.spHttpClient.get(url, SPHttpClient.configurations.v1);
    await ValidarRespuesta(response, 'ObtenerUsuariosConcentrador', url);
    const json = (await response.json()) as RespuestaListaSharePoint<ElementoUsuarioGrupo>;
    for (const elemento of json.value) {
      usuarios.push({
        id: elemento.Id,
        nombre: (elemento.Title ?? elemento.LoginName ?? '').trim(),
        login: elemento.LoginName ?? '',
        correo: (elemento.Email ?? '').trim(),
        grupos: (elemento.Groups ?? []).map((g) => g.Id)
      });
    }
    url = json['@odata.nextLink'];
  }
  return usuarios;
}

const CacheIdGrupos = new Map<string, number>();

export async function ObtenerIdGrupoPorNombre(context: WebPartContext, nombre: string): Promise<number> {
  const clave = `${UrlWeb(context)}|${nombre}`;
  const enCache = CacheIdGrupos.get(clave);
  if (enCache !== undefined) {
    return enCache;
  }
  const url = `${UrlWeb(context)}/_api/web/sitegroups/getbyname('${encodeURIComponent(EscaparOData(nombre))}')?$select=Id`;
  const response = await context.spHttpClient.get(url, SPHttpClient.configurations.v1);
  await ValidarRespuesta(response, 'ObtenerIdGrupoPorNombre', url);
  const json = (await response.json()) as { Id: number };
  CacheIdGrupos.set(clave, json.Id);
  return json.Id;
}

export async function AgregarUsuarioAGrupo(context: WebPartContext, grupoId: number, loginName: string): Promise<void> {
  await Post(context, `${UrlWeb(context)}/_api/web/sitegroups(${grupoId})/users`, 'AgregarUsuarioAGrupo', {
    LoginName: loginName
  });
}

export async function QuitarUsuarioDeGrupo(context: WebPartContext, grupoId: number, loginName: string): Promise<void> {
  await Post(
    context,
    `${UrlWeb(context)}/_api/web/sitegroups(${grupoId})/users/removeByLoginName`,
    'QuitarUsuarioDeGrupo',
    { loginName }
  );
}

/**
 * Desvincula como el legado: quita al usuario de los grupos de todas las funciones de la matriz y de
 * los grupos «todos los usuarios» (GEME y Concentrador). Los grupos en que no está se omiten.
 */
export async function DesvincularUsuario(
  context: WebPartContext,
  usuario: UsuarioPermisos,
  funciones: readonly FuncionPermiso[]
): Promise<void> {
  const grupos = funciones.map((f) => f.grupoId);
  for (const nombre of [GrupoTodosLosUsuariosConcentrador, GrupoTodosLosUsuariosGeme]) {
    grupos.push(await ObtenerIdGrupoPorNombre(context, nombre));
  }
  const unicos = grupos.filter((id, i) => grupos.indexOf(id) === i && usuario.grupos.indexOf(id) >= 0);
  for (const grupoId of unicos) {
    await QuitarUsuarioDeGrupo(context, grupoId, usuario.login);
  }
}

type EntidadPeoplePicker = {
  Key?: string;
  DisplayText?: string;
  Description?: string;
  EntityData?: { Email?: string };
};

/** Búsqueda de personas del directorio (mismo servicio que el selector de personas de SharePoint). */
export async function BuscarPersonas(context: WebPartContext, texto: string): Promise<PersonaEncontrada[]> {
  const url = `${UrlWeb(context)}/_api/SP.UI.ApplicationPages.ClientPeoplePickerWebServiceInterface.clientPeoplePickerSearchUser`;
  const response = await Post(context, url, 'BuscarPersonas', {
    queryParams: {
      QueryString: texto,
      MaximumEntitySuggestions: 15,
      AllowEmailAddresses: false,
      AllowMultipleEntities: false,
      AllUrlZones: false,
      PrincipalSource: 15,
      PrincipalType: 1
    }
  });
  const json = (await response.json()) as { value?: string };
  const entidades = JSON.parse(json.value ?? '[]') as EntidadPeoplePicker[];
  return entidades
    .filter((e) => e.Key)
    .map((e) => ({
      login: e.Key as string,
      nombre: (e.DisplayText ?? e.Key ?? '').trim(),
      correo: (e.EntityData?.Email ?? e.Description ?? '').trim()
    }));
}

/** Da de alta al usuario en el Concentrador: lo asegura en el sitio y lo agrega a los grupos «todos los usuarios». */
export async function AgregarUsuarioConcentrador(context: WebPartContext, persona: PersonaEncontrada): Promise<void> {
  const response = await Post(context, `${UrlWeb(context)}/_api/web/ensureuser`, 'EnsureUser', {
    logonName: persona.login
  });
  const usuario = (await response.json()) as { LoginName?: string };
  const login = usuario.LoginName ?? persona.login;
  for (const nombre of [GrupoTodosLosUsuariosGeme, GrupoTodosLosUsuariosConcentrador]) {
    await AgregarUsuarioAGrupo(context, await ObtenerIdGrupoPorNombre(context, nombre), login);
  }
}

type ElementoUsuarioInstalaciones = {
  Id: number;
  USUARIOId?: number;
  INSTALACIONESId?: number[] | { results?: number[] };
};

function NormalizarIds(valor: ElementoUsuarioInstalaciones['INSTALACIONESId']): number[] {
  if (Array.isArray(valor)) {
    return valor.filter((v) => typeof v === 'number');
  }
  return Array.isArray(valor?.results) ? valor.results : [];
}

/** Centrales asignadas a cada usuario (CONC_MANTENEDOR_USUARIOSINSTALACIONES: un registro por usuario). */
export async function ObtenerInstalacionesPorUsuario(context: WebPartContext): Promise<Map<number, InstalacionesUsuario>> {
  const elementos = await ObtenerTodosLosItemsLista<ElementoUsuarioInstalaciones>(context, NombreListaUsuariosInstalaciones, {
    select: 'Id,USUARIOId,INSTALACIONESId',
    orderby: 'Id asc'
  });
  const mapa = new Map<number, InstalacionesUsuario>();
  for (const elemento of elementos) {
    if (typeof elemento.USUARIOId === 'number' && !mapa.has(elemento.USUARIOId)) {
      mapa.set(elemento.USUARIOId, { registroId: elemento.Id, instalacionIds: NormalizarIds(elemento.INSTALACIONESId) });
    }
  }
  return mapa;
}

export async function GuardarInstalacionesUsuario(
  context: WebPartContext,
  usuarioId: number,
  registroId: number | undefined,
  instalacionIds: number[]
): Promise<number> {
  const cuerpo = {
    'INSTALACIONESId@odata.type': 'Collection(Edm.Int32)',
    INSTALACIONESId: instalacionIds
  };
  if (registroId !== undefined) {
    await ActualizarItemLista(context, NombreListaUsuariosInstalaciones, registroId, cuerpo);
    return registroId;
  }
  return CrearItemLista(context, NombreListaUsuariosInstalaciones, { USUARIOId: usuarioId, ...cuerpo });
}
