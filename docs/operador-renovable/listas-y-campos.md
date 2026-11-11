# Operador renovable — listas y campos SharePoint

Consolidado desde [mapeo-listas (sitio `geme`)](../../../geme-spa-maqueta/docs/documentacion-tecnica/cor-conecta/concentrador-solicitudes/mapeo-listas/readme.md), decisiones **30-oct-2026** y alineación maqueta **3-nov-2026** (`da063dc` — centrales activas; **sin** `TIPO_SUBEQUIPO` en Instalaciones), más el código de `geme-spa-webpart`.

Convención: lookups por **Id**. Elecciones en sitio `geme`: **`Falla` / `Trabajo`**.

## Resumen de listas

| Lista | Rol en operador |
| --- | --- |
| `CONC_LISTA_CONCENTRADOR` | Solicitud; **`TIENE_SUBEQUIPOS_INDISPONIBLES`** (Sí/No) |
| `CONC_LISTA_INDISPONIBILIDADES` | Una fila por subequipo marcado en el formulario |
| `CONC_MANTENEDOR_SUBEQUIPOS` | Catálogo + **`DISPONIBILIDAD`** operativa |
| `CONC_LISTA_LIMITACIONESRED` | PGL |
| ~~`CONC_LISTA_BITACORA_SUBEQUIPO` / `CONC_LISTA_BITACORA_SUBESTACION`~~ | Reemplazadas el 10-11-2026 por `app.concentrador_bitacora_subequipo` y `app.concentrador_bitacora_limitacion` (BD de la App Function); se leen con `GET /api/concentrador-bitacora` |
| `CONC_LISTA_BITACORAOPERADOR` | Legacy; fallback webpart subequipo |
| `CONC_MANTENEDOR_INSTALACIONES` | Ámbito operador = **todas las filas activas** (intersectadas con usuario); **no** crear `TIPO_SUBEQUIPO` ni `ES_RENOVABLE` |
| `ENGINE_BITACORA` | Solo lectura estado solicitud |

Constantes: `constantesOperadorRenovable.ts`, `CamposOperadorRenovable.ts`.

---

## `CONC_LISTA_CONCENTRADOR`

| Campo | Maqueta | Sitio / webpart |
| --- | --- | --- |
| **`TIENE_SUBEQUIPOS_INDISPONIBLES`** | boolean en `solicitudes.json` | Columna Sí/No existente (formulario desde 29-10-2026; nombre unificado 03-nov-2026) |
| Detalle subequipos | `SUBEQUIPOS_INDISPONIBLES[]` | **`CONC_LISTA_INDISPONIBILIDADES`** (no lookup múltiple en Concentrador) |
| Disponibilidad | No en solicitud | **`CONC_MANTENEDOR_SUBEQUIPOS.DISPONIBILIDAD`** |

**Webpart — inclusión en grilla:** CAML fijo en `ConstruirViewXmlSolicitudesIndispOperador.ts`: **`TIENE_SUBEQUIPOS_INDISPONIBLES = 1`** con **`Type="Boolean"`** (campo Sí/No nativo de SharePoint). Sin sondeo de esquema ni fallback: si la columna falta en el tenant, RenderListData debe fallar (etapa de desarrollo con listas nuevas).

**Tipo de columna (tenant):** en sitio `geme` la columna es **Sí/No** (booleano interno). Si en otro tenant fuera **Choice** con valores visibles «Sí»/«No», el filtro CAML debe usar `Type="Text"` y el valor acordado; registrar el resultado en [checklist-tenant-uat.md](checklist-tenant-uat.md).

**ViewFields adicionales (grilla):** `EMPRESA_SOLICITANTE` (segunda línea bajo solicitante, paridad maqueta) cuando exista en la lista Concentrador.

Obsoleto: **`TIENE_INVERSORES_INDISPONIBLES`** (eliminado del sitio; no referenciar en código).

---

## `CONC_LISTA_INDISPONIBILIDADES` (estructura 03-nov-2026, en implementación)

| Columna | Notas |
| --- | --- |
| `ID_SOLICITUD` | → Concentrador (indexado) |
| `EQUIPO` | → Equipos (agrupar en UI) |
| `SUBEQUIPO` | → Subequipos (indexado) |
| `TIPOEQUIPO` | → TiposEquipos |
| `INSTALACION` | → Instalaciones (central de la solicitud) |
| `CAPACIDAD_MW` | Snapshot al guardar formulario (**por confirmar** uso) |

La llena el **formulario de solicitud**; el operador **no escribe** en esta lista. Estado operativo en subequipo.

**Webpart:** `IndisponibilidadesSolicitudServicio` enriquece columnas Equipos / Disponibilidad tras RenderListData (no sustituye el filtro CAML del flag).

---

## `CONC_MANTENEDOR_SUBEQUIPOS`

Ver mapeo §4.5. Destacado operador: **`TIPOEQUIPO`** (tipo del subequipo; no en Instalaciones), **`CAPACIDAD_MAXIMA_MW`**, **`CAPACIDAD_ACTUAL_MW`**, **`DISPONIBILIDAD`**, **`MOTIVO`** (Falla/Trabajo), lookups **`INSTALACION`** / **`EQUIPO`**.

Webpart: `SubequiposServicio`, `ActualizarDisponibilidadSubequipoServicio`.

---

## `CONC_LISTA_LIMITACIONESRED`

`INSTALACION`, `POTENCIA_LIMITADA_MW`, fechas, `MOTIVO`, `DESCRIPCION`, **`ID_SOLICITUD`**, **`FALLA`**, `ESTADO` (Activa/Finalizada).

Webpart: `LimitacionesRedServicio.ts`, `SolicitudesVinculadasPglServicio.ts` (combos formulario), lookups persistidos en POST/PATCH (`ID_SOLICITUDId`, `FALLAId`).

---

## `CONC_MANTENEDOR_INSTALACIONES`

**Target (03-nov-2026, maqueta `da063dc`):** el Operador renovable usa **todas las centrales activas** del mantenedor (mismo criterio que `obtenerCentralesRenovables()`). Cualquiera puede tener subequipos; el **tipo** vive en **`CONC_MANTENEDOR_SUBEQUIPOS.TIPOEQUIPO`**.

**No crear** en Instalaciones: ~~`TIPO_SUBEQUIPO`~~ (propuesta revocada el 03-nov), ~~`ES_RENOVABLE`~~, ~~`UBICACION`~~ (30-oct-2026). Pendiente de producto: **`FACILITY_ID_METEOLOGICA`** (Meteológica; ver mapeo §4.3).

**Webpart:** `CentralesInstalacionesServicio` / `InstalacionesOperadorRenovableServicio` — `$select` sin columnas revocadas; filtro **`ESTADO eq 'Activo'`** + módulo Concentrador + usuario.

---

## Valores en código

| Constante | Valor |
| --- | --- |
| `CampoTieneSubequiposIndisponibles` | `TIENE_SUBEQUIPOS_INDISPONIBLES` |
| `EstadosEnCursoOperadorRenovable` | Programada, Vigente, Extendida |
| Motivos | Falla, Trabajo |

---

## Reglas de mapeo (3-nov-2026)

1. Sí/No en solicitud = **`TIENE_SUBEQUIPOS_INDISPONIBLES`**; refs en maqueta = **`SUBEQUIPOS_INDISPONIBLES[]`**; en SP = filas Indisponibilidades.
2. Disponibilidad **solo** en subequipo.
3. Centrales operador = **instalaciones activas** (maqueta: orden `instalaciones.json`; SP: filas activas de Instalaciones ∩ permisos usuario). **No** `TIPO_SUBEQUIPO` en Instalaciones.
4. Tipo de subequipo = **`TIPOEQUIPO`** en Subequipos (+ fila Indisponibilidades al guardar solicitud).
5. kW calculados; PGL sin campos derivados persistidos en maqueta JSON.

Script esquema: [`esquema-listas-concentrador.js`](../../../geme-spa-maqueta/scripts/sharepoint-consola/esquema-listas-concentrador.js).
