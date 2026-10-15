import type { SolicitudIl } from '../../../models/SolicitudIl';
import {
  CampoEstadoTareaActualIl,
  CampoLookupTareaActualIl,
  type EstadoSolicitudIl
} from '../../../components/vistas/cor-conecta/concentrador/administrador/constantesSolicitudesIl';
import { ResolverEstadoSolicitudIl } from '../../../components/vistas/cor-conecta/concentrador/administrador/constantesSolicitudesIl';

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
  if (Array.isArray(valor) && valor.length > 0) {
    const primero = valor[0] as Record<string, unknown>;
    if (typeof primero.lookupValue === 'string') {
      return primero.lookupValue;
    }
    if (typeof primero.title === 'string') {
      return primero.title;
    }
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

function ObtenerLookupId(valor: unknown): number | null {
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
  if (typeof valor === 'object' && valor !== null) {
    const objeto = valor as Record<string, unknown>;
    const id = objeto.lookupId ?? objeto.LookupId;
    if (typeof id === 'number') {
      return id;
    }
  }
  return null;
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

export function NormalizarFilaSolicitudIlDesdeRender(fila: FilaRenderListData): SolicitudIl | undefined {
  const id = ObtenerNumero(fila.ID ?? fila.Id);
  if (!id) {
    return undefined;
  }

  const centralRaw = fila.INSTALACION;
  const estadoProyectado = ObtenerTexto(fila[CampoEstadoTareaActualIl]);
  const estadoLookup = ObtenerTexto(fila[CampoLookupTareaActualIl]);
  const estadoTexto = ResolverEstadoSolicitudIl(estadoProyectado || estadoLookup);

  return {
    id,
    idCen: ObtenerTexto(fila.ID_CEN),
    centralId: ObtenerLookupId(centralRaw),
    centralEtiqueta: ObtenerTexto(centralRaw),
    descripcion: ObtenerTexto(fila.DESCRIPCION),
    fechaInicio: ObtenerTexto(fila.FECHA_INICIO) || null,
    fechaFin: ObtenerTexto(fila.FECHA_FIN) || null,
    estado: estadoTexto as EstadoSolicitudIl
  };
}
