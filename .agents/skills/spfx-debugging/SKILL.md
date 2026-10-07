---
name: spfx-debugging
description: Diagnosticar errores de ejecución, renderizado, carga, estado o integración SharePoint en una Web Part SPFx React.
---

# SPFx Debugging

Utilizar esta skill cuando exista un error o comportamiento inesperado en la aplicación SPFx.

## Estrategia

Priorizar evidencia observable antes de modificar código.

1. Identificar el comportamiento esperado.
2. Identificar el comportamiento real.
3. Revisar errores de compilación, consola y red disponibles.
4. Localizar la capa responsable:
   - componente;
   - hook;
   - servicio;
   - SharePoint REST;
   - SPFx;
   - estilos;
   - configuración.
5. Reducir el problema a la causa más específica posible.
6. Aplicar el cambio mínimo necesario.
7. Validar que el cambio no altere comportamiento no relacionado.
8. Ejecutar `npm run build` cuando corresponda.

## Diagnóstico temporal

Se pueden agregar temporalmente:

- console.log;
- console.warn;
- console.error.

Eliminar los `console.log` de diagnóstico antes de finalizar.

No dejar instrumentación temporal distribuida innecesariamente por el código.

## Restricciones

No resolver errores de tipos mediante `any`.

No agregar dependencias como solución de diagnóstico.

No refactorizar módulos completos para solucionar un error localizado.

No modificar configuración Heft, TypeScript o SPFx salvo que la evidencia indique que el problema pertenece realmente al toolchain.

No sustituir una implementación completa antes de comprender la causa del problema.