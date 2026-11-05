import * as React from 'react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { AccionMenuFilaGrilla } from './accionesGrillaConcentrador';

export type DesplegableAccionesFilaGrillaProps = {
  idRegistro: string | number;
  acciones: AccionMenuFilaGrilla[];
  etiquetaAria?: string;
};

type PosicionMenu = {
  superior: number;
  izquierda: number;
};

const DesplazamientoHorizontalMenuPx = 6;
const EventoAbrirMenuAccionesGrilla = 'cowork-desplegable-acciones-grilla-abrir';

type DetalleEventoAbrirMenu = {
  idRegistro: string | number;
};

function NotificarAperturaMenu(idRegistro: string | number): void {
  document.dispatchEvent(
    new CustomEvent<DetalleEventoAbrirMenu>(EventoAbrirMenuAccionesGrilla, {
      detail: { idRegistro }
    })
  );
}

export default function DesplegableAccionesFilaGrilla(
  props: DesplegableAccionesFilaGrillaProps
): React.ReactElement {
  const { idRegistro, acciones, etiquetaAria = `Acciones registro ${idRegistro}` } = props;
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
      const personalizado = evento as CustomEvent<DetalleEventoAbrirMenu>;
      const idAbierto = personalizado.detail?.idRegistro;
      if (idAbierto !== undefined && idAbierto !== idRegistro) {
        setAbierto(false);
      }
    };

    document.addEventListener(EventoAbrirMenuAccionesGrilla, CerrarSiOtroMenuSeAbre);
    return () => {
      document.removeEventListener(EventoAbrirMenuAccionesGrilla, CerrarSiOtroMenuSeAbre);
    };
  }, [idRegistro]);

  const AlternarMenu = (evento: React.MouseEvent<HTMLButtonElement>): void => {
    evento.stopPropagation();
    evento.preventDefault();
    setAbierto((estabaAbierto) => {
      if (estabaAbierto) {
        return false;
      }
      NotificarAperturaMenu(idRegistro);
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
            {acciones.map((accion) => (
              <li key={accion.id} role="none">
                <button
                  type="button"
                  className="dropdown-item d-flex align-items-center"
                  role="menuitem"
                  onClick={() => {
                    setAbierto(false);
                    accion.onEjecutar();
                  }}
                >
                  {accion.iconoBootstrap ? (
                    <i
                      className={`bi ${accion.iconoBootstrap} ${accion.claseIcono ?? ''} me-2`.trim()}
                      aria-hidden="true"
                    />
                  ) : null}
                  {accion.etiqueta}
                </button>
              </li>
            ))}
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
        aria-label={etiquetaAria}
      />
      {menuPortal}
    </div>
  );
}
