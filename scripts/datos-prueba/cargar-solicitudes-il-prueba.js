/*
 * Datos de prueba de Solicitudes IL (COR Conecta › Concentrador).
 *
 * Crea solicitudes en CONC_LISTA_SOLICITUDES_IL igual que el alta de la app
 * (RegistrarNuevaSolicitudIlServicio): ítem + registros en ENGINE_BITACORA + TAREAACTUAL.
 * NO llama a SIOD: los registros de prueba solo existen en SharePoint.
 *
 * Uso (solo en el sitio de DESARROLLO, nunca en producción):
 *   1. Abrir la página donde está el web part GEME SPA (la de Solicitudes IL), con un usuario que
 *      pueda editar las listas.
 *   2. Pegar este archivo completo en la consola del navegador (F12) y ejecutar:
 *        await cargarSolicitudesIlPrueba()     // crea CONFIG.cantidad solicitudes
 *        await eliminarSolicitudesIlPrueba()   // borra las de prueba y su bitácora
 *
 * Las solicitudes de prueba se reconocen por el prefijo de ID CEN (CONFIG.prefijoIdCen).
 *
 * IDs de tareas y acciones del flujo: si en CONFIG quedan en null, el script los obtiene solo:
 *   a) de las propiedades guardadas del web part en la página abierta, o
 *   b) de la bitácora de solicitudes IL ya existentes (necesita al menos una Finalizada y una Anulada).
 * Se pueden fijar a mano si ambos caminos fallan.
 */
var CONFIG = {
  /** URL del sitio con las listas; por defecto, el sitio de la página abierta. */
  webUrl: location.origin + location.pathname.split('/SitePages/')[0].replace(/\/$/, ''),
  cantidad: 100,
  prefijoIdCen: 'PRUEBA-IL-',
  /** Reparto de estados (proporciones). */
  reparto: { Vigente: 0.6, Finalizada: 0.25, Anulada: 0.15 },
  /** IDs del flujo (panel de propiedades del web part); null = detectar automáticamente. */
  idTareaCrear: null,
  idTareaFinalizar: null,
  idTareaAnular: null,
  idAccionFinalizar: null,
  idAccionAnular: null,
  /** Solicitudes creadas en paralelo (bajo para no gatillar throttling). */
  concurrencia: 4
};

var LISTA_SOLICITUDES = 'CONC_LISTA_SOLICITUDES_IL';
var LISTA_BITACORA = 'ENGINE_BITACORA';
var LISTA_CENTRALES = 'CONC_MANTENEDOR_INSTALACIONES';
var TIPO_REGISTRO = 'SOLICITUDES_IL';

var DESCRIPCIONES = [
  'Mantenimiento preventivo de inversores.',
  'Cambio de transformador de servicios auxiliares.',
  'Revisión de protecciones en paño de línea.',
  'Lavado de módulos fotovoltaicos sector norte.',
  'Inspección termográfica de celdas de media tensión y tableros de baja tensión, con registro fotográfico y reporte de hallazgos.',
  'Reemplazo de seccionador.\nRequiere corte programado del alimentador.\nCoordinar con despacho.',
  'Pruebas de sincronismo y puesta en servicio de la nueva bahía de transformación 220/23 kV, incluyendo verificación de esquemas de protección y comunicaciones SCADA.',
  'Ajuste de consignas de potencia reactiva.',
  'Mantenimiento correctivo del aerogenerador WTG-07 por falla en el sistema de pitch.\nSe estima indisponibilidad parcial durante la intervención.',
  'Actualización de firmware del PPC.'
];

var CLAVES_FLUJO = ['idTareaCrear', 'idTareaFinalizar', 'idTareaAnular', 'idAccionFinalizar', 'idAccionAnular'];

function idsFaltantes() {
  return CLAVES_FLUJO.filter(function (clave) { return !Number.isInteger(CONFIG[clave]) || CONFIG[clave] <= 0; });
}

function completarSiFalta(clave, valor) {
  var numero = Number(valor);
  if (idsFaltantes().indexOf(clave) !== -1 && Number.isInteger(numero) && numero > 0) {
    CONFIG[clave] = numero;
  }
}

/** a) Propiedades del web part guardadas en la página abierta (CanvasContent1). */
async function detectarIdsDesdePagina(digest) {
  var archivo = "web/getfilebyserverrelativeurl('" + encodeURIComponent(decodeURIComponent(location.pathname).replace(/'/g, "''")) + "')/listItemAllFields?$select=CanvasContent1";
  var contenido = (await sp('GET', archivo, digest)).CanvasContent1 || '';
  var html = new DOMParser().parseFromString(contenido, 'text/html');
  html.querySelectorAll('[data-sp-webpartdata]').forEach(function (nodo) {
    var props = (JSON.parse(nodo.getAttribute('data-sp-webpartdata')) || {}).properties || {};
    completarSiFalta('idTareaCrear', props.concSolicitudesIlIdTareaCrear);
    completarSiFalta('idTareaFinalizar', props.concSolicitudesIlIdTareaFinalizar);
    completarSiFalta('idTareaAnular', props.concSolicitudesIlIdTareaAnular);
    completarSiFalta('idAccionFinalizar', props.concSolicitudesIlIdAccionFinalizar);
    completarSiFalta('idAccionAnular', props.concSolicitudesIlIdAccionAnular);
  });
}

/** b) Bitácora existente: el primer registro de una solicitud es siempre la tarea Crear. */
async function detectarIdsDesdeBitacora(digest) {
  var base = items(LISTA_BITACORA) + "?$select=Id,TAREAORIGENId,TAREAORIGEN_ESTADO,TAREADESTINOId,ACCIONAVANCEId&$filter=TIPO_REGISTRO eq '" + TIPO_REGISTRO + "'";
  var primero = (await sp('GET', base + '&$orderby=Id asc&$top=1', digest)).value[0];
  if (primero) completarSiFalta('idTareaCrear', primero.TAREAORIGENId);

  var registros = (await sp('GET', base + '&$orderby=Id desc&$top=2000', digest)).value;
  registros.forEach(function (r) {
    if (r.TAREAORIGEN_ESTADO === 'Finalizada') completarSiFalta('idTareaFinalizar', r.TAREAORIGENId);
    if (r.TAREAORIGEN_ESTADO === 'Anulada') completarSiFalta('idTareaAnular', r.TAREAORIGENId);
  });
  registros.forEach(function (r) {
    if (r.TAREADESTINOId && r.TAREADESTINOId === CONFIG.idTareaFinalizar) completarSiFalta('idAccionFinalizar', r.ACCIONAVANCEId);
    if (r.TAREADESTINOId && r.TAREADESTINOId === CONFIG.idTareaAnular) completarSiFalta('idAccionAnular', r.ACCIONAVANCEId);
  });
}

async function resolverIdsFlujo(digest) {
  if (idsFaltantes().length) {
    try {
      await detectarIdsDesdePagina(digest);
    } catch (error) {
      console.warn('[Solicitudes IL prueba] No se pudieron leer las propiedades de esta página:', error.message);
    }
  }
  if (idsFaltantes().length) {
    await detectarIdsDesdeBitacora(digest);
  }
  var faltan = idsFaltantes();
  if (faltan.length) {
    throw new Error(
      'No se pudieron detectar: ' + faltan.join(', ') + '. Abre la página que tiene el web part, ' +
      'o crea desde la app al menos una solicitud Finalizada y una Anulada, o fíjalos a mano en CONFIG.'
    );
  }
  console.log('[Solicitudes IL prueba] IDs del flujo:', CLAVES_FLUJO.reduce(function (o, c) { o[c] = CONFIG[c]; return o; }, {}));
}

async function obtenerDigest() {
  var r = await fetch(CONFIG.webUrl + '/_api/contextinfo', {
    method: 'POST',
    headers: { Accept: 'application/json;odata=nometadata' },
    credentials: 'include'
  });
  if (!r.ok) throw new Error('No se pudo obtener el digest (' + r.status + '). ¿La URL del sitio es correcta? ' + CONFIG.webUrl);
  return (await r.json()).FormDigestValue;
}

async function sp(metodo, ruta, digest, cuerpo, extraHeaders) {
  var headers = Object.assign(
    {
      Accept: 'application/json;odata=nometadata',
      'Content-Type': 'application/json;odata=nometadata;charset=utf-8',
      'X-RequestDigest': digest
    },
    extraHeaders || {}
  );
  var r = await fetch(CONFIG.webUrl + '/_api/' + ruta, {
    method: metodo,
    headers: headers,
    credentials: 'include',
    body: cuerpo ? JSON.stringify(cuerpo) : undefined
  });
  if (!r.ok) {
    var texto = await r.text();
    throw new Error(metodo + ' ' + ruta + ' → ' + r.status + ' ' + texto.slice(0, 300));
  }
  return r.status === 204 || metodo === 'DELETE' ? null : r.json();
}

function items(lista) {
  return "web/lists/getbytitle('" + encodeURIComponent(lista) + "')/items";
}

function azar(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function estadoPara(indice) {
  var p = (indice + 0.5) / CONFIG.cantidad;
  if (p < CONFIG.reparto.Vigente) return 'Vigente';
  if (p < CONFIG.reparto.Vigente + CONFIG.reparto.Finalizada) return 'Finalizada';
  return 'Anulada';
}

async function crearBitacora(digest, idSolicitud, datos) {
  var cuerpo = {
    Title: TIPO_REGISTRO + ' ' + idSolicitud,
    ID_REGISTRO: idSolicitud,
    TIPO_REGISTRO: TIPO_REGISTRO,
    TAREAORIGENId: datos.tareaOrigenId,
    TAREAORIGEN_ESTADO: datos.estado,
    TAREAORIGEN_FECHAINGRESO: datos.ingreso,
    CLASIFICACION_TAREA: 'FLUJO',
    ES_TAREA_PENDIENTE: '0'
  };
  if (datos.salida) {
    cuerpo.TAREAORIGEN_FECHASALIDA = datos.salida;
    cuerpo.ACCIONAVANCEId = datos.accionId;
    cuerpo.USUARIOAVANCEId = datos.usuarioId;
    cuerpo.TAREADESTINOId = datos.tareaDestinoId;
  }
  return (await sp('POST', items(LISTA_BITACORA), digest, cuerpo)).Id;
}

async function crearUna(digest, indice, centrales, usuarioId) {
  var estado = estadoPara(indice);
  var inicio = new Date();
  inicio.setDate(inicio.getDate() + azar(-120, 60));
  inicio.setHours(azar(0, 23), [0, 15, 30, 45][azar(0, 3)], 0, 0);
  var fin = new Date(inicio.getTime() + azar(1, 72) * 3600 * 1000);
  var ahora = new Date().toISOString();

  var cuerpo = {
    Title: CONFIG.prefijoIdCen + String(indice + 1).padStart(3, '0'),
    ID_CEN: CONFIG.prefijoIdCen + String(indice + 1).padStart(3, '0'),
    INSTALACIONId: centrales[indice % centrales.length],
    DESCRIPCION: DESCRIPCIONES[indice % DESCRIPCIONES.length].slice(0, 200),
    FECHA_INICIO: inicio.toISOString()
  };
  if (estado === 'Finalizada') cuerpo.FECHA_FIN = fin.toISOString();

  var idSolicitud = (await sp('POST', items(LISTA_SOLICITUDES), digest, cuerpo)).Id;

  var idActual;
  if (estado === 'Vigente') {
    idActual = await crearBitacora(digest, idSolicitud, { tareaOrigenId: CONFIG.idTareaCrear, estado: 'Vigente', ingreso: ahora });
  } else {
    var finaliza = estado === 'Finalizada';
    var tareaDestino = finaliza ? CONFIG.idTareaFinalizar : CONFIG.idTareaAnular;
    await crearBitacora(digest, idSolicitud, {
      tareaOrigenId: CONFIG.idTareaCrear,
      estado: 'Vigente',
      ingreso: ahora,
      salida: ahora,
      accionId: finaliza ? CONFIG.idAccionFinalizar : CONFIG.idAccionAnular,
      usuarioId: usuarioId,
      tareaDestinoId: tareaDestino
    });
    idActual = await crearBitacora(digest, idSolicitud, { tareaOrigenId: tareaDestino, estado: estado, ingreso: ahora });
  }

  await sp('POST', items(LISTA_SOLICITUDES) + '(' + idSolicitud + ')', digest, { TAREAACTUALId: idActual }, {
    'IF-MATCH': '*',
    'X-HTTP-Method': 'MERGE'
  });
  return estado;
}

async function enLotes(total, concurrencia, tarea) {
  var siguiente = 0;
  var hechos = 0;
  async function trabajador() {
    while (siguiente < total) {
      var indice = siguiente++;
      await tarea(indice);
      hechos++;
      if (hechos % 10 === 0 || hechos === total) console.log('[Solicitudes IL prueba] ' + hechos + '/' + total);
    }
  }
  var trabajadores = [];
  for (var i = 0; i < concurrencia; i++) trabajadores.push(trabajador());
  await Promise.all(trabajadores);
}

async function cargarSolicitudesIlPrueba() {
  var digest = await obtenerDigest();
  await resolverIdsFlujo(digest);
  var usuarioId = (await sp('GET', 'web/currentuser?$select=Id', digest)).Id;

  var existentes = await sp('GET', items(LISTA_SOLICITUDES) + "?$select=Id&$top=1&$filter=startswith(ID_CEN,'" + CONFIG.prefijoIdCen + "')", digest);
  if (existentes.value.length) {
    throw new Error('Ya hay solicitudes con el prefijo ' + CONFIG.prefijoIdCen + '. Ejecuta eliminarSolicitudesIlPrueba() o cambia el prefijo.');
  }

  var centrales = (await sp('GET', items(LISTA_CENTRALES) + '?$select=Id&$top=500', digest)).value.map(function (c) { return c.Id; });
  if (!centrales.length) throw new Error('No hay centrales en ' + LISTA_CENTRALES + '.');

  var conteo = { Vigente: 0, Finalizada: 0, Anulada: 0 };
  await enLotes(CONFIG.cantidad, CONFIG.concurrencia, async function (indice) {
    conteo[await crearUna(digest, indice, centrales, usuarioId)]++;
  });
  console.log('[Solicitudes IL prueba] Listo:', conteo);
  return conteo;
}

async function eliminarSolicitudesIlPrueba() {
  var digest = await obtenerDigest();
  var solicitudes = (await sp('GET', items(LISTA_SOLICITUDES) + "?$select=Id&$top=5000&$filter=startswith(ID_CEN,'" + CONFIG.prefijoIdCen + "')", digest)).value;
  await enLotes(solicitudes.length, CONFIG.concurrencia, async function (indice) {
    var id = solicitudes[indice].Id;
    var bitacoras = (await sp('GET', items(LISTA_BITACORA) + "?$select=Id&$filter=Title eq '" + TIPO_REGISTRO + ' ' + id + "'", digest)).value;
    await sp('POST', items(LISTA_SOLICITUDES) + '(' + id + ')', digest, { TAREAACTUALId: null }, { 'IF-MATCH': '*', 'X-HTTP-Method': 'MERGE' });
    for (var b of bitacoras) {
      await sp('POST', items(LISTA_BITACORA) + '(' + b.Id + ')', digest, null, { 'IF-MATCH': '*', 'X-HTTP-Method': 'DELETE' });
    }
    await sp('POST', items(LISTA_SOLICITUDES) + '(' + id + ')', digest, null, { 'IF-MATCH': '*', 'X-HTTP-Method': 'DELETE' });
  });
  console.log('[Solicitudes IL prueba] Eliminadas: ' + solicitudes.length);
  return solicitudes.length;
}
