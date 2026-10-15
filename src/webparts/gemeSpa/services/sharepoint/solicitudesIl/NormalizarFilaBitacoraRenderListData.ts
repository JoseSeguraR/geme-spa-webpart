import type { FilaBitacoraSolicitudIl } from '../../../models/BitacoraSolicitudIl';
import {
  CampoAccionAvanceBitacoraIl,
  CampoEstadoDestinoBitacoraIl,
  CampoTareaOrigenBitacoraIl
} from '../../../components/vistas/cor-conecta/concentrador/administrador/constantesSolicitudesIl';

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
    if (typeof primero.Title === 'string') {
      return primero.Title;
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
    if (typeof objeto.Title === 'string') {
      return objeto.Title;
    }
  }
  return String(valor);
}

/** Texto descriptivo de lookup; no usar el Id numérico como etiqueta. */
function ObtenerTextoLookup(valor: unknown): string {
  if (valor === null || valor === undefined) {
    return '';
  }
  if (typeof valor === 'number') {
    return '';
  }
  if (typeof valor === 'string') {
    return valor.trim();
  }
  if (Array.isArray(valor) && valor.length > 0) {
    const primero = valor[0] as Record<string, unknown>;
    if (typeof primero.lookupValue === 'string' && primero.lookupValue.trim()) {
      return primero.lookupValue;
    }
    if (typeof primero.title === 'string' && primero.title.trim()) {
      return primero.title;
    }
    if (typeof primero.Title === 'string' && primero.Title.trim()) {
      return primero.Title;
    }
  }
  if (typeof valor === 'object') {
    const objeto = valor as Record<string, unknown>;
    if (typeof objeto.lookupValue === 'string' && objeto.lookupValue.trim()) {
      return objeto.lookupValue;
    }
    if (typeof objeto.title === 'string' && objeto.title.trim()) {
      return objeto.title;
    }
    if (typeof objeto.Title === 'string' && objeto.Title.trim()) {
      return objeto.Title;
    }
  }
  return '';
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

function ObtenerTextoCampoProyectado(fila: FilaRenderListData, prefijoLookup: string, nombreCampoDestino: string): string {
  const candidatos = [
    `${prefijoLookup}_x003a_${nombreCampoDestino}`,
    `${prefijoLookup}_x003a_${nombreCampoDestino.substring(0, 2)}`,
    `${prefijoLookup}.${nombreCampoDestino}`
  ];
  for (const clave of candidatos) {
    const texto = ObtenerTexto(fila[clave]);
    if (texto) {
      return texto;
    }
  }
  return '';
}

export function NormalizarFilaBitacoraDesdeRender(fila: FilaRenderListData): FilaBitacoraSolicitudIl | undefined {
  const id = ObtenerNumero(fila.ID ?? fila.Id);
  if (!id) {
    return undefined;
  }

  const tarea =
    ObtenerTexto(fila[CampoTareaOrigenBitacoraIl]) ||
    ObtenerTextoCampoProyectado(fila, 'TAREAORIGEN', 'TAREA') ||
    ObtenerTextoLookup(fila.TAREAORIGEN);
  const accionCierre =
    ObtenerTexto(fila[CampoAccionAvanceBitacoraIl]) ||
    ObtenerTextoCampoProyectado(fila, 'ACCIONAVANCE', 'ACCION') ||
    ObtenerTextoLookup(fila.ACCIONAVANCE);
  const estadoFinal =
    ObtenerTexto(fila[CampoEstadoDestinoBitacoraIl]) ||
    ObtenerTextoCampoProyectado(fila, 'TAREADESTINO', 'ESTADO') ||
    ObtenerTextoLookup(fila.TAREADESTINO);
  const responsableCierre = ObtenerTexto(fila.USUARIOAVANCE);

  return {
    id,
    tarea,
    fechaInicioTarea: ObtenerTexto(fila.TAREAORIGEN_FECHAINGRESO),
    estadoInicial: ObtenerTexto(fila.TAREAORIGEN_ESTADO),
    accionCierre,
    fechaCierre: ObtenerTexto(fila.TAREAORIGEN_FECHASALIDA),
    responsableCierre,
    estadoFinal
  };
}
