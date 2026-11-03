import { useEffect, useState } from 'react';
import { SuscribirRefrescoOperadorRenovable } from '../../../../../services/sharepoint/operadorRenovable/OperadorRenovableRefrescoGlobal';

/** Incrementa cuando otra pestaña del operador renovable actualiza disponibilidad o limitaciones. */
export function UseRefrescoOperadorRenovable(): number {
  const [token, setToken] = useState(0);

  useEffect(() => SuscribirRefrescoOperadorRenovable(setToken), []);

  return token;
}
