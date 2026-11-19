import type { FilaBitacoraEngine } from '../../../models/concentradorComun/FilaBitacoraEngine';
import { TextoPlanoDesdeHtmlSharePoint } from '../../../utils/TextoPlanoDesdeHtmlSharePoint';
import {
  CampoAccionAvanceBitacoraEngine,
  CampoEstadoDestinoBitacoraEngine,
  CampoTareaOrigenBitacoraEngine
} from './CamposBitacoraEngine';

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

function ObtenerNombreUsuarioLookup(valor: unknown): string {
  if (valor === null || valor === undefined) {
    return '';
  }
  if (typeof valor === 'string') {
    return valor.trim();
  }
  if (typeof valor === 'object') {
    const objeto = valor as Record<string, unknown>;
    if (typeof objeto.lookupValue === 'string' && objeto.lookupValue.trim()) {
      return objeto.lookupValue.trim();
    }
    if (typeof objeto.title === 'string' && objeto.title.trim()) {
      return objeto.title.trim();
    }
    if (typeof objeto.Title === 'string' && objeto.Title.trim()) {
      return objeto.Title.trim();
    }
    if (typeof objeto.email === 'string' && objeto.email.trim()) {
      return objeto.email.trim();
    }
  }
  return '';
}

function ObtenerNombresLookupMultiples(valor: unknown): string[] {
  if (valor === null || valor === undefined) {
    return [];
  }
  if (Array.isArray(valor)) {
    return valor
      .map((item) => ObtenerNombreUsuarioLookup(item))
      .filter((nombre) => nombre.length > 0);
  }
  if (typeof valor === 'string') {
    const texto = valor.trim();
    if (!texto) {
      return [];
    }
    if (texto.includes(';#')) {
      const partes = texto.split(';#');
      const nombres: string[] = [];
      for (let indice = 0; indice < partes.length; indice += 2) {
        const nombre = partes[indice]?.trim();
        if (nombre) {
          nombres.push(nombre);
        }
      }
      return nombres;
    }
    if (texto.includes(';')) {
      return texto
        .split(';')
        .map((parte) => parte.trim())
        .filter(Boolean);
    }
    if (texto.includes('\n')) {
      return texto
        .split('\n')
        .map((parte) => parte.trim())
        .filter(Boolean);
    }
    return [texto];
  }
  const unico = ObtenerNombreUsuarioLookup(valor);
  return unico ? [unico] : [];
}

function UnirNombresUsuariosMultilinea(nombres: readonly string[]): string {
  if (nombres.length === 0) {
    return '';
  }
  return [...nombres].join('\n');
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

export function NormalizarFilaBitacoraEngine(fila: FilaRenderListData): FilaBitacoraEngine | undefined {
  const id = ObtenerNumero(fila.ID ?? fila.Id);
  if (!id) {
    return undefined;
  }

  const tarea =
    ObtenerTexto(fila[CampoTareaOrigenBitacoraEngine]) ||
    ObtenerTextoCampoProyectado(fila, 'TAREAORIGEN', 'TAREA') ||
    ObtenerTextoLookup(fila.TAREAORIGEN);
  const accionCierre =
    ObtenerTexto(fila[CampoAccionAvanceBitacoraEngine]) ||
    ObtenerTextoCampoProyectado(fila, 'ACCIONAVANCE', 'ACCION') ||
    ObtenerTextoLookup(fila.ACCIONAVANCE);
  const estadoFinal =
    ObtenerTexto(fila[CampoEstadoDestinoBitacoraEngine]) ||
    ObtenerTextoCampoProyectado(fila, 'TAREADESTINO', 'ESTADO') ||
    ObtenerTextoLookup(fila.TAREADESTINO);
  const responsableCierre = ObtenerTexto(fila.USUARIOAVANCE);
  const nombresResponsablesOrigen = ObtenerNombresLookupMultiples(
    fila.TAREAORIGEN_RESPONSABLE_MULTIPLE ?? fila.TAREAORIGEN_RESPONSABLE_MULTIPLEId
  );

  return {
    id,
    tarea,
    fechaInicioTarea: ObtenerTexto(fila.TAREAORIGEN_FECHAINGRESO),
    estadoInicial: ObtenerTexto(fila.TAREAORIGEN_ESTADO),
    accionCierre,
    fechaCierre: ObtenerTexto(fila.TAREAORIGEN_FECHASALIDA),
    responsableCierre,
    estadoFinal,
    tareaIdentificador: ObtenerTexto(fila.TAREA_IDENTIFICADOR),
    responsablesOrigen: UnirNombresUsuariosMultilinea(nombresResponsablesOrigen),
    usuarioAvance: responsableCierre,
    responsableComentarios: TextoPlanoDesdeHtmlSharePoint(ObtenerTexto(fila.RESPONSABLE_COMENTARIOS))
  };
}
