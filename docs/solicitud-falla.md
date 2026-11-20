# Solicitud de Falla

Módulo del Concentrador (COR Conecta) para registrar perturbaciones post-evento en centrales GM. Convenciones de layout, grilla y modales: [arquitectura-spa.md](arquitectura-spa.md).

El **estado de negocio** es la columna `ESTADO` en `CONC_LISTA_SOLICITUDFALLA` (`Vigente` / `Finalizada`). La **integración SIOD** no tiene columnas propias en la lista de fallas: el indicador visible proviene de entradas en `ENGINE_BITACORA` (`IntegracionSiodDesdeBitacoraSolicitudFalla`).

## Perfiles y rutas

| Perfil | Ruta (`#/…`) | Entrada |
| --- | --- | --- |
| Administrador | `cor-conecta/concentrador/administrador/solicitud-falla` | `administrador/VistaSolicitudFalla.tsx` |
| Despachador | `cor-conecta/concentrador/despachador/solicitud-falla` | `despachador/VistaSolicitudFalla.tsx` |
| Solicitante | `cor-conecta/concentrador/solicitante/solicitud-falla` | `solicitante/VistaSolicitudFalla.tsx` |

Registro: `constants/registro-vistas/corConecta.ts`. Ancla de menú: `…/solicitudes` en `constants/AnclasMenuGrupoRuta.ts`.

Pestañas del grupo: Solicitudes (SitePages clásicas), **Solicitud de Falla** (SPA) y Guías de Maniobra (`EnlacesTabsConcentrador.ts`).

### Acciones de fila (`DesplegableAccionesFilaSolicitudFalla`)

El modo de menú lo define `PerfilVistaSolicitudFalla.ts` (`completo` vs `solo-ver`).

| Perfil | Alta en grilla | Acciones |
| --- | --- | --- |
| Administrador / Despachador | Sí | Ver, editar, bitácora. **Gestionar** solo si **Vigente**. **Integrar a SIOD** si no está **Finalizada** y aún no figura integrada. **Finalizada**: ver, editar y bitácora (sin gestionar ni SIOD). |
| Solicitante | No | Ver y bitácora (Excel vinculado si el web part lo expone). |

El solicitante solo ve solicitudes de instalaciones asignadas en `CONC_MANTENEDOR_USUARIOSINSTALACIONES` (módulo `Concentrador`). Sin instalaciones, la grilla queda vacía.

**Estados en grilla:** badges en columna `estado` vía `PresentacionEstadoSolicitudFalla` — `Finalizada` verde, `Vigente` amarillo, otros gris.

## Interfaz (`VistaSolicitudFallaContenido`)

Carpeta: `components/vistas/cor-conecta/concentrador/solicitudes-falla/`.

- Radios: Vigentes (inicial), Finalizadas, Todas (`EstadosFiltroSolicitudFallaRadio`).
- Filtros: central, equipos (multiselección `SelectMultipleFiltroVista`), rangos de perturbación y retorno efectivo.
- Búsqueda, paginación y orden: `GrillaSolicitudFalla` + `UseSolicitudFallaLista` + `GrillaServidorMui`.
- Modales: nueva, editar, ver, gestionar, integrar SIOD, bitácora.

**Carcasa de modales:** clase `cowork-modal-solicitud-falla` en `styles/_vista.scss` (cabecera `#003773`, tarjetas, tipografía 9 pt). Los formularios de negocio usan `FormularioCamposSolicitudFalla` con `disposicion="secciones"` y `PresentacionDetalleSolicitudFalla` para el detalle compartido (Ver / Gestionar).

**Alertas de validación y resultado:** en modales de alta, edición, gestión, bitácora e integración SIOD, los mensajes de error o resultado van al final del `modal-body` (`cowork-modal-solicitud-falla__alertas-pie`), cerca del pie con los botones.

**Grilla — carga:** `GrillaServidorMui` no muestra filas mientras `estadoCarga` es `inicial` o `cargando` (overlay «Cargando…» sin datos superpuestos). La grilla de falla usa `alturaAutomatica` y alineación superior de celdas (`cowork-vista-tabla-mui--celdas-superior`).

## Listas SharePoint

| Lista | Uso principal |
| --- | --- |
| `CONC_LISTA_SOLICITUDFALLA` | Solicitud: `ID_CEN`, `INSTALACION_GM`, `EQUIPOS` (multilookup), fechas, `POTENCIA`, `MEDIDA`, `DESCRIPCION`, `ESTADO`, `ID_BITACORA` (texto; puntero al registro de flujo vigente), adjuntos. |
| `ENGINE_BITACORA` | Historial y flujo. `TIPO_REGISTRO` **`CONCENTRADOR-SOLICITUDFALLA`**. |
| `CONC_MANTENEDOR_INSTALACIONES` / equipos por central | Catálogos de formularios y filtros. |
| `CONC_MANTENEDOR_USUARIOSINSTALACIONES` | Restricción de instalaciones (solicitante). |

Constantes de dominio: `constantesSolicitudFalla.ts` (`TipoRegistroBitacoraSolicitudFalla`, `ActorTareaOrigenBitacoraSolicitudFalla`, `ConstruirTareaIdentificadorSolicitudFalla`, `ClasificacionTareaBitacoraCierre`, etc.).

Campos REST y nombres internos: `services/sharepoint/solicitudesFalla/CamposListaSolicitudFalla.ts`. Multilookup de equipos en alta/edición: array de ids + `EQUIPOSId@odata.type: 'Collection(Edm.Int32)'` (`SolicitudFallaCrudServicio`).

### Bitácora — consulta (modal Bitácora)

`ObtenerFilasBitacoraSolicitudFalla` filtra por `ID_REGISTRO` + `TIPO_REGISTRO` (`ConstruirViewXmlBitacoraEngine`). Columnas en grilla (`ModalBitacoraSolicitudFalla`):

ID, Tarea (`TAREA_IDENTIFICADOR`), Fecha Inicio, Estado Inicial (`TAREAORIGEN_ESTADO` con badge de estado), Responsable (`TAREAORIGEN_RESPONSABLE_MULTIPLE`, varios usuarios en líneas separadas), Responsable Avance (`USUARIOAVANCE`), Fecha Cierre, Observaciones (`RESPONSABLE_COMENTARIOS`; HTML de SharePoint se normaliza a texto con `TextoPlanoDesdeHtmlSharePoint`).

Banner «Estado actual» de la solicitud: último registro de bitácora (prioriza estado final si existe).

## Flujos de escritura en `ENGINE_BITACORA`

Implementación: `services/sharepoint/solicitudesFalla/BitacoraSolicitudFallaServicio.ts` y orquestadores en la misma carpeta.

### Alta (`RegistrarNuevaSolicitudFallaCompleta`)

1. Valida adjuntos y `ID_CEN` único.
2. Crea ítem en `CONC_LISTA_SOLICITUDFALLA` (estado **Vigente** en creación).
3. Sube adjuntos.
4. `CrearEntradaBitacoraAltaSolicitudFalla`: `CLASIFICACION_TAREA` **FLUJO**, `TAREAORIGEN_ESTADO` **Vigente**, `TAREAORIGEN_ACTOR` **CONCENTRADOR - SOLICITUD DE FALLA**, `TAREA_IDENTIFICADOR` **`SOLICITUDFALLA-{id}`**, `TAREAORIGEN_RESPONSABLE_MULTIPLEId` (usuario actual), `ES_TAREA_PENDIENTE` **0**.
5. `ActualizarIdBitacoraFalla` en la solicitud con el id del registro creado.

### Edición (`GuardarEdicionSolicitudFallaCompleta`)

Actualiza campos y adjuntos en la lista **sin cambiar `ESTADO`**. Tras guardar, `CrearEntradaBitacoraEdicionSolicitudFalla`: registro de auditoría con el mismo `TIPO_REGISTRO`, `TAREAORIGEN_ESTADO` = estado actual de la solicitud, `CLASIFICACION_TAREA` **FLUJO**, `RESPONSABLE_COMENTARIOS` = **«Edición de la Solicitud»**. No actualiza `ID_BITACORA` (no cierra el flujo vigente).

### Gestión — finalizar (`FinalizarGestionSolicitudFallaConBitacora`)

Solo solicitudes **Vigente**. El modal exige «Marcar como Finalizada» y observaciones opcionales.

1. **Cierra** el registro apuntado por `ID_BITACORA` (o el abierto más reciente): `TAREAORIGEN_FECHASALIDA`, `USUARIOAVANCEId`, `RESPONSABLE_COMENTARIOS` = observaciones del formulario.
2. **Crea** registro de cierre: `TAREAORIGEN_ESTADO` **Finalizada**, `CLASIFICACION_TAREA` **CIERRE**, resto alineado al alta/cierre (actor, identificador, responsable múltiple).
3. **MERGE** en solicitud: `ESTADO` = **Finalizada** y nuevo `ID_BITACORA`.

El detalle en **Gestionar** reutiliza `PresentacionDetalleSolicitudFalla` **sin** la sección SIOD (`mostrarIntegracionSiod={false}`). Card **Acción de Gestión** (cabecera amarilla): leyenda, checkbox y observaciones.

### Integración SIOD

`IntegrarSiodSolicitudFallaServicio` llama a la Function configurada y registra el resultado en bitácora (`CrearEntradaBitacoraSolicitudFalla`): `TAREA_IDENTIFICADOR` = `SOLICITUDFALLA-{id}`, `TAREAORIGEN_ESTADO` = `Exitosa` o `Fallida`, `RESPONSABLE_COMENTARIOS` = texto de éxito o fallo de la integración.

**Modal:** card **Información Solicitud** (ID CEN, central, estado), leyenda informativa SIOD, barra de **Progreso** (solo tras **Iniciar Integración**; permanece visible hasta cerrar el modal). Al cerrar y reabrir, el estado del modal se reinicia (sin progreso ni resultado previo). Pie: **Cancelar** + **Iniciar Integración** (`bi-play-fill`); tras resultado, **Cerrar**.

## Consulta de la grilla

`UseSolicitudFallaLista` + `RenderListDataAsStream` (`ConstruirViewXmlSolicitudFalla`). Filtro por equipos anidado en CAML. «Mostrar todo» usa lotes de 500 (`TamanoLoteCargaCompletaSolicitudFalla`). Estado SIOD en filas: enriquecimiento asíncrono `EnriquecerFilasIntegracionSiodDesdeBitacora`.

Mapa de ordenación principal: `UseSolicitudFallaLista` → `MapaCampoOrdenGrilla`.

## Propiedades del Web Part

Grupos **Solicitud de Falla · Enlaces** y **Solicitud de Falla · SIOD** en el property pane COR Conecta. Llegan como `PropsVistaSpa.propiedadesSolicitudFalla` (`ConfiguracionSolicitudFalla.ts`); la URL de insert SIOD alimenta el modal de integración.

## Operador renovable

Detalle de falla vinculado en PGL: `services/sharepoint/solicitudesFalla/DetalleSolicitudFallaServicio.ts` (reexportado desde `operadorRenovable/`).

## Servicios (referencia rápida)

| Área | Archivo |
| --- | --- |
| CRUD lista fallas | `SolicitudFallaCrudServicio.ts` |
| Alta completa | `RegistrarNuevaSolicitudFallaCompleta.ts` |
| Edición completa | `GuardarEdicionSolicitudFallaCompleta.ts` |
| Gestión / cierre bitácora | `GestionarFinalizacionSolicitudFallaServicio.ts` |
| Bitácora | `BitacoraSolicitudFallaServicio.ts` |
| SIOD API + bitácora integración | `IntegrarSiodSolicitudFallaServicio.ts`, `SiodSolicitudFallaApiServicio.ts` |
| Estado SIOD desde bitácora | `IntegracionSiodDesdeBitacoraSolicitudFalla.ts` |
| Grilla RenderListData | `RenderListDataSolicitudFallaServicio.ts` |

## Prerrequisitos en tenant

Ítems de menú con los `HASH_KEY` de cada perfil en `SISTEMA_ACCESOS`. Lista `ENGINE_BITACORA` con campos usados arriba (incluido `RESPONSABLE_COMENTARIOS` y lookup multivalor de responsables). Registros legados con `TIPO_REGISTRO` distinto (p. ej. `SOLICITUD_FALLA`) no aparecen en la bitácora del módulo actual salvo migración o ampliación del filtro.