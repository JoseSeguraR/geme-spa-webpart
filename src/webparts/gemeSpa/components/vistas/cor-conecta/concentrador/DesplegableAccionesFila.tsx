import * as React from 'react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type ModoAccionesFilaSolicitudesIl = 'completo' | 'solo-ver-bitacora';

export type DesplegableAccionesFilaProps = {
  idRegistro: number;
  modoAcciones?: ModoAccionesFilaSolicitudesIl;
  onVer: (idRegistro: number) => void;
  onBitacora: (idRegistro: number) => void;
  onClonar?: (idRegistro: number) => void;
  onGestionar?: (idRegistro: number) => void;
};

type PosicionMenu = {
  superior: number;
  izquierda: number;
};

/** Separación entre el botón de fila y el borde izquierdo del menú (px). */
const DesplazamientoHorizontalMenuPx = 6;

const EventoAbrirMenuAccionesFila = 'cowork-desplegable-acciones-fila-abrir';

type DetalleEventoAbrirMenuAccionesFila = {
  idRegistro: number;
};

function NotificarAperturaMenuAccionesFila(idRegistro: number): void {
  document.dispatchEvent(
    new CustomEvent<DetalleEventoAbrirMenuAccionesFila>(EventoAbrirMenuAccionesFila, {
      detail: { idRegistro }
    })
  );
}

export default function DesplegableAccionesFila(props: DesplegableAccionesFilaProps): React.ReactElement {
  const { idRegistro, modoAcciones = 'completo', onVer, onClonar, onBitacora, onGestionar } = props;
  const accionesCompletas = modoAcciones === 'completo';
  const [abierto, setAbierto] = useState(false);
  const [posicionMenu, setPosicionMenu] = useState<PosicionMenu | null>(null);
  const [contenedorPortal, setContenedorPortal] = useState<HTMLElement | null>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const disparadorRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const ActualizarPosicionMenu = useCallback((): void => {
    if (!disparadorRef.current) {
      return;
    }
    const rect = disparadorRef.current.getBoundingClientRect();
    setPosicionMenu({
      superior: rect.bottom,
      izquierda: rect.right + DesplazamientoHorizontalMenuPx
    });
  }, []);

  useLayoutEffect(() => {
    if (!abierto) {
      setPosicionMenu(null);
      setContenedorPortal(null);
      return undefined;
    }

    const contenedorSpa = disparadorRef.current?.closest('.gemeSpaBootstrap');
    setContenedorPortal(contenedorSpa instanceof HTMLElement ? contenedorSpa : document.body);
    ActualizarPosicionMenu();
    window.addEventListener('resize', ActualizarPosicionMenu);
    window.addEventListener('scroll', ActualizarPosicionMenu, true);
    return () => {
      window.removeEventListener('resize', ActualizarPosicionMenu);
      window.removeEventListener('scroll', ActualizarPosicionMenu, true);
    };
  }, [abierto, ActualizarPosicionMenu]);

  useEffect(() => {
    if (!abierto) {
      return undefined;
    }

    let removerListeners: (() => void) | undefined;

    const idRetardo = window.setTimeout(() => {
      const CerrarSiClickFuera = (evento: MouseEvent): void => {
        const objetivo = evento.target as Node;
        if (contenedorRef.current?.contains(objetivo) || menuRef.current?.contains(objetivo)) {
          return;
        }
        setAbierto(false);
      };

      const CerrarConEscape = (evento: KeyboardEvent): void => {
        if (evento.key === 'Escape') {
          setAbierto(false);
        }
      };

      document.addEventListener('mousedown', CerrarSiClickFuera);
      document.addEventListener('keydown', CerrarConEscape);
      removerListeners = () => {
        document.removeEventListener('mousedown', CerrarSiClickFuera);
        document.removeEventListener('keydown', CerrarConEscape);
      };
    }, 0);

    return () => {
      window.clearTimeout(idRetardo);
      removerListeners?.();
    };
  }, [abierto]);

  useEffect(() => {
    const CerrarSiOtroMenuSeAbre = (evento: Event): void => {
      const personalizado = evento as CustomEvent<DetalleEventoAbrirMenuAccionesFila>;
      const idAbierto = personalizado.detail?.idRegistro;
      if (idAbierto !== undefined && idAbierto !== idRegistro) {
        setAbierto(false);
      }
    };

    document.addEventListener(EventoAbrirMenuAccionesFila, CerrarSiOtroMenuSeAbre);
    return () => {
      document.removeEventListener(EventoAbrirMenuAccionesFila, CerrarSiOtroMenuSeAbre);
    };
  }, [idRegistro]);

  const AlternarMenu = (evento: React.MouseEvent<HTMLButtonElement>): void => {
    evento.stopPropagation();
    evento.preventDefault();
    setAbierto((estabaAbierto) => {
      if (estabaAbierto) {
        return false;
      }
      NotificarAperturaMenuAccionesFila(idRegistro);
      return true;
    });
  };

  const menuPortal =
    abierto && posicionMenu && contenedorPortal
      ? createPortal(
          <ul
            ref={menuRef}
            className="dropdown-menu show cowork-desplegable-acciones__menu"
            role="menu"
            style={{
              position: 'fixed',
              top: `${posicionMenu.superior}px`,
              left: `${posicionMenu.izquierda}px`
            }}
          >
            <li role="none">
              <button
                type="button"
                className="dropdown-item d-flex align-items-center"
                role="menuitem"
                onClick={() => {
                  setAbierto(false);
                  onVer(idRegistro);
                }}
              >
                <i className="bi bi-eye text-primary me-2" aria-hidden="true" />
                Ver
              </button>
            </li>
            {accionesCompletas && onClonar ? (
              <li role="none">
                <button
                  type="button"
                  className="dropdown-item d-flex align-items-center"
                  role="menuitem"
                  onClick={() => {
                    setAbierto(false);
                    onClonar(idRegistro);
                  }}
                >
                  <i className="bi bi-pencil-square text-warning me-2" aria-hidden="true" />
                  Clonar
                </button>
              </li>
            ) : null}
            <li role="none">
              <button
                type="button"
                className="dropdown-item d-flex align-items-center"
                role="menuitem"
                onClick={() => {
                  setAbierto(false);
                  onBitacora(idRegistro);
                }}
              >
                <i className="bi bi-clipboard-check text-success me-2" aria-hidden="true" />
                Bitácora
              </button>
            </li>
            {accionesCompletas && onGestionar ? (
              <li role="none">
                <button
                  type="button"
                  className="dropdown-item d-flex align-items-center"
                  role="menuitem"
                  onClick={() => {
                    setAbierto(false);
                    onGestionar(idRegistro);
                  }}
                >
                  <i className="bi bi-arrow-right-circle-fill text-danger me-2" aria-hidden="true" />
                  Gestionar
                </button>
              </li>
            ) : null}
          </ul>,
          contenedorPortal
        )
      : null;

  return (
    <div className="dropdown cowork-desplegable-acciones" ref={contenedorRef}>
      <button
        type="button"
        ref={disparadorRef}
        className="btn btn-sm btn-outline-secondary dropdown-toggle cowork-desplegable-acciones__disparador"
        onClick={AlternarMenu}
        onMouseDown={(evento) => evento.stopPropagation()}
        aria-expanded={abierto}
        aria-haspopup="menu"
        aria-label={`Acciones solicitud ${idRegistro}`}
      />
      {menuPortal}
    </div>
  );
}
