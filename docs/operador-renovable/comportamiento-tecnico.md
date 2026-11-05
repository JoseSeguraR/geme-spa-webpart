# Operador renovable — comportamiento técnico

Sincronizado con [`geme-spa-maqueta/.../operador-renovable/readme.md`](../../../geme-spa-maqueta/docs/documentacion-tecnica/cor-conecta/concentrador-solicitudes/operador-renovable/readme.md). **Corte maqueta: 3-nov-2026** (`da063dc`).

Persistencia en **geme-spa-webpart**: SharePoint; ver [operador-renovable.md](../operador-renovable.md) y [listas-y-campos.md](listas-y-campos.md).

Manual funcional: [readme funcional maqueta](../../../geme-spa-maqueta/docs/documentacion-funcional/cor-conecta/concentrador-solicitudes/operador-renovable/readme.md).

---

## 1. Estructura

### Maqueta

- Ruta `#/operador-renovable`, tres pestañas en partials, `js/operador-renovable.js`, CSS `.or-*`, modales `operador-renovable-modales.html`.
- Inicialización idempotente: `inicializarOperadorRenovable()`, eventos `.operadorRenovable`, acciones `data-accion-or`.

### Webpart

- Tres rutas hash bajo `operador-renovable/`; React + servicios REST; estilos `cowork-operador-renovable__*`.

---

## 2. Datos

| Ámbito | Maqueta (3-nov-2026) | Producción / webpart |
| --- | --- | --- |
| Centrales operador | Todas **activas**; `obtenerCentralesRenovables()` sobre `instalaciones.json` | Filas **`ESTADO = Activo`** en **`CONC_MANTENEDOR_INSTALACIONES`** ∩ usuario |
| Tipo subequipo | `tipo` en objeto subequipo; `obtenerTipoSubequipoPorCentral()` al alta | **`TIPOEQUIPO`** en `CONC_MANTENEDOR_SUBEQUIPOS` |
| Subequipos | Seed embebido; `capacidadMaximaMw`, `capacidadActualMw` | `CONC_MANTENEDOR_SUBEQUIPOS` |
| Solicitud — Sí/No | **`TIENE_SUBEQUIPOS_INDISPONIBLES`** (boolean; `tieneSubequiposIndisponibles`) | Misma columna en Concentrador (Sí/No en sitio) |
| Solicitud — detalle | **`SUBEQUIPOS_INDISPONIBLES[]`** (`equipoId:subequipoId`) | Filas **`CONC_LISTA_INDISPONIBILIDADES`** |
| Disponibilidad | Solo en subequipo maestro | `DISPONIBILIDAD` en subequipo SP |
| PGL | `limitacionesRedData` sin central/kW/`finalizadoEl` | `CONC_LISTA_LIMITACIONESRED` + bitácora subestación |
| Bitácora operador | Arrays en memoria | Bitácoras SP dedicadas |

Esquema listas: [listas-y-campos.md](listas-y-campos.md).

---

## 3. Funcionalidades

### 3.1 Solicitudes con indisponibilidad

- Incluye solicitudes con **`tieneSubequiposIndisponibles(solicitud)`** → **`TIENE_SUBEQUIPOS_INDISPONIBLES === true`** (`data/solicitudes-runtime.js`). Al guardar, el formulario deja el flag coherente con que haya refs en **`SUBEQUIPOS_INDISPONIBLES`** (`npm run validate`).
- **Filtro estado:** por defecto **En curso** — `Programada`, `Vigente`, `Extendida`.
- Filtro indisponibilidad: todas / alerta (algún subequipo `Indisponible` en maestro) / ok.
- KPIs sobre el conjunto filtrado por estado.
- Filas en alerta: `or-sol-row-alerta`.

**Motor:** solo lectura de estado solicitud para filtro, columna e inicio efectivo (Vigente).

**Webpart:** RenderListData + CAML En curso. Inclusión: **`TIENE_SUBEQUIPOS_INDISPONIBLES = 1`** (`ConstruirViewXmlSolicitudesIndispOperador.ts`, constante `CampoTieneSubequiposIndisponibles`). Sin sondeo REST ni fallback: el esquema del tenant debe estar al día.

Detalle de subequipos: `IndisponibilidadesSolicitudServicio` + estado en subequipo. **No** usar **`TIENE_INVERSORES_INDISPONIBLES`**.

### 3.2 Disponibilidad de equipos

Tarjetas por equipo en **todas las centrales activas** (equipos `Activo`); filtros, KPIs MW, lote Indisp./Disp. Mantenedor: subequipos en cualquier central activa (tipo en cada subequipo).

Al confirmar: actualiza subequipo (`capacidadActualMw`, motivo, fechas), bitácora subequipo, stub Meteológica en maqueta. **No** copia disponibilidad en la solicitud.

**Webpart:** PATCH + `BitacoraOperadorServicio`.

### 3.3 Limitación por subestación (PGL)

Filtros, CRUD, kW/central/fin derivados, bitácora con `descripcion`, vínculo falla/trabajo vía `tieneSubequiposIndisponibles` en maqueta.

**Webpart:** `LimitacionesRedServicio.ts` + hook subestación.

---

## 4. Reglas de negocio

```text
Subequipo: Disponible ⇄ Indisponible (motivo, fecha, capacidad actual)
PGL: Activa → modificar | finalizar → Finalizada/Finalizado
```

Maqueta: `alert`/`confirm` ([pendientes](../../../geme-spa-maqueta/docs/documentacion-tecnica/cor-conecta/concentrador-solicitudes/pendientes/readme.md) § Operador renovable).

---

## 5. Cálculos

```text
indisponibleMw = Σ (capacidadMaximaMw − capacidadActualMw)   (subequipos Indisponible)
```

kW = MW × 1000 solo en UI.

---

## 6. Bitácoras

Subequipo y limitación en listas SP target; solicitud (flujo) en `ENGINE_BITACORA` (solo lectura desde operador).

---

## 7. Meteológica

Simulada en maqueta y en webpart (bitácora subequipo y limitación PGL; sin App Function productiva). Integración real: fase E / [operador-renovable.md](../operador-renovable.md).

---

## 8. Pendientes

| Tema | Maqueta | Webpart |
| --- | --- | --- |
| Meteológica productiva | Simulada | Stub documentado; API pendiente |
| `abrirAgregarInversorOperador` | Sin botón UI | No portado (no bloquea) |
| Refresco cruzado pestañas | `refrescarVistas()` | `OperadorRenovableRefrescoGlobal` |

---

## 9. Prueba maqueta

```bash
cd geme-spa-maqueta
npx --yes http-server -p 8096 -c-1
npm run validate
```

---

## Referencias maqueta

- [Solicitudes § equipos indisponibles](../../../geme-spa-maqueta/docs/documentacion-tecnica/cor-conecta/concentrador-solicitudes/solicitudes/readme.md)
- [Mapeo listas §4.5 Indisponibilidades](../../../geme-spa-maqueta/docs/documentacion-tecnica/cor-conecta/concentrador-solicitudes/mapeo-listas/readme.md)
- [Ajustes maqueta § TIENE_SUBEQUIPOS (03-nov)](../../../geme-spa-maqueta/docs/documentacion-tecnica/cor-conecta/concentrador-solicitudes/ajustes-maqueta/readme.md)
