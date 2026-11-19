import type { SolicitudFalla } from '../../../models/SolicitudFalla';
import {
  CampoDescripcionSolicitudFalla,
  CampoEstadoSolicitudFalla,
  CampoFechaPerturbacionSolicitudFalla,
  CampoFechaRetornoSolicitudFalla,
  CampoIdBitacoraSolicitudFalla,
  CampoIdCenSolicitudFalla,
  CampoLookupEquiposSolicitudFalla,
  CampoLookupInstalacionGmSolicitudFalla,
  CampoMedidaSolicitudFalla,
  CampoPotenciaSolicitudFalla
} from './CamposListaSolicitudFalla';

type FilaRenderListData = Record<string, unknown>;

function ObtenerTexto(valor: unknown): string {
  if (valor === null || valor === undefined) {
    return '';
  }
  if (typeof valor === 'string') {
    return valor;
  }
  if (typeof valor === 'number') {
    return String(valor);
  }
  if (Array.isArray(valor)) {
    return valor
      .map((item) => {
        if (typeof item === 'object' && item !== null) {
          const objeto = item as Record<string, unknown>;
          if (typeof objeto.lookupValue === 'string') {
            return objeto.lookupValue;
          }
          if (typeof objeto.title === 'string') {
            return objeto.title;
          }
        }
        return '';
      })
      .filter(Boolean)
      .join(', ');
  }
  if (typeof valor === 'object') {
    const objeto = valor as Record<string, unknown>;
    if (typeof objeto.lookupValue === 'string') {
      return objeto.lookupValue;
    }
    if (typeof objeto.title === 'string') {
      return objeto.title;
    }
  }
  return String(valor);
}

function ObtenerLookupId(valor: unknown): number | undefined {
  if (Array.isArray(valor) && valor.length > 0) {
    const primero = valor[0] as Record<string, unknown>;
    const id = primero.lookupId ?? primero.LookupId;
    if (typeof id === 'number') {
      return id;
    }
    if (typeof id === 'string' && id.trim()) {
      return Number(id);
    }
  }
  if (typeof valor === 'object' && valor !== null && !Array.isArray(valor)) {
    const objeto = valor as Record<string, unknown>;
    const id = objeto.lookupId ?? objeto.LookupId;
    if (typeof id === 'number') {
      return id;
    }
  }
  return undefined;
}

function ObtenerLookupIdsMultiples(valor: unknown): number[] {
  if (!Array.isArray(valor)) {
    return [];
  }
  return valor
    .map((item) => {
      if (typeof item !== 'object' || item === null) {
        return undefined;
      }
      const objeto = item as Record<string, unknown>;
      const id = objeto.lookupId ?? objeto.LookupId;
      if (typeof id === 'number') {
        return id;
      }
      if (typeof id === 'string' && id.trim()) {
        return Number(id);
      }
      return undefined;
    })
    .filter((id): id is number => typeof id === 'number' && id > 0);
}

function ObtenerNumero(valor: unknown): number {
  if (typeof valor === 'number') {
    return valor;
  }
  if (typeof valor === 'string' && valor.trim()) {
    return Number(valor);
  }
  return 0;
}

export type SolicitudFallaNormalizada = SolicitudFalla & { equiposIds: number[] };

export function NormalizarFilaSolicitudFallaDesdeRender(
  fila: FilaRenderListData
): SolicitudFallaNormalizada | undefined {
  const id = ObtenerNumero(fila.ID ?? fila.Id);
  if (!id) {
    return undefined;
  }

  const centralRaw = fila[CampoLookupInstalacionGmSolicitudFalla];
  const equiposRaw = fila[CampoLookupEquiposSolicitudFalla];
  const equiposIds = ObtenerLookupIdsMultiples(equiposRaw);

  const idBitacoraTexto = ObtenerTexto(fila[CampoIdBitacoraSolicitudFalla]);

  return {
    id,
    idBitacora: idBitacoraTexto || undefined,
    idCen: ObtenerTexto(fila[CampoIdCenSolicitudFalla]),
    centralId: ObtenerLookupId(centralRaw),
    centralEtiqueta: ObtenerTexto(centralRaw),
    equiposEtiqueta: ObtenerTexto(equiposRaw),
    equiposIds,
    fechaPerturbacion: ObtenerTexto(fila[CampoFechaPerturbacionSolicitudFalla]) || undefined,
    fechaRetorno: ObtenerTexto(fila[CampoFechaRetornoSolicitudFalla]) || undefined,
    descripcion: ObtenerTexto(fila[CampoDescripcionSolicitudFalla]),
    potencia: ObtenerNumero(fila[CampoPotenciaSolicitudFalla]) || undefined,
    medida: ObtenerTexto(fila[CampoMedidaSolicitudFalla]) || undefined,
    estado: ObtenerTexto(fila[CampoEstadoSolicitudFalla]) || 'Vigente',
    integradoSiod: false
  };
}