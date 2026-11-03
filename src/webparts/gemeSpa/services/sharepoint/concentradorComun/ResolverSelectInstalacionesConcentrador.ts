/** Campos mínimos de `CONC_MANTENEDOR_INSTALACIONES` (maqueta 03-nov-2026: sin `TIPO_SUBEQUIPO` ni `ES_RENOVABLE`). */
export function SelectCamposInstalacionesConcentrador(): string {
  return 'Id,INSTALACION,CODIGO_SIOD,MODULOS,ESTADO';
}

/** @deprecated Usar `SelectCamposInstalacionesConcentrador`. */
export async function ResolverSelectInstalacionesConcentrador(): Promise<string> {
  return SelectCamposInstalacionesConcentrador();
}
