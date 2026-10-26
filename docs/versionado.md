# Versionado del producto

GEME SPA Webpart es un **artefacto SPFx** (`.sppkg`) desplegado en el App Catalog del tenant. La versión de producto no coincide con la de un paquete npm publicado ni con la del framework SharePoint.

## Fuente de verdad

La versión oficial del producto es **`config/package-solution.json`** → **`solution.version`**.

Formato de cuatro segmentos (SharePoint / App Catalog):

```text
X.Y.Z.B
```

| Segmento | Significado orientativo |
| --- | --- |
| **X** | Cambio incompatible: contratos REST, modelo de listas, registro de rutas, propiedades del panel del Web Part, permisos o feature que exijan migración o reconfiguración consciente. |
| **Y** | Funcionalidad nueva compatible: vistas, servicios o módulos de negocio sin romper despliegues existentes. |
| **Z** | Correcciones, ajustes de UX, documentación empaquetada, refactors sin cambio de contrato. |
| **B** | **Build de despliegue**: mismo X.Y.Z pero nuevo `.sppkg` para el catálogo (re-empaquetado, hotfix de pipeline, mismo código con otro build). |

### Regla operativa (App Catalog)

Cada **`.sppkg` que se sube al tenant** debe declarar un `solution.version` **estrictamente mayor** que el paquete anterior desplegado en **ese** catálogo.

SharePoint usa esta versión para ofrecer actualizaciones y validar el paquete. No subir un `.sppkg` con la misma versión o una inferior esperando que reemplace al anterior.

## Alineación con `package.json` (opción A)

`package.json` → campo **`version`** usa **semver de tres segmentos** `X.Y.Z`:

- Debe coincidir con los **tres primeros segmentos** de `solution.version`.
- El segmento **B** existe **solo** en `package-solution.json`.

Ejemplo:

| `solution.version` | `package.json` `version` |
| --- | --- |
| `1.0.0.0` | `1.0.0` |
| `1.0.0.5` | `1.0.0` |
| `1.2.3.0` | `1.2.3` |
| `2.0.0.12` | `2.0.0` |

Al incrementar **X**, **Y** o **Z** en la solución, actualizar también `package.json` en el **mismo commit** (o en el commit de release).

Incrementar **solo B** para un nuevo despliegue al catálogo **no** obliga a cambiar `package.json` si X.Y.Z no cambió.

## Otros números de versión (no confundir)

| Ubicación | Rol |
| --- | --- |
| `GemeSpaWebPart.manifest.json` → `"version": "*"` | Patrón SPFx: la versión del componente se resuelve en el empaquetado. No fijar a mano salvo indicación explícita del equipo. |
| `package-solution.json` → `features[].version` | Versión del **Feature** de activación. Subir cuando cambie el XML de feature de forma relevante, no en cada release rutinario. |
| `GemeSpaWebPart.ts` → `dataVersion` | Esquema de propiedades del Web Part, no versión de producto. |
| Dependencias `@microsoft/sp-*` (p. ej. `1.23.2`) | Versión del **framework SPFx**, independiente del producto GEME. |
| Claves `version` en caché `localStorage` (menú, grilla, etc.) | Versión de **formato de datos** en el navegador, no release del `.sppkg`. |
| Versión en sidebar (`versionWebPart`) | Proviene del manifiesto en runtime; en producción debe reflejar el paquete desplegado. |

## Commit a GitHub y decisión de versión

Acuerdo del equipo con asistencia del agente:

- Pedir un **mensaje para commit** (o preparar commit / push) dispara la **revisión de versión**, no solo el texto del commit.
- El agente resume el diff, indica la versión actual y **recomienda** el siguiente `solution.version` (segmento X, Y, Z o B según la tabla de arriba).
- La versión definitiva la **confirma el desarrollador**; solo entonces se actualizan `config/package-solution.json` y, si corresponde, `package.json`, en el **mismo commit** que los cambios funcionales.

## Flujo recomendado para contribuidores

1. Desarrollo en rama; builds locales no requieren subir versión salvo que se prepare un paquete para catálogo.
2. Antes de generar un **`.sppkg` para el tenant**:
   - Incrementar `solution.version` (casi siempre **B**, o **Z** / **Y** / **X** según el cambio).
   - Si cambió **X**, **Y** o **Z**, alinear `package.json` → `version` con `X.Y.Z`.
3. Ejecutar `npm run build` y desplegar el artefacto en `sharepoint/solution/`.
4. Etiquetar en Git (opcional pero recomendado): `vX.Y.Z` o `vX.Y.Z.B` según acuerdo del equipo.

Los agentes y revisores deben **rechazar o corregir** un PR que entregue un `.sppkg` al catálogo sin incremento de `solution.version` cuando corresponda.

## Archivos tocados al versionar

- **Siempre (despliegue catálogo):** `config/package-solution.json` → `solution.version`
- **Cuando cambie X, Y o Z:** `package.json` → `version`
- **Opcional:** entrada en changelog o notas de release del repositorio

No modificar `package.json` ni `config/**` por conveniencia del agente; solo cuando la tarea sea release, versión o configuración explícitamente solicitada (véase `AGENTS.md`).

## Identificador de solución

| Campo | Valor |
| --- | --- |
| Nombre | GEME SPA Webpart |
| `solution.id` | `7df70f14-42fe-45db-b2a9-6158f2714ac4` |
| Paquete | `sharepoint/solution/GEME SPA Webpart.sppkg` |
