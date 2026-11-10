import { useEffect, useState } from 'react';
import type { WebPartContext } from '@microsoft/sp-webpart-base';
import { ObtenerCapacidadInstaladaMeteologicaMw } from '../../../../../../services/sharepoint/operadorRenovable/CapacidadCentralApiServicio';
import { ObtenerFacilityIdMeteologicaCentral } from '../../../../../../services/sharepoint/operadorRenovable/InstalacionesOperadorRenovableServicio';

export type CapacidadMeteologicaCentral =
  | { estado: 'sinCentral' | 'cargando' | 'sinFacilityId' | 'noDisponible' }
  | { estado: 'listo'; capacidadMw: number };

/** Capacidad instalada en Meteológica de la central filtrada (undefined = sin filtro de central). */
export function UseCapacidadMeteologicaCentral(
  context: WebPartContext,
  centralId: number | undefined
): CapacidadMeteologicaCentral {
  const [resultado, setResultado] = useState<CapacidadMeteologicaCentral>({ estado: 'sinCentral' });

  useEffect(() => {
    if (centralId === undefined) {
      setResultado({ estado: 'sinCentral' });
      return;
    }
    let vigente = true;
    setResultado({ estado: 'cargando' });

    const Cargar = async (): Promise<CapacidadMeteologicaCentral> => {
      const facilityId = await ObtenerFacilityIdMeteologicaCentral(context, centralId);
      if (!facilityId) {
        return { estado: 'sinFacilityId' };
      }
      const capacidadMw = await ObtenerCapacidadInstaladaMeteologicaMw(facilityId);
      return capacidadMw === undefined ? { estado: 'noDisponible' } : { estado: 'listo', capacidadMw };
    };

    Cargar()
      .catch((): CapacidadMeteologicaCentral => ({ estado: 'noDisponible' }))
      .then((valor) => {
        if (vigente) {
          setResultado(valor);
        }
      })
      .catch(() => undefined);

    return () => {
      vigente = false;
    };
  }, [context, centralId]);

  return resultado;
}
