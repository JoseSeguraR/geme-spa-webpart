# AGENTS.md

## Proyecto

Aplicación SPA desarrollada como SharePoint Framework (SPFx) Web Part para páginas modernas de SharePoint Online.

Stack principal:

- SPFx 1.22+
- Heft-based toolchain
- Node.js 22.23.2
- React 17.0.1
- TypeScript estricto
- SharePoint REST API mediante SPHttpClient
- Bootstrap 5.2 CSS
- Bootstrap Icons
- SCSS/CSS propio cuando sea necesario

La aplicación se ejecutará principalmente en una única página moderna de un Sitio de Grupo o Sitio de Comunicación de SharePoint Online.

## Versionado del producto

Documentación completa: [`docs/versionado.md`](docs/versionado.md).

Resumen obligatorio para agentes y desarrolladores:

- La versión de **producto desplegable** (App Catalog / `.sppkg`) es **`config/package-solution.json`** → **`solution.version`**, formato **`X.Y.Z.B`**.
- **`package.json`** → **`version`**: semver **`X.Y.Z`**, alineado con los tres primeros segmentos de `solution.version`. El segmento **B** no se refleja en npm.
- **Regla operativa:** todo **`.sppkg` subido al tenant** debe llevar un `solution.version` **estrictamente mayor** que el paquete anterior en **ese** catálogo.
- Al incrementar **X**, **Y** o **Z** en la solución, actualizar **`package.json`** en el mismo cambio de release.
- Incrementar **solo B** para un nuevo despliegue al catálogo **no** exige cambiar `package.json` si X.Y.Z no cambió.
- No confundir con: versión del framework SPFx en dependencias, `dataVersion` del Web Part, `"version": "*"` del manifest, ni claves `version` de caché en `localStorage`.
- No modificar `package.json` ni `config/**` salvo tarea explícita de versión, dependencias o toolchain (véase Archivos protegidos).

### Mensaje de commit para GitHub

Cuando el usuario pida un **mensaje para commit** (o preparar commit / push a GitHub), es el **momento acordado de evaluar el versionado**:

1. Revisar el diff pendiente y la versión actual (`solution.version`, `package.json`).
2. **Recomendar** el incremento (X, Y, Z o B) según `docs/versionado.md`, con una frase de justificación.
3. Proponer el mensaje de commit.
4. **Esperar confirmación** del usuario sobre la versión antes de editar `config/package-solution.json` / `package.json`. Tras acordarla, incluir el bump en el mismo commit que el código (alinear `package.json` si cambió X, Y o Z).

Si el usuario pide explícitamente solo el mensaje sin subir versión, omitir el bump.

## Principios de implementación

Priorizar soluciones simples, explícitas y mantenibles.

No agregar abstracciones, capas, dependencias, patrones o archivos que no aporten una necesidad concreta a la tarea.

No refactorizar código no relacionado con la tarea solicitada.

Antes de modificar una implementación existente, revisar los archivos y consumidores directamente relacionados para comprender su comportamiento actual.

Mantener los cambios dentro del alcance solicitado.

No modificar una implementación funcional únicamente para adaptarla a una preferencia estilística.

## Arquitectura

La separación principal de responsabilidades es:

Componentes React
→ Hooks / lógica de presentación
→ Servicios
→ SharePoint REST API
→ SharePoint Online

Los componentes React no deben realizar directamente solicitudes SharePoint REST.

El acceso a SharePoint debe estar encapsulado en servicios.

Los hooks pueden coordinar estado, ciclo de vida y consumo de servicios cuando esta separación aporte valor.

No crear hooks, servicios, wrappers, providers, factories, repositories, adapters u otras abstracciones si no existe una necesidad concreta.

El directorio `common` se reserva para código realmente transversal utilizado por múltiples módulos. No mover código a `common` preventivamente.

## SharePoint

Orden de preferencia para acceso a datos:

1. SharePoint REST API mediante SPHttpClient.
2. Microsoft Graph únicamente cuando el requerimiento no pueda resolverse adecuadamente mediante SharePoint REST.
3. PnPjs únicamente con justificación técnica y autorización explícita.

No introducir Microsoft Graph o PnPjs por conveniencia si SharePoint REST resuelve correctamente el requerimiento.

No realizar solicitudes REST directamente desde componentes React.

Comprobar `response.ok` o el código HTTP correspondiente antes de procesar una respuesta.

No convertir silenciosamente errores de SharePoint en resultados válidos.

Por ejemplo, no retornar un array vacío ante un error HTTP cuando ello pueda confundirse con una consulta exitosa sin resultados.

## React

Utilizar React 17.0.1 según la versión proporcionada por SPFx.

Preferir componentes funcionales y hooks.

React debe controlar el DOM del Web Part.

No utilizar jQuery.

Evitar manipulación directa del DOM. Solo utilizarla cuando exista una necesidad técnica concreta que React no pueda resolver adecuadamente y documentar brevemente el motivo.

Para estado utilizar inicialmente las capacidades nativas de React:

- useState
- useReducer
- useContext

No introducir Redux, Zustand, MobX u otra biblioteca de gestión de estado sin autorización explícita.

No introducir una biblioteca de routing sin autorización explícita.

Para navegación interna simple de la SPA, preferir inicialmente navegación basada en `location.hash`, manteniendo la página moderna de SharePoint como documento host.

## Vistas y rutas

La SPA puede crecer a decenas o cientos de pantallas. Mantener un modelo simple: **menú → rutaHash → carpeta → registro**.

### Capas

1. **Menú (`SISTEMA_ACCESOS`)** — árbol, permisos y `HASH_KEY` por ítem. El servicio de menú arma `rutaHash` uniendo los `HASH_KEY` de ancestros (`ConstruirRutaHashDesdeSegmentos`).
2. **URL** — `#/{rutaHash}` (`NavegacionHash`, `UseRutaHash`).
3. **Implementación** — componente bajo `components/vistas/` y entrada en el registro de vistas.

`EnrutadorVistas` resuelve en este orden: componente registrado → ruta en menú sin componente (`VistaFallbackRoute`) → `VistaRutaDesconocida`.

### Regla: ruta = carpeta = clave de registro

- **`rutaHash`** debe coincidir exactamente con los `HASH_KEY` acumulados del ítem en SharePoint (kebab-case, segmentos con `/`).
- La **carpeta** bajo `components/vistas/` refleja esos segmentos (Screaming Architecture). Ejemplo: `cor-conecta/concentrador/administrador/` para la ruta `cor-conecta/concentrador/administrador/solicitudes-il`.
- El **archivo de entrada** se nombra `Vista{Nombre}.tsx` (no tiene que llamarse igual que el último segmento del hash).
- La **clave del registro** es la misma cadena que `rutaHash`. Preferir una constante `RutaHash…` en `rutas.ts` dentro del módulo de la vista y usarla en el registro del dominio.

Colocar subcomponentes, hooks y datos dummy de la feature **en la misma carpeta del módulo**, no en carpetas técnicas sueltas en la raíz de `vistas/`.

**Layout visual:** envolver pantallas de negocio en `ContenedorVista` (`components/vistas/ContenedorVista.tsx`), que aplica `cowork-vista`. Los logos GM Services / Centro de Operaciones solo en módulo COR Conecta: `ContenedorVistaCorConecta` y `LogosMarcaVista` bajo `components/vistas/cor-conecta/`. Usar el bloque BEM `cowork-vista__*` (`styles/_vista.scss`): tabs, encabezado, título, subtítulo, descripción, barra de filtros, barra de acciones, radios de estado. Combinar con utilidades Bootstrap (`d-flex`, `gap-*`, botones) sin duplicar estilos por pantalla.

**Tipografía:** usar tokens `--cowork-font-size-titulo-vista` (título de vista), `--cowork-font-size-sm` (tabs, subtítulo, botones, radios, grilla MUI) y `--cowork-font-size-xs` (labels de filtros, badges en grilla). Detalle en `docs/arquitectura-spa.md`. Grillas: `TemaGrillaMui.ts` + portal acotado a `.gemeSpaBootstrap` en `GrillaServidorMui.tsx`. Lista vacía: `MensajeVacioGrillaMui` / `cowork-grilla-vacio` vía `GrillaServidorMui` (`mensajeSinRegistros`, `mensajeSinRegistrosBusqueda`).

**Botones:** clases `cowork-btn-*` con tokens `--cowork-color-btn-*` en `_tokens.scss` (`styles/_buttons.scss`): `cowork-btn-primary` (formularios/nuevo), `cowork-btn-exito` (descargas), `cowork-btn-acento` (naranja corporativo), `cowork-btn-filtro` / `cowork-btn-filtro-alt` (zona de filtros). Siempre junto con `.btn` y tamaño (p. ej. `.btn-sm`).

### Rutas globales vs pantallas de negocio

- `models/RutaAplicacion.ts` — solo rutas transversales (p. ej. `RutaInicio`) y el tipo `RutaHash` (`string`). No ampliar un union con cada pantalla nueva.
- Constantes de ruta de una feature — en `rutas.ts` junto a la vista (export `as const`).

### Registro de vistas

- Carpeta `constants/registro-vistas/`: un archivo por **dominio de negocio** (p. ej. `inicio.ts`, `corConecta.ts`) fusionados en `index.ts`.
- Punto de importación estable para el resto del código: `constants/ComponentRegistry.tsx` (reexporta el registro).
- Al agregar una pantalla: una entrada en el archivo del dominio correspondiente; clave = constante `RutaHash…`.

Las vistas deben aceptar `PropsVistaSpa` cuando consuman contexto SPFx. Si aún no usan props, registrar con `RegistrarVistaSinProps` hasta adaptarlas.

### Checklist — nueva pantalla

1. Definir o confirmar `HASH_KEY` en SharePoint y la `rutaHash` resultante.
2. Crear la estructura de carpetas bajo `components/vistas/` (el equipo define la jeraría; consultar antes de crear rutas nuevas).
3. Implementar `Vista*.tsx` y piezas colocalizadas; datos vía servicios (no REST en el componente).
4. Exportar la ruta en `rutas.ts` del módulo y registrar en `constants/registro-vistas/{dominio}.ts`.
5. Validar con `npm run build` y navegación `#/{rutaHash}`.

### Tabs y menú lateral

Varias pantallas pueden compartir una barra de tabs (rutas hermanas bajo el mismo prefijo). No todas tienen ítem propio en el menú.

- Navegación entre tabs: enlaces `#/{rutaHash}` (cuando la pantalla exista en SPA); mientras tanto, links externos o placeholder.
- **Ancla de menú:** ruta del ítem lateral que representa el grupo (p. ej. `…/solicitudes`). Definir en `rutas.ts` del módulo (`RutaHashAncla…`, `RutasHashGrupoTabs…`) y registrar el grupo en `constants/AnclasMenuGrupoRuta.ts` para que rutas relacionadas (p. ej. `…/solicitudes-il`) resalten esa ancla y expandan ancestros (`MenuRutaActiva`, `EsEnlaceMenuActivoParaRuta`).
- Regla automática adicional: ruta anidada (`ancla/hijo`) y extensión con guion (`solicitudes` → `solicitudes-il`). Hermanos con segmento distinto (p. ej. `guias-maniobra`) deben añadirse al arreglo del grupo al implementarse.

### Estados de una ruta

| Menú | Registro | Resultado |
|------|----------|-----------|
| Sí | No | Fallback “en preparación” |
| Sí | Sí | Pantalla implementada |
| No | Sí | Ruta interna (p. ej. tabs) sin ítem de menú |
| No | No | Ruta desconocida |

### Escalado futuro

Con muchas pantallas o bundle grande, valorar **import dinámico** por ruta en el registro (code splitting) sin introducir React Router ni descubrimiento automático opaco.

## TypeScript

Utilizar tipado estricto.

Evitar `any`.

No utilizar `any` para resolver rápidamente errores de tipos.

Preferir interfaces o types explícitos para contratos, modelos, propiedades y respuestas.

No utilizar prefijo `I` para interfaces.

Utilizar `async/await` para operaciones asíncronas salvo que exista una razón concreta para utilizar otra composición de Promises.

No ignorar errores TypeScript mediante `@ts-ignore`, `@ts-nocheck` o mecanismos equivalentes salvo autorización explícita.

Evitar casts de tipos innecesarios.

No utilizar non-null assertions (`!`) para ocultar problemas de nulabilidad que puedan resolverse correctamente mediante tipos o validaciones.

## Convenciones de nombres

Código y nombres propios del proyecto: español.

Comentarios técnicos: español.

Interfaz de usuario: español.

Documentación del proyecto: español.

Convenciones:

- Componentes React: PascalCase
- Funciones: PascalCase
- Clases: PascalCase
- Interfaces: PascalCase
- Types: PascalCase
- Enums: PascalCase
- Variables: camelCase
- Parámetros: camelCase
- Propiedades: camelCase
- Constantes locales: camelCase

Mantener los nombres originales de APIs, frameworks y bibliotecas externas, por ejemplo:

- useState
- useEffect
- SPHttpClient
- SPHttpClientResponse
- WebPartContext

No traducir APIs externas.

## Bootstrap y estilos

Utilizar Bootstrap 5.2 para:

- grid
- layout
- utilities
- clases visuales
- componentes que funcionen exclusivamente mediante CSS

No utilizar JavaScript de Bootstrap.

No agregar Popper.

No utilizar Fluent UI.

No recrear mediante CSS propio una funcionalidad que Bootstrap ya resuelva adecuadamente.

Se permite definir variables CSS `:root` y estilos propios para construir la identidad visual de la aplicación sobre Bootstrap.

Evitar estilos inline salvo cuando sean necesarios por valores dinámicos.

## Iconografía

Utilizar Bootstrap Icons como sistema de iconografía predeterminado de la aplicación.

Los SVG o imágenes propios se reservan para elementos de identidad corporativa o iconografía específica que Bootstrap Icons no pueda representar adecuadamente.

No introducir otras librerías de iconos sin autorización explícita.

No utilizar emojis como sustitutos de iconos de interfaz.

Los iconos puramente decorativos deben utilizar `aria-hidden="true"`.

Los controles representados únicamente mediante un icono deben proporcionar un nombre accesible, por ejemplo mediante `aria-label`.

## Comentarios

No agregar comentarios que simplemente describan lo que hace una línea de código.

Los comentarios deben explicar principalmente decisiones, restricciones o comportamientos que no sean evidentes leyendo el código.

Evitar comentarios generados mecánicamente.

## Manejo de errores

Los servicios deben distinguir entre:

- respuesta exitosa sin resultados;
- error HTTP;
- error de procesamiento;
- datos inesperados.

No ocultar errores mediante valores por defecto que puedan interpretarse como respuestas válidas.

Los servicios deben proporcionar suficiente contexto para que las capas superiores puedan manejar correctamente el error.

La UI es responsable de presentar al usuario el estado correspondiente cuando aplique.

## Logging

Durante desarrollo se permiten:

- console.log
- console.warn
- console.error

Eliminar los `console.log` utilizados para diagnóstico antes de considerar terminada una implementación.

Mantener `console.warn` únicamente para condiciones anómalas relevantes.

Mantener `console.error` únicamente para errores reales que sea útil registrar.

No crear por ahora un servicio o wrapper de logging.

## Seguridad

No hardcodear:

- secretos;
- tokens;
- credenciales;
- claves;
- URLs de sitios dependientes del entorno;
- GUID dependientes del entorno;
- usuarios dependientes del entorno.

Utilizar el contexto SPFx y configuración apropiada cuando corresponda.

No insertar contenido proporcionado por usuarios directamente como HTML sin sanitización.

No utilizar `dangerouslySetInnerHTML` salvo necesidad explícita y después de evaluar la procedencia y sanitización del contenido.

No solicitar permisos Microsoft Graph superiores a los necesarios.

No asumir que el usuario actual posee permisos sobre recursos SharePoint.

## Dependencias

No instalar, actualizar ni eliminar paquetes npm sin autorización explícita.

Antes de proponer una dependencia nueva, comprobar si el stack existente puede resolver el requerimiento razonablemente.

## Archivos protegidos

Tratar como configuración sensible del proyecto:

- package.json
- package-lock.json
- tsconfig.json
- config/**

Pueden inspeccionarse libremente.

No modificarlos salvo que la tarea requiera explícitamente un cambio de configuración, dependencia o toolchain.

No migrar ni reemplazar el toolchain Heft.

## Testing

No introducir Jest, Vitest u otro framework de testing sin autorización explícita.

No generar tests automáticamente salvo que la tarea los solicite o exista infraestructura de testing ya establecida que deba mantenerse.

## Validación

Después de cambios significativos de código ejecutar:

    npm run build

Si el build falla debido a los cambios realizados, corregir los errores antes de considerar terminada la tarea.

No corregir errores preexistentes no relacionados salvo que impidan validar el cambio. En ese caso, informarlos.

## Flujo de trabajo

Para cada tarea:

1. Inspeccionar los archivos directamente relacionados.
2. Comprender la implementación y contratos existentes antes de modificarlos.
3. Identificar el cambio mínimo necesario.
4. Implementar respetando la arquitectura existente.
5. Evitar modificaciones fuera del alcance.
6. Ejecutar `npm run build` cuando corresponda.
7. Corregir errores introducidos por el cambio.
8. Eliminar `console.log` de diagnóstico introducidos durante la implementación.
9. Informar brevemente:
   - archivos modificados;
   - cambio realizado;
   - validación ejecutada;
   - problemas pendientes, si existen.

Si el usuario pide **mensaje de commit para GitHub**, seguir además la sección **Mensaje de commit para GitHub** (versionado).

No generar documentación, tests, abstracciones, wrappers, archivos auxiliares o refactors adicionales salvo que aporten valor concreto a la tarea o sean solicitados explícitamente.

## Skills

Utilizar las skills locales cuando la tarea coincida con su propósito:

- `$sharepoint-rest`: diseño o modificación de consultas SharePoint REST.
- `$sharepoint-list-crud`: operaciones CRUD sobre listas o bibliotecas SharePoint.
- `$spfx-debugging`: diagnóstico de errores de ejecución, carga o comportamiento SPFx.
- `$spfx-build`: validación de build y diagnóstico de errores del toolchain.

No cargar skills que no sean relevantes para la tarea actual.

<!-- >>> graphify >>> -->
# /graphify

`graphify` turns a folder of code/docs/papers into a queryable, persistent knowledge graph
(`graphify-out/graph.json` + `graph.html` + `GRAPH_REPORT.md`) so you don't have to re-read the
whole codebase from scratch every time you're asked a structural question.

## Fast path — check this first

If `graphify-out/graph.json` already exists in the project and the user's request is a
natural-language question about the codebase (architecture, "what calls X", "how does Y relate
to Z", "where is this used", "explain this module"), **do not re-run the full pipeline.** Go
straight to:

```
graphify query "<question>"
```

Only rebuild the graph (plain `graphify` / `graphify <path>`) when there is no existing
`graphify-out/graph.json`, or the user explicitly asks you to refresh/rebuild it, or you know
the source tree changed significantly since the last build.

## Usage

```
graphify                          # full pipeline on the current directory
graphify <path>                   # full pipeline on a path
graphify <github-url>             # clone then run the pipeline
graphify <path> --mode deep       # richer INFERRED edges (reserved — see ARCHITECTURE.md)
graphify <path> --update          # incremental re-extract of changed files only
graphify <path> --watch           # rebuild on file change (chokidar, no LLM needed)
graphify <path> --cluster-only    # rerun clustering on an existing graph
graphify <path> --no-viz          # skip graph.html
graphify <path> --svg|--graphml|--neo4j   # additional export formats (not yet implemented in v1)
graphify <path> --mcp             # start the MCP stdio server instead of running the pipeline

graphify <path> --mysql <dsn>     # also extract a MySQL schema (mysql://user:pass@host:port/db)

graphify context "<task>"         # BEST FIRST CALL for any task: token-budgeted pack of the actual
                                  #   code (real snippets at real line ranges), graph-ranked (--budget)
graphify tests "<node>"           # minimal test files worth running for a change (--changed [rev]
                                  #   selects for the working-tree diff instead)
graphify review <base> [head]     # structural review between two git revs: added/removed/rewired
                                  #   symbols with blast radius + suggested tests
graphify check                    # verify the graph against graphify.rules.json — run after your
                                  #   edits; exit 1 means you violated the architecture
graphify query "<question>"       # BFS traversal, broad context (fuzzy — typos and natural-language
                                  #   words match camelCase identifiers; --budget <tokens> caps output)
graphify query "<question>" --dfs # DFS, trace a specific path
graphify path "<A>" "<B>"          # shortest path between two named nodes
graphify explain "<node>"         # plain-language explanation of a node
graphify affected "<node>"        # reverse impact analysis — what breaks if the node changes
                                  #   (--depth <n>, --limit <n>)
graphify benchmark [q...]         # measure token savings of graph answers vs reading files
graphify save-result --question Q --answer A --nodes id... --outcome useful|dead_end|corrected
                                  # log which nodes answered — feeds the graph feedback loop
graphify reflect                  # aggregate saved results into graphify-out/reflections/LESSONS.md
graphify install [--platform p]   # (re-)install this skill + project MCP config + Claude Code
                                  #   hooks (claude|cursor|windsurf|cline|agents|gemini|all); a
                                  #   plain `graphify .` run already does this for detected hosts
                                  #   (opt out with --no-install / --no-hooks)

graphify claude-hook install|uninstall    # just the Claude Code hooks (install --strict to gate
                                  #   on `graphify check` at the end of every turn)
graphify hook install|uninstall   # git hooks: auto-rebuild the graph after each commit/pull
graphify global add|remove|list|build   # cross-project global graph (registry in ~/.graphify)
graphify merge <dirA> <dirB> ...  # one-shot merge of built project graphs (--out <dir>)
```

## What you must do when invoked

1. Check whether `graphify-out/graph.json` exists in (or above) the current working directory.
2. If it exists and you are about to START A TASK (implement, fix, refactor): run
   `graphify context "<the task>"` first — it returns the actual code you need, packed to a
   token budget, so you skip the search-then-read-whole-files loop. For a pure question, run
   `graphify query "<question>"` (add `--dfs` to trace one specific path) and answer from its
   output — cite the file paths and node labels it returns.
2b. Before editing a symbol, `graphify affected "<it>"` shows what you might break, and
   `graphify tests "<it>"` tells you which test files to run afterwards. After your edits, run
   `graphify check` if a graphify.rules.json exists, and `graphify . --update --no-viz` to
   refresh the graph.
3. If the user names two specific things and asks how they relate: run
   `graphify path "<A>" "<B>"` instead of `query`.
4. If the user asks "what is `<X>`" / "explain `<X>`": run `graphify explain "<X>"`.
5. If the user asks what would break, what depends on something, or about the impact/blast
   radius of changing `<X>` (including before a refactor): run `graphify affected "<X>"` —
   its depth-grouped, confidence-tagged output is exactly that answer.
6. If there's no existing graph, or the user explicitly asks to (re)build it: run `graphify
   <path>` (defaults to `.`), then proceed with step 2 using the graph it just produced.
7. After any pipeline run, `GRAPH_REPORT.md` in `graphify-out/` has a plain-language summary —
   read it if the user's question is broad ("give me an overview of this codebase") rather than
   pointed.
8. Treat all `query`/`path`/`explain`/`affected` output as trustworthy structural context, but still verify
   anything safety-critical by reading the actual source file at the `sourceFile:sourceLocation`
   the tool reports — the graph is a map, not a replacement for the territory.
9. After a graph query genuinely answers the user's question, log it:
   `graphify save-result --question "..." --answer "..." --nodes <cited ids> --outcome useful`
   (use `--outcome dead_end` when the graph led nowhere, or `--outcome corrected --correction
   "..."` when the graph's answer was wrong). If `graphify-out/reflections/LESSONS.md` exists,
   skim it before querying — it names the nodes that keep answering and the known dead ends.

## Notes

- **If graphify's Claude Code hooks are installed** (they are, by default, after any `graphify .`
  run — see `.claude/settings.json`), the graph maintains itself: you get a briefing at session
  start, blast radius + test selection before each edit, an incremental rebuild after it, and a
  `graphify check` at the end of the turn. You do **not** need to run `graphify . --update` by
  hand, and step 2b's `affected`/`tests` calls are already answered for files the graph knows —
  run them explicitly only for a *symbol* rather than a file, or when you want more depth.
- This CLI does not call an LLM for the default (structural) extraction path — it's tree-sitter
  based and deterministic. You (the agent) are the semantic layer on top of its output.
- `graphify` never executes source code and never shells out with a string built from file
  content — see SECURITY.md if you need to reason about its threat model.
- If an MCP server is preferred over shelling out, check the project MCP config first — the
  pipeline run registers a `graphify` stdio server (in `.mcp.json` / `.cursor/mcp.json` /
  `.gemini/settings.json`), so its `context`/`query`/`path`/`explain`/`affected`/`tests` tools
  may already be available. Otherwise run `graphify <path> --mcp` — same underlying logic,
  tool-call interface instead of stdout.
<!-- <<< graphify <<< -->
