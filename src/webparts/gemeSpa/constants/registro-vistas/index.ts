import { NormalizarSegmentoHash } from '../../utils/NavegacionHash';
import { registroVistasCorConecta } from './corConecta';
import { registroVistasInicio } from './inicio';
import type { ComponenteVistaSpa, PropsVistaSpa, RegistroVistasMap } from './TiposRegistroVistas';

export type { ComponenteVistaSpa, PropsVistaSpa, RegistroVistasMap };
export { RegistrarVistaSinProps } from './TiposRegistroVistas';

/**
 * Registro centralizado de vistas implementadas, desacoplado de SISTEMA_ACCESOS.
 * Clave = rutaHash (segmentos HASH_KEY acumulados). Ampliar por dominio en archivos separados.
 */
export const componentRegistry: RegistroVistasMap = {
  ...registroVistasInicio,
  ...registroVistasCorConecta
};

function NormalizarClaveRegistro(rutaHash: string): string {
  return NormalizarSegmentoHash(rutaHash) || rutaHash.trim();
}

export function ObtenerComponenteDelRegistro(rutaHash: string): ComponenteVistaSpa | undefined {
  return componentRegistry[NormalizarClaveRegistro(rutaHash)];
}
