---
name: sharepoint-rest
description: Diseñar, implementar, revisar o corregir consultas SharePoint REST mediante SPHttpClient en una solución SPFx.
---

# SharePoint REST

Utilizar esta skill cuando la tarea involucre consultas SharePoint REST mediante SPHttpClient.

## Procedimiento

1. Identificar exactamente los datos requeridos.
2. Revisar los modelos y servicios existentes relacionados.
3. Utilizar SharePoint REST antes de considerar Microsoft Graph o PnPjs.
4. Construir la consulta solicitando únicamente los campos necesarios.
5. Utilizar `$select`, `$filter`, `$expand`, `$orderby` y `$top` solo cuando corresponda.
6. Considerar paginación cuando el volumen pueda superar el resultado de una única respuesta.
7. Mantener las solicitudes REST dentro de servicios, nunca directamente en componentes React.
8. Validar la respuesta HTTP antes de procesar el body.
9. Distinguir una respuesta vacía de un error.
10. Tipar los datos de entrada y salida.

## Restricciones

No utilizar `any` para respuestas REST.

No agregar PnPjs.

No utilizar Microsoft Graph si SharePoint REST resuelve adecuadamente el requerimiento.

No hardcodear la URL absoluta del sitio cuando pueda obtenerse mediante el contexto SPFx.

No solicitar columnas que no se utilicen.

No crear wrappers REST genéricos anticipadamente.

## Errores

Cuando una respuesta no sea exitosa, conservar información suficiente para diagnosticar:

- operación realizada;
- endpoint o recurso lógico involucrado;
- status HTTP;
- statusText cuando esté disponible.

No exponer secretos, tokens o información sensible en logs o mensajes de error.

No retornar `[]`, `null`, `false` u otro valor aparentemente válido para ocultar un error HTTP.