# Checklist tenant UAT — Operador renovable

Validación previa a UAT en sitio de prueba (referencia: sitio `geme`, [mapeo-listas §4.5](../../../geme-spa-maqueta/docs/documentacion-tecnica/cor-conecta/concentrador-solicitudes/mapeo-listas/readme.md)).

## Listas y permisos

| Ítem | Lista / recurso | Acción |
| --- | --- | --- |
| ☐ | `CONC_LISTA_CONCENTRADOR` | Existe columna **`TIENE_SUBEQUIPOS_INDISPONIBLES`** (Sí/No) |
| ☐ | `CONC_LISTA_INDISPONIBILIDADES` | Lookups `ID_SOLICITUD`, `SUBEQUIPO`, `EQUIPO`, `INSTALACION`, `TIPOEQUIPO` |
| ☐ | `CONC_MANTENEDOR_SUBEQUIPOS` | `CAPACIDAD_MAXIMA_MW`, `CAPACIDAD_ACTUAL_MW`, `CAPACIDADES_MW`, `DISPONIBILIDAD`, `ESTADO` |
| ☐ | `CONC_MANTENEDOR_EQUIPOS` | `ESTADO`, lookup `INSTALACION` |
| ☐ | `CONC_LISTA_LIMITACIONESRED` | Lookups `ID_SOLICITUD` → Concentrador, `FALLA` → Solicitud falla |
| ☐ | `CONC_LISTA_SOLICITUDFALLA` | Columnas `ID_CEN`, `ESTADO`, `INSTALACION_GM` |
| ☐ | Bitácoras subequipo / subestación | Escritura grupo Operador renovable |
| ☐ | Grupo **GEME - CONC - Operador renovable** | Matriz lectura/escritura acordada |

## Pruebas REST (manual o Postman / consola en workbench)

| # | Escenario | Resultado esperado |
| --- | --- | --- |
| 1 | **RenderListData** solicitudes con View XML de `ConstruirViewXmlSolicitudesIndispOperador` | Filas solo con flag activo y ámbito de instalaciones del usuario |
| 2 | **Join** `CONC_LISTA_INDISPONIBILIDADES` por `ID_SOLICITUDId` | Columnas Equipos / Disponibilidad coherentes con maestro subequipo |
| 3 | **PATCH** subequipo `DISPONIBILIDAD` + bitácora | Item actualizado; evento en bitácora target (o legacy si aplica) |
| 4 | **POST/PATCH** limitación con `ID_SOLICITUDId` o `FALLAId` | Lookups persistidos; lectura en grilla PGL |
| 5 | **CRUD** limitación sin vínculo (motivo Trabajo sin combo) | Guardado válido si producto lo permite |

## Columna `TIENE_SUBEQUIPOS_INDISPONIBLES` (CAML)

| Tipo en sitio | Filtro CAML en webpart | Notas |
| --- | --- | --- |
| **Sí/No** (campo booleano SharePoint) | `Type="Boolean"` + valor **`1`** | **Default en código** (sitio `geme`, nov 2026). Ver `CamposOperadorRenovable.ts`. |
| Choice texto Sí/No | `Type="Text"` + **`Sí`** | Si RenderListData devuelve 0 filas o error CAML, cambiar en `ConstruirFiltroTieneSubequiposIndisponibles`. |

Documentar aquí el tipo verificado en tenant:

- **Fecha verificación:** _pendiente en tenant_
- **Tipo confirmado:** _Sí/No booleano_ / _Choice_
- **Resultado prueba 1 (RenderListData):** _OK / fallo_

## Bitácora legacy

| ☐ | Criterio para retirar fallback `CONC_LISTA_BITACORAOPERADOR` |
| --- | --- |
| | Bitácora subequipo target poblada y estable en tenant de producción |
