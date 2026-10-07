import type { RegistroSistemaAccesoNormalizado, TipoSistemaAcceso } from '../../models/SistemaAcceso';
import type { ElementoSistemaAccesoSharePoint } from '../sharepoint/ElementoSistemaAccesoSharePoint';
import { NormalizarGruposAccesoElemento } from './NormalizarGruposAccesoElemento';

const TiposValidos: ReadonlySet<string> = new Set(['Header', 'Route', 'ExternalLink']);

function EsTipoValido(valor: string): valor is TipoSistemaAcceso {
  return TiposValidos.has(valor);
}

function NormalizarPadreId(elemento: ElementoSistemaAccesoSharePoint): number | undefined {
  const padreId = elemento.PADREId ?? elemento.PADRE?.Id;
  if (padreId === null || padreId === undefined || padreId === 0) {
    return undefined;
  }
  return padreId;
}

function EsActivo(valor: boolean | number | undefined): boolean {
  return valor === true || valor === 1;
}

export function NormalizarRegistrosSistemaAccesos(
  elementos: ElementoSistemaAccesoSharePoint[]
): RegistroSistemaAccesoNormalizado[] {
  const normalizados: RegistroSistemaAccesoNormalizado[] = [];

  for (const elemento of elementos) {
    if (!EsActivo(elemento.ACTIVO)) {
      continue;
    }

    const tipoRaw = String(elemento.TIPOACCESO ?? '').trim();
    if (!EsTipoValido(tipoRaw)) {
      console.warn('[SISTEMA_ACCESOS] TIPOACCESO no reconocido; registro omitido.', elemento.Id, tipoRaw);
      continue;
    }

    normalizados.push({
      id: elemento.Id,
      tipo: tipoRaw,
      padreId: NormalizarPadreId(elemento),
      orden: typeof elemento.ORDEN === 'number' ? elemento.ORDEN : 0,
      hashTitle: String(elemento.HASH_TITLE ?? '').trim(),
      hashKey: String(elemento.HASH_KEY ?? '').trim(),
      gruposAccesoIds: NormalizarGruposAccesoElemento(elemento),
      activo: true,
      icono: String(elemento.ICONO ?? '').trim()
    });
  }

  return normalizados;
}
