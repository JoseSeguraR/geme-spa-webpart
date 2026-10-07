---
name: spfx-build
description: Ejecutar y diagnosticar la validación de build de la solución SPFx basada en Heft.
---

# SPFx Build

Utilizar esta skill cuando sea necesario validar cambios o diagnosticar errores de compilación.

## Comando principal

Ejecutar:

    npm run build

## Ante un error

1. Identificar el primer error relevante.
2. Determinar si fue provocado por los cambios actuales.
3. Corregir primero errores de TypeScript o implementación relacionados con la tarea.
4. Repetir el build.
5. Continuar hasta obtener un build exitoso o identificar un bloqueo externo.

No modificar configuración para silenciar errores.

No reducir reglas TypeScript.

No introducir `any`, `@ts-ignore` o `@ts-nocheck` para conseguir artificialmente un build exitoso.

No actualizar dependencias automáticamente.

## Errores preexistentes

Si el build falla por un problema claramente preexistente y no relacionado:

- no ampliar automáticamente el alcance para corregirlo;
- comprobar que el cambio actual no lo produjo;
- informar el bloqueo al finalizar.

## Resultado

Al finalizar indicar de forma breve:

- si `npm run build` fue ejecutado;
- si terminó correctamente;
- errores pendientes relevantes, si existen.