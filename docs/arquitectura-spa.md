# Arquitectura de la SPA

Este documento describe lo que es común a la aplicación: el Web Part, la carcasa, el menú, las rutas y los componentes reutilizables. Módulos del Concentrador documentados aparte: [solicitudes-il.md](solicitudes-il.md), [operador-renovable.md](operador-renovable.md).

## Modelo

La SPA corre dentro de un único Web Part, en una página moderna de un sitio de grupo o de comunicación. SharePoint sigue siendo el documento host. La navegación interna usa `location.hash` (`#/{rutaHash}`) y no hay biblioteca de routing.

La separación de responsabilidades es:

```text
Componentes React
  → hooks (estado y ciclo de vida)
    → servicios
      → SharePoint REST (SPHttpClient)
```

Los componentes no llaman a SharePoint. Los servicios distinguen una consulta vacía de un error HTTP: no convierten un fallo en un arreglo vacío.

## Arranque

`GemeSpaWebPart` (`src/webparts/gemeSpa/GemeSpaWebPart.ts`) monta `GemeSpa` y le pasa el contexto SPFx, el nombre del usuario, la URL de cierre de sesión, la versión del manifiesto y las propiedades del panel.

`GemeSpa` hace dos cosas en paralelo:

1. `UseRutaHash` lee el hash y se suscribe a `hashchange`. Si el hash está vacío, fija `#/inicio`. `NormalizarSegmentoHash` (`utils/NavegacionHash.ts`) decodifica `%2F` y quita las barras iniciales, porque SharePoint en modo edición (`?Mode=Edit`) reescribe el hash como `#/%2Fruta%2Fhija`.
2. `UseMenuInicializado` llama a `InicializarMenuAplicacion`.

Mientras el menú carga se muestra `CargandoInicial`. Si la inicialización falla, la pantalla indica que no se pudo cargar el menú y conserva el mensaje del error. Con el menú listo, `CarcasaSpa` envuelve a `EnrutadorVistas`.

## Layout

`CarcasaSpa` arma la clase raíz `gemeSpaBootstrap` y el estado visual de la barra lateral (colapsada en escritorio, abierta en móvil).

Al hacer scroll solo se desplaza el contenido: en escritorio la barra lateral y la barra superior son `position: sticky` (`top: 0`) dentro del contenedor con scroll de SharePoint. La barra lateral mide `var(--cowork-alto-visible-host)`, que `CarcasaSpa` calcula (`UseAltoVisibleHost`) como el `clientHeight` del primer ancestro con `overflow-y: auto/scroll` (o `window.innerHeight`) y actualiza al redimensionar; así entra entera bajo la barra del sitio de SharePoint. Ningún ancestro entre la carcasa y ese contenedor puede tener `overflow: hidden`, o el sticky deja de funcionar. En móvil la barra lateral sigue siendo `position: fixed`.

| Pieza | Rol |
| --- | --- |
| `BarraLateral` | Árbol de menú (`MenuArbol`), pie del menú, versión del Web Part y enlace a la colección de sitios. |
| `BarraSuperior` | Usuario y cierre de sesión (menú del usuario). |
| `main.cowork-contenido` | Zona donde el enrutador pinta la vista. |
| `ContenedorVista` | Envoltorio de una pantalla de negocio: bloque `cowork-vista`. Logos de marca solo en COR Conecta (`ContenedorVistaCorConecta`). |

Los estilos viven en `src/webparts/gemeSpa/styles/`. `GemeSpa.global.scss` importa Bootstrap y el resto de parciales **dentro** de `.gemeSpaBootstrap`, para no alterar la página de SharePoint. Los tokens (`_tokens.scss`) definen tipografía, densidades y colores de marca (barra superior `#003773`, sidebar `#4B4B49`).

### Tipografía en vistas (convención)

Usar siempre variables CSS `--cowork-font-size-*`, no tamaños sueltos en pantallas nuevas.

| Nivel | Token | Uso típico |
| --- | --- | --- |
| Título compacto de vista | `--cowork-font-size-titulo-vista` (1.25rem) | Cabecera principal (p. ej. `cowork-vista__titulo-il`); color corporativo `--cowork-color-btn-primary-bg` |
| Cuerpo / controles | `--cowork-font-size-sm` (0.875rem) | Tabs, subtítulos de vista, botones `.btn-sm`, radios de estado, celdas de grilla MUI, encabezados de columna |
| Metadatos densos | `--cowork-font-size-xs` (0.8125rem) | Labels de filtros en panel, badges de estado dentro de la grilla |
| Texto general SPA | `--cowork-font-size-base` (0.9375rem) | Herencia en `.gemeSpaBootstrap`; evitar usarlo como título |

Jerarquía: un escalón claro entre título de vista (1.25rem) y la banda operativa (sm). Subtítulos alineados con tabs y acciones (sm), no por debajo en xs. Pantallas COR Conecta con tabs clásicos + cabecera propia: `ContenedorVistaCorConecta` con `layoutCabeceraSobreTabs` y fila `cowork-vista__fila-cabecera` (referencia: Solicitudes IL).

Botones de negocio: clase `cowork-btn-*` junto con `.btn` y un tamaño de Bootstrap (por ejemplo `.btn-sm`).

| Clase | Uso |
| --- | --- |
| `cowork-btn-primary` | Acción principal de un formulario o alta. |
| `cowork-btn-exito` | Descargas. |
| `cowork-btn-acento` | Acento naranja corporativo. |
| `cowork-btn-filtro` / `cowork-btn-filtro-alt` | Zona de filtros. |

Iconos: Bootstrap Icons. Un icono decorativo lleva `aria-hidden="true"`. Un control que solo muestra un icono lleva nombre accesible (`aria-label`).

## Menú

El menú sale de la lista `SISTEMA_ACCESOS`. Al normalizar, se omiten los ítems con `ACTIVO` apagado y los que tienen un `TIPOACCESO` distinto de `Header`, `Route` o `ExternalLink`. Cada ítem que queda (`RegistroSistemaAccesoNormalizado`) tiene tipo, padres (`PADRE` lookup multivalor → `padreIds`), orden, título, `HASH_KEY`, grupos de audiencia e icono.

| Tipo en lista | Nodo en el árbol |
| --- | --- |
| `Header` | `grupo`, con `prefijoRutaHash` acumulado. |
| `Route` | `enlace` interno, con `rutaHash`. |
| `ExternalLink` | `enlace-externo`; `HASH_KEY` se usa como URL. |

`InicializarMenuAplicacion` resuelve los datos en este orden: memoria de la sesión, `localStorage`, SharePoint. Las dos lecturas (registros y grupos del usuario) van en paralelo. `ProcesarMenuDesdeRegistros` después:

1. Filtra `Route` y `ExternalLink` por audiencia. Un ítem sin grupos es visible para todos. Un `Header` no se filtra en este paso.
2. Oculta los `Header` que se quedan sin descendientes visibles.
3. Construye el árbol ordenado por `orden` y, en empate, por `id`.
4. Recolecta el conjunto `rutasDisponibles`.

La audiencia compara los identificadores de grupo del ítem con los grupos del usuario actual (`UsuarioCumpleAudiencia`: basta con coincidir en uno).

### Barra lateral (`components/navegacion/MenuArbol.tsx`)

`MenuArbol` divide la barra en dos zonas dentro de `.cowork-barra-lateral__navegacion` (columna flex):

| Zona | Contenido | Comportamiento |
| --- | --- | --- |
| Arriba (`.cowork-menu-arbol--expandido`; franja: `--rail-escritorio`) | El árbol del menú sin el grupo «Control Sitio». | Ocupa el alto libre y tiene su propio scroll. Al entrar a un módulo (p. ej. COR Conecta) muestra sus hijos bajo un encabezado con un solo botón: `«`, ícono y nombre del módulo; ese botón vuelve al primer nivel. |
| Pie (`.cowork-menu-pie`) | Hijos del `Header` «Control Sitio» (Permisos de usuario, Mantenedores) y **Cerrar sesión**. | Fijo abajo, siempre visible, también dentro de un módulo; si no cabe (más de la mitad del alto), tiene scroll propio. Las opciones llevan su ícono (`ICONO`); los grupos se despliegan como acordeón. En la franja contraída se ven como íconos y los grupos abren el menú flotante. |

`utils/MenuPie.ts` (`SepararNodosPieMenu`) reconoce el `Header` del pie por su `HASH_TITLE` normalizado (sin tildes ni mayúsculas): `control sitio`, `control del sitio` o `control de sitio` (`EtiquetasGrupoPieMenu`). Lo busca en todo el árbol, no solo en el primer nivel (en `SISTEMA_ACCESOS` puede colgar de un módulo, como COR Conecta › Concentrador). El `Header` no se muestra; sus hijos pasan al pie en su `ORDEN`, y si un grupo queda vacío al quitarlo, también se oculta. Las rutas no cambian: siguen acumulando el `HASH_KEY` de «Control Sitio». Si se renombra ese `Header` en `SISTEMA_ACCESOS`, hay que agregar el nuevo título a `EtiquetasGrupoPieMenu`.

**Cerrar sesión** usa `signOutUrl` (la misma URL que el menú del usuario de `BarraSuperior`), que llega como `urlCerrarSesion` por `CarcasaSpa` → `BarraLateral` → `MenuArbol`.

Los íconos del menú no llevan fondo: el resaltado queda solo para el ítem activo (`--activo`, `--contiene-activo`).

Caché (`constants/ConfiguracionCacheMenu.ts`):

| Dato | Versión | TTL |
| --- | --- | --- |
| `SISTEMA_ACCESOS` | `v6` | 45 minutos |
| Grupos del usuario | `v3` | 20 minutos |

`InvalidarCacheMenu` borra ambas entradas de `localStorage` y el resultado en memoria. Subir la constante de versión invalida entradas viejas al leerlas.

La `rutaHash` de un enlace es la unión, con `/`, de los `HASH_KEY` del ítem y de sus ancestros (`ConstruirRutaHashDesdeSegmentos`). Ejemplo: ancestros `cor-conecta`, `concentrador`, `administrador` y clave `solicitudes-il` producen `cor-conecta/concentrador/administrador/solicitudes-il`.

## Rutas y registro de vistas

`EnrutadorVistas` normaliza el hash y resuelve en este orden:

| ¿Hay componente registrado? | ¿La ruta está en el menú del usuario? | Resultado |
| --- | --- | --- |
| Sí | — | Pantalla implementada |
| No | Sí | `VistaFallbackRoute` («en preparación») |
| No | No | `VistaRutaDesconocida` |

Una ruta puede existir en el registro sin ítem de menú (pestaña interna). Una ruta del menú puede existir sin componente (fallback).

La clave del registro es exactamente la `rutaHash`. El mapa se arma en `constants/registro-vistas/`: un archivo por dominio (`inicio.ts`, `corConecta.ts`) fusionado en `index.ts`. `constants/ComponentRegistry.tsx` reexporta ese mapa; el resto del código importa desde ahí.

**Registro por sufijo.** Si no hay coincidencia exacta, `ObtenerComponenteDelRegistro` busca en `componentRegistrySufijo` una clave con la que termine la ruta (`ruta === sufijo` o `ruta` termina en `/sufijo`; gana el sufijo más largo). Se usa para Permisos de usuario (`permisos-usuarios`) y los mantenedores (`mantenedores/<clave>`) de «Control Sitio» (`constants/registro-vistas/controlSitio.tsx`).

**Enlaces del legado reemplazados.** `services/menu/ReemplazarEnlacesLegadoControlSitio.ts` corre en `ProcesarMenuDesdeRegistros` después de construir el árbol: los enlaces de `SISTEMA_ACCESOS` a `CONC/Administracion/admuserfn.aspx` y `mantenedores.aspx` se convierten en el enlace interno `control-sitio/permisos-usuarios` y en un grupo con un enlace `control-sitio/mantenedores/<clave>` por mantenedor. La lista no se modifica. Documentación: `geme-spa-maqueta/docs/documentacion-tecnica/cor-conecta/concentrador-solicitudes/mantenedores/readme.md` (§8) y `…/plantilla/permisos-usuarios/readme.md` (§6).

`models/RutaAplicacion.ts` solo declara el tipo `RutaHash` y las rutas transversales (`RutaInicio = 'inicio'`). La constante de una pantalla de negocio vive en `rutas.ts` junto a su vista.

Las vistas que usan contexto SPFx reciben `PropsVistaSpa` (`userDisplayName`, `context`, `propiedadesSolicitudesIl`). El panel de propiedades del Web Part configura Solicitudes IL (viajan en `PropsVistaSpa` para todas las vistas) y el Operador renovable (`EstablecerConfiguracionOperadorRenovable`, sin pasar por props; los servicios la leen con `ObtenerConfiguracionOperadorRenovable`, p. ej. `HayServicioPeriodos` para la URL de períodos). Como la SPA ocupa la página y tapa la barra del Web Part, en modo edición (`displayMode === DisplayMode.Edit`) `GemeSpaWebPart` pasa `onAbrirPropiedades` (`context.propertyPane.open()`) y `BarraSuperior` muestra el botón engranaje «Configurar web part»; SPFx vuelve a llamar a `render` al cambiar de modo. Una vista que aún no las usa puede registrarse con `RegistrarVistaSinProps`.

### Resaltado del menú

`EsEnlaceMenuActivoParaRuta` marca un ítem cuando:

- la ruta del enlace coincide con la actual;
- la ruta actual cuelga de ese enlace (`ancla/hijo`);
- el último segmento es una extensión con guion del enlace (`solicitudes` → `solicitudes-il`);
- la ruta está declarada en `constants/AnclasMenuGrupoRuta.ts`.

Las anclas cubren pestañas hermanas que no comparten el segmento del ítem de menú (por ejemplo, una futura guía de maniobra). Cada grupo declara `RutaHashAncla…` y `RutasHashGrupoTabs…` en el `rutas.ts` del módulo.

### Nueva pantalla

1. Confirmar los `HASH_KEY` en `SISTEMA_ACCESOS` y la `rutaHash` resultante.
2. Crear la carpeta bajo `components/vistas/` con los mismos segmentos. Ejemplo: `cor-conecta/concentrador/administrador/` para `cor-conecta/concentrador/administrador/solicitudes-il`.
3. Implementar `Vista{Nombre}.tsx` en esa carpeta, envuelta en `ContenedorVista`. Subcomponentes y hooks de la pantalla quedan ahí.
4. Exportar `RutaHash…` en `rutas.ts` y registrar el componente en `constants/registro-vistas/{dominio}.ts`.
5. Si la pantalla pertenece a un grupo de pestañas, registrar la ancla en `AnclasMenuGrupoRuta.ts`.
6. Validar con `npm run build` y abrir `#/{rutaHash}`.

## Grilla de servidor

`components/grilla/GrillaServidorMui.tsx` es la grilla reutilizable. Usa MUI Data Grid; el resto de la interfaz sigue en Bootstrap. El tema está en `TemaGrillaMui.ts`: celdas, encabezados, paginación e inputs usan `--cowork-font-size-sm`; chips o badges en celdas pueden ir en xs vía estilos de vista (`.cowork-vista-tabla-mui`).

Los poppers del Data Grid (menú de columna, etc.) se montan dentro de `.gemeSpaBootstrap` (`slotProps.basePopper` / `baseSelect.MenuProps.container`), no en `document.body`, para que no queden huérfanos al salir de la SPA por enlaces externos en la misma pestaña.

Lista vacía: `GrillaServidorMui` usa `MensajeVacioGrillaMui` (`cowork-grilla-vacio`): mensaje centrado, ancho completo, borde `1px solid var(--cowork-color-grilla-borde)` y la misma altura mínima que la grilla cuando no se renderiza el DataGrid (`estadoCarga === 'vacio'`). Con grilla visible y cero filas, el slot `noRowsOverlay` reutiliza el mismo componente en variante `overlay`. Personalizar textos con `mensajeSinRegistros` y `mensajeSinRegistrosBusqueda`.

La grilla no consulta SharePoint. El padre le entrega filas ya normalizadas y el estado de carga (`inicial`, `cargando`, `listo`, `vacio`, `error`). La paginación es por páginas conocidas: el padre indica `paginaActual`, `tamanoPagina` y `hayPaginaSiguiente`. El orden se notifica con `onCambioOrdenamiento`. La búsqueda es opcional (`ConfigBusquedaGrillaServidor`) y la aplica quien consulta.

Alturas y tamaños de página predeterminados están en `models/GrillaServidor.ts` (10, 25, 50 y 100 filas; altura 480 px). `ColumnaAccionesGrilla` concentra el ancho y las opciones de la columna de acciones. `PreferenciasAnchoColumnasGrilla` recuerda anchos en el cliente.

Opciones de la grilla (todas opcionales; sin ellas se comporta como antes):

| Prop | Efecto |
| --- | --- |
| `alturaAutomatica` | Sin scroll vertical: `autoHeight` y `getRowHeight={() => 'auto'}`. Agrega `cowork-vista-tabla-mui--multilinea` (`styles/_vista.scss`): las celdas parten el texto solo entre palabras y la fila conserva 42 px de mínimo. Para respetar saltos de línea en una columna, `cellClassName: 'cowork-celda-texto-largo'`. |
| `columnasAutoajustables` | Campos cuyo ancho se recalcula con `apiRef.autosizeColumns` (incluye encabezados) cada vez que cambian las filas. MUI mide solo celdas ya dibujadas, así que la grilla espera (hasta 30 cuadros) a que existan antes de medir; si no, mediría solo el encabezado. Esas celdas llevan `cowork-celda-autoajustada` y nunca parten línea. Úsalo en columnas cortas y deja las de texto largo en `flex`, para no generar scroll horizontal. |
| `opcionesTamanoPagina` | Números o `{ value, label }`. `{ value: TamanoPaginaTodos, label: 'Mostrar todo' }` (`-1`) pide todas las filas; quien consulta debe traerlas todas y responder `hayPaginaSiguiente = false`. |
| `totalFilas` | Total conocido de registros (paginación local). Sin él, el total se deduce de la página actual. |

### Grilla local

`components/grilla/GrillaLocalMui.tsx` envuelve `GrillaServidorMui` para listas que se cargan completas (mantenedores): recibe todas las filas y resuelve en el navegador la búsqueda (`textoBusquedaFila`, sin mayúsculas ni tildes), el orden (por el valor del campo; números como números, textos con `localeCompare('es')`) y la paginación (10, 25, 50, 100 o Mostrar todo). Siempre usa `alturaAutomatica` y la clase `cowork-vista-tabla-mui--centrada` (`styles/_control-sitio.scss`: contenido de la celda centrado en vertical). No usa `columnasAutoajustables`: las columnas cortas llevan `width` fijo y las de texto `flex` con `minWidth`, para que los anchos no cambien al paginar, buscar u ordenar.

`GrillaServidorMui` acepta `claseContenedor` para agregar una clase al contenedor de la tabla.

## Formularios y escrituras comunes

- `components/comunes/ModalFormulario.tsx`: carcasa Bootstrap de los modales de alta y edición (título con ícono, alerta de error, Cancelar/Guardar con estado `guardando`, Enter envía). Sin `onGuardar` muestra solo «Cerrar».
- `services/sharepoint/listaGenerica/ListaSharePointServicio.ts`: `ObtenerTodosLosItemsLista` (sigue `@odata.nextLink`), `CrearItemLista`, `ActualizarItemLista` (MERGE) y `EliminarItemLista`, con `odata=nometadata` y errores `SharePointRestError` con el mensaje de SharePoint (`ExtraerMensajeErrorSharePoint` lee `error` y `odata.error`).

## Fecha y hora (COR Conecta)

Regla del workspace (`CLAUDE.md` y `.cursor/rules/fecha-hora-cor-conecta.mdc`): en COR Conecta las fechas con hora van en `dd/mm/aaaa hh:mm`, de 00 a 23 h, sin AM/PM.

- `utils/FechaHoraCorConecta.ts`: `FormatearFechaHoraVisible` (ISO → texto visible), `ConvertirEntradaLocalAIsoUtc` / `ConvertirIsoAFechaLocalInput` (valor local `AAAA-MM-DDTHH:mm` ↔ ISO UTC), `InterpretarFechaHoraPegada` (acepta `dd/mm/aaaa hh:mm`, `dd-mm-aaaa hh:mm` y `aaaa-mm-ddThh:mm`; sin hora usa la actual; rechaza horas > 23 y fechas inexistentes) y `FormatearValorLocalParaEdicion`. El texto visible se arma a mano: `toLocaleString('es-CL')` separa con guiones y puede usar AM/PM según el navegador.
- `InterpretarHora24` y `components/concentrador/CampoHora24.tsx`: hora sola `HH:mm` (00 a 23) en lugar de `<input type="time">`; acepta `9:05`, `0905`, `9` o pegar. Lo usan los plazos de envío de los mantenedores.
- `components/concentrador/CampoFechaHora24.tsx`: reemplaza a `<input type="datetime-local">`. Mismo contrato de valor (`valor`/`onCambio` con `AAAA-MM-DDTHH:mm`, `min`, `disabled`, `readOnly`, `required`). Campo de texto que interpreta al salir, con Enter o al pegar; marca `is-invalid` si el formato o el mínimo no se cumplen y no propaga el valor. El botón de calendario abre un `input type="date"` oculto (`showPicker`) que solo cambia el día y conserva la hora.

## Carpetas estructurales

```text
src/webparts/gemeSpa/
  GemeSpaWebPart.ts          Web Part y panel de propiedades
  components/
    GemeSpa.tsx              Composición de menú, carcasa y enrutador
    layout/                  Carcasa, barras, carga inicial, menú de usuario
    navegacion/              Enrutador y árbol de menú
    grilla/                  Grilla MUI reutilizable
    vistas/                  Pantallas; ContenedorVista y vistas transversales
  hooks/                     UseRutaHash, UseMenuInicializado
  constants/
    registro-vistas/         Un archivo por dominio de negocio
    AnclasMenuGrupoRuta.ts
    ConfiguracionCacheMenu.ts
  models/                    Contratos compartidos (menú, ruta, grilla)
  services/
    menu/                    Árbol, audiencia, caché de menú
    cache/                   localStorage con versión y TTL
    sharepoint/              REST transversal (SISTEMA_ACCESOS, grupos, errores)
    preferencias/            Anchos de columna
  styles/                    Tokens, layout, vista, botones, tema
  utils/                     Hash, menú activo, formato visible
```

Lo que pertenece a un módulo (hoy, `services/sharepoint/solicitudesIl/` y `components/vistas/cor-conecta/`) no forma parte de esta base. Una pantalla nueva no mueve código a una carpeta común hasta que otro módulo lo use.
