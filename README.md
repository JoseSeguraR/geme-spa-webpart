# GEME SPA Webpart

Web Part de SharePoint Framework que hospeda la aplicación de una sola página (SPA) de Generadora Metropolitana en una página moderna de SharePoint Online.

La carcasa, el menú, la navegación y la grilla son comunes a todos los módulos. Cada pantalla de negocio se registra aparte y vive en su propia carpeta. El primer módulo implementado es Solicitudes IL del Concentrador (COR Conecta).

## Documentación técnica

| Documento | Contenido |
| --- | --- |
| [Arquitectura de la SPA](docs/arquitectura-spa.md) | Arranque, layout, menú, rutas, registro de vistas, grilla y estilos. Sirve para cualquier pantalla nueva. |
| [Solicitudes IL](docs/solicitudes-il.md) | Perfiles, listas, consulta, alta, gestión, bitácora y SIOD. Propio de ese módulo. |

## Stack

- SharePoint Framework 1.23.2, toolchain Heft
- Node.js 22 (`>=22.14.0 <23.0.0`)
- React 17.0.1 y TypeScript estricto
- SharePoint REST mediante `SPHttpClient`
- Bootstrap 5.2 y Bootstrap Icons, con estilos propios bajo `.gemeSpaBootstrap`
- MUI Data Grid solo para la grilla de servidor

## Ejecución local

Desde la raíz del repositorio:

```bash
npm install
npm run start
```

`npm start` ejecuta `heft start --clean`. El puerto y la página inicial están en `config/serve.json` (HTTPS, puerto 4321).

El paquete de solución se genera con:

```bash
npm run build
```

El resultado es `sharepoint/solution/GEME SPA Webpart.sppkg` (versión de solución `1.0.0.0` en `config/package-solution.json`).

## Requisitos en el sitio

- Una página moderna que aloje el Web Part.
- La lista `SISTEMA_ACCESOS`, con los ítems de menú y las audiencias por grupo de SharePoint.
- Para Solicitudes IL, las listas y las propiedades del panel descritas en [Solicitudes IL](docs/solicitudes-il.md).

## Solución

| Solución | Identificador | Versión |
| --- | --- | --- |
| GEME SPA Webpart | `7df70f14-42fe-45db-b2a9-6158f2714ac4` | `1.0.0.0` |
