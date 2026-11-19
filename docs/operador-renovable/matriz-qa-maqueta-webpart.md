# Matriz QA — maqueta vs webpart (Operador renovable)

Referencia maqueta: `#/operador-renovable` (tres pestañas en una ruta). Webpart: tres rutas hash bajo `cor-conecta/concentrador/operador-renovable/{solicitudes|equipos|subestacion}`.

| # | Escenario | Maqueta | Webpart | OK |
| --- | --- | --- | --- | --- |
| 1 | Grilla solicitudes solo con flag indisp | Filtro runtime | CAML `TIENE_SUBEQUIPOS_INDISPONIBLES = 1` | ☐ |
| 2 | Filtro En curso (Programada/Vigente/Extendida) | Radios | Igual | ☐ |
| 3 | Celda ID CEN + SODI (dos líneas) | HTML | `CeldaIdCenSodiSolicitudOperador` | ☐ |
| 4 | Solicitante + empresa | Segunda línea | `EMPRESA_SOLICITANTE` en ViewFields | ☐ |
| 5 | Gestionar subequipos sin modal anidado | Panel host | `#gestionInvOperacionHost` / `.or-gestion-panel` | ☐ |
| 6 | Tras indisp en equipos, solicitudes actualizan | `refrescarVistas()` | Cambiar pestaña recarga; mismo SPA suscribe refresco | ☐ |
| 7 | Tarjetas solo equipos activos + subequipos activos | Reglas catálogo | `SubequiposServicio` + filtro «Todos» | ☐ |
| 8 | Filtro dropdown central equipos | `#filtroCentral` | Select central | ☐ |
| 9 | Lote indisp/disp | Bulk bar | Selección + barra acciones | ☐ |
| 10 | Meteo simulada tras indisp/disp subequipo | Stub JS | Bitácora `Envío a Meteológica (simulado)` | ☐ |
| 11 | PGL motivo Falla → combo solicitud falla | `#pglSolicitudVinculada` | REST `CONC_LISTA_SOLICITUDFALLA` | ☐ |
| 12 | PGL motivo Trabajo → combo concentrador flag | Idem | REST concentrador + flag | ☐ |
| 13 | Ver solicitud vinculada desde grilla PGL | Menú fila | Modal concentrador / modal falla | ☐ |
| 14 | CRUD limitación + bitácora | Memoria / REST | SharePoint | ☐ |

## Solicitud de Falla (concentrador)

Documentación: [solicitud-falla.md](../solicitud-falla.md). Rutas SPA: `…/solicitud-falla` por perfil.

| # | Escenario | Maqueta | Webpart | OK |
| --- | --- | --- | --- | --- |
| F1 | Grilla columnas y radios Vigente/Finalizada/Todas | `falla-*.html` | `GrillaSolicitudFalla` + radios | ☐ |
| F2 | Alta / edición validaciones | `solicitud-falla-modals.js` | Modales + `SolicitudFallaCrudServicio` | ☐ |
| F3 | Gestionar solo Vigente + observaciones | Checkbox finalizada | `ModalGestionarSolicitudFalla` | ☐ |
| F4 | Integrar SIOD (progreso + resultado) | Simulación | `ModalIntegrarSiodSolicitudFalla` + Azure | ☐ |
| F5 | Bitácora (consulta y registros por alta/edición/gestión/SIOD) | `falla.bitacora` | `ENGINE_BITACORA` `CONCENTRADOR-SOLICITUDFALLA` | ☐ |
| F6 | Solicitante Ver + Bitácora (+ Excel si props) | Matriz rol | `solo-ver` + `ModalBitacoraSolicitudFalla` | ☐ |
| F7 | Tabs Solicitudes / Falla / Guías | `#/administrador` partial | `EnlacesTabsConcentrador` | ☐ |

Ejecutar `npm run build` antes de empaquetar `.sppkg`. Validar en tenant con [checklist-tenant-uat.md](checklist-tenant-uat.md).
