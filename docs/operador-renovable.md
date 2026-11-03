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
| `ActualizarDisponibilidadSubequipoServicio.ts` | PATCH + bitácora |
| `BitacoraOperadorServicio.ts` | Bitácora subequipo |
| `LimitacionesRedServicio.ts` | CRUD PGL |
| `BitacoraSubestacionServicio.ts` | Bitácora limitación |
| `DetalleSolicitudConcentradorServicio.ts` | Ver solicitud |
| `InstalacionesOperadorRenovableServicio.ts` | Centrales del operador |

Columnas y divergencias: [listas-y-campos.md](operador-renovable/listas-y-campos.md).

## Alineación con la maqueta (UI y reglas)

Para paridad funcional y visual al implementar o revisar pantallas:

- **Comportamiento:** [comportamiento-tecnico.md](operador-renovable/comportamiento-tecnico.md) y readme funcional/técnico de la maqueta.
- **UI de referencia:** `geme-spa-maqueta/views/operador-renovable.html`, `operador-renovable-modales.html`, CSS `.or-*` (`css/operador-renovable.css`).
- **Validación datos demo:** `cd geme-spa-maqueta && npm run validate` y `#/operador-renovable`.

Nombre histórico obsoleto en código y sitios antiguos: **`TIENE_INVERSORES_INDISPONIBLES`** (sustituido por **`TIENE_SUBEQUIPOS_INDISPONIBLES`**, 3-nov-2026).
