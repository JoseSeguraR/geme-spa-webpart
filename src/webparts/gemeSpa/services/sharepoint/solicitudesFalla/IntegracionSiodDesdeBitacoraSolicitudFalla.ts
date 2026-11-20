import type { WebPartContext } from '@microsoft/sp-webpart-base';
import {
  ResultadoIntegracionSiodExitosa,
  ResultadoIntegracionSiodFallida,
  TextoResponsableComentariosBitacoraIntegracionSiodExitosa,
  TextoResponsableComentariosBitacoraIntegracionSiodFallida
} from '../../../components/vistas/cor-conecta/concentrador/solicitudes-falla/constantesSolicitudFalla';
import type { FilaBitacoraEngine } from '../../../models/concentradorComun/FilaBitacoraEngine';
import type { SolicitudFalla } from '../../../models/SolicitudFalla';
import { ObtenerFilasBitacoraSolicitudFalla } from './BitacoraSolicitudFallaServicio';

const EtiquetaAccionIntegracionSiod = 'Integración SIOD';

export type EstadoIntegracionSiodDesdeBitacora = {
  integradoSiod: boolean;
  fechaIntegracionSiod?: string;
  resultadoSiod?: string;
};

function ComentarioIndicaIntegracionSiod(comentario: string): boolean {
  const texto = comentario.trim();
  return (
    texto === TextoResponsableComentariosBitacoraIntegracionSiodExitosa ||
    texto === TextoResponsableComentariosBitacoraIntegracionSiodFallida ||
    texto.startsWith('Integración SIOD')
  );
}

function EsEntradaIntegracionSiod(fila: FilaBitacoraEngine): boolean {
  const estado = fila.estadoInicial.trim();
  const tarea = fila.tarea.trim();
  if (estado === EtiquetaAccionIntegracionSiod || tarea === EtiquetaAccionIntegracionSiod) {
    return true;
  }
  if (ComentarioIndicaIntegracionSiod(fila.responsableComentarios)) {
    return true;
  }
  if (estado === ResultadoIntegracionSiodExitosa || estado === ResultadoIntegracionSiodFallida) {
    return (
      tarea.includes(EtiquetaAccionIntegracionSiod) ||
      fila.accionCierre.includes(EtiquetaAccionIntegracionSiod) ||
      tarea === ''
    );
  }
  return false;
}

function TextoResultadoDesdeEntrada(fila: FilaBitacoraEngine): string {
  const estado = fila.estadoInicial.trim();
  if (estado === ResultadoIntegracionSiodExitosa || estado === ResultadoIntegracionSiodFallida) {
    return estado;
  }
  const accion = fila.accionCierre.trim();
  if (accion === ResultadoIntegracionSiodExitosa || accion === ResultadoIntegracionSiodFallida) {
    return accion;
  }
  return '';
}

export function ExtraerEstadoIntegracionSiodDesdeBitacora(
  filasBitacora: readonly FilaBitacoraEngine[]
): EstadoIntegracionSiodDesdeBitacora {
  const entradas = filasBitacora.filter(EsEntradaIntegracionSiod);
  if (entradas.length === 0) {
    return { integradoSiod: false };
  }

  const ultima = [...entradas].sort((a, b) => {
    const fa = a.fechaInicioTarea || a.fechaCierre;
    const fb = b.fechaInicioTarea || b.fechaCierre;
    return fb.localeCompare(fa);
  })[0];

  const resultado = TextoResultadoDesdeEntrada(ultima);
  const integrado = resultado === ResultadoIntegracionSiodExitosa;
  const fecha = (ultima.fechaInicioTarea || ultima.fechaCierre).trim();

  return {
    integradoSiod: integrado,
    fechaIntegracionSiod: fecha || undefined,
    resultadoSiod: resultado || undefined
  };
}

export async function CompletarIntegracionSiodDesdeBitacora(
  context: WebPartContext,
  idSolicitud: number
): Promise<EstadoIntegracionSiodDesdeBitacora> {
  const filas = await ObtenerFilasBitacoraSolicitudFalla(context, idSolicitud);
  return ExtraerEstadoIntegracionSiodDesdeBitacora(filas);
}

export async function EnriquecerFilasIntegracionSiodDesdeBitacora<T extends SolicitudFalla>(
  context: WebPartContext,
  filas: readonly T[]
): Promise<T[]> {
  if (filas.length === 0) {
    return [];
  }

  const enriquecidas = await Promise.all(
    filas.map(async (fila) => {
      const estado = await CompletarIntegracionSiodDesdeBitacora(context, fila.id);
      return { ...fila, ...estado };
    })
  );

  return enriquecidas;
}