import type { NodoMenu } from '../../models/NodoMenu';
import type { RegistroSistemaAccesoNormalizado } from '../../models/SistemaAcceso';
import { ConstruirRutaHashDesdeSegmentos, ObtenerSegmentosHashKeyAncestros } from './ConstruirRutaHashAcumulada';
import { NormalizarIconoMenu } from './NormalizarIconoMenu';

function OrdenarHermanos(registros: RegistroSistemaAccesoNormalizado[]): RegistroSistemaAccesoNormalizado[] {
  return [...registros].sort((a, b) => a.orden - b.orden || a.id - b.id);
}

function ConstruirNodo(
  registro: RegistroSistemaAccesoNormalizado,
  mapaPorId: ReadonlyMap<number, RegistroSistemaAccesoNormalizado>,
  hijosPorPadre: ReadonlyMap<number | undefined, RegistroSistemaAccesoNormalizado[]>
): NodoMenu {
  const id = String(registro.id);
  const icono = NormalizarIconoMenu(registro.icono);
  const etiqueta = registro.hashTitle || registro.hashKey || id;

  if (registro.tipo === 'Header') {
    const hijosRegistro = OrdenarHermanos(hijosPorPadre.get(registro.id) ?? []);
    return {
      tipo: 'grupo',
      id,
      etiqueta,
      icono,
      hijos: hijosRegistro.map((hijo) => ConstruirNodo(hijo, mapaPorId, hijosPorPadre))
    };
  }

  if (registro.tipo === 'ExternalLink') {
    return {
      tipo: 'enlace-externo',
      id,
      etiqueta,
      icono,
      url: registro.hashKey
    };
  }

  const segmentos = ObtenerSegmentosHashKeyAncestros(registro, mapaPorId);
  const rutaHash = ConstruirRutaHashDesdeSegmentos(segmentos);

  return {
    tipo: 'enlace',
    id,
    etiqueta,
    icono,
    rutaHash
  };
}

export function ConstruirArbolMenu(registrosVisibles: RegistroSistemaAccesoNormalizado[]): NodoMenu[] {
  const mapaPorId = new Map(registrosVisibles.map((registro) => [registro.id, registro]));
  const hijosPorPadre = new Map<number | undefined, RegistroSistemaAccesoNormalizado[]>();

  for (const registro of registrosVisibles) {
    const clavePadre = registro.padreId;
    const hermanos = hijosPorPadre.get(clavePadre);
    if (hermanos) {
      hermanos.push(registro);
    } else {
      hijosPorPadre.set(clavePadre, [registro]);
    }
  }

  const raicesDirectas = OrdenarHermanos(hijosPorPadre.get(undefined) ?? []);
  const raicesHuerfanas = OrdenarHermanos(
    registrosVisibles.filter(
      (registro) => registro.padreId !== undefined && !mapaPorId.has(registro.padreId)
    )
  );

  const idsRaiz = new Set<number>();
  const raices: RegistroSistemaAccesoNormalizado[] = [];

  for (const registro of [...raicesDirectas, ...raicesHuerfanas]) {
    if (!idsRaiz.has(registro.id)) {
      idsRaiz.add(registro.id);
      raices.push(registro);
    }
  }

  return raices.map((raiz) => ConstruirNodo(raiz, mapaPorId, hijosPorPadre));
}
