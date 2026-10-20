import * as React from 'react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { NodoMenu } from '../../models/NodoMenu';
import { EsNodoMenuEnlaceExterno, EsNodoMenuEnlaceInterno, EsNodoMenuGrupo } from '../../models/NodoMenu';
import {
  ObtenerGrupoPrimerNivelParaRuta,
  ObtenerGruposAncestrosParaRuta,
  RutaPerteneceASubarbolMenu
} from '../../utils/MenuNavegacion';
import { EsNodoPrimerNivelActivo, ObtenerClaseIconoMenu } from '../../utils/MenuIconos';
import { ObtenerAtributosEnlaceExternoMenu } from '../../utils/EnlaceExternoMenu';
import { EsEnlaceMenuActivoParaRuta } from '../../utils/MenuRutaActiva';
import { ConstruirHashDesdeRuta } from '../../utils/NavegacionHash';

export type MenuArbolProps = {
  nodos: NodoMenu[];
  rutaActual: string;
  colapsada: boolean;
  urlColeccionSitio: string;
  onNavegar?: () => void;
};

type PosicionFlyout = {
  superior: number;
  izquierda: number;
};

const MargenFlyoutVista = 8;
const AnchoFlyoutEstimadoPx = 240;

function CalcularPosicionFlyout(disparador: HTMLElement): PosicionFlyout {
  const rect = disparador.getBoundingClientRect();
  let izquierda = rect.right + MargenFlyoutVista;

  if (izquierda + AnchoFlyoutEstimadoPx > window.innerWidth - MargenFlyoutVista) {
    izquierda = Math.max(MargenFlyoutVista, rect.left - AnchoFlyoutEstimadoPx - MargenFlyoutVista);
  }

  let superior = rect.top;
  const altoMaximoFlyout = Math.min(384, window.innerHeight - MargenFlyoutVista * 2);

  if (superior + altoMaximoFlyout > window.innerHeight - MargenFlyoutVista) {
    superior = Math.max(MargenFlyoutVista, window.innerHeight - altoMaximoFlyout - MargenFlyoutVista);
  }

  return { superior, izquierda };
}

type MenuArbolNodoProps = {
  nodo: NodoMenu;
  nivel: number;
  rutaActual: string;
  urlColeccionSitio: string;
  gruposExpandidos: Set<string>;
  onAlternarGrupo: (idGrupo: string) => void;
  onAbrirContextoGrupoRaiz?: (idGrupo: string) => void;
  onNavegar?: () => void;
};

function MenuArbolNodo(props: MenuArbolNodoProps): React.ReactElement {
  const {
    nodo,
    nivel,
    rutaActual,
    urlColeccionSitio,
    gruposExpandidos,
    onAlternarGrupo,
    onAbrirContextoGrupoRaiz,
    onNavegar
  } = props;

  if (EsNodoMenuGrupo(nodo)) {
    const abrirContextoRaiz = nivel === 1 && onAbrirContextoGrupoRaiz !== undefined;

    if (abrirContextoRaiz) {
      return (
        <li className={`cowork-menu-arbol__item cowork-menu-arbol__item--nivel-${nivel}`}>
          <button
            type="button"
            className="cowork-menu-arbol__grupo cowork-menu-arbol__grupo--entrada-contexto"
            onClick={() => onAbrirContextoGrupoRaiz(nodo.id)}
            aria-haspopup="menu"
          >
            <i className={`${ObtenerClaseIconoMenu(nodo)} cowork-menu-arbol__icono-modulo-raiz`} aria-hidden="true" />
            <span className="cowork-menu-arbol__etiqueta">{nodo.etiqueta}</span>
            <i className="bi bi-chevron-right cowork-menu-arbol__icono cowork-menu-arbol__icono--fin" aria-hidden="true" />
          </button>
        </li>
      );
    }

    const expandido = gruposExpandidos.has(nodo.id);
    const contieneRutaActiva = RutaPerteneceASubarbolMenu(nodo, rutaActual);

    return (
      <li className={`cowork-menu-arbol__item cowork-menu-arbol__item--nivel-${nivel}`}>
        <button
          type="button"
          className={`cowork-menu-arbol__grupo ${contieneRutaActiva ? 'cowork-menu-arbol__grupo--contiene-activo' : ''}`}
          onClick={() => onAlternarGrupo(nodo.id)}
          aria-expanded={expandido}
        >
          <i
            className={`bi ${expandido ? 'bi-chevron-down' : 'bi-chevron-right'} cowork-menu-arbol__icono`}
            aria-hidden="true"
          />
          <span className="cowork-menu-arbol__etiqueta">{nodo.etiqueta}</span>
        </button>
        {expandido ? (
          <ul className="cowork-menu-arbol__lista cowork-menu-arbol__lista--anidada">
            {nodo.hijos.map((hijo) => (
              <MenuArbolNodo
                key={hijo.id}
                nodo={hijo}
                nivel={nivel + 1}
                rutaActual={rutaActual}
                urlColeccionSitio={urlColeccionSitio}
                gruposExpandidos={gruposExpandidos}
                onAlternarGrupo={onAlternarGrupo}
                onNavegar={onNavegar}
              />
            ))}
          </ul>
        ) : null}
      </li>
    );
  }

  if (EsNodoMenuEnlaceExterno(nodo)) {
    const atributosEnlace = ObtenerAtributosEnlaceExternoMenu(nodo.url, urlColeccionSitio);
    const iconoModuloRaiz = nivel === 1 && onAbrirContextoGrupoRaiz !== undefined;

    return (
      <li className={`cowork-menu-arbol__item cowork-menu-arbol__item--nivel-${nivel}`}>
        <a
          className="cowork-menu-arbol__enlace"
          href={atributosEnlace.href}
          target={atributosEnlace.target}
          rel={atributosEnlace.rel}
          onClick={onNavegar}
        >
          {iconoModuloRaiz ? (
            <i
              className={`${ObtenerClaseIconoMenu(nodo)} cowork-menu-arbol__icono-modulo-raiz`}
              aria-hidden="true"
            />
          ) : null}
          <span className="cowork-menu-arbol__etiqueta">{nodo.etiqueta}</span>
        </a>
      </li>
    );
  }

  if (!EsNodoMenuEnlaceInterno(nodo)) {
    return <li className={`cowork-menu-arbol__item cowork-menu-arbol__item--nivel-${nivel}`} />;
  }

  const activo = EsEnlaceMenuActivoParaRuta(nodo.rutaHash, rutaActual);

  return (
    <li className={`cowork-menu-arbol__item cowork-menu-arbol__item--nivel-${nivel}`}>
      <a
        className={`cowork-menu-arbol__enlace ${activo ? 'cowork-menu-arbol__enlace--activo' : ''}`}
        href={ConstruirHashDesdeRuta(nodo.rutaHash)}
        aria-current={activo ? 'page' : undefined}
        onClick={onNavegar}
      >
        <span className="cowork-menu-arbol__etiqueta">{nodo.etiqueta}</span>
      </a>
    </li>
  );
}

export default function MenuArbol(props: MenuArbolProps): React.ReactElement {
  const { nodos, rutaActual, colapsada, urlColeccionSitio, onNavegar } = props;
  const [gruposExpandidosManual, setGruposExpandidosManual] = useState<Set<string>>(() => new Set());
  const [preferirMenuRaiz, setPreferirMenuRaiz] = useState(false);
  const [grupoContextoManualId, setGrupoContextoManualId] = useState<string | null>(null);
  const [flyoutGrupoId, setFlyoutGrupoId] = useState<string | null>(null);
  const [flyoutPosicion, setFlyoutPosicion] = useState<PosicionFlyout | null>(null);
  const contenedorRailRef = useRef<HTMLElement>(null);
  const disparadorFlyoutRef = useRef<HTMLButtonElement | null>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);

  const nodoFlyoutGrupo = useMemo(() => {
    if (!flyoutGrupoId) {
      return undefined;
    }

    const candidato = nodos.find((n) => n.id === flyoutGrupoId);
    return candidato && EsNodoMenuGrupo(candidato) ? candidato : undefined;
  }, [flyoutGrupoId, nodos]);

  const grupoContextoPorRuta = useMemo(
    () => ObtenerGrupoPrimerNivelParaRuta(nodos, rutaActual),
    [nodos, rutaActual]
  );

  const grupoContextoManual = useMemo(() => {
    if (!grupoContextoManualId) {
      return undefined;
    }

    const candidato = nodos.find((n) => n.id === grupoContextoManualId);
    return candidato && EsNodoMenuGrupo(candidato) ? candidato : undefined;
  }, [grupoContextoManualId, nodos]);

  const grupoContextoActivo = useMemo(() => {
    // Tras «Volver» la ruta puede seguir en el módulo anterior; el contexto elegido en raíz prevalece hasta navegar.
    if (grupoContextoManual) {
      return grupoContextoManual;
    }

    if (!preferirMenuRaiz && grupoContextoPorRuta) {
      return grupoContextoPorRuta;
    }

    return undefined;
  }, [preferirMenuRaiz, grupoContextoPorRuta, grupoContextoManual]);

  const modoContextoMenuExpandido = !colapsada && grupoContextoActivo !== undefined;

  const nodosMenuExpandido = modoContextoMenuExpandido ? grupoContextoActivo.hijos : nodos;

  const gruposPorRuta = useMemo(() => {
    const expandidos = ObtenerGruposAncestrosParaRuta(nodosMenuExpandido, rutaActual);

    if (colapsada && grupoContextoPorRuta) {
      ObtenerGruposAncestrosParaRuta(grupoContextoPorRuta.hijos, rutaActual).forEach((id) => expandidos.add(id));
    }

    return expandidos;
  }, [colapsada, grupoContextoPorRuta, nodosMenuExpandido, rutaActual]);

  useEffect(() => {
    setPreferirMenuRaiz(false);
    setGrupoContextoManualId(null);
  }, [rutaActual]);

  useEffect(() => {
    setGruposExpandidosManual((previo) => {
      const combinado = new Set(previo);
      gruposPorRuta.forEach((id) => combinado.add(id));
      return combinado;
    });
  }, [gruposPorRuta]);

  useEffect(() => {
    setFlyoutGrupoId(null);
    setFlyoutPosicion(null);
  }, [rutaActual, colapsada]);

  useLayoutEffect(() => {
    if (!flyoutGrupoId || !disparadorFlyoutRef.current) {
      setFlyoutPosicion(null);
      return undefined;
    }

    const ActualizarPosicion = (): void => {
      if (!disparadorFlyoutRef.current) {
        return;
      }
      setFlyoutPosicion(CalcularPosicionFlyout(disparadorFlyoutRef.current));
    };

    ActualizarPosicion();
    window.addEventListener('resize', ActualizarPosicion);
    window.addEventListener('scroll', ActualizarPosicion, true);
    return () => {
      window.removeEventListener('resize', ActualizarPosicion);
      window.removeEventListener('scroll', ActualizarPosicion, true);
    };
  }, [flyoutGrupoId]);

  useEffect(() => {
    if (!flyoutGrupoId) {
      return undefined;
    }

    const CerrarConEscape = (evento: KeyboardEvent): void => {
      if (evento.key === 'Escape') {
        setFlyoutGrupoId(null);
      }
    };

    const CerrarSiClickFuera = (evento: MouseEvent): void => {
      const objetivo = evento.target as Node;
      if (contenedorRailRef.current?.contains(objetivo)) {
        return;
      }
      if (flyoutRef.current?.contains(objetivo)) {
        return;
      }
      setFlyoutGrupoId(null);
    };

    document.addEventListener('keydown', CerrarConEscape);
    document.addEventListener('mousedown', CerrarSiClickFuera);
    return () => {
      document.removeEventListener('keydown', CerrarConEscape);
      document.removeEventListener('mousedown', CerrarSiClickFuera);
    };
  }, [flyoutGrupoId]);

  const VolverAMenuRaiz = useCallback((): void => {
    setPreferirMenuRaiz(true);
    setGrupoContextoManualId(null);
  }, []);

  const AbrirContextoGrupoRaiz = useCallback(
    (idGrupo: string): void => {
      const nodoGrupo = nodos.find((n) => n.id === idGrupo);
      if (nodoGrupo && EsNodoMenuGrupo(nodoGrupo)) {
        const expandidosEnSubarbol = ObtenerGruposAncestrosParaRuta(nodoGrupo.hijos, rutaActual);
        setGruposExpandidosManual((previo) => {
          const combinado = new Set(previo);
          expandidosEnSubarbol.forEach((id) => combinado.add(id));
          return combinado;
        });
      }

      setPreferirMenuRaiz(false);
      setGrupoContextoManualId(idGrupo);
    },
    [nodos, rutaActual]
  );

  const AlternarGrupo = (idGrupo: string): void => {
    setGruposExpandidosManual((previo) => {
      const siguiente = new Set(previo);
      if (siguiente.has(idGrupo)) {
        siguiente.delete(idGrupo);
      } else {
        siguiente.add(idGrupo);
      }
      return siguiente;
    });
  };

  const NavegarDesdeFlyout = useCallback((): void => {
    setFlyoutGrupoId(null);
    onNavegar?.();
  }, [onNavegar]);

  const AlternarFlyoutGrupo = (nodo: NodoMenu): void => {
    if (!EsNodoMenuGrupo(nodo)) {
      return;
    }

    if (flyoutGrupoId === nodo.id) {
      setFlyoutGrupoId(null);
      return;
    }

    const expandidosEnSubarbol = ObtenerGruposAncestrosParaRuta(nodo.hijos, rutaActual);
    setGruposExpandidosManual((previo) => {
      const combinado = new Set(previo);
      expandidosEnSubarbol.forEach((id) => combinado.add(id));
      return combinado;
    });
    setFlyoutGrupoId(nodo.id);
  };

  return (
    <>
      {colapsada ? (
        <nav
          ref={contenedorRailRef}
          className="cowork-menu-arbol cowork-menu-arbol--rail-escritorio"
          aria-label="Accesos rápidos del menú"
        >
          <ul className="cowork-menu-arbol__lista cowork-menu-arbol__lista--rail">
            {nodos.map((nodo) => {
              const activo = EsNodoPrimerNivelActivo(nodo, rutaActual);
              const claseIcono = `cowork-menu-arbol__icono-principal ${activo ? 'cowork-menu-arbol__icono-principal--activo' : ''}`;

              if (EsNodoMenuGrupo(nodo)) {
                const flyoutAbierto = flyoutGrupoId === nodo.id;

                return (
                  <li key={nodo.id} className="cowork-menu-arbol__item cowork-menu-arbol__item--rail">
                    <button
                      type="button"
                      className={claseIcono}
                      ref={(elemento) => {
                        if (flyoutAbierto) {
                          disparadorFlyoutRef.current = elemento;
                        }
                      }}
                      onClick={() => AlternarFlyoutGrupo(nodo)}
                      aria-expanded={flyoutAbierto}
                      aria-haspopup="menu"
                      aria-controls={flyoutAbierto ? `cowork-menu-flyout-${nodo.id}` : undefined}
                      aria-label={nodo.etiqueta}
                    >
                      <i className={ObtenerClaseIconoMenu(nodo)} aria-hidden="true" />
                    </button>
                  </li>
                );
              }

              if (EsNodoMenuEnlaceExterno(nodo)) {
                const atributosEnlace = ObtenerAtributosEnlaceExternoMenu(nodo.url, urlColeccionSitio);

                return (
                  <li key={nodo.id} className="cowork-menu-arbol__item cowork-menu-arbol__item--rail">
                    <a
                      className={claseIcono}
                      href={atributosEnlace.href}
                      target={atributosEnlace.target}
                      rel={atributosEnlace.rel}
                      aria-label={nodo.etiqueta}
                      onClick={onNavegar}
                    >
                      <i className={ObtenerClaseIconoMenu(nodo)} aria-hidden="true" />
                    </a>
                  </li>
                );
              }

              if (!EsNodoMenuEnlaceInterno(nodo)) {
                return null;
              }

              return (
                <li key={nodo.id} className="cowork-menu-arbol__item cowork-menu-arbol__item--rail">
                  <a
                    className={claseIcono}
                    href={ConstruirHashDesdeRuta(nodo.rutaHash)}
                    aria-current={activo ? 'page' : undefined}
                    aria-label={nodo.etiqueta}
                    onClick={onNavegar}
                  >
                    <i className={ObtenerClaseIconoMenu(nodo)} aria-hidden="true" />
                  </a>
                </li>
              );
            })}
          </ul>
          {nodoFlyoutGrupo && flyoutPosicion ? (
            <div
              ref={flyoutRef}
              id={`cowork-menu-flyout-${nodoFlyoutGrupo.id}`}
              className="cowork-menu-flyout"
              role="menu"
              aria-labelledby={`cowork-menu-flyout-titulo-${nodoFlyoutGrupo.id}`}
              style={{
                top: `${flyoutPosicion.superior}px`,
                left: `${flyoutPosicion.izquierda}px`
              }}
            >
              <div
                id={`cowork-menu-flyout-titulo-${nodoFlyoutGrupo.id}`}
                className="cowork-menu-contexto__modulo cowork-menu-flyout__modulo"
              >
                <span className="cowork-menu-contexto__icono-modulo" aria-hidden="true">
                  <i className={ObtenerClaseIconoMenu(nodoFlyoutGrupo)} />
                </span>
                <p className="cowork-menu-contexto__titulo">{nodoFlyoutGrupo.etiqueta}</p>
              </div>
              <ul className="cowork-menu-arbol__lista cowork-menu-arbol__lista--flyout">
                {nodoFlyoutGrupo.hijos.map((hijo) => (
                  <MenuArbolNodo
                    key={hijo.id}
                    nodo={hijo}
                    nivel={1}
                    rutaActual={rutaActual}
                    urlColeccionSitio={urlColeccionSitio}
                    gruposExpandidos={gruposExpandidosManual}
                    onAlternarGrupo={AlternarGrupo}
                    onNavegar={NavegarDesdeFlyout}
                  />
                ))}
              </ul>
            </div>
          ) : null}
        </nav>
      ) : null}
      <nav
        className={`cowork-menu-arbol cowork-menu-arbol--expandido ${colapsada ? 'cowork-menu-arbol--expandido-en-sidebar-colapsado' : ''}`}
        aria-label={modoContextoMenuExpandido ? `Menú · ${grupoContextoActivo.etiqueta}` : 'Menú de aplicación'}
      >
        {modoContextoMenuExpandido ? (
          <header className="cowork-menu-contexto">
            <button type="button" className="cowork-menu-contexto__volver" onClick={VolverAMenuRaiz}>
              <i className="bi bi-chevron-double-left cowork-menu-contexto__icono-volver" aria-hidden="true" />
              Volver
            </button>
            <div className="cowork-menu-contexto__modulo">
              <span className="cowork-menu-contexto__icono-modulo" aria-hidden="true">
                <i className={ObtenerClaseIconoMenu(grupoContextoActivo)} />
              </span>
              <p className="cowork-menu-contexto__titulo">{grupoContextoActivo.etiqueta}</p>
            </div>
          </header>
        ) : null}
        <ul className="cowork-menu-arbol__lista">
          {nodosMenuExpandido.map((nodo) => (
            <MenuArbolNodo
              key={nodo.id}
              nodo={nodo}
              nivel={1}
              rutaActual={rutaActual}
              urlColeccionSitio={urlColeccionSitio}
              gruposExpandidos={gruposExpandidosManual}
              onAlternarGrupo={AlternarGrupo}
              onAbrirContextoGrupoRaiz={modoContextoMenuExpandido ? undefined : AbrirContextoGrupoRaiz}
              onNavegar={onNavegar}
            />
          ))}
        </ul>
      </nav>
    </>
  );
}
