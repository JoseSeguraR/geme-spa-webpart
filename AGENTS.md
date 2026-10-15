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

**Layout visual:** envolver pantallas de negocio en `ContenedorVista` (`components/vistas/ContenedorVista.tsx`), que aplica `cowork-vista` y los logos corporativos arriba a la derecha. Usar el bloque BEM `cowork-vista__*` (`styles/_vista.scss`): tabs, encabezado, título, subtítulo, descripción, barra de filtros, barra de acciones, radios de estado. Combinar con utilidades Bootstrap (`d-flex`, `gap-*`, botones) sin duplicar estilos por pantalla.

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

No generar documentación, tests, abstracciones, wrappers, archivos auxiliares o refactors adicionales salvo que aporten valor concreto a la tarea o sean solicitados explícitamente.

## Skills

Utilizar las skills locales cuando la tarea coincida con su propósito:

- `$sharepoint-rest`: diseño o modificación de consultas SharePoint REST.
- `$sharepoint-list-crud`: operaciones CRUD sobre listas o bibliotecas SharePoint.
- `$spfx-debugging`: diagnóstico de errores de ejecución, carga o comportamiento SPFx.
- `$spfx-build`: validación de build y diagnóstico de errores del toolchain.

No cargar skills que no sean relevantes para la tarea actual.