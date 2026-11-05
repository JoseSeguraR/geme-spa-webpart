# Operador renovable — modelo de datos (maqueta JSON)

Esquema de la demo en [`geme-spa-maqueta`](../../../geme-spa-maqueta). **Corte: 3-nov-2026** (`da063dc` — centrales activas; tipo en subequipo; sin `config-renovables.json`).

### Evolución reciente (nov-2026)

| Fecha | Commit | Qué cambió |
| --- | --- | --- |
| 2-nov | `bf7b623` | Indisponibilidad en solicitud: sin flag Sí/No ni `DISPONIBILIDAD_*`; solo `SUBEQUIPOS_INDISPONIBLES` |
| 3-nov | `5a6619c` | Restaura Sí/No al implementar **`CONC_LISTA_INDISPONIBILIDADES`** |
| 3-nov | `2d7dbc2` | Flag unificado: **`TIENE_SUBEQUIPOS_INDISPONIBLES`** |
| 3-nov | `8bb5843` / `da063dc` | **Revoca `TIPO_SUBEQUIPO` en Instalaciones**; elimina uso de **`config-renovables.json`**; **`obtenerCentralesRenovables()`** = todas las instalaciones **activas** (orden `instalaciones.json`); tipo en cada subequipo (`tipo` en seed → **`TIPOEQUIPO`** en SP) |

Mapeo SP: [listas-y-campos.md](listas-y-campos.md). Fuente: [readme técnico §2](../../../geme-spa-maqueta/docs/documentacion-tecnica/cor-conecta/concentrador-solicitudes/operador-renovable/readme.md).

## Archivos seed

| Archivo | Contenido relevante operador |
| --- | --- |
| `solicitudes.json` | **`TIENE_SUBEQUIPOS_INDISPONIBLES`** + **`SUBEQUIPOS_INDISPONIBLES[]`** |
| `subequipos-renovables.json` | Subequipos embebidos en equipos; cada uno con **`tipo`** (p. ej. `INVERSOR`, `BATERIA`); indisponibilidad demo en subequipo (p. ej. **SUB-29-INV-01** / solicitud #18) |
| `limitaciones-red.json` | PGL sin `central`, kW ni `finalizadoEl` |
| `instalaciones.json`, `equipos-por-instalacion.json` | Maestros; **no** hay lista aparte de “centrales renovables” |

~~`config-renovables.json`~~ — **ya no se carga** (03-nov-2026). Quedan solo referencias históricas en esquemas legacy si existen.

Validación: `npm run validate` — el flag debe coincidir con que `SUBEQUIPOS_INDISPONIBLES` tenga elementos.

## Centrales del operador

- **`obtenerCentralesRenovables()`** (`data/maestros.js`): recorre **`instalaciones.json`** y devuelve cada central con **`activo === true`**, con equipos en estado **`Activo`**.
- Cualquier central activa puede tener subequipos (mantenedor y operador); en la demo hay datos en 5 centrales (`SANTIAGO_SOLAR`, `LOS_VIENTOS`, `CEME1`, `SANTA_LIDIA`, `NUEVA_RENCA`).
- **No** se usa `codigosCentralesRenovables[]`, **`tipoSubequipoPorCentral`** ni columna **`TIPO_SUBEQUIPO`** en la central.

## Tipo de subequipo

| Maqueta | Producción |
| --- | --- |
| Campo **`tipo`** en el objeto subequipo (código catálogo, p. ej. `INVERSOR`) | Lookup **`TIPOEQUIPO`** → `CONC_MANTENEDOR_TIPOSEQUIPOS` en **`CONC_MANTENEDOR_SUBEQUIPOS`** |
| **`obtenerTipoSubequipoPorCentral(codigo, equipoId)`** — propone tipo al alta: primero subequipos del mismo equipo, luego de la central; default **`INVERSOR`** | Misma UX; persistir en subequipo |

Indisponibilidades en solicitud también guardan **`TIPOEQUIPO`** por fila en **`CONC_LISTA_INDISPONIBILIDADES`** (snapshot al guardar formulario).

## Solicitud — indisponibilidad

| Campo | Uso |
| --- | --- |
| **`TIENE_SUBEQUIPOS_INDISPONIBLES`** | Respuesta Sí/No; `tieneSubequiposIndisponibles(solicitud)` |
| **`SUBEQUIPOS_INDISPONIBLES`** | `"equipoId:subequipoId"` (SP: filas Indisponibilidades) |
| ~~`DISPONIBILIDAD_SUBEQUIPOS`~~ | No se guarda |

`estadoSubequipoSolicitud` lee el subequipo del maestro. Operador renovable filtra con `tieneSubequiposIndisponibles()` en `js/operador-renovable.js`.

## Subequipo, PGL, relaciones

Igual que [comportamiento-tecnico.md](comportamiento-tecnico.md) §2–5: `capacidadMaximaMw` / `capacidadActualMw`; PGL con campos derivados vía `nombreCentralLimitacion`, `mwAKw`, `fechaFinalizacionLimitacion`.

```text
Central (activa) ──► Equipo ──► Subequipo (tipo) ◄── SUBEQUIPOS_INDISPONIBLES ── Solicitud
```
