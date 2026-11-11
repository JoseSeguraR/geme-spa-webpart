import { NormalizarSegmentoHash } from '../../utils/NavegacionHash';
import { registroVistasControlSitioPorSufijo } from './controlSitio';
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

/**
 * Vistas que se resuelven por el final de la ruta, para no depender de los HASH_KEY de sus ancestros
 * (p. ej. `…/control-sitio/mantenedores/empresas`). El sufijo más largo gana.
 */
export const componentRegistrySufijo: RegistroVistasMap = {
  ...registroVistasControlSitioPorSufijo
};

const SufijosRegistroOrdenados = Object.keys(componentRegistrySufijo).sort((a, b) => b.length - a.length);

function NormalizarClaveRegistro(rutaHash: string): string {
  return NormalizarSegmentoHash(rutaHash) || rutaHash.trim();
}

export function ObtenerComponenteDelRegistro(rutaHash: string): ComponenteVistaSpa | undefined {
  const clave = NormalizarClaveRegistro(rutaHash);
  const exacta = componentRegistry[clave];
  if (exacta) {
    return exacta;
  }
  const sufijo = SufijosRegistroOrdenados.find((s) => clave === s || clave.endsWith(`/${s}`));
  return sufijo ? componentRegistrySufijo[sufijo] : undefined;
}
