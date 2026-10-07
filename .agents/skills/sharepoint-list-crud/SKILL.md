---
name: sharepoint-list-crud
description: Implementar o modificar operaciones CRUD sobre listas y bibliotecas SharePoint utilizando SharePoint REST y SPHttpClient.
---

# SharePoint List CRUD

Utilizar esta skill para operaciones de lectura, creación, actualización o eliminación de elementos de listas y bibliotecas SharePoint.

## Antes de implementar

Determinar:

- lista o biblioteca involucrada;
- nombres internos de columnas;
- tipos SharePoint de las columnas;
- datos requeridos;
- operación exacta;
- volumen esperado;
- existencia de campos lookup, persona, fecha, booleanos o multivalor.

No asumir nombres internos a partir de nombres visibles cuando exista código o configuración desde donde obtenerlos.

## Lectura

Solicitar únicamente columnas necesarias.

Utilizar paginación cuando corresponda.

Evitar consultas excesivamente grandes o múltiples solicitudes que puedan consolidarse razonablemente.

Considerar throttling cuando la operación requiera múltiples requests.

## Creación y actualización

Construir payloads explícitamente tipados.

No enviar propiedades que no deban modificarse.

Respetar el formato REST requerido por cada tipo de columna SharePoint.

Para operaciones múltiples, evitar paralelismo agresivo que pueda provocar throttling.

## Eliminación

No implementar eliminaciones masivas o destructivas si la tarea no las solicita explícitamente.

Verificar cuidadosamente el identificador del recurso antes de ejecutar una eliminación.

## Errores

Validar cada respuesta HTTP.

No continuar silenciosamente una secuencia de actualizaciones después de un error cuando ello pueda dejar datos inconsistentes.

Si una operación parcial es aceptable por diseño, reportar claramente qué operaciones fallaron.

## Arquitectura

Las operaciones CRUD deben residir en servicios.

Los componentes React consumen operaciones del dominio y no construyen directamente endpoints SharePoint REST.