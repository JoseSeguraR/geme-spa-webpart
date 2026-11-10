# Operador renovable

Módulo del Concentrador (COR Conecta) para gestionar disponibilidad de subequipos en centrales renovables, solicitudes con indisponibilidad y limitaciones por subestación (PGL). Carcasa SPA: [arquitectura-spa.md](arquitectura-spa.md).

Documentación alineada con [`geme-spa-maqueta`](../../geme-spa-maqueta). **Corte maqueta: 3-nov-2026** (`da063dc` — **todas las centrales activas**; tipo en **subequipo**; **sin** `TIPO_SUBEQUIPO` en Instalaciones). Indisponibilidad en solicitud: **`TIENE_SUBEQUIPOS_INDISPONIBLES`** + **`CONC_LISTA_INDISPONIBILIDADES`** (`2d7dbc2`). Contexto: `8bb5843` revoca `TIPO_SUBEQUIPO` / `config-renovables.json`.

| Documento | Contenido |
| --- | --- |
| [comportamiento-tecnico.md](operador-renovable/comportamiento-tecnico.md) | Funcionalidades, reglas, cálculos, motor vs bitácoras |
| [listas-y-campos.md](operador-renovable/listas-y-campos.md) | Esquema sitio `geme`, target y uso en código webpart |
| [checklist-tenant-uat.md](operador-renovable/checklist-tenant-uat.md) | Validación listas/CAML REST antes de UAT |
| [matriz-qa-maqueta-webpart.md](operador-renovable/matriz-qa-maqueta-webpart.md) | Escenarios manuales maqueta vs tres rutas hash |
| [modelo-datos-maqueta.md](operador-renovable/modelo-datos-maqueta.md) | Seeds JSON (`TIENE_SUBEQUIPOS_*`, `SUBEQUIPOS_INDISPONIBLES`, PGL) |

Manual funcional (maqueta): [`geme-spa-maqueta/docs/documentacion-funcional/.../operador-renovable/readme.md`](../../geme-spa-maqueta/docs/documentacion-funcional/cor-conecta/concentrador-solicitudes/operador-renovable/readme.md).

Fuente canónica maqueta: [readme técnico operador renovable](../../geme-spa-maqueta/docs/documentacion-tecnica/cor-conecta/concentrador-solicitudes/operador-renovable/readme.md) · [mapeo-listas §4.1 y §4.5](../../geme-spa-maqueta/docs/documentacion-tecnica/cor-conecta/concentrador-solicitudes/mapeo-listas/readme.md).

## Rutas y pestañas

En la maqueta las tres pestañas viven en una sola ruta (`#/operador-renovable`). En este webpart son **tres rutas hash** con carcasa compartida (`CarcasaOperadorRenovable`):

| Pestaña | Ruta hash | Componente |
| --- | --- | --- |
| Solicitudes con indisponibilidad | `#/cor-conecta/concentrador/operador-renovable/solicitudes` | `solicitudes/VistaOperadorRenovableSolicitudes.tsx` |
| Disponibilidad de equipos | `#/cor-conecta/concentrador/operador-renovable/equipos` | `equipos/VistaOperadorRenovableEquipos.tsx` |
| Limitación por subestación | `#/cor-conecta/concentrador/operador-renovable/subestacion` | `subestacion/VistaOperadorRenovableSubestacion.tsx` |

Definición: `operador-renovable/rutas.ts`. Registro: `constants/registro-vistas/corConecta.ts`.

## Motor de tareas vs operador

El operador renovable **no ejecuta tareas del motor**: marcar disponibilidad o gestionar limitaciones no escriben en `ENGINE_BITACORA` por esas acciones (historial en bitácoras de subequipo/subestación) y no aparecen en Mis Tareas.

Solo **lee** el estado de la solicitud (`TAREAACTUAL` → `TAREAORIGEN_ESTADO`) para filtro **En curso**, columna Estado e inicio efectivo (Vigente). Detalle: [comportamiento-tecnico.md](operador-renovable/comportamiento-tecnico.md).

## Permisos y ámbito de centrales

**Producción (30-oct-2026):** grupos SharePoint (p. ej. **GEME - CONC - Operador renovable**); no columnas nuevas de permiso en usuarios-instalaciones.

**Ámbito de centrales (maqueta):** todas las instalaciones **activas** (`obtenerCentralesRenovables()`), en orden de `instalaciones.json`. **No** se crea `TIPO_SUBEQUIPO`, `ES_RENOVABLE` ni `UBICACION` en Instalaciones.

**Webpart:** `ObtenerInstalacionesOperadorRenovable` → instalaciones **`ESTADO = Activo`**, módulo Concentrador, intersectadas con **`USUARIOSINSTALACIONES`** cuando aplique. Ver [listas-y-campos.md](operador-renovable/listas-y-campos.md).

## Capas de código

```text
components/vistas/.../operador-renovable/
  → hooks (UseSolicitudesOperadorRenovableLista, UseCatalogoEquiposOperadorRenovable, UseLimitacionesSubestacionOperadorRenovable)
    → services/sharepoint/operadorRenovable/
```

Modelos: `models/operadorRenovable/`, `models/concentradorComun/`. Constantes: `constantesOperadorRenovable.ts`, `CamposOperadorRenovable.ts`.

## Plan de implementación (webpart)

| Fase | Alcance | Estado |
| --- | --- | --- |
| **A — Tenant / contrato** | Checklist UAT, CAML flag documentado, [checklist-tenant-uat.md](operador-renovable/checklist-tenant-uat.md) | **Hecho** (verificación en tenant pendiente de marcar) |
| **B — PGL lookups** | `ID_SOLICITUD` / `FALLA`, formulario, ver solicitud vinculada | **Hecho** |
| **C — Equipos** | Equipos activos, filtro central, lote indisp/disp, stub Meteo subequipo | **Hecho** |
| **D — Solicitudes UX** | Celdas ID CEN/SODI y solicitante, panel gestión embebido, refresco cruzado | **Hecho** |
| **E — Integración** | Meteológica productiva, grupos SP, `FACILITY_ID_METEOLOGICA` | Pendiente |
| **F — QA y docs** | Limpieza demo, matriz QA, build | **Hecho** |
| *(histórico)* **1–3 REST** | Subequipos, solicitudes, PGL base | **Hecho** |

## Estado resumido (webpart vs maqueta, 3-nov-2026)

| Área | Maqueta | Este webpart |
| --- | --- | --- |
| Centrales operador | Todas **activas** + orden `instalaciones.json` | **`ESTADO = Activo`** ∩ Concentrador ∩ usuario |
| Tipo subequipo | Campo `tipo` en seed | `TIPOEQUIPO` en Subequipos (SP) |
| ¿Entra solicitud en grilla? | `tieneSubequiposIndisponibles` → **`TIENE_SUBEQUIPOS_INDISPONIBLES === true`** | CAML **`TIENE_SUBEQUIPOS_INDISPONIBLES = 1`** |
| Detalle subequipos | `SUBEQUIPOS_INDISPONIBLES[]` | Join **`CONC_LISTA_INDISPONIBILIDADES`** + estado en subequipo |
| Disponibilidad operativa | Maestro subequipo (no copia en solicitud) | Igual |
| Capacidades | `capacidadMaximaMw` / `capacidadActualMw` | Misma semántica; columnas SP según sitio |
| PGL | JSON sin central/kW/`finalizadoEl` | REST; derivados en servicio/UI |
| Bitácora subequipo / PGL | Memoria | Listas SP (+ fallback legacy subequipo) |
| Meteológica | Simulada | Stub en bitácora (subequipo + PGL) |
| Refresco entre pestañas | `refrescarVistas()` | `OperadorRenovableRefrescoGlobal` |
| PGL vínculos | `solicitudVinculadaId` | Lookups `ID_SOLICITUD` / `FALLA` |

## Servicios SharePoint

| Servicio | Responsabilidad |
| --- | --- |
| `RenderListDataSolicitudesIndispServicio.ts` | Grilla solicitudes + filtros |
| `ConstruirViewXmlSolicitudesIndispOperador.ts` | CAML En curso + `TIENE_SUBEQUIPOS_INDISPONIBLES` |
| `IndisponibilidadesSolicitudServicio.ts` | Join `CONC_LISTA_INDISPONIBILIDADES` |
| `SubequiposServicio.ts` | Tarjetas equipos |
| `ActualizarDisponibilidadSubequipoServicio.ts` | Solo App Function (la Function escribe SharePoint y la bitácora): `MarcarIndisponibilidadConPeriodos`, `MarcarDisponibilidadConPeriodos`, `ModificarFechaEstimadaPeriodo`, `AnularIndisponibilidadPeriodo` (App Function + bitácora) |
| `PeriodosIndisponibilidadApiServicio.ts` | Cliente de `/api/concentrador-periodos` (períodos con fecha estimada de fin y perfil a Meteológica) |
| `AplicarPeriodosSubequipos.ts` | Estado de los subequipos según los períodos abiertos (tarjetas, Gestionar) |
| `BitacoraOperadorServicio.ts` | Lee la bitácora del subequipo (`GET /api/concentrador-bitacora?subequipo=`, BD de la App Function) |
| `LimitacionesRedServicio.ts` | CRUD PGL |
| `BitacoraSubestacionServicio.ts` | `POST /api/concentrador-limitaciones/eventos` y `/reintentar`, y lectura de la bitácora de la limitación (BD de la App Function) |
| `DetalleSolicitudConcentradorServicio.ts` | Ver solicitud |
| `InstalacionesOperadorRenovableServicio.ts` | Centrales del operador |

Columnas y divergencias: [listas-y-campos.md](operador-renovable/listas-y-campos.md).

### Períodos de indisponibilidad (10-nov-2026)

Requiere la propiedad `concOperadorRenovableUrlPeriodos` (sin ella los formularios no guardan y lo indican). Marcar un subequipo indisponible pide **inicio** y **fecha estimada de fin**, y la App Function guarda un período (Azure SQL), actualiza el estado del subequipo en SharePoint y envía el **perfil completo** de la central a Meteológica. El estado de las tarjetas se calcula desde los períodos (programada, vigente, vencida). **Planificación** (el mes de una central) es una vista dentro de Disponibilidad de equipos: con una central filtrada se cambia entre **Equipos** y **Planificación** (`planificacion/PanelPlanificacionCentral.tsx`). Las bitácoras de subequipos y limitaciones están en la BD de la App Function (10-11-2026); el web part ya no escribe en listas de bitácora y se quitó la propiedad «URL capacidad de la central» (todas las URLs salen de la de períodos). Detalle: [Períodos de indisponibilidad y perfil a Meteológica](../../geme-spa-maqueta/docs/documentacion-tecnica/cor-conecta/concentrador-solicitudes/operador-renovable/periodos-indisponibilidad/readme.md).

## Alineación con la maqueta (UI y reglas)

Para paridad funcional y visual al implementar o revisar pantallas:

- **Comportamiento:** [comportamiento-tecnico.md](operador-renovable/comportamiento-tecnico.md) y readme funcional/técnico de la maqueta.
- **UI de referencia:** `geme-spa-maqueta/views/operador-renovable.html`, `operador-renovable-modales.html`, CSS `.or-*` (`css/operador-renovable.css`).
- **Validación datos demo:** `cd geme-spa-maqueta && npm run validate` y `#/operador-renovable`.

### Paridad de interacción (5-nov-2026)

Ajustes para que el web part funcione como la maqueta (`js/operador-renovable.js`):

| Pestaña | Comportamiento | Código |
| --- | --- | --- |
| Disponibilidad de equipos | Una sola acción por subequipo según su estado (`botonesDisponibilidad`): disponible → ✕ marcar indisponibilidad; indisponible → ✓ marcar disponibilidad; dado de baja → solo bitácora. | `equipos/ContenidoEquiposOperadorRenovable.tsx` (`AccionesSubequipo`) |
| | El filtro Disponible / Indisponible / Todos filtra las **filas** de cada tarjeta (Todos agrega los dados de baja); las tarjetas son los equipos con al menos un subequipo activo. | `FilasSegunFiltro` |
| | Selección por tarjeta con «Seleccionar todos» (estado intermedio) y barra de lote en la tarjeta: **Indisp.** solo si hay seleccionados disponibles y **Disp.** solo si hay indisponibles; cada botón actúa solo sobre los que corresponden. | `TarjetaEquipo` |
| | Casilla en la cabecera de la tarjeta: los indicadores pasan a ese equipo; «Quitar selección» vuelve a todos. Indicadores con kW y barra en «% sobre 100»; resumen «N equipos · K con indisponibilidad · S subequipos». | `equipoKpiId`, `resumen` |
| | Cabecera con chips (subeq., MW, disp., indisp., % fuera) y barra; fila con «X MW (queda en Y MW)»; botones Expandir / Cerrar; tarjetas en 3, 2 o 1 columnas independientes según el ancho. | `UseNumeroColumnasTarjetas` |
| | Formulario **Marcar indisponibilidad** con el orden y los controles de `#modalIndisponibilidadSubequipo`: capacidad con radios (0 MW + parciales menores que la máxima, `CapacidadesConQueQueda`; preseleccionada la actual o 0), «Máximo del equipo · Quedan fuera MW (kW) · % del equipo» (sobre `capacidadEquipoMw`), luego Motivo («Seleccione», obligatorio) y Fecha y hora en la misma fila, y Descripción. En lote, tabla por subequipo con radios y «TODOS + Aplicar». | `equipos/FormularioMarcarIndisponibilidadSubequipo.tsx` |
| Solicitudes con indisponibilidad | Modal Gestionar: la misma acción única por estado. | `solicitudes/ModalGestionarSubequiposSolicitudOperador.tsx` |
| | Búsqueda, orden por columna y paginación (con Mostrar todo) en el navegador sobre las solicitudes cargadas (hasta 200); orden inicial por fecha programada ascendente, por la fecha ISO. Columna ID = Id del ítem; sin `ID_SOLICITUD` la columna ID CEN/SODI muestra la relación SODI/CEN. | `ContenidoSolicitudesOperadorRenovable.tsx` (`GrillaLocalMui`, `ValorOrden`) |
| Limitación por subestación | Indicadores Capacidad total, Disponible, Limitado por red y % limitado (con barra) de la central filtrada o de todas: capacidad = suma de subequipos activos (`UseCatalogoEquiposOperadorRenovable`), limitado = suma de limitaciones activas. | `subestacion/ContenidoSubestacionOperadorRenovable.tsx` |
| | Estado como badge (Activa / Finalizado con su fecha de fin); columnas «Fecha efectiva de inicio / fin»; acciones en el orden Modificar, Finalizar, Ver solicitud vinculada, Bitácora; confirmación de Finalizar con el texto de la maqueta; orden y paginación locales. | ídem |
| | Formulario: central propuesta = la del filtro; Motivo empieza en «Seleccione» y es obligatorio; la solicitud vinculada aparece al elegir el motivo, con su ayuda; potencia `min 0`, `step 0.1` y kW siempre visibles; aviso del envío a Meteológica. | `subestacion/ModalLimitacionSubestacionOperador.tsx` |

Diferencias que se mantienen:

- Propias del web part: indicador «Capacidad instalada Meteológica» y aviso del 105 % en equipos y en limitaciones por subestación (al filtrar por central; `UseCapacidadMeteologicaCentral` + `equipos/IndicadorCapacidadMeteologica.tsx`, compartidos); acción «Reintentar envío a Meteológica» en limitaciones (se ofrece en todas las filas porque la lista no guarda si el último envío falló); buscador en limitaciones; en Gestionar no se distingue un subequipo dado de baja (`IndisponibilidadASubequipoOperador` lo trata como activo).
- Pendientes: «Ver solicitud» abre un resumen y no el formulario completo de administrador; «Ver solicitud vinculada» (trabajo) muestra datos parciales; la bitácora de limitaciones no muestra central, potencia, periodo ni motivo por fila; la limitación finalizada se guarda como `Finalizada` (la maqueta muestra «Finalizado»).

Nombre histórico obsoleto en código y sitios antiguos: **`TIENE_INVERSORES_INDISPONIBLES`** (sustituido por **`TIENE_SUBEQUIPOS_INDISPONIBLES`**, 3-nov-2026).
