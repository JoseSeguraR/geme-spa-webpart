import type { EstadoSolicitudIl } from '../../../components/vistas/cor-conecta/concentrador/solicitudes-il/constantesSolicitudesIl';
import { ParsearIdCentralDesdeCodigoSiod } from './ParsearIdCentralSiod';
import {
  ActualizarSolicitudEnSiod,
  EliminarSolicitudEnSiod,
  InsertarSolicitudFinalizadaEnSiod,
  InsertarSolicitudVigenteEnSiod
} from './SiodSolicitudIlApiServicio';

export type SnapshotCamposSiodSolicitudIl = {
  idCen: string;
  centralId: number;
  descripcion: string;
  fechaInicioIso: string;
  fechaFinIso?: string;
};

export type ValoresActualesSiodSolicitudIl = SnapshotCamposSiodSolicitudIl;

export type OpcionesUrlsSiodSolicitudIl = {
  urlInsertSiod: string;
  urlUpdateSiod: string;
  urlDeleteSiod: string;
};

export type ResolverIdCentralSiod = (centralId: number) => number;

function NormalizarIso(valor: string | undefined): string {
  return (valor ?? '').trim();
}

function ConstruirParcialesUpdate(
  snapshot: SnapshotCamposSiodSolicitudIl,
  actual: ValoresActualesSiodSolicitudIl,
  resolverIdCentral: ResolverIdCentralSiod
): {
  idCentral?: number;
  descripcion?: string;
  fechainicio?: string;
  fechaFin?: string;
} {
  const cambios: {
    idCentral?: number;
    descripcion?: string;
    fechainicio?: string;
    fechaFin?: string;
  } = {};

  if (actual.centralId !== snapshot.centralId) {
    cambios.idCentral = resolverIdCentral(actual.centralId);
  }

  if (actual.descripcion.trim() !== snapshot.descripcion.trim()) {
    cambios.descripcion = actual.descripcion.trim();
  }

  if (NormalizarIso(actual.fechaInicioIso) !== NormalizarIso(snapshot.fechaInicioIso)) {
    cambios.fechainicio = actual.fechaInicioIso;
  }

  const finSnapshot = NormalizarIso(snapshot.fechaFinIso);
  const finActual = NormalizarIso(actual.fechaFinIso);
  if (finActual !== finSnapshot) {
    cambios.fechaFin = finActual || undefined;
  }

  return cambios;
}

function HayCambiosParciales(cambios: ReturnType<typeof ConstruirParcialesUpdate>): boolean {
  return Object.keys(cambios).length > 0;
}

function IdCenCambio(snapshot: SnapshotCamposSiodSolicitudIl, actual: ValoresActualesSiodSolicitudIl): boolean {
  return snapshot.idCen.trim() !== actual.idCen.trim();
}

async function ReemplazarSolicitudEnSiodPorCambioIdCen(
  urls: OpcionesUrlsSiodSolicitudIl,
  idCenAnterior: string,
  insertar: () => Promise<void>
): Promise<void> {
  await EliminarSolicitudEnSiod(urls.urlDeleteSiod, idCenAnterior);
  await insertar();
}

export async function SincronizarSiodTrasGestionSolicitudIl(
  estadoInicial: EstadoSolicitudIl,
  estadoNuevo: EstadoSolicitudIl,
  snapshot: SnapshotCamposSiodSolicitudIl,
  actual: ValoresActualesSiodSolicitudIl,
  urls: OpcionesUrlsSiodSolicitudIl,
  resolverIdCentral: ResolverIdCentralSiod
): Promise<void> {
  try {
    const idCenActual = actual.idCen.trim();

    if (estadoInicial === 'Anulada' && estadoNuevo === 'Vigente') {
      await InsertarSolicitudVigenteEnSiod(urls.urlInsertSiod, {
        idsolicitud: idCenActual,
        idCentral: resolverIdCentral(actual.centralId),
        descripcion: actual.descripcion.trim(),
        fechainicio: actual.fechaInicioIso
      });
      return;
    }

    if (estadoInicial === 'Vigente' && estadoNuevo === 'Anulada') {
      await EliminarSolicitudEnSiod(urls.urlDeleteSiod, snapshot.idCen.trim());
      return;
    }

    if (estadoInicial === 'Finalizada' && estadoNuevo === 'Vigente') {
      await ActualizarSolicitudEnSiod(urls.urlUpdateSiod, {
        idsolicitud: idCenActual,
        limpiarFechaFin: true
      });
      return;
    }

    if (estadoInicial === 'Vigente' && estadoNuevo === 'Finalizada') {
      const finIso = NormalizarIso(actual.fechaFinIso);
      if (!finIso) {
        return;
      }

      if (IdCenCambio(snapshot, actual)) {
        await ReemplazarSolicitudEnSiodPorCambioIdCen(urls, snapshot.idCen.trim(), () =>
          InsertarSolicitudFinalizadaEnSiod(urls.urlInsertSiod, {
            idsolicitud: idCenActual,
            idCentral: resolverIdCentral(actual.centralId),
            descripcion: actual.descripcion.trim(),
            fechainicio: actual.fechaInicioIso,
            fechaFin: finIso
          })
        );
        return;
      }

      const parciales = ConstruirParcialesUpdate(snapshot, actual, resolverIdCentral);
      await ActualizarSolicitudEnSiod(urls.urlUpdateSiod, {
        idsolicitud: idCenActual,
        ...parciales,
        fechaFin: finIso
      });
      return;
    }

    if (estadoInicial === 'Vigente' && estadoNuevo === 'Vigente') {
      if (IdCenCambio(snapshot, actual)) {
        await ReemplazarSolicitudEnSiodPorCambioIdCen(urls, snapshot.idCen.trim(), () =>
          InsertarSolicitudVigenteEnSiod(urls.urlInsertSiod, {
            idsolicitud: idCenActual,
            idCentral: resolverIdCentral(actual.centralId),
            descripcion: actual.descripcion.trim(),
            fechainicio: actual.fechaInicioIso
          })
        );
        return;
      }

      const parciales = ConstruirParcialesUpdate(snapshot, actual, resolverIdCentral);
      if (!HayCambiosParciales(parciales)) {
        return;
      }

      await ActualizarSolicitudEnSiod(urls.urlUpdateSiod, {
        idsolicitud: idCenActual,
        ...parciales
      });
    }
  } catch {
    // Fire-and-forget: fallos al armar o enviar la orden SIOD no afectan el guardado en SharePoint.
  }
}

export function CrearResolverIdCentralDesdeCentrales(
  centrales: ReadonlyArray<{ id: number; central: string; codigoSiod: string }>
): ResolverIdCentralSiod {
  return (centralId: number): number => {
    const central = centrales.find((c) => c.id === centralId);
    if (!central) {
      throw new Error('No se encontró la central seleccionada para obtener el código SIOD.');
    }
    return ParsearIdCentralDesdeCodigoSiod(central.codigoSiod, central.central);
  };
}
