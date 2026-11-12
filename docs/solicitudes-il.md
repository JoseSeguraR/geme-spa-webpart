# Solicitudes IL

Módulo de negocio del Concentrador (COR Conecta). La carcasa, el menú y la grilla que usa están descritos en [arquitectura-spa.md](arquitectura-spa.md).

Una solicitud IL es un ítem de `CONC_LISTA_SOLICITUDES_IL`. El estado visible (Vigente, Finalizada o Anulada) no es una columna de esa lista: sale del registro vigente de `ENGINE_BITACORA`, apuntado por el lookup `TAREAACTUAL`.

## Perfiles y rutas

La misma pantalla se monta tres veces. Cada entrada fija el perfil y delega en `VistaSolicitudesIlContenido`.

| Perfil | Ruta (`#/…`) | Entrada |
| --- | --- | --- |
| Administrador | `cor-conecta/concentrador/administrador/solicitudes-il` | `administrador/VistaSolicitudesIl.tsx` |
| Solicitante | `cor-conecta/concentrador/solicitante/solicitudes-il` | `solicitante/VistaSolicitudesIl.tsx` |
| Despachador | `cor-conecta/concentrador/despachador/solicitudes-il` | `despachador/VistaSolicitudesIl.tsx` |

Las constantes están en el `rutas.ts` de cada perfil. El registro del dominio es `constants/registro-vistas/corConecta.ts`.

El ítem de menú que se resalta es el ancla `…/solicitudes` (no `…/solicitudes-il`). Esas anclas están en `constants/AnclasMenuGrupoRuta.ts`.

La barra de pestañas todavía abre páginas clásicas del sitio (`PerfilVistaSolicitudesIl.ts`): Solicitudes y Guías de maniobra, una URL por perfil. Guías de maniobra aún no es una ruta de esta SPA.

| Perfil | Crear solicitud | Acciones de fila |
| --- | --- | --- |
| Administrador | Sí | Ver, bitácora, clonar, gestionar |
| Despachador | Sí | Ver, bitácora, clonar, gestionar |
| Solicitante | No | Ver y bitácora |

El solicitante solo ve solicitudes de las instalaciones asignadas en `CONC_MANTENEDOR_USUARIOSINSTALACIONES` (módulo `Concentrador`). Si no tiene instalaciones, la grilla queda vacía. Administrador y despachador cargan todas las centrales de `CONC_MANTENEDOR_INSTALACIONES`.

## Interfaz

`VistaSolicitudesIlContenido` vive en `components/vistas/cor-conecta/concentrador/solicitudes-il/` y concentra filtros, grilla y modales. Los tres perfiles no duplican esa pantalla.

- Filtro de estado (radios): Vigente (inicial), Finalizada, Anulada. El filtro se aplica al confirmar, no al mover el radio.
- Filtro opcional por central.
- Búsqueda de texto, paginación y orden, delegados a `GrillaServidorMui` a través de `GrillaSolicitudesIl` y `UseSolicitudesIlLista`.
- Modales: nueva, ver, bitácora y gestionar. Clonar reabre el modal de alta con la solicitud de origen.

El menú de acciones de cada fila (`DesplegableAccionesFila`) se dibuja en un portal dentro de `.gemeSpaBootstrap`, para no quedar recortado por la grilla.

## Listas

| Lista | Uso |
| --- | --- |
| `CONC_LISTA_SOLICITUDES_IL` | Solicitud: `ID_CEN`, `INSTALACION`, `DESCRIPCION` (texto, hasta 200 caracteres en la UI), `DESCRIPCION_LARGA` (nota; solo la lee y escribe Gestionar), `FECHA_INICIO`, `FECHA_FIN`, lookup `TAREAACTUAL` y adjuntos. |
| `ENGINE_BITACORA` | Historial de flujo. Tipo de registro `SOLICITUDES_IL`, clasificación `FLUJO`. |
| `CONC_MANTENEDOR_INSTALACIONES` | Centrales. En pantalla se muestran como «Central»; hacia SIOD se envía `codigoSiod`. |
| `CONC_MANTENEDOR_USUARIOSINSTALACIONES` | Instalaciones permitidas del usuario actual (perfil solicitante). |

El estado que pinta la grilla es la columna adicional `TAREAACTUAL:TAREAORIGEN_ESTADO`. SharePoint trunca el nombre interno a `TAREAACTUAL_x003a_TAREAORIGEN_ES`. Cualquier valor distinto de `Finalizada` o `Anulada` se presenta como `Vigente`.

## Consulta de la grilla

`UseSolicitudesIlLista` pide cada página con `RenderListDataAsStream` (`ObtenerPaginaSolicitudesIlRenderListData`). El CAML lo arma `ConstruirViewXmlSolicitudesIl`:

- `Where` por estado y, si corresponde, por una central o por el conjunto de instalaciones del solicitante.
- `OrderBy` del campo elegido y, como desempate, `ID` ascendente.
- `RowLimit` paginado.

**Mostrar todo.** El selector de la grilla ofrece 10, 25, 50, 100 y «Mostrar todo» (`TamanoPaginaTodos = -1`, de `components/grilla`). Con `-1`, `UseSolicitudesIlLista` no usa la paginación por tokens: pide lotes de `TamanoLoteCargaCompletaSolicitudesIl` (500, en `constantesSolicitudesIl.ts`) siguiendo `NextHref` hasta agotar la consulta, con los mismos filtros, búsqueda y orden, y entrega todas las filas con `hayPaginaSiguiente = false`. Si el efecto se cancela entre lotes (cambio de filtro), descarta el resultado.

**Presentación.** `GrillaSolicitudesIl` activa `alturaAutomatica` (sin scroll vertical; las filas crecen con el texto) y `columnasAutoajustables` para `id`, `idCen`, `fechaInicio`, `fechaFin` y `estado`. `centralEtiqueta` y `descripcion` son `flex` con `cellClassName: 'cowork-celda-texto-largo'` (`white-space: pre-line`), así el texto se parte entre palabras y respeta saltos de línea sin scroll horizontal.

Mapa de columnas de la grilla a campos de lista: `id` → `ID`, `idCen` → `ID_CEN`, `centralEtiqueta` → `INSTALACION`, `descripcion` → `DESCRIPCION`, `inicioProgramado` → `FECHA_INICIO`, `finProgramado` → `FECHA_FIN`, `estado` → columna de estado de la tarea actual.

Fechas: la grilla, los modales y la bitácora formatean con `FormatearFechaHoraVisible` y los formularios usan `CampoFechaHora24`; ambos en formato `dd/mm/aaaa hh:mm` de 24 h (ver «Fecha y hora» en [arquitectura-spa.md](arquitectura-spa.md)). Los valores se guardan en ISO UTC (`ConvertirEntradaLocalAIsoUtc`).

La paginación guarda el token de continuación de SharePoint por número de página. Un error HTTP deja la grilla en estado `error` con el mensaje; no se muestra como lista vacía.

## Alta

`RegistrarNuevaSolicitudIlCompleta` ejecuta estos pasos y va informando el progreso al modal:

1. Valida cada adjunto (`ValidarArchivoAdjuntoSharePoint`; tope 10 MB).
2. Rechaza un `ID_CEN` ya existente (`IdCenDuplicadoSolicitudIlError`).
3. Crea el ítem en `CONC_LISTA_SOLICITUDES_IL`.
4. Sube los adjuntos con el nombre saneado.
5. Abre la bitácora según el estado elegido en el formulario.
6. Escribe `TAREAACTUAL` con el id de esa bitácora.
7. Inserta la solicitud en SIOD.

Si el formulario nace Finalizada, la bitácora deja un tramo cerrado de Crear → Finalizar y un registro abierto en la tarea Finalizar. Si nace Vigente, solo abre el registro de la tarea Crear.

El estado de flujo del formulario no se guarda como columna `ESTADO` de la lista.

## Gestión y cambio de estado

`GuardarGestionSolicitudIlCompleta` actualiza campos y adjuntos (altas y bajas). Si el estado no cambió, termina ahí.

Si cambió, exige un `TAREAACTUAL` y llama a `EjecutarFlujoCambioEstadoSolicitudIl`: cierra la bitácora vigente (fecha de salida, acción de avance, usuario y tarea destino) y abre el registro nuevo, que pasa a ser `TAREAACTUAL`.

| Transición | Acción (panel) | Tarea destino |
| --- | --- | --- |
| Vigente → Finalizada | ID Acción Finalizar | ID Tarea Finalizar |
| Vigente → Anulada | ID Acción Anular | ID Tarea Anular |
| Finalizada → Vigente | ID Acción Reactivar | ID Tarea Reactivar |
| Anulada → Vigente | ID Acción Reactivar | ID Tarea Reactivar |

Finalizada ↔ Anulada no está definida: `ResolverTransicionEstadoSolicitudIl` no devuelve transición.

Al reactivar o anular, la actualización de la lista puede limpiar `FECHA_FIN` (`limpiarFechaFin`).

### Resumen de la descripción con IA

`ModalGestionarSolicitudIl` (solo lo abren Administrador y Despachador; el Solicitante tiene «solo ver bitácora») muestra **Descripción larga** (`DESCRIPCION_LARGA`) y **Descripción** (`DESCRIPCION`). Con la solicitud Vigente, el botón **Resumir con IA** llama a `ResumirDescripcionSolicitudIl` (`ResumenDescripcionIaServicio.ts`):

1. Toma `DESCRIPCION_LARGA` del formulario (sin guardar todavía). Si está vacía, el botón queda deshabilitado.
2. Si mide 200 caracteres o menos (`MaxLongitudDescripcionSolicitudIl`, tras `trim`), la copia en Descripción **sin llamar** a la Function.
3. Si es más larga, hace `POST` a la URL de la propiedad «URL resumen con IA» (`concSolicitudesIlUrlResumenIa`, `/api/ai/summarize-text?code=<llave>`) con `{ "text": <descripción larga>, "language": "es" }`. Espera hasta 90 s (`AbortController`). Pone `summary` en Descripción, cortado a 200 por seguridad.
4. Errores HTTP a mensaje en el formulario: 400 texto corto, 401/403 llave, 422 filtro de contenido de Azure, 503 Azure OpenAI sin configurar, 504 timeout; sin conexión o timeout del navegador, mensaje propio. No se escribe nada en la lista.

El resumen queda en el formulario para revisarlo y editarlo; se guarda con **Guardar** junto con los demás campos (`DESCRIPCION` y `DESCRIPCION_LARGA` en el mismo `MERGE`). Hacia SIOD sigue yendo solo `DESCRIPCION`. El resumen se muestra como valor de `textarea`, nunca como HTML.

La bitácora de solo lectura (`ModalBitacoraSolicitudIl`) consulta `ENGINE_BITACORA` filtrada por el id de la solicitud (`ConstruirViewXmlBitacoraSolicitudIl`).

## SIOD

Las llamadas a Azure Functions (Insert, Update, Delete) son **transparentes para el usuario**: no hay mensajes de progreso ni errores SIOD en pantalla. Insert y Update usan `POST` con JSON; Delete usa `DELETE` sin body. Tras guardar en SharePoint, la orden SIOD se lanza en segundo plano; cada petición espera como máximo **1,5 s** la respuesta (la consulta puede seguir en vuelo). **No se interpreta el HTTP**. El guardado en SharePoint y la bitácora no dependen del resultado SIOD.

`idCentral` es el valor numérico de `CODIGO_SIOD` en `CONC_MANTENEDOR_INSTALACIONES`. Las fechas van en ISO 8601 (mismo criterio que en la lista).

| Escenario | URL (propiedad WP) | Body / URL |
| --- | --- | --- |
| Alta Vigente / clon / Anulada→Vigente | Insert | `idsolicitud`, `idCentral`, `descripcion`, `fechainicio` |
| Alta Finalizada | Insert | Lo anterior + `fechaFin` |
| Edición Vigente (sin cambio de estado, mismo ID CEN) | Update | Solo campos modificados (opcionales) + `idsolicitud` |
| Edición Vigente con **cambio de ID CEN** (sigue Vigente) | Delete + Insert | Baja en SIOD del ID CEN **anterior**; alta Vigente con el ID CEN nuevo (sin `fechaFin`) |
| Vigente→Finalizada (mismo ID CEN) | Update | Parciales + `fechaFin` obligatoria en body |
| Vigente→Finalizada con **cambio de ID CEN** | Delete + Insert | Baja del ID anterior; Insert Finalizada con ID nuevo + `fechaFin` y resto de campos |
| Finalizada→Vigente | Update | `idsolicitud`, `fechaFin`: `null` |
| Vigente→Anulada | Delete | `DELETE` a URL con `{idsolicitud}` = **ID CEN que existía en SIOD al abrir el modal** (aunque en SharePoint se guarde otro ID CEN) |

En gestión con solicitud **Vigente**, si el usuario cambia `ID_CEN`, antes de actualizar SharePoint se valida unicidad (`ExisteSolicitudIlConIdCen`, excluyendo el ítem actual). En Finalizada o Anulada el ID CEN no es editable en pantalla; la reactivación usa el ID ya guardado en la lista.

Servicios: `SiodSolicitudIlApiServicio.ts`, `SincronizarSiodGestionSolicitudIlServicio.ts`, orquestados desde `RegistrarNuevaSolicitudIlServicio` y `GuardarGestionSolicitudIlServicio`.

## Datos de prueba

`scripts/datos-prueba/cargar-solicitudes-il-prueba.js` carga solicitudes de prueba en el sitio de **desarrollo** desde la consola del navegador (con la sesión del usuario, sin despliegue). Replica el alta: crea el ítem en `CONC_LISTA_SOLICITUDES_IL` (`ID_CEN` con prefijo `PRUEBA-IL-`, central rotando entre las de `CONC_MANTENEDOR_INSTALACIONES`, descripciones cortas, largas y con saltos de línea, fechas entre −120 y +60 días), sus registros en `ENGINE_BITACORA` y `TAREAACTUAL`. Reparte 60 % Vigente, 25 % Finalizada (con `FECHA_FIN`) y 15 % Anulada. **No llama a SIOD.**

Necesita los IDs del grupo «Solicitudes IL · Flujo (bitácora)» del panel de propiedades (tareas Crear, Finalizar y Anular; acciones Finalizar y Anular). Si en `CONFIG` quedan en `null`, los detecta: primero desde las propiedades del web part guardadas en la página abierta (`CanvasContent1`, atributo `data-sp-webpartdata`) y, si no, desde `ENGINE_BITACORA` (el registro más antiguo de `SOLICITUDES_IL` da la tarea Crear; los registros en estado Finalizada/Anulada dan esas tareas, y los que llegan a ellas, sus acciones). `cargarSolicitudesIlPrueba()` crea `CONFIG.cantidad` (100) y se niega si ya hay solicitudes con el prefijo; `eliminarSolicitudesIlPrueba()` borra las de prueba y su bitácora (por `Title` = `SOLICITUDES_IL {id}`).

## Panel de propiedades

`GemeSpaWebPart` muestra una página «COR Conecta» con estos grupos de Solicitudes IL (además del de Operador renovable), todos colapsados:

| Grupo | Propiedades |
| --- | --- |
| Solicitudes IL · Flujo (bitácora) | IDs enteros de tareas (Crear, Finalizar, Anular, Reactivar) y de acciones (Finalizar, Anular, Reactivar). Son ítems lookup de las listas del motor. |
| Solicitudes IL · Enlaces | URL del Excel vinculado. |
| Solicitudes IL · SIOD (Azure Functions) | URLs de insert, delete y update. |
| Solicitudes IL · Resumen con IA (Azure Functions) | «URL resumen con IA» (`concSolicitudesIlUrlResumenIa`): `https://<host>/api/ai/summarize-text?code=<llave>`. También la carga `scripts/configurar-propiedades-webpart.ps1`. Vacía: «Resumir con IA» solo copia descripciones de hasta 200 caracteres y avisa que falta configurarla para las largas. |

`ConstruirConfiguracionSolicitudesIlDesdeProps` exige los siete IDs de flujo como enteros mayores que cero en el momento de registrar o cambiar estado. Una URL vacía se trata como no configurada.

Esas propiedades llegan a todas las vistas a través de `PropsVistaSpa.propiedadesSolicitudesIl`. Su significado es exclusivo de este módulo.

## Piezas del módulo

```text
components/vistas/cor-conecta/concentrador/
  administrador|solicitante|despachador/
    VistaSolicitudesIl.tsx    Entrada del perfil y rutas.ts
  solicitudes-il/             Pantalla compartida, modales, grilla, constantes
services/sharepoint/solicitudesIl/
  RenderListData + ViewXml    Consulta paginada
  SolicitudesIlCrudServicio   Ítem, adjuntos y TAREAACTUAL
  RegistrarNueva…             Alta completa
  GuardarGestion…             Edición y cambio de estado
  CambioEstado…               Transiciones de bitácora
  BitacoraEngineServicio      Alta y cierre en ENGINE_BITACORA
  SiodSolicitudIlApiServicio    POST Insert/Update; DELETE baja (fire-and-forget)
  SincronizarSiodGestion…       Reglas SIOD en edición y cambio de estado
  ResumenDescripcionIaServicio  POST /api/ai/summarize-text (o copia si cabe en 200)
models/
  SolicitudIl.ts
  ConfiguracionSolicitudesIl.ts
  BitacoraSolicitudIl.ts
```
