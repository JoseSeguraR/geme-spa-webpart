import type { WebPartContext } from '@microsoft/sp-webpart-base';
import { useEffect, useState } from 'react';
import type { ResultadoInicializacionMenu } from '../models/ResultadoInicializacionMenu';
import { InicializarMenuAplicacion } from '../services/menu/InicializarMenuAplicacion';

export type EstadoCargaMenu = 'cargando' | 'listo' | 'error';

export type UseMenuInicializadoResultado = {
  estado: EstadoCargaMenu;
  menu: ResultadoInicializacionMenu | undefined;
  error: Error | undefined;
};

export function UseMenuInicializado(context: WebPartContext): UseMenuInicializadoResultado {
  const [estado, setEstado] = useState<EstadoCargaMenu>('cargando');
  const [menu, setMenu] = useState<ResultadoInicializacionMenu | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);

  const siteId = context.pageContext.site.id.toString();
  const loginUsuario = context.pageContext.user.loginName;

  useEffect(() => {
    let cancelado = false;

    setEstado('cargando');
    setError(undefined);

    InicializarMenuAplicacion({ context })
      .then((resultado) => {
        if (cancelado) {
          return;
        }
        setMenu(resultado);
        setEstado('listo');
      })
      .catch((err: unknown) => {
        if (cancelado) {
          return;
        }
        const errorNormalizado = err instanceof Error ? err : new Error('No se pudo inicializar el menú.');
        console.error(errorNormalizado);
        setError(errorNormalizado);
        setEstado('error');
      });

    return () => {
      cancelado = true;
    };
  }, [context, siteId, loginUsuario]);

  return { estado, menu, error };
}
